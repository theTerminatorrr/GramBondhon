import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyAttestationDto {
  @ApiPropertyOptional({
    description: 'Notes recorded during verification',
    example: 'Verified against on-farm records and imagery',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}