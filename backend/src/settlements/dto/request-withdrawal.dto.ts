import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export enum RequestWithdrawalMethod {
  BANK = 'BANK',
  MOBILE = 'MOBILE',
  BLOCKCHAIN = 'BLOCKCHAIN',
}

export class RequestWithdrawalDto {
  @ApiProperty({
    description: 'Amount to withdraw (string decimal, up to 4dp)',
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

  @ApiProperty({ enum: RequestWithdrawalMethod })
  @IsEnum(RequestWithdrawalMethod)
  method!: RequestWithdrawalMethod;

  @ApiProperty({
    description: 'Destination account details (bank account, mobile number, or wallet address)',
    example: { bankName: 'ABC Bank', accountNumber: '1234567890' },
  })
  @IsObject()
  accountDetails!: Record<string, unknown>;
}