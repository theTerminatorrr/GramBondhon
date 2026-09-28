import { Injectable } from '@nestjs/common';
import { Prisma, Deal } from '@prisma/client';
import { PrismaService } from '../database/database.service';

@Injectable()
export class DealsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUnique<T extends Prisma.DealFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.DealFindUniqueArgs>,
  ) {
    return this.prisma.deal.findUnique(args);
  }

  async findFirst<T extends Prisma.DealFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.DealFindFirstArgs>,
  ) {
    return this.prisma.deal.findFirst(args);
  }

  async findMany<T extends Prisma.DealFindManyArgs>(
    args?: Prisma.SelectSubset<T, Prisma.DealFindManyArgs>,
  ) {
    return this.prisma.deal.findMany(args);
  }

  async count(args?: Prisma.DealCountArgs): Promise<number> {
    return this.prisma.deal.count(args);
  }

  async groupBy<T extends Prisma.DealGroupByArgs>(
    args: Prisma.SelectSubset<T, Prisma.DealGroupByArgs>,
  ) {
    return this.prisma.deal.groupBy(args as any);
  }

  async create<T extends Prisma.DealCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.DealCreateArgs>,
  ): Promise<Deal> {
    return this.prisma.deal.create(args);
  }

  async update<T extends Prisma.DealUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.DealUpdateArgs>,
  ): Promise<Deal> {
    return this.prisma.deal.update(args);
  }

  async updateMany(args: Prisma.DealUpdateManyArgs): Promise<Prisma.BatchPayload> {
    return this.prisma.deal.updateMany(args);
  }

  async delete<T extends Prisma.DealDeleteArgs>(
    args: Prisma.SelectSubset<T, Prisma.DealDeleteArgs>,
  ): Promise<Deal> {
    return this.prisma.deal.delete(args);
  }
}
