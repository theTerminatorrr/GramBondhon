import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';
import {
  PaymentProvider,
  PaymentResult,
  PaymentVerification,
  RefundResult,
  WebhookPayload,
} from './payment-provider.interface';

const SUCCESS_AFTER_MS = Number(process.env.MOCK_PAYMENT_DELAY_MS ?? 300);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Development-only payment provider.
 * Simulates payment creation with random references, always settles
 * successfully after a short delay, and produces verifiable webhook payloads.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  private readonly logger = new Logger(MockPaymentProvider.name);
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>(
      'MOCK_PAYMENT_WEBHOOK_SECRET',
      'mock-dev-secret',
    );
  }

  async createPayment(
    amount: string,
    currency: string,
    reference: string,
    metadata?: Record<string, unknown>,
  ): Promise<PaymentResult> {
    await delay(SUCCESS_AFTER_MS);
    const providerReference = `MOCK-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
    this.logger.log(
      `Mock provider created payment ${providerReference} for ${amount} ${currency} (ref ${reference})`,
    );
    return {
      success: true,
      providerReference,
      status: 'PROCESSING',
      message: 'Payment request accepted by mock provider',
      raw: { metadata },
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    await delay(SUCCESS_AFTER_MS / 2);
    return {
      success: true,
      providerReference: reference,
      status: 'COMPLETED',
      message: 'Mock provider verified payment as completed',
    };
  }

  async processRefund(
    reference: string,
    amount: string,
    reason?: string,
  ): Promise<RefundResult> {
    await delay(SUCCESS_AFTER_MS / 2);
    return {
      success: true,
      providerReference: reference,
      refundReference: `REF-${randomUUID().slice(0, 8)}`,
      status: 'REFUNDED',
      message: reason ?? 'Refund processed by mock provider',
    };
  }

  /** Builds a webhook payload a real provider would POST back to us. */
  buildWebhook(
    providerReference: string,
    eventType = 'PAYMENT.SUCCEEDED',
    extra: Record<string, unknown> = {},
  ): WebhookPayload {
    return {
      id: `evt_${randomUUID()}`,
      eventType,
      timestamp: new Date().toISOString(),
      data: {
        reference: providerReference,
        status: eventType.includes('FAILED') ? 'FAILED' : 'COMPLETED',
        ...extra,
      },
    };
  }

  signWebhook(payload: unknown): string {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return createHmac('sha256', this.secret).update(body).digest('hex');
  }

  async verifyWebhook(payload: unknown, signature?: string): Promise<boolean> {
    if (!signature) {
      this.logger.warn('Webhook received without a signature');
      return false;
    }
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expected = createHmac('sha256', this.secret).update(body).digest('hex');
    const valid = signature === expected;
    if (!valid) {
      this.logger.warn('Webhook signature verification failed');
    }
    return valid;
  }
}