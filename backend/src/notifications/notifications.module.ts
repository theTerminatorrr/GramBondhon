import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MailController } from './mail.controller';
import { NotificationWorker } from './workers/notification.worker';
import { NotificationEmitterService } from './events/notification-emitter.service';
import { MailService } from './mail.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [NotificationsController, MailController],
  providers: [
    NotificationsService,
    NotificationWorker,
    NotificationEmitterService,
    MailService,
  ],
  exports: [NotificationsService, MailService],
})
export class NotificationsModule {}