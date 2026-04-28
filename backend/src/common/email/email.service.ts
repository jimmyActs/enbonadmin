import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.EMAIL_HOST || '';
    const port = parseInt(process.env.EMAIL_PORT || '587', 10);
    const secure = process.env.EMAIL_SECURE === 'true';
    const user = process.env.EMAIL_USER || '';
    const pass = process.env.EMAIL_PASS || '';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });
      this.logger.log(`邮件服务已配置: ${host}:${port}`);
    } else {
      this.logger.warn('邮件服务未完整配置（EMAIL_HOST/EMAIL_USER/EMAIL_PASS），邮件发送将降级为控制台日志');
      this.transporter = null as any;
    }
  }

  async send(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    // 未配置时降级为控制台输出
    if (!this.transporter) {
      this.logger.log(`[邮件模拟] to=${to} subject=${options.subject}`);
      if (options.html) this.logger.log(`[邮件内容] ${options.html.substring(0, 200)}...`);
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        subject: options.subject,
        html: options.html || options.text,
        text: options.text,
      });
      this.logger.log(`邮件发送成功 to=${to} messageId=${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      this.logger.error(`邮件发送失败 to=${to} error=${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
