import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvestorType } from '@prisma/client';
import {
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateInvestorProfileDto {
  @ApiProperty({
    enum: InvestorType,
    description: 'Type of investor',
    default: InvestorType.INDIVIDUAL,
  })
  @IsEnum(InvestorType, { message: 'investorType must be a valid investor type' })
  investorType: InvestorType = InvestorType.INDIVIDUAL;

  @ApiPropertyOptional({
    example: 'Capital Growth Holdings Ltd.',
    description: 'Company name (for institutional / corporate investors)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @ApiPropertyOptional({
    example: 'COM-2024-008765',
    description: 'Company registration number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyRegistrationNumber?: string;

  @ApiPropertyOptional({
    example: 'TIN-987654321',
    description: 'Tax identification number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxId?: string;

  @ApiPropertyOptional({
    example: 'Level 8, Fortune Tower, Gulshan',
    description: 'Physical / registered address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    example: 'Bangladesh',
    description: 'Country',
    default: 'Bangladesh',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country: string = 'Bangladesh';

  @ApiPropertyOptional({
    example: '1500000.0000',
    description: 'Total investment capacity (up to 4 decimal places)',
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '1,4' },
    {
      message:
        'totalInvestmentCapacity must be a valid decimal with up to 4 decimal places',
    },
  )
  totalInvestmentCapacity?: string;
}