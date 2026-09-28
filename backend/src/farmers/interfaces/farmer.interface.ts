import { DocumentType, FarmerVerificationStatus } from '@prisma/client';

export interface FarmerDocument {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  documentType: DocumentType;
  description?: string | null;
  fileUrl?: string;
  uploadedAt?: Date;
}

export interface FarmerProfileUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
}

export interface FarmerProfileEntity {
  id: string;
  userId: string;
  businessName: string | null;
  businessRegistrationNumber: string | null;
  taxId: string | null;
  address: string | null;
  district: string | null;
  division: string | null;
  country: string | null;
  bio: string | null;
  yearsExperience: number | null;
  totalLandAcres: string | null;
  verificationStatus: FarmerVerificationStatus;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: FarmerProfileUser | null;
}