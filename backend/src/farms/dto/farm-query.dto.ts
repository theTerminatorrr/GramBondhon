import { ApiPropertyOptional } from '@nestjs/swagger';
import { FarmStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FarmQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: FarmStatus,
    description: 'Filter farms by status',
  })
  @IsOptional()
  @IsEnum(FarmStatus, { message: 'status must be a valid farm status' })
  status?: FarmStatus;

  @ApiPropertyOptional({
    example: 'Sirajganj',
    description: 'Filter farms by the district of the owning farmer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;
}