import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum EscrowTypeFilter {
  DEPOSIT = 'DEPOSIT',
  LOCK = 'LOCK',
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  FEE = 'FEE',
}

export class EscrowQueryDto {
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

  @ApiPropertyOptional({ description: 'Filter by transaction type' })
  @IsOptional()
  @IsEnum(EscrowTypeFilter)
  type?: EscrowTypeFilter;

  @ApiPropertyOptional({ description: 'Reference of the originator' })
  @IsOptional()
  @IsString()
  reference?: string;
}