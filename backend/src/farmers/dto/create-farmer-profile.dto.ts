import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFarmerProfileDto {
  @ApiProperty({
    example: 'Green Fields Agro Ltd.',
    description: 'Registered business / farming enterprise name',
  })
  @IsString()
  @IsNotEmpty({ message: 'businessName is required' })
  @MaxLength(200)
  businessName!: string;

  @ApiPropertyOptional({
    example: 'REG-2024-001234',
    description: 'Business registration number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessRegistrationNumber?: string;

  @ApiPropertyOptional({
    example: 'TIN-123456789',
    description: 'Tax identification number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxId?: string;

  @ApiProperty({
    example: 'House 12, Road 5, Uttara',
    description: 'Physical address of the farm / business',
  })
  @IsString()
  @IsNotEmpty({ message: 'address is required' })
  @MaxLength(255)
  address!: string;

  @ApiProperty({ example: 'Sirajganj', description: 'District' })
  @IsString()
  @IsNotEmpty({ message: 'district is required' })
  @MaxLength(100)
  district!: string;

  @ApiProperty({ example: 'Rajshahi', description: 'Administrative division' })
  @IsString()
  @IsNotEmpty({ message: 'division is required' })
  @MaxLength(100)
  division!: string;

  @ApiProperty({
    example: 'Bangladesh',
    description: 'Country',
    default: 'Bangladesh',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country: string = 'Bangladesh';

  @ApiPropertyOptional({
    example: 'Family-owned farm specializing in rice and vegetables',
    description: 'Short biography of the farmer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({
    example: 8,
    description: 'Years of farming experience',
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'yearsExperience must be an integer' })
  @Min(0, { message: 'yearsExperience must not be negative' })
  @Max(100, { message: 'yearsExperience must not exceed 100' })
  yearsExperience?: number;

  @ApiPropertyOptional({
    example: '25.50',
    description: 'Total land area in acres (up to 2 decimal places)',
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '1,2' },
    {
      message:
        'totalLandAcres must be a valid decimal with up to 2 decimal places',
    },
  )
  totalLandAcres?: string;
}