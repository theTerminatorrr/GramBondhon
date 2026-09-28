import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectDealDto {
  @ApiProperty({
    example: 'Farmer verification documents are outdated and need to be renewed.',
    minLength: 10,
    maxLength: 1000,
    description: 'Reason for rejecting the deal',
  })
  @IsString({ message: 'reason must be a string' })
  @MinLength(10, { message: 'reason must be at least 10 characters' })
  @MaxLength(1000, { message: 'reason must be at most 1000 characters' })
  reason!: string;
}