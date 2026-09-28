import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export class CreateInvestmentDto {
  @ApiProperty({ description: 'Deal being invested in' })
  @IsString()
  @IsUUID()
  dealId!: string;

  @ApiProperty({ description: 'Number of investment units to purchase', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  units!: number;

  @ApiProperty({
    description: 'Client generated idempotency key to deduplicate requests',
  })
  @IsString()
  idempotencyKey!: string;
}