import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Deal, DealStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import {
  DealStatusHistoryEntry,
  NextAction,
} from './interfaces/deal.interface';

export const DEAL_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  DRAFT: [DealStatus.SUBMITTED, DealStatus.CANCELLED],
  SUBMITTED: [DealStatus.UNDER_REVIEW, DealStatus.CANCELLED],
  UNDER_REVIEW: [DealStatus.APPROVED, DealStatus.REJECTED],
  APPROVED: [DealStatus.SMART_CONTRACT_CREATED],
  REJECTED: [],
  SMART_CONTRACT_CREATED: [DealStatus.PUBLISHED],
  PUBLISHED: [DealStatus.FUNDING],
  FUNDING: [DealStatus.FUNDED, DealStatus.CANCELLED],
  FUNDED: [DealStatus.ACTIVE],
  ACTIVE: [DealStatus.HARVESTING],
  HARVESTING: [DealStatus.REVENUE_VERIFICATION],
  REVENUE_VERIFICATION: [DealStatus.PROFIT_CALCULATION],
  PROFIT_CALCULATION: [DealStatus.DISTRIBUTION],
  DISTRIBUTION: [DealStatus.SETTLED],
  SETTLED: [DealStatus.CLOSED],
  CLOSED: [],
  CANCELLED: [],
};

export const TERMINAL_DEAL_STATUSES: DealStatus[] = [
  DealStatus.REJECTED,
  DealStatus.CLOSED,
  DealStatus.CANCELLED,
];

export const PUBLIC_DEAL_STATUSES: DealStatus[] = [
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
];

export const DEAL_STATUS_HISTORY_ACTION = 'DEAL_STATUS_CHANGED';

const NEXT_ACTIONS: Record<DealStatus, NextAction[]> = {
  DRAFT: [
    { action: 'Submit deal for review', targetStatus: DealStatus.SUBMITTED, requiresRole: 'FARMER' },
  ],
  SUBMITTED: [
    { action: 'Start admin review', targetStatus: DealStatus.UNDER_REVIEW, requiresRole: 'ADMIN' },
    { action: 'Cancel deal', targetStatus: DealStatus.CANCELLED, requiresRole: 'FARMER' },
  ],
  UNDER_REVIEW: [
    { action: 'Approve deal', targetStatus: DealStatus.APPROVED, requiresRole: 'ADMIN' },
    { action: 'Reject deal', targetStatus: DealStatus.REJECTED, requiresRole: 'ADMIN' },
  ],
  APPROVED: [
    { action: 'Create smart contract', targetStatus: DealStatus.SMART_CONTRACT_CREATED, requiresRole: 'SYSTEM' },
  ],
  REJECTED: [],
  SMART_CONTRACT_CREATED: [
    { action: 'Publish deal to investors', targetStatus: DealStatus.PUBLISHED, requiresRole: 'ADMIN' },
  ],
  PUBLISHED: [
    { action: 'Start funding round', targetStatus: DealStatus.FUNDING, requiresRole: 'ADMIN' },
  ],
  FUNDING: [
    { action: 'Record confirmed investment', targetStatus: DealStatus.FUNDED, requiresRole: 'SYSTEM' },
    { action: 'Cancel deal', targetStatus: DealStatus.CANCELLED, requiresRole: 'ADMIN' },
  ],
  FUNDED: [
    { action: 'Activate deal funding escrow', targetStatus: DealStatus.ACTIVE, requiresRole: 'SYSTEM' },
  ],
  ACTIVE: [
    { action: 'Start harvesting', targetStatus: DealStatus.HARVESTING, requiresRole: 'FARMER' },
  ],
  HARVESTING: [
    { action: 'Complete harvest and verify revenue', targetStatus: DealStatus.REVENUE_VERIFICATION, requiresRole: 'SYSTEM' },
  ],
  REVENUE_VERIFICATION: [
    { action: 'Calculate profits', targetStatus: DealStatus.PROFIT_CALCULATION, requiresRole: 'ADMIN' },
  ],
  PROFIT_CALCULATION: [
    { action: 'Distribute profits', targetStatus: DealStatus.DISTRIBUTION, requiresRole: 'ADMIN' },
  ],
  DISTRIBUTION: [
    { action: 'Complete all settlements', targetStatus: DealStatus.SETTLED, requiresRole: 'SYSTEM' },
  ],
  SETTLED: [
    { action: 'Close deal', targetStatus: DealStatus.CLOSED, requiresRole: 'ADMIN' },
  ],
  CLOSED: [],
  CANCELLED: [],
};

