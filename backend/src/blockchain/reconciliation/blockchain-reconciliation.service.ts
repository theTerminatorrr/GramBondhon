import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/database.service';
import { BlockchainService } from '../blockchain.service';
import { ReconciliationDiscrepancy } from '../interfaces/blockchain.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BlockchainReconciliationService {
  private readonly logger = new Logger(BlockchainReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async reconcileInvestments(): Promise<ReconciliationDiscrepancy[]> {
    const discrepancies: ReconciliationDiscrepancy[] = [];

    try {
      const dbInvestments = await this.prisma.$queryRawUnsafe<{
        id: string;
        deal_id: string;
        investor_address: string;
        units: number;
        amount: string;
        status: string;
        blockchain_investment_id: string | null;
        blockchain_tx_hash: string | null;
      }[]>(
        `SELECT id, deal_id, investor_address, units, amount, status, blockchain_investment_id, blockchain_tx_hash
         FROM investments
         WHERE status IN ('CONFIRMED', 'PENDING') AND blockchain_investment_id IS NOT NULL`,
      );

      for (const investment of dbInvestments) {
        if (investment.blockchain_tx_hash) {
          const receipt = await this.blockchain.getTransactionReceipt(
            investment.blockchain_tx_hash as `0x${string}`,
          );

          if (!receipt) {
            discrepancies.push({
              id: `inv-${investment.id}-no-receipt`,
              type: 'INVESTMENT',
              description: `Investment ${investment.id} has tx hash ${investment.blockchain_tx_hash} but no on-chain receipt found`,
              dbValue: investment.status,
              chainValue: 'NOT_FOUND',
              dealId: investment.deal_id,
              investmentId: investment.id,
              txHash: investment.blockchain_tx_hash,
              severity: 'HIGH',
              autoFixable: false,
              detectedAt: new Date(),
              resolvedAt: null,
            });
          } else if (receipt.status === 'reverted' && investment.status === 'CONFIRMED') {
            discrepancies.push({
              id: `inv-${investment.id}-reverted`,
              type: 'TRANSACTION_STATUS',
              description: `Investment ${investment.id} is CONFIRMED in DB but tx was reverted on-chain`,
              dbValue: 'CONFIRMED',
              chainValue: 'REVERTED',
              dealId: investment.deal_id,
              investmentId: investment.id,
              txHash: investment.blockchain_tx_hash,
              severity: 'HIGH',
              autoFixable: true,
              detectedAt: new Date(),
              resolvedAt: null,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error('Investment reconciliation failed', error);
    }

    return discrepancies;
  }

  async reconcileEscrow(): Promise<ReconciliationDiscrepancy[]> {
    const discrepancies: ReconciliationDiscrepancy[] = [];

    try {
      const dbBalances = await this.prisma.$queryRawUnsafe<{
        deal_id: string;
        balance: string;
      }[]>(
        `SELECT deal_id, balance FROM escrow_balances`,
      );

      const chainBalance = await this.blockchain.getPublicClient().readContract({
        address: (process.env.ESCROW_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
        abi: [{ name: 'getBalance', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
        functionName: 'getBalance',
      });

      const totalDbBalance = dbBalances.reduce((sum, b) => sum + BigInt(b.balance), 0n);

      if (totalDbBalance !== chainBalance) {
        discrepancies.push({
          id: 'escrow-total-mismatch',
          type: 'ESCROW_BALANCE',
          description: `Total DB escrow balance (${totalDbBalance}) differs from chain balance (${chainBalance})`,
          dbValue: totalDbBalance.toString(),
          chainValue: chainBalance.toString(),
          dealId: null,
          investmentId: null,
          txHash: null,
          severity: 'MEDIUM',
          autoFixable: false,
          detectedAt: new Date(),
          resolvedAt: null,
        });
      }

      for (const dbBalance of dbBalances) {
        try {
          const chainDealBalance = await this.blockchain.getPublicClient().readContract({
            address: (process.env.ESCROW_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
            abi: [{ name: 'getDealBalance', type: 'function', inputs: [{ name: 'dealId', type: 'bytes32' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
            functionName: 'getDealBalance',
            args: [dbBalance.deal_id as `0x${string}`],
          });

          if (BigInt(dbBalance.balance) !== chainDealBalance) {
            discrepancies.push({
              id: `escrow-${dbBalance.deal_id}`,
              type: 'ESCROW_BALANCE',
              description: `Deal ${dbBalance.deal_id} escrow balance mismatch`,
              dbValue: dbBalance.balance,
              chainValue: chainDealBalance.toString(),
              dealId: dbBalance.deal_id,
              investmentId: null,
              txHash: null,
              severity: 'MEDIUM',
              autoFixable: false,
              detectedAt: new Date(),
              resolvedAt: null,
            });
          }
        } catch {
          this.logger.debug(`Could not read chain balance for deal ${dbBalance.deal_id}`);
        }
      }
    } catch (error) {
      this.logger.error('Escrow reconciliation failed', error);
    }

    return discrepancies;
  }

  async reconcileTransactions(): Promise<ReconciliationDiscrepancy[]> {
    const discrepancies: ReconciliationDiscrepancy[] = [];

    try {
      const pendingTx = await this.prisma.$queryRawUnsafe<{
        id: string;
        tx_hash: string;
        block_number: number;
        event_type: string;
      }[]>(
        `SELECT id, tx_hash, block_number, event_type
         FROM blockchain_events
         WHERE processed = false
         ORDER BY block_number ASC
         LIMIT 100`,
      );

      for (const tx of pendingTx) {
        const receipt = await this.blockchain.getTransactionReceipt(tx.tx_hash as `0x${string}`);

        if (receipt && receipt.status === 'success') {
          discrepancies.push({
            id: `tx-${tx.id}-confirmable`,
            type: 'TRANSACTION_STATUS',
            description: `Event ${tx.id} (type: ${tx.event_type}) has successful tx but is not yet processed`,
            dbValue: 'UNPROCESSED',
            chainValue: 'CONFIRMED',
            dealId: null,
            investmentId: null,
            txHash: tx.tx_hash,
            severity: 'LOW',
            autoFixable: true,
            detectedAt: new Date(),
            resolvedAt: null,
          });
        } else if (!receipt) {
          const currentBlock = await this.blockchain.getBlockNumber();
          if (currentBlock - BigInt(tx.block_number) > 20n) {
            discrepancies.push({
              id: `tx-${tx.id}-stale`,
              type: 'TRANSACTION_STATUS',
              description: `Event ${tx.id} references block ${tx.block_number} but tx not found after ${currentBlock} blocks`,
              dbValue: 'PENDING',
              chainValue: 'NOT_FOUND',
              dealId: null,
              investmentId: null,
              txHash: tx.tx_hash,
              severity: 'MEDIUM',
              autoFixable: false,
              detectedAt: new Date(),
              resolvedAt: null,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error('Transaction reconciliation failed', error);
    }

    return discrepancies;
  }

  async getDiscrepancies(): Promise<ReconciliationDiscrepancy[]> {
    const [investmentDiscrepancies, escrowDiscrepancies, txDiscrepancies] = await Promise.all([
      this.reconcileInvestments(),
      this.reconcileEscrow(),
      this.reconcileTransactions(),
    ]);

    return [...investmentDiscrepancies, ...escrowDiscrepancies, ...txDiscrepancies];
  }

  async autoFix(discrepancyId: string): Promise<{ success: boolean; message: string }> {
    const allDiscrepancies = await this.getDiscrepancies();
    const discrepancy = allDiscrepancies.find((d) => d.id === discrepancyId);

    if (!discrepancy) {
      return { success: false, message: 'Discrepancy not found' };
    }

    if (!discrepancy.autoFixable) {
      return { success: false, message: 'This discrepancy cannot be auto-fixed' };
    }

    try {
      switch (discrepancy.type) {
        case 'INVESTMENT': {
          if (discrepancy.chainValue === 'REVERTED') {
            await this.prisma.$executeRawUnsafe(
              `UPDATE investments SET status = 'REFUNDED', updated_at = NOW() WHERE id = $1`,
              discrepancy.investmentId,
            );
            await this.prisma.$executeRawUnsafe(
              `UPDATE blockchain_events SET processed = true, processed_at = NOW() WHERE tx_hash = $1`,
              discrepancy.txHash,
            );
            this.eventEmitter.emit('reconciliation.auto-fix', {
              type: 'INVESTMENT_REVERT',
              investmentId: discrepancy.investmentId,
              txHash: discrepancy.txHash,
            });
            return { success: true, message: `Investment ${discrepancy.investmentId} marked as REFUNDED` };
          }
          break;
        }

        case 'TRANSACTION_STATUS': {
          if (discrepancy.chainValue === 'CONFIRMED' || discrepancy.chainValue === 'NOT_FOUND') {
            await this.prisma.$executeRawUnsafe(
              `UPDATE blockchain_events SET processed = true, processed_at = NOW() WHERE tx_hash = $1`,
              discrepancy.txHash,
            );
            return { success: true, message: `Event ${discrepancy.id} marked as processed` };
          }
          break;
        }

        default:
          return { success: false, message: `Auto-fix not implemented for type ${discrepancy.type}` };
      }

      return { success: false, message: 'No auto-fix action taken' };
    } catch (error) {
      this.logger.error(`Auto-fix failed for ${discrepancyId}`, error);
      return {
        success: false,
        message: `Auto-fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
