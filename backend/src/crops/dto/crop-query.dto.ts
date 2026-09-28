import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CropQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'Grain',
    description: 'Filter crops by category',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}