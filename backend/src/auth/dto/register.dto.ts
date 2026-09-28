import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum UserRole {
  FARMER = 'FARMER',
  INVESTOR = 'INVESTOR',
  ADMIN = 'ADMIN',
}

export class RegisterDto {
  @ApiProperty({ example: 'farmer@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'A valid email is required' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Secret123!', minLength: 8, description: 'User password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
  )
  password!: string;

  @ApiProperty({ example: 'Amara', description: 'First name' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Okafor', description: 'Last name' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: '+2348123456789', required: false, description: 'Phone number' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Phone number must be a valid E.164-formatted number' })
  phone?: string;

  @ApiProperty({
    enum: UserRole,
    default: UserRole.FARMER,
    required: false,
    description: 'User role',
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be FARMER, INVESTOR or ADMIN' })
  role?: UserRole;
}