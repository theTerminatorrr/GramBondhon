import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDealTermDto {
  @ApiProperty({
    example:
      '1. The farmer commits to transparent record keeping...\n2. Investors receive 60% of distributable profit...',
    description:
      'Full text content of the deal terms. The version field is auto-incremented by the server on every change.',
  })
  @IsString({ message: 'content must be a string' })
  @MinLength(10, { message: 'Deal terms content must be at least 10 characters' })
  @MaxLength(20000, { message: 'Deal terms content must be at most 20000 characters' })
  content!: string;

  @ApiPropertyOptional({
    example: 'a1b2c3...',
    description: 'Optional client-side content hash for integrity verification',
  })
  @IsOptional()
  @IsString({ message: 'hash must be a string' })
  @MaxLength(128)
  hash?: string;
}