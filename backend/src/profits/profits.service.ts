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
  DistributionStatus,
  InvestmentStatus,
  NotificationType,
  Prisma,
  RecipientType,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../database/database.service';
import { LedgerService } from '../ledger/ledger.service';
import {
  ZERO,
  add,
  divide,
  equals,
  greaterThan,
  lessThan,
  multiply,
  round,
  subtract,
} from '../common/utils/decimal.util';
import {
  SALES_REVENUE_ACCOUNT,
  PROJECT_EXPENSE_ACCOUNT,
  INCOME_SUMMARY_ACCOUNT,
  PLATFORM_FEE_REVENUE_ACCOUNT,
  CASH_ACCOUNT,
  farmerPayableAccountFor,
  investorPayableAccountFor,
} from '../common/constants/account-codes';
import { CalculateProfitDto } from './dto/calculate-profit.dto';
import { ProfitQueryDto } from './dto/profit-query.dto';

const PROFITABLE_DEAL_STAGES = [
  'ACTIVE',
  'HARVESTING',
  'REVENUE_VERIFICATION',
  'PROFIT_CALCULATION',
  'DISTRIBUTION',
];

@Injectable()
export class ProfitsService {
  private readonly logger = new Logger(ProfitsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Computes a profit calculation for a deal:
   * Revenue - Expenses = Gross Profit
   * Gross Profit - Platform Fees = Distributable Profit
   * Distributable x investorShare = Investor Profit
   * Distributable x farmerShare = Farmer Profit
   *
   * Books the closing entries (revenue/expense -> income summary) and the
   * allocation entries (income summary -> payables + platform fee revenue).
   */
  async calculateProfit(dealId: string, dto: CalculateProfitDto) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { project: true, farmerProfile: { include: { user: true } } },
    });
    if (!deal) {
      throw new NotFoundException(`Deal ${dealId} not found`);
    }
    if (!PROFITABLE_DEAL_STAGES.includes(deal.status)) {
      throw new ConflictException(
        `Deal ${dealId} is not in a stage that allows profit calculation (status: ${deal.status})`,
      );
    }

    const projectId = deal.projectId;

    const totalRevenue = dto.totalRevenue
      ? round(dto.totalRevenue)
      : await this.sumRevenues(projectId);

    const totalExpenses = dto.totalExpenses
      ? round(dto.totalExpenses)
      : await this.sumApprovedExpenses(
          projectId,
          dto.approvedExpenseIds ?? [],
        );

    const grossProfit = subtract(totalRevenue, totalExpenses);
    if (lessThan(grossProfit, ZERO) || equals(grossProfit, ZERO)) {
      throw new BadRequestException(
        `No distributable profit: revenue ${totalRevenue}, expenses ${totalExpenses}, gross profit ${grossProfit}`,
      );
    }

    const platformFeePercent = toPercent(deal.platformFeePercent.toString());
    const investorSharePercent = toPercent(deal.investorSharePercent.toString());
    const farmerSharePercent = toPercent(deal.farmerSharePercent.toString());

    const platformFees = percentOf(grossProfit, platformFeePercent);
    const distributableProfit = subtract(grossProfit, platformFees);

    const investorProfit = percentOf(distributableProfit, investorSharePercent);
    const farmerProfit = percentOf(distributableProfit, farmerSharePercent);

    const investors = await this.prisma.investment.findMany({
      where: {
        dealId,
        status: { in: [InvestmentStatus.CONFIRMED, InvestmentStatus.ACTIVE] },
      },
      include: { investorProfile: { include: { user: true } } },
    });
    const totalInvested = investors.reduce(
      (sum, i) => add(sum, i.amount.toString()),
      ZERO,
    );

    const allocations: Array<{
      recipientType: RecipientType;
      investorProfileId: string | null;
      farmerProfileId: string | null;
      userId: string | null;
      amount: string;
      percentage: string;
    }> = [];

    if (greaterThan(totalInvested, ZERO)) {
      for (const investment of investors) {
        const shareFactor = divide(
          investment.amount.toString(),
          totalInvested,
        );
        const amount = multiply(investorProfit, shareFactor);
        if (lessThan(amount, ZERO)) {
          continue;
        }
        allocations.push({
          recipientType: 'INVESTOR',
          investorProfileId: investment.investorProfileId,
          farmerProfileId: null,
          userId: investment.investorProfile.userId,
          amount,
          percentage: multiply(investorSharePercent, shareFactor),
        });
      }
    }

    allocations.push({
      recipientType: 'FARMER',
      investorProfileId: null,
      farmerProfileId: deal.farmerProfileId,
      userId: deal.farmerProfile.userId,
      amount: farmerProfit,
      percentage: farmerSharePercent,
    });

    const channelAccounts = await this.ledgerService.ensureAccounts([
      SALES_REVENUE_ACCOUNT,
      PROJECT_EXPENSE_ACCOUNT,
      INCOME_SUMMARY_ACCOUNT,
      PLATFORM_FEE_REVENUE_ACCOUNT,
      investorPayableAccountFor(dealId),
        farmerPayableAccountFor(dealId),
    ]);

    const accounts = {
      revenue: channelAccounts[0],
      expense: channelAccounts[1],
      incomeSummary: channelAccounts[2],
      platformFee: channelAccounts[3],
      investorPayable: channelAccounts[4],
      farmerPayable: channelAccounts[5],
    };

    const calculation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.profitCalculation.create({
        data: {
          dealId,
          totalRevenue,
          totalExpenses,
          grossProfit,
          platformFees,
          distributableProfit,
          investorSharePercent: deal.investorSharePercent,
          farmerSharePercent: deal.farmerSharePercent,
          investorProfit,
          farmerProfit,
          calculatedBy: null,
          metadata: {
            approvedExpenseIds: dto.approvedExpenseIds ?? [],
          } as Prisma.InputJsonValue,
        },
      });

      for (const allocation of allocations) {
        await tx.profitDistribution.create({
          data: {
            profitCalculationId: created.id,
            dealId,
            investorProfileId: allocation.investorProfileId,
            farmerProfileId: allocation.farmerProfileId,
            recipientType: allocation.recipientType,
            amount: allocation.amount,
            percentage: allocation.percentage,
            status: DistributionStatus.PENDING,
          },
        });
      }

      await this.ledgerService.createTransaction(
        {
          referenceType: 'PROFIT_CALCULATION',
          referenceId: created.id,
          description: `Profit calculation for deal ${dealId}`,
          idempotencyKey: `profit-calc-ledger-${created.id}`,
          entries: [
            { accountId: accounts.revenue.id, debit: totalRevenue, currency: 'BDT' },
            { accountId: accounts.incomeSummary.id, credit: totalRevenue, currency: 'BDT' },
            { accountId: accounts.incomeSummary.id, debit: totalExpenses, currency: 'BDT' },
            { accountId: accounts.expense.id, credit: totalExpenses, currency: 'BDT' },
            { accountId: accounts.incomeSummary.id, debit: grossProfit, currency: 'BDT' },
            { accountId: accounts.platformFee.id, credit: platformFees, currency: 'BDT' },
            { accountId: accounts.investorPayable.id, credit: investorProfit, currency: 'BDT' },
            { accountId: accounts.farmerPayable.id, credit: farmerProfit, currency: 'BDT' },
          ],
        },
        tx,
      );

      return created;
    });

    await this.createNotification(
      deal.farmerProfile.userId,
      NotificationType.PROFIT_AVAILABLE,
      'Profit calculated',
      `A profit of ${grossProfit} BDT has been calculated for deal "${deal.title}".`,
      { dealId, calculationId: calculation.id },
    );

    return calculation;
  }

  async approveProfitCalculation(calculationId: string, adminId: string) {
    const calculation = await this.getCalculation(calculationId);
    if (calculation.approved) {
      throw new ConflictException(
        `Profit calculation ${calculationId} is already approved`,
      );
    }
    return this.prisma.profitCalculation.update({
      where: { id: calculationId },
      data: {
        approved: true,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
  }

  /**
   * Executes an approved profit calculation: pays each participant and books
   * the payables against cash.
   */
  async distributeProfit(calculationId: string) {
    const calculation = await this.getCalculation(calculationId);
    if (!calculation.approved) {
      throw new ConflictException(
        `Profit calculation ${calculationId} must be approved before distribution`,
      );
    }

    const distributions = await this.prisma.profitDistribution.findMany({
      where: { profitCalculationId: calculationId },
      include: {
        deal: true,
        investorProfile: { include: { user: true } },
        farmerProfile: { include: { user: true } },
      },
    });
    if (distributions.length === 0) {
      throw new BadRequestException(
        `Profit calculation ${calculationId} has no distributions`,
      );
    }

    const processed: Array<{ id: string; recipientType: RecipientType; amount: string }> = [];
    const cashAccount = await this.ledgerService.ensureAccount(CASH_ACCOUNT);

    for (const distribution of distributions) {
      if (distribution.status === DistributionStatus.COMPLETED) {
        continue;
      }
      if (distribution.recipientType === 'PLATFORM') {
        continue;
      }

      const amount = distribution.amount.toString();
      const payable = await this.ledgerService.ensureAccount(
        distribution.recipientType === 'FARMER'
          ? farmerPayableAccountFor(distribution.dealId)
          : investorPayableAccountFor(distribution.dealId),
      );

      const recipientUserId =
        distribution.recipientType === 'FARMER'
          ? distribution.farmerProfile?.user?.id
          : distribution.investorProfile?.user?.id;
      if (!recipientUserId) {
        this.logger.warn(
          `Skipping profit distribution ${distribution.id}: no recipient user resolves`,
        );
        continue;
      }

      const payment = await this.prisma.payment.create({
        data: {
          userId: recipientUserId,
          amount,
          currency: 'BDT',
          provider: 'profit-distribution',
          providerReference: distribution.id,
          status: 'COMPLETED',
          idempotencyKey: `profit-distribution-payment-${distribution.id}`,
          metadata: { profitCalculationId: calculationId, dealId: distribution.dealId },
        },
      });

      await this.ledgerService.createTransaction({
        referenceType: 'PROFIT_DISTRIBUTION',
        referenceId: distribution.id,
        description: `Profit distribution of ${amount} (${distribution.recipientType}) for deal ${distribution.dealId}`,
        idempotencyKey: `profit-distribution-ledger-${distribution.id}`,
        entries: [
          { accountId: payable.id, debit: amount, currency: 'BDT' },
          { accountId: cashAccount.id, credit: amount, currency: 'BDT' },
        ],
      });

      const txHash = await this.recordBlockchainDistribution(distribution.id, amount);

      await this.prisma.profitDistribution.update({
        where: { id: distribution.id },
        data: {
          status: DistributionStatus.COMPLETED,
          paymentId: payment.id,
          blockchainTxHash: txHash ?? null,
          distributedAt: new Date(),
        },
      });

      processed.push({
        id: distribution.id,
        recipientType: distribution.recipientType,
        amount,
      });

      const distributionRecipientUserId =
        distribution.recipientType === 'FARMER'
          ? distribution.farmerProfile?.user?.id
          : distribution.investorProfile?.user?.id;
      if (distributionRecipientUserId) {
        await this.createNotification(
          distributionRecipientUserId,
          NotificationType.PROFIT_DISTRIBUTED,
          'Profit distributed',
          `You received a profit distribution of ${amount} BDT from deal "${distribution.deal.title}".`,
          { dealId: distribution.dealId, amount },
        );
      }
    }

    await this.prisma.deal.update({
      where: { id: calculation.dealId },
      data: { status: 'SETTLED' },
    });

    return { calculationId, processed };
  }

  async getProfitCalculations(dealId: string, query: ProfitQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ProfitCalculationWhereInput = { dealId };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.profitCalculation.findMany({
        where,
        include: {
          deal: { select: { id: true, title: true, status: true } },
          _count: { select: { profitDistributions: true } },
        },
        orderBy: { calculatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.profitCalculation.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAllProfitCalculations(query: ProfitQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.profitCalculation.findMany({
        include: {
          deal: { select: { id: true, title: true, status: true } },
          _count: { select: { profitDistributions: true } },
        },
        orderBy: { calculatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.profitCalculation.count(),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCalculation(calculationId: string) {
    const calculation = await this.prisma.profitCalculation.findUnique({
      where: { id: calculationId },
      include: { deal: { include: { project: true } } },
    });
    if (!calculation) {
      throw new NotFoundException(
        `Profit calculation ${calculationId} not found`,
      );
    }
    return calculation;
  }

  async getDistributions(profitCalculationId: string) {
    await this.getCalculation(profitCalculationId);
    return this.prisma.profitDistribution.findMany({
      where: { profitCalculationId },
      include: {
        deal: { select: { id: true, title: true } },
        investorProfile: { include: { user: { select: { id: true, email: true } } } },
        farmerProfile: { include: { user: { select: { id: true, email: true } } } },
        payment: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getProfitSummary(dealId: string) {
    const latest = await this.prisma.profitCalculation.findMany({
      where: { dealId },
      orderBy: { calculatedAt: 'desc' },
      take: 1,
      include: { profitDistributions: true },
    });

    const distributions = latest[0]
      ? await this.prisma.profitDistribution.findMany({
          where: { profitCalculationId: latest[0].id },
        })
      : [];

    return {
      dealId,
      currentCalculation: latest[0] ?? null,
      totals: {
        totalProfitsCalculated: (
          await this.prisma.profitCalculation.count({ where: { dealId } })
        ),
        totalProfitDistributed: distributions.reduce(
          (sum, d) => add(sum, d.amount.toString()),
          ZERO,
        ),
        totalProfitPending: distributions.reduce(
          (sum, d) =>
            d.status === DistributionStatus.PENDING
              ? add(sum, d.amount.toString())
              : sum,
          ZERO,
        ),
      },
    };
  }

  private async sumRevenues(projectId: string): Promise<string> {
    const result = await this.prisma.revenue.aggregate({
      _sum: { amount: true },
      where: { projectId },
    });
    return result._sum.amount?.toString() ?? ZERO;
  }

  private async sumApprovedExpenses(
    projectId: string,
    approvedExpenseIds: string[],
  ): Promise<string> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        projectId,
        approved: true,
        ...(approvedExpenseIds.length > 0
          ? { id: { in: approvedExpenseIds } }
          : {}),
      },
    });
    return expenses.reduce(
      (sum, e) => add(sum, e.amount.toString()),
      ZERO,
    );
  }

  private async recordBlockchainDistribution(
    distributionId: string,
    amount: string,
  ): Promise<string | null> {
    const enabled = this.configService.get<string>(
      'BLOCKCHAIN_MOCK_ENABLED',
      'true',
    );
    if (enabled !== 'true') {
      return null;
    }
    const txHash = `0x${randomBytes(32).toString('hex')}`;
    await this.prisma.blockchainTransaction.create({
      data: {
        txHash,
        chainId: Number(this.configService.get<string>('CHAIN_ID', '80002')),
        fromAddress: this.configService.get<string>(
          'PLATFORM_WALLET_ADDRESS',
          '0x0000000000000000000000000000000000000000',
        ),
        toAddress: this.configService.get<string>(
          'SETTLEMENT_WALLET_ADDRESS',
          '0x0000000000000000000000000000000000000000',
        ),
        value: amount,
        status: BlockchainTxStatus.CONFIRMED,
        relatedEntityType: 'PROFIT_DISTRIBUTION',
        relatedEntityId: distributionId,
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

// Ledger account resolution helpers (kept as functions to stay type-safe).
function toPercent(input: string): string {
  return round(input);
}

function percentOf(amount: string, percent: string): string {
  return divide(multiply(amount, percent), '100');
}