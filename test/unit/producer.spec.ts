import { Kafka } from "kafkajs";
import { run } from "src/tools/producer";

// Mock completo do Kafka
jest.mock("kafkajs", () => {
  const mProducer = {
    connect: jest.fn(),
    send: jest.fn(),
    disconnect: jest.fn(),
  };
  return {
    Kafka: jest.fn(() => ({
      producer: () => mProducer,
    })),
  };
});

describe("Kafka producer run function", () => {
  let producerMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const kafkaInstance = new Kafka({ brokers: ["localhost:9092"] });
    producerMock = kafkaInstance.producer();
  });

  it("should connect, send message, and disconnect", async () => {
    // Apenas mocka Date.now()
    const fakeTime = 1695902400000; // 2025-09-28T12:00:00Z
    jest.spyOn(global.Date, "now").mockReturnValue(fakeTime);

    await run();

    expect(producerMock.connect).toHaveBeenCalled();
    expect(producerMock.send).toHaveBeenCalledTimes(1);

    const sendArg = producerMock.send.mock.calls[0][0];
    const sentEvent = JSON.parse(sendArg.messages[0].value as string);

    expect(sendArg.topic).toBe("video-events");
    expect(sentEvent.eventId).toBe("evt-" + fakeTime);
    expect(sentEvent.eventType).toBe("VIDEO_PROCESSED");

    expect(producerMock.disconnect).toHaveBeenCalled();
  });
});
