export type SortOrder = 'asc' | 'desc';

export interface PaginationQueryResult {
  page: number;
  limit: number;
  skip: number;
  take: number;
  where: Record<string, unknown>;
  orderBy: Record<string, SortOrder>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface BuildPaginationOptions {
  sortBy?: string;
  sortOrder?: SortOrder;
  allowedSortFields?: string[];
  defaultSortField?: string;
}

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function sanitizePage(page?: number): number {
  const value = Number(page);
  if (!Number.isInteger(value) || value < 1) {
    return 1;
  }
  return value;
}

export function sanitizeLimit(limit?: number, maxLimit = MAX_LIMIT): number {
  const value = Number(limit);
  if (!Number.isInteger(value) || value < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(value, maxLimit);
}

export function buildOrderBy(
  options: BuildPaginationOptions = {},
): Record<string, SortOrder> {
  const {
    sortBy,
    sortOrder = 'desc',
    allowedSortFields = [],
    defaultSortField = 'createdAt',
  } = options;

  const direction: SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
  const hasField =
    sortBy !== undefined &&
    sortBy !== null &&
    sortBy.length > 0 &&
    (allowedSortFields.length === 0 || allowedSortFields.includes(sortBy));

  const field = hasField ? (sortBy as string) : defaultSortField;
  return { [field]: direction };
}

export function createPaginationQuery(
  page?: number,
  limit?: number,
  filters: Record<string, unknown> = {},
  options: BuildPaginationOptions = {},
): PaginationQueryResult {
  const safePage = sanitizePage(page);
  const safeLimit = sanitizeLimit(limit);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    where: filters,
    orderBy: buildOrderBy(options),
  };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  totalItems: number,
): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function paginate<T>(
  items: T[],
  page: number,
  limit: number,
  totalItems: number,
): PaginatedResult<T> {
  return {
    items,
    meta: buildPaginationMeta(page, limit, totalItems),
  };
}