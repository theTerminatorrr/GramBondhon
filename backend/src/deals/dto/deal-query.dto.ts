import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DealStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

const SORT_FIELDS = ['createdAt', 'fundingTarget', 'totalInvested', 'publishedAt'] as const;

export class DealQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20, maximum: 100, description: 'Results per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must be at most 100' })
  limit?: number;

  @ApiPropertyOptional({ enum: DealStatus, description: 'Filter deals by status' })
  @IsOptional()
  @IsEnum(DealStatus, { message: 'status must be a valid DealStatus' })
  status?: DealStatus;

  @ApiPropertyOptional({ example: 'rice', description: 'Search term matched against title/description' })
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  search?: string;

  @ApiPropertyOptional({ description: 'Lower bound filter on fundingTarget' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'minFunding must be a number' })
  @Min(0)
  minFunding?: number;

  @ApiPropertyOptional({ description: 'Upper bound filter on fundingTarget' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'maxFunding must be a number' })
  @Min(0)
  maxFunding?: number;

  @ApiPropertyOptional({ description: 'Filter deals belonging to a specific farmer profile' })
  @IsOptional()
  @IsUUID('all', { message: 'farmerId must be a valid UUID' })
  farmerId?: string;

  @ApiPropertyOptional({ description: 'Filter deals by associated crop' })
  @IsOptional()
  @IsUUID('all', { message: 'cropId must be a valid UUID' })
  cropId?: string;

  @ApiPropertyOptional({ description: 'Filter deals created on or after this date (ISO)' })
  @IsOptional()
  @IsDateString({}, { message: 'fromDate must be a valid ISO date string' })
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter deals created on or before this date (ISO)' })
  @IsOptional()
  @IsDateString({}, { message: 'toDate must be a valid ISO date string' })
  toDate?: string;

  @ApiPropertyOptional({
    enum: SORT_FIELDS,
    default: 'createdAt',
    description: 'Field to sort results by',
  })
  @IsOptional()
  @IsIn(SORT_FIELDS, { message: `sortBy must be one of: ${SORT_FIELDS.join(', ')}` })
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc', description: 'Sort direction' })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: "sortOrder must be 'asc' or 'desc'" })
  sortOrder?: 'asc' | 'desc';
}