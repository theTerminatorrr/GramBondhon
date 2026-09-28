import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadProjectDocumentDto {
  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.BUDGET,
    description: 'Type of the uploaded document',
  })
  @IsEnum(DocumentType, { message: 'documentType must be a valid document type' })
  documentType!: DocumentType;

  @ApiPropertyOptional({
    example: 'Detailed input cost breakdown for the season',
    description: 'Optional description of the document',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}