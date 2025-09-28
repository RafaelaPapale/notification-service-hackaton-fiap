import { EventType, UserDTO, EventPayload } from "src/domain/event-payload";

describe("EventType enum", () => {
  it("should contain VIDEO_PROCESSED", () => {
    expect(EventType.VIDEO_PROCESSED).toBe("VIDEO_PROCESSED");
  });

  it("should contain VIDEO_FAILED", () => {
    expect(EventType.VIDEO_FAILED).toBe("VIDEO_FAILED");
  });
});

describe("UserDTO", () => {
  const validUser: UserDTO = {
    id: "123",
    name: "Rafaela",
    email: "rafa@example.com",
  };

  it("should allow valid user", () => {
    expect(validUser).toMatchObject({
      id: "123",
      name: "Rafaela",
      email: "rafa@example.com",
    });
  });

  it("should allow user without name", () => {
    const userWithoutName: UserDTO = {
      id: "456",
      email: "anon@example.com",
    };
    expect(userWithoutName).toMatchObject({
      id: "456",
      email: "anon@example.com",
    });
  });
});

describe("EventPayload", () => {
  function validateEventPayload(payload: any): asserts payload is EventPayload {
    if (
      !payload.eventId ||
      !payload.eventType ||
      !(
        typeof payload.eventType === "string" &&
        Object.values(EventType).includes(payload.eventType as EventType)
      ) ||
      !payload.timestamp ||
      !payload.user
    ) {
      throw new Error("Invalid EventPayload");
    }
  }
  const validPayload: EventPayload = {
    eventId: "evt-001",
    eventType: EventType.VIDEO_PROCESSED,
    timestamp: new Date().toISOString(),
    user: { id: "user-001", email: "user@example.com" },
    data: { duration: 120 },
  };

  it("should pass valid payload", () => {
    expect(() => validateEventPayload(validPayload)).not.toThrow();
  });

  it("should throw for invalid eventType", () => {
    const invalidPayload = { ...validPayload, eventType: "INVALID_EVENT" };
    expect(() => validateEventPayload(invalidPayload)).toThrow(
      "Invalid EventPayload",
    );
  });

  it("should throw for missing required fields", () => {
    const invalidPayload = { eventId: "evt-002" };
    expect(() => validateEventPayload(invalidPayload)).toThrow(
      "Invalid EventPayload",
    );
  });
});
