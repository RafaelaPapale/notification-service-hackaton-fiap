import { Module } from '@nestjs/common';
import { NotificationController } from './application/interfaces/controllers/notification.controller';
import { SendNotificationUseCase } from './application/use-cases/send-notification.use-case';
import { KafkaConsumerService } from './infraestructure/kafka/kafka.consumer';
import { MailService } from './infraestructure/mail/mail.service';

@Module({
  providers: [SendNotificationUseCase, MailService, KafkaConsumerService],
  controllers: [NotificationController],
})
export class NotificationModule {}
