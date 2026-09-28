import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlockchainTxStatus,
  NotificationType,
  Prisma,
  SettlementStatus,
  WithdrawalStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../database/database.service';
import { LedgerService } from '../ledger/ledger.service';
import { EscrowService } from '../escrow/escrow.service';
import {
  CASH_ACCOUNT,
  investorPayableAccountFor,
} from '../common/constants/account-codes';
import { ZERO, lessThan, toDecimal } from '../common/utils/decimal.util';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import {
  SettlementQueryDto,
  WithdrawalQueryDto,
} from './dto/settlement-query.dto';

@Injectable()
export class SettlementsService {
  private readonly logger = new Logger(SettlementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly escrowService: EscrowService,
    private readonly configService: ConfigService,
  ) {}

  async createSettlement(dealId: string, dto: CreateSettlementDto) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException(`Deal ${dealId} not found`);
    }

    const amount = toDecimal(dto.amount);
    if (lessThan(amount, ZERO)) {
      throw new BadRequestException('Settlement amount cannot be negative');
    }

    return this.prisma.settlement.create({
      data: {
        dealId,
        type: dto.type,
        amount,
        toUserId: dto.toUserId ?? null,
        toWalletAddress: dto.toWalletAddress ?? null,
        status: SettlementStatus.PENDING,
      },
    });
  }

  async getSettlementById(settlementId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        deal: { include: { farmerProfile: true } },
        toUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        payment: true,
      },
    });
    if (!settlement) {
      throw new NotFoundException(`Settlement ${settlementId} not found`);
    }
    return settlement;
  }

  async approve(settlementId: string, adminId: string) {
    const settlement = await this.getSettlementById(settlementId);
    if (settlement.status !== SettlementStatus.PENDING) {
      throw new ConflictException(
        `Settlement ${settlementId} cannot be approved from status ${settlement.status}`,
      );
    }
    return this.prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: SettlementStatus.APPROVED,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
  }

  /**
   * Executes an approved settlement: releases funds from escrow, creates the
   * payout payment record, records a blockchain transaction, and notifies the
   * recipient.
   */
  async processSettlement(settlementId: string) {
    const settlement = await this.getSettlementById(settlementId);
    if (settlement.status !== SettlementStatus.APPROVED) {
      throw new ConflictException(
        `Settlement ${settlementId} must be APPROVED before processing (status: ${settlement.status})`,
      );
    }

    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { dealId: settlement.dealId },
    });
    if (!escrow) {
      throw new NotFoundException(
        `No escrow account exists for deal ${settlement.dealId}`,
      );
    }

    const amount = settlement.amount.toString();

    await this.prisma.settlement.update({
      where: { id: settlementId },
      data: { status: SettlementStatus.PROCESSING },
    });

    try {
      switch (settlement.type) {
        case 'FARMER_PAYOUT':
        case 'INVESTOR_RETURN':
          await this.escrowService.release(escrow.id, amount, settlementId);
          break;
        case 'REFUND':
          await this.escrowService.refund(escrow.id, amount, settlementId);
          break;
        case 'PLATFORM_FEE':
          await this.escrowService.deductFee(escrow.id, amount, settlementId);
          break;
        default:
          throw new BadRequestException(
            `Unsupported settlement type: ${settlement.type}`,
          );
      }

      const paymentId = await this.createPayoutPaymentRecord(settlement);
      const txHash = await this.recordBlockchainTransaction({
        id: settlementId,
        amount: amount.toString(),
        referenceType: 'SETTLEMENT',
      });

      const updated = await this.prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: SettlementStatus.COMPLETED,
          completedAt: new Date(),
          paymentId,
          blockchainTxHash: txHash ?? null,
        },
      });

      if (settlement.toUserId) {
        await this.createNotification(
          settlement.toUserId,
          NotificationType.SYSTEM,
          'Settlement completed',
          `A settlement of ${amount} BDT for deal "${settlement.deal.title}" has been completed.`,
          { settlementId, type: settlement.type, amount },
        );
      }

      return updated;
    } catch (error) {
      this.logger.error(
        `Settlement ${settlementId} processing failed: ${
          error instanceof Error ? error.message : error
        }`,
      );
      await this.prisma.settlement.update({
        where: { id: settlementId },
        data: { status: SettlementStatus.FAILED },
      });
      throw error;
    }
  }

  async getSettlements(dealId: string, query: SettlementQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.SettlementWhereInput = {
      dealId,
      ...(query.status ? { status: query.status as SettlementStatus } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.settlement.findMany({
        where,
        include: {
          toUser: { select: { id: true, email: true } },
          deal: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAllSettlements(query: SettlementQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.SettlementWhereInput = {
      ...(query.status ? { status: query.status as SettlementStatus } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.settlement.findMany({
        where,
        include: {
          toUser: { select: { id: true, email: true } },
          deal: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Requests a withdrawal against the user's wallet balance. */
  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto) {
    const amount = toDecimal(dto.amount);
    if (lessThan(amount, ZERO)) {
      throw new BadRequestException('Withdrawal amount cannot be negative');
    }

    const payable = await this.ledgerService.ensureAccount(
      investorPayableAccountFor('wallet'),
    );
    const { balance } = await this.ledgerService.getAccountBalance(payable.id);
    if (lessThan(balance, amount)) {
      throw new BadRequestException(
        `Insufficient wallet balance. Available: ${balance}, requested: ${amount}`,
      );
    }

    return this.prisma.withdrawal.create({
      data: {
        userId,
        amount,
        currency: (dto.currency ?? 'BDT').toUpperCase(),
        method: dto.method,
        accountDetails: dto.accountDetails as Prisma.InputJsonValue,
        status: WithdrawalStatus.PENDING,
      },
    });
  }

  async approveWithdrawal(withdrawalId: string, adminId: string) {
    const withdrawal = await this.getWithdrawalById(withdrawalId);
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new ConflictException(
        `Withdrawal ${withdrawalId} cannot be approved from status ${withdrawal.status}`,
      );
    }
    return this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.APPROVED,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
  }

  /** Executes an approved withdrawal against the user's wallet balance. */
  async processWithdrawal(withdrawalId: string) {
    const withdrawal = await this.getWithdrawalById(withdrawalId);
    if (withdrawal.status !== WithdrawalStatus.APPROVED) {
      throw new ConflictException(
        `Withdrawal ${withdrawalId} must be APPROVED before processing`,
      );
    }

    let txHash: string | null = null;
    try {
      txHash = await this.recordBlockchainTransaction({
        id: withdrawalId,
        amount: withdrawal.amount.toString(),
        referenceType: 'WITHDRAWAL',
      });
    } catch (error) {
      this.logger.warn(
        `Could not record blockchain transaction for withdrawal ${withdrawalId}: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: WithdrawalStatus.PROCESSING },
      });

      const payable = await this.ledgerService.ensureAccount(
        investorPayableAccountFor('wallet'),
      );
      const { balance } = await this.ledgerService.getAccountBalance(payable.id);
      if (lessThan(balance, withdrawal.amount.toString())) {
        throw new BadRequestException(
          `Insufficient wallet balance at execution. Available: ${balance}, requested: ${withdrawal.amount.toString()}`,
        );
      }

      const cashAccount = await this.ledgerService.ensureAccount(CASH_ACCOUNT);
      await this.ledgerService.createTransaction(
        {
          referenceType: 'WITHDRAWAL',
          referenceId: withdrawalId,
          description: `Withdrawal of ${withdrawal.amount.toString()} ${withdrawal.currency} for user ${withdrawal.userId}`,
          idempotencyKey: `withdrawal-payout-${withdrawalId}`,
          entries: [
            { accountId: payable.id, debit: withdrawal.amount.toString(), currency: withdrawal.currency },
            { accountId: cashAccount.id, credit: withdrawal.amount.toString(), currency: withdrawal.currency },
          ],
        },
        tx,
      );

      const payment = await tx.payment.create({
        data: {
          userId: withdrawal.userId,
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          provider: 'withdrawal',
          providerReference: withdrawalId,
          status: 'COMPLETED',
          idempotencyKey: `withdrawal-payment-${withdrawalId}`,
          metadata: {
            method: withdrawal.method,
            accountDetails: withdrawal.accountDetails,
          } as Prisma.InputJsonValue,
        },
      });

      return tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: WithdrawalStatus.COMPLETED,
          paymentId: payment.id,
        },
      });
    });

    await this.createNotification(
      withdrawal.userId,
      NotificationType.WITHDRAWAL_COMPLETED,
      'Withdrawal completed',
      `Your withdrawal of ${withdrawal.amount.toString()} ${withdrawal.currency} has been completed.`,
      { withdrawalId, amount: withdrawal.amount.toString() },
    );

    return result;
  }

  async getWithdrawals(userId: string, query: WithdrawalQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.WithdrawalWhereInput = {
      userId,
      ...(query.status ? { status: query.status as WithdrawalStatus } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.withdrawal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getWithdrawalById(withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal ${withdrawalId} not found`);
    }
    return withdrawal;
  }

  private async createPayoutPaymentRecord(settlement: {
    id: string;
    dealId: string;
    toUserId: string | null;
    amount: { toString(): string };
  }): Promise<string | null> {
    if (!settlement.toUserId) {
      return null;
    }
    const payment = await this.prisma.payment.create({
      data: {
        userId: settlement.toUserId,
        amount: settlement.amount.toString(),
        currency: 'BDT',
        provider: 'settlement',
        providerReference: settlement.id,
        status: 'COMPLETED',
        idempotencyKey: `settlement-payment-${settlement.id}`,
        metadata: { dealId: settlement.dealId },
      },
    });
    return payment.id;
  }

  private async recordBlockchainTransaction(input: {
    id: string;
    amount: string;
    referenceType: string;
  }): Promise<string | null> {
    const enabled = this.configService.get<string>(
      'BLOCKCHAIN_MOCK_ENABLED',
      'true',
    );
    if (enabled !== 'true') {
      return null;
    }
    const txHash = `0x${randomBytes(32).toString('hex')}`;
    const chainId = Number(
      this.configService.get<string>('CHAIN_ID', '80002'),
    );
    await this.prisma.blockchainTransaction.create({
      data: {
        txHash,
        chainId,
        fromAddress: this.configService.get<string>(
          'PLATFORM_WALLET_ADDRESS',
          '0x0000000000000000000000000000000000000000',
        ),
        toAddress: this.configService.get<string>(
          'SETTLEMENT_WALLET_ADDRESS',
          '0x0000000000000000000000000000000000000000',
        ),
        value: input.amount,
        status: BlockchainTxStatus.CONFIRMED,
        relatedEntityType: input.referenceType,
        relatedEntityId: input.id,
      },
    });
    return txHash;
  }

  private async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: data === undefined ? undefined : (data as Prisma.InputJsonValue),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to create notification for user ${userId}: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }
}