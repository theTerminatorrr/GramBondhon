import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EscrowTransactionType, Prisma, TransactionState } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { LedgerService } from '../ledger/ledger.service';
import {
  ZERO,
  add,
  equals,
  greaterThan,
  lessThan,
  round,
  subtract,
} from '../common/utils/decimal.util';
import {
  CASH_ACCOUNT,
  PLATFORM_FEE_REVENUE_ACCOUNT,
  escrowFundsAccountFor,
  investorPayableAccountFor,
} from '../common/constants/account-codes';
import { EscrowQueryDto } from './dto/escrow-query.dto';

type Client = Prisma.TransactionClient;

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async findAll(query: { page?: number; limit?: number } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.escrowAccount.findMany({
        include: { deal: { select: { id: true, title: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.escrowAccount.count(),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createEscrow(dealId: string) {
    const existing = await this.prisma.escrowAccount.findUnique({
      where: { dealId },
    });
    if (existing) {
      return existing;
    }
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true },
    });
    if (!deal) {
      throw new NotFoundException(`Deal ${dealId} not found`);
    }
    return this.prisma.escrowAccount.create({
      data: { dealId, balance: ZERO, lockedBalance: ZERO, status: 'ACTIVE' },
    });
  }

  async getEscrowById(escrowAccountId: string) {
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { id: escrowAccountId },
      include: { deal: true },
    });
    if (!escrow) {
      throw new NotFoundException(`Escrow account ${escrowAccountId} not found`);
    }
    return escrow;
  }

  /**
   * Credits funds into the escrow account.
   * Ledger: DR Escrow Funds / CR Cash.
   */
  async deposit(
    escrowAccountId: string,
    amount: string,
    fromRef?: string,
    options: { client?: Client; createLedger?: boolean } = {},
  ) {
    const value = round(amount);
    if (lessThan(value, ZERO)) {
      throw new BadRequestException('Deposit amount cannot be negative');
    }
    const escrow = await this.getEscrowById(escrowAccountId);
    if (escrow.status === 'REFUNDED' || escrow.status === 'CLOSED') {
      throw new ConflictException(
        `Escrow account ${escrowAccountId} is ${escrow.status}`,
      );
    }

    const [escrowLedgerAccount, cashAccount] = await Promise.all([
      this.ledgerService.ensureAccount(escrowFundsAccountFor(escrow.dealId)),
      this.ledgerService.ensureAccount(CASH_ACCOUNT),
    ]);

    return this.run(escrow, async (tx) => {
      const updated = await tx.escrowAccount.update({
        where: { id: escrowAccountId },
        data: { balance: add(escrow.balance.toString(), value) },
      });

      await this.recordTransaction(
        tx,
        escrowAccountId,
        'DEPOSIT',
        value,
        fromRef,
        undefined,
      );

      if (options.createLedger !== false) {
        await this.ledgerService.createTransaction(
          {
            referenceType: 'ESCROW',
            referenceId: escrowAccountId,
            description: `Deposit of ${value} into escrow for deal ${escrow.dealId}`,
            idempotencyKey: `escrow-deposit-${escrowAccountId}-${fromRef ?? 'ext'}-${value}`,
            entries: [
              { accountId: escrowLedgerAccount.id, debit: value, currency: 'BDT' },
              { accountId: cashAccount.id, credit: value, currency: 'BDT' },
            ],
          },
          tx,
        );
      }

      return updated;
    }, options.client);
  }

  /**
   * Locks escrow funds (reservation; no ledger movement).
   */
  async lock(escrowAccountId: string, amount: string, reason: string) {
    const value = round(amount);
    if (lessThan(value, ZERO)) {
      throw new BadRequestException('Lock amount cannot be negative');
    }
    const escrow = await this.getEscrowById(escrowAccountId);
    const available = subtract(escrow.balance.toString(), escrow.lockedBalance.toString());
    if (greaterThan(value, available)) {
      throw new BadRequestException(
        `Cannot lock ${value}; only ${available} is available`,
      );
    }

    const updated = await this.prisma.escrowAccount.update({
      where: { id: escrowAccountId },
      data: {
        lockedBalance: add(escrow.lockedBalance.toString(), value),
        status: 'LOCKED',
      },
    });

    await this.prisma.escrowTransaction.create({
      data: {
        escrowAccountId,
        type: 'LOCK',
        amount: value,
        fromReference: reason,
        state: TransactionState.CONFIRMED,
      },
    });

    return updated;
  }

  /**
   * Releases escrow funds (e.g. to a farmer for operations).
   * Ledger: DR Investor Payable / CR Escrow Funds.
   */
  async release(
    escrowAccountId: string,
    amount: string,
    toRef?: string,
    options: { client?: Client; createLedger?: boolean } = {},
  ) {
    const value = round(amount);
    if (lessThan(value, ZERO)) {
      throw new BadRequestException('Release amount cannot be negative');
    }
    const escrow = await this.getEscrowById(escrowAccountId);
    const available = subtract(escrow.balance.toString(), escrow.lockedBalance.toString());
    if (greaterThan(value, available)) {
      throw new BadRequestException(
        `Cannot release ${value}; only ${available} is available`,
      );
    }

    const [escrowLedgerAccount, payableAccount] = await Promise.all([
      this.ledgerService.ensureAccount(escrowFundsAccountFor(escrow.dealId)),
      this.ledgerService.ensureAccount(investorPayableAccountFor(escrow.dealId)),
    ]);

    return this.run(escrow, async (tx) => {
      const newBalance = subtract(escrow.balance.toString(), value);
      const newLocked = subtract(escrow.lockedBalance.toString(), value);

      const updated = await tx.escrowAccount.update({
        where: { id: escrowAccountId },
        data: {
          balance: newBalance,
          lockedBalance: greaterThan(newLocked, ZERO) ? newLocked : ZERO,
          status:
            equalsBalance(newBalance, ZERO) ? 'FULLY_RELEASED' : 'PARTIALLY_RELEASED',
        },
      });

      await this.recordTransaction(
        tx,
        escrowAccountId,
        'RELEASE',
        value,
        undefined,
        toRef,
      );

      if (options.createLedger !== false) {
        await this.ledgerService.createTransaction(
          {
            referenceType: 'ESCROW',
            referenceId: escrowAccountId,
            description: `Release of ${value} from escrow for deal ${escrow.dealId}`,
            idempotencyKey: `escrow-release-${escrowAccountId}-${toRef ?? 'ext'}-${value}`,
            entries: [
              { accountId: payableAccount.id, debit: value, currency: 'BDT' },
              { accountId: escrowLedgerAccount.id, credit: value, currency: 'BDT' },
            ],
          },
          tx,
        );
      }

      return updated;
    }, options.client);
  }

  /**
   * Refunds escrow funds back to an investor.
   * Ledger: DR Investor Payable / CR Cash.
   */
  async refund(
    escrowAccountId: string,
    amount: string,
    toRef?: string,
    options: { client?: Client; createLedger?: boolean } = {},
  ) {
    const value = round(amount);
    if (lessThan(value, ZERO)) {
      throw new BadRequestException('Refund amount cannot be negative');
    }
    const escrow = await this.getEscrowById(escrowAccountId);
    const available = subtract(escrow.balance.toString(), escrow.lockedBalance.toString());
    if (greaterThan(value, available)) {
      throw new BadRequestException(
        `Cannot refund ${value}; only ${available} is available`,
      );
    }

    const [payableAccount, cashAccount] = await Promise.all([
      this.ledgerService.ensureAccount(investorPayableAccountFor(escrow.dealId)),
      this.ledgerService.ensureAccount(CASH_ACCOUNT),
    ]);

    return this.run(escrow, async (tx) => {
      const newBalance = subtract(escrow.balance.toString(), value);
      const newLocked = subtract(escrow.lockedBalance.toString(), value);

      const updated = await tx.escrowAccount.update({
        where: { id: escrowAccountId },
        data: {
          balance: newBalance,
          lockedBalance: greaterThan(newLocked, ZERO) ? newLocked : ZERO,
          status: equalsBalance(newBalance, ZERO)
            ? 'REFUNDED'
            : 'PARTIALLY_RELEASED',
        },
      });

      await this.recordTransaction(
        tx,
        escrowAccountId,
        'REFUND',
        value,
        undefined,
        toRef,
      );

      if (options.createLedger !== false) {
        await this.ledgerService.createTransaction(
          {
            referenceType: 'ESCROW',
            referenceId: escrowAccountId,
            description: `Refund of ${value} from escrow for deal ${escrow.dealId}`,
            idempotencyKey: `escrow-refund-${escrowAccountId}-${toRef ?? 'ext'}-${value}`,
            entries: [
              { accountId: payableAccount.id, debit: value, currency: 'BDT' },
              { accountId: cashAccount.id, credit: value, currency: 'BDT' },
            ],
          },
          tx,
        );
      }

      return updated;
    }, options.client);
  }

  /**
   * Deducts the platform fee from escrow.
   * Ledger: DR Investor Payable / CR Platform Fee Revenue.
   */
  async deductFee(
    escrowAccountId: string,
    amount: string,
    feeRef?: string,
    options: { client?: Client; createLedger?: boolean } = {},
  ) {
    const value = round(amount);
    if (lessThan(value, ZERO)) {
      throw new BadRequestException('Fee amount cannot be negative');
    }
    const escrow = await this.getEscrowById(escrowAccountId);
    const available = subtract(escrow.balance.toString(), escrow.lockedBalance.toString());
    if (greaterThan(value, available)) {
      throw new BadRequestException(
        `Cannot deduct fee of ${value}; only ${available} is available`,
      );
    }

    const [payableAccount, feeAccount] = await Promise.all([
      this.ledgerService.ensureAccount(investorPayableAccountFor(escrow.dealId)),
      this.ledgerService.ensureAccount(PLATFORM_FEE_REVENUE_ACCOUNT),
    ]);

    return this.run(escrow, async (tx) => {
      const updated = await tx.escrowAccount.update({
        where: { id: escrowAccountId },
        data: { balance: subtract(escrow.balance.toString(), value) },
      });

      await this.recordTransaction(
        tx,
        escrowAccountId,
        'FEE',
        value,
        feeRef,
        undefined,
      );

      if (options.createLedger !== false) {
        await this.ledgerService.createTransaction(
          {
            referenceType: 'ESCROW',
            referenceId: escrowAccountId,
            description: `Platform fee of ${value} deducted from escrow for deal ${escrow.dealId}`,
            idempotencyKey: `escrow-fee-${escrowAccountId}-${feeRef ?? 'ext'}-${value}`,
            entries: [
              { accountId: payableAccount.id, debit: value, currency: 'BDT' },
              { accountId: feeAccount.id, credit: value, currency: 'BDT' },
            ],
          },
          tx,
        );
      }

      return updated;
    }, options.client);
  }

  async getBalance(escrowAccountId: string) {
    const escrow = await this.getEscrowById(escrowAccountId);
    return {
      escrowAccountId,
      dealId: escrow.dealId,
      balance: escrow.balance.toString(),
      lockedBalance: escrow.lockedBalance.toString(),
      available: subtract(escrow.balance.toString(), escrow.lockedBalance.toString()),
      status: escrow.status,
      currency: 'BDT',
    };
  }

  async getTransactions(escrowAccountId: string, query: EscrowQueryDto = {}) {
    await this.getEscrowById(escrowAccountId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.EscrowTransactionWhereInput = {
      escrowAccountId,
      ...(query.type ? { type: query.type as EscrowTransactionType } : {}),
      ...(query.reference
        ? { OR: [{ fromReference: query.reference }, { toReference: query.reference }] }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.escrowTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.escrowTransaction.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async run<T>(
    escrow: { id: string },
    fn: (tx: Client) => Promise<T>,
    client?: Client,
  ): Promise<T> {
    if (client) {
      return fn(client);
    }
    return this.prisma.$transaction(fn);
  }

  private async recordTransaction(
    tx: Client,
    escrowAccountId: string,
    type: 'DEPOSIT' | 'LOCK' | 'RELEASE' | 'REFUND' | 'FEE',
    amount: string,
    fromReference?: string,
    toReference?: string,
  ) {
    return tx.escrowTransaction.create({
      data: {
        escrowAccountId,
        type,
        amount,
        fromReference: fromReference ?? null,
        toReference: toReference ?? null,
        state: TransactionState.CONFIRMED,
      },
    });
  }
}

function equalsBalance(a: string, b: string): boolean {
  return equals(a, b);
}