import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.LAND_TITLE,
    description: 'Type of the uploaded document',
  })
  @IsEnum(DocumentType, { message: 'documentType must be a valid document type' })
  documentType!: DocumentType;

  @ApiPropertyOptional({
    example: 'Scanned copy of the registered land title',
    description: 'Optional description of the document',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}