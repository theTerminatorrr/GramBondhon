import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export enum CreateSettlementType {
  INVESTOR_RETURN = 'INVESTOR_RETURN',
  FARMER_PAYOUT = 'FARMER_PAYOUT',
  PLATFORM_FEE = 'PLATFORM_FEE',
  REFUND = 'REFUND',
}

export class CreateSettlementDto {
  @ApiProperty({ description: 'Deal the settlement belongs to' })
  @IsUUID()
  dealId!: string;

  @ApiProperty({
    description: 'Amount to settle (string decimal, up to 4dp)',
    example: '500.0000',
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,4})?$/, {
    message: 'amount must be a non-negative decimal with up to 4 decimal places',
  })
  amount!: string;

  @ApiProperty({ enum: CreateSettlementType })
  @IsEnum(CreateSettlementType)
  type!: CreateSettlementType;

  @ApiPropertyOptional({ description: 'Recipient user (if applicable)' })
  @IsOptional()
  @IsUUID()
  toUserId?: string;

  @ApiPropertyOptional({ description: 'Target wallet address (if applicable)' })
  @IsOptional()
  @IsString()
  toWalletAddress?: string;

  @ApiPropertyOptional({ description: 'Payment provider to settle through' })
  @IsOptional()
  @IsString()
  provider?: string;
}