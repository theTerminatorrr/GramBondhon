import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ProjectQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ProjectStatus,
    description: 'Filter projects by status',
  })
  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'status must be a valid project status' })
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Filter projects by the owning farmer profile ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'farmerProfileId must be a valid UUID' })
  farmerProfileId?: string;

  @ApiPropertyOptional({ description: 'Filter projects by crop ID' })
  @IsOptional()
  @IsUUID('4', { message: 'cropId must be a valid UUID' })
  cropId?: string;

  @ApiPropertyOptional({
    example: '2026-06-01',
    description: 'Projects starting on or after this date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'fromDate must be a valid ISO 8601 date' })
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Projects starting on or before this date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'toDate must be a valid ISO 8601 date' })
  toDate?: string;
}