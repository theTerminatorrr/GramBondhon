import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ZapierEventPayload } from './dto/zapier-webhook.dto';

@Injectable()
export class ZapierService {
  private readonly logger = new Logger(ZapierService.name);

  constructor(private readonly configService: ConfigService) {}

  public get isEnabled(): boolean {
    const enabled = this.configService.get<string>('ZAPIER_WEBHOOK_ENABLED', 'true');
    return enabled === 'true' || enabled === '1';
  }

  public get defaultWebhookUrl(): string | undefined {
    return this.configService.get<string>('ZAPIER_WEBHOOK_URL');
  }

  public get webhookSecret(): string | undefined {
    return this.configService.get<string>('ZAPIER_WEBHOOK_SECRET');
  }

  public getStatus() {
    const url = this.defaultWebhookUrl;
    let maskedUrl: string | null = null;
    if (url) {
      try {
        const parsed = new URL(url);
        maskedUrl = `${parsed.origin}${parsed.pathname.slice(0, 15)}...`;
      } catch {
        maskedUrl = '***configured***';
      }
    }

    return {
      enabled: this.isEnabled,
      isConfigured: Boolean(url),
      webhookUrl: maskedUrl,
      hasSecretConfigured: Boolean(this.webhookSecret),
      supportedEvents: [
        'deal.approved',
        'deal.funding.completed',
        'investment.confirmed',
        'payment.failed',
        'harvest.recorded',
        'profit.distributed',
      ],
    };
  }

  /**
   * Dispatches a webhook payload to Zapier
   */
  async sendEvent<T = any>(
    event: string,
    data: T,
    overrideUrl?: string,
  ): Promise<{ success: boolean; status?: number; error?: string }> {
    if (!this.isEnabled) {
      this.logger.debug(`Zapier webhook disabled; skipping event: ${event}`);
      return { success: false, error: 'Zapier webhooks are disabled' };
    }

    const targetUrl = overrideUrl || this.defaultWebhookUrl;
    if (!targetUrl) {
      this.logger.debug(`No Zapier webhook URL configured; skipping event: ${event}`);
      return { success: false, error: 'No webhook URL configured' };
    }

    const payload: ZapierEventPayload<T> = {
      event,
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      data,
    };

    const bodyString = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'GramBondhon-Webhook-Dispatcher/1.0',
    };

    // Attach HMAC signature header if secret is present
    if (this.webhookSecret) {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(bodyString);
      headers['X-GM-Signature'] = `sha256=${hmac.digest('hex')}`;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

      this.logger.log(`Dispatching event '${event}' to Zapier hook`);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: bodyString,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        this.logger.warn(`Zapier webhook returned status ${response.status}: ${errorText}`);
        return { success: false, status: response.status, error: `HTTP ${response.status}` };
      }

      this.logger.log(`Successfully dispatched '${event}' to Zapier`);
      return { success: true, status: response.status };
    } catch (error: any) {
      const msg = error?.name === 'AbortError' ? 'Webhook request timed out' : error?.message || 'Unknown network error';
      this.logger.error(`Failed to send event '${event}' to Zapier: ${msg}`);
      return { success: false, error: msg };
    }
  }

  /**
   * Send test payload to verify Zapier connection
   */
  async sendTestPing(customUrl?: string, customMessage?: string) {
    return this.sendEvent(
      'zapier.test.ping',
      {
        message: customMessage || 'Test ping from GramBondhon Agri-Platform',
        serverTime: new Date().toISOString(),
        testId: crypto.randomUUID(),
      },
      customUrl,
    );
  }
}
