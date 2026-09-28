import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFarmDto {
  @ApiProperty({ example: 'Green Valley Farm', description: 'Name of the farm' })
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    example: '40 acres of irrigated rice paddies',
    description: 'Description of the farm',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: 'Ullah Para, Sirajganj Sadar',
    description: 'Location of the farm',
  })
  @IsString()
  @IsNotEmpty({ message: 'location is required' })
  @MaxLength(255)
  location!: string;

  @ApiPropertyOptional({
    type: Number,
    example: 24.4536,
    description: 'Latitude coordinate (at most 7 decimal places)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 }, { message: 'latitude must be a valid coordinate' })
  @Min(-90, { message: 'latitude must be between -90 and 90' })
  @Max(90, { message: 'latitude must be between -90 and 90' })
  latitude?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 89.7,
    description: 'Longitude coordinate (at most 7 decimal places)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 }, { message: 'longitude must be a valid coordinate' })
  @Min(-180, { message: 'longitude must be between -180 and 180' })
  @Max(180, { message: 'longitude must be between -180 and 180' })
  longitude?: number;

  @ApiProperty({
    example: '50.75',
    description: 'Total farm area in acres (up to 2 decimal places)',
  })
  @IsDecimal(
    { decimal_digits: '1,2' },
    {
      message: 'totalAreaAcres must be a valid decimal with up to 2 decimal places',
    },
  )
  totalAreaAcres!: string;

  @ApiPropertyOptional({ example: 'Silty loam', description: 'Dominant soil type' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  soilType?: string;

  @ApiPropertyOptional({ example: 'River / Borewell', description: 'Water source' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  waterSource?: string;
}