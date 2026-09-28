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

const HARVEST_TOLERANCE_RATIO = 1.5;
const VALID_PROJECT_STATUSES = ['APPROVED', 'ACTIVE', 'COMPLETED'];

@Injectable()
export class HarvestVerificationService {
  private readonly logger = new Logger(HarvestVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly oracleService: OracleService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async verifyHarvest(
    harvestId: string,
    verifierId: string,
    dto: { quantity: number; qualityGrade?: string; notes?: string },
  ): Promise<OracleAttestation> {
    const harvest = await this.prisma.harvest.findUnique({
      where: { id: harvestId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            expectedYield: true,
            cropId: true,
          },
        },
        recordedByUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!harvest) {
      throw new NotFoundException(`Harvest ${harvestId} not found`);
    }

    if (harvest.verified) {
      throw new ConflictException(`Harvest ${harvestId} is already verified`);
    }

    if (!VALID_PROJECT_STATUSES.includes(harvest.project.status)) {
      throw new BadRequestException(
        `Harvest belongs to project ${harvest.project.id} which has status '${harvest.project.status}'. ` +
          `Project must be ${VALID_PROJECT_STATUSES.join(', ')}`,
      );
    }

    if (dto.quantity <= 0) {
      throw new BadRequestException('Verified quantity must be greater than zero');
    }

    const expectedYield = harvest.project.expectedYield
      ? Number(harvest.project.expectedYield)
      : null;

    if (expectedYield !== null && expectedYield > 0) {
      const maxAllowed = expectedYield * HARVEST_TOLERANCE_RATIO;
      if (dto.quantity > maxAllowed) {
        throw new BadRequestException(
          `Verified quantity ${dto.quantity} exceeds maximum allowed ${maxAllowed.toFixed(2)} ` +
            `(expected yield ${expectedYield} × ${HARVEST_TOLERANCE_RATIO} tolerance)`,
        );
      }
    }

    const attestation = await this.oracleService.submitAttestation(
      verifierId,
      OracleEntityType.HARVEST,
      harvestId,
      {
        verifiedQuantity: dto.quantity,
        reportedQuantity: Number(harvest.quantity),
        unit: harvest.unit,
        qualityGrade: dto.qualityGrade ?? harvest.qualityGrade ?? null,
        harvestDate: harvest.harvestDate.toISOString(),
        projectId: harvest.project.id,
        projectName: harvest.project.name,
        recordedBy: harvest.recordedByUser,
        notes: dto.notes ?? null,
        verifiedBy: verifierId,
        verifiedAt: new Date().toISOString(),
      },
    );

    await this.prisma.harvest.update({
      where: { id: harvestId },
      data: {
        verified: true,
        verifiedBy: verifierId,
        verifiedAt: new Date(),
        qualityGrade: dto.qualityGrade ?? harvest.qualityGrade,
        oracleAttestationId: attestation.id,
      },
    });

    this.logger.log(
      `Harvest ${harvestId} verified by ${verifierId}: quantity=${dto.quantity} ${harvest.unit}`,
    );

    this.eventEmitter.emit('harvest.verified', {
      harvestId,
      projectId: harvest.project.id,
      projectName: harvest.project.name,
      quantity: dto.quantity,
      unit: harvest.unit,
      qualityGrade: dto.qualityGrade ?? harvest.qualityGrade,
      verifierId,
      attestationId: attestation.id,
    });

    return attestation;
  }

  async getUnverifiedHarvests(query: {
    page?: number;
    limit?: number;
    projectId?: string;
  }): Promise<PaginatedResult<Record<string, unknown>>> {
    const { page, limit, skip, take } = buildPageParams(query);

    const where: Prisma.HarvestWhereInput = {
      verified: false,
    };

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.harvest.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
              expectedYield: true,
            },
          },
          recordedByUser: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { harvestDate: 'desc' },
        skip,
        take,
      }),
      this.prisma.harvest.count({ where }),
    ]);

    return {
      data: data as unknown as Record<string, unknown>[],
      meta: buildPageMeta(total, page, limit),
    };
  }

  async getVerificationHistory(harvestId: string) {
    const harvest = await this.prisma.harvest.findUnique({
      where: { id: harvestId },
      include: {
        project: {
          select: { id: true, name: true, status: true, expectedYield: true },
        },
        recordedByUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        verifiedByUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!harvest) {
      throw new NotFoundException(`Harvest ${harvestId} not found`);
    }

    const attestations = await this.oracleService.getAttestationsForEntity(
      OracleEntityType.HARVEST,
      harvestId,
    );

    return {
      harvest,
      attestations,
    };
  }
}