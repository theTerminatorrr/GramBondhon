import { Injectable } from '@nestjs/common';
import { Prisma, AgriculturalProject } from '@prisma/client';
import { PrismaService } from '../database/database.service';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUnique<T extends Prisma.AgriculturalProjectFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.AgriculturalProjectFindUniqueArgs>,
  ) {
    return this.prisma.agriculturalProject.findUnique(args);
  }

  async findFirst<T extends Prisma.AgriculturalProjectFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.AgriculturalProjectFindFirstArgs>,
  ) {
    return this.prisma.agriculturalProject.findFirst(args);
  }

  async findMany<T extends Prisma.AgriculturalProjectFindManyArgs>(
    args?: Prisma.SelectSubset<T, Prisma.AgriculturalProjectFindManyArgs>,
  ) {
    return this.prisma.agriculturalProject.findMany(args);
  }

  async count(args?: Prisma.AgriculturalProjectCountArgs): Promise<number> {
    return this.prisma.agriculturalProject.count(args);
  }

  async groupBy<T extends Prisma.AgriculturalProjectGroupByArgs>(
    args: Prisma.SelectSubset<T, Prisma.AgriculturalProjectGroupByArgs>,
  ) {
    return this.prisma.agriculturalProject.groupBy(args as any);
  }

  async aggregate<T extends Prisma.AgriculturalProjectAggregateArgs>(
    args: Prisma.Subset<T, Prisma.AgriculturalProjectAggregateArgs>,
  ) {
    return this.prisma.agriculturalProject.aggregate(args);
  }

  async create<T extends Prisma.AgriculturalProjectCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.AgriculturalProjectCreateArgs>,
  ): Promise<AgriculturalProject> {
    return this.prisma.agriculturalProject.create(args);
  }

  async update<T extends Prisma.AgriculturalProjectUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.AgriculturalProjectUpdateArgs>,
  ): Promise<AgriculturalProject> {
    return this.prisma.agriculturalProject.update(args);
  }

  async updateMany(
    args: Prisma.AgriculturalProjectUpdateManyArgs,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.agriculturalProject.updateMany(args);
  }

  async delete<T extends Prisma.AgriculturalProjectDeleteArgs>(
    args: Prisma.SelectSubset<T, Prisma.AgriculturalProjectDeleteArgs>,
  ): Promise<AgriculturalProject> {
    return this.prisma.agriculturalProject.delete(args);
  }
}
