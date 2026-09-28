import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InvestorType, KYCStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { toDecimal } from '../common/utils/decimal.util';
import { CreateInvestorProfileDto } from './dto/create-investor-profile.dto';
import { UpdateInvestorProfileDto } from './dto/update-investor-profile.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';

const PROFILE_USER_SELECT = {
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
} as const;

@Injectable()
export class InvestorsService {
  private readonly logger = new Logger(InvestorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateInvestorProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.investorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('An investor profile already exists for this user');
    }

    await this.assertUniqueProfileFields(
      dto.companyRegistrationNumber,
      dto.taxId,
    );

    const profile = await this.prisma.investorProfile.create({
      data: {
        userId,
        investorType: dto.investorType ?? InvestorType.INDIVIDUAL,
        companyName: dto.companyName ?? null,
        companyRegistrationNumber: dto.companyRegistrationNumber ?? null,
        taxId: dto.taxId ?? null,
        address: dto.address ?? null,
        country: dto.country ?? 'Bangladesh',
        totalInvestmentCapacity: dto.totalInvestmentCapacity
          ? toDecimal(dto.totalInvestmentCapacity).toFixed(4)
          : null,
      },
      include: PROFILE_USER_SELECT,
    });

    this.logger.log(`Investor profile created for user ${userId}`);
    return profile;
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.investorProfile.findUnique({
      where: { userId },
      include: PROFILE_USER_SELECT,
    });
    if (!profile) {
      throw new NotFoundException('Investor profile not found');
    }
    return profile;
  }

  async exists(userId: string): Promise<boolean> {
    const profile = await this.prisma.investorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return Boolean(profile);
  }

  async updateProfile(userId: string, dto: UpdateInvestorProfileDto) {
    const existing = await this.prisma.investorProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new NotFoundException('Investor profile not found');
    }

    await this.assertUniqueProfileFields(
      dto.companyRegistrationNumber,
      dto.taxId,
      existing.id,
    );

    const data: Prisma.InvestorProfileUpdateInput = {};
    if (dto.investorType !== undefined) data.investorType = dto.investorType;
    if (dto.companyName !== undefined) data.companyName = dto.companyName ?? null;
    if (dto.companyRegistrationNumber !== undefined) {
      data.companyRegistrationNumber = dto.companyRegistrationNumber ?? null;
    }
    if (dto.taxId !== undefined) data.taxId = dto.taxId ?? null;
    if (dto.address !== undefined) data.address = dto.address ?? null;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.totalInvestmentCapacity !== undefined) {
      data.totalInvestmentCapacity = dto.totalInvestmentCapacity
        ? toDecimal(dto.totalInvestmentCapacity).toFixed(4)
        : null;
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    return this.prisma.investorProfile.update({
      where: { id: existing.id },
      data,
      include: PROFILE_USER_SELECT,
    });
  }

  async submitKyc(userId: string, dto: SubmitKycDto) {
    const profile = await this.getProfile(userId);

    if (dto.declaration !== true) {
      throw new BadRequestException(
        'You must accept the KYC declaration before submitting',
      );
    }

    if (profile.kycStatus === KYCStatus.VERIFIED) {
      throw new BadRequestException('KYC has already been verified');
    }
    if (profile.kycStatus === KYCStatus.PENDING) {
      throw new BadRequestException('KYC is already pending review');
    }

    return this.prisma.investorProfile.update({
      where: { id: profile.id },
      data: {
        kycStatus: KYCStatus.PENDING,
        kycSubmittedAt: new Date(),
        kycRejectionReason: null,
      },
      include: PROFILE_USER_SELECT,
    });
  }

  async getKycStatus(userId: string) {
    const profile = await this.getProfile(userId);
    return {
      kycStatus: profile.kycStatus,
      kycSubmittedAt: profile.kycSubmittedAt,
      kycVerifiedAt: profile.kycVerifiedAt,
      kycVerifiedBy: profile.kycVerifiedBy,
      kycRejectionReason: profile.kycRejectionReason,
    };
  }

  async verifyInvestor(
    investorId: string,
    adminId: string,
    approved: boolean,
    reason?: string,
  ) {
    const profile = await this.prisma.investorProfile.findUnique({
      where: { id: investorId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException('Investor profile not found');
    }

    return this.prisma.investorProfile.update({
      where: { id: investorId },
      data: approved
        ? {
            kycStatus: KYCStatus.VERIFIED,
            kycVerifiedAt: new Date(),
            kycVerifiedBy: adminId,
            kycRejectionReason: null,
          }
        : {
            kycStatus: KYCStatus.REJECTED,
            kycVerifiedAt: new Date(),
            kycVerifiedBy: adminId,
            kycRejectionReason:
              reason?.trim() || 'KYC submission does not meet verification requirements',
          },
      include: PROFILE_USER_SELECT,
    });
  }

  private async assertUniqueProfileFields(
    companyRegistrationNumber?: string,
    taxId?: string,
    excludeId?: string,
  ): Promise<void> {
    if (companyRegistrationNumber?.trim()) {
      const duplicate = await this.prisma.investorProfile.findFirst({
        where: {
          companyRegistrationNumber: companyRegistrationNumber.trim(),
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException(
          'An investor profile with this company registration number already exists',
        );
      }
    }

    if (taxId?.trim()) {
      const duplicate = await this.prisma.investorProfile.findFirst({
        where: {
          taxId: taxId.trim(),
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException('An investor profile with this tax ID already exists');
      }
    }
  }
}