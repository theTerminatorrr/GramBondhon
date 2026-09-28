import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { AuditQueryDto } from './dto/audit-query.dto';

export interface AuditLogInput {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  blockchainTxHash?: string | null;
}

export interface AuditExportResult {
  filename: string;
  csv: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      actorId: input.actorId ?? undefined,
      actorEmail: input.actorEmail ?? undefined,
      actorRole: input.actorRole ?? undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
      oldValues:
        input.oldValues === undefined || input.oldValues === null
          ? undefined
          : (input.oldValues as Prisma.InputJsonValue),
      newValues:
        input.newValues === undefined || input.newValues === null
          ? undefined
          : (input.newValues as Prisma.InputJsonValue),
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined,
      blockchainTxHash: input.blockchainTxHash ?? undefined,
    };

    const entry = await this.prisma.auditLog.create({ data });

    this.logger.debug(
      `Audit log: actor=${input.actorEmail ?? input.actorId ?? 'system'} ` +
        `action=${input.action} entity=${input.entityType}:${input.entityId ?? '-'}`,
    );

    return entry;
  }

  private buildWhere(query: AuditQueryDto): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.actorId) {
      where.actorId = query.actorId;
    }
    if (query.entityType) {
      where.entityType = query.entityType;
    }
    if (query.entityId) {
      where.entityId = query.entityId;
    }
    if (query.action) {
      where.action = query.action;
    }

    const createdAt: Prisma.DateTimeFilter | undefined =
      query.startDate || query.endDate
        ? {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          }
        : undefined;

    if (createdAt) {
      where.createdAt = createdAt;
    }

    return where;
  }

  private readonly withActor: Prisma.AuditLogInclude = {
    actor: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    },
  };

  async getAuditLogs(query: AuditQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        include: this.withActor,
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEntityHistory(entityType: string, entityId: string) {
    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        include: this.withActor,
        where: { entityType, entityId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where: { entityType, entityId } }),
    ]);

    return {
      entityType,
      entityId,
      data: logs,
      meta: { total },
    };
  }

  async getActorActivity(actorId: string, query: AuditQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AuditLogWhereInput = { actorId };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        include: this.withActor,
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      actorId,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportAuditLogs(query: AuditQueryDto): Promise<AuditExportResult> {
    const where = this.buildWhere({ ...query, page: 1, limit: 10000 });

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const headers = [
      'id',
      'createdAt',
      'actorId',
      'actorEmail',
      'actorRole',
      'action',
      'entityType',
      'entityId',
      'oldValues',
      'newValues',
      'ipAddress',
      'userAgent',
      'blockchainTxHash',
    ];

    const escape = (value: unknown): string => {
      const str = value === null || value === undefined ? '' : String(value);
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = logs.map((log) =>
      [
        log.id,
        log.createdAt.toISOString(),
        log.actorId,
        log.actorEmail,
        log.actorRole,
        log.action,
        log.entityType,
        log.entityId,
        log.oldValues ? JSON.stringify(log.oldValues) : '',
        log.newValues ? JSON.stringify(log.newValues) : '',
        log.ipAddress,
        log.userAgent,
        log.blockchainTxHash,
      ]
        .map(escape)
        .join(','),
    );

    const today = new Date().toISOString().slice(0, 10);
    const csv = `\uFEFF${[headers.join(','), ...rows].join('\r\n')}`;

    return {
      filename: `audit-logs-${today}.csv`,
      csv,
    };
  }
}