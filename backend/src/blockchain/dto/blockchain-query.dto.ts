import { IsOptional, IsString, IsNumberString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BlockchainQueryDto {
  @IsOptional()
  @IsString()
  fromBlock?: string;

  @IsOptional()
  @IsString()
  toBlock?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumberString()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  contractAddress?: string;

  @IsOptional()
  @IsString()
  fromAddress?: string;

  @IsOptional()
  @IsString()
  toAddress?: string;
}
