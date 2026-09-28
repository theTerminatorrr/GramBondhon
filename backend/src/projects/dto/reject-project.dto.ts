import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectProjectDto {
  @ApiProperty({
    example: 'Expected revenue projections could not be validated',
    description: 'Reason for rejecting the project',
  })
  @IsString()
  @IsNotEmpty({ message: 'reason is required when rejecting a project' })
  @MaxLength(1000)
  reason!: string;
}