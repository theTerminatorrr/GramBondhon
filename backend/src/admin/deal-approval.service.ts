import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DealStatus, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { DealApprovalService as BaseDealApprovalService } from '../deals/deal-approval.service';
import { DealsService } from '../deals/deals.service';
import { RejectDealDto } from '../deals/dto/reject-deal.dto';
import {
  createPaginationQuery,
  paginate,
  PaginatedResult,
} from '../common/utils/pagination.util';
import { DealReviewQueryDto } from './dto/admin-dashboard-query.dto';

function jsonOrNull(
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return value as Prisma.InputJsonValue;
}

const ADMIN_DEAL_REVIEW_INCLUDE = {
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
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  },
  dealTerm: true,
  escrowAccount: {
    select: {
      id: true,
      status: true,
      balance: true,
      lockedBalance: true,
      blockchainContractAddress: true,
    },
  },
  _count: { select: { investments: true } },
} satisfies Prisma.DealInclude;

@Injectable()
export class DealApprovalService extends BaseDealApprovalService {
  constructor(
    prisma: PrismaService,
    private readonly dealsService: DealsService,
  ) {
    super(prisma);
  }

  async getDeals(query: DealReviewQueryDto = new DealReviewQueryDto()): Promise<PaginatedResult<unknown>> {
    const where: Prisma.DealWhereInput = {
      status: query.status ?? {
        in: [DealStatus.SUBMITTED, DealStatus.UNDER_REVIEW],
      },
      ...(query.farmerId ? { farmerProfileId: query.farmerId } : {}),
    };

    if (query.search?.trim()) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: 'insensitive' } },
        { description: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    const { page, limit, skip, take, orderBy } = createPaginationQuery(
      query.page,
      query.limit,
      where as Record<string, unknown>,
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        defaultSortField: 'updatedAt',
        allowedSortFields: ['createdAt', 'updatedAt', 'title', 'fundingTarget', 'status'],
      },
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where: where as Prisma.DealWhereInput,
        skip,
        take,
        orderBy: orderBy as Prisma.DealOrderByWithRelationInput,
        include: ADMIN_DEAL_REVIEW_INCLUDE,
      }),
      this.prisma.deal.count({ where: where as Prisma.DealWhereInput }),
    ]);

    return paginate(items, page, limit, total);
  }

  async getDealDetail(dealId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        ...ADMIN_DEAL_REVIEW_INCLUDE,
        project: { include: { farm: { select: { id: true, name: true } }, crop: true } },
        dealParticipants: {
          include: {
            investorProfile: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            },
          },
        },
      },
    });
    if (!deal) {
      throw new NotFoundException(`Deal ${dealId} not found`);
    }
    return deal;
  }

  async approveDeal(dealId: string, adminId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        title: true,
        status: true,
        farmerProfile: { select: { userId: true } },
      },
    });
    if (!deal) {
      throw new NotFoundException(`Deal ${dealId} not found`);
    }

    const updated = await this.dealsService.approve(dealId, adminId);

    await this.createAuditLog({
      actorId: adminId,
      action: 'DEAL_APPROVED',
      entityType: 'Deal',
      entityId: dealId,
      oldValues: { status: deal.status },
      newValues: { status: updated.status },
    });
    await this.createNotification(
      deal.farmerProfile.userId,
      NotificationType.DEAL_APPROVED,
      'Deal approved',
      `Your deal "${deal.title}" has been approved by an administrator.`,
      { dealId, title: deal.title },
    );

    this.logger.log(`Deal ${dealId} approved by admin ${adminId}`);
    return updated;
  }

  async rejectDeal(dealId: string, adminId: string, dto: RejectDealDto) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        title: true,
        status: true,
        farmerProfile: { select: { userId: true } },
      },
    });
    if (!deal) {
      throw new NotFoundException(`Deal ${dealId} not found`);
    }

    const updated = await this.dealsService.reject(dealId, adminId, dto);

    await this.createAuditLog({
      actorId: adminId,
      action: 'DEAL_REJECTED',
      entityType: 'Deal',
      entityId: dealId,
      oldValues: { status: deal.status },
      newValues: { status: updated.status, rejectionReason: dto.reason },
    });
    await this.createNotification(
      deal.farmerProfile.userId,
      NotificationType.SYSTEM,
      'Deal rejected',
      `Your deal "${deal.title}" has been rejected. Reason: ${dto.reason}`,
      { dealId, title: deal.title, rejectionReason: dto.reason },
    );

    this.logger.log(`Deal ${dealId} rejected by admin ${adminId}`);
    return updated;
  }

  async getApprovalStats() {
    return super.getApprovalStats();
  }

  async createAuditLog(input: {
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
  }) {
    let actorEmail: string | null = null;
    let actorRole: string | null = null;

    const actor = await this.prisma.user
      .findUnique({
        where: { id: input.actorId },
        select: { email: true, role: true },
      })
      .catch(() => null);
    if (actor) {
      actorEmail = actor.email;
      actorRole = actor.role;
    }

    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          actorEmail,
          actorRole,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          oldValues: jsonOrNull(input.oldValues),
          newValues: jsonOrNull(input.newValues),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to create audit log: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    try {
      return await this.prisma.notification.create({
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
      return null;
    }
  }
}