import { plainToInstance } from "class-transformer";
import "reflect-metadata";
import { validate } from "class-validator";
import { CreateEventDto } from "src/application/interfaces/dtos/event.dto";
import { EventType } from "src/domain/event-payload";

describe("CreateEventDto", () => {
  it("should validate a correct DTO", async () => {
    const dto = plainToInstance(CreateEventDto, {
      eventId: "e1",
      eventType: EventType.VIDEO_PROCESSED,
      timestamp: new Date().toISOString(),
      user: { id: "u1", name: "John", email: "john@example.com" },
      data: { videoTitle: "Test Video" },
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should fail if email is invalid", async () => {
    const dto = plainToInstance(CreateEventDto, {
      eventId: "e1",
      eventType: EventType.VIDEO_PROCESSED,
      timestamp: new Date().toISOString(),
      user: { id: "u1", name: "John", email: "not-an-email" },
      data: {},
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === "user")).toBe(true);

    const emailError = errors
      .find((e) => e.property === "user")!
      .children!.find((c) => c.property === "email");
    expect(emailError).toBeDefined();
    expect(emailError?.constraints).toHaveProperty("isEmail");
  });

  it("should fail if eventType is invalid", async () => {
    const dto = plainToInstance(CreateEventDto, {
      eventId: "e1",
      eventType: "INVALID_TYPE",
      timestamp: new Date().toISOString(),
      user: { id: "u1", email: "john@example.com" },
      data: {},
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === "eventType")).toBe(true);
  });

  it("should fail if data is not an object", async () => {
    const dto = plainToInstance(CreateEventDto, {
      eventId: "e1",
      eventType: EventType.VIDEO_PROCESSED,
      timestamp: new Date().toISOString(),
      user: { id: "u1", email: "john@example.com" },
      data: "not-an-object",
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === "data")).toBe(true);
  });
});
