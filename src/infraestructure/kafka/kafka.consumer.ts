import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Kafka, Consumer } from "kafkajs";
import { ConfigService } from "@nestjs/config";
import { SendNotificationUseCase } from "src/application/use-cases/send-notification.use-case";
import { EventPayload } from "src/domain/event-payload";

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer!: Consumer;

  constructor(
    private readonly config: ConfigService,
    private readonly sendNotification: SendNotificationUseCase,
  ) {
    const brokers = (
      this.config.get<string>("KAFKA_BROKERS") ?? "localhost:9092"
    ).split(",");
    this.kafka = new Kafka({ brokers });
  }

  async onModuleInit() {
    const groupId =
      this.config.get<string>("KAFKA_GROUP_ID") ?? "notification-service";
    const topic = this.config.get<string>("KAFKA_TOPIC") ?? "video-events";

    this.consumer = this.kafka.consumer({ groupId });

    await this.consumer.connect();
    await this.consumer.subscribe({ topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          if (!message.value) return;

          const rawValue = message.value.toString();
          const event = JSON.parse(rawValue) as EventPayload;

          await this.sendNotification.execute(event);
        } catch (err) {
          this.logger.error("Error processing message", err);
        }
      },
    });

    this.logger.log(
      `Subscribed to ${topic} (brokers: ${this.config.get<string>("KAFKA_BROKERS")})`,
    );
  }
}
