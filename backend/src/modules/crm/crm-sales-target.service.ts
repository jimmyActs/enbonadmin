import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmSalesTarget, TargetPeriod } from './entities/crm-sales-target.entity';

export interface SalesTargetListQuery {
  page?: number;
  pageSize?: number;
  period?: TargetPeriod;
  keyword?: string;
}

@Injectable()
export class CrmSalesTargetService {
  constructor(
    @InjectRepository(CrmSalesTarget)
    private readonly targetRepo: Repository<CrmSalesTarget>,
  ) {}

  private async generateTargetCode(): Promise<string> {
    const existing = await this.targetRepo
      .createQueryBuilder('t')
      .orderBy('t.id', 'DESC')
      .getOne();
    const nextId = (existing?.id || 0) + 1;
    return `TARGET-${nextId}`;
  }

  async findAll(userId: number, query: SalesTargetListQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 20;

    const qb = this.targetRepo.createQueryBuilder('t');

    if (query.period) {
      qb.andWhere('t.period = :period', { period: query.period });
    }

    if (query.keyword?.trim()) {
      const kw = `%${query.keyword.trim()}%`;
      qb.andWhere('(t.title LIKE :kw OR t.targetCode LIKE :kw)', { kw });
    }

    qb.orderBy('t.createdAt', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async findOne(id: number): Promise<CrmSalesTarget> {
    const r = await this.targetRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('销售目标不存在');
    return r;
  }

  async create(userId: number, dto: {
    period?: TargetPeriod;
    date?: string;
    targetAmount?: number;
    actualAmount?: number;
    targetCustomers?: number;
    actualCustomers?: number;
    targetRevenue?: number;
    achievedRevenue?: number;
    description?: string;
  }): Promise<CrmSalesTarget> {
    const period = dto.period ?? TargetPeriod.MONTHLY;
    const dateStr = dto.date ?? '';
    const [yearStr, monthPart] = dateStr.includes('-') ? dateStr.split('-') : [String(new Date().getFullYear()), '01'];
    const year = parseInt(yearStr) || new Date().getFullYear();

    let periodMonth: number | null = null;
    let periodQuarter: number | null = null;
    if (period === TargetPeriod.MONTHLY) {
      periodMonth = parseInt(monthPart) || new Date().getMonth() + 1;
      periodQuarter = Math.ceil(periodMonth / 3);
    } else if (period === TargetPeriod.QUARTERLY) {
      periodQuarter = parseInt(monthPart.replace('Q', '')) || Math.ceil((new Date().getMonth() + 1) / 3);
    }

    let title = '';
    if (period === TargetPeriod.MONTHLY) {
      title = `${year}年${periodMonth}月销售目标`;
    } else if (period === TargetPeriod.QUARTERLY) {
      title = `${year}年Q${periodQuarter}季度销售目标`;
    } else {
      title = `${year}年度销售目标`;
    }

    const targetAmount = dto.targetAmount ?? 0;
    const actualAmount = dto.actualAmount ?? 0;
    const completionRate = targetAmount > 0 ? Math.round((actualAmount / targetAmount) * 100) : 0;

    const entity = this.targetRepo.create({
      targetCode: await this.generateTargetCode(),
      title,
      period,
      year,
      month: periodMonth,
      quarter: periodQuarter,
      targetAmount,
      actualAmount,
      targetRevenue: dto.targetRevenue ?? 0,
      achievedRevenue: dto.achievedRevenue ?? 0,
      completionRate,
      status: 'draft' as any,
      createdBy: userId,
      notes: dto.description ?? null,
    } as any);
    return this.targetRepo.save(entity) as unknown as Promise<CrmSalesTarget>;
  }

  async update(id: number, dto: {
    period?: TargetPeriod;
    date?: string;
    targetAmount?: number;
    actualAmount?: number;
    targetCustomers?: number;
    actualCustomers?: number;
    targetRevenue?: number;
    achievedRevenue?: number;
    description?: string;
  }): Promise<CrmSalesTarget> {
    const r = await this.targetRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('销售目标不存在');

    const fields = ['period', 'targetAmount', 'actualAmount', 'targetRevenue', 'achievedRevenue'] as const;
    for (const field of fields) {
      if ((dto as any)[field] !== undefined) {
        (r as any)[field] = (dto as any)[field];
      }
    }

    if (dto.actualAmount !== undefined || dto.targetAmount !== undefined) {
      const actualAmount = dto.actualAmount ?? (r as any).actualAmount;
      const targetAmount = dto.targetAmount ?? (r as any).targetAmount;
      (r as any).completionRate = targetAmount > 0 ? Math.round((actualAmount / targetAmount) * 100) : 0;
    }

    if (dto.description !== undefined) {
      (r as any).notes = dto.description;
    }

    return this.targetRepo.save(r) as unknown as Promise<CrmSalesTarget>;
  }

  async delete(id: number): Promise<void> {
    const r = await this.targetRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('销售目标不存在');
    await this.targetRepo.remove(r);
  }
}
