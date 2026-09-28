export type ProviderPaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export interface PaymentResult {
  success: boolean;
  providerReference: string;
  status: ProviderPaymentStatus;
  message?: string;
  raw?: Record<string, unknown>;
}

export interface PaymentVerification {
  success: boolean;
  providerReference: string;
  status: ProviderPaymentStatus;
  message?: string;
  raw?: Record<string, unknown>;
}

export interface RefundResult {
  success: boolean;
  providerReference: string;
  refundReference?: string;
  status: ProviderPaymentStatus;
  message?: string;
}

export interface WebhookPayload {
  id: string;
  eventType: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface PaymentProvider {
  name: string;

  createPayment(
    amount: string,
    currency: string,
    reference: string,
    metadata?: Record<string, unknown>,
  ): Promise<PaymentResult>;

  verifyPayment(reference: string): Promise<PaymentVerification>;

  processRefund(
    reference: string,
    amount: string,
    reason?: string,
  ): Promise<RefundResult>;

  verifyWebhook(payload: unknown, signature?: string): Promise<boolean>;

  signWebhook(payload: unknown): string;

  /** Optional: build a simulated event (used by dev providers). */
  buildWebhook?(
    providerReference: string,
    eventType?: string,
    extra?: Record<string, unknown>,
  ): WebhookPayload;
}