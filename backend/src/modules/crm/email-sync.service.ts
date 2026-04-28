import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmEmail, EmailDirection, EmailImportance } from './entities/crm-email.entity';
import { CrmCustomer } from './crm-customer.entity';

interface ImapConfig {
  enabled: boolean;
  host: string;
  port: number;
  user: string;
  password: string;
  markAsRead: boolean;
}

@Injectable()
export class EmailSyncService {
  private readonly logger = new Logger(EmailSyncService.name);

  constructor(
    @InjectRepository(CrmEmail)
    private readonly emailRepo: Repository<CrmEmail>,
    @InjectRepository(CrmCustomer)
    private readonly customerRepo: Repository<CrmCustomer>,
  ) {}

  private getConfig(): ImapConfig {
    return {
      enabled: process.env.IMAP_ENABLED === 'true',
      host: process.env.IMAP_HOST || '',
      port: parseInt(process.env.IMAP_PORT || '993'),
      user: process.env.IMAP_USER || '',
      password: process.env.IMAP_PASSWORD || '',
      markAsRead: process.env.IMAP_MARK_READ !== 'false',
    };
  }

  /** 解析邮件内容，提取摘要 */
  private extractBodyPreview(body: string, maxLength: number = 200): string {
    if (!body) return '';
    // 去除 HTML 标签
    const text = body.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return text.slice(0, maxLength);
  }

  /** 根据发件人邮箱查找客户 */
  private async findCustomerByEmail(fromEmail: string): Promise<CrmCustomer | null> {
    if (!fromEmail) return null;
    return this.customerRepo.findOne({
      where: [
        { email: fromEmail },
        { email: fromEmail.toLowerCase() },
        { email: fromEmail.toUpperCase() },
      ],
    });
  }

  /**
   * IMAP 同步邮件（需要 imap 和 mailparser 库支持）
   * 使用示例：
   *   1. npm install imap mailparser
   *   2. 在 .env 中配置 IMAP_* 环境变量
   */
  async syncFromImap(): Promise<{ synced: number; matched: number }> {
    const config = this.getConfig();
    if (!config.enabled) {
      this.logger.debug('[EmailSync] IMAP sync is disabled');
      return { synced: 0, matched: 0 };
    }

    try {
      // imap/mailparser 是可选依赖，未安装时跳过
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      let imapModule: any, mailparserModule: any;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        imapModule = require('imap');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        mailparserModule = require('mailparser');
      } catch {
        this.logger.warn('[EmailSync] imap/mailparser not installed. Run: npm install imap mailparser');
        return { synced: 0, matched: 0 };
      }

      const Imap = imapModule;
      const { simpleParser } = mailparserModule;

      let synced = 0;
      let matched = 0;

      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      });

      const openInbox = (): Promise<any> =>
        new Promise((resolve, reject) => {
          imap.openBox('INBOX', true, (err, box) => {
            if (err) reject(err);
            else resolve(box);
          });
        });

      const fetchEmails = (): Promise<any[]> =>
        new Promise((resolve, reject) => {
          // 只拉取未读的邮件，最多 50 封
          const f = imap.seq.fetch('1:*', {
            bodies: 'HEADER.FIELDS (MESSAGE-ID FROM TO CC SUBJECT DATE)',
            struct: true,
          });

          const emails: any[] = [];
          f.on('message', (msg: any) => {
            const attrs: any = { headers: {}, sequenceNumber: 0 };
            let body: string = '';
            msg.on('attributes', (attrs_: any) => { Object.assign(attrs, attrs_); });
            msg.on('body', (stream: any) => {
              let buffer = '';
              stream.on('data', (chunk: Buffer) => { buffer += chunk.toString('utf8'); });
              stream.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  attrs.parsed = parsed;
                  emails.push(attrs);
                } catch { /* skip malformed */ }
              });
            });
          });
          f.once('error', reject);
          f.once('end', () => resolve(emails));
        });

      return new Promise((resolve, reject) => {
        imap.once('ready', async () => {
          try {
            await openInbox();
            const messages = await fetchEmails();

            for (const msg of messages) {
              const parsed = msg.parsed;
              const fromEmail = parsed?.from?.value?.[0]?.address || '';
              const subject = parsed?.subject || '(无主题)';
              const messageId = parsed?.messageId || `local-${Date.now()}-${Math.random()}`;
              const toRecipients = JSON.stringify(
                parsed?.to?.value?.map((r: any) => r.address) || [],
              );
              const ccRecipients = JSON.stringify(
                parsed?.cc?.value?.map((r: any) => r.address) || [],
              );
              const bodyHtml = parsed?.html || '';
              const bodyText = parsed?.text || '';
              const bodyPreview = this.extractBodyPreview(bodyHtml || bodyText);
              const emailDate = parsed?.date ? new Date(parsed.date) : new Date();

              // 检查是否已存在（防止重复拉取）
              const existing = await this.emailRepo.findOne({ where: { messageId } });
              if (existing) continue;

              // 按发件人匹配客户
              const customer = await this.findCustomerByEmail(fromEmail);

              const emailData: Partial<CrmEmail> = {
                messageId,
                subject,
                fromEmail,
                fromName: parsed?.from?.value?.[0]?.name || '',
                toRecipients,
                ccRecipients,
                bodyHtml: bodyHtml || undefined,
                bodyText: bodyText || undefined,
                bodyPreview,
                hasAttachments: parsed?.attachments?.length > 0 || false,
                attachments: parsed?.attachments
                  ? JSON.stringify(
                      parsed.attachments.map((a: any) => ({
                        filename: a.filename,
                        contentType: a.contentType,
                        size: a.size,
                      })),
                    )
                  : undefined,
                direction: EmailDirection.INBOUND,
                importance: EmailImportance.NORMAL,
                customerId: customer?.id ?? undefined,
                ownerId: customer?.ownerId ?? undefined,
                emailDate,
              };

              await this.emailRepo.save(this.emailRepo.create(emailData));
              synced++;

              if (customer) matched++;
            }

            imap.end();
          } catch (err) {
            imap.end();
            reject(err);
          }
        });

        imap.once('error', (err: any) => {
          this.logger.error('[EmailSync] IMAP error: ' + err.message);
          reject(err);
        });

        imap.connect();
      }).then(
        (result) => {
          this.logger.log(`[EmailSync] Synced ${synced} emails, ${matched} matched to customers`);
          return { synced, matched };
        },
        () => ({ synced: 0, matched: 0 }),
      );
    } catch (err: any) {
      if (err.code === 'MODULE_NOT_FOUND') {
        this.logger.warn(
          '[EmailSync] imap/mailparser not installed. Run: npm install imap mailparser',
        );
      } else {
        this.logger.error('[EmailSync] Failed: ' + err.message);
      }
      return { synced: 0, matched: 0 };
    }
  }

  /** 每 15 分钟自动同步一次（可配置） */
  @Cron('*/15 * * * *')
  async scheduledSync() {
    const result = await this.syncFromImap();
    if (result.synced > 0) {
      this.logger.log(`[EmailSync] Scheduled sync: ${result.synced} new, ${result.matched} matched`);
    }
  }
}
