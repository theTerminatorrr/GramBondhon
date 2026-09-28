import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';

function jsonOrNull(
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return value as Prisma.InputJsonValue;
}

@Injectable()
export class AdminBaseService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly prisma: PrismaService) {}

  protected async createAuditLog(input: {
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
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
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to create audit log: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  protected async createNotification(
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