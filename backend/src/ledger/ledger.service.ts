import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Account, AccountType, Prisma, TransactionState } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/database.service';
import {
  ZERO,
  add,
  equals,
  isZero,
  round,
  subtract,
} from '../common/utils/decimal.util';
import {
  BalanceValidationResult,
  CreateLedgerTransactionInput,
  LedgerAccountData,
  LedgerAccountBalance,
  LedgerQuery,
  PaginationQuery,
  ReconciliationResult,
} from './interfaces/ledger.interface';

type Client = Prisma.TransactionClient;

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a ledger transaction with validating double-entry bookkeeping.
   * - Sum of debits must equal sum of credits.
   * - Running balances are updated per affected account.
   * - Idempotent on `idempotencyKey`.
   *
   * Passing an optional `client` allows the caller to run the ledger update
   * inside their own interactive Prisma transaction.
   */
  async createTransaction(
    input: CreateLedgerTransactionInput,
    client?: Client,
  ) {
    const idempotencyKey =
      input.idempotencyKey ?? `ltx-${randomUUID()}`;
    const idempotencyKeyTrimmed = idempotencyKey.trim();

    const existing = client
      ? await client.ledgerTransaction.findUnique({
          where: { idempotencyKey: idempotencyKeyTrimmed },
          include: { ledgerEntries: { include: { account: true } } },
        })
      : await this.prisma.ledgerTransaction.findUnique({
          where: { idempotencyKey: idempotencyKeyTrimmed },
          include: { ledgerEntries: { include: { account: true } } },
        });
    if (existing) {
      return existing;
    }

    if (!input.entries || input.entries.length < 2) {
      throw new BadRequestException(
        'A ledger transaction requires at least two entries',
      );
    }

    const normalized = input.entries.map((entry) => {
      const debit = round(entry.debit ?? ZERO);
      const credit = round(entry.credit ?? ZERO);
      if (isZero(debit) && isZero(credit)) {
        throw new BadRequestException(
          'Each ledger entry requires a non-zero debit or credit',
        );
      }
      if (!isZero(debit) && !isZero(credit)) {
        throw new BadRequestException(
          'A ledger entry cannot have both a debit and a credit',
        );
      }
      return {
        accountId: entry.accountId,
        debit,
        credit,
        currency: entry.currency?.toUpperCase() ?? 'BDT',
      };
    });

    const totalDebit = normalized.reduce((sum, e) => add(sum, e.debit), ZERO);
    const totalCredit = normalized.reduce((sum, e) => add(sum, e.credit), ZERO);
    if (!equals(totalDebit, totalCredit)) {
      throw new BadRequestException(
        `Ledger transaction unbalanced: debits ${totalDebit} do not equal credits ${totalCredit}`,
      );
    }

    const run = async (tx: Client) => {
      const accountMap = new Map<string, Account>();
      for (const entry of normalized) {
        const account = await tx.account.findUnique({
          where: { id: entry.accountId },
        });
        if (!account) {
          throw new BadRequestException(
            `Account ${entry.accountId} does not exist`,
          );
        }
        if (!account.isActive) {
          throw new ConflictException(
            `Account ${account.code} (${account.name}) is inactive`,
          );
        }
        if (!accountMap.has(account.id)) {
          // Row-lock the account so concurrent entries serialize correctly.
          await tx.$queryRaw`SELECT id FROM accounts WHERE id = ${account.id}::uuid FOR UPDATE`;
          accountMap.set(account.id, account);
        }
      }

      const ledgerTransaction = await tx.ledgerTransaction.create({
        data: {
          referenceType: input.referenceType ?? null,
          referenceId: input.referenceId ?? null,
          description: input.description ?? null,
          idempotencyKey: idempotencyKeyTrimmed,
          state:
            input.state ?? (TransactionState.CONFIRMED as TransactionState),
          metadata:
            input.metadata !== undefined && input.metadata !== null
              ? (input.metadata as unknown as Prisma.InputJsonValue)
              : undefined,
        },
      });

      const createdEntries = [];
      for (const entry of normalized) {
        const account = accountMap.get(entry.accountId)!;
        const last = await tx.ledgerEntry.findFirst({
          where: { accountId: account.id },
          orderBy: { createdAt: 'desc' },
        });
        const previousBalance = last
          ? last.runningBalance.toString()
          : ZERO;
        const delta = this.signedDelta(
          account.type as AccountType,
          entry.debit,
          entry.credit,
        );
        const newBalance = add(previousBalance, delta);

        const ledgerEntry = await tx.ledgerEntry.create({
          data: {
            ledgerTransactionId: ledgerTransaction.id,
            accountId: account.id,
            debit: entry.debit,
            credit: entry.credit,
            currency: entry.currency,
            runningBalance: newBalance,
          },
          include: { account: true },
        });
        createdEntries.push(ledgerEntry);
      }

      return {
        ...ledgerTransaction,
        ledgerEntries: createdEntries,
      };
    };

    if (client) {
      return run(client);
    }
    return this.prisma.$transaction(run);
  }

  /** Signed ledger movement for an account, honoring its natural side. */
  private signedDelta(
    accountType: AccountType,
    debit: string,
    credit: string,
  ): string {
    if (accountType === 'ASSET' || accountType === 'EXPENSE') {
      return subtract(debit, credit);
    }
    return subtract(credit, debit);
  }

  async getAccounts(query: { page?: number; limit?: number; type?: string } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AccountWhereInput = {
      ...(query.type ? { type: query.type as AccountType } : {}),
    };

    const [accounts, total] = await this.prisma.$transaction([
      this.prisma.account.findMany({
        where,
        include: { children: true, parent: true },
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.account.count({ where }),
    ]);

    return {
      data: accounts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAccountByCode(code: string) {
    return this.prisma.account.findUnique({ where: { code } });
  }

  async getAccountById(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: { parent: true, children: true },
    });
    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    return account;
  }

  async ensureAccount(data: LedgerAccountData): Promise<Account> {
    const existing = await this.prisma.account.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      return existing;
    }
    try {
      return await this.prisma.account.create({
        data: {
          code: data.code,
          name: data.name ?? data.code,
          type: data.type,
          subtype: data.subtype ?? null,
          description: data.description ?? null,
          parentId: data.parentId ?? null,
        },
      });
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        const existingAfter = await this.prisma.account.findUnique({
          where: { code: data.code },
        });
        if (existingAfter) {
          return existingAfter;
        }
      }
      throw error;
    }
  }

  ensureAccounts(data: LedgerAccountData[]): Promise<Account[]> {
    return Promise.all(data.map((account) => this.ensureAccount(account)));
  }

  async getAccountBalance(accountId: string): Promise<LedgerAccountBalance> {
    const account = await this.getAccountById(accountId);
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { accountId },
      orderBy: { createdAt: 'asc' },
    });

    const balance = entries.reduce(
      (sum, entry) =>
        add(
          sum,
          this.signedDelta(
            account.type as AccountType,
            entry.debit.toString(),
            entry.credit.toString(),
          ),
        ),
      ZERO,
    );

    return {
      accountId,
      accountCode: account.code,
      balance,
      currency: entries[0]?.currency ?? 'BDT',
    };
  }

  async getAccountEntries(
    accountId: string,
    query: PaginationQuery = {},
  ) {
    await this.getAccountById(accountId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.LedgerEntryWhereInput = {
      accountId,
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [entries, total] = await this.prisma.$transaction([
      this.prisma.ledgerEntry.findMany({
        where,
        include: { ledgerTransaction: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ledgerEntry.count({ where }),
    ]);

    return {
      data: entries,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTransactionDetails(transactionId: string) {
    const transaction = await this.prisma.ledgerTransaction.findUnique({
      where: { id: transactionId },
      include: {
        ledgerEntries: { include: { account: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!transaction) {
      throw new NotFoundException(
        `Ledger transaction ${transactionId} not found`,
      );
    }
    return transaction;
  }

  async getTransactions(query: LedgerQuery = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.LedgerTransactionWhereInput = {
      ...(query.referenceType ? { referenceType: query.referenceType } : {}),
      ...(query.referenceId ? { referenceId: query.referenceId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.ledgerTransaction.findMany({
        where,
        include: {
          ledgerEntries: { include: { account: true }, orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ledgerTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Verifies that the stored running balance matches a recomputation. */
  async validateBalance(accountId: string): Promise<BalanceValidationResult> {
    const account = await this.getAccountById(accountId);
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { accountId },
      orderBy: { createdAt: 'asc' },
    });

    let calculated = ZERO;
    let stored = ZERO;
    for (const entry of entries) {
      calculated = add(
        calculated,
        this.signedDelta(
          account.type as AccountType,
          entry.debit.toString(),
          entry.credit.toString(),
        ),
      );
      stored = entry.runningBalance.toString();
    }

    const difference = subtract(calculated, stored);
    return {
      accountId,
      accountCode: account.code,
      expected: calculated,
      actual: stored,
      difference,
      valid: equals(calculated, stored),
    };
  }

  /** Runs reconciliation across all active accounts. */
  async reconcile(start?: Date, end?: Date): Promise<ReconciliationResult[]> {
    const accounts = await this.prisma.account.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    const results: ReconciliationResult[] = [];
    for (const account of accounts) {
      const entries = await this.prisma.ledgerEntry.findMany({
        where: {
          accountId: account.id,
          ...(start || end
            ? {
                createdAt: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'asc' },
      });

      let calculated = ZERO;
      let stored: string | null = null;
      for (const entry of entries) {
        calculated = add(
          calculated,
          this.signedDelta(
            account.type as AccountType,
            entry.debit.toString(),
            entry.credit.toString(),
          ),
        );
        stored = entry.runningBalance.toString();
      }

      results.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type as AccountType,
        calculatedBalance: calculated,
        storedBalance: stored,
        discrepancy: stored !== null ? subtract(calculated, stored) : subtract(calculated, ZERO),
        valid: stored !== null ? equals(calculated, stored) : equals(calculated, ZERO),
      });
    }

    return results;
  }
}