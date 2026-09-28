import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FarmStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { S3Service } from '../common/utils/s3.service';
import { toDecimal } from '../common/utils/decimal.util';
import {
  createPaginationQuery,
  paginate,
  PaginatedResult,
} from '../common/utils/pagination.util';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { FarmQueryDto } from './dto/farm-query.dto';
import { UploadFarmDocumentDto } from './dto/upload-farm-document.dto';
import {
  isUploadedFile,
  UploadedMulterFile,
} from '../common/interfaces/uploaded-file.interface';

const FARMER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  createdAt: true,
} as const;

const FARM_INCLUDE = {
  farmerProfile: {
    select: {
      id: true,
      userId: true,
      businessName: true,
      district: true,
      country: true,
      user: { select: FARMER_SELECT },
    },
  },
} as const;

@Injectable()
export class FarmsService {
  private readonly logger = new Logger(FarmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async create(farmerProfileId: string, dto: CreateFarmDto) {
    const farmerProfile = await this.prisma.farmerProfile.findUnique({
      where: { id: farmerProfileId },
      select: { id: true },
    });
    if (!farmerProfile) {
      throw new NotFoundException('Farmer profile not found');
    }

    const farm = await this.prisma.farm.create({
      data: {
        farmerProfileId,
        name: dto.name,
        description: dto.description ?? null,
        location: dto.location,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        totalAreaAcres: toDecimal(dto.totalAreaAcres).toFixed(2),
        soilType: dto.soilType ?? null,
        waterSource: dto.waterSource ?? null,
      },
      include: FARM_INCLUDE,
    });

    this.logger.log(`Farm ${farm.id} created for farmer ${farmerProfileId}`);
    return farm;
  }

  async findAll(query: FarmQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.FarmWhereInput = {
      status: { not: FarmStatus.ARCHIVED },
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.district?.trim()) {
      where.farmerProfile = { district: query.district.trim() };
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { page, limit, skip, take, orderBy } = createPaginationQuery(
      query.page,
      query.limit,
      where as Record<string, unknown>,
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        allowedSortFields: [
          'createdAt',
          'name',
          'updatedAt',
          'totalAreaAcres',
          'status',
        ],
      },
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.farm.findMany({
        where: where as Prisma.FarmWhereInput,
        skip,
        take,
        orderBy: orderBy as Prisma.FarmOrderByWithRelationInput,
        include: {
          ...FARM_INCLUDE,
          _count: { select: { farmDocuments: true, agriculturalProjects: true } },
        },
      }),
      this.prisma.farm.count({ where: where as Prisma.FarmWhereInput }),
    ]);

    return paginate(items, page, limit, total);
  }

  async findOne(id: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
      include: {
        ...FARM_INCLUDE,
        farmDocuments: {
          orderBy: { uploadedAt: 'desc' as const },
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            documentType: true,
            uploadedAt: true,
          },
        },
        agriculturalProjects: {
          select: {
            id: true,
            name: true,
            season: true,
            year: true,
            status: true,
            startDate: true,
            endDate: true,
          },
          orderBy: { createdAt: 'desc' as const },
        },
        _count: { select: { farmDocuments: true, agriculturalProjects: true } },
      },
    });
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }
    return farm;
  }

  async update(id: string, farmerProfileId: string, dto: UpdateFarmDto) {
    const farm = await this.findOwnedFarm(id, farmerProfileId);

    const data: Prisma.FarmUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.totalAreaAcres !== undefined) {
      data.totalAreaAcres = toDecimal(dto.totalAreaAcres).toFixed(2);
    }
    if (dto.soilType !== undefined) data.soilType = dto.soilType ?? null;
    if (dto.waterSource !== undefined) data.waterSource = dto.waterSource ?? null;

    if (Object.keys(data).length === 0) {
      return farm;
    }

    return this.prisma.farm.update({
      where: { id },
      data,
      include: FARM_INCLUDE,
    });
  }

  async remove(id: string, farmerProfileId: string) {
    await this.findOwnedFarm(id, farmerProfileId);

    return this.prisma.farm.update({
      where: { id },
      data: { status: FarmStatus.ARCHIVED },
      include: FARM_INCLUDE,
    });
  }

  async uploadDocument(
    farmId: string,
    farmerProfileId: string,
    file: unknown,
    dto: UploadFarmDocumentDto,
  ) {
    await this.findOwnedFarm(farmId, farmerProfileId);

    if (!isUploadedFile(file) || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('A document file is required');
    }

    const safeName = this.sanitizeFileName(file.originalname);
    const key = `farms/${farmId}/documents/${randomUUID()}/${safeName}`;

    await this.s3Service.uploadFile(key, file.buffer, file.mimetype);

    return this.prisma.farmDocument.create({
      data: {
        farmId,
        fileName: safeName,
        fileUrl: key,
        mimeType: file.mimetype,
        fileSize: file.buffer.length,
        documentType: dto.documentType,
      },
    });
  }

  async getDocuments(farmId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      select: { id: true },
    });
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }

    return this.prisma.farmDocument.findMany({
      where: { farmId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async verifyFarm(farmId: string, adminId: string, approved: boolean) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      select: { id: true },
    });
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }

    return this.prisma.farm.update({
      where: { id: farmId },
      data: approved
        ? { verifiedAt: new Date(), verifiedBy: adminId }
        : { verifiedAt: null, verifiedBy: null },
      include: FARM_INCLUDE,
    });
  }

  private async findOwnedFarm(id: string, farmerProfileId: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id } });
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }
    if (farm.farmerProfileId !== farmerProfileId) {
      throw new ForbiddenException('You do not have access to this farm');
    }
    return farm;
  }

  private sanitizeFileName(name: string): string {
    const sanitized = name
      .replace(/[^\w.\- ]+/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 120);
    return sanitized || `document_${Date.now()}`;
  }
}