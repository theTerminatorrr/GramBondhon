import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Aman Rice Season 2026', description: 'Project name' })
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    example: 'Cultivation of high-yield rice across two plots',
    description: 'Project description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Farm associated with this project',
  })
  @IsOptional()
  @IsUUID('4', { message: 'farmId must be a valid UUID' })
  farmId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Crop being cultivated',
  })
  @IsOptional()
  @IsUUID('4', { message: 'cropId must be a valid UUID' })
  cropId?: string;

  @ApiPropertyOptional({ example: 'Aman', description: 'Growing season' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  season?: string;

  @ApiPropertyOptional({ example: 2026, description: 'Year of the project' })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'year must be an integer' })
  @Min(2000, { message: 'year must be no earlier than 2000' })
  @Max(2100, { message: 'year must be no later than 2100' })
  year?: number;

  @ApiPropertyOptional({
    example: '2026-06-15',
    description: 'Planned start date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO 8601 date' })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-11-30',
    description: 'Planned end date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO 8601 date' })
  endDate?: string;

  @ApiPropertyOptional({
    example: '120000.0000',
    description: 'Expected yield (up to 4 decimal places)',
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '1,4' },
    {
      message: 'expectedYield must be a valid decimal with up to 4 decimal places',
    },
  )
  expectedYield?: string;

  @ApiPropertyOptional({
    example: '2400000.0000',
    description: 'Expected revenue in BDT (up to 4 decimal places)',
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '1,4' },
    {
      message:
        'expectedRevenue must be a valid decimal with up to 4 decimal places',
    },
  )
  expectedRevenue?: string;
}