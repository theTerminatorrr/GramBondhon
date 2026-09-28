import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyInvestorDto {
  @ApiProperty({
    example: true,
    description: 'Whether the investor KYC should be approved',
  })
  @IsBoolean({ message: 'approved must be a boolean' })
  approved!: boolean;

  @ApiPropertyOptional({
    example: 'Insufficient identity documentation',
    description: 'Rejection reason (required when approving is false)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}