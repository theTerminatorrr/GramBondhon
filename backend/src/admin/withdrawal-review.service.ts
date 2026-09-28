import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, WithdrawalStatus } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { SettlementsService } from '../settlements/settlements.service';
import {
  createPaginationQuery,
  paginate,
  PaginatedResult,
} from '../common/utils/pagination.util';
import { WithdrawalReviewQueryDto } from './dto/admin-dashboard-query.dto';
import { AdminBaseService } from './admin-base.service';

const WITHDRAWAL_INCLUDE = {
  user: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  approvedByUser: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  payment: {
    select: { id: true, status: true, amount: true, createdAt: true },
  },
} satisfies Prisma.WithdrawalInclude;

@Injectable()
export class WithdrawalReviewService extends AdminBaseService {
  constructor(
    prisma: PrismaService,
    private readonly settlementsService: SettlementsService,
  ) {
    super(prisma);
  }

  async getPendingWithdrawals(query: WithdrawalReviewQueryDto = new WithdrawalReviewQueryDto()): Promise<PaginatedResult<unknown>> {
    const where: Prisma.WithdrawalWhereInput = {
      ...(query.status ? { status: query.status } : { status: WithdrawalStatus.PENDING }),
      ...(query.method ? { method: query.method } : {}),
    };

    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    if (query.search?.trim()) {
      where.OR = [
        { user: { email: { contains: query.search.trim(), mode: 'insensitive' } } },
      ];
    }

    const { page, limit, skip, take, orderBy } = createPaginationQuery(
      query.page,
      query.limit,
      where as Record<string, unknown>,
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        defaultSortField: 'createdAt',
        allowedSortFields: ['createdAt', 'updatedAt', 'amount', 'status'],
      },
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.withdrawal.findMany({
        where: where as Prisma.WithdrawalWhereInput,
        skip,
        take,
        orderBy: orderBy as Prisma.WithdrawalOrderByWithRelationInput,
        include: WITHDRAWAL_INCLUDE,
      }),
      this.prisma.withdrawal.count({ where: where as Prisma.WithdrawalWhereInput }),
    ]);

    return paginate(items, page, limit, total);
  }

  async getWithdrawalDetail(withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        ...WITHDRAWAL_INCLUDE,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            farmerProfiles: {
              select: { id: true, verificationStatus: true },
            },
            investorProfiles: {
              select: { id: true, kycStatus: true },
            },
          },
        },
      },
    });
    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal ${withdrawalId} not found`);
    }
    return withdrawal;
  }

  async approveWithdrawal(withdrawalId: string, adminId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      select: { id: true, status: true, userId: true, amount: true, currency: true },
    });
    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal ${withdrawalId} not found`);
    }
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new NotFoundException(
        `Withdrawal ${withdrawalId} is not in PENDING status (current: ${withdrawal.status})`,
      );
    }

    const updated = await this.settlementsService.approveWithdrawal(withdrawalId, adminId);

    await this.createAuditLog({
      actorId: adminId,
      action: 'WITHDRAWAL_APPROVED',
      entityType: 'Withdrawal',
      entityId: withdrawalId,
      oldValues: { status: withdrawal.status },
      newValues: { status: WithdrawalStatus.APPROVED },
    });
    await this.createNotification(
      withdrawal.userId,
      NotificationType.WITHDRAWAL_COMPLETED,
      'Withdrawal approved',
      `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} has been approved and is being processed.`,
      { withdrawalId, amount: withdrawal.amount.toString(), currency: withdrawal.currency },
    );

    this.logger.log(`Withdrawal ${withdrawalId} approved by admin ${adminId}`);
    return updated;
  }

  async processWithdrawal(withdrawalId: string, adminId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      select: { id: true, status: true, userId: true, amount: true, currency: true },
    });
    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal ${withdrawalId} not found`);
    }
    if (withdrawal.status !== WithdrawalStatus.APPROVED) {
      throw new NotFoundException(
        `Withdrawal ${withdrawalId} must be APPROVED before processing (current: ${withdrawal.status})`,
      );
    }

    await this.createAuditLog({
      actorId: adminId,
      action: 'WITHDRAWAL_PROCESSING',
      entityType: 'Withdrawal',
      entityId: withdrawalId,
      oldValues: { status: withdrawal.status },
      newValues: { status: WithdrawalStatus.PROCESSING },
    });

    const result = await this.settlementsService.processWithdrawal(withdrawalId);

    await this.createNotification(
      withdrawal.userId,
      NotificationType.WITHDRAWAL_COMPLETED,
      'Withdrawal processing',
      `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} is now being processed.`,
      { withdrawalId, amount: withdrawal.amount.toString() },
    );

    return result;
  }

  async rejectWithdrawal(withdrawalId: string, adminId: string, reason: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      select: { id: true, status: true, userId: true, amount: true, currency: true },
    });
    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal ${withdrawalId} not found`);
    }
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new NotFoundException(
        `Withdrawal ${withdrawalId} cannot be rejected in status ${withdrawal.status}`,
      );
    }

    const updated = await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.REJECTED,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    await this.createAuditLog({
      actorId: adminId,
      action: 'WITHDRAWAL_REJECTED',
      entityType: 'Withdrawal',
      entityId: withdrawalId,
      oldValues: { status: withdrawal.status },
      newValues: { status: WithdrawalStatus.REJECTED, rejectionReason: reason.trim() },
    });
    await this.createNotification(
      withdrawal.userId,
      NotificationType.SYSTEM,
      'Withdrawal rejected',
      `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} has been rejected. Reason: ${reason.trim()}`,
      { withdrawalId, rejectionReason: reason.trim() },
    );

    this.logger.log(`Withdrawal ${withdrawalId} rejected by admin ${adminId}`);
    return updated;
  }
}