import { Injectable, Logger } from '@nestjs/common';
import { EventPayload } from 'src/domain/event-payload';
import { MailService } from 'src/infraestructure/mail/mail.service';

@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger(SendNotificationUseCase.name);

  constructor(private readonly mailService: MailService) {}

  async execute(event: EventPayload) {
    this.logger.log(`Processing event ${event.eventId} - ${event.eventType}`);
    // aqui pode inserir regras de negócio, logs, métricas, persistência, etc.
    await this.mailService.sendByEvent(event);
  }
}
