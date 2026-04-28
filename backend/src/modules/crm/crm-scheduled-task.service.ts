import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CrmSalesTarget, TargetPeriod } from './entities/crm-sales-target.entity';
import { CrmCustomer } from './crm-customer.entity';
import { CrmLead, LeadStatus } from './entities/crm-lead.entity';
import { AnnouncementType } from '../announcements/entities/announcement.entity';
import { CrmService } from './crm.service';

export interface MonthlyReport {
  year: number;
  month: number;
  generatedAt: string;
  targets: {
    salesId: number;
    salesName: string;
    period: string;
    targetAmount: number;
    achievedAmount: number;
    targetRevenue: number;
    achievedRevenue: number;
    completionRate: number;
    status: string;
  }[];
  summary: {
    totalSales: number;
    totalTargets: number;
    achievedTargets: number;
    overallCompletionRate: number;
  };
}

@Injectable()
export class CrmScheduledTaskService {
  constructor(
    @InjectRepository(CrmSalesTarget)
    private readonly targetRepo: Repository<CrmSalesTarget>,
    @InjectRepository(CrmCustomer)
    private readonly customerRepo: Repository<CrmCustomer>,
    @InjectRepository(CrmLead)
    private readonly leadRepo: Repository<CrmLead>,
    @Inject(forwardRef(() => CrmService))
    private readonly crmService: CrmService,
    private readonly dataSource: DataSource,
  ) {}

  // ==================== 每月末自动汇总报告 ====================

  /**
   * 每月最后一天 23:50 自动执行
   * 汇总当月所有销售的目标完成情况，生成报告并发布公告
   */
  @Cron('50 23 * * *')
  async generateMonthlySalesReport() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 当月

    // 检查是否为本月最后一天
    const tomorrow = new Date(year, month, 1);
    if (now.getDate() !== new Date(tomorrow.getTime() - 86400000).getDate()) {
      return; // 非月末不执行
    }

    const report = await this.buildMonthlyReport(year, month);

    if (report.summary.totalTargets === 0) return;

    // 发布公告（直接插入数据库，避免循环依赖）
    await this.dataSource.query(`
      INSERT INTO announcements (createdById, title, content, type, createdAt, updatedAt)
      VALUES (1, $1, $2, $3, NOW(), NOW())
    `, [`${year}年${month}月销售目标完成情况报告`, this.formatReportContent(report), AnnouncementType.ANNOUNCEMENT]);
  }

  /**
   * 手动触发月度报告（管理员接口调用）
   */
  async generateReportManually(year: number, month: number): Promise<MonthlyReport> {
    return this.buildMonthlyReport(year, month);
  }

  private async buildMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    // 查询当月所有月度目标
    const targets = await this.targetRepo.find({
      where: { year, month, period: TargetPeriod.MONTHLY },
      order: { completionRate: 'DESC' },
    });

    const targetResults = targets.map(t => ({
      salesId: t.salesId,
      salesName: t.salesName || '未知',
      period: `${year}年${month}月`,
      targetAmount: t.targetAmount,
      achievedAmount: t.achievedAmount,
      targetRevenue: Number(t.targetRevenue),
      achievedRevenue: Number(t.achievedRevenue),
      completionRate: t.completionRate,
      status: t.status,
    }));

    const totalTargets = targetResults.length;
    const achievedTargets = targetResults.filter(t => t.completionRate >= 100).length;
    const overallCompletionRate = totalTargets > 0
      ? Math.round(targetResults.reduce((sum, t) => sum + t.completionRate, 0) / totalTargets)
      : 0;

    return {
      year,
      month,
      generatedAt: new Date().toISOString(),
      targets: targetResults,
      summary: {
        totalSales: new Set(targetResults.map(t => t.salesId)).size,
        totalTargets,
        achievedTargets,
        overallCompletionRate,
      },
    };
  }

  private formatReportContent(report: MonthlyReport): string {
    const lines = [
      `# ${report.year}年${report.month}月 销售目标完成情况`,
      '',
      `生成时间：${new Date(report.generatedAt).toLocaleString('zh-CN')}`,
      '',
      '## 汇总',
      `- 参与销售人数：${report.summary.totalSales}`,
      `- 目标总数：${report.summary.totalTargets}`,
      `- 达标数量（完成率≥100%）：${report.summary.achievedTargets}`,
      `- 整体完成率：${report.summary.overallCompletionRate}%`,
      '',
      '## 各销售目标详情',
      '| 销售 | 目标数 | 达成数 | 目标营收 | 实际营收 | 完成率 | 状态 |',
      '|---|---|---|---|---|---|---|',
    ];

    for (const t of report.targets) {
      const statusEmoji = t.completionRate >= 100 ? '✅' : t.completionRate >= 80 ? '⚠️' : '❌';
      lines.push(
        `| ${t.salesName} | ${t.targetAmount} | ${t.achievedAmount} | ` +
        `${t.targetRevenue.toLocaleString()} | ${t.achievedRevenue.toLocaleString()} | ` +
        `${t.completionRate}% | ${statusEmoji} |`,
      );
    }

    lines.push('', '---', '*本报告由系统自动生成*');
    return lines.join('\n');
  }

  // ==================== 自动公海释放 ====================

  /**
   * 每天凌晨 2:00 执行
   * 将 30 天未维护的客户自动释放到公海
   */
  @Cron('0 2 * * *')
  async autoReleaseStaleCustomers() {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 30);

    const result = await this.customerRepo
      .createQueryBuilder('c')
      .andWhere('c.isInPool = :isInPool', { isInPool: false })
      .andWhere('c.ownerId IS NOT NULL')
      .andWhere('(c.lastMaintainAt IS NULL OR c.lastMaintainAt < :threshold)', { threshold })
      .andWhere('c.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['closed', 'lost'],
      })
      .update(CrmCustomer)
      .set({
        isInPool: true,
        poolReason: 'no_activity_30_days' as any,
        poolTime: new Date(),
        ownerId: null as any,
      })
      .execute();

    if ((result.affected || 0) > 0) {
      console.log(`[CRM定时任务] 自动释放 ${result.affected} 个客户到公海`);
    }
  }

  /**
   * 每天凌晨 3:00 执行
   * 将 7 天以上未跟进的商机自动释放到公海
   */
  @Cron('0 3 * * *')
  async autoReleaseStaleLeads() {
    const count = await this.crmService.autoReleaseLeadsToPool(7);
    if (count > 0) {
      console.log(`[CRM定时任务] 自动释放 ${count} 个商机到公海`);
    }
  }

  // ==================== 商机状态同步（待联系商机超时提醒）====================

  /**
   * 每周一 9:00 统计长期未跟进的商机
   * 将 7 天以上未跟进的商机标记，提示负责人跟进
   */
  @Cron('0 9 * * 1')
  async checkStaleLeads() {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 7);

    const staleLeads = await this.leadRepo
      .createQueryBuilder('l')
      .andWhere('l.status IN (:...statuses)', {
        statuses: [LeadStatus.NEW, LeadStatus.QUALIFIED, LeadStatus.CONTACTED],
      })
      .andWhere('(l.lastFollowUpAt IS NULL OR l.lastFollowUpAt < :threshold)', { threshold })
      .leftJoinAndSelect('l.assignedTo', 'owner')
      .getMany();

    if (staleLeads.length === 0) return;

    // 按负责人分组
    const byOwner: Record<number, CrmLead[]> = {};
    for (const lead of staleLeads) {
      const ownerId = lead.assignedTo || 0;
      if (!byOwner[ownerId]) byOwner[ownerId] = [];
      byOwner[ownerId].push(lead);
    }

    // 为每个负责人创建提醒公告（直接插入数据库，避免循环依赖）
    for (const [ownerId, leads] of Object.entries(byOwner)) {
      if (Number(ownerId) === 0) continue;
      try {
        await this.dataSource.query(`
          INSERT INTO announcements (createdById, title, content, type, createdAt, updatedAt)
          VALUES (1, $1, $2, $3, NOW(), NOW())
        `, [
          `您有 ${leads.length} 个商机需要跟进`,
          `以下商机已超过 7 天未跟进，请及时处理：\n\n` +
            leads.slice(0, 10).map((l, i) =>
              `${i + 1}. [${l.leadCode}] ${l.contactName || ''} ${l.companyName || ''} - ${l.status}`
            ).join('\n') +
            (leads.length > 10 ? `\n\n...还有 ${leads.length - 10} 个` : ''),
          AnnouncementType.NOTICE,
        ]);
      } catch { /* skip */ }
    }
  }

  // ==================== 出货转化进度：按月统计出货金额 ====================

  /**
   * 出货文件上传后调用此方法，同步商机转化进度
   * 将出货关联的客户营收累加到当期销售目标
   */
  async syncRevenueOnShipment(customerId: number, shipmentRevenue: number, salesId?: number) {
    if (!salesId) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);

    const targets = await this.targetRepo.find({
      where: { salesId },
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
      activeTarget.achievedRevenue = Number(activeTarget.achievedRevenue) + shipmentRevenue;
      activeTarget.completionRate = activeTarget.targetRevenue > 0
        ? Math.min(100, Math.round((activeTarget.achievedRevenue / activeTarget.targetRevenue) * 10000) / 100)
        : 0;
      await this.targetRepo.save(activeTarget as any);
    }
  }
}
