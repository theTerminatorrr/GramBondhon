import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';

export class ZapierTestPingDto {
  @ApiPropertyOptional({
    description: 'Custom Zapier webhook catch URL to test. If omitted, the server uses ZAPIER_WEBHOOK_URL from environment.',
    example: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Must be a valid URL' })
  webhookUrl?: string;

  @ApiPropertyOptional({
    description: 'Custom sample message to send in the test payload',
    example: 'Hello from GramBondhon Test Ping',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export class IncomingZapierActionDto {
  @ApiProperty({
    description: 'Action type sent by Zapier automation',
    example: 'external_lead.created',
  })
  @IsNotEmpty()
  @IsString()
  action!: string;

  @ApiProperty({
    description: 'Payload data from Zapier action',
    example: { email: 'buyer@exportfirm.com', name: 'Global Agro Exports Ltd', quantityNeededKg: 5000 },
  })
  @IsNotEmpty()
  @IsObject()
  data!: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Shared secret token for authentication if configured',
  })
  @IsOptional()
  @IsString()
  secret?: string;
}

export interface ZapierEventPayload<T = any> {
  event: string;
  timestamp: string;
  environment: string;
  data: T;
}
