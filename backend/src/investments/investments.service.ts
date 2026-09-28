import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Deal,
  DealStatus,
  Investment,
  InvestmentStatus,
  InvestmentTransactionType,
  NotificationType,
  Prisma,
  TransactionState,
} from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { LedgerService } from '../ledger/ledger.service';
import {
  ZERO,
  add,
  equals,
  greaterThan,
  lessThan,
  multiply,
  subtract,
} from '../common/utils/decimal.util';
import {
  INVESTOR_RECEIVABLE_ACCOUNT,
  CASH_ACCOUNT,
  escrowFundsAccountFor,
  investorPayableAccountFor,
} from '../common/constants/account-codes';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { InvestmentQueryDto } from './dto/investment-query.dto';

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Creates a PENDING investment, allocates units, and books the receivable
   * against the escrow obligation. Idempotent on `idempotencyKey`.
   */
  async create(
    investorProfileId: string,
    dealId: string,
    dto: CreateInvestmentDto,
  ) {
    const existing = await this.prisma.investment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { deal: true, investmentUnits: true },
    });
    if (existing) {
      return existing;
    }

    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { farmerProfile: true },
    });
    if (!deal) {
      throw new NotFoundException(`Deal ${dealId} not found`);
    }
    if (deal.status !== 'FUNDING') {
      throw new ConflictException(
        `Deal ${dealId} is not open for funding (status: ${deal.status})`,
      );
    }

    const unitPrice = deal.unitPrice.toString();
    const amount = multiply(unitPrice, String(dto.units));

    const minInvestment = deal.minimumInvestment.toString();
    if (lessThan(amount, minInvestment)) {
      throw new BadRequestException(
        `Investment amount ${amount} is below the minimum of ${minInvestment}`,
      );
    }

    const existingInvested = await this.prisma.investment.aggregate({
      _sum: { amount: true },
      where: {
        investorProfileId,
        dealId,
        status: { in: [InvestmentStatus.CONFIRMED, InvestmentStatus.ACTIVE] },
      },
    });
    const alreadyInvested = existingInvested._sum.amount?.toString() ?? ZERO;
    const capacity = subtractDealCapacity(deal, alreadyInvested);
    if (greaterThan(amount, capacity.maxRemainingAmount)) {
      throw new BadRequestException(
        `Investment exceeds remaining capacity. Maximum additional amount is ${capacity.maxRemainingAmount}`,
      );
    }

    const allocatedUnits = await this.prisma.investment.aggregate({
      _sum: { units: true },
      where: {
        dealId,
        status: { in: [InvestmentStatus.CONFIRMED, InvestmentStatus.PENDING, InvestmentStatus.ACTIVE] },
      },
    });
    const usedUnits = allocatedUnits._sum.units ?? 0;
    if (usedUnits + dto.units > deal.investmentUnits) {
      throw new BadRequestException(
        `Only ${Math.max(deal.investmentUnits - usedUnits, 0)} unit(s) remain available in deal ${dealId}`,
      );
    }

    const receivableAccount = await this.ledgerService.ensureAccount(
      INVESTOR_RECEIVABLE_ACCOUNT,
    );
    const payableAccount = await this.ledgerService.ensureAccount(
      investorPayableAccountFor(dealId),
    );

    const investment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.investment.create({
        data: {
          dealId,
          investorProfileId,
          units: dto.units,
          amount,
          unitPrice,
          idempotencyKey: dto.idempotencyKey,
          status: InvestmentStatus.PENDING,
        },
        include: {
          deal: true,
          investorProfile: { include: { user: true } },
          investmentUnits: true,
        },
      });

      const unitData = Array.from({ length: dto.units }, (_, i) => ({
        investmentId: created.id,
        unitNumber: i + 1,
      }));
      await tx.investmentUnit.createMany({ data: unitData });

      const units = await tx.investmentUnit.findMany({
        where: { investmentId: created.id },
        orderBy: { unitNumber: 'asc' },
      });

      const transaction = await tx.investmentTransaction.create({
        data: {
          investmentId: created.id,
          type: InvestmentTransactionType.INVEST,
          amount,
          status: TransactionState.PENDING,
        },
      });

      await this.ledgerService.createTransaction(
        {
          referenceType: 'INVESTMENT',
          referenceId: created.id,
          description: `Investment of ${amount} units=${dto.units} for deal ${dealId}`,
          idempotencyKey: `investment-create-${created.id}`,
          entries: [
            {
              accountId: receivableAccount.id,
              debit: amount,
              currency: 'BDT',
            },
            {
              accountId: payableAccount.id,
              credit: amount,
              currency: 'BDT',
            },
          ],
        },
        tx,
      );

      return {
        ...created,
        investmentUnits: units,
        investmentTransactions: transaction ? [transaction] : [],
      };
    });

    await this.createNotification(
      investment.investorProfile.userId,
      NotificationType.SYSTEM,
      'Investment received',
      `Your investment of ${amount} for deal "${deal.title}" has been received and is pending payment confirmation.`,
      { investmentId: investment.id, dealId, amount },
    );

    return investment;
  }

  /**
   * Confirms a PENDING investment. Books the movement of funds into escrow,
   * updates deal `totalInvested`, and transitions the deal to FUNDED when
   * the funding target has been reached.
   */
  async confirm(investmentId: string, txHash?: string, client?: Prisma.TransactionClient) {
    const run = async (tx: Prisma.TransactionClient) => {
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
        include: { deal: true },
      });
      if (!investment) {
        throw new NotFoundException(`Investment ${investmentId} not found`);
      }
      if (investment.status === InvestmentStatus.CONFIRMED) {
        return investment;
      }
      if (
        investment.status === InvestmentStatus.REFUNDED ||
        investment.status === InvestmentStatus.FAILED ||
        investment.status === InvestmentStatus.CANCELLED
      ) {
        throw new ConflictException(
          `Investment ${investmentId} cannot be confirmed from status ${investment.status}`,
        );
      }

      await this.ledgerService.ensureAccount(CASH_ACCOUNT);
      const escrowAccount = await this.ledgerService.ensureAccount(
        escrowFundsAccountFor(investment.dealId),
      );

      const [cashAccount, escrowLedgerAccount] = await Promise.all([
        this.ledgerService.getAccountByCode(CASH_ACCOUNT.code),
        Promise.resolve(escrowAccount),
      ]);
      if (!cashAccount) {
        throw new Error('Cash account is missing');
      }

      const updated = await tx.investment.update({
        where: { id: investmentId },
        data: {
          status: InvestmentStatus.CONFIRMED,
          confirmedAt: new Date(),
          blockchainTxHash: txHash ?? null,
        },
        include: { deal: true },
      });

      await tx.investmentTransaction.updateMany({
        where: { investmentId, type: InvestmentTransactionType.INVEST },
        data: {
          status: TransactionState.CONFIRMED,
          reference: txHash ?? null,
          blockchainTxHash: txHash ?? null,
        },
      });

      const newTotal = add(
        investment.deal.totalInvested.toString(),
        investment.amount.toString(),
      );
      const fundingReached = greaterThanOrEqualsTotal(
        newTotal,
        investment.deal.fundingTarget.toString(),
      );

      const dealUpdate = await tx.deal.update({
        where: { id: investment.dealId },
        data: {
          totalInvested: newTotal,
          ...(fundingReached
            ? { status: DealStatus.FUNDED, fundedAt: new Date() }
            : {}),
        },
      });

      await this.ledgerService.createTransaction(
        {
          referenceType: 'INVESTMENT',
          referenceId: investmentId,
          description: `Confirmed investment ${investmentId}: funds moved into escrow`,
          idempotencyKey: `investment-confirm-${investmentId}`,
          entries: [
            {
              accountId: escrowLedgerAccount.id,
              debit: investment.amount.toString(),
              currency: 'BDT',
            },
            {
              accountId: cashAccount.id,
              credit: investment.amount.toString(),
              currency: 'BDT',
            },
          ],
        },
        tx,
      );

      const escrow = await this.upsertEscrowBalance(tx, investment.dealId, investment.amount.toString());

      await this.recordEscrowTransaction(
        tx,
        escrow.id,
        'DEPOSIT',
        investment.amount.toString(),
        `investment:${investmentId}`,
        TransactionState.CONFIRMED,
      );

      const investorUserId = await this.getInvestorUserId(
        tx,
        investment.investorProfileId,
      );

      await this.createNotification(
        investorUserId,
        NotificationType.INVESTMENT_CONFIRMED,
        'Investment confirmed',
        `Your investment of ${investment.amount.toString()} for deal "${investment.deal.title}" has been confirmed.`,
        { investmentId, amount: investment.amount.toString(), dealId: investment.dealId },
      );

      if (fundingReached) {
        await this.createNotification(
          dealUpdate.farmerProfileId,
          NotificationType.FUNDING_COMPLETED,
          'Funding completed',
          `Your deal "${dealUpdate.title}" has reached its funding target of ${dealUpdate.fundingTarget.toString()}.`,
          { dealId: investment.dealId, totalInvested: newTotal },
        );
      }

      return updated;
    };

    if (client) {
      return run(client);
    }
    return this.prisma.$transaction(run);
  }

  /** Marks an investment as failed and reverses outstanding obligations. */
  async fail(investmentId: string, reason: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: { deal: true },
    });
    if (!investment) {
      throw new NotFoundException(`Investment ${investmentId} not found`);
    }
    if (
      investment.status === InvestmentStatus.REFUNDED ||
      investment.status === InvestmentStatus.FAILED ||
      investment.status === InvestmentStatus.CANCELLED
    ) {
      throw new ConflictException(
        `Investment ${investmentId} is already in status ${investment.status}`,
      );
    }
    if (investment.status === InvestmentStatus.CONFIRMED) {
      throw new ConflictException(
        `Investment ${investmentId} is confirmed and cannot be failed; use refund instead`,
      );
    }

    const receivableAccount = await this.ledgerService.ensureAccount(
      INVESTOR_RECEIVABLE_ACCOUNT,
    );
    const payableAccount = await this.ledgerService.ensureAccount(
      investorPayableAccountFor(investment.dealId),
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await this.ledgerService.createTransaction(
        {
          referenceType: 'INVESTMENT',
          referenceId: investmentId,
          description: `Failed investment ${investmentId}: ${reason}`,
          idempotencyKey: `investment-fail-${investmentId}`,
          entries: [
            {
              accountId: payableAccount.id,
              debit: investment.amount.toString(),
              currency: 'BDT',
            },
            {
              accountId: receivableAccount.id,
              credit: investment.amount.toString(),
              currency: 'BDT',
            },
          ],
        },
        tx,
      );

      await tx.investmentTransaction.create({
        data: {
          investmentId,
          type: InvestmentTransactionType.CANCEL,
          amount: investment.amount,
          status: TransactionState.FAILED,
          reference: reason,
        },
      });

      return tx.investment.update({
        where: { id: investmentId },
        data: { status: InvestmentStatus.FAILED },
        include: { deal: true },
      });
    });

    const investorUserId = await this.getInvestorUserId(
      this.prisma,
      investment.investorProfileId,
    );
    await this.createNotification(
      investorUserId,
      NotificationType.PAYMENT_FAILED,
      'Investment failed',
      `Your investment in deal "${updated.deal.title}" could not be completed: ${reason}`,
      { investmentId, reason },
    );

    return updated;
  }

  /** Refunds a confirmed investment back to the investor. */
  async refund(investmentId: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: { deal: true },
    });
    if (!investment) {
      throw new NotFoundException(`Investment ${investmentId} not found`);
    }
    if (investment.status !== InvestmentStatus.CONFIRMED) {
      throw new ConflictException(
        `Investment ${investmentId} must be CONFIRMED to be refunded (status: ${investment.status})`,
      );
    }

    const payableAccount = await this.ledgerService.ensureAccount(
      investorPayableAccountFor(investment.dealId),
    );
    const [cashAccount, escrowLedgerAccount] = await Promise.all([
      this.ledgerService.getAccountByCode(CASH_ACCOUNT.code),
      this.ledgerService.ensureAccount(
        escrowFundsAccountFor(investment.dealId),
      ),
    ]);
    if (!cashAccount) {
      throw new Error('Cash account is missing');
    }

    const escrowAccount = await this.prisma.escrowAccount.findUnique({
      where: { dealId: investment.dealId },
    });
    const escrowBalance = escrowAccount
      ? escrowAccount.balance.toString()
      : ZERO;
    const refundableFromEscrow = lessThan(
      investment.amount.toString(),
      escrowBalance,
    )
      ? investment.amount.toString()
      : escrowBalance;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (greaterThan(refundableFromEscrow, ZERO)) {
        await this.ledgerService.createTransaction(
          {
            referenceType: 'INVESTMENT',
            referenceId: investmentId,
            description: `Refund of ${refundableFromEscrow} for investment ${investmentId}`,
            idempotencyKey: `investment-refund-ledger-${investmentId}`,
            entries: [
              {
                accountId: payableAccount.id,
                debit: refundableFromEscrow,
                currency: 'BDT',
              },
              {
                accountId: escrowLedgerAccount.id,
                credit: refundableFromEscrow,
                currency: 'BDT',
              },
            ],
          },
          tx,
        );

        if (escrowAccount) {
          await tx.escrowAccount.update({
            where: { id: escrowAccount.id },
            data: {
              balance: subtract(escrowAccount.balance.toString(), refundableFromEscrow),
            },
          });
          await this.recordEscrowTransaction(
            tx,
            escrowAccount.id,
            'REFUND',
            refundableFromEscrow,
            `investmentRefund:${investmentId}`,
            TransactionState.CONFIRMED,
          );
        }
      }

      await tx.investmentTransaction.create({
        data: {
          investmentId,
          type: InvestmentTransactionType.REFUND,
          amount: investment.amount,
          status: TransactionState.REFUNDED,
          reference: `Escrow refund of ${refundableFromEscrow}`,
        },
      });

      return tx.investment.update({
        where: { id: investmentId },
        data: { status: InvestmentStatus.REFUNDED },
        include: { deal: true },
      });
    });

    const investorUserId = await this.getInvestorUserId(
      this.prisma,
      investment.investorProfileId,
    );
    await this.createNotification(
      investorUserId,
      NotificationType.SYSTEM,
      'Investment refunded',
      `Your investment of ${investment.amount.toString()} for deal "${updated.deal.title}" has been refunded.`,
      { investmentId, amount: investment.amount.toString() },
    );

    return updated;
  }

  async findOne(id: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id },
      include: {
        deal: { include: { project: true, farmerProfile: true } },
        investorProfile: { include: { user: true } },
        investmentUnits: true,
        payments: true,
      },
    });
    if (!investment) {
      throw new NotFoundException(`Investment ${id} not found`);
    }
    return investment;
  }

  async findAll(
    investorProfileId: string,
    query: InvestmentQueryDto = {},
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.InvestmentWhereInput = {
      investorProfileId,
      ...(query.status ? { status: query.status as InvestmentStatus } : {}),
      ...(query.dealId ? { dealId: query.dealId } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.investment.findMany({
        where,
        include: {
          deal: {
            select: {
              id: true,
              title: true,
              status: true,
              fundingTarget: true,
              totalInvested: true,
              unitPrice: true,
            },
          },
          investmentUnits: true,
          _count: { select: { payments: true, investmentTransactions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.investment.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTransactions(investmentId: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
    });
    if (!investment) {
      throw new NotFoundException(`Investment ${investmentId} not found`);
    }
    return this.prisma.investmentTransaction.findMany({
      where: { investmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async upsertEscrowBalance(
    tx: Prisma.TransactionClient,
    dealId: string,
    amount: string,
  ) {
    const existing = await tx.escrowAccount.findUnique({ where: { dealId } });
    if (existing) {
      return tx.escrowAccount.update({
        where: { id: existing.id },
        data: {
          balance: add(existing.balance.toString(), amount),
          status: 'ACTIVE',
        },
      });
    }
    return tx.escrowAccount.create({
      data: { dealId, balance: amount, lockedBalance: ZERO, status: 'ACTIVE' },
    });
  }

  private async recordEscrowTransaction(
    tx: Prisma.TransactionClient,
    escrowAccountId: string,
    type: 'DEPOSIT' | 'LOCK' | 'RELEASE' | 'REFUND' | 'FEE',
    amount: string,
    reference?: string,
    state: TransactionState = TransactionState.CONFIRMED,
  ) {
    return tx.escrowTransaction.create({
      data: {
        escrowAccountId,
        type,
        amount,
        fromReference: reference ?? null,
        toReference: null,
        state,
      },
    });
  }

  async getInvestmentsByDeal(dealId: string) {
    return this.prisma.investment.findMany({
      where: { dealId, status: { in: [InvestmentStatus.CONFIRMED, InvestmentStatus.ACTIVE] } },
      include: { investorProfile: { include: { user: true } } },
    });
  }

  async getInvestorProfileByUserId(userId: string) {
    const profile = await this.prisma.investorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BadRequestException('Investor profile not found for the current user');
    }
    return profile;
  }

  private async getInvestorUserId(
    client: Prisma.TransactionClient | PrismaService,
    investorProfileId: string,
  ): Promise<string> {
    const investorProfile = await client.investorProfile.findUnique({
      where: { id: investorProfileId },
      select: { userId: true },
    });
    return investorProfile?.userId ?? investorProfileId;
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

function subtractDealCapacity(
  deal: Deal,
  alreadyInvested: string,
): { maxRemainingAmount: string } {
  const max = deal.maximumInvestment.toString();
  const remaining = subtract(max, alreadyInvested);
  return { maxRemainingAmount: greaterThan(remaining, ZERO) ? remaining : ZERO };
}

function greaterThanOrEqualsTotal(a: string, b: string): boolean {
  return equals(a, b) || greaterThan(a, b);
}