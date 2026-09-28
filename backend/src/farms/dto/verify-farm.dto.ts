import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyFarmDto {
  @ApiProperty({
    example: true,
    description: 'Whether the farm should be approved',
  })
  @IsBoolean({ message: 'approved must be a boolean' })
  approved!: boolean;

  @ApiPropertyOptional({
    example: 'Survey documents are out of date',
    description: 'Optional note attached to the verification outcome',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}