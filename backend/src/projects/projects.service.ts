import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  FarmStatus,
  MilestoneStatus,
  Prisma,
  ProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { S3Service } from '../common/utils/s3.service';
import { toDecimal } from '../common/utils/decimal.util';
import {
  createPaginationQuery,
  paginate,
  PaginatedResult,
} from '../common/utils/pagination.util';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { UploadProjectDocumentDto } from './dto/upload-project-document.dto';
import {
  isUploadedFile,
  UploadedMulterFile,
} from '../common/interfaces/uploaded-file.interface';

const PROJECT_INCLUDE = {
  farm: {
    select: { id: true, name: true, location: true, status: true },
  },
  crop: {
    select: { id: true, name: true, variety: true, category: true },
  },
  farmerProfile: {
    select: { id: true, businessName: true, district: true, country: true },
  },
  projectMilestones: {
    orderBy: { sortOrder: 'asc' as const },
    select: {
      id: true,
      name: true,
      description: true,
      targetDate: true,
      completedDate: true,
      status: true,
      sortOrder: true,
      createdAt: true,
    },
  },
  projectDocuments: {
    orderBy: { uploadedAt: 'desc' as const },
  },
  _count: {
    select: { deals: true, projectDocuments: true, projectMilestones: true },
  },
} as const;

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async create(farmerProfileId: string, dto: CreateProjectDto) {
    const farmerProfile = await this.prisma.farmerProfile.findUnique({
      where: { id: farmerProfileId },
      select: { id: true },
    });
    if (!farmerProfile) {
      throw new NotFoundException('Farmer profile not found');
    }

    if (dto.farmId) {
      await this.assertFarmOwnership(dto.farmId, farmerProfileId);
    }
    if (dto.cropId) {
      await this.assertCropExists(dto.cropId);
    }

    const project = await this.prisma.agriculturalProject.create({
      data: {
        farmerProfileId,
        farmId: dto.farmId ?? null,
        cropId: dto.cropId ?? null,
        name: dto.name,
        description: dto.description ?? null,
        season: dto.season ?? null,
        year: dto.year ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        expectedYield: dto.expectedYield
          ? toDecimal(dto.expectedYield).toFixed(4)
          : null,
        expectedRevenue: dto.expectedRevenue
          ? toDecimal(dto.expectedRevenue).toFixed(4)
          : null,
      },
      include: PROJECT_INCLUDE,
    });

    this.logger.log(`Project ${project.id} created for farmer ${farmerProfileId}`);
    return project;
  }

  async findAll(query: ProjectQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.AgriculturalProjectWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.farmerProfileId) {
      where.farmerProfileId = query.farmerProfileId;
    }
    if (query.cropId) {
      where.cropId = query.cropId;
    }
    if (query.fromDate || query.toDate) {
      where.startDate = {
        ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}),
        ...(query.toDate ? { lte: new Date(query.toDate) } : {}),
      };
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { season: { contains: search, mode: 'insensitive' } },
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
          'updatedAt',
          'name',
          'startDate',
          'endDate',
          'year',
          'status',
          'expectedRevenue',
        ],
      },
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.agriculturalProject.findMany({
        where: where as Prisma.AgriculturalProjectWhereInput,
        skip,
        take,
        orderBy: orderBy as Prisma.AgriculturalProjectOrderByWithRelationInput,
        include: PROJECT_INCLUDE,
      }),
      this.prisma.agriculturalProject.count({
        where: where as Prisma.AgriculturalProjectWhereInput,
      }),
    ]);

    return paginate(items, page, limit, total);
  }

  async findOne(id: string) {
    const project = await this.prisma.agriculturalProject.findUnique({
      where: { id },
      include: {
        ...PROJECT_INCLUDE,
        farm: { select: { id: true, name: true, location: true, status: true } },
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(id: string, farmerProfileId: string, dto: UpdateProjectDto) {
    const project = await this.getProject(id, farmerProfileId);

    if (
      project.status !== ProjectStatus.DRAFT &&
      project.status !== ProjectStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Only draft or rejected projects can be edited',
      );
    }

    if (dto.farmId !== undefined) {
      dto.farmId
        ? await this.assertFarmOwnership(dto.farmId, farmerProfileId)
        : null;
    }
    if (dto.cropId !== undefined) {
      dto.cropId ? await this.assertCropExists(dto.cropId) : null;
    }

    const data: Prisma.AgriculturalProjectUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.farmId !== undefined) data.farm = { connect: { id: dto.farmId } };
    if (dto.cropId !== undefined) data.crop = { connect: { id: dto.cropId } };
    if (dto.season !== undefined) data.season = dto.season ?? null;
    if (dto.year !== undefined) data.year = dto.year ?? null;
    if (dto.startDate !== undefined) {
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.endDate !== undefined) {
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }
    if (dto.expectedYield !== undefined) {
      data.expectedYield = dto.expectedYield
        ? toDecimal(dto.expectedYield).toFixed(4)
        : null;
    }
    if (dto.expectedRevenue !== undefined) {
      data.expectedRevenue = dto.expectedRevenue
        ? toDecimal(dto.expectedRevenue).toFixed(4)
        : null;
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.agriculturalProject.findUnique({
        where: { id },
        include: PROJECT_INCLUDE,
      });
    }

    return this.prisma.agriculturalProject.update({
      where: { id },
      data,
      include: PROJECT_INCLUDE,
    });
  }

  async submitForReview(id: string, farmerProfileId: string) {
    const project = await this.getProject(id, farmerProfileId);

    if (project.status !== ProjectStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft projects can be submitted for review',
      );
    }

    return this.prisma.agriculturalProject.update({
      where: { id },
      data: {
        status: ProjectStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: PROJECT_INCLUDE,
    });
  }

  async approve(id: string, adminId: string) {
    const project = await this.getProject(id);

    if (
      project.status !== ProjectStatus.SUBMITTED &&
      project.status !== ProjectStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Project must be submitted before it can be approved',
      );
    }

    return this.prisma.agriculturalProject.update({
      where: { id },
      data: {
        status: ProjectStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: null,
      },
      include: PROJECT_INCLUDE,
    });
  }

  async reject(id: string, adminId: string, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException('A rejection reason is required');
    }

    const project = await this.getProject(id);

    if (
      project.status !== ProjectStatus.SUBMITTED &&
      project.status !== ProjectStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Project must be submitted before it can be rejected',
      );
    }

    return this.prisma.agriculturalProject.update({
      where: { id },
      data: {
        status: ProjectStatus.REJECTED,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: reason.trim(),
      },
      include: PROJECT_INCLUDE,
    });
  }

  async addMilestone(projectId: string, dto: CreateMilestoneDto) {
    await this.getProject(projectId);

    const lastMilestone = await this.prisma.projectMilestone.findFirst({
      where: { projectId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = lastMilestone ? lastMilestone.sortOrder + 1 : 1;

    return this.prisma.projectMilestone.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description ?? null,
        targetDate: new Date(dto.targetDate),
        sortOrder,
        status: dto.status ?? MilestoneStatus.PENDING,
      },
    });
  }

  async updateMilestone(milestoneId: string, dto: UpdateMilestoneDto) {
    const milestone = await this.prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const data: Prisma.ProjectMilestoneUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.targetDate !== undefined) {
      data.targetDate = new Date(dto.targetDate);
    }
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.status !== undefined) data.status = dto.status;

    if (Object.keys(data).length === 0) {
      return milestone;
    }

    try {
      return await this.prisma.projectMilestone.update({
        where: { id: milestoneId },
        data,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'A milestone with this sort order already exists in the project',
        );
      }
      throw error;
    }
  }

  async removeMilestone(milestoneId: string) {
    const milestone = await this.prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
      select: { id: true },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    await this.prisma.projectMilestone.delete({ where: { id: milestoneId } });
    return { success: true, id: milestoneId };
  }

  async uploadDocument(
    projectId: string,
    file: unknown,
    dto: UploadProjectDocumentDto,
  ) {
    await this.getProject(projectId);

    if (!isUploadedFile(file) || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('A document file is required');
    }

    const safeName = this.sanitizeFileName(file.originalname);
    const key = `projects/${projectId}/documents/${randomUUID()}/${safeName}`;

    await this.s3Service.uploadFile(key, file.buffer, file.mimetype);

    return this.prisma.projectDocument.create({
      data: {
        projectId,
        fileName: safeName,
        fileUrl: key,
        mimeType: file.mimetype,
        fileSize: file.buffer.length,
        documentType: dto.documentType,
        description: dto.description ?? null,
      },
    });
  }

  async getDocuments(projectId: string) {
    await this.getProject(projectId);

    return this.prisma.projectDocument.findMany({
      where: { projectId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getMilestones(projectId: string) {
    await this.getProject(projectId);

    return this.prisma.projectMilestone.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getMilestone(milestoneId: string) {
    const milestone = await this.prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          select: { id: true, farmerProfileId: true },
        },
      },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    return milestone;
  }

  async assertCanManageProject(projectId: string, farmerProfileId: string) {
    await this.getProject(projectId, farmerProfileId);
  }

  private async getProject(id: string, farmerProfileId?: string) {
    const project = await this.prisma.agriculturalProject.findUnique({
      where: { id },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (farmerProfileId && project.farmerProfileId !== farmerProfileId) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  private async assertFarmOwnership(farmId: string, farmerProfileId: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }
    if (farm.farmerProfileId !== farmerProfileId) {
      throw new ForbiddenException('The selected farm does not belong to this farmer');
    }
    if (farm.status === FarmStatus.ARCHIVED) {
      throw new BadRequestException('Cannot attach an archived farm to a project');
    }
  }

  private async assertCropExists(cropId: string) {
    const crop = await this.prisma.crop.findUnique({
      where: { id: cropId },
      select: { id: true },
    });
    if (!crop) {
      throw new NotFoundException('Crop not found');
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private sanitizeFileName(name: string): string {
    const sanitized = name
      .replace(/[^\w.\- ]+/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 120);
    return sanitized || `document_${Date.now()}`;
  }
}