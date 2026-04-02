import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 目标周期类型
 */
export enum TargetPeriod {
  MONTHLY = 'monthly',   // 月度目标
  QUARTERLY = 'quarterly', // 季度目标
  YEARLY = 'yearly',     // 年度目标
}

/**
 * 目标状态
 */
export enum TargetStatus {
  DRAFT = 'draft',     // 草稿（待提交）
  SUBMITTED = 'submitted', // 已提交（待主管确认）
  CONFIRMED = 'confirmed', // 已确认
  REJECTED = 'rejected',   // 已驳回
  ARCHIVED = 'archived',   // 已归档
}

/**
 * 销售目标实体
 * 用于设定和追踪各业务的销售目标完成情况
 */
@Entity('crm_sales_targets')
export class CrmSalesTarget {
  @PrimaryGeneratedColumn()
  id: number;

  // ========== 目标基本信息 ==========
  @Column()
  targetCode: string; // 目标编号（系统生成）

  @Column()
  title: string; // 目标名称/标题，如 "2026年Q1月度销售目标"

  @Column({ type: 'integer', nullable: true })
  salesId: number; // 销售用户ID

  @Column({ nullable: true })
  salesName: string; // 销售姓名（冗余存储便于展示）

  // ========== 目标周期 ==========
  @Column({
    type: 'simple-enum',
    enum: TargetPeriod,
    default: TargetPeriod.MONTHLY,
  })
  period: TargetPeriod;

  @Column({ type: 'integer' })
  year: number; // 年份，如 2026

  @Column({ type: 'integer', nullable: true })
  quarter: number; // 季度（1-4），月度目标时可为 null

  @Column({ type: 'integer', nullable: true })
  month: number; // 月份（1-12），季度/年度目标时可为 null

  // ========== 目标数值 ==========
  @Column({ type: 'integer' })
  targetAmount: number; // 目标数量（询盘数/客户数）

  @Column({ type: 'integer', default: 0 })
  achievedAmount: number; // 已完成数量

  @Column({ type: 'integer', default: 0 })
  targetCustomers: number; // 目标客户数

  @Column({ type: 'integer', default: 0 })
  actualCustomers: number; // 实际客户数

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  targetRevenue: number; // 目标营收金额

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  achievedRevenue: number; // 已完成营收金额

  // ========== 完成率 ==========
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionRate: number; // 完成率（%）

  // ========== 审核流程 ==========
  @Column({
    type: 'simple-enum',
    enum: TargetStatus,
    default: TargetStatus.DRAFT,
  })
  status: TargetStatus;

  @Column({ type: 'integer', nullable: true })
  reviewedBy: number; // 审核人（主管）ID

  @Column({ type: 'datetime', nullable: true })
  reviewedAt: Date; // 审核时间

  @Column({ type: 'text', nullable: true })
  reviewComment: string; // 审核意见

  @Column({ type: 'integer', nullable: true })
  createdBy: number; // 目标制定人

  // ========== 备注 ==========
  @Column({ type: 'text', nullable: true })
  notes: string; // 备注

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
