import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ZapierService } from './zapier.service';
import { ZapierEventListenerService } from './zapier-event-listener.service';
import { ZapierController } from './zapier.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ZapierController],
  providers: [ZapierService, ZapierEventListenerService],
  exports: [ZapierService],
})
export class WebhooksModule {}
