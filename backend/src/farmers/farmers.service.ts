import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DocumentType, FarmerVerificationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/database.service';
import { S3Service } from '../common/utils/s3.service';
import { toDecimal } from '../common/utils/decimal.util';
import { CreateFarmerProfileDto } from './dto/create-farmer-profile.dto';
import { UpdateFarmerProfileDto } from './dto/update-farmer-profile.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { FarmerDocument } from './interfaces/farmer.interface';
import {
  isUploadedFile,
  UploadedMulterFile,
} from '../common/interfaces/uploaded-file.interface';

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

const DOCUMENT_ID_PATTERN = /^[0-9a-f-]+$/i;

@Injectable()
export class FarmersService {
  private readonly logger = new Logger(FarmersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async createProfile(userId: string, dto: CreateFarmerProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('A farmer profile already exists for this user');
    }

    await this.assertUniqueProfileFields(dto.businessRegistrationNumber, dto.taxId);

    const profile = await this.prisma.farmerProfile.create({
      data: {
        userId,
        businessName: dto.businessName,
        businessRegistrationNumber: dto.businessRegistrationNumber ?? null,
        taxId: dto.taxId ?? null,
        address: dto.address,
        district: dto.district,
        division: dto.division,
        country: dto.country ?? 'Bangladesh',
        bio: dto.bio ?? null,
        yearsExperience: dto.yearsExperience ?? null,
        totalLandAcres: dto.totalLandAcres
          ? toDecimal(dto.totalLandAcres).toFixed(2)
          : null,
      },
      include: PROFILE_USER_SELECT,
    });

    this.logger.log(`Farmer profile created for user ${userId}`);
    return profile;
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      include: PROFILE_USER_SELECT,
    });
    if (!profile) {
      throw new NotFoundException('Farmer profile not found');
    }
    return profile;
  }

  async exists(userId: string): Promise<boolean> {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return Boolean(profile);
  }

  async updateProfile(userId: string, dto: UpdateFarmerProfileDto) {
    const existing = await this.prisma.farmerProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new NotFoundException('Farmer profile not found');
    }

    await this.assertUniqueProfileFields(
      dto.businessRegistrationNumber,
      dto.taxId,
      existing.id,
    );

    const data: Prisma.FarmerProfileUpdateInput = {};
    if (dto.businessName !== undefined) data.businessName = dto.businessName;
    if (dto.businessRegistrationNumber !== undefined) {
      data.businessRegistrationNumber = dto.businessRegistrationNumber ?? null;
    }
    if (dto.taxId !== undefined) data.taxId = dto.taxId ?? null;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.district !== undefined) data.district = dto.district;
    if (dto.division !== undefined) data.division = dto.division;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.bio !== undefined) data.bio = dto.bio ?? null;
    if (dto.yearsExperience !== undefined) {
      data.yearsExperience = dto.yearsExperience ?? null;
    }
    if (dto.totalLandAcres !== undefined) {
      data.totalLandAcres = dto.totalLandAcres
        ? toDecimal(dto.totalLandAcres).toFixed(2)
        : null;
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    return this.prisma.farmerProfile.update({
      where: { id: existing.id },
      data,
      include: PROFILE_USER_SELECT,
    });
  }

  async uploadDocument(
    userId: string,
    file: unknown,
    dto: UploadDocumentDto,
  ): Promise<FarmerDocument> {
    await this.getProfile(userId);

    if (!isUploadedFile(file) || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('A document file is required');
    }

    const id = randomUUID();
    const key = `farmers/${userId}/documents/${id}`;
    const safeName = this.sanitizeFileName(file.originalname);

    await this.s3Service.uploadFile(key, file.buffer, file.mimetype, {
      metadata: {
        originalFilename: safeName,
        mimeType: file.mimetype,
        documentType: dto.documentType,
        description: encodeURIComponent(dto.description ?? ''),
      },
    });

    return {
      id,
      fileName: safeName,
      mimeType: file.mimetype,
      fileSize: file.buffer.length,
      documentType: dto.documentType,
      description: dto.description ?? null,
      fileUrl: key,
      uploadedAt: new Date(),
    };
  }

  async getDocuments(userId: string): Promise<FarmerDocument[]> {
    await this.getProfile(userId);

    const objects = await this.s3Service.listFiles(`farmers/${userId}/documents/`);
    const documents: FarmerDocument[] = [];

    for (const object of objects) {
      const id = object.key.split('/').pop();
      if (!id || id.startsWith('.')) {
        continue;
      }

      const metadata = await this.s3Service.getFileMetadata(object.key);
      const meta = metadata.metadata ?? {};
      const documentType = this.parseDocumentType(meta.documenttype);

      documents.push({
        id,
        fileName:
          this.metadataString(meta, 'originalfilename') ?? id,
        mimeType: metadata.contentType,
        fileSize: metadata.contentLength,
        documentType,
        description: this.metadataString(meta, 'description'),
        fileUrl: object.key,
        uploadedAt: object.lastModified ?? metadata.lastModified,
      });
    }

    return documents.sort((a, b) => {
      const ta = a.uploadedAt?.getTime() ?? 0;
      const tb = b.uploadedAt?.getTime() ?? 0;
      return tb - ta;
    });
  }

  async getDocument(userId: string, documentId: string) {
    await this.getProfile(userId);

    if (!DOCUMENT_ID_PATTERN.test(documentId)) {
      throw new NotFoundException('Document not found');
    }

    const key = `farmers/${userId}/documents/${documentId}`;
    const file = await this.s3Service.getFile(key);
    const meta = file.metadata ?? {};

    return {
      ...file,
      fileName: this.metadataString(meta, 'originalfilename') ?? 'document',
    };
  }

  async verifyProfile(
    profileId: string,
    adminId: string,
    approved: boolean,
    reason?: string,
  ) {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { id: profileId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException('Farmer profile not found');
    }

    return this.prisma.farmerProfile.update({
      where: { id: profileId },
      data: approved
        ? {
            verificationStatus: FarmerVerificationStatus.VERIFIED,
            verifiedAt: new Date(),
            verifiedBy: adminId,
            rejectionReason: null,
          }
        : {
            verificationStatus: FarmerVerificationStatus.REJECTED,
            verifiedAt: new Date(),
            verifiedBy: adminId,
            rejectionReason:
              reason?.trim() ||
              'Profile does not meet the verification requirements',
          },
      include: PROFILE_USER_SELECT,
    });
  }

  async getPendingVerifications() {
    return this.prisma.farmerProfile.findMany({
      where: { verificationStatus: FarmerVerificationStatus.PENDING },
      include: PROFILE_USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  private async assertUniqueProfileFields(
    businessRegistrationNumber?: string,
    taxId?: string,
    excludeId?: string,
  ): Promise<void> {
    if (businessRegistrationNumber?.trim()) {
      const duplicate = await this.prisma.farmerProfile.findFirst({
        where: {
          businessRegistrationNumber: businessRegistrationNumber.trim(),
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException(
          'A farmer profile with this business registration number already exists',
        );
      }
    }

    if (taxId?.trim()) {
      const duplicate = await this.prisma.farmerProfile.findFirst({
        where: {
          taxId: taxId.trim(),
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException(
          'A farmer profile with this tax ID already exists',
        );
      }
    }
  }

  private parseDocumentType(value: string | undefined): DocumentType {
    if (value && (Object.values(DocumentType) as string[]).includes(value)) {
      return value as DocumentType;
    }
    return DocumentType.OTHER;
  }

  private metadataString(
    metadata: Record<string, string> | undefined,
    key: string,
  ): string | undefined {
    const value = metadata?.[key];
    if (!value) {
      return undefined;
    }
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private sanitizeFileName(name: string): string {
    const sanitized = name
      .replace(/[^\w.\- ]+/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 120);
    return sanitized || `document_${Date.now()}`;
  }
}