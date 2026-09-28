import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Amara', required: false, description: 'First name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ example: 'Okafor', required: false, description: 'Last name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    example: '+2348123456789',
    required: false,
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'Phone number must be a valid E.164-formatted number',
  })
  phone?: string;

  @ApiProperty({
    example: 'farmer@example.com',
    required: false,
    description: 'Email address',
  })
  @IsOptional()
  @IsEmail({}, { message: 'A valid email is required' })
  @MaxLength(255)
  email?: string;
}