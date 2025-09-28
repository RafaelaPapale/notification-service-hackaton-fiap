/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NotificationController } from "src/application/interfaces/controllers/notification.controller";
import { CreateEventDto } from "src/application/interfaces/dtos/event.dto";
import { SendNotificationUseCase } from "src/application/use-cases/send-notification.use-case";
import { EventType } from "src/domain/event-payload";
import { MailService } from "src/infraestructure/mail/mail.service";
import supertest from "supertest";

// Mock do MailService para não enviar e-mails de verdade
const mockMailService = {
  sendByEvent: jest.fn().mockResolvedValue(undefined),
};

describe("NotificationController (integração)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        SendNotificationUseCase,
        { provide: MailService, useValue: mockMailService },
        ConfigService,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve enviar notificação com sucesso", async () => {
    const payload: CreateEventDto = {
      eventId: "evt-123",
      eventType: EventType.VIDEO_PROCESSED,
      timestamp: new Date().toISOString(),
      user: {
        id: "user-1",
        name: "Rafaela",
        email: "rafaela@example.com",
      },
      data: { videoTitle: "Meu vídeo incrível" },
    };

    const response = await supertest(app.getHttpServer())
      .post("/notifications")
      .send(payload)
      .expect(201);

    expect(response.body).toEqual({ ok: true });
    expect(mockMailService.sendByEvent).toHaveBeenCalledWith(payload);
  });

  it("deve falhar se enviar payload inválido", async () => {
    const invalidPayload = {}; // objeto vazio, inválido
    await supertest(app.getHttpServer())
      .post("/notifications")
      .send(invalidPayload)
      .expect(400);
  });
});
