import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDealDto {
  @ApiProperty({
    example: 'db1f3f36-7f2a-4e9b-9c6a-4c1f3b2a5d10',
    description: 'The agricultural project the deal is being created for',
  })
  @IsUUID('all', { message: 'projectId must be a valid UUID' })
  projectId!: string;

  @ApiProperty({
    example: 'Rice Production Winter Season',
    minLength: 3,
    maxLength: 200,
    description: 'Human readable title of the deal',
  })
  @IsString()
  @MinLength(3, { message: 'title must be at least 3 characters' })
  @MaxLength(200, { message: 'title must be at most 200 characters' })
  title!: string;

  @ApiProperty({
    example: 'A rice production deal covering irrigation, seeds, labour and harvest for the winter season.',
    minLength: 10,
    description: 'Detailed description of the deal',
  })
  @IsString()
  @MinLength(10, { message: 'description must be at least 10 characters' })
  @MaxLength(5000, { message: 'description must be at most 5000 characters' })
  description!: string;

  @ApiProperty({
    example: 250000,
    minimum: 1000,
    description: 'Total amount of capital that needs to be raised',
  })
  @IsNumber({}, { message: 'fundingTarget must be a number' })
  @Min(1000, { message: 'fundingTarget must be at least 1000' })
  fundingTarget!: number;

  @ApiProperty({
    example: 5000,
    minimum: 100,
    description: 'Minimum amount a single investor can invest',
  })
  @IsNumber({}, { message: 'minimumInvestment must be a number' })
  @Min(100, { message: 'minimumInvestment must be at least 100' })
  minimumInvestment!: number;

  @ApiProperty({
    example: 50000,
    minimum: 0,
    description: 'Maximum amount a single investor can invest',
  })
  @IsNumber({}, { message: 'maximumInvestment must be a number' })
  @Min(0, { message: 'maximumInvestment must not be negative' })
  maximumInvestment!: number;

  @ApiProperty({
    example: 60,
    minimum: 0,
    maximum: 100,
    description: 'Percentage of distributable profit allocated to investors',
  })
  @IsNumber({}, { message: 'investorSharePercent must be a number' })
  @Min(0, { message: 'investorSharePercent must be between 0 and 100' })
  @Max(100, { message: 'investorSharePercent must be between 0 and 100' })
  investorSharePercent!: number;

  @ApiProperty({
    example: 40,
    minimum: 0,
    maximum: 100,
    description: 'Percentage of distributable profit allocated to the farmer',
  })
  @IsNumber({}, { message: 'farmerSharePercent must be a number' })
  @Min(0, { message: 'farmerSharePercent must be between 0 and 100' })
  @Max(100, { message: 'farmerSharePercent must be between 0 and 100' })
  farmerSharePercent!: number;

  @ApiProperty({
    example: 2.5,
    minimum: 0,
    maximum: 50,
    description: 'Percentage fee the platform charges on distributable profit',
  })
  @IsNumber({}, { message: 'platformFeePercent must be a number' })
  @Min(0, { message: 'platformFeePercent must be between 0 and 50' })
  @Max(50, { message: 'platformFeePercent must be between 0 and 50' })
  platformFeePercent!: number;

  @ApiProperty({
    example: 100,
    minimum: 1,
    description: 'Total number of tradable investment units the deal is split into',
  })
  @IsInt({ message: 'investmentUnits must be an integer' })
  @Min(1, { message: 'investmentUnits must be at least 1' })
  investmentUnits!: number;

  @ApiProperty({
    example: 180,
    minimum: 30,
    description: 'Expected duration of the deal in days',
  })
  @IsInt({ message: 'durationDays must be an integer' })
  @Min(30, { message: 'durationDays must be at least 30' })
  durationDays!: number;
}