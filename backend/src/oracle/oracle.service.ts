import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, OracleAttestation } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/database.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OracleEntityType, canonicalStringify } from './interfaces/oracle.interface';
import {
  buildPageMeta,
  buildPageParams,
  type PaginatedResult,
} from './interfaces/oracle.interface';

function keccakHash(data: string): string {
  try {
    return createHash('keccak256').update(data).digest('hex');
  } catch {
    try {
      return createHash('sha3-256').update(data).digest('hex');
    } catch {
      return createHash('sha256').update(data).digest('hex');
    }
  }
}

@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly blockchain: BlockchainService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async submitAttestation(
    userId: string,
    entityType: OracleEntityType,
    entityId: string,
    data: Record<string, unknown>,
  ): Promise<OracleAttestation> {
    await this.validateEntityExists(entityType, entityId);

    const canonical = canonicalStringify(data);
    const dataHash = keccakHash(canonical);

    const attestation = await this.prisma.oracleAttestation.create({
      data: {
        entityType,
        entityId,
        attesterId: userId,
        dataHash,
        data: data as Prisma.InputJsonValue,
      },
      include: {
        attester: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    this.logger.log(
      `Attestation created: ${attestation.id} for ${entityType}:${entityId}`,
    );

    try {
      const txHash = await this.recordOnChain(entityType, entityId, dataHash);
      if (txHash) {
        await this.prisma.oracleAttestation.update({
          where: { id: attestation.id },
          data: { blockchainTxHash: txHash },
        });
        attestation.blockchainTxHash = txHash;
      }
    } catch (error) {
      this.logger.warn(
        `Blockchain write skipped for attestation ${attestation.id}: ${(error as Error).message}`,
      );
    }

    this.eventEmitter.emit('oracle.attestation.submitted', {
      attestationId: attestation.id,
      entityType,
      entityId,
      attesterId: userId,
      dataHash,
    });

    return attestation;
  }

  async verifyAttestation(
    attestationId: string,
    verifierId: string,
    notes?: string,
  ): Promise<OracleAttestation> {
    const attestation = await this.prisma.oracleAttestation.findUnique({
      where: { id: attestationId },
    });

    if (!attestation) {
      throw new NotFoundException(`Attestation ${attestationId} not found`);
    }

    if (attestation.verified) {
      throw new ConflictException(`Attestation ${attestationId} is already verified`);
    }

    const storedData = attestation.data as Record<string, unknown>;
    const canonical = canonicalStringify(storedData);
    const recomputedHash = keccakHash(canonical);

    if (recomputedHash !== attestation.dataHash) {
      throw new BadRequestException(
        'Data integrity check failed: stored hash does not match recomputed hash',
      );
    }

    const updateData: Prisma.OracleAttestationUncheckedUpdateInput = {
      verified: true,
      verifiedBy: verifierId,
      verifiedAt: new Date(),
    };

    if (notes) {
      const mergedData = { ...(storedData as Record<string, unknown>), verificationNotes: notes };
      updateData.data = mergedData as Prisma.InputJsonValue;
    }

    const updated = await this.prisma.oracleAttestation.update({
      where: { id: attestationId },
      data: updateData,
      include: {
        attester: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
        verifiedByUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    this.logger.log(`Attestation ${attestationId} verified by ${verifierId}`);

    try {
      const txHash = await this.recordOnChain(
        attestation.entityType as OracleEntityType,
        attestation.entityId,
        attestation.dataHash,
      );
      if (txHash) {
        await this.prisma.oracleAttestation.update({
          where: { id: attestationId },
          data: { blockchainTxHash: txHash },
        });
        updated.blockchainTxHash = txHash;
      }
    } catch (error) {
      this.logger.warn(
        `Blockchain verification write skipped for attestation ${attestationId}: ${(error as Error).message}`,
      );
    }

    this.eventEmitter.emit('oracle.attestation.verified', {
      attestationId,
      verifierId,
      entityType: attestation.entityType,
      entityId: attestation.entityId,
      notes,
    });

    return updated;
  }

  async getAttestation(id: string): Promise<OracleAttestation> {
    const attestation = await this.prisma.oracleAttestation.findUnique({
      where: { id },
      include: {
        attester: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
        verifiedByUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!attestation) {
      throw new NotFoundException(`Attestation ${id} not found`);
    }

    return attestation;
  }

  async getAttestations(query: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    verified?: boolean;
  }): Promise<PaginatedResult<OracleAttestation>> {
    const { page, limit, skip, take } = buildPageParams(query);

    const where: Prisma.OracleAttestationWhereInput = {};
    if (query.entityType) {
      where.entityType = query.entityType;
    }
    if (query.entityId) {
      where.entityId = query.entityId;
    }
    if (query.verified !== undefined) {
      where.verified = query.verified;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.oracleAttestation.findMany({
        where,
        include: {
          attester: {
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
          },
          verifiedByUser: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.oracleAttestation.count({ where }),
    ]);

    return { data, meta: buildPageMeta(total, page, limit) };
  }

  async getAttestationsForEntity(
    entityType: string,
    entityId: string,
  ): Promise<OracleAttestation[]> {
    return this.prisma.oracleAttestation.findMany({
      where: { entityType, entityId },
      include: {
        attester: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
        verifiedByUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordOnChain(
    entityType: OracleEntityType,
    entityId: string,
    dataHash: string,
  ): Promise<string | null> {
    const contractAddress = this.config.get<string>(
      'ORACLE_ATTESTATION_CONTRACT_ADDRESS',
    );

    if (!contractAddress) {
      this.logger.debug(
        'No ORACLE_ATTESTATION_CONTRACT_ADDRESS configured, skipping blockchain write',
      );
      return null;
    }

    let wallet;
    try {
      wallet = this.blockchain.getWalletClient();
    } catch {
      this.logger.debug('Blockchain wallet client not available, skipping write');
      return null;
    }

    const fromAddress = wallet.account?.address;
    if (!fromAddress) {
      this.logger.debug('No wallet account available, skipping blockchain write');
      return null;
    }

    const { encodeAbiParameters } = await import('viem');

    const data = encodeAbiParameters(
      [
        { type: 'string', name: 'entityType' },
        { type: 'string', name: 'entityId' },
        { type: 'bytes32', name: 'dataHash' },
      ],
      [
        entityType,
        entityId,
        `0x${dataHash}` as `0x${string}`,
      ],
    );

    const txHash = await this.blockchain.sendTransaction({
      to: contractAddress as `0x${string}`,
      data,
    });

    await this.prisma.blockchainTransaction.create({
      data: {
        txHash,
        chainId: this.blockchain.getChainId(),
        fromAddress,
        toAddress: contractAddress,
        status: 'PENDING',
        relatedEntityType: 'ORACLE_ATTESTATION',
        relatedEntityId: entityId,
      },
    });

    return txHash;
  }

  private async validateEntityExists(
    entityType: OracleEntityType,
    entityId: string,
  ): Promise<void> {
    switch (entityType) {
      case OracleEntityType.PROJECT: {
        const entity = await this.prisma.agriculturalProject.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        if (!entity) {
          throw new NotFoundException(`Project ${entityId} not found`);
        }
        break;
      }
      case OracleEntityType.HARVEST: {
        const entity = await this.prisma.harvest.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        if (!entity) {
          throw new NotFoundException(`Harvest ${entityId} not found`);
        }
        break;
      }
      case OracleEntityType.SALE: {
        const entity = await this.prisma.sale.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        if (!entity) {
          throw new NotFoundException(`Sale ${entityId} not found`);
        }
        break;
      }
      case OracleEntityType.EXPENSE: {
        const entity = await this.prisma.expense.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        if (!entity) {
          throw new NotFoundException(`Expense ${entityId} not found`);
        }
        break;
      }
      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }
  }
}