import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitKycDto {
  @ApiProperty({
    example: true,
    description:
      'Declaration that all submitted information is accurate and truthful',
  })
  @IsBoolean({ message: 'declaration must be a boolean' })
  declaration!: boolean;

  @ApiPropertyOptional({
    example: 'Submitting passport and business registration documents',
    description: 'Optional notes about the KYC submission',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}