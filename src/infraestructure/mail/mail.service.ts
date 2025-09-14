import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';
import { EventPayload, EventType } from '../../domain/event.payload';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private templates = new Map<string, Handlebars.TemplateDelegate>();
  private logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST') || 'localhost',
      port: Number(this.config.get('SMTP_PORT') || 1025),
      secure: false,
      auth: this.config.get('SMTP_USER')
        ? { user: this.config.get('SMTP_USER'), pass: this.config.get('SMTP_PASS') }
        : undefined,
    });
  }

  private async loadTemplate(name: string) {
    if (this.templates.has(name)) return this.templates.get(name)!;
    const p = path.join(process.cwd(), 'templates', `${name}.hbs`);
    const content = await fs.readFile(p, 'utf8');
    const compiled = handlebars.compile(content);
    this.templates.set(name, compiled);
    return compiled;
  }

  private async sendMail(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: this.config.get('FROM_EMAIL') || 'no-reply@example.com',
      to,
      subject,
      html,
    });
    this.logger.log(`Email sent to ${to} - ${subject}`);
  }

  async sendByEvent(event: EventPayload) {
    const templateName = event.eventType === EventType.VIDEO_PROCESSED ? 'video_processed' : 'video_failed';
    const compile = await this.loadTemplate(templateName);
    const html = compile({ user: event.user, data: event.data });
    const subject =
      event.eventType === EventType.VIDEO_PROCESSED
        ? `Seu vídeo "${event.data.videoTitle}" foi processado`
        : `Falha no processamento do vídeo "${event.data.videoTitle}"`;
    await this.sendMail(event.user.email, subject, html);
  }
}
