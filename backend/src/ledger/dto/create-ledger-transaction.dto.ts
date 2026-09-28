import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class LedgerEntryDto {
  @ApiProperty({ description: 'ID of the account to post the entry to' })
  @IsString()
  @IsUUID()
  accountId!: string;

  @ApiPropertyOptional({
    description: 'Debit amount (string decimal, up to 4dp)',
    example: '1000.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,4})?$/, {
    message: 'debit must be a non-negative decimal with up to 4 decimal places',
  })
  debit?: string;

  @ApiPropertyOptional({
    description: 'Credit amount (string decimal, up to 4dp)',
    example: '1000.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,4})?$/, {
    message: 'credit must be a non-negative decimal with up to 4 decimal places',
  })
  credit?: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'BDT' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}

export class CreateLedgerTransactionDto {
  @ApiPropertyOptional({
    description: 'Reference type of the originating entity',
    example: 'INVESTMENT',
  })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'ID of the originating entity' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Human readable description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Idempotency key to prevent duplicate ledger transactions',
  })
  @IsString()
  idempotencyKey!: string;

  @ApiProperty({
    description: 'Ledger entries. Sum of debits must equal sum of credits',
    isArray: true,
    type: LedgerEntryDto,
  })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => LedgerEntryDto)
  entries!: LedgerEntryDto[];

  @ApiPropertyOptional({ description: 'Free-form metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}