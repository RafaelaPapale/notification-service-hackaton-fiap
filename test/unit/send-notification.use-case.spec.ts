import { Test, TestingModule } from "@nestjs/testing";
import { MailService } from "src/infraestructure/mail/mail.service";
import { EventPayload, EventType, UserDTO } from "src/domain/event-payload";
import { SendNotificationUseCase } from "src/application/use-cases/send-notification.use-case";

describe("SendNotificationUseCase", () => {
  let useCase: SendNotificationUseCase;
  let mailService: MailService;
  let loggerLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendNotificationUseCase,
        {
          provide: MailService,
          useValue: {
            sendByEvent: jest.fn(() => {}),
          },
        },
      ],
    }).compile();

    useCase = module.get<SendNotificationUseCase>(SendNotificationUseCase);
    mailService = module.get<MailService>(MailService);

    // Espionar logger
    loggerLogSpy = jest
      .spyOn((useCase as any).logger, "log")
      .mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call logger and mailService.sendByEvent with the event", async () => {
    const user: UserDTO = { id: "1", name: "John", email: "john@example.com" };
    const event: EventPayload = {
      eventId: "e1",
      eventType: EventType.VIDEO_PROCESSED,
      timestamp: new Date().toISOString(),
      user,
      data: { videoTitle: "Test Video" },
    };

    await useCase.execute(event);

    expect(loggerLogSpy).toHaveBeenCalledWith(
      `Processing event e1 - VIDEO_PROCESSED`,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mailService.sendByEvent).toHaveBeenCalledWith(event);
  });
});
