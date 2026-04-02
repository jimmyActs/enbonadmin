import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmQuotation, QuotationStatus } from './entities/crm-quotation.entity';
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

@Injectable()
export class CrmQuotationService {
  constructor(
    @InjectRepository(CrmQuotation)
    private readonly quotationRepo: Repository<CrmQuotation>,
    @InjectRepository(CrmSalesTarget)
    private readonly targetRepo: Repository<CrmSalesTarget>,
    @InjectRepository(CrmCustomer)
    private readonly customerRepo: Repository<CrmCustomer>,
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
    const fields = ['quotationNumber', 'customerName', 'productName', 'quantity', 'unitPrice', 'totalAmount', 'status', 'quotationDate', 'validUntil', 'notes'] as const;
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
   * 1. 根据客户名查找客户，获取营收预估
   * 2. 同步到当期（月/季/年）销售目标的 achievedRevenue
   */
  private async syncRevenueOnQuotationAccepted(quotation: CrmQuotation): Promise<string | undefined> {
    const revenue = Number(quotation.totalAmount) || 0;
    if (revenue === 0) return undefined;

    // 按客户名找客户，获取负责人
    let salesId: number | undefined;
    const customer = await this.customerRepo.findOne({
      where: { companyName: quotation.customerName },
    });
    if (customer?.ownerId) {
      salesId = customer.ownerId;
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
}
