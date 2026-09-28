import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/database.service';

interface ProfitDeclaredEvent {
  args: { investorProfit: bigint; farmerProfit: bigint; platformFee: bigint };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  logIndex: number;
}

interface ProfitDistributedEvent {
  args: { dealId: `0x${string}`; investor: `0x${string}`; amount: bigint };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  logIndex: number;
}

/**
 * Handles blockchain events emitted by the ProfitDistribution smart contract.
 * @contract contracts/src/ProfitDistribution.sol
 */
@Injectable()
export class ProfitHandler {
  private readonly logger = new Logger(ProfitHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handle(event: { name: string; args: Record<string, unknown>; transactionHash: string; blockNumber: bigint }) {
    switch (event.name) {
      case 'ProfitDeclared':
        return this.handleProfitDeclared(event as unknown as ProfitDeclaredEvent);
      case 'ProfitDistributed':
        return this.handleProfitDistributed(event as unknown as ProfitDistributedEvent);
      default:
        this.logger.warn(`Unknown profit event: ${event.name}`);
    }
  }

  private async handleProfitDeclared(event: ProfitDeclaredEvent) {
    const { investorProfit, farmerProfit, platformFee } = event.args;
    const txHash = event.transactionHash;
    const blockNumber = Number(event.blockNumber);

    this.logger.log(
      `ProfitDeclared: investor=${investorProfit}, farmer=${farmerProfit}, platform=${platformFee}, tx=${txHash}`,
    );

    try {
      const totalProfit = investorProfit + farmerProfit + platformFee;

      const existing = await this.prisma.$queryRawUnsafe(
        `SELECT id FROM profit_distributions WHERE tx_hash = $1 LIMIT 1`,
        txHash,
      ) as { id: string }[];

      if (existing && existing.length > 0) {
        this.logger.debug(`Profit declaration for tx ${txHash} already recorded, skipping`);
        return;
      }

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO profit_distributions (id, deal_id, total_amount, investor_share, farmer_share, platform_fee, status, tx_hash, block_number, created_at, updated_at)
         VALUES ($1, NULL, $2, $3, $4, $5, 'DECLARED', $6, $7, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        `profit-${txHash.slice(0, 16)}-${blockNumber}`,
        totalProfit.toString(),
        investorProfit.toString(),
        farmerProfit.toString(),
        platformFee.toString(),
        txHash,
        blockNumber,
      );

      this.eventEmitter.emit('profit.declared', {
        investorProfit: investorProfit.toString(),
        farmerProfit: farmerProfit.toString(),
        platformFee: platformFee.toString(),
        totalProfit: totalProfit.toString(),
        txHash,
        blockNumber,
      });

      this.logger.log(`Profit declaration recorded: total=${totalProfit}`);
    } catch (error) {
      this.logger.error(`Failed to handle ProfitDeclared for tx ${txHash}`, error);
      throw error;
    }
  }

  private async handleProfitDistributed(event: ProfitDistributedEvent) {
    const { dealId, investor, amount } = event.args;
    const txHash = event.transactionHash;
    const blockNumber = Number(event.blockNumber);

    this.logger.log(`ProfitDistributed: deal=${dealId}, investor=${investor}, amount=${amount}`);

    try {
      const paymentId = `payment-${txHash}-${event.logIndex}`;

      const existing = await this.prisma.$queryRawUnsafe(
        `SELECT id FROM profit_distributions WHERE id = $1 LIMIT 1`,
        paymentId,
      ) as { id: string }[];

      if (existing && existing.length > 0) {
        this.logger.debug(`Payment ${paymentId} already recorded, skipping`);
        return;
      }

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO profit_distributions (id, deal_id, investor_address, amount, tx_hash, block_number, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED', NOW())
         ON CONFLICT (id) DO NOTHING`,
        paymentId,
        dealId,
        investor,
        amount.toString(),
        txHash,
        blockNumber,
      );

      await this.prisma.$executeRawUnsafe(
        `UPDATE profit_distributions SET status = 'DISTRIBUTED', updated_at = NOW()
         WHERE deal_id = $1 AND status IN ('DECLARED', 'CALCULATED')
         ORDER BY created_at DESC LIMIT 1`,
        dealId,
      );

      await this.prisma.$executeRawUnsafe(
        `UPDATE investments SET profit_paid = true, profit_paid_at = NOW()
         WHERE deal_id = $1 AND investor_address = $2 AND status = 'CONFIRMED'`,
        dealId,
        investor,
      );

      this.eventEmitter.emit('profit.distributed', {
        dealId,
        investor,
        amount: amount.toString(),
        txHash,
        blockNumber,
        paymentId,
      });

      this.logger.log(`Profit payment recorded: ${paymentId}, investor=${investor}, amount=${amount}`);
    } catch (error) {
      this.logger.error(`Failed to handle ProfitDistributed for tx ${txHash}`, error);
      throw error;
    }
  }
}
