import { Injectable } from '@nestjs/common';
import { InvestmentStatus, KYCStatus, WithdrawalStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/database.service';
import { toDecimal, greaterThanOrEqual } from '../common/utils/decimal.util';
import {
  RiskAlert,
  RiskAlertType,
  RiskLevel,
  RiskScore,
  RiskScanResult,
  RiskSeverity,
} from './interfaces/admin.interface';
import {
  AcknowledgeRiskAlertDto,
  RiskAlertQueryDto,
  RiskScoreQueryDto,
} from './dto/admin-dashboard-query.dto';
import { AdminBaseService } from './admin-base.service';

const LARGE_INVESTMENT_THRESHOLD = 100000;
const RAPID_CYCLE_THRESHOLD_MS = 30 * 60 * 1000;
const RAPID_CYCLE_UNITS = 3;
const FAILED_PAYMENT_THRESHOLD = 2;

@Injectable()
export class RiskService extends AdminBaseService {
  private readonly alerts = new Map<string, RiskAlert>();
  private readonly scores = new Map<string, RiskScore>();

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async runRiskScan(): Promise<RiskScanResult> {
    const alerts: RiskAlert[] = [
      ...(await this.scanLargeInvestments()),
      ...(await this.scanRapidCycles()),
      ...(await this.scanFailedPayments()),
      ...(await this.scanSuspiciousWallets()),
      ...(await this.scanUnverifiedLargeTransactions()),
    ];

    let newAlerts = 0;
    for (const alert of alerts) {
      const key = this.alertKey(alert);
      const existing = this.alerts.get(key);
      if (!existing) {
        this.alerts.set(key, alert);
        newAlerts += 1;
      }
    }

    this.logger.log(`Risk scan completed: ${newAlerts} new alerts, ${this.alerts.size} active`);

    return {
      scannedAt: new Date(),
      checks: [
        'LARGE_INVESTMENT',
        'RAPID_CYCLE',
        'MULTIPLE_FAILED_PAYMENTS',
        'SUSPICIOUS_WALLET',
        'UNVERIFIED_LARGE_TRANSACTION',
      ],
      newAlerts,
      activeAlerts: this.alerts.size,
      alerts: Array.from(this.alerts.values()).sort(
        (a, b) => b.detectedAt.getTime() - a.detectedAt.getTime(),
      ),
    };
  }

  async getAlerts(query: RiskAlertQueryDto = new RiskAlertQueryDto(), actorId?: string) {
    let alerts = Array.from(this.alerts.values()).sort(
      (a, b) => b.detectedAt.getTime() - a.detectedAt.getTime(),
    );

    if (query.severity) {
      alerts = alerts.filter((alert) => alert.severity === query.severity);
    }
    if (query.type) {
      alerts = alerts.filter((alert) => alert.type === query.type);
    }
    if (query.acknowledged !== undefined) {
      const isAcknowledged = query.acknowledged === 'true';
      alerts = alerts.filter((alert) => alert.acknowledged === isAcknowledged);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;
    const items = alerts.slice(start, start + limit);

    if (actorId) {
      await this.createAuditLog({
        actorId,
        action: 'RISK_ALERTS_VIEWED',
        entityType: 'RiskAlert',
      });
    }

    return {
      data: items,
      meta: {
        page,
        limit,
        total: alerts.length,
        totalPages: Math.ceil(alerts.length / limit),
      },
    };
  }

  async getAlertById(id: string) {
    const alert = this.alerts.get(id);
    if (!alert) {
      throw new Error(`Risk alert ${id} not found`);
    }
    return alert;
  }

  async acknowledgeAlert(id: string, adminId: string, dto: AcknowledgeRiskAlertDto = {}) {
    const alert = await this.getAlertById(id);
    if (alert.acknowledged) {
      return alert;
    }

    const updated: RiskAlert = {
      ...alert,
      acknowledged: true,
      acknowledgedBy: adminId,
      acknowledgedAt: new Date(),
    };
    this.alerts.set(id, updated);

    await this.createAuditLog({
      actorId: adminId,
      action: 'RISK_ALERT_ACKNOWLEDGED',
      entityType: 'RiskAlert',
      entityId: id,
      newValues: { notes: dto.notes ?? null, severity: alert.severity },
    });

    return updated;
  }

  async getRiskScore(query: RiskScoreQueryDto = {}) {
    if (query.userId) {
      const candidate = this.scores.get(query.userId);
      if (candidate) {
        return candidate;
      }
      const computed = await this.computeRiskScore(query.userId);
      return computed;
    }
    return Array.from(this.scores.values());
  }

  async getRiskScoreForUser(userId: string): Promise<RiskScore> {
    const cached = this.scores.get(userId);
    if (cached) {
      return cached;
    }
    return this.computeRiskScore(userId);
  }

  private async computeRiskScore(userId: string): Promise<RiskScore> {
    const [investments, withdrawals, payments] = await Promise.all([
      this.prisma.investment.findMany({
        where: { investorProfile: { userId } },
        select: { status: true, amount: true, confirmedAt: true, blockchainTxHash: true },
      }),
      this.prisma.withdrawal.findMany({
        where: { userId },
        select: { status: true, amount: true },
      }),
      this.prisma.payment.findMany({
        where: { userId },
        select: { status: true },
      }),
    ]);

    const factors: Record<string, number> = {};
    const flags: string[] = [];

    const failedPayments = payments.filter((p) => p.status === 'FAILED').length;
    factors.failedPayments = failedPayments;
    if (failedPayments >= FAILED_PAYMENT_THRESHOLD) {
      flags.push('Multiple failed payment attempts');
    }

    const confirmedInvestments = investments.filter(
      (i) => i.status === InvestmentStatus.CONFIRMED || i.status === InvestmentStatus.ACTIVE,
    );
    factors.confirmedInvestments = confirmedInvestments.length;
    if (confirmedInvestments.length === 0 && investments.length > 0) {
      flags.push('No successful investments despite activity');
    }

    const withdrawalsPending = withdrawals.filter((w) => w.status === WithdrawalStatus.PENDING).length;
    factors.pendingWithdrawals = withdrawalsPending;

    let score = 0;
    score += Math.min(failedPayments * 15, 30);
    score += Math.min(withdrawalsPending * 10, 20);
    score += Math.min(confirmedInvestments.length * 5, 20);
    if (flags.length > 0) {
      score += 10;
    }
    score = Math.min(score, 100);

    const level: RiskLevel = score < 30 ? 'LOW' : score < 60 ? 'MEDIUM' : score < 80 ? 'HIGH' : 'CRITICAL';

    const result: RiskScore = {
      userId,
      score,
      level,
      factors,
      flags,
      assessedAt: new Date(),
    };
    this.scores.set(userId, result);
    return result;
  }

  private async scanLargeInvestments(): Promise<RiskAlert[]> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const investments = await this.prisma.investment.findMany({
      where: {
        createdAt: { gte: cutoff },
        investorProfile: { kycStatus: { in: [KYCStatus.PENDING, KYCStatus.NOT_STARTED] } },
      },
      select: {
        id: true,
        amount: true,
        investorProfile: { select: { userId: true } },
      },
    });

    const alerts: RiskAlert[] = [];
    for (const investment of investments) {
      if (greaterThanOrEqual(investment.amount, LARGE_INVESTMENT_THRESHOLD)) {
        alerts.push({
          id: randomUUID(),
          type: 'LARGE_INVESTMENT',
          severity: 'CRITICAL',
          title: 'Large investment with unverified KYC',
          description: `Investment ${investment.id} of ${investment.amount} was made by an investor whose KYC is not fully verified.`,
          userId: investment.investorProfile.userId,
          relatedEntityType: 'Investment',
          relatedEntityId: investment.id,
          metadata: { amount: investment.amount.toString() },
          detectedAt: new Date(),
          acknowledged: false,
        });
      }
    }
    return alerts;
  }

  private async scanRapidCycles(): Promise<RiskAlert[]> {
    const cutoff = new Date(Date.now() - RAPID_CYCLE_THRESHOLD_MS);
    const investments = await this.prisma.investment.findMany({
      where: { createdAt: { gte: cutoff } },
      select: {
        id: true,
        investorProfileId: true,
        investorProfile: { select: { userId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const byInvestor = new Map<string, { userId: string; ids: string[] }>();
    for (const investment of investments) {
      const entry = byInvestor.get(investment.investorProfileId) ?? {
        userId: investment.investorProfile.userId,
        ids: [],
      };
      entry.ids.push(investment.id);
      byInvestor.set(investment.investorProfileId, entry);
    }

    const alerts: RiskAlert[] = [];
    for (const [investorProfileId, entry] of byInvestor.entries()) {
      if (entry.ids.length >= RAPID_CYCLE_UNITS) {
        alerts.push({
          id: randomUUID(),
          type: 'RAPID_CYCLE',
          severity: 'HIGH',
          title: 'Rapid investment cycling detected',
          description: `Investor profile ${investorProfileId} made ${entry.ids.length} investments within a short window (${RAPID_CYCLE_THRESHOLD_MS / 60000} minutes).`,
          userId: entry.userId,
          investorProfileId,
          relatedEntityType: 'InvestorProfile',
          relatedEntityId: investorProfileId,
          metadata: { investmentCount: entry.ids.length, investmentIds: entry.ids },
          detectedAt: new Date(),
          acknowledged: false,
        });
      }
    }
    return alerts;
  }

  private async scanFailedPayments(): Promise<RiskAlert[]> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const grouped = await this.prisma.payment.groupBy({
      by: ['userId'],
      where: { status: 'FAILED', createdAt: { gte: cutoff } },
      _count: { _all: true },
    });

    const alerts: RiskAlert[] = [];
    for (const group of grouped) {
      if (group._count._all >= FAILED_PAYMENT_THRESHOLD) {
        alerts.push({
          id: randomUUID(),
          type: 'MULTIPLE_FAILED_PAYMENTS',
          severity: 'MEDIUM',
          title: 'Multiple failed payment attempts',
          description: `User ${group.userId} has ${group._count._all} failed payment(s) in the last 7 days.`,
          userId: group.userId,
          relatedEntityType: 'Payment',
          metadata: { failedCount: group._count._all },
          detectedAt: new Date(),
          acknowledged: false,
        });
      }
    }
    return alerts;
  }

  private async scanSuspiciousWallets(): Promise<RiskAlert[]> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const investments = await this.prisma.investment.findMany({
      where: {
        walletAddress: { not: null },
        createdAt: { gte: cutoff },
      },
      select: {
        id: true,
        walletAddress: true,
        investorProfile: { select: { userId: true } },
      },
    });

    const byWallet = new Map<string, { userId: string | null; count: number }>();
    for (const investment of investments) {
      const wallet = investment.walletAddress;
      if (!wallet) continue;
      const current = byWallet.get(wallet) ?? { userId: investment.investorProfile?.userId ?? null, count: 0 };
      current.count += 1;
      if (!current.userId && investment.investorProfile?.userId) {
        current.userId = investment.investorProfile?.userId ?? null;
      }
      byWallet.set(wallet, current);
    }

    const alerts: RiskAlert[] = [];
    for (const [wallet, entry] of byWallet.entries()) {
      if (entry.count >= RAPID_CYCLE_UNITS) {
        alerts.push({
          id: randomUUID(),
          type: 'SUSPICIOUS_WALLET',
          severity: 'HIGH',
          title: 'Wallet reused across multiple investments',
          description: `Wallet ${wallet} was used for ${entry.count} investment(s), of which at least one originated from a different user account.`,
          userId: entry.userId ?? undefined,
          relatedEntityType: 'Investment',
          metadata: { walletAddress: wallet, usageCount: entry.count },
          detectedAt: new Date(),
          acknowledged: false,
        });
      }
    }
    return alerts;
  }

  private async scanUnverifiedLargeTransactions(): Promise<RiskAlert[]> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const investors = await this.prisma.investorProfile.findMany({
      where: {
        kycStatus: { in: [KYCStatus.NOT_STARTED, KYCStatus.PENDING] },
        investments: {
          some: { createdAt: { gte: cutoff } },
        },
      },
      select: {
        id: true,
        userId: true,
        investments: {
          where: { createdAt: { gte: cutoff } },
          select: { id: true, amount: true },
        },
      },
    });

    const alerts: RiskAlert[] = [];
    for (const investor of investors) {
      let total = toDecimal(0);
      const ids: string[] = [];
      for (const investment of investor.investments) {
        total = total.plus(toDecimal(investment.amount));
        ids.push(investment.id);
      }
      if (greaterThanOrEqual(total, LARGE_INVESTMENT_THRESHOLD)) {
        alerts.push({
          id: randomUUID(),
          type: 'UNVERIFIED_LARGE_TRANSACTION',
          severity: 'HIGH',
          title: 'Unverified investor with large total transactions',
          description: `Investor ${investor.id} has unverified KYC but total investments of ${total.toString()} exceeded the threshold.`,
          userId: investor.userId,
          investorProfileId: investor.id,
          relatedEntityType: 'Investment',
          metadata: { totalAmount: total.toString(), investmentIds: ids },
          detectedAt: new Date(),
          acknowledged: false,
        });
      }
    }
    return alerts;
  }

  private alertKey(alert: RiskAlert): string {
    return `${alert.type}:${alert.relatedEntityId ?? alert.userId ?? alert.investorProfileId ?? 'global'}`;
  }
}