import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationType,
  Payment,
  PaymentStatus,
  Prisma,
  TransactionState,
} from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { LedgerService } from '../ledger/ledger.service';
import { InvestmentsService } from '../investments/investments.service';
import {
  INVESTOR_RECEIVABLE_ACCOUNT,
  CASH_ACCOUNT,
  investorPayableAccountFor,
} from '../common/constants/account-codes';
import { ZERO, equals, toDecimal } from '../common/utils/decimal.util';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import {
  PAYMENT_PROVIDERS,
  DEFAULT_PROVIDER,
} from './payment-providers.constants';
import {
  PaymentProvider,
  WebhookPayload,
} from './payment-providers/payment-provider.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly investmentsService: InvestmentsService,
    private readonly configService: ConfigService,
    @Inject(PAYMENT_PROVIDERS)
    private readonly providers: Record<string, PaymentProvider>,
  ) {}

  getProvider(name: string): PaymentProvider {
    const provider = this.providers[name];
    if (!provider) {
      throw new BadRequestException(`Unsupported payment provider: ${name}`);
    }
    return provider;
  }

  async createPayment(userId: string, dto: CreatePaymentDto): Promise<Payment> {
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      return existing;
    }

    if (dto.investmentId) {
      const investment = await this.prisma.investment.findUnique({
        where: { id: dto.investmentId },
      });
      if (!investment) {
        throw new NotFoundException(
          `Investment ${dto.investmentId} not found`,
        );
      }
      if (investment.status !== 'PENDING') {
        throw new ConflictException(
          `Investment ${dto.investmentId} is not awaiting payment (status: ${investment.status})`,
        );
      }
      const expected = toDecimal(investment.amount.toString());
      const provided = toDecimal(dto.amount);
      if (!equals(expected, provided)) {
        throw new BadRequestException(
          `Payment amount must equal the pending investment amount of ${expected}`,
        );
      }
    }

    const amount = toDecimal(dto.amount);
    const currency = (dto.currency ?? 'BDT').toUpperCase();
    const provider = this.configService.get<string>(
      'PAYMENT_PROVIDER',
      DEFAULT_PROVIDER,
    );

    return this.prisma.payment.create({
      data: {
        userId,
        investmentId: dto.investmentId ?? null,
        amount,
        currency,
        provider,
        status: PaymentStatus.PENDING,
        idempotencyKey: dto.idempotencyKey,
        metadata: undefined,
      },
    });
  }

  async getPaymentById(paymentId: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        paymentAttempts: { orderBy: { createdAt: 'desc' } },
        paymentWebhooks: { orderBy: { receivedAt: 'desc' } },
        investment: true,
      },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    return payment;
  }

  async processPayment(paymentId: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }
    if (payment.status === PaymentStatus.PROCESSING) {
      throw new ConflictException(
        `Payment ${paymentId} is already being processed`,
      );
    }

    const provider = this.getProvider(payment.provider);

    const attempt = await this.prisma.paymentAttempt.create({
      data: {
        paymentId,
        provider: payment.provider,
        amount: payment.amount,
        status: PaymentStatus.PROCESSING,
      },
    });

    try {
      const result = await provider.createPayment(
        payment.amount.toString(),
        payment.currency,
        payment.id,
        {
          investmentId: payment.investmentId ?? undefined,
          userId: payment.userId,
        },
      );

      if (!result.success) {
        await this.prisma.paymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: PaymentStatus.FAILED,
            errorCode: 'PROVIDER_REJECTED',
            errorMessage: result.message ?? 'Provider rejected the payment',
            rawResponse: (result.raw ?? {}) as Prisma.InputJsonValue,
          },
        });
        return this.failPayment(payment, result.message ?? 'Provider rejected the payment');
      }

      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: paymentId },
          data: {
            providerReference: result.providerReference,
            status: PaymentStatus.PROCESSING,
          },
        }),
        this.prisma.paymentAttempt.update({
          where: { id: attempt.id },
          data: {
            providerReference: result.providerReference,
            status: PaymentStatus.PROCESSING,
            rawResponse: (result.raw ?? {}) as Prisma.InputJsonValue,
          },
        }),
      ]);

      // Simulate the provider's async webhook callback.
      if (provider.buildWebhook) {
        const payload = provider.buildWebhook(result.providerReference);
        const signature = provider.signWebhook(payload);
        await this.handleWebhook(payment.provider, payload, signature);
      } else {
        await this.verifyPayment(paymentId);
      }

      return this.getPaymentById(paymentId);
    } catch (error) {
      this.logger.error(
        `Payment processing failed for ${paymentId}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      await this.prisma.paymentAttempt
        .update({
          where: { id: attempt.id },
          data: {
            status: PaymentStatus.FAILED,
            errorCode: 'PROCESSING_ERROR',
            errorMessage:
              error instanceof Error ? error.message : 'Payment processing error',
          },
        })
        .catch(() => undefined);
      return this.failPayment(payment, String(error instanceof Error ? error.message : error));
    }
  }

  async handleWebhook(
    providerName: string,
    payload: unknown,
    signature?: string,
  ) {
    const provider = this.getProvider(providerName);

    const verified = await provider.verifyWebhook(payload, signature);
    if (!verified) {
      throw new UnauthorizedException(
        'Webhook signature verification failed',
      );
    }

    const webhook = payload as WebhookPayload;
    const idempotencyKey = webhook.id ?? `${providerName}-${JSON.stringify(payload)}`;

    const existingWebhook = await this.prisma.paymentWebhook.findUnique({
      where: { idempotencyKey },
    });
    if (existingWebhook) {
      return { received: true, duplicate: true, webhook: existingWebhook };
    }

    const reference = webhook.data?.reference as string | undefined;
    const payment = reference
      ? await this.prisma.payment.findFirst({
          where: { providerReference: reference },
        })
      : null;

    const stored = await this.prisma.paymentWebhook.create({
      data: {
        paymentId: payment?.id ?? null,
        provider: providerName,
        eventType: webhook.eventType ?? 'UNKNOWN',
        payload: payload as Prisma.InputJsonValue,
        idempotencyKey,
      },
    });

    if (payment) {
      const event = (webhook.eventType ?? '').toUpperCase();
      if (event.includes('FAILED') || event.includes('DECLINED')) {
        await this.failPayment(payment, 'Payment failed per provider webhook');
      } else if (event.includes('REFUND')) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      } else if (
        event.includes('SUCCEEDED') ||
        event.includes('COMPLETED') ||
        event.includes('CONFIRMED')
      ) {
        await this.finalizePayment(payment);
      }
    }

    await this.prisma.paymentWebhook.update({
      where: { id: stored.id },
      data: { processed: true, processedAt: new Date() },
    });

    return { received: true, duplicate: false, webhook: stored, paymentId: payment?.id ?? null };
  }

  /** Server-side verification of the payment with the provider. */
  async verifyPayment(paymentId: string): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId);
    if (!payment.providerReference) {
      throw new BadRequestException(
        'Payment has no provider reference; it has not been submitted yet',
      );
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }

    const provider = this.getProvider(payment.provider);
    const verification = await provider.verifyPayment(payment.providerReference);

    if (verification.success && verification.status === 'COMPLETED') {
      return this.finalizePayment(payment);
    }
    if (
      verification.status === 'FAILED' ||
      verification.status === 'CANCELLED'
    ) {
      return this.failPayment(payment, verification.message ?? 'Payment failed verification');
    }
    return payment;
  }

  getPaymentStatus(paymentId: string) {
    return this.getPaymentById(paymentId);
  }

  async getPaymentHistory(userId: string, query: PaymentQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PaymentWhereInput = {
      userId,
      ...(query.status ? { status: query.status as PaymentStatus } : {}),
      ...(query.provider ? { provider: query.provider } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: {
          paymentAttempts: { orderBy: { createdAt: 'desc' } },
          investment: { select: { id: true, dealId: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Marks a COMPLETED payment as settled: books cash against the receivable,
   * then confirms the linked investment (moving funds into escrow).
   */
  async finalizePayment(payment: Payment): Promise<Payment> {
    if (payment.status === PaymentStatus.COMPLETED) {
      return this.getPaymentById(payment.id);
    }

    const cashAccount = await this.ledgerService.ensureAccount(CASH_ACCOUNT);
    const receivableAccount = await this.ledgerService.ensureAccount(
      INVESTOR_RECEIVABLE_ACCOUNT,
    );

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.COMPLETED },
        });
        await tx.paymentAttempt.updateMany({
          where: { paymentId: payment.id, status: PaymentStatus.PROCESSING },
          data: { status: PaymentStatus.COMPLETED },
        });

        if (payment.investmentId) {
          await this.ledgerService.createTransaction(
            {
              referenceType: 'PAYMENT',
              referenceId: payment.id,
              description: `Payment ${payment.id} settled for investment ${payment.investmentId}`,
              idempotencyKey: `payment-settlement-${payment.id}`,
              entries: [
                {
                  accountId: cashAccount.id,
                  debit: payment.amount.toString(),
                  currency: payment.currency,
                },
                {
                  accountId: receivableAccount.id,
                  credit: payment.amount.toString(),
                  currency: payment.currency,
                },
              ],
            },
            tx,
          );
        } else {
          const investorPayable = await this.ledgerService.ensureAccount(
            investorPayableAccountFor(payment.investmentId ?? 'wallet'),
          );
          await this.ledgerService.createTransaction(
            {
              referenceType: 'PAYMENT',
              referenceId: payment.id,
              description: `Wallet funding payment ${payment.id}`,
              idempotencyKey: `payment-wallet-${payment.id}`,
              entries: [
                {
                  accountId: cashAccount.id,
                  debit: payment.amount.toString(),
                  currency: payment.currency,
                },
                {
                  accountId: investorPayable.id,
                  credit: payment.amount.toString(),
                  currency: payment.currency,
                },
              ],
            },
            tx,
          );
        }
      });

      if (payment.investmentId) {
        await this.investmentsService.confirm(
          payment.investmentId,
          payment.providerReference ?? undefined,
        );
      }

      await this.createNotification(
        payment.userId,
        NotificationType.SYSTEM,
        'Payment completed',
        `Your payment of ${payment.amount.toString()} ${payment.currency} has been completed.`,
        { paymentId: payment.id, amount: payment.amount.toString() },
      );

      return this.getPaymentById(payment.id);
    } catch (error) {
      this.logger.error(
        `Failed to finalize payment ${payment.id}: ${
          error instanceof Error ? error.stack : error
        }`,
      );
      throw error;
    }
  }

  private async failPayment(payment: Payment, reason: string): Promise<Payment> {
    const updated = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      }),
      this.prisma.paymentAttempt.updateMany({
        where: { paymentId: payment.id, status: PaymentStatus.PROCESSING },
        data: { status: PaymentStatus.FAILED, errorMessage: reason },
      }),
    ]);

    await this.createNotification(
      payment.userId,
      NotificationType.PAYMENT_FAILED,
      'Payment failed',
      `Your payment of ${payment.amount.toString()} ${payment.currency} failed: ${reason}`,
      { paymentId: payment.id },
    );

    return updated[0];
  }

  /**
   * Reconciliation job: re-checks stale processing/pending payments with
   * the provider and settles them.
   */
  async reconcilePayments(maxAgeMinutes = 10) {
    const cutoff = new Date(
      Date.now() - Number(maxAgeMinutes) * 60 * 1000,
    );
    const stale = await this.prisma.payment.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
        updatedAt: { lte: cutoff },
      },
    });

    const results: Array<{ paymentId: string; outcome: string }> = [];
    for (const payment of stale) {
      try {
        if (!payment.providerReference) {
          await this.processPayment(payment.id);
          results.push({ paymentId: payment.id, outcome: 'resubmitted' });
          continue;
        }
        const provider = this.getProvider(payment.provider);
        const verification = await provider.verifyPayment(
          payment.providerReference,
        );
        if (verification.status === 'COMPLETED') {
          await this.finalizePayment(payment);
          results.push({ paymentId: payment.id, outcome: 'finalized' });
        } else if (
          verification.status === 'FAILED' ||
          verification.status === 'CANCELLED'
        ) {
          await this.failPayment(
            payment,
            verification.message ?? 'Failed during reconciliation',
          );
          results.push({ paymentId: payment.id, outcome: 'failed' });
        } else {
          results.push({ paymentId: payment.id, outcome: 'still_pending' });
        }
      } catch (error) {
        this.logger.error(
          `Reconciliation failed for payment ${payment.id}: ${
            error instanceof Error ? error.message : error
          }`,
        );
        results.push({ paymentId: payment.id, outcome: 'error' });
      }
    }

    return { scanned: stale.length, results };
  }

  /**
   * Stores an idempotency key + response pair so repeat requests can return
   * the original response instead of re-executing the operation.
   */
  async createIdempotencyCheck(
    key: string,
    response: unknown,
    statusCode: number,
    ttlHours = 24,
  ) {
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key },
    });
    if (existing) {
      return {
        cached: true,
        response: existing.response,
        statusCode: existing.statusCode,
      };
    }

    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    await this.prisma.idempotencyKey.upsert({
      where: { key },
      create: {
        key,
        response: response as Prisma.InputJsonValue,
        statusCode,
        expiresAt,
      },
      update: { response: response as Prisma.InputJsonValue, statusCode, expiresAt },
    });

    return { cached: false, response, statusCode };
  }

  private async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    try {
      await this.prisma.notification.create({
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
    }
  }
}