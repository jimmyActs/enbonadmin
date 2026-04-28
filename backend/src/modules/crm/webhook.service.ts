import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmInquirySource } from './entities/crm-inquiry-source.entity';
import { CrmLead, LeadSource, LeadPriority, LeadStatus } from './entities/crm-lead.entity';
import * as crypto from 'crypto';

export interface WebhookInquiryPayload {
  contactName?: string;
  companyName?: string;
  country?: string;
  phone?: string;
  email?: string;
  inquiryContent?: string;
  sourceDetail?: string;
  website?: string;
  priority?: string;
}

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(CrmInquirySource)
    private readonly inquirySourceRepo: Repository<CrmInquirySource>,
    @InjectRepository(CrmLead)
    private readonly leadRepo: Repository<CrmLead>,
  ) {}

  /** 通过 sourceToken 查找来源配置（公开接口用） */
  async findSourceByToken(token: string): Promise<CrmInquirySource | null> {
    if (!token) return null;
    return this.inquirySourceRepo.findOne({
      where: { sourceToken: token, isActive: true },
    });
  }

  /** 通过 sourceId 查找来源配置（带签名用） */
  async findSourceById(id: number): Promise<CrmInquirySource | null> {
    return this.inquirySourceRepo.findOne({ where: { id, isActive: true } });
  }

  /** 验证 Webhook 签名（HMAC-SHA256） */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature.replace(/^sha256=/, ''), 'hex'),
    );
  }

  /** 生成一个新的 sourceToken（UUID v4） */
  generateToken(): string {
    return crypto.randomUUID();
  }

  /** 根据来源配置确定商机来源枚举 */
  mapWebsiteTypeToLeadSource(websiteType: string): LeadSource {
    const mapping: Record<string, LeadSource> = {
      official: LeadSource.OFFICIAL_WEBSITE,
      b2b_portal: LeadSource.WEBSITE,
      alibaba: LeadSource.WEBSITE,
      made_in_china: LeadSource.WEBSITE,
      facebook: LeadSource.SOCIAL_MEDIA,
      linkedin: LeadSource.SOCIAL_MEDIA,
      instagram: LeadSource.SOCIAL_MEDIA,
    };
    return mapping[websiteType] || LeadSource.WEBSITE;
  }

  /** 生成商机编码 */
  private async generateLeadCode(): Promise<string> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    const prefix = `L${dateStr}`;
    const lastLead = await this.leadRepo
      .createQueryBuilder('l')
      .where("l.leadCode LIKE :prefix", { prefix: `${prefix}%` })
      .orderBy('l.id', 'DESC')
      .getOne();
    const seq = lastLead ? parseInt(lastLead.leadCode.replace(prefix, '')) + 1 : 1;
    return `${prefix}${seq.toString().padStart(3, '0')}`;
  }

  /** 接收询盘并创建商机 */
  async createLeadFromWebhook(
    source: CrmInquirySource,
    payload: WebhookInquiryPayload,
  ): Promise<CrmLead> {
    const entity = this.leadRepo.create({
      leadCode: await this.generateLeadCode(),
      contactName: payload.contactName || payload.companyName || '未知联系人',
      companyName: payload.companyName || null,
      country: payload.country || source.defaultCountry || null,
      phone: payload.phone || null,
      email: payload.email || null,
      source: this.mapWebsiteTypeToLeadSource(source.websiteType),
      sourceDetail: payload.sourceDetail || source.name,
      inquiryContent: payload.inquiryContent || null,
      priority: (payload.priority as LeadPriority) || LeadPriority.NORMAL,
      // 自动分配逻辑：配置了固定用户则分配，否则入公海
      assignedTo: source.autoAssignEnabled && source.assignedToUserId ? source.assignedToUserId : null,
      assignedAt: source.autoAssignEnabled && source.assignedToUserId ? new Date() : null,
      createdBy: null, // Webhook 创建无创建人
      status: LeadStatus.NEW,
      website: payload.website || source.websiteUrl || null,
      websiteId: source.id,
      isInPool: !source.autoAssignEnabled || !source.assignedToUserId,
      poolReason: (!source.autoAssignEnabled || !source.assignedToUserId) ? 'auto_pool' : null,
      poolTime: (!source.autoAssignEnabled || !source.assignedToUserId) ? new Date() : null,
    } as any);

    const lead = await this.leadRepo.save(entity as unknown as CrmLead);

    // 更新来源统计
    await this.inquirySourceRepo.increment({ id: source.id }, 'totalInquiries', 1);
    await this.inquirySourceRepo.update({ id: source.id }, { lastInquiryAt: new Date() });

    return lead;
  }
}
