import { Test, TestingModule } from "@nestjs/testing";
import { NotificationController } from "src/application/interfaces/controllers/notification.controller";
import { CreateEventDto } from "src/application/interfaces/dtos/event.dto";
import { SendNotificationUseCase } from "src/application/use-cases/send-notification.use-case";
import { EventType, UserDTO } from "src/domain/event-payload";

describe("NotificationController", () => {
  let controller: NotificationController;
  let sendNotificationUseCase: SendNotificationUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: SendNotificationUseCase,
          useValue: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            execute: jest.fn(function (this: void, ...args: any[]) {}),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    sendNotificationUseCase = module.get<SendNotificationUseCase>(
      SendNotificationUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call SendNotificationUseCase.execute and return { ok: true }", async () => {
    const user: UserDTO = { id: "u1", name: "John", email: "john@example.com" };
    const event: CreateEventDto = {
      eventId: "e1",
      eventType: EventType.VIDEO_PROCESSED,
      timestamp: new Date().toISOString(),
      user,
      data: { videoTitle: "Test Video" },
    };

    (sendNotificationUseCase.execute as jest.Mock).mockResolvedValue(undefined);

    const result = await controller.send(event);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sendNotificationUseCase.execute).toHaveBeenCalledWith(event);
    expect(result).toEqual({ ok: true });
  });

  it("should propagate errors from SendNotificationUseCase", async () => {
    const user: UserDTO = { id: "u1", email: "john@example.com" };
    const event: CreateEventDto = {
      eventId: "e2",
      eventType: EventType.VIDEO_FAILED,
      timestamp: new Date().toISOString(),
      user,
      data: {},
    };

    const error = new Error("Something went wrong");
    (sendNotificationUseCase.execute as jest.Mock).mockRejectedValue(error);

    await expect(controller.send(event)).rejects.toThrow(
      "Something went wrong",
    );
  });
});
