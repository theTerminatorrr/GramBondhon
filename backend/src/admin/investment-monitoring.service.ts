import { Injectable, NotFoundException } from '@nestjs/common';
import { InvestmentStatus, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import {
  createPaginationQuery,
  paginate,
  PaginatedResult,
} from '../common/utils/pagination.util';
import { toDecimal, add, ZERO } from '../common/utils/decimal.util';
import { InvestmentAdminQueryDto } from './dto/admin-dashboard-query.dto';
import { AdminBaseService } from './admin-base.service';

export interface FlaggedInvestment {
  investmentId: string;
  reason: string;
  flaggedBy: string;
  flaggedAt: Date;
}

@Injectable()
export class InvestmentMonitoringService extends AdminBaseService {
  private readonly flagged = new Map<string, FlaggedInvestment>();

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getInvestments(query: InvestmentAdminQueryDto = new InvestmentAdminQueryDto()): Promise<PaginatedResult<unknown>> {
    const where: Prisma.InvestmentWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.dealId ? { dealId: query.dealId } : {}),
      ...(query.investorId ? { investorProfileId: query.investorId } : {}),
      ...(query.walletAddress?.trim()
        ? { walletAddress: { equals: query.walletAddress.trim() } }
        : {}),
    };

    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      where.amount = {
        ...(query.minAmount !== undefined ? { gte: new Prisma.Decimal(query.minAmount) } : {}),
        ...(query.maxAmount !== undefined ? { lte: new Prisma.Decimal(query.maxAmount) } : {}),
      };
    }

    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const { page, limit, skip, take, orderBy } = createPaginationQuery(
      query.page,
      query.limit,
      where as Record<string, unknown>,
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        defaultSortField: 'createdAt',
        allowedSortFields: ['createdAt', 'amount', 'status', 'confirmedAt', 'updatedAt'],
      },
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.investment.findMany({
        where: where as Prisma.InvestmentWhereInput,
        skip,
        take,
        orderBy: orderBy as Prisma.InvestmentOrderByWithRelationInput,
        include: {
          deal: {
            select: {
              id: true,
              title: true,
              status: true,
              fundingTarget: true,
              totalInvested: true,
            },
          },
          investorProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          payments: {
            select: { id: true, amount: true, status: true, createdAt: true },
          },
          _count: { select: { investmentUnits: true, investmentTransactions: true } },
        },
      }),
      this.prisma.investment.count({ where: where as Prisma.InvestmentWhereInput }),
    ]);

    const enriched = items.map((item) => ({
      ...item,
      flagged: this.flagged.has(item.id),
    }));

    return paginate(enriched, page, limit, total);
  }

  async getInvestmentDetail(investmentId: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        deal: {
          include: {
            project: true,
            farmerProfile: { include: { user: true } },
          },
        },
        investorProfile: { include: { user: true } },
        investmentUnits: true,
        investmentTransactions: { orderBy: { createdAt: 'desc' } },
        payments: true,
      },
    });
    if (!investment) {
      throw new NotFoundException(`Investment ${investmentId} not found`);
    }
    return {
      ...investment,
      flagged: this.flagged.get(investmentId) ?? null,
    };
  }

  async flagInvestment(investmentId: string, adminId: string, reason: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      select: { id: true, status: true, investorProfileId: true },
    });
    if (!investment) {
      throw new NotFoundException(`Investment ${investmentId} not found`);
    }

    this.flagged.set(investmentId, {
      investmentId,
      reason: reason.trim(),
      flaggedBy: adminId,
      flaggedAt: new Date(),
    });

    await this.createAuditLog({
      actorId: adminId,
      action: 'INVESTMENT_FLAGGED',
      entityType: 'Investment',
      entityId: investmentId,
      newValues: { reason: reason.trim() },
    });

    const investor = await this.prisma.investorProfile.findUnique({
      where: { id: investment.investorProfileId },
      select: { userId: true },
    });
    if (investor) {
      await this.createNotification(
        investor.userId,
        NotificationType.SYSTEM,
        'Investment flagged for review',
        `An investment on your account has been flagged for administrative review.`,
        { investmentId, reason: reason.trim() },
      );
    }

    this.logger.log(`Investment ${investmentId} flagged by admin ${adminId}`);
    return this.flagged.get(investmentId)!;
  }

  async unflagInvestment(investmentId: string, adminId: string) {
    const existing = this.flagged.get(investmentId);
    if (!existing) {
      throw new NotFoundException(`Investment ${investmentId} is not flagged`);
    }
    this.flagged.delete(investmentId);

    await this.createAuditLog({
      actorId: adminId,
      action: 'INVESTMENT_UNFLAGGED',
      entityType: 'Investment',
      entityId: investmentId,
      oldValues: { reason: existing.reason },
    });

    this.logger.log(`Investment ${investmentId} unflagged by admin ${adminId}`);
    return { investmentId, unflagged: true };
  }

  async getInvestmentStats() {
    const grouped = await this.prisma.investment.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { amount: true },
    });

    const byStatus: Record<string, number> = {};
    const byStatusAmount: Record<string, string> = {};
    let total = 0;
    let totalAmount = ZERO;

    for (const group of grouped) {
      byStatus[group.status] = group._count._all;
      byStatusAmount[group.status] = toDecimal(group._sum.amount).toString();
      total += group._count._all;
      totalAmount = add(totalAmount, toDecimal(group._sum.amount));
    }

    return {
      statuses: Object.values(InvestmentStatus),
      total,
      byStatus,
      byStatusAmount,
      totalAmount,
      flaggedCount: this.flagged.size,
      flagged: Array.from(this.flagged.values()),
    };
  }

  async escalateInvestment(investmentId: string, adminId: string, notes?: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      select: { id: true, investorProfileId: true },
    });
    if (!investment) {
      throw new NotFoundException(`Investment ${investmentId} not found`);
    }

    await this.createAuditLog({
      actorId: adminId,
      action: 'INVESTMENT_ESCALATED',
      entityType: 'Investment',
      entityId: investmentId,
      newValues: notes ? { notes } : undefined,
    });

    return { investmentId, escalated: true, escalatedBy: adminId, escalatedAt: new Date() };
  }
}