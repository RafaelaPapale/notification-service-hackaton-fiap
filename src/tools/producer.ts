import { Kafka } from 'kafkajs';

async function run() {
  const kafka = new Kafka({
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  });
  const producer = kafka.producer();
  await producer.connect();

  const event = {
    eventId: 'evt-' + Date.now(),
    eventType: 'VIDEO_PROCESSED',
    timestamp: new Date().toISOString(),
    user: { id: 'u1', name: 'Rafa', email: 'teste@exemplo.com' },
    data: {
      videoId: 'vid-1',
      videoTitle: 'Aula NestJS',
      videoUrl: 'https://...',
    },
  };

  await producer.send({
    topic: 'video-events',
    messages: [{ value: JSON.stringify(event) }],
  });

  await producer.disconnect();
  console.log('message produced');
}

run().catch(console.error);