export interface DealTransitionOptions {
  actorId?: string | null;
  reason?: string;
  fields?: Prisma.DealUncheckedUpdateInput;
  details?: Record<string, unknown>;
}

export interface CreateAuditLogInput {
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
  blockchainTxHash?: string | null;
}

@Injectable()
export class DealLifecycleService {
  private readonly logger = new Logger(DealLifecycleService.name);

  constructor(private readonly prisma: PrismaService) {}

  validateTransition(fromStatus: DealStatus, toStatus: DealStatus): void {
    const allowed = DEAL_TRANSITIONS[fromStatus] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Invalid deal status transition: ${fromStatus} -> ${toStatus}`,
      );
    }
  }

  getAllowedTransitions(fromStatus: DealStatus): DealStatus[] {
    return DEAL_TRANSITIONS[fromStatus] ? [...DEAL_TRANSITIONS[fromStatus]] : [];
  }

  async transitionDeal(
    dealId: string,
    toStatus: DealStatus,
    options: DealTransitionOptions = {},
  ): Promise<Deal> {
    const existing = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!existing) {
      throw new NotFoundException(`Deal with id ${dealId} not found`);
    }

    if (existing.status === toStatus) {
      return existing;
    }

    this.validateTransition(existing.status, toStatus);

    const fields = options.fields ?? {};
    const data: Prisma.DealUpdateInput = {
      status: toStatus,
      ...fields,
    };

    return this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.deal.update({ where: { id: dealId }, data });

      let actorEmail: string | null = null;
      let actorRole: string | null = null;
      if (options.actorId) {
        const actor = await prisma.user.findUnique({
          where: { id: options.actorId },
          select: { email: true, role: true },
        });
        if (actor) {
          actorEmail = actor.email;
          actorRole = actor.role;
        }
      }

      await prisma.auditLog.create({
        data: {
          actorId: options.actorId ?? null,
          actorEmail,
          actorRole,
          action: DEAL_STATUS_HISTORY_ACTION,
          entityType: 'Deal',
          entityId: dealId,
          oldValues: { status: existing.status },
          newValues: {
            status: toStatus,
            ...(options.reason ? { reason: options.reason } : {}),
            ...(options.details ?? {}),
          },
        },
      });

      this.logger.log(
        `Deal ${dealId} transitioned ${existing.status} -> ${toStatus}${
          options.reason ? ` (reason: ${options.reason})` : ''
        }`,
      );

      return updated;
    });
  }

  async getStatusHistory(dealId: string): Promise<DealStatusHistoryEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'Deal',
        entityId: dealId,
        action: DEAL_STATUS_HISTORY_ACTION,
      },
      orderBy: { createdAt: 'asc' },
    });

    return logs.map((log) => {
      const oldValues = (log.oldValues ?? {}) as Record<string, unknown>;
      const newValues = (log.newValues ?? {}) as Record<string, unknown>;
      return {
        id: log.id,
        dealId,
        fromStatus: (oldValues.status as DealStatus) ?? null,
        toStatus: (newValues.status as DealStatus) ?? null,
        actorId: log.actorId,
        actorEmail: log.actorEmail,
        actorRole: log.actorRole,
        reason: typeof newValues.reason === 'string' ? newValues.reason : null,
        changedAt: log.createdAt,
      };
    });
  }

  async getNextActions(dealId: string): Promise<NextAction[]> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { status: true },
    });
    if (!deal) {
      throw new NotFoundException(`Deal with id ${dealId} not found`);
    }
    return NEXT_ACTIONS[deal.status] ?? [];
  }

  async recordAudit(input: CreateAuditLogInput): Promise<void> {
    let actorEmail: string | null = null;
    let actorRole: string | null = null;
    if (input.actorId) {
      const actor = await this.prisma.user.findUnique({
        where: { id: input.actorId },
        select: { email: true, role: true },
      });
      if (actor) {
        actorEmail = actor.email;
        actorRole = actor.role;
      }
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorEmail,
        actorRole,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: input.oldValues,
        newValues: input.newValues,
        blockchainTxHash: input.blockchainTxHash ?? null,
      },
    });
  }
}