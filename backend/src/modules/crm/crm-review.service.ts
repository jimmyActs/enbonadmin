import { Injectable, NotFoundException, ForbiddenException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmReview, ReviewPeriod } from './entities/crm-review.entity';
import { CrmSalesTarget, TargetPeriod } from './entities/crm-sales-target.entity';

export interface ReviewListQuery {
  page?: number;
  pageSize?: number;
  period?: ReviewPeriod;
  keyword?: string;
}

export interface CreateReviewDto {
  period: ReviewPeriod;
  date: string;
  summary: string;
  achievements?: string;
  challenges?: string;
  improvements?: string;
}

export interface UpdateReviewDto {
  period?: ReviewPeriod;
  date?: string;
  summary?: string;
  achievements?: string;
  challenges?: string;
  improvements?: string;
}

export interface SyncResult {
  targetId: number;
  targetTitle: string;
  achievedAmount: number;
  achievedRevenue: number;
  completionRate: number;
}

@Injectable()
export class CrmReviewService {
  constructor(
    @InjectRepository(CrmReview)
    private readonly reviewRepo: Repository<CrmReview>,
    @InjectRepository(CrmSalesTarget)
    private readonly targetRepo: Repository<CrmSalesTarget>,
  ) {}

  async findAll(userId: number, query: ReviewListQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 20;

    const qb = this.reviewRepo.createQueryBuilder('r');

    if (query.period) {
      qb.andWhere('r.period = :period', { period: query.period });
    }

    if (query.keyword?.trim()) {
      const kw = `%${query.keyword.trim()}%`;
      qb.andWhere(
        '(r.summary LIKE :kw OR r.achievements LIKE :kw OR r.challenges LIKE :kw OR r.improvements LIKE :kw)',
        { kw },
      );
    }

    qb.orderBy('r.date', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async findOne(id: number, user?: any): Promise<CrmReview> {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('复盘记录不存在');
    if (user) {
      const isAdmin = user.role === 'super_admin' || user.role === 'department_head';
      if (!isAdmin && r.createdBy !== user.id) {
        throw new ForbiddenException('您没有权限查看此复盘记录');
      }
    }
    return r;
  }

  /**
   * 创建复盘并自动联动目标完成率
   * 返回复盘记录 + 目标联动结果（如有）
   */
  async create(
    userId: number,
    dto: CreateReviewDto,
  ): Promise<{ review: CrmReview; syncResult?: SyncResult }> {
    const entity = this.reviewRepo.create({
      ...dto,
      createdBy: userId,
    } as any);
    const review = await this.reviewRepo.save(entity) as unknown as CrmReview;

    // ========== 联动：自动更新目标完成率 ==========
    const syncResult = await this.syncTargetOnReview(userId, dto);

    return { review, syncResult };
  }

  async update(id: number, dto: UpdateReviewDto, user?: any): Promise<CrmReview> {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('复盘记录不存在');
    if (user) {
      const isAdmin = user.role === 'super_admin' || user.role === 'department_head';
      if (!isAdmin && r.createdBy !== user.id) {
        throw new ForbiddenException('您没有权限修改此复盘记录');
      }
    }

    const fields = ['period', 'date', 'summary', 'achievements', 'challenges', 'improvements'] as const;
    for (const field of fields) {
      if ((dto as any)[field] !== undefined) {
        (r as any)[field] = (dto as any)[field];
      }
    }
    return this.reviewRepo.save(r) as unknown as CrmReview;
  }

  async delete(id: number, user?: any): Promise<void> {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('复盘记录不存在');
    if (user) {
      const isAdmin = user.role === 'super_admin' || user.role === 'department_head';
      if (!isAdmin && r.createdBy !== user.id) {
        throw new ForbiddenException('您没有权限删除此复盘记录');
      }
    }
    await this.reviewRepo.remove(r);
  }

  /**
   * 复盘提交后，自动更新当期销售目标
   * 规则：
   * - 月度复盘：找到当年当月目标，achievedAmount++，achievedRevenue += 评估营收
   * - 季度复盘：找到当年当季度目标
   * - 年度复盘：找到当年年度目标
   */
  private async syncTargetOnReview(
    userId: number,
    dto: CreateReviewDto,
  ): Promise<SyncResult | undefined> {
    const { period, date, achievements } = dto;

    // 从 achievements 提取数字（格式如 "+5" 或 "5 个新客户"）
    const revenueMatch = achievements?.match(/[\+\-]?\d+(?:\.\d+)?/);
    const revenueIncrement = revenueMatch ? parseFloat(revenueMatch[0]) : 0;

    const { year, month, quarter } = this.parseReviewPeriod(period, date);

    // 找该销售最近一个匹配的当期目标
    const targets = await this.targetRepo.find({
      where: { salesId: userId },
      order: { createdAt: 'ASC' },
    });

    const matchedTarget = targets.find(t => {
      if (t.year !== year) return false;
      if (period === ReviewPeriod.MONTHLY && t.period === TargetPeriod.MONTHLY && t.month === month) return true;
      if (period === ReviewPeriod.QUARTERLY && t.period === TargetPeriod.QUARTERLY && t.quarter === quarter) return true;
      if (period === ReviewPeriod.YEARLY && t.period === TargetPeriod.YEARLY) return true;
      return false;
    });

    if (!matchedTarget) return undefined;

    matchedTarget.achievedAmount += 1;
    matchedTarget.achievedRevenue = Number(matchedTarget.achievedRevenue) + revenueIncrement;
    matchedTarget.completionRate = matchedTarget.targetAmount > 0
      ? Math.min(100, Math.round((matchedTarget.achievedAmount / matchedTarget.targetAmount) * 10000) / 100)
      : 0;

    await this.targetRepo.save(matchedTarget as any);

    return {
      targetId: matchedTarget.id,
      targetTitle: matchedTarget.title,
      achievedAmount: matchedTarget.achievedAmount,
      achievedRevenue: matchedTarget.achievedRevenue,
      completionRate: matchedTarget.completionRate,
    };
  }

  private parseReviewPeriod(period: ReviewPeriod, date: string): { year: number; month: number; quarter: number } {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let quarter = Math.ceil(month / 3);

    if (date) {
      if (period === ReviewPeriod.MONTHLY && /^\d{4}-\d{2}$/.test(date)) {
        const [y, m] = date.split('-');
        year = parseInt(y);
        month = parseInt(m);
        quarter = Math.ceil(month / 3);
      } else if (period === ReviewPeriod.QUARTERLY && /^\d{4}-Q\d$/.test(date)) {
        const [y, q] = date.split('-Q');
        year = parseInt(y);
        quarter = parseInt(q);
        month = quarter * 3;
      } else if (period === ReviewPeriod.YEARLY && /^\d{4}$/.test(date)) {
        year = parseInt(date);
        month = 12;
        quarter = 4;
      }
    }

    return { year, month, quarter };
  }
}
