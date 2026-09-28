import { Injectable, Logger } from '@nestjs/common';
import { DealStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';

const PENDING_REVIEW_STATUSES: DealStatus[] = [
  DealStatus.SUBMITTED,
  DealStatus.UNDER_REVIEW,
];

const dealApprovalInclude = {
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      expectedRevenue: true,
      expectedYield: true,
    },
  },
  farmerProfile: {
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
  dealTerm: true,
} satisfies Prisma.DealInclude;

@Injectable()
export class DealApprovalService {
  protected readonly logger = new Logger(DealApprovalService.name);

  constructor(protected readonly prisma: PrismaService) {}

  async getPendingDeals() {
    const deals = await this.prisma.deal.findMany({
      where: { status: { in: PENDING_REVIEW_STATUSES } },
      orderBy: { updatedAt: 'asc' },
      include: dealApprovalInclude,
    });
    return deals;
  }

  async getPendingCount(): Promise<number> {
    return this.prisma.deal.count({
      where: { status: { in: PENDING_REVIEW_STATUSES } },
    });
  }

  async getApprovalStats() {
    const allStatuses: DealStatus[] = [
      DealStatus.DRAFT,
      DealStatus.SUBMITTED,
      DealStatus.UNDER_REVIEW,
      DealStatus.APPROVED,
      DealStatus.REJECTED,
      DealStatus.SMART_CONTRACT_CREATED,
      DealStatus.PUBLISHED,
      DealStatus.FUNDING,
      DealStatus.FUNDED,
      DealStatus.ACTIVE,
      DealStatus.HARVESTING,
      DealStatus.REVENUE_VERIFICATION,
      DealStatus.PROFIT_CALCULATION,
      DealStatus.DISTRIBUTION,
      DealStatus.SETTLED,
      DealStatus.CLOSED,
      DealStatus.CANCELLED,
    ];

    const grouped = await this.prisma.deal.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const byStatus = Object.fromEntries(
      allStatuses.map((status) => [status, 0]),
    ) as Record<DealStatus, number>;

    for (const group of grouped) {
      byStatus[group.status] = group._count._all;
    }

    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);
    const pendingReview =
      byStatus[DealStatus.SUBMITTED] + byStatus[DealStatus.UNDER_REVIEW];

    this.logger.debug(`Approval stats computed: ${pendingReview} pending review`);

    return {
      total,
      pendingReview,
      byStatus,
    };
  }
}