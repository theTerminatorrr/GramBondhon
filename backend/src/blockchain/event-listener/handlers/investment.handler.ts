import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/database.service';

interface InvestmentMadeEvent {
  args: {
    investmentId: `0x${string}`;
    dealId: `0x${string}`;
    investor: `0x${string}`;
    units: bigint;
    amount: bigint;
  };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  logIndex: number;
}

/**
 * Handles blockchain events emitted by the DealContract smart contract.
 * @contract contracts/src/DealContract.sol
 */
@Injectable()
export class InvestmentHandler {
  private readonly logger = new Logger(InvestmentHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handle(event: InvestmentMadeEvent) {
    const { investmentId, dealId, investor, units, amount } = event.args;
    const txHash = event.transactionHash;
    const blockNumber = Number(event.blockNumber);

    this.logger.log(
      `Processing InvestmentMade: investment=${investmentId}, deal=${dealId}, investor=${investor}, units=${units}, amount=${amount}`,
    );

    try {
      const existingInvestment = await this.prisma.$queryRawUnsafe(
        `SELECT id FROM investments WHERE blockchain_tx_hash = $1 AND status = 'CONFIRMED' LIMIT 1`,
        txHash,
      ) as { id: string }[];

      if (existingInvestment && existingInvestment.length > 0) {
        this.logger.debug(`Investment for tx ${txHash} already confirmed, skipping (idempotent)`);
        return;
      }

      const pendingInvestment = await this.prisma.$queryRawUnsafe(
        `SELECT id, deal_id FROM investments WHERE deal_id = $1 AND investor_address = $2 AND status = 'PENDING' ORDER BY created_at DESC LIMIT 1`,
        dealId,
        investor,
      ) as { id: string; deal_id: string }[];

      if (pendingInvestment && pendingInvestment.length > 0) {
        const investmentIdDb = pendingInvestment[0].id;

        await this.prisma.$executeRawUnsafe(
          `UPDATE investments SET
            status = 'CONFIRMED',
            blockchain_tx_hash = $1,
            blockchain_block_number = $2,
            blockchain_investment_id = $3,
            updated_at = NOW()
           WHERE id = $4`,
          txHash,
          blockNumber,
          investmentId,
          investmentIdDb,
        );

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO ledger_entries (investment_id, entry_type, amount, description, tx_hash, block_number, created_at)
           VALUES ($1, 'INVESTMENT_CONFIRMED', $2, 'Investment confirmed on-chain', $3, $4, NOW())`,
          investmentIdDb,
          amount.toString(),
          txHash,
          blockNumber,
        );

        this.eventEmitter.emit('investment.confirmed', {
          investmentId: investmentIdDb,
          dealId,
          investor,
          units: units.toString(),
          amount: amount.toString(),
          txHash,
          blockNumber,
        });

        this.logger.log(`Investment ${investmentIdDb} confirmed via tx ${txHash}`);
      } else {
        this.logger.warn(
          `No pending investment found for deal=${dealId}, investor=${investor}. Creating on-chain record.`,
        );

        const newInvestmentId = `onchain-${investmentId.slice(0, 16)}`;

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO investments (id, deal_id, investor_address, units, amount, status, blockchain_tx_hash, blockchain_block_number, blockchain_investment_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', $6, $7, $8, NOW(), NOW())
           ON CONFLICT (id) DO NOTHING`,
          newInvestmentId,
          dealId,
          investor,
          Number(units),
          amount.toString(),
          txHash,
          blockNumber,
          investmentId,
        );

        this.eventEmitter.emit('investment.confirmed', {
          investmentId: newInvestmentId,
          dealId,
          investor,
          units: units.toString(),
          amount: amount.toString(),
          txHash,
          blockNumber,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to handle InvestmentMade event for tx ${txHash}`, error);
      throw error;
    }
  }
}
