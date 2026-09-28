import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/database.service';

interface EscrowEvent {
  name: string;
  args: Record<string, unknown>;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  logIndex: number;
}

/**
 * Handles blockchain events emitted by the Escrow smart contract.
 * @contract contracts/src/Escrow.sol
 */
@Injectable()
export class EscrowHandler {
  private readonly logger = new Logger(EscrowHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handle(event: EscrowEvent) {
    switch (event.name) {
      case 'FundsDeposited':
        return this.handleFundsDeposited(event as any);
      case 'FundsReleased':
        return this.handleFundsReleased(event as any);
      case 'FundsRefunded':
        return this.handleFundsRefunded(event as any);
      case 'FeeDeducted':
        return this.handleFeeDeducted(event as any);
      default:
        this.logger.warn(`Unknown escrow event: ${event.name}`);
    }
  }

  private async handleFundsDeposited(event: {
    args: { dealId: `0x${string}`; investor: `0x${string}`; amount: bigint };
    transactionHash: `0x${string}`;
    blockNumber: bigint;
  }) {
    const { dealId, investor, amount } = event.args;
    const txHash = event.transactionHash;
    const blockNumber = Number(event.blockNumber);

    this.logger.log(`FundsDeposited: deal=${dealId}, investor=${investor}, amount=${amount}`);

    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO escrow_transactions (id, deal_id, tx_type, from_address, to_address, amount, tx_hash, block_number, created_at)
         VALUES ($1, $2, 'DEPOSIT', $3, 'escrow', $4, $5, $6, NOW())
         ON CONFLICT (id) DO NOTHING`,
        `deposit-${txHash}-${event.blockNumber}`,
        dealId,
        investor,
        amount.toString(),
        txHash,
        blockNumber,
      );

      await this._updateEscrowBalance(dealId, amount.toString(), 'ADD');

      await this.prisma.$executeRawUnsafe(
        `UPDATE investments SET blockchain_status = 'FUNDED'
         WHERE deal_id = $1 AND investor_address = $2 AND status = 'CONFIRMED'
         ORDER BY created_at DESC LIMIT 1`,
        dealId,
        investor,
      );

      this.eventEmitter.emit('escrow.deposited', {
        dealId,
        investor,
        amount: amount.toString(),
        txHash,
        blockNumber,
      });

      this.logger.log(`Escrow deposit recorded for deal ${dealId}`);
    } catch (error) {
      this.logger.error(`Failed to handle FundsDeposited for tx ${txHash}`, error);
      throw error;
    }
  }

  private async handleFundsReleased(event: {
    args: { dealId: `0x${string}`; to: `0x${string}`; amount: bigint };
    transactionHash: `0x${string}`;
    blockNumber: bigint;
  }) {
    const { dealId, to, amount } = event.args;
    const txHash = event.transactionHash;
    const blockNumber = Number(event.blockNumber);

    this.logger.log(`FundsReleased: deal=${dealId}, to=${to}, amount=${amount}`);

    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO escrow_transactions (id, deal_id, tx_type, from_address, to_address, amount, tx_hash, block_number, created_at)
         VALUES ($1, $2, 'RELEASE', 'escrow', $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO NOTHING`,
        `release-${txHash}-${event.blockNumber}`,
        dealId,
        to,
        amount.toString(),
        txHash,
        blockNumber,
      );

      await this._updateEscrowBalance(dealId, amount.toString(), 'SUBTRACT');

      this.eventEmitter.emit('escrow.released', {
        dealId,
        to,
        amount: amount.toString(),
        txHash,
        blockNumber,
      });

      this.logger.log(`Escrow release recorded for deal ${dealId} to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to handle FundsReleased for tx ${txHash}`, error);
      throw error;
    }
  }

  private async handleFundsRefunded(event: {
    args: { dealId: `0x${string}`; investor: `0x${string}`; amount: bigint };
    transactionHash: `0x${string}`;
    blockNumber: bigint;
  }) {
    const { dealId, investor, amount } = event.args;
    const txHash = event.transactionHash;
    const blockNumber = Number(event.blockNumber);

    this.logger.log(`FundsRefunded: deal=${dealId}, investor=${investor}, amount=${amount}`);

    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO escrow_transactions (id, deal_id, tx_type, from_address, to_address, amount, tx_hash, block_number, created_at)
         VALUES ($1, $2, 'REFUND', 'escrow', $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO NOTHING`,
        `refund-${txHash}-${event.blockNumber}`,
        dealId,
        investor,
        amount.toString(),
        txHash,
        blockNumber,
      );

      await this._updateEscrowBalance(dealId, amount.toString(), 'SUBTRACT');

      await this.prisma.$executeRawUnsafe(
        `UPDATE investments SET status = 'REFUNDED', blockchain_status = 'REFUNDED'
         WHERE deal_id = $1 AND investor_address = $2 AND status IN ('PENDING', 'CONFIRMED')
         ORDER BY created_at DESC LIMIT 1`,
        dealId,
        investor,
      );

      this.eventEmitter.emit('escrow.refunded', {
        dealId,
        investor,
        amount: amount.toString(),
        txHash,
        blockNumber,
      });

      this.logger.log(`Escrow refund recorded for deal ${dealId} to ${investor}`);
    } catch (error) {
      this.logger.error(`Failed to handle FundsRefunded for tx ${txHash}`, error);
      throw error;
    }
  }

  private async handleFeeDeducted(event: {
    args: { dealId: `0x${string}`; platform: `0x${string}`; amount: bigint };
    transactionHash: `0x${string}`;
    blockNumber: bigint;
  }) {
    const { dealId, platform, amount } = event.args;
    const txHash = event.transactionHash;
    const blockNumber = Number(event.blockNumber);

    this.logger.log(`FeeDeducted: deal=${dealId}, platform=${platform}, amount=${amount}`);

    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO escrow_transactions (id, deal_id, tx_type, from_address, to_address, amount, tx_hash, block_number, created_at)
         VALUES ($1, $2, 'FEE', 'escrow', $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO NOTHING`,
        `fee-${txHash}-${event.blockNumber}`,
        dealId,
        platform,
        amount.toString(),
        txHash,
        blockNumber,
      );

      await this._updateEscrowBalance(dealId, amount.toString(), 'SUBTRACT');

      this.eventEmitter.emit('escrow.fee', {
        dealId,
        platform,
        amount: amount.toString(),
        txHash,
        blockNumber,
      });

      this.logger.log(`Platform fee recorded for deal ${dealId}`);
    } catch (error) {
      this.logger.error(`Failed to handle FeeDeducted for tx ${txHash}`, error);
      throw error;
    }
  }

  private async _updateEscrowBalance(dealId: string, amount: string, operation: 'ADD' | 'SUBTRACT') {
    const sign = operation === 'ADD' ? '+' : '-';
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO escrow_balances (deal_id, balance, updated_at)
       VALUES ($1, ${operation === 'ADD' ? '0' : '0'}::bigint, NOW())
       ON CONFLICT (deal_id) DO UPDATE SET
         balance = escrow_balances.balance ${sign} $2::bigint,
         updated_at = NOW()`,
      dealId,
      amount,
    ).catch((error) => {
      this.logger.warn(`Could not update escrow balance for ${dealId}: ${error.message}`);
    });
  }
}
