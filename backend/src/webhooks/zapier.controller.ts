import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ZapierService } from './zapier.service';
import { IncomingZapierActionDto, ZapierTestPingDto } from './dto/zapier-webhook.dto';

@ApiTags('webhooks')
@Controller('webhooks/zapier')
export class ZapierController {
  private readonly logger = new Logger(ZapierController.name);

  constructor(
    private readonly zapierService: ZapierService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get status of Zapier webhook integration' })
  @ApiResponse({ status: 200, description: 'Zapier integration configuration details' })
  getStatus() {
    return this.zapierService.getStatus();
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test ping event to Zapier Catch Hook' })
  @ApiResponse({ status: 200, description: 'Test ping dispatch result' })
  async sendTestPing(@Body() dto: ZapierTestPingDto) {
    const result = await this.zapierService.sendTestPing(dto?.webhookUrl, dto?.message);
    return {
      message: result.success ? 'Test event successfully dispatched to Zapier' : 'Failed to dispatch test event',
      result,
    };
  }

  @Post('incoming')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive incoming actions/triggers from Zapier' })
  @ApiResponse({ status: 200, description: 'Incoming Zapier action received and queued' })
  async handleIncoming(
    @Body() dto: IncomingZapierActionDto,
    @Headers('x-zapier-secret') secretHeader?: string,
  ) {
    const configuredSecret = this.zapierService.webhookSecret;
    if (configuredSecret) {
      const providedSecret = secretHeader || dto.secret;
      if (providedSecret !== configuredSecret) {
        this.logger.warn('Unauthorized Zapier incoming webhook attempt (invalid secret)');
        throw new UnauthorizedException('Invalid or missing Zapier webhook secret');
      }
    }

    this.logger.log(`Received incoming Zapier action: ${dto.action}`);

    // Emit event so other modules can handle this action asynchronously
    this.eventEmitter.emit(`zapier.action.${dto.action}`, {
      action: dto.action,
      data: dto.data,
      receivedAt: new Date().toISOString(),
    });

    return {
      success: true,
      action: dto.action,
      receivedAt: new Date().toISOString(),
    };
  }
}
