import { Injectable, NotFoundException } from '@nestjs/common';
import { abs, isGreaterThan, subtract } from '../common/utils/decimal.util';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/database.service';
import { BlockchainReconciliationService } from '../blockchain/reconciliation/blockchain-reconciliation.service';
import {
  DiscrepancySource,
  ReconciliationDiscrepancy,
  ReconciliationRunSummary,
  ReconciliationStatus,
} from './interfaces/admin.interface';
import { ResolveDiscrepancyDto } from './dto/admin-dashboard-query.dto';
import { AdminBaseService } from './admin-base.service';

@Injectable()
export class ReconciliationService extends AdminBaseService {
  private readonly runs = new Map<DiscrepancySource, ReconciliationRunSummary[]>();
  private readonly discrepancies = new Map<string, ReconciliationDiscrepancy>();

  constructor(
    prisma: PrismaService,
    private readonly blockchainReconciliation: BlockchainReconciliationService,
  ) {
    super(prisma);
  }

  getSupportedSources(): DiscrepancySource[] {
    return ['PAYMENTS', 'LEDGER', 'BLOCKCHAIN', 'ESCROW'];
  }

  async getStatus(): Promise<ReconciliationStatus> {
    const lastRun = {} as ReconciliationStatus['lastRun'];
    for (const source of this.getSupportedSources()) {
      const runs = this.runs.get(source) ?? [];
      lastRun[source] = runs.length > 0 ? runs[runs.length - 1] : null;
    }
    return {
      lastRun,
      unresolved: Array.from(this.discrepancies.values()).filter((d) => !d.resolved).length,
      total: this.discrepancies.size,
    };
  }

  async getAllRuns() {
    const out: Record<DiscrepancySource, ReconciliationRunSummary[]> = {} as Record<
      DiscrepancySource,
      ReconciliationRunSummary[]
    >;
    for (const source of this.getSupportedSources()) {
      out[source] = this.runs.get(source) ?? [];
    }
    return out;
  }

  async reconcile(source: DiscrepancySource, actorId: string): Promise<ReconciliationRunSummary> {
    const startedAt = new Date();
    const run: ReconciliationRunSummary = {
      id: randomUUID(),
      source,
      startedAt,
      completedAt: new Date(),
      status: 'success',
      scanned: 0,
      discrepancies: 0,
    };

    try {
      switch (source) {
        case 'BLOCKCHAIN': {
          const discrepancies = await this.blockchainReconciliation.reconcileInvestments();
          run.scanned = await this.prisma.investment.count();
          run.discrepancies = discrepancies.length;
          for (const discrepancy of discrepancies) {
            this.ingestDiscrepancy('BLOCKCHAIN', discrepancy);
          }
          break;
        }
        case 'PAYMENTS': {
          run.scanned = await this.prisma.payment.count();
          const orphaned = await this.findOrphanedPayments();
          run.discrepancies = orphaned.length;
          for (const row of orphaned) {
            this.addDiscrepancy('PAYMENTS', {
              type: 'ORPHANED_PAYMENT',
              severity: 'HIGH',
              description: `Payment ${row.id} is COMPLETED but its investment ${row.investmentId ?? 'none'} is not CONFIRMED`,
              relatedEntityId: row.id,
              dbValue: `payment:${row.status}`,
              expectedValue: 'investment:CONFIRMED',
            });
          }
          break;
        }
        case 'LEDGER': {
          run.scanned = await this.prisma.ledgerEntry.count();
          const unbalanced = await this.findUnbalancedLedgerEntries();
          run.discrepancies = unbalanced.length;
          for (const row of unbalanced) {
            this.addDiscrepancy('LEDGER', {
              type: 'UNBALANCED_ENTRY',
              severity: 'MEDIUM',
              description: `Ledger transaction ${row.id} does not balance (${row.sum})`,
              relatedEntityId: row.id,
              dbValue: row.sum,
              expectedValue: '0',
            });
          }
          break;
        }
        case 'ESCROW': {
          run.scanned = await this.prisma.escrowAccount.count();
          const mismatches = await this.findEscrowMismatches();
          run.discrepancies = mismatches.length;
          for (const row of mismatches) {
            this.addDiscrepancy('ESCROW', {
              type: 'ESCROW_MISMATCH',
              severity: 'HIGH',
              description: `Escrow account ${row.escrowAccountId} funded amount does not match sum of confirmed investments`,
              relatedEntityId: row.escrowAccountId,
              dbValue: `escrow:${row.fundedAmount}`,
              expectedValue: `investments:${row.investedTotal}`,
            });
          }
          break;
        }
        default: {
          run.status = 'error';
          run.message = `Unknown reconciliation source: ${source}`;
          break;
        }
      }

      await this.createAuditLog({
        actorId,
        action: 'RECONCILIATION_RUN',
        entityType: 'Reconciliation',
        newValues: {
          source,
          startedAt: startedAt.toISOString(),
          scanned: run.scanned,
          discrepancies: run.discrepancies,
          status: run.status,
        },
      });

      run.completedAt = new Date();
      this.recordRun(run);
      return run;
    } catch (error) {
      this.logger.error(
        `Reconciliation run for ${source} failed: ${
          error instanceof Error ? error.message : error
        }`,
        (error as Error).stack,
      );
      run.status = 'error';
      run.message = error instanceof Error ? error.message : String(error);
      run.completedAt = new Date();
      this.recordRun(run);
      return run;
    }
  }

  async getDiscrepancies(source?: DiscrepancySource) {
    let items = Array.from(this.discrepancies.values()).sort(
      (a, b) => b.detectedAt.getTime() - a.detectedAt.getTime(),
    );
    if (source) {
      items = items.filter((d) => d.source === source);
    }

    const active = items.filter((d) => !d.resolved);
    const resolved = items.filter((d) => d.resolved);

    return {
      total: items.length,
      active: active.length,
      resolved: resolved.length,
      activeItems: active,
      resolvedItems: resolved,
    };
  }

  async resolveDiscrepancy(id: string, actorId: string, dto: ResolveDiscrepancyDto) {
    const discrepancy = this.discrepancies.get(id);
    if (!discrepancy) {
      throw new NotFoundException(`Discrepancy ${id} not found`);
    }
    if (discrepancy.resolved) {
      return discrepancy;
    }

    let actionResult: string | undefined;
    if (dto.action === 'AUTO_FIX' && discrepancy.autoFixable) {
      try {
        const result = await this.blockchainReconciliation.autoFix(id);
        actionResult = result.message;
      } catch (error) {
        throw new NotFoundException(
          `Auto-fix failed: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    const updated: ReconciliationDiscrepancy = {
      ...discrepancy,
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: actorId,
      resolution: dto.action,
      autoFixActionResult: actionResult,
    };
    this.discrepancies.set(id, updated);

    await this.createAuditLog({
      actorId,
      action: 'RECONCILIATION_DISCREPANCY_RESOLVED',
      entityType: 'Reconciliation',
      entityId: id,
      newValues: { action: dto.action, notes: dto.notes ?? null },
    });

    return updated;
  }

  private addDiscrepancy(
    source: DiscrepancySource,
    input: {
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      description: string;
      relatedEntityType?: string;
      relatedEntityId?: string;
      dbValue?: string;
      expectedValue?: string;
      autoFixable?: boolean;
    },
  ) {
    const id = randomUUID();
    this.discrepancies.set(id, {
      id,
      source,
      type: input.type,
      severity: input.severity,
      description: input.description,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      dbValue: input.dbValue,
      expectedValue: input.expectedValue,
      detectedAt: new Date(),
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
      autoFixable: input.autoFixable ?? false,
    });
  }

  private ingestDiscrepancy(
    source: DiscrepancySource,
    discrepancy: {
      id: string;
      type: string;
      description: string;
      dbValue: string;
      chainValue: string;
      dealId: string | null;
      txHash: string | null;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      autoFixable: boolean;
      detectedAt: Date;
      resolvedAt: Date | null;
    },
  ) {
    this.discrepancies.set(discrepancy.id, {
      id: discrepancy.id,
      source,
      type: discrepancy.type,
      severity: discrepancy.severity,
      description: discrepancy.description,
      relatedEntityType: 'Deal',
      relatedEntityId: discrepancy.dealId ?? undefined,
      dbValue: discrepancy.dbValue,
      expectedValue: discrepancy.chainValue,
      detectedAt: discrepancy.detectedAt,
      resolved: discrepancy.resolvedAt !== null,
      resolvedAt: discrepancy.resolvedAt,
      resolvedBy: null,
      resolution: null,
      autoFixable: discrepancy.autoFixable,
    });
  }

  private async findOrphanedPayments() {
    const payments = await this.prisma.payment.findMany({
      where: { status: 'COMPLETED', investmentId: { not: null } },
      select: { id: true, status: true, investmentId: true },
    });
    return payments.filter((p) => p.investmentId !== null) as Array<{
      id: string;
      status: string;
      investmentId: string;
    }>;
  }

  private async findUnbalancedLedgerEntries() {
    const entries = await this.prisma.$queryRawUnsafe<
      { id: string; sum: string }[]
    >(`SELECT lt.id, ABS(SUM(le.debit) - SUM(le.credit))::text as sum
       FROM ledger_transactions lt
       JOIN ledger_entries le ON le."ledgerTransactionId" = lt.id
       GROUP BY lt.id
       HAVING ABS(SUM(le.debit) - SUM(le.credit)) > 0.0001
       ORDER BY lt.id
       LIMIT 500`);
    return entries;
  }

  private async findEscrowMismatches() {
    const escrowAccounts = await this.prisma.escrowAccount.findMany({
      select: {
        id: true,
        balance: true,
        lockedBalance: true,
      },
    });

    const mismatches: Array<{
      escrowAccountId: string;
      fundedAmount: string;
      investedTotal: string;
    }> = [];

    for (const account of escrowAccounts) {
      const aggregated = await this.prisma.investment.aggregate({
        where: {
          deal: { escrowAccount: { id: account.id } },
          status: { in: ['CONFIRMED', 'ACTIVE'] },
        },
        _sum: { amount: true },
      });
      const investedTotal = aggregated._sum.amount?.toString() ?? '0';
      const funded = account.balance.add(account.lockedBalance).toString();
      if (isGreaterThan(abs(subtract(funded, investedTotal)), '0.0001')) {
        mismatches.push({
          escrowAccountId: account.id,
          fundedAmount: funded,
          investedTotal,
        });
      }
    }
    return mismatches;
  }

  private recordRun(run: ReconciliationRunSummary) {
    const runs = this.runs.get(run.source) ?? [];
    runs.push(run);
    this.runs.set(run.source, runs);
  }
}