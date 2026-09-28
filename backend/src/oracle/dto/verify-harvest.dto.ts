import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class VerifyHarvestDto {
  @ApiProperty({
    description: 'Verified quantity of the harvest',
    example: 1250.5,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Quality grade assigned during verification',
    example: 'A',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  qualityGrade?: string;

  @ApiPropertyOptional({
    description: 'Verification notes',
    example: 'Confirmed by on-site inspection on 2026-09-01',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class VerifyRevenueDto {
  @ApiPropertyOptional({
    description: 'Notes recorded during revenue verification',
    example: 'Cross-referenced with linked sale records',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class VerifyExpenseDto {
  @ApiPropertyOptional({
    description: 'Notes recorded during expense verification',
    example: 'Receipt confirmed against vendor records',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class OracleListQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by project', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}