import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Amount to charge (string decimal, up to 4dp)',
    example: '1000.0000',
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,4})?$/, {
    message: 'amount must be a non-negative decimal with up to 4 decimal places',
  })
  amount!: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'BDT' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Investment this payment is funding (if applicable)',
  })
  @IsOptional()
  @IsUUID()
  investmentId?: string;

  @ApiProperty({
    description: 'Client generated idempotency key to deduplicate requests',
  })
  @IsString()
  idempotencyKey!: string;
}