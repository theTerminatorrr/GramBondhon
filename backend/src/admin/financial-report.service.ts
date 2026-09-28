import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { SafeDecimal, toDecimal } from '../common/utils/decimal.util';
import {
  ExpenseReport,
  FinancialTotals,
  InvestmentReport,
  PeriodBucket,
  ProfitReport,
  ReportPeriod,
  RevenueReport,
  SettlementReport,
} from './interfaces/admin.interface';
import {
  ExportReportQueryDto,
  FinancialReportQueryDto,
} from './dto/admin-dashboard-query.dto';
import { AdminBaseService } from './admin-base.service';

@Injectable()
export class FinancialReportService extends AdminBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getRevenueReport(query: FinancialReportQueryDto = {}): Promise<RevenueReport> {
    const { where, filters, dateField } = await this.buildFilters(query, 'receivedAt');
    const rows = await this.prisma.revenue.findMany({
      where: where as Prisma.RevenueWhereInput,
      select: {
        id: true,
        amount: true,
        receivedAt: true,
        projectId: true,
        source: true,
        project: {
          select: {
            name: true,
            farmerProfile: { select: { id: true, businessName: true } },
          },
        },
      },
    });

    const period = query.period ?? 'month';
    const totals = { amount: '0', count: rows.length };
    const periodMap = new Map<string, { amount: SafeDecimal; count: number }>();
    const projectMap = new Map<string, { amount: SafeDecimal; count: number }>();
    const farmerMap = new Map<string, { amount: SafeDecimal; count: number }>();
    let totalAmount = toDecimal(0);

    for (const row of rows) {
      totalAmount = totalAmount.plus(toDecimal(row.amount));
      const pKey = this.periodKey(dateField(row), period);
      upsert(periodMap, pKey, row.amount);
      upsert(projectMap, row.projectId, row.amount);
      const farmerId = row.project.farmerProfile?.id ?? 'unknown';
      upsert(farmerMap, farmerId, row.amount);
    }

    return {
      filters,
      totals: toTotals(new SafeDecimal(totalAmount.toString()), rows.length),
      byPeriod: mapToPeriodBuckets(periodMap),
      byProject: mapToBuckets(projectMap, (id, data) => ({
        projectId: id,
        projectName: rows.find((r) => r.projectId === id)?.project.name ?? id,
        amount: data.amount.toFixed(),
        count: data.count,
      })),
      byFarmer: mapToBuckets(farmerMap, (id, data) => {
        const row = rows.find((r) => r.project.farmerProfile?.id === id);
        return {
          farmerId: id,
          farmerName: row?.project.farmerProfile?.businessName ?? 'Unknown',
          amount: data.amount.toFixed(),
          count: data.count,
        };
      }),
    };
  }

  async getExpenseReport(query: FinancialReportQueryDto = {}): Promise<ExpenseReport> {
    const { where, filters, dateField } = await this.buildFilters(query, 'incurredAt');
    const rows = await this.prisma.expense.findMany({
      where: where as Prisma.ExpenseWhereInput,
      select: {
        id: true,
        amount: true,
        incurredAt: true,
        category: true,
        projectId: true,
        project: { select: { name: true } },
      },
    });

    const period = query.period ?? 'month';
    const periodMap = new Map<string, { amount: SafeDecimal; count: number }>();
    const categoryMap = new Map<string, { amount: SafeDecimal; count: number }>();
    const projectMap = new Map<string, { amount: SafeDecimal; count: number }>();
    let totalAmount = toDecimal(0);

    for (const row of rows) {
      totalAmount = totalAmount.plus(toDecimal(row.amount));
      const pKey = this.periodKey(dateField(row), period);
      upsert(periodMap, pKey, row.amount);
      upsert(categoryMap, row.category, row.amount);
      upsert(projectMap, row.projectId, row.amount);
    }

    return {
      filters,
      totals: toTotals(new SafeDecimal(totalAmount.toString()), rows.length),
      byPeriod: mapToPeriodBuckets(periodMap),
      byCategory: mapToBuckets(categoryMap, (category, data) => ({
        category,
        amount: data.amount.toFixed(),
        count: data.count,
      })),
      byProject: mapToBuckets(projectMap, (id, data) => ({
        projectId: id,
        projectName: rows.find((r) => r.projectId === id)?.project.name ?? id,
        amount: data.amount.toFixed(),
        count: data.count,
      })),
    };
  }

  async getProfitReport(query: FinancialReportQueryDto = {}): Promise<ProfitReport> {
    const { where, filters } = await this.buildFilters(query, 'calculatedAt');
    const rows = await this.prisma.profitCalculation.findMany({
      where: where as Prisma.ProfitCalculationWhereInput,
      select: {
        id: true,
        dealId: true,
        grossProfit: true,
        platformFees: true,
        distributableProfit: true,
        investorProfit: true,
        farmerProfit: true,
        calculatedAt: true,
        deal: { select: { title: true } },
      },
    });

    const dealMap = new Map<
      string,
      {
        dealTitle: string;
        grossProfit: SafeDecimal;
        platformFees: SafeDecimal;
        investorProfit: SafeDecimal;
        farmerProfit: SafeDecimal;
        calculationCount: number;
      }
    >();
    let total = {
      grossProfit: toDecimal(0),
      platformFees: toDecimal(0),
      distributableProfit: toDecimal(0),
      investorProfit: toDecimal(0),
      farmerProfit: toDecimal(0),
      calculationCount: 0,
    };

    for (const row of rows) {
      total.grossProfit = total.grossProfit.plus(toDecimal(row.grossProfit));
      total.platformFees = total.platformFees.plus(toDecimal(row.platformFees));
      total.distributableProfit = total.distributableProfit.plus(
        toDecimal(row.distributableProfit),
      );
      total.investorProfit = total.investorProfit.plus(toDecimal(row.investorProfit));
      total.farmerProfit = total.farmerProfit.plus(toDecimal(row.farmerProfit));
      total.calculationCount += 1;

      const entry =
        dealMap.get(row.dealId) ?? {
          dealTitle: row.deal.title,
          grossProfit: new SafeDecimal(0),
          platformFees: new SafeDecimal(0),
          investorProfit: new SafeDecimal(0),
          farmerProfit: new SafeDecimal(0),
          calculationCount: 0,
        };
      entry.grossProfit = entry.grossProfit.plus(toDecimal(row.grossProfit));
      entry.platformFees = entry.platformFees.plus(toDecimal(row.platformFees));
      entry.investorProfit = entry.investorProfit.plus(toDecimal(row.investorProfit));
      entry.farmerProfit = entry.farmerProfit.plus(toDecimal(row.farmerProfit));
      entry.calculationCount += 1;
      dealMap.set(row.dealId, entry);
    }

    return {
      filters,
      totals: {
        grossProfit: total.grossProfit.toFixed(),
        platformFees: total.platformFees.toFixed(),
        distributableProfit: total.distributableProfit.toFixed(),
        investorProfit: total.investorProfit.toFixed(),
        farmerProfit: total.farmerProfit.toFixed(),
        calculationCount: total.calculationCount,
      },
      byDeal: Array.from(dealMap.entries()).map(([dealId, d]) => ({
        dealId,
        dealTitle: d.dealTitle,
        grossProfit: d.grossProfit.toFixed(),
        platformFees: d.platformFees.toFixed(),
        investorProfit: d.investorProfit.toFixed(),
        farmerProfit: d.farmerProfit.toFixed(),
        calculationCount: d.calculationCount,
      })),
    };
  }

  async getSettlementReport(query: FinancialReportQueryDto = {}): Promise<SettlementReport> {
    const { where, filters, dateField } = await this.buildFilters(query, 'createdAt');
    const rows = await this.prisma.settlement.findMany({
      where: where as Prisma.SettlementWhereInput,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        status: true,
        type: true,
      },
    });

    const period = query.period ?? 'month';
    const periodMap = new Map<string, { amount: SafeDecimal; count: number }>();
    const statusMap = new Map<string, { amount: SafeDecimal; count: number }>();
    const typeMap = new Map<string, { amount: SafeDecimal; count: number }>();
    let totalAmount = toDecimal(0);

    for (const row of rows) {
      totalAmount = totalAmount.plus(toDecimal(row.amount));
      this.periodKey(dateField(row), period);
      upsert(periodMap, this.periodKey(dateField(row), period), row.amount);
      upsert(statusMap, row.status, row.amount);
      upsert(typeMap, row.type, row.amount);
    }

    return {
      filters,
      totals: toTotals(new SafeDecimal(totalAmount.toString()), rows.length),
      byPeriod: mapToPeriodBuckets(periodMap),
      byStatus: mapToRecord(statusMap),
      byType: mapToRecord(typeMap),
    };
  }

  async getInvestmentReport(query: FinancialReportQueryDto = {}): Promise<InvestmentReport> {
    const { where, filters, dateField } = await this.buildFilters(query, 'createdAt');
    const rows = await this.prisma.investment.findMany({
      where: where as Prisma.InvestmentWhereInput,
      select: {
        id: true,
        amount: true,
        units: true,
        createdAt: true,
        status: true,
      },
    });

    const period = query.period ?? 'month';
    const periodMap = new Map<string, { amount: SafeDecimal; count: number }>();
    const statusMap = new Map<string, { amount: SafeDecimal; count: number }>();
    let totalAmount = toDecimal(0);
    let totalUnits = 0;

    for (const row of rows) {
      totalAmount = totalAmount.plus(toDecimal(row.amount));
      totalUnits += row.units;
      upsert(periodMap, this.periodKey(dateField(row), period), row.amount);
      upsert(statusMap, row.status, row.amount);
    }

    return {
      filters,
      totals: {
        count: rows.length,
        amount: totalAmount.toFixed(),
        units: totalUnits,
      },
      byPeriod: mapToPeriodBuckets(periodMap),
      byStatus: mapToRecord(statusMap),
    };
  }

  async exportReport(query: ExportReportQueryDto) {
    const rows = await this.getReportData(query);

    if (query.format === 'json') {
      return {
        data: {
          type: query.type,
          generatedAt: new Date().toISOString(),
          ...rows,
        },
      };
    }

    const headers = csvHeadersFor(query.type);
    const csv = [headers.join(','), ...rows.map((row) => this.csvRow(headers, row))].join('\n');

    return {
      contentType: 'text/csv',
      filename: `admin-${query.type}-report-${new Date().toISOString().slice(0, 10)}.csv`,
      content: csv,
    };
  }

  // ─────────────────────── helpers ───────────────────────

  private async buildFilters(
    query: FinancialReportQueryDto,
    defaultDateField: string,
  ): Promise<{
    where: Record<string, unknown>;
    filters: Record<string, unknown>;
    dateField: (row: Record<string, unknown>) => Date;
  }> {
    const filters: Record<string, unknown> = {};
    const where: Record<string, unknown> = {};

    if (query.from || query.to) {
      where[defaultDateField] = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
      filters[defaultDateField] = { from: query.from, to: query.to };
    }

    if (query.projectId) {
      where.projectId = query.projectId;
      filters.projectId = query.projectId;
    }
    if (query.farmerId) {
      const projectIds = await this.projectIdsForFarmer(query.farmerId);
      if (projectIds.length > 0) {
        where.projectId = { in: projectIds };
      }
      filters.farmerId = query.farmerId;
    }
    if (query.dealId) {
      const deal = await this.prisma.deal.findUnique({
        where: { id: query.dealId },
        select: { projectId: true },
      });
      if (!deal) {
        filters.dealId = query.dealId;
        where.id = '__no_such_record__';
      } else {
        if (where.projectId) {
          if (Array.isArray(where.projectId)) {
            (where.projectId as string[]).push(deal.projectId);
          } else if ((where.projectId as { in?: string[] }).in) {
            (where.projectId as { in: string[] }).in.push(deal.projectId);
          } else {
            where.projectId = { in: [deal.projectId] };
          }
        } else {
          where.projectId = deal.projectId;
        }
        filters.dealId = query.dealId;
      }
    }

    return {
      where,
      filters,
      dateField: (row) => {
        const value = row[defaultDateField];
        return toDate(value);
      },
    };
  }

  private async projectIdsForFarmer(farmerId: string): Promise<string[]> {
    if (!farmerId) {
      return [];
    }
    const projects = await this.prisma.agriculturalProject.findMany({
      where: { farmerProfileId: farmerId },
      select: { id: true },
    });
    return projects.map((p) => p.id);
  }

  private periodKey(date: Date, period: ReportPeriod): string {
    switch (period) {
      case 'day':
        return date.toISOString().slice(0, 10);
      case 'week': {
        const d = new Date(date);
        const day = (d.getUTCDay() + 6) % 7; // Monday start
        d.setUTCDate(d.getUTCDate() - day);
        return d.toISOString().slice(0, 10);
      }
      case 'month':
        return date.toISOString().slice(0, 7);
      case 'year':
        return date.toISOString().slice(0, 4);
      default:
        return date.toISOString().slice(0, 7);
    }
  }

  private async getReportData(query: ExportReportQueryDto): Promise<Record<string, unknown>[]> {
    const base: FinancialReportQueryDto = {
      from: query.from,
      to: query.to,
      projectId: query.projectId,
      dealId: query.dealId,
    };

    switch (query.type) {
      case 'revenue': {
        const report = await this.getRevenueReport({ ...base, period: 'month' });
        return report.byPeriod.map((b) => ({ period: b.period, amount: b.amount, count: b.count }));
      }
      case 'expenses': {
        const report = await this.getExpenseReport({ ...base, period: 'month' });
        return report.byPeriod.map((b) => ({ period: b.period, amount: b.amount, count: b.count }));
      }
      case 'profit': {
        const report = await this.getProfitReport(base);
        return report.byDeal.map((d) => ({
          dealId: d.dealId,
          deal: d.dealTitle,
          grossProfit: d.grossProfit,
          platformFees: d.platformFees,
          investorProfit: d.investorProfit,
          farmerProfit: d.farmerProfit,
        }));
      }
      case 'settlements': {
        const report = await this.getSettlementReport({ ...base, period: 'month' });
        return Object.entries(report.byStatus).map(([status, data]) => ({
          status,
          amount: data.amount,
          count: data.count,
        }));
      }
      case 'investments':
      default: {
        const report = await this.getInvestmentReport({ ...base, period: 'month' });
        return report.byPeriod.map((b) => ({ period: b.period, amount: b.amount, count: b.count }));
      }
    }
  }

  private csvRow(headers: string[], row: Record<string, unknown>): string {
    return headers
      .map((header) => {
        const value = row[header] ?? '';
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      })
      .join(',');
  }
}

function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return new Date();
}

function upsert(
  map: Map<string, { amount: SafeDecimal; count: number }>,
  key: string,
  amount: unknown,
): void {
  const existing = map.get(key) ?? { amount: new SafeDecimal(0), count: 0 };
  existing.amount = existing.amount.add(toDecimal(amount));
  existing.count += 1;
  map.set(key, existing);
}

function toTotals(amount: SafeDecimal, count: number): FinancialTotals {
  return { amount: amount.toFixed(), count };
}

function mapToPeriodBuckets(
  map: Map<string, { amount: SafeDecimal; count: number }>,
): PeriodBucket[] {
  return Array.from(map.entries()).map(([period, data]) => ({
    period,
    amount: data.amount.toFixed(),
    count: data.count,
  }));
}

function mapToBuckets<T>(
  map: Map<string, { amount: SafeDecimal; count: number }>,
  mapper: (key: string, data: { amount: SafeDecimal; count: number }) => T,
): T[] {
  return Array.from(map.entries()).map(([key, data]) => mapper(key, data));
}

function mapToRecord(
  map: Map<string, { amount: SafeDecimal; count: number }>,
): Record<string, { amount: string; count: number }> {
  const out: Record<string, { amount: string; count: number }> = {};
  for (const [key, data] of map.entries()) {
    out[key] = { amount: data.amount.toFixed(), count: data.count };
  }
  return out;
}

function csvHeadersFor(
  type: 'revenue' | 'expenses' | 'profit' | 'settlements' | 'investments',
): string[] {
  switch (type) {
    case 'revenue':
      return ['period', 'amount', 'count'];
    case 'expenses':
      return ['period', 'amount', 'count'];
    case 'profit':
      return ['dealId', 'deal', 'grossProfit', 'platformFees', 'investorProfit', 'farmerProfit'];
    case 'settlements':
      return ['status', 'amount', 'count'];
    case 'investments':
    default:
      return ['period', 'amount', 'count'];
  }
}