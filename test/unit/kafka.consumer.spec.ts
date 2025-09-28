/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { Kafka, Consumer, EachMessagePayload, KafkaMessage } from "kafkajs";
import { KafkaConsumerService } from "src/infraestructure/kafka/kafka.consumer";
import { SendNotificationUseCase } from "src/application/use-cases/send-notification.use-case";
import { EventType, EventPayload } from "src/domain/event-payload";

jest.mock("kafkajs");

describe("KafkaConsumerService", () => {
  let service: KafkaConsumerService;
  let sendNotification: SendNotificationUseCase;
  let mockConsumer: jest.Mocked<Consumer>;

  beforeEach(async () => {
    mockConsumer = {
      connect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
    } as unknown as jest.Mocked<Consumer>;

    (Kafka as jest.Mock).mockImplementation(() => ({
      consumer: jest.fn(() => mockConsumer),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaConsumerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string> = {
                KAFKA_BROKERS: "localhost:9092",
                KAFKA_GROUP_ID: "test-group",
                KAFKA_TOPIC: "test-topic",
              };
              return values[key];
            }),
          },
        },
        {
          provide: SendNotificationUseCase,
          useValue: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            execute: jest.fn(async (_event: EventPayload) => {}), // arrow function
          },
        },
      ],
    }).compile();

    service = module.get<KafkaConsumerService>(KafkaConsumerService);
    sendNotification = module.get(SendNotificationUseCase);
  });

  const createKafkaMessage = (value: string | null): KafkaMessage => ({
    value: value ? Buffer.from(value) : null,
    key: null,
    timestamp: Date.now().toString(),
    attributes: 0,
    offset: "0",
    headers: {},
  });

  const createEachMessagePayload = (
    message: KafkaMessage,
  ): EachMessagePayload => ({
    topic: "test-topic",
    partition: 0,
    message,
    heartbeat: async () => {},
    pause: () => () => {}, // retorna função vazia
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should subscribe and run the consumer on module init", async () => {
    mockConsumer.run.mockImplementation(async () => {}); // só para evitar erros
    await service.onModuleInit();

    expect(mockConsumer.connect).toHaveBeenCalled();
    expect(mockConsumer.subscribe).toHaveBeenCalledWith({
      topic: "test-topic",
      fromBeginning: false,
    });
    expect(mockConsumer.run).toHaveBeenCalled();
  });

  it("should call sendNotification.execute for each message", async () => {
    const event: EventPayload = {
      eventId: "1",
      eventType: EventType.VIDEO_PROCESSED,
      timestamp: new Date().toISOString(),
      user: { id: "user1", name: "Test User", email: "test@example.com" },
      data: {},
    };
    const message = createKafkaMessage(JSON.stringify(event));

    mockConsumer.run.mockImplementation(
      async (config: import("kafkajs").ConsumerRunConfig) => {
        if (config && config.eachMessage) {
          await config.eachMessage(createEachMessagePayload(message));
        }
      },
    );

    await service.onModuleInit();

    expect(sendNotification.execute).toHaveBeenCalledWith(event);
  });

  it("should not call sendNotification if message value is null", async () => {
    const message = createKafkaMessage(null);

    mockConsumer.run.mockImplementation(
      async (config: import("kafkajs").ConsumerRunConfig) => {
        if (config && config.eachMessage) {
          await config.eachMessage(createEachMessagePayload(message));
        }
      },
    );

    await service.onModuleInit();

    expect(sendNotification.execute).not.toHaveBeenCalled();
  });

  it("should log error if JSON.parse fails", async () => {
    const message = createKafkaMessage("INVALID_JSON");
    const loggerSpy = jest
      .spyOn(service["logger"], "error")
      .mockImplementation(() => {}); // arrow function bind segura

    mockConsumer.run.mockImplementation(async (config) => {
      if (config && typeof config.eachMessage === "function") {
        await config.eachMessage(createEachMessagePayload(message));
      }
    });

    await service.onModuleInit();

    expect(loggerSpy).toHaveBeenCalledWith(
      "Error processing message",
      expect.any(SyntaxError),
    );
  });
});
