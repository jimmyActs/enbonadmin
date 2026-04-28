import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmQuotation, QuotationStatus } from './entities/crm-quotation.entity';
import { CrmQuotationTrack, QuotationTrackType } from './entities/crm-quotation-track.entity';
import { CrmQuotationVersion } from './entities/crm-quotation-version.entity';
import { CrmSalesTarget, TargetPeriod } from './entities/crm-sales-target.entity';
import { CrmCustomer } from './crm-customer.entity';

export interface QuotationListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: QuotationStatus;
}

export interface QuotationUpdateDto {
  quotationNumber?: string;
  customerId?: number | null;
  customerName?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  status?: QuotationStatus;
  quotationDate?: string;
  validUntil?: string;
  notes?: string;
}

export interface QuotationCreateDto {
  quotationNumber?: string;
  customerId?: number | null;
  customerName: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  status?: QuotationStatus;
  quotationDate?: string;
  validUntil?: string;
  notes?: string;
}

export interface CreateTrackDto {
  trackType: QuotationTrackType;
  title?: string;
  description?: string;
  fromStatus?: string;
  toStatus?: string;
  attachments?: string[];
  extraData?: Record<string, any>;
}

@Injectable()
export class CrmQuotationService {
  constructor(
    @InjectRepository(CrmQuotation)
    private readonly quotationRepo: Repository<CrmQuotation>,
    @InjectRepository(CrmSalesTarget)
    private readonly targetRepo: Repository<CrmSalesTarget>,
    @InjectRepository(CrmCustomer)
    private readonly customerRepo: Repository<CrmCustomer>,
    @InjectRepository(CrmQuotationTrack)
    private readonly trackRepo: Repository<CrmQuotationTrack>,
    @InjectRepository(CrmQuotationVersion)
    private readonly versionRepo: Repository<CrmQuotationVersion>,
  ) {}

