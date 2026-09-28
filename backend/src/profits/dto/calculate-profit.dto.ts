import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CalculateProfitDto {
  @ApiProperty({ description: 'Deal to calculate profit for' })
  @IsUUID()
  dealId!: string;

  @ApiPropertyOptional({
    description: 'Override total revenue (string decimal, up to 4dp)',
    example: '120000.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,4})?$/, {
    message: 'totalRevenue must be a non-negative decimal with up to 4 decimal places',
  })
  totalRevenue?: string;

  @ApiPropertyOptional({
    description: 'Override total expenses (string decimal, up to 4dp)',
    example: '80000.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,4})?$/, {
    message: 'totalExpenses must be a non-negative decimal with up to 4 decimal places',
  })
  totalExpenses?: string;

  @ApiPropertyOptional({
    description: 'Restrict expenses to these approved expense IDs',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  approvedExpenseIds?: string[];
}