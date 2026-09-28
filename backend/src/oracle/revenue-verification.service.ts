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

const REVENUE_TO_SALE_TOLERANCE = 1.05;

@Injectable()
export class RevenueVerificationService {
  private readonly logger = new Logger(RevenueVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly oracleService: OracleService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async verifyRevenue(
    revenueId: string,
    verifierId: string,
    dto: { notes?: string },
  ): Promise<OracleAttestation> {
    const revenue = await this.prisma.revenue.findUnique({
      where: { id: revenueId },
      include: {
        project: {
          select: { id: true, name: true, status: true },
        },
        sale: {
          select: {
            id: true,
            buyerName: true,
            buyerContact: true,
            quantity: true,
            unit: true,
            unitPrice: true,
            totalAmount: true,
            saleDate: true,
            verified: true,
            harvestId: true,
          },
        },
      },
    });

    if (!revenue) {
      throw new NotFoundException(`Revenue ${revenueId} not found`);
    }

    const sale = revenue.sale;

    if (sale) {
      const reported = Number(revenue.amount);
      const saleTotal = Number(sale.totalAmount);
      const maxAllowed = saleTotal * REVENUE_TO_SALE_TOLERANCE;
      if (saleTotal > 0 && reported > maxAllowed) {
        throw new BadRequestException(
          `Revenue amount ${reported} exceeds linked sale total ${saleTotal} ` +
            `(× ${REVENUE_TO_SALE_TOLERANCE} tolerance)`,
        );
      }
      if (sale.harvestId) {
        const harvest = await this.prisma.harvest.findUnique({
          where: { id: sale.harvestId },
          select: { verified: true, qualityGrade: true },
        });
        if (harvest && !harvest.verified) {
          this.logger.warn(
            `Revenue ${revenue.id} linked to sale ${sale.id} whose harvest is not yet verified`,
          );
        }
      }
    } else {
      this.logger.warn(
        `Revenue ${revenue.id} has no linked sale record; verifying on project reference only`,
      );
    }

    const entityType = sale ? OracleEntityType.SALE : OracleEntityType.PROJECT;
    const entityId = sale ? sale.id : revenue.projectId;

    const attestation = await this.oracleService.submitAttestation(
      verifierId,
      entityType,
      entityId,
      {
        revenueId: revenue.id,
        amount: Number(revenue.amount),
        currency: revenue.currency,
        source: revenue.source,
        receivedAt: revenue.receivedAt.toISOString(),
        projectId: revenue.projectId,
        projectName: revenue.project.name,
        linkedSale: sale
          ? {
              saleId: sale.id,
              buyerName: sale.buyerName,
              buyerContact: sale.buyerContact,
              quantity: Number(sale.quantity),
              unit: sale.unit,
              unitPrice: Number(sale.unitPrice),
              totalAmount: Number(sale.totalAmount),
              saleDate: sale.saleDate.toISOString(),
              saleVerified: sale.verified,
            }
          : null,
        notes: dto.notes ?? null,
        verifiedBy: verifierId,
        verifiedAt: new Date().toISOString(),
      },
    );

    if (sale && !sale.verified) {
      await this.prisma.sale.update({
        where: { id: sale.id },
        data: {
          verified: true,
          verifiedBy: verifierId,
        },
      });
    }

    this.logger.log(
      `Revenue ${revenue.id} verified by ${verifierId}: amount=${revenue.amount} ${revenue.currency}`,
    );

    this.eventEmitter.emit('revenue.verified', {
      revenueId,
      projectId: revenue.projectId,
      projectName: revenue.project.name,
      saleId: sale?.id ?? null,
      amount: Number(revenue.amount),
      currency: revenue.currency,
      verifierId,
      attestationId: attestation.id,
    });

    return attestation;
  }

  async getUnverifiedRevenues(query: {
    page?: number;
    limit?: number;
    projectId?: string;
  }): Promise<PaginatedResult<Record<string, unknown>>> {
    const { page, limit, skip, take } = buildPageParams(query);

    const where: Prisma.RevenueWhereInput = {
      OR: [
        { saleId: null },
        { sale: { is: { verified: false } } },
      ],
    };

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.revenue.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, status: true },
          },
          sale: {
            select: {
              id: true,
              totalAmount: true,
              buyerName: true,
              saleDate: true,
              verified: true,
            },
          },
        },
        orderBy: { receivedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.revenue.count({ where }),
    ]);

    return {
      data: data as unknown as Record<string, unknown>[],
      meta: buildPageMeta(total, page, limit),
    };
  }
}