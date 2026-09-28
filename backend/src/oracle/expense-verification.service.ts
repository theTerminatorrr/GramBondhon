import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, OracleAttestation } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../database/database.service';
import { OracleService } from './oracle.service';
import { OracleEntityType } from './interfaces/oracle.interface';
import {
  buildPageMeta,
  buildPageParams,
  type PaginatedResult,
} from './interfaces/oracle.interface';

@Injectable()
export class ExpenseVerificationService {
  private readonly logger = new Logger(ExpenseVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly oracleService: OracleService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async verifyExpense(
    expenseId: string,
    verifierId: string,
    dto: { notes?: string },
  ): Promise<OracleAttestation> {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        project: {
          select: { id: true, name: true, status: true },
        },
        expenseDocuments: {
          select: { id: true, fileName: true, fileUrl: true, mimeType: true, uploadedAt: true },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    if (expense.approved) {
      throw new ConflictException(`Expense ${expenseId} is already approved`);
    }

    const hasReceipt = Boolean(expense.receiptUrl) || expense.expenseDocuments.length > 0;

    if (!hasReceipt) {
      throw new BadRequestException(
        `Expense ${expenseId} cannot be verified: receipt documentation is required ` +
          `(set receiptUrl or upload an expense document)`,
      );
    }

    const attestation = await this.oracleService.submitAttestation(
      verifierId,
      OracleEntityType.EXPENSE,
      expenseId,
      {
        category: expense.category,
        description: expense.description ?? null,
        amount: Number(expense.amount),
        vendor: expense.vendor ?? null,
        receivedDate: expense.incurredAt.toISOString(),
        projectId: expense.project.id,
        projectName: expense.project.name,
        receiptUrl: expense.receiptUrl ?? null,
        documentCount: expense.expenseDocuments.length,
        documents: expense.expenseDocuments.map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          uploadedAt: doc.uploadedAt.toISOString(),
        })),
        notes: dto.notes ?? null,
        verifiedBy: verifierId,
        verifiedAt: new Date().toISOString(),
      },
    );

    await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        approved: true,
        approvedBy: verifierId,
        approvedAt: new Date(),
      },
    });

    this.logger.log(
      `Expense ${expenseId} approved by ${verifierId}: ${expense.amount} (${expense.category})`,
    );

    this.eventEmitter.emit('expense.verified', {
      expenseId,
      projectId: expense.project.id,
      projectName: expense.project.name,
      category: expense.category,
      amount: Number(expense.amount),
      verifierId,
      attestationId: attestation.id,
    });

    return attestation;
  }

  async getPendingExpenses(query: {
    page?: number;
    limit?: number;
    projectId?: string;
  }): Promise<PaginatedResult<Record<string, unknown>>> {
    const { page, limit, skip, take } = buildPageParams(query);

    const where: Prisma.ExpenseWhereInput = {
      approved: false,
    };

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, status: true },
          },
          expenseDocuments: {
            select: { id: true, fileName: true, fileUrl: true, uploadedAt: true },
          },
        },
        orderBy: { incurredAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data: data as unknown as Record<string, unknown>[],
      meta: buildPageMeta(total, page, limit),
    };
  }
}