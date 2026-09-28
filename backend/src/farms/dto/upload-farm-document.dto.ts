import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UploadFarmDocumentDto {
  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.LAND_TITLE,
    description: 'Type of the uploaded document',
  })
  @IsEnum(DocumentType, { message: 'documentType must be a valid document type' })
  documentType!: DocumentType;
}