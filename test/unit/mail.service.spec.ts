import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import * as fs from "fs/promises";
import { EventType, EventPayload, UserDTO } from "src/domain/event-payload";
import { MailService } from "src/infraestructure/mail/mail.service";

jest.mock("nodemailer");
jest.mock("fs/promises");

describe("MailService", () => {
  let service: MailService;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: "123" });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string> = {
                SMTP_HOST: "localhost",
                SMTP_PORT: "1025",
                FROM_EMAIL: "from@example.com",
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    service = module.get<MailService>(MailService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("loadTemplate", () => {
    it("should load and compile a template", async () => {
      const fakeContent = "<p>{{user.name}}</p>";
      (fs.readFile as jest.Mock).mockResolvedValue(fakeContent);

      const template = await service["loadTemplate"]("video_processed");
      expect(typeof template).toBe("function");

      const html = template({ user: { name: "John" } });
      expect(html).toBe("<p>John</p>");

      // Verifica cache
      const cached = await service["loadTemplate"]("video_processed");
      expect(cached).toBe(template);
    });
  });

  describe("sendMail", () => {
    it("should call transporter.sendMail with correct params", async () => {
      await service["sendMail"]("to@example.com", "Subject", "<p>HTML</p>");
      expect(sendMailMock).toHaveBeenCalledWith({
        from: "from@example.com",
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
      });
    });
  });

  describe("sendByEvent", () => {
    const user: UserDTO = { id: "1", name: "John", email: "john@example.com" };

    it("should send email for VIDEO_PROCESSED event", async () => {
      (fs.readFile as jest.Mock).mockResolvedValue("<p>{{user.name}}</p>");

      const event: EventPayload = {
        eventId: "e1",
        eventType: EventType.VIDEO_PROCESSED,
        timestamp: new Date().toISOString(),
        user,
        data: { videoTitle: "Test Video" },
      };

      await service.sendByEvent(event);

      expect(sendMailMock).toHaveBeenCalledWith({
        from: "from@example.com",
        to: "john@example.com",
        subject: 'Seu vídeo "Test Video" foi processado',
        html: "<p>John</p>",
      });
    });

    it("should send email for VIDEO_FAILED event", async () => {
      (fs.readFile as jest.Mock).mockResolvedValue("<p>{{user.name}}</p>");

      const event: EventPayload = {
        eventId: "e2",
        eventType: EventType.VIDEO_FAILED,
        timestamp: new Date().toISOString(),
        user,
        data: { videoTitle: "Test Video" },
      };

      await service.sendByEvent(event);

      expect(sendMailMock).toHaveBeenCalledWith({
        from: "from@example.com",
        to: "john@example.com",
        subject: 'Falha no processamento do vídeo "Test Video"',
        html: "<p>John</p>",
      });
    });
  });
});
