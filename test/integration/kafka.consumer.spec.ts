import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { KafkaConsumerService } from "src/infraestructure/kafka/kafka.consumer";
import { SendNotificationUseCase } from "src/application/use-cases/send-notification.use-case";
import { MailService } from "src/infraestructure/mail/mail.service";
import { ConfigService } from "@nestjs/config";
import { EventType, EventPayload } from "src/domain/event-payload";

const mockMailService = {
  sendByEvent: jest.fn().mockResolvedValue(undefined),
};

const mockKafkaConsumer = {
  connect: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  run: jest.fn(),
};

jest.mock("kafkajs", () => ({
  Kafka: jest.fn(() => ({
    consumer: () => mockKafkaConsumer,
  })),
}));

describe("KafkaConsumerService (integração)", () => {
  let app: INestApplication;
  let kafkaService: KafkaConsumerService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        KafkaConsumerService,
        SendNotificationUseCase,
        { provide: MailService, useValue: mockMailService },
        ConfigService,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    kafkaService = moduleRef.get(KafkaConsumerService);
    kafkaService = moduleRef.get(KafkaConsumerService);
    // Mock do run para chamar a callback manually
    mockKafkaConsumer.run.mockImplementation(
      async ({
        eachMessage,
      }: {
        eachMessage: (payload: { message: { value: Buffer } }) => Promise<void>;
      }) => {
        const fakeMessage = {
          value: Buffer.from(
            JSON.stringify({
              eventId: "evt-1",
              eventType: EventType.VIDEO_PROCESSED,
              timestamp: new Date().toISOString(),
              user: { id: "user-1", email: "teste@example.com" },
              data: { videoTitle: "Meu vídeo" },
            } as EventPayload),
          ),
        };
        await eachMessage({ message: fakeMessage });
      },
    );

    // Inicializa o consumer
    await kafkaService.onModuleInit();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve processar mensagem Kafka e enviar e-mail", async () => {
    expect(mockMailService.sendByEvent).toHaveBeenCalledTimes(1);

    const calledWith = mockMailService.sendByEvent.mock
      .calls[0][0] as EventPayload;
    expect(calledWith.eventId).toBe("evt-1");
    expect(calledWith.user.email).toBe("teste@example.com");
    expect(calledWith.eventType).toBe(EventType.VIDEO_PROCESSED);
  });
});
