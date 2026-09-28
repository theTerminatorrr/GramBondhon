import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmptyObject, IsObject, IsString, IsUUID } from 'class-validator';
import { OracleEntityType } from '../interfaces/oracle.interface';

export class SubmitAttestationDto {
  @ApiProperty({
    enum: OracleEntityType,
    description: 'Type of entity being attested',
    example: OracleEntityType.HARVEST,
  })
  @IsEnum(OracleEntityType)
  entityType!: OracleEntityType;

  @ApiProperty({
    description: 'ID of the entity being attested',
    example: 'e1a3f0d0-6c4b-4c3e-9d8a-1f2b3c4d5e6f',
  })
  @IsUUID()
  entityId!: string;

  @ApiProperty({
    description: 'Attestation data payload',
    example: { quantity: 1200, unit: 'kg', qualityGrade: 'A' },
  })
  @IsObject()
  @IsNotEmptyObject()
  data!: Record<string, unknown>;
}