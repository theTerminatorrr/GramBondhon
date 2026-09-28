import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateDealTermDto } from './create-deal-term.dto';

export class UpdateDealDto {
  @ApiPropertyOptional({
    description: 'The agricultural project the deal is being created for',
  })
  @IsOptional()
  @IsUUID('all', { message: 'projectId must be a valid UUID' })
  projectId?: string;

  @ApiPropertyOptional({
    minLength: 3,
    maxLength: 200,
    description: 'Human readable title of the deal',
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'title must be at least 3 characters' })
  @MaxLength(200, { message: 'title must be at most 200 characters' })
  title?: string;

  @ApiPropertyOptional({
    minLength: 10,
    description: 'Detailed description of the deal',
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'description must be at least 10 characters' })
  @MaxLength(5000, { message: 'description must be at most 5000 characters' })
  description?: string;

  @ApiPropertyOptional({
    minimum: 1000,
    description: 'Total amount of capital that needs to be raised',
  })
  @IsOptional()
  @IsNumber({}, { message: 'fundingTarget must be a number' })
  @Min(1000, { message: 'fundingTarget must be at least 1000' })
  fundingTarget?: number;

  @ApiPropertyOptional({
    minimum: 100,
    description: 'Minimum amount a single investor can invest',
  })
  @IsOptional()
  @IsNumber({}, { message: 'minimumInvestment must be a number' })
  @Min(100, { message: 'minimumInvestment must be at least 100' })
  minimumInvestment?: number;

  @ApiPropertyOptional({
    minimum: 0,
    description: 'Maximum amount a single investor can invest',
  })
  @IsOptional()
  @IsNumber({}, { message: 'maximumInvestment must be a number' })
  @Min(0, { message: 'maximumInvestment must not be negative' })
  maximumInvestment?: number;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 100,
    description: 'Percentage of distributable profit allocated to investors',
  })
  @IsOptional()
  @IsNumber({}, { message: 'investorSharePercent must be a number' })
  @Min(0, { message: 'investorSharePercent must be between 0 and 100' })
  @Max(100, { message: 'investorSharePercent must be between 0 and 100' })
  investorSharePercent?: number;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 100,
    description: 'Percentage of distributable profit allocated to the farmer',
  })
  @IsOptional()
  @IsNumber({}, { message: 'farmerSharePercent must be a number' })
  @Min(0, { message: 'farmerSharePercent must be between 0 and 100' })
  @Max(100, { message: 'farmerSharePercent must be between 0 and 100' })
  farmerSharePercent?: number;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 50,
    description: 'Percentage fee the platform charges on distributable profit',
  })
  @IsOptional()
  @IsNumber({}, { message: 'platformFeePercent must be a number' })
  @Min(0, { message: 'platformFeePercent must be between 0 and 50' })
  @Max(50, { message: 'platformFeePercent must be between 0 and 50' })
  platformFeePercent?: number;

  @ApiPropertyOptional({
    minimum: 1,
    description: 'Total number of tradable investment units',
  })
  @IsOptional()
  @IsInt({ message: 'investmentUnits must be an integer' })
  @Min(1, { message: 'investmentUnits must be at least 1' })
  investmentUnits?: number;

  @ApiPropertyOptional({
    minimum: 30,
    description: 'Expected duration of the deal in days',
  })
  @IsOptional()
  @IsInt({ message: 'durationDays must be an integer' })
  @Min(30, { message: 'durationDays must be at least 30' })
  durationDays?: number;

  @ApiPropertyOptional({
    description: 'Optional start date of the deal operations (ISO date)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Optional end date of the deal operations (ISO date)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO date string' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Updated deal terms, content replaced and version auto-incremented',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateDealTermDto)
  terms?: CreateDealTermDto;
}