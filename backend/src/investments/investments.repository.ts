import { Injectable } from '@nestjs/common';
import { Prisma, Investment } from '@prisma/client';
import { PrismaService } from '../database/database.service';

@Injectable()
export class InvestmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUnique<T extends Prisma.InvestmentFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvestmentFindUniqueArgs>,
  ) {
    return this.prisma.investment.findUnique(args);
  }

  async findFirst<T extends Prisma.InvestmentFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvestmentFindFirstArgs>,
  ) {
    return this.prisma.investment.findFirst(args);
  }

  async findMany<T extends Prisma.InvestmentFindManyArgs>(
    args?: Prisma.SelectSubset<T, Prisma.InvestmentFindManyArgs>,
  ) {
    return this.prisma.investment.findMany(args);
  }

  async count(args?: Prisma.InvestmentCountArgs): Promise<number> {
    return this.prisma.investment.count(args);
  }

  async groupBy<T extends Prisma.InvestmentGroupByArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvestmentGroupByArgs>,
  ) {
    return this.prisma.investment.groupBy(args as any);
  }

  async aggregate<T extends Prisma.InvestmentAggregateArgs>(
    args: Prisma.Subset<T, Prisma.InvestmentAggregateArgs>,
  ) {
    return this.prisma.investment.aggregate(args);
  }

  async create<T extends Prisma.InvestmentCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvestmentCreateArgs>,
  ): Promise<Investment> {
    return this.prisma.investment.create(args);
  }

  async update<T extends Prisma.InvestmentUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvestmentUpdateArgs>,
  ): Promise<Investment> {
    return this.prisma.investment.update(args);
  }

  async updateMany(args: Prisma.InvestmentUpdateManyArgs): Promise<Prisma.BatchPayload> {
    return this.prisma.investment.updateMany(args);
  }

  async delete<T extends Prisma.InvestmentDeleteArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvestmentDeleteArgs>,
  ): Promise<Investment> {
    return this.prisma.investment.delete(args);
  }
}
