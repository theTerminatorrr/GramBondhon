import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  FarmerVerificationStatus,
  ProjectStatus,
  DealStatus,
  InvestmentStatus,
  WithdrawalStatus,
  PaymentStatus,
  WithdrawalMethod,
  KYCStatus,
  BlockchainTxStatus,
} from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

// ──────────────────────────────────────────────────────────────────
// Common admin DTOs
// ──────────────────────────────────────────────────────────────────

export class AdminDashboardQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString({})
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString({})
  to?: string;

  @ApiPropertyOptional({ default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  @IsNumber()
  monthlyMonths?: number = 6;
}

export class RejectReasonDto {
  @ApiProperty({ example: 'Profile documents are invalid or outdated', minLength: 5, maxLength: 2000 })
  @IsString()
  @MinLength(5, { message: 'reason must be at least 5 characters' })
  @MaxLength(2000, { message: 'reason must be at most 2000 characters' })
  reason!: string;
}

// ──────────────────────────────────────────────────────────────────
// Farmer Verification
// ──────────────────────────────────────────────────────────────────

export class FarmerVerificationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: FarmerVerificationStatus })
  @IsOptional()
  @IsEnum(FarmerVerificationStatus)
  status?: FarmerVerificationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  toDate?: string;
}

// ──────────────────────────────────────────────────────────────────
// Project Review
// ──────────────────────────────────────────────────────────────────

export class ProjectReviewQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  farmerId?: string;
}

// ──────────────────────────────────────────────────────────────────
// Deal Review
// ──────────────────────────────────────────────────────────────────

export class DealReviewQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DealStatus })
  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  farmerId?: string;
}

// ──────────────────────────────────────────────────────────────────
// Investment Monitoring
// ──────────────────────────────────────────────────────────────────

export class InvestmentAdminQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InvestmentStatus })
  @IsOptional()
  @IsEnum(InvestmentStatus)
  status?: InvestmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  dealId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  investorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  walletAddress?: string;
}

// ──────────────────────────────────────────────────────────────────
// Withdrawal Review
// ──────────────────────────────────────────────────────────────────

export class WithdrawalReviewQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: WithdrawalStatus })
  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;

  @ApiPropertyOptional({ enum: WithdrawalMethod })
  @IsOptional()
  @IsEnum(WithdrawalMethod)
  method?: WithdrawalMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  to?: string;
}

// ──────────────────────────────────────────────────────────────────
// Audit Logs
// ──────────────────────────────────────────────────────────────────

export class AuditLogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  actorId?: string;

  @ApiPropertyOptional({ example: 'DEAL_APPROVED' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: 'Deal' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  to?: string;
}

// ──────────────────────────────────────────────────────────────────
// Reconciliation
// ──────────────────────────────────────────────────────────────────

export class ResolveDiscrepancyDto {
  @ApiProperty({ enum: ['MARK_RESOLVED', 'IGNORE', 'AUTO_FIX'] })
  @IsEnum(['MARK_RESOLVED', 'IGNORE', 'AUTO_FIX'] as const)
  action!: 'MARK_RESOLVED' | 'IGNORE' | 'AUTO_FIX';

  @ApiPropertyOptional({ example: 'Discrepancy resolved via manual review' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

// ──────────────────────────────────────────────────────────────────
// Financial Reports
// ──────────────────────────────────────────────────────────────────

export class FinancialReportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  dealId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  farmerId?: string;

  @ApiPropertyOptional({ enum: ['day', 'week', 'month', 'year'] })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'] as const)
  period?: 'day' | 'week' | 'month' | 'year';
}

export class ExportReportQueryDto {
  @ApiProperty({ enum: ['revenue', 'expenses', 'profit', 'settlements', 'investments'] })
  @IsEnum(['revenue', 'expenses', 'profit', 'settlements', 'investments'] as const)
  type!: 'revenue' | 'expenses' | 'profit' | 'settlements' | 'investments';

  @ApiProperty({ enum: ['csv', 'json'] })
  @IsEnum(['csv', 'json'] as const)
  format!: 'csv' | 'json';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  dealId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  projectId?: string;
}

// ──────────────────────────────────────────────────────────────────
// Risk Alerts
// ──────────────────────────────────────────────────────────────────

export enum RiskAlertTypeFilter {
  LARGE_INVESTMENT = 'LARGE_INVESTMENT',
  RAPID_CYCLE = 'RAPID_CYCLE',
  MULTIPLE_FAILED_PAYMENTS = 'MULTIPLE_FAILED_PAYMENTS',
  SUSPICIOUS_WALLET = 'SUSPICIOUS_WALLET',
  UNVERIFIED_LARGE_TRANSACTION = 'UNVERIFIED_LARGE_TRANSACTION',
}

export enum RiskSeverityFilter {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class RiskAlertQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RiskSeverityFilter })
  @IsOptional()
  @IsEnum(RiskSeverityFilter)
  severity?: RiskSeverityFilter;

  @ApiPropertyOptional({ enum: RiskAlertTypeFilter })
  @IsOptional()
  @IsEnum(RiskAlertTypeFilter)
  type?: RiskAlertTypeFilter;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  acknowledged?: string;
}

export class AcknowledgeRiskAlertDto {
  @ApiPropertyOptional({ example: 'Alert reviewed and confirmed' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

// ──────────────────────────────────────────────────────────────────
// Blockchain Monitoring
// ──────────────────────────────────────────────────────────────────

export class BlockchainAdminQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BlockchainTxStatus })
  @IsOptional()
  @IsEnum(BlockchainTxStatus)
  status?: BlockchainTxStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  chainId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  to?: string;
}

// ──────────────────────────────────────────────────────────────────
// Risk Score Query
// ──────────────────────────────────────────────────────────────────

export class RiskScoreQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}

// ──────────────────────────────────────────────────────────────────
// Flag Investment DTO
// ──────────────────────────────────────────────────────────────────

export class FlagInvestmentDto {
  @ApiProperty({ example: 'Unusual investment pattern detected', minLength: 5, maxLength: 2000 })
  @IsString()
  @MinLength(5, { message: 'reason must be at least 5 characters' })
  @MaxLength(2000, { message: 'reason must be at most 2000 characters' })
  reason!: string;
}
