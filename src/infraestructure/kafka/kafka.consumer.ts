/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { SendNotificationUseCase } from 'src/application/use-cases/send-notification.use-case';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;

  constructor(
    private readonly config: ConfigService,
    private readonly sendNotification: SendNotificationUseCase,
  ) {
    const brokers = (
      this.config.get('KAFKA_BROKERS') || 'localhost:9092'
    ).split(',');
    this.kafka = new Kafka({ brokers });
  }

  async onModuleInit() {
    const groupId = this.config.get('KAFKA_GROUP_ID') || 'notification-service';
    const topic = this.config.get('KAFKA_TOPIC') || 'video-events';
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          if (!message.value) return;
          const event = JSON.parse(message.value.toString());
          await this.sendNotification.execute(event);
        } catch (err) {
          this.logger.error('Error processing message', err);
        }
      },
    });

    this.logger.log(
      `Subscribed to ${topic} (brokers: ${this.config.get('KAFKA_BROKERS')})`,
    );
  }
}