  private async generateQuotationNumber(): Promise<string> {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const prefix = `QT-${y}${m}${d}-`;

    const existing = await this.quotationRepo
      .createQueryBuilder('q')
      .where('q.quotationNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('q.quotationNumber', 'DESC')
      .getOne();

    let nextSeq = 1;
    if (existing?.quotationNumber) {
      const lastSeq = parseInt(existing.quotationNumber.replace(prefix, ''), 10);
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }

    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  async findAll(query: QuotationListQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 20;

    const qb = this.quotationRepo.createQueryBuilder('q');

    if (query.keyword?.trim()) {
      const kw = `%${query.keyword.trim()}%`;
      qb.andWhere(
        '(q.quotationNumber LIKE :kw OR q.customerName LIKE :kw OR q.productName LIKE :kw)',
        { kw },
      );
    }

    if (query.status) {
      qb.andWhere('q.status = :status', { status: query.status });
    }

    qb.orderBy('q.createdAt', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async findOne(id: number): Promise<CrmQuotation> {
    const r = await this.quotationRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('报价单不存在');
    return r;
  }

  async create(userId: number, dto: QuotationCreateDto): Promise<CrmQuotation> {
    const entity = this.quotationRepo.create({
      quotationNumber: dto.quotationNumber ?? await this.generateQuotationNumber(),
      customerId: dto.customerId ?? null,
      customerName: dto.customerName,
      productName: dto.productName ?? null,
      quantity: dto.quantity ?? 1,
      unitPrice: dto.unitPrice ?? 0,
      totalAmount: dto.totalAmount ?? ((dto.quantity ?? 1) * (dto.unitPrice ?? 0)),
      status: dto.status ?? 'draft',
      quotationDate: dto.quotationDate ?? new Date().toISOString().split('T')[0],
      validUntil: dto.validUntil ?? null,
      notes: dto.notes ?? null,
      createdBy: userId,
    } as any);
    return this.quotationRepo.save(entity) as unknown as Promise<CrmQuotation>;
  }

  async update(id: number, dto: QuotationUpdateDto, userId?: number): Promise<{ quotation: CrmQuotation; message?: string }> {
    const r = await this.quotationRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('报价单不存在');

    const oldStatus = r.status;
    const fields = ['quotationNumber', 'customerId', 'customerName', 'productName', 'quantity', 'unitPrice', 'totalAmount', 'status', 'quotationDate', 'validUntil', 'notes'] as const;
    for (const field of fields) {
      if ((dto as any)[field] !== undefined) {
        (r as any)[field] = (dto as any)[field];
      }
    }

    // ========== 联动：报价单接受后，同步营收到当期销售目标 ==========
    let message: string | undefined;
    if (dto.status === 'accepted' && oldStatus !== 'accepted') {
      const syncResult = await this.syncRevenueOnQuotationAccepted(r);
      if (syncResult) {
        message = syncResult;
      }
    }

    const quotation = await this.quotationRepo.save(r) as unknown as CrmQuotation;
    return { quotation, message };
  }

  /**
   * 报价单接受后：
   * 1. 优先通过 customerId 外键查找客户，获取负责人
   * 2. 若无 customerId 则按客户名模糊匹配（兼容旧数据）
   * 3. 同步到当期（月/季/年）销售目标的 achievedRevenue
   * 4. 将客户 dealStatus 更新为 'quoted'（已报价）
   */
  private async syncRevenueOnQuotationAccepted(quotation: CrmQuotation): Promise<string | undefined> {
    const revenue = Number(quotation.totalAmount) || 0;
    const customerId = quotation.customerId
      ? quotation.customerId
      : (await this.customerRepo.findOne({ where: { companyName: quotation.customerName } }))?.id;

    // 找到客户后更新成交状态
    if (customerId) {
      await this.customerRepo.update(customerId, { dealStatus: 'quoted' as any });
    }

    if (revenue === 0) return undefined;

    // 优先用外键 customerId 查找
    let salesId: number | undefined;
    if (quotation.customerId) {
      const customer = await this.customerRepo.findOne({ where: { id: quotation.customerId } });
      if (customer?.ownerId) {
        salesId = customer.ownerId;
      }
    }

    // 兜底：按客户名称匹配（兼容旧数据或未填 customerId 的报价单）
    if (!salesId) {
      const customer = await this.customerRepo.findOne({
        where: { companyName: quotation.customerName },
      });
      if (customer?.ownerId) {
        salesId = customer.ownerId;
      }
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);

    const targets = await this.targetRepo.find({
      where: { salesId: salesId ?? 0 },
      order: { createdAt: 'ASC' },
    });

    const activeTarget = targets.find(t => {
      if (t.year !== year) return false;
      if (t.period === TargetPeriod.MONTHLY && t.month === month) return true;
      if (t.period === TargetPeriod.QUARTERLY && t.quarter === quarter) return true;
      if (t.period === TargetPeriod.YEARLY) return true;
      return false;
    });

    if (activeTarget) {
      activeTarget.achievedRevenue = Number(activeTarget.achievedRevenue) + revenue;
      activeTarget.completionRate = activeTarget.targetRevenue > 0
        ? Math.min(100, Math.round((activeTarget.achievedRevenue / activeTarget.targetRevenue) * 10000) / 100)
        : 0;
      await this.targetRepo.save(activeTarget as any);
      return `已同步营收 ¥${revenue.toLocaleString()} 到「${activeTarget.title}」，当前完成率 ${activeTarget.completionRate}%`;
    }

    return undefined;
  }

  async delete(id: number): Promise<void> {
    const r = await this.quotationRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('报价单不存在');
    await this.quotationRepo.remove(r);
  }

  // ==================== 报价进展跟踪 ====================

  /**
   * 获取报价单的所有进展记录
   */
  async getTracks(quotationId: number): Promise<CrmQuotationTrack[]> {
    const quotation = await this.quotationRepo.findOne({ where: { id: quotationId } });
    if (!quotation) throw new NotFoundException('报价单不存在');

    return this.trackRepo.find({
      where: { quotationId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 添加进展记录
   */
  async addTrack(
    quotationId: number,
    operatorId: number,
    dto: CreateTrackDto,
  ): Promise<CrmQuotationTrack> {
    const quotation = await this.quotationRepo.findOne({ where: { id: quotationId } });
    if (!quotation) throw new NotFoundException('报价单不存在');

    const entity = this.trackRepo.create({
      quotationId,
      trackType: dto.trackType,
      title: dto.title ?? undefined,
      description: dto.description ?? undefined,
      fromStatus: dto.fromStatus ?? undefined,
      toStatus: dto.toStatus ?? undefined,
      attachments: dto.attachments ?? undefined,
      operatorId,
      extraData: dto.extraData ?? undefined,
    } as any);

    return this.trackRepo.save(entity) as any;
  }

  /**
   * 获取报价单的所有版本历史
   */
  async getVersions(quotationId: number): Promise<CrmQuotationVersion[]> {
    const quotation = await this.quotationRepo.findOne({ where: { id: quotationId } });
    if (!quotation) throw new NotFoundException('报价单不存在');

    return this.versionRepo.find({
      where: { quotationId },
      order: { version: 'DESC' },
    });
  }

  /**
   * 创建新版本（修订报价单）
   */
  async createVersion(
    quotationId: number,
    createdBy: number,
    changeSummary?: string,
  ): Promise<CrmQuotationVersion> {
    const quotation = await this.quotationRepo.findOne({ where: { id: quotationId } });
    if (!quotation) throw new NotFoundException('报价单不存在');

    // 获取当前最大版本号
    const latestVersion = await this.versionRepo.findOne({
      where: { quotationId },
      order: { version: 'DESC' },
    });
    const nextVersion = (latestVersion?.version ?? 0) + 1;

    // 快照当前报价单数据
    const snapshot = {
      quotationNumber: quotation.quotationNumber,
      customerName: quotation.customerName,
      productName: quotation.productName,
      quantity: quotation.quantity,
      unitPrice: quotation.unitPrice,
      totalAmount: quotation.totalAmount,
      status: quotation.status,
      quotationDate: quotation.quotationDate,
      validUntil: quotation.validUntil,
      notes: quotation.notes,
    };

    const entity = this.versionRepo.create({
      quotationId,
      version: nextVersion,
      snapshot,
      changeSummary: changeSummary ?? undefined,
      createdBy,
    } as any);

    return this.versionRepo.save(entity) as any;
  }

  /**
   * 记录状态变更（辅助方法）
   */
  async recordStatusChange(
    quotationId: number,
    operatorId: number,
    fromStatus: string,
    toStatus: string,
    description?: string,
  ): Promise<CrmQuotationTrack> {
    return this.addTrack(quotationId, operatorId, {
      trackType: 'STATUS_CHANGE',
      title: `状态变更：${fromStatus} → ${toStatus}`,
      description: description ?? undefined,
      fromStatus,
      toStatus,
    });
  }
}
