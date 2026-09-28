import { Injectable } from '@nestjs/common';
import { InvestmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { add, toDecimal } from '../common/utils/decimal.util';
import { AdminDashboardQueryDto, AuditLogQueryDto } from './dto/admin-dashboard-query.dto';
import {
  AdminAuditLogEntry,
  DashboardActivityItem,
  DashboardStats,
  DetailedStats,
  MonthlyTrend,
  StatusCount,
} from './interfaces/admin.interface';
import { AdminBaseService } from './admin-base.service';

@Injectable()
export class AdminService extends AdminBaseService {
  constructor(
    prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
  ) {
    super(prisma);
  }

  async getDashboard(query: AdminDashboardQueryDto = {}): Promise<DashboardStats> {
    const {
      farmers,
      investors,
      projects,
      deals,
      investments,
      revenue,
      expenses,
      profit,
      blockchain,
    } = await this.getCounts();

    const [recentActivity, monthlyTrends] = await Promise.all([
      this.getRecentActivity(10),
      this.getMonthlyTrends(query),
    ]);

    const financials = {
      revenue: fix(revenue),
      expenses: fix(expenses),
      profit: fix(profit.gross ?? 0),
      profitMarginPercent: null as number | null,
    };
    if (!toDecimal(revenue).isZero()) {
      financials.profitMarginPercent = Number(
        toDecimal(financials.profit).div(toDecimal(revenue)).times(100).toFixed(2),
      );
    }

    return {
      farmers: {
        total: farmers.total,
        verified: farmers.byStatus.VERIFIED ?? 0,
        pending: farmers.byStatus.PENDING ?? 0,
        rejected: farmers.byStatus.REJECTED ?? 0,
      },
      investors: {
        total: investors.total,
        verified: investors.byStatus.VERIFIED ?? 0,
        pending: investors.byStatus.PENDING ?? 0,
        rejected: investors.byStatus.REJECTED ?? 0,
        notStarted: investors.byStatus.NOT_STARTED ?? 0,
      },
      projects: {
        total: projects.total,
        underReview: (projects.byStatus.SUBMITTED ?? 0) + (projects.byStatus.UNDER_REVIEW ?? 0),
        byStatus: projects.byStatus,
      },
      deals: {
        total: deals.total,
        pendingReview: (deals.byStatus.SUBMITTED ?? 0) + (deals.byStatus.UNDER_REVIEW ?? 0),
        active: (deals.byStatus.ACTIVE ?? 0) + (deals.byStatus.FUNDED ?? 0) + (deals.byStatus.FUNDING ?? 0),
        byStatus: deals.byStatus,
      },
      investments: {
        total: investments.total,
        confirmed: (investments.byStatus.CONFIRMED ?? 0) + (investments.byStatus.ACTIVE ?? 0),
        totalAmount: fix(investments.sum),
        confirmedAmount: fix(investments.sumConfirmed),
      },
      financials,
      blockchain: {
        transactions: blockchain.total,
        pending: blockchain.byStatus.PENDING ?? 0,
        confirmed: (blockchain.byStatus.CONFIRMED ?? 0) + (blockchain.byStatus.SUBMITTED ?? 0),
        failed: (blockchain.byStatus.FAILED ?? 0) + (blockchain.byStatus.REVERTED ?? 0),
      },
      recentActivity,
      monthlyTrends,
      generatedAt: new Date(),
    };
  }

  async getDetailedStats(): Promise<DetailedStats> {
    const [users, farmers, investors, projects, deals, investments, payments, settlements, withdrawals, blockchainTransactions] =
      await Promise.all([
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { _all: true },
        }),
        this.prisma.farmerProfile.groupBy({
          by: ['verificationStatus'],
          _count: { _all: true },
        }),
        this.prisma.investorProfile.groupBy({
          by: ['kycStatus', 'investorType'],
          _count: { _all: true },
        }),
        this.prisma.agriculturalProject.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.deal.findMany({
          select: {
            id: true,
            title: true,
            status: true,
            fundingTarget: true,
            totalInvested: true,
            farmerProfile: { select: { id: true, businessName: true } },
          },
        }),
        this.prisma.investment.groupBy({
          by: ['status'],
          _count: { _all: true },
          _sum: { amount: true },
        }),
        this.prisma.payment.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.settlement.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.withdrawal.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.blockchainTransaction.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
      ]);

    const dealsByStatus: Record<string, number> = {};
    for (const deal of deals) {
      dealsByStatus[deal.status] = (dealsByStatus[deal.status] ?? 0) + 1;
    }

    const investmentsByStatus: Record<string, number> = {};
    const investmentsByStatusAmount: Record<string, string> = {};
    let investmentsSum = toDecimal(0);
    for (const group of investments) {
      investmentsByStatus[group.status] = group._count._all;
      investmentsByStatusAmount[group.status] = fix(group._sum.amount ?? 0);
      investmentsSum = investmentsSum.plus(toDecimal(group._sum.amount ?? 0));
    }

    const topDeals = deals
      .map((deal) => ({
        id: deal.id,
        title: deal.title,
        status: deal.status,
        totalInvested: deal.totalInvested.toString(),
        fundingTarget: deal.fundingTarget.toString(),
        fundingPercentage: toDecimal(deal.fundingTarget).isZero()
          ? 0
          : Number(
              toDecimal(deal.totalInvested)
                .div(toDecimal(deal.fundingTarget))
                .times(100)
                .toFixed(2),
            ),
        farmerName: deal.farmerProfile?.businessName ?? null,
      }))
      .sort((a, b) => toDecimal(b.totalInvested).comparedTo(toDecimal(a.totalInvested)))
      .slice(0, 10);

    const [topInvestors, recentFunding] = await Promise.all([
      this.prisma.investment.groupBy({
        by: ['investorProfileId'],
        _count: { _all: true },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 10,
      }),
      this.prisma.investment.findMany({
        orderBy: { confirmedAt: 'desc' },
        take: 10,
        where: { confirmedAt: { not: null } },
        select: {
          id: true,
          dealId: true,
          amount: true,
          status: true,
          confirmedAt: true,
          deal: { select: { title: true } },
          investorProfile: {
            select: {
              id: true,
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
    ]);

    const investorNames = await this.prisma.investorProfile.findMany({
      where: { id: { in: topInvestors.map((i) => i.investorProfileId) } },
      select: {
        id: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    const nameById = new Map(investorNames.map((n) => [n.id, n.user]));

    return {
      users: toStatusCounts(users, (g) => g.role),
      farmers: {
        total: farmers.reduce((s, g) => s + g._count._all, 0),
        byVerificationStatus: toRecord(farmers, (g) => g.verificationStatus),
      },
      investors: {
        total: investors.reduce((s, g) => s + g._count._all, 0),
        byKycStatus: toRecord(investors, (g) => g.kycStatus),
        byType: toRecord(investors, (g) => g.investorType),
      },
      projects: {
        total: projects.reduce((s, g) => s + g._count._all, 0),
        byStatus: toRecord(projects, (g) => g.status),
      },
      deals: {
        total: deals.length,
        active: (dealsByStatus.ACTIVE ?? 0) + (dealsByStatus.FUNDED ?? 0) + (dealsByStatus.FUNDING ?? 0),
        funded: dealsByStatus.FUNDED ?? 0,
        byStatus: dealsByStatus,
      },
      investments: {
        byStatus: investmentsByStatus,
        byStatusAmount: investmentsByStatusAmount,
        total: investments.reduce((s, g) => s + g._count._all, 0),
        totalAmount: investmentsSum.toFixed(),
      },
      payments: {
        byStatus: toRecord(payments, (g) => g.status),
        total: payments.reduce((s, g) => s + g._count._all, 0),
        failed: payments.filter((g) => g.status === 'FAILED').reduce((s, g) => s + g._count._all, 0),
      },
      settlements: {
        byStatus: toRecord(settlements, (g) => g.status),
        total: settlements.reduce((s, g) => s + g._count._all, 0),
      },
      withdrawals: {
        byStatus: toRecord(withdrawals, (g) => g.status),
        total: withdrawals.reduce((s, g) => s + g._count._all, 0),
        pending: withdrawals.find((g) => g.status === 'PENDING')?._count._all ?? 0,
      },
      blockchain: {
        byStatus: toRecord(blockchainTransactions, (g) => g.status),
        total: blockchainTransactions.reduce((s, g) => s + g._count._all, 0),
      },
      topDeals,
      topInvestors: topInvestors.map((investor) => ({
        investorProfileId: investor.investorProfileId,
        investorName: (() => {
          const user = nameById.get(investor.investorProfileId);
          return user ? `${user.firstName} ${user.lastName} (${user.email})` : 'Unknown';
        })(),
        totalInvested: fix(investor._sum.amount ?? 0),
        investmentCount: investor._count._all,
      })),
      recentFunding: recentFunding.map((f) => ({
        id: f.id,
        dealId: f.dealId,
        dealTitle: f.deal.title,
        investorName: `${f.investorProfile.user.firstName} ${f.investorProfile.user.lastName}`,
        amount: f.amount.toString(),
        status: f.status,
        confirmedAt: f.confirmedAt,
      })),
      generatedAt: new Date(),
    };
  }

  async getAuditLogs(query: AuditLogQueryDto = new AuditLogQueryDto()) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
    };

    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const enriched: AdminAuditLogEntry[] = items.map((item) => ({
      id: item.id,
      actorId: item.actorId,
      actorEmail: item.actorEmail,
      actorRole: item.actorRole,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      oldValues: item.oldValues as Record<string, unknown> | null,
      newValues: item.newValues as Record<string, unknown> | null,
      ipAddress: item.ipAddress,
      userAgent: item.userAgent,
      createdAt: item.createdAt,
    }));

    return {
      data: enriched,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async getCounts() {
    const [
      farmerGroups,
      farmerTotal,
      investorGroups,
      investorTotal,
      projectGroups,
      projectTotal,
      dealGroups,
      dealTotal,
      investmentGroups,
      investmentSum,
      investmentConfirmedAgg,
      revenueAgg,
      expenseAgg,
      profitAgg,
      blockchainGroups,
      blockchainTotal,
    ] = await Promise.all([
      this.prisma.farmerProfile.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
      this.prisma.farmerProfile.count(),
      this.prisma.investorProfile.groupBy({ by: ['kycStatus'], _count: { _all: true } }),
      this.prisma.investorProfile.count(),
      this.prisma.agriculturalProject.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.agriculturalProject.count(),
      this.prisma.deal.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.deal.count(),
      this.prisma.investment.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.investment.aggregate({ _sum: { amount: true } }),
      this.prisma.investment.aggregate({
        where: { status: { in: [InvestmentStatus.CONFIRMED, InvestmentStatus.ACTIVE] } },
        _sum: { amount: true },
      }),
      this.prisma.revenue.aggregate({ _sum: { amount: true } }),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
      this.prisma.profitCalculation.aggregate({ _sum: { grossProfit: true } }),
      this.prisma.blockchainTransaction.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.blockchainTransaction.count(),
    ]);

    return {
      farmers: {
        total: farmerTotal,
        byStatus: toRecord(farmerGroups, (g) => g.verificationStatus),
      },
      investors: {
        total: investorTotal,
        byStatus: toRecord(investorGroups, (g) => g.kycStatus),
      },
      projects: { total: projectTotal, byStatus: toRecord(projectGroups, (g) => g.status) },
      deals: { total: dealTotal, byStatus: toRecord(dealGroups, (g) => g.status) },
      investments: {
        total: investmentGroups.reduce((s, g) => s + g._count._all, 0),
        sum: fix(investmentSum._sum.amount ?? 0),
        sumConfirmed: fix(investmentConfirmedAgg._sum.amount ?? 0),
        byStatus: toRecord(investmentGroups, (g) => g.status),
      },
      revenue: fix(revenueAgg._sum.amount ?? 0),
      expenses: fix(expenseAgg._sum.amount ?? 0),
      profit: {
        gross: fix(profitAgg._sum.grossProfit ?? 0),
        basicRevenue: fix(revenueAgg._sum.amount ?? 0),
      },
      blockchain: {
        total: blockchainTotal,
        byStatus: toRecord(blockchainGroups, (g) => g.status),
      },
    };
  }

  private async getRecentActivity(limit: number): Promise<DashboardActivityItem[]> {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        actorEmail: true,
        actorRole: true,
        createdAt: true,
      },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      createdAt: log.createdAt,
    }));
  }

  private async getMonthlyTrends(query: AdminDashboardQueryDto): Promise<MonthlyTrend[]> {
    const months = query.monthlyMonths ?? 6;
    const end = new Date();
    end.setUTCDate(1);
    end.setUTCHours(0, 0, 0, 0);
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (months - 1), 1));

    const [revenueRows, expenseRows, profitRows, investmentRows] = await Promise.all([
      this.prisma.revenue.findMany({
        where: { receivedAt: { gte: start, lte: end } },
        select: { amount: true, receivedAt: true },
      }),
      this.prisma.expense.findMany({
        where: { incurredAt: { gte: start, lte: end } },
        select: { amount: true, incurredAt: true },
      }),
      this.prisma.profitCalculation.findMany({
        where: { calculatedAt: { gte: start, lte: end } },
        select: { grossProfit: true, calculatedAt: true },
      }),
      this.prisma.investment.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { amount: true, createdAt: true },
      }),
    ]);

    const csv = new Map<string, { revenue: string; expenses: string; profit: string; investmentAmount: string; investmentCount: number }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      csv.set(key, { revenue: '0', expenses: '0', profit: '0', investmentAmount: '0', investmentCount: 0 });
    }

    for (const row of revenueRows) {
      const key = this.monthKey(row.receivedAt);
      const entry = csv.get(key);
      if (entry) entry.revenue = add(entry.revenue, row.amount);
    }
    for (const row of expenseRows) {
      const key = this.monthKey(row.incurredAt);
      const entry = csv.get(key);
      if (entry) entry.expenses = add(entry.expenses, row.amount);
    }
    for (const row of profitRows) {
      const key = this.monthKey(row.calculatedAt);
      const entry = csv.get(key);
      if (entry) entry.profit = add(entry.profit, row.grossProfit);
    }
    for (const row of investmentRows) {
      const key = this.monthKey(row.createdAt);
      const entry = csv.get(key);
      if (entry) {
        entry.investmentAmount = add(entry.investmentAmount, row.amount);
        entry.investmentCount += 1;
      }
    }

    return Array.from(csv.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({ month, ...data }));
  }

  private monthKey(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }
}

function toRecord<T extends { _count: { _all: number } }>(
  groups: T[],
  keyOf: (group: T) => string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const group of groups) {
    out[keyOf(group)] = group._count._all;
  }
  return out;
}

function toStatusCounts<
  T extends { _count: { _all: number } },
>(groups: T[], keyOf: (group: T) => string): StatusCount[] {
  return groups.map((g) => ({ status: keyOf(g), count: g._count._all }));
}

function fix(value: unknown): string {
  return toDecimal(value).toFixed();
}