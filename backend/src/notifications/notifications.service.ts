import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType, Prisma } from '@prisma/client';
import { Queue, type ConnectionOptions, type JobsOptions } from 'bullmq';
import { PrismaService } from '../database/database.service';
import { NotificationDeliveryJob, NotificationQuery } from './interfaces/notification.interface';

export const NOTIFICATIONS_QUEUE_NAME = 'notifications';
const SEND_NOTIFICATION_JOB = 'send-notification';

export function buildRedisConnection(config: ConfigService): ConnectionOptions {
  const redisUrl = config.get<string>('REDIS_URL');
  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      return {
        host: parsed.hostname,
        port: Number(parsed.port || 6379),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        db: parsed.pathname ? Number(parsed.pathname.replace('/', '') || 0) : 0,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      };
    } catch {
      // fall through to discrete config below
    }
  }
  return {
    host: config.get<string>('REDIS_HOST', 'localhost'),
    port: config.get<number>('REDIS_PORT', 6379),
    password: config.get<string>('REDIS_PASSWORD') || undefined,
    db: config.get<number>('REDIS_DB', 0),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private queue?: Queue<NotificationDeliveryJob>;
  private readonly isDev: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.isDev =
      (this.config.get<string>('NODE_ENV', 'development') ?? 'development') ===
      'development';
  }

  async onModuleInit() {
    if (this.isDev) {
      this.logger.log(
        'Running in development mode: notifications are logged instead of queued',
      );
      return;
    }

    this.queue = new Queue<NotificationDeliveryJob>(NOTIFICATIONS_QUEUE_NAME, {
      connection: buildRedisConnection(this.config),
    });

    this.logger.log('Notification delivery queue initialized');
  }

  async onModuleDestroy() {
    if (this.queue) {
      await this.queue.close();
      this.queue = undefined;
    }
  }

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: (data as Prisma.InputJsonValue) ?? undefined,
      },
    });

    this.logger.log(
      `Notification created: ${notification.id} (${type}) for user ${userId}`,
    );

    await this.enqueueDelivery(notification);

    return notification;
  }

  private async enqueueDelivery(
    notification: {
      id: string;
      userId: string;
      type: NotificationType;
      title: string;
      message: string;
      data: Prisma.JsonValue | null;
    },
  ): Promise<void> {
    if (this.isDev || !this.queue) {
      this.logger.log(
        `[DEV] Notification delivery: to=${notification.userId} type=${notification.type} ` +
          `title="${notification.title}" message="${notification.message}"`,
      );
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true, phone: true },
    });

    const job: NotificationDeliveryJob = {
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data ?? undefined,
      email: user?.email ?? undefined,
      phone: user?.phone ?? undefined,
    };

    const options: JobsOptions = {
      jobId: `notification-${notification.id}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    };

    try {
      await this.queue.add(SEND_NOTIFICATION_JOB, job, options);
    } catch (error) {
      this.logger.error(
        `Failed to enqueue delivery for notification ${notification.id}`,
        (error as Error).message,
      );
    }
  }

  async getNotifications(userId: string, query: NotificationQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.NotificationWhereInput = { userId };

    if (query.type) {
      where.type = query.type;
    }
    if (query.read !== undefined) {
      where.read = query.read;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
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

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { unreadCount: count };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (notification.read) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    await this.prisma.notification.delete({ where: { id: notificationId } });

    return { success: true, deletedAt: new Date() };
  }
}