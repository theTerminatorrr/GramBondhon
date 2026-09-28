import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyFarmerProfileDto {
  @ApiProperty({
    example: true,
    description: 'Whether the farmer profile should be approved',
  })
  @IsBoolean({ message: 'approved must be a boolean' })
  approved!: boolean;

  @ApiPropertyOptional({
    example: 'Business registration could not be verified',
    description: 'Rejection reason (required when approving is false)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}