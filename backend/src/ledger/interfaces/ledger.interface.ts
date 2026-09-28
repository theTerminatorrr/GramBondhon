import { Prisma } from '@prisma/client';

export type DecimalValue = string | number | Prisma.Decimal | { toString(): string };

export type TransactionStateValue =
  | 'PENDING'
  | 'SUBMITTED'
  | 'CONFIRMED'
  | 'FINALIZED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type AccountTypeValue =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'REVENUE'
  | 'EXPENSE';

export interface LedgerEntryInput {
  accountId: string;
  debit?: DecimalValue;
  credit?: DecimalValue;
  currency?: string;
}

export interface CreateLedgerTransactionInput {
  referenceType?: string;
  referenceId?: string;
  description?: string;
  idempotencyKey?: string;
  state?: TransactionStateValue;
  entries: LedgerEntryInput[];
  metadata?: Record<string, unknown>;
}

export interface LedgerAccountData {
  code: string;
  name: string;
  type: AccountTypeValue;
  subtype?: string;
  description?: string;
  parentId?: string;
}

export interface LedgerAccountBalance {
  accountId: string;
  accountCode: string;
  balance: string;
  currency: string;
}

export interface BalanceValidationResult {
  accountId: string;
  accountCode: string;
  expected: string;
  actual: string;
  difference: string;
  valid: boolean;
}

export interface ReconciliationResult {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountTypeValue;
  calculatedBalance: string;
  storedBalance: string | null;
  discrepancy: string;
  valid: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export interface LedgerQuery {
  page?: number;
  limit?: number;
  referenceType?: string;
  referenceId?: string;
  from?: string;
  to?: string;
}