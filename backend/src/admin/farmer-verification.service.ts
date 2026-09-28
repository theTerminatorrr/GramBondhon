import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FarmerVerificationStatus, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import {
  createPaginationQuery,
  paginate,
  PaginatedResult,
} from '../common/utils/pagination.util';
import { FarmerVerificationQueryDto } from './dto/admin-dashboard-query.dto';
import { AdminBaseService } from './admin-base.service';

@Injectable()
export class FarmerVerificationService extends AdminBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getPendingFarmers(
    query: FarmerVerificationQueryDto = new FarmerVerificationQueryDto(),
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.FarmerProfileWhereInput = {};

    if (query.status) {
      where.verificationStatus = query.status;
    } else {
      where.verificationStatus = FarmerVerificationStatus.PENDING;
    }

    if (query.district?.trim()) {
      where.district = { contains: query.district.trim(), mode: 'insensitive' };
    }

    if (query.fromDate || query.toDate) {
      where.createdAt = {
        ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}),
        ...(query.toDate ? { lte: new Date(query.toDate) } : {}),
      };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { businessName: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { firstName: { contains: term, mode: 'insensitive' } } },
        { user: { lastName: { contains: term, mode: 'insensitive' } } },
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
          'businessName',
          'verificationStatus',
          'district',
        ],
      },
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.farmerProfile.findMany({
        where: where as Prisma.FarmerProfileWhereInput,
        skip,
        take,
        orderBy: orderBy as Prisma.FarmerProfileOrderByWithRelationInput,
        select: {
          id: true,
          userId: true,
          businessName: true,
          businessRegistrationNumber: true,
          district: true,
          division: true,
          country: true,
          verificationStatus: true,
          rejectionReason: true,
          verifiedBy: true,
          verifiedAt: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              createdAt: true,
            },
          },
          farms: {
            select: {
              _count: { select: { farmDocuments: true } },
            },
          },
          agriculturalProjects: {
            select: {
              _count: { select: { projectDocuments: true } },
            },
          },
          _count: { select: { farms: true, agriculturalProjects: true } },
        },
      }),
      this.prisma.farmerProfile.count({ where: where as Prisma.FarmerProfileWhereInput }),
    ]);

    const enriched = items.map((item) => {
      const documentCount =
        item.farms.reduce(
          (sum, farm) => sum + (farm._count.farmDocuments ?? 0),
          0,
        ) +
        item.agriculturalProjects.reduce(
          (sum, proj) => sum + (proj._count.projectDocuments ?? 0),
          0,
        );

      const { farms: _farms, agriculturalProjects: _projs, ...rest } = item;
      return { ...rest, documentCount };
    });

    return paginate(enriched, page, limit, total);
  }

  async getVerificationDetail(farmerId: string) {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { id: farmerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            createdAt: true,
          },
        },
        farms: {
          include: {
            farmDocuments: {
              select: {
                id: true,
                fileName: true,
                documentType: true,
                fileSize: true,
                uploadedAt: true,
              },
            },
          },
        },
        agriculturalProjects: {
          include: {
            projectDocuments: {
              select: {
                id: true,
                fileName: true,
                documentType: true,
                fileSize: true,
                uploadedAt: true,
              },
            },
            projectMilestones: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                name: true,
                status: true,
                targetDate: true,
                completedDate: true,
              },
            },
            deals: {
              select: {
                id: true,
                title: true,
                status: true,
                fundingTarget: true,
                totalInvested: true,
              },
            },
          },
        },
        _count: { select: { farms: true, agriculturalProjects: true, deals: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Farmer profile ${farmerId} not found`);
    }

    const documentCount =
      profile.farms.reduce((sum, f) => sum + f.farmDocuments.length, 0) +
      profile.agriculturalProjects.reduce(
        (sum, p) => sum + p.projectDocuments.length,
        0,
      );

    return { ...profile, documentCount };
  }

  async approveFarmer(farmerId: string, adminId: string) {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { id: farmerId },
      select: { id: true, verificationStatus: true, userId: true, businessName: true },
    });

    if (!profile) {
      throw new NotFoundException(`Farmer profile ${farmerId} not found`);
    }

    if (profile.verificationStatus === FarmerVerificationStatus.VERIFIED) {
      throw new ConflictException(`Farmer profile ${farmerId} is already verified`);
    }

    const updated = await this.prisma.farmerProfile.update({
      where: { id: farmerId },
      data: {
        verificationStatus: FarmerVerificationStatus.VERIFIED,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: null,
      },
    });

    await this.createAuditLog({
      actorId: adminId,
      action: 'FARMER_VERIFIED',
      entityType: 'FarmerProfile',
      entityId: farmerId,
      oldValues: { verificationStatus: profile.verificationStatus },
      newValues: { verificationStatus: 'VERIFIED' },
    });

    await this.createNotification(
      profile.userId,
      NotificationType.SYSTEM,
      'Farmer account verified',
      `Your farmer profile${profile.businessName ? ` for "${profile.businessName}"` : ''} has been verified by an administrator.`,
      { farmerId, verificationStatus: 'VERIFIED' },
    );

    this.logger.log(
      `Farmer profile ${farmerId} verified by admin ${adminId}`,
    );

    return updated;
  }

  async rejectFarmer(farmerId: string, adminId: string, reason: string) {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { id: farmerId },
      select: { id: true, verificationStatus: true, userId: true, businessName: true },
    });

    if (!profile) {
      throw new NotFoundException(`Farmer profile ${farmerId} not found`);
    }

    if (profile.verificationStatus === FarmerVerificationStatus.REJECTED) {
      throw new ConflictException(`Farmer profile ${farmerId} is already rejected`);
    }

    const updated = await this.prisma.farmerProfile.update({
      where: { id: farmerId },
      data: {
        verificationStatus: FarmerVerificationStatus.REJECTED,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: reason.trim(),
      },
    });

    await this.createAuditLog({
      actorId: adminId,
      action: 'FARMER_REJECTED',
      entityType: 'FarmerProfile',
      entityId: farmerId,
      oldValues: { verificationStatus: profile.verificationStatus },
      newValues: { verificationStatus: 'REJECTED', rejectionReason: reason.trim() },
    });

    await this.createNotification(
      profile.userId,
      NotificationType.SYSTEM,
      'Farmer application rejected',
      `Your farmer profile${profile.businessName ? ` for "${profile.businessName}"` : ''} has been rejected. Reason: ${reason.trim()}`,
      { farmerId, verificationStatus: 'REJECTED', rejectionReason: reason.trim() },
    );

    this.logger.log(
      `Farmer profile ${farmerId} rejected by admin ${adminId}`,
    );

    return updated;
  }

  async getVerificationStats() {
    const grouped = await this.prisma.farmerProfile.groupBy({
      by: ['verificationStatus'],
      _count: { _all: true },
    });

    const stats: Record<string, number> = {
      PENDING: 0,
      VERIFIED: 0,
      REJECTED: 0,
    };

    for (const group of grouped) {
      stats[group.verificationStatus] = group._count._all;
    }

    return {
      total: Object.values(stats).reduce((s, c) => s + c, 0),
      byStatus: stats,
    };
  }
}
