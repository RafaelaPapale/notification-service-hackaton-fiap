import { Controller, Post, Body } from "@nestjs/common";
import { SendNotificationUseCase } from "src/application/use-cases/send-notification.use-case";
import { CreateEventDto } from "../dtos/event.dto";
import { EventPayload } from "src/domain/event-payload";

@Controller("notifications")
export class NotificationController {
  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  @Post()
  async send(@Body() event: CreateEventDto) {
    await this.sendNotification.execute(event as EventPayload);
    return { ok: true };
  }
}
