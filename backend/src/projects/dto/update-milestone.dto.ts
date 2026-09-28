import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MilestoneStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMilestoneDto {
  @ApiPropertyOptional({ example: 'Land preparation - phase 2' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    example: '2026-07-15',
    description: 'Target completion date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'targetDate must be a valid ISO 8601 date' })
  targetDate?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Display order of the milestone within the project',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'sortOrder must be an integer' })
  @Min(0, { message: 'sortOrder must not be negative' })
  sortOrder?: number;

  @ApiPropertyOptional({
    enum: MilestoneStatus,
    description: 'Progress status of the milestone',
  })
  @IsOptional()
  @IsEnum(MilestoneStatus, { message: 'status must be a valid milestone status' })
  status?: MilestoneStatus;
}