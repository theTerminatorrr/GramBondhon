import { Injectable } from '@nestjs/common';
import { Prisma, FarmerProfile } from '@prisma/client';
import { PrismaService } from '../database/database.service';

@Injectable()
export class FarmersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUnique<T extends Prisma.FarmerProfileFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.FarmerProfileFindUniqueArgs>,
  ) {
    return this.prisma.farmerProfile.findUnique(args);
  }

  async findFirst<T extends Prisma.FarmerProfileFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.FarmerProfileFindFirstArgs>,
  ) {
    return this.prisma.farmerProfile.findFirst(args);
  }

  async findMany<T extends Prisma.FarmerProfileFindManyArgs>(
    args?: Prisma.SelectSubset<T, Prisma.FarmerProfileFindManyArgs>,
  ) {
    return this.prisma.farmerProfile.findMany(args);
  }

  async count(args?: Prisma.FarmerProfileCountArgs): Promise<number> {
    return this.prisma.farmerProfile.count(args);
  }

  async groupBy<T extends Prisma.FarmerProfileGroupByArgs>(
    args: Prisma.SelectSubset<T, Prisma.FarmerProfileGroupByArgs>,
  ) {
    return this.prisma.farmerProfile.groupBy(args as any);
  }

  async create<T extends Prisma.FarmerProfileCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.FarmerProfileCreateArgs>,
  ): Promise<FarmerProfile> {
    return this.prisma.farmerProfile.create(args);
  }

  async update<T extends Prisma.FarmerProfileUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.FarmerProfileUpdateArgs>,
  ): Promise<FarmerProfile> {
    return this.prisma.farmerProfile.update(args);
  }

  async updateMany(args: Prisma.FarmerProfileUpdateManyArgs): Promise<Prisma.BatchPayload> {
    return this.prisma.farmerProfile.updateMany(args);
  }

  async delete<T extends Prisma.FarmerProfileDeleteArgs>(
    args: Prisma.SelectSubset<T, Prisma.FarmerProfileDeleteArgs>,
  ): Promise<FarmerProfile> {
    return this.prisma.farmerProfile.delete(args);
  }
}
