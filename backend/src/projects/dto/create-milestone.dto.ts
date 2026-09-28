import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MilestoneStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMilestoneDto {
  @ApiProperty({ example: 'Land preparation', description: 'Milestone name' })
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    example: 'Ploughing and levelling of the main plot',
    description: 'Milestone description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: '2026-06-30',
    description: 'Target completion date (ISO 8601)',
  })
  @IsDateString({}, { message: 'targetDate must be a valid ISO 8601 date' })
  targetDate!: string;

  @ApiPropertyOptional({
    enum: MilestoneStatus,
    description: 'Initial status of the milestone',
  })
  @IsOptional()
  @IsEnum(MilestoneStatus, { message: 'status must be a valid milestone status' })
  status?: MilestoneStatus;
}