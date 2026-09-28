import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { ProjectsService } from '../projects/projects.service';
import {
  createPaginationQuery,
  paginate,
  PaginatedResult,
} from '../common/utils/pagination.util';
import { ProjectReviewQueryDto } from './dto/admin-dashboard-query.dto';
import { AdminBaseService } from './admin-base.service';

const PROJECT_VERIFICATION_INCLUDE = {
  farmerProfile: {
    select: { id: true, businessName: true, district: true },
  },
  farm: { select: { id: true, name: true, location: true, status: true } },
  crop: { select: { id: true, name: true, variety: true, category: true } },
  projectMilestones: {
    orderBy: { sortOrder: 'asc' as const },
    select: { id: true, name: true, status: true, targetDate: true },
  },
  projectDocuments: {
    select: { id: true, fileName: true, documentType: true },
  },
  _count: { select: { deals: true, expenses: true, revenues: true, harvests: true } },
} satisfies Prisma.AgriculturalProjectInclude;

@Injectable()
export class ProjectVerificationService extends AdminBaseService {
  constructor(
    prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {
    super(prisma);
  }

  async getProjects(query: ProjectReviewQueryDto = new ProjectReviewQueryDto()): Promise<PaginatedResult<unknown>> {
    const where: Prisma.AgriculturalProjectWhereInput = {
      status: query.status ?? { in: [ProjectStatus.SUBMITTED, ProjectStatus.UNDER_REVIEW] },
      ...(query.farmerId ? { farmerProfileId: query.farmerId } : {}),
    };

    if (query.search?.trim()) {
      where.OR = [{ name: { contains: query.search.trim(), mode: 'insensitive' } }];
    }

    const { page, limit, skip, take, orderBy } = createPaginationQuery(
      query.page,
      query.limit,
      where as Record<string, unknown>,
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        defaultSortField: 'updatedAt',
        allowedSortFields: ['createdAt', 'updatedAt', 'name', 'expectedRevenue', 'status'],
      },
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.agriculturalProject.findMany({
        where: where as Prisma.AgriculturalProjectWhereInput,
        skip,
        take,
        orderBy: orderBy as Prisma.AgriculturalProjectOrderByWithRelationInput,
        include: PROJECT_VERIFICATION_INCLUDE,
      }),
      this.prisma.agriculturalProject.count({
        where: where as Prisma.AgriculturalProjectWhereInput,
      }),
    ]);

    return paginate(items, page, limit, total);
  }

  async getProjectDetail(projectId: string) {
    return this.prisma.agriculturalProject.findUnique({
      where: { id: projectId },
      include: {
        ...PROJECT_VERIFICATION_INCLUDE,
        farmerProfile: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        deals: {
          select: { id: true, title: true, status: true, fundingTarget: true, totalInvested: true },
        },
      },
    });
  }

  async approveProject(projectId: string, adminId: string) {
    const project = await this.prisma.agriculturalProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        farmerProfile: { select: { userId: true } },
      },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const updated = await this.projectsService.approve(projectId, adminId);

    await this.createAuditLog({
      actorId: adminId,
      action: 'PROJECT_APPROVED',
      entityType: 'AgriculturalProject',
      entityId: projectId,
      oldValues: { status: project.status },
      newValues: { status: updated.status, approvedAt: new Date().toISOString() },
    });
    await this.createNotification(
      project.farmerProfile.userId,
      NotificationType.SYSTEM,
      'Project approved',
      `Your project "${project.name}" has been approved by an administrator.`,
      { projectId, status: 'APPROVED' },
    );

    this.logger.log(`Project ${projectId} approved by admin ${adminId}`);
    return updated;
  }

  async rejectProject(projectId: string, adminId: string, reason: string) {
    const project = await this.prisma.agriculturalProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        farmerProfile: { select: { userId: true } },
      },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const updated = await this.projectsService.reject(projectId, adminId, reason);

    await this.createAuditLog({
      actorId: adminId,
      action: 'PROJECT_REJECTED',
      entityType: 'AgriculturalProject',
      entityId: projectId,
      oldValues: { status: project.status },
      newValues: { status: updated.status, rejectionReason: reason.trim() },
    });
    await this.createNotification(
      project.farmerProfile.userId,
      NotificationType.SYSTEM,
      'Project rejected',
      `Your project "${project.name}" has been rejected. Reason: ${reason.trim()}`,
      { projectId, status: 'REJECTED', rejectionReason: reason.trim() },
    );

    this.logger.log(`Project ${projectId} rejected by admin ${adminId}`);
    return updated;
  }
}