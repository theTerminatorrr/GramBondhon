export type ReportPeriod = 'day' | 'week' | 'month' | 'year';

export interface StatusCount {
  status: string;
  count: number;
}

export interface DashboardActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  createdAt: Date;
}

export interface MonthlyTrend {
  month: string;
  revenue: string;
  expenses: string;
  profit: string;
  investmentCount: number;
  investmentAmount: string;
}

export interface DashboardStats {
  farmers: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
  };
  investors: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    notStarted: number;
  };
  projects: {
    total: number;
    underReview: number;
    byStatus: Record<string, number>;
  };
  deals: {
    total: number;
    pendingReview: number;
    active: number;
    byStatus: Record<string, number>;
  };
  investments: {
    total: number;
    confirmed: number;
    totalAmount: string;
    confirmedAmount: string;
  };
  financials: {
    revenue: string;
    expenses: string;
    profit: string;
    profitMarginPercent: number | null;
  };
  blockchain: {
    transactions: number;
    pending: number;
    confirmed: number;
    failed: number;
  };
  recentActivity: DashboardActivityItem[];
  monthlyTrends: MonthlyTrend[];
  generatedAt: Date;
}

export interface DetailedStats {
  users: Array<StatusCount & { email?: string }>;
  farmers: { byVerificationStatus: Record<string, number>; total: number };
  investors: { byKycStatus: Record<string, number>; byType: Record<string, number>; total: number };
  projects: { byStatus: Record<string, number>; total: number };
  deals: { byStatus: Record<string, number>; total: number; active: number; funded: number };
  investments: {
    byStatus: Record<string, number>;
    byStatusAmount: Record<string, string>;
    total: number;
    totalAmount: string;
  };
  payments: { byStatus: Record<string, number>; total: number; failed: number };
  settlements: { byStatus: Record<string, number>; total: number };
  withdrawals: { byStatus: Record<string, number>; total: number; pending: number };
  blockchain: {
    byStatus: Record<string, number>;
    total: number;
  };
  topDeals: Array<{
    id: string;
    title: string;
    status: string;
    totalInvested: string;
    fundingTarget: string;
    fundingPercentage: number;
    farmerName: string | null;
  }>;
  topInvestors: Array<{
    investorProfileId: string;
    investorName: string;
    totalInvested: string;
    investmentCount: number;
  }>;
  recentFunding: Array<{
    id: string;
    dealId: string;
    dealTitle: string;
    investorName: string;
    amount: string;
    status: string;
    confirmedAt: Date | null;
  }>;
  generatedAt: Date;
}

export type RiskAlertType =
  | 'LARGE_INVESTMENT'
  | 'RAPID_CYCLE'
  | 'MULTIPLE_FAILED_PAYMENTS'
  | 'SUSPICIOUS_WALLET'
  | 'UNVERIFIED_LARGE_TRANSACTION';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskAlert {
  id: string;
  type: RiskAlertType;
  severity: RiskSeverity;
  title: string;
  description: string;
  userId?: string;
  investorProfileId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata: Record<string, unknown>;
  detectedAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskScore {
  userId: string;
  score: number;
  level: RiskLevel;
  factors: Record<string, number>;
  flags: string[];
  assessedAt: Date;
}

export interface RiskScanResult {
  scannedAt: Date;
  checks: RiskAlertType[];
  newAlerts: number;
  activeAlerts: number;
  alerts: RiskAlert[];
}

export type DiscrepancySource = 'PAYMENTS' | 'LEDGER' | 'BLOCKCHAIN' | 'ESCROW';
export type DiscrepancyAction = 'MARK_RESOLVED' | 'IGNORE' | 'AUTO_FIX';

export interface ReconciliationDiscrepancy {
  id: string;
  source: DiscrepancySource;
  type: string;
  severity: RiskSeverity;
  description: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  dbValue?: string;
  expectedValue?: string;
  detectedAt: Date;
  resolved: boolean;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolution: string | null;
  autoFixable: boolean;
  autoFixActionResult?: string;
}

export interface ReconciliationRunSummary {
  id: string;
  source: DiscrepancySource;
  startedAt: Date;
  completedAt: Date;
  status: 'success' | 'partial' | 'error';
  scanned: number;
  discrepancies: number;
  message?: string;
  details?: unknown;
}

export interface ReconciliationStatus {
  lastRun: Record<DiscrepancySource, ReconciliationRunSummary | null>;
  unresolved: number;
  total: number;
}

export interface FinancialTotals {
  amount: string;
  count: number;
}

export interface PeriodBucket {
  period: string;
  amount: string;
  count: number;
}

export interface RevenueReport {
  filters: Record<string, unknown>;
  totals: FinancialTotals;
  byPeriod: PeriodBucket[];
  byProject: Array<{ projectId: string; projectName: string; amount: string; count: number }>;
  byFarmer: Array<{ farmerId: string; farmerName: string; amount: string; count: number }>;
}

export interface ExpenseReport {
  filters: Record<string, unknown>;
  totals: FinancialTotals;
  byPeriod: PeriodBucket[];
  byCategory: Array<{ category: string; amount: string; count: number }>;
  byProject: Array<{ projectId: string; projectName: string; amount: string; count: number }>;
}

export interface ProfitReport {
  filters: Record<string, unknown>;
  totals: {
    grossProfit: string;
    platformFees: string;
    distributableProfit: string;
    investorProfit: string;
    farmerProfit: string;
    calculationCount: number;
  };
  byDeal: Array<{
    dealId: string;
    dealTitle: string;
    grossProfit: string;
    platformFees: string;
    investorProfit: string;
    farmerProfit: string;
    calculationCount: number;
  }>;
}

export interface SettlementReport {
  filters: Record<string, unknown>;
  totals: FinancialTotals;
  byPeriod: PeriodBucket[];
  byStatus: Record<string, { amount: string; count: number }>;
  byType: Record<string, { amount: string; count: number }>;
}

export interface InvestmentReport {
  filters: Record<string, unknown>;
  totals: {
    count: number;
    amount: string;
    units: number;
  };
  byPeriod: PeriodBucket[];
  byStatus: Record<string, { amount: string; count: number }>;
}

export interface AdminAuditLogEntry {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}