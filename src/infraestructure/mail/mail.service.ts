import { Injectable, Logger } from "@nestjs/common";
import nodemailerModule, { Transporter } from "nodemailer";
import * as fs from "fs/promises";
import * as path from "path";
import * as handlebars from "handlebars";
import { ConfigService } from "@nestjs/config";
import { EventPayload, EventType } from "src/domain/event-payload";

const nodemailer = nodemailerModule;

@Injectable()
export class MailService {
  private transporter: Transporter;
  private templates = new Map<string, Handlebars.TemplateDelegate>();
  private logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>("SMTP_HOST") || "localhost",
      port: Number(this.config.get<string>("SMTP_PORT") || 1025),
      secure: false,
      auth: this.config.get<string>("SMTP_USER")
        ? {
            user: this.config.get<string>("SMTP_USER")!,
            pass: this.config.get<string>("SMTP_PASS")!,
          }
        : undefined,
    }) as Transporter;
  }

  private async loadTemplate(
    name: string,
  ): Promise<Handlebars.TemplateDelegate> {
    if (this.templates.has(name)) return this.templates.get(name)!;
    const p = path.join(process.cwd(), "templates", `${name}.hbs`);
    const content = await fs.readFile(p, "utf8");
    const compiled: Handlebars.TemplateDelegate = handlebars.compile(content);
    this.templates.set(name, compiled);
    return compiled;
  }

  private async sendMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const info = await this.transporter.sendMail({
      from: this.config.get<string>("FROM_EMAIL") || "no-reply@example.com",
      to,
      subject,
      html,
    });

    this.logger.log(`Email sent to ${to} - ${subject} (id=${info.messageId})`);
  }

  async sendByEvent(event: EventPayload): Promise<void> {
    const templateName =
      event.eventType === EventType.VIDEO_PROCESSED
        ? "video_processed"
        : "video_failed";
    const compile = await this.loadTemplate(templateName);
    const html = compile({ user: event.user, data: event.data });
    const subject =
      event.eventType === EventType.VIDEO_PROCESSED
        ? `Seu vídeo "${event.data.videoTitle}" foi processado`
        : `Falha no processamento do vídeo "${event.data.videoTitle}"`;
    await this.sendMail(event.user.email, subject, html);
  }
}
