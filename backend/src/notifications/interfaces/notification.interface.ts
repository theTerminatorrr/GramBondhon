import { NotificationType, Prisma } from '@prisma/client';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  type?: NotificationType;
  read?: boolean;
}

export interface NotificationDeliveryJob {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.JsonValue;
  email?: string;
  phone?: string;
}

export interface DeliveryResult {
  email: boolean;
  sms: boolean;
  push: boolean;
  deliveredAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function buildPageMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}