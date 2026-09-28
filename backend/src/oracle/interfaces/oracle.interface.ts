import { Prisma } from '@prisma/client';

export enum OracleEntityType {
  PROJECT = 'PROJECT',
  HARVEST = 'HARVEST',
  SALE = 'SALE',
  EXPENSE = 'EXPENSE',
}

export type OracleEntityTypeValue =
  | OracleEntityType.PROJECT
  | OracleEntityType.HARVEST
  | OracleEntityType.SALE
  | OracleEntityType.EXPENSE;

export interface SubmitAttestationInput {
  entityType: OracleEntityTypeValue;
  entityId: string;
  data: Record<string, unknown>;
}

export interface VerifyAttestationInput {
  notes?: string;
}

export interface OracleQuery {
  page?: number;
  limit?: number;
  entityType?: OracleEntityTypeValue;
  entityId?: string;
  verified?: boolean;
}

export interface VerificationQuery {
  page?: number;
  limit?: number;
  projectId?: string;
}

export interface OracleAttestationResult {
  id: string;
  entityType: string;
  entityId: string;
  attesterId: string;
  dataHash: string;
  data: Prisma.JsonValue;
  signature?: string | null;
  verified: boolean;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  blockchainTxHash?: string | null;
  createdAt: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function canonicalStringify(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(',')}]`;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${canonicalStringify(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function buildPageParams(query: { page?: number; limit?: number }) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function buildPageMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}