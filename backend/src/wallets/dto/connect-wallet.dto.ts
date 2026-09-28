import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';
import { WalletType, WalletTransactionType } from '@prisma/client';

export class ConnectWalletDto {
  @ApiProperty({
    description: 'Ethereum wallet address',
    example: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'address must be a valid Ethereum address (0x + 40 hex chars)',
  })
  address!: string;

  @ApiProperty({
    description: 'Blockchain chain ID',
    example: 31337,
  })
  @IsInt()
  @Min(1)
  chainId!: number;

  @ApiProperty({
    enum: WalletType,
    description: 'Wallet type',
    example: WalletType.EOA,
  })
  @IsEnum(WalletType)
  walletType!: WalletType;

  @ApiPropertyOptional({
    description: 'Human-friendly label',
    example: 'MetaMask primary',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}

export class UpdateWalletDto {
  @ApiPropertyOptional({
    description: 'Human-friendly label',
    example: 'Ledger cold wallet',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiPropertyOptional({
    description: 'Mark this wallet as the primary wallet',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isPrimary?: boolean;
}

export class WalletTransactionQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: WalletTransactionType,
    description: 'Filter by transaction type',
  })
  @IsOptional()
  @IsEnum(WalletTransactionType)
  type?: WalletTransactionType;
}