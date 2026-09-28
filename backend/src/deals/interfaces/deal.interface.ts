import { DealStatus } from '@prisma/client';

export enum DealStage {
  PRE_LAUNCH = 'PRE_LAUNCH',
  FUNDING = 'FUNDING',
  ACTIVE = 'ACTIVE',
  COMPLETE = 'COMPLETE',
  TERMINAL = 'TERMINAL',
}

export interface DealView {
  id: string;
  projectId: string;
  farmerProfileId: string;
  title: string;
  description: string | null;
  status: DealStatus;
  fundingTarget: number;
  minimumInvestment: number;
  maximumInvestment: number;
  totalInvested: number;
  investorSharePercent: number;
  farmerSharePercent: number;
  platformFeePercent: number;
  investmentUnits: number;
  unitPrice: number;
  durationDays: number;
  startDate: Date | null;
  endDate: Date | null;
  smartContractAddress: string | null;
  blockchainTxHash: string | null;
  publishedAt: Date | null;
  fundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealTermView {
  id: string;
  dealId: string;
  content: string | null;
  version: number;
  hash: string | null;
  acceptedAt: Date | null;
  createdAt: Date;
}

export interface DealParticipantView {
  id: string;
  dealId: string;
  investorProfileId: string;
  joinedAt: Date;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface DealStats {
  dealId: string;
  status: DealStatus;
  fundingTarget: number;
  totalInvested: number;
  amountRemaining: number;
  fundingPercentage: number;
  investorCount: number;
  investmentCount: number;
  investedUnits: number;
  totalUnits: number;
  unitsRemaining: number;
  unitPrice: number;
  investorSharePercent: number;
  farmerSharePercent: number;
  platformFeePercent: number;
  averageInvestment: number;
  durationDays: number;
  startDate: Date | null;
  endDate: Date | null;
  daysLeft: number | null;
  publishedAt: Date | null;
  fundedAt: Date | null;
}

export interface DealStatusHistoryEntry {
  id: string;
  dealId: string;
  fromStatus: DealStatus | null;
  toStatus: DealStatus | null;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  reason: string | null;
  changedAt: Date;
}

export type NextActionRole = 'FARMER' | 'ADMIN' | 'SYSTEM';

export interface NextAction {
  action: string;
  targetStatus: DealStatus;
  requiresRole: NextActionRole;
}

export interface DealQueryOptions {
  page?: number;
  limit?: number;
  status?: DealStatus;
  search?: string;
  minFunding?: number;
  maxFunding?: number;
  farmerId?: string;
  cropId?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ViewerContext {
  userId: string;
  email: string;
  role: string;
}

export interface DealCompletenessResult {
  valid: boolean;
  missing: string[];
}