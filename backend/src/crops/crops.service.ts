import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import {
  createPaginationQuery,
  paginate,
  PaginatedResult,
} from '../common/utils/pagination.util';
import { CropQueryDto } from './dto/crop-query.dto';

@Injectable()
export class CropsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CropQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.CropWhereInput = {};

    if (query.category?.trim()) {
      where.category = query.category.trim();
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { variety: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { page, limit, skip, take, orderBy } = createPaginationQuery(
      query.page,
      query.limit,
      where as Record<string, unknown>,
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        allowedSortFields: ['name', 'category', 'createdAt', 'growingSeasonDays'],
      },
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.crop.findMany({
        where: where as Prisma.CropWhereInput,
        skip,
        take,
        orderBy: orderBy as Prisma.CropOrderByWithRelationInput,
      }),
      this.prisma.crop.count({ where: where as Prisma.CropWhereInput }),
    ]);

    return paginate(items, page, limit, total);
  }

  async findOne(id: string) {
    const crop = await this.prisma.crop.findUnique({
      where: { id },
      include: {
        agriculturalProjects: {
          select: {
            id: true,
            name: true,
            season: true,
            year: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' as const },
        },
      },
    });
    if (!crop) {
      throw new NotFoundException('Crop not found');
    }
    return crop;
  }
}