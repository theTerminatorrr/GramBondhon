import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Worker, type Job } from 'bullmq';
import { PrismaService } from '../../database/database.service';
import { buildRedisConnection, NOTIFICATIONS_QUEUE_NAME } from '../notifications.service';
import type { NotificationDeliveryJob, DeliveryResult } from '../interfaces/notification.interface';

@Injectable()
export class NotificationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationWorker.name);
  private worker?: Worker;
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
      this.logger.log('NotificationWorker skipping init (dev mode: notifications logged only)');
      return;
    }

    this.worker = new Worker<NotificationDeliveryJob>(
      NOTIFICATIONS_QUEUE_NAME,
      async (job: Job<NotificationDeliveryJob>) => this.processJob(job),
      {
        connection: buildRedisConnection(this.config),
        concurrency: 5,
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Notification delivery failed [job=${job?.id}, notif=${job?.data?.notificationId}]: ${error.message}`,
      );
    });

    this.worker.on('completed', (job) => {
      this.logger.debug(`Notification delivered [job=${job.id}]`);
    });

    this.worker.on('error', (error) => {
      this.logger.error(`NotificationWorker error: ${error.message}`);
    });

    this.logger.log('NotificationWorker started');
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.worker = undefined;
    }
  }

  private async processJob(job: Job<NotificationDeliveryJob>): Promise<void> {
    const { notificationId } = job.data;

    this.logger.log(`Processing notification delivery: ${notificationId}`);

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      this.logger.warn(`Notification ${notificationId} not found, skipping delivery`);
      return;
    }

    const delivery: DeliveryResult = {
      email: false,
      sms: false,
      push: false,
      deliveredAt: new Date().toISOString(),
    };

    try {
      delivery.email = await this.sendEmail(job.data);
      delivery.sms = this.logSms(job.data);
      delivery.push = this.logPush(job.data);

      await this.markDelivered(notificationId, delivery);
    } catch (error) {
      this.logger.error(
        `Delivery processing error for notification ${notificationId}: ${(error as Error).message}`,
      );
    }
  }

  private async sendEmail(data: NotificationDeliveryJob): Promise<boolean> {
    if (!data.email) {
      this.logger.debug(`No email address for user ${data.userId}, skipping email`);
      return false;
    }

    this.logger.log(
      `[EMAIL MOCK] To: ${data.email} | Subject: ${data.title} | Body: ${data.message}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    return true;
  }

  private logSms(data: NotificationDeliveryJob): boolean {
    if (!data.phone) {
      this.logger.debug(`No phone number for user ${data.userId}, skipping SMS`);
      return false;
    }

    this.logger.log(
      `[SMS MOCK] To: ${data.phone} | Message: ${data.title} — ${data.message}`,
    );

    return true;
  }

  private logPush(data: NotificationDeliveryJob): boolean {
    this.logger.log(
      `[PUSH MOCK] To: ${data.userId} | Title: ${data.title} | Body: ${data.message}`,
    );

    return true;
  }

  private async markDelivered(
    notificationId: string,
    delivery: DeliveryResult,
  ): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { data: true },
    });

    if (!notification) {
      return;
    }

    const currentData = (notification.data as Record<string, unknown>) ?? {};

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        data: {
          ...currentData,
          delivery,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.debug(`Marked notification ${notificationId} as delivered`);
  }
}