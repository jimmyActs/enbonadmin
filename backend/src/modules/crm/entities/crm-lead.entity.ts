import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 商机来源枚举
 */
export enum LeadSource {
  OFFICIAL_WEBSITE = 'official_website',   // 官网询盘
  EXHIBITION = 'exhibition',             // 展会
  REFERRAL = 'referral',                  // 朋友推荐
  SOCIAL_MEDIA = 'social_media',          // 社媒询盘（LinkedIn/Facebook/Instagram）
  COLD_CALL = 'cold_call',               // 电话开拓
  WEBSITE = 'website',                    // 其他网站询盘
  PARTNER = 'partner',                    // 合作伙伴介绍
  OTHER = 'other',                        // 其他
}

/**
 * 商机状态枚举
 */
export enum LeadStatus {
  NEW = 'new',            // 新建
  QUALIFIED = 'qualified', // 已筛选（可跟进）
  CONTACTED = 'contacted', // 已联系
  PROPOSAL = 'proposal',   // 已报价/方案
  NEGOTIATING = 'negotiating', // 谈判中
  WON = 'won',             // 已成交
  LOST = 'lost',           // 已流失
  CONVERTED = 'converted', // 已转为客户
  INVALID = 'invalid',    // 无效线索
}

/**
 * 商机紧急程度
 */
export enum LeadPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('crm_leads')
export class CrmLead {
  @PrimaryGeneratedColumn()
  id: number;

  // ========== 基础信息 ==========
  @Column()
  leadCode: string; // 商机编码（系统生成）

  @Column()
  contactName: string; // 联系人姓名

  @Column({ nullable: true })
  companyName: string; // 公司名称

  @Column({ nullable: true })
  country: string; // 国家/地区

  @Column({ nullable: true })
  phone: string; // 联系电话

  @Column({ nullable: true })
  email: string; // 联系邮箱

  // ========== 商机详情 ==========
  @Column({
    type: 'simple-enum',
    enum: LeadSource,
    default: LeadSource.OFFICIAL_WEBSITE,
  })
  source: LeadSource; // 来源渠道

  @Column({ nullable: true })
  sourceDetail: string; // 来源详情（如具体网站名称、展会名称）

  @Column({ type: 'text', nullable: true })
  inquiryContent: string; // 询盘内容

  @Column({
    type: 'simple-enum',
    enum: LeadPriority,
    default: LeadPriority.NORMAL,
  })
  priority: LeadPriority; // 紧急程度

  // ========== 分配信息 ==========
  @Column({ type: 'integer', nullable: true })
  assignedTo: number | null; // 被分配给哪个销售（负责人）

  @Column({ type: 'datetime', nullable: true })
  assignedAt: Date; // 分配时间

  @Column({ type: 'integer', nullable: true })
  createdBy: number | null; // 创建人（可能是管理员录入）

  // ========== 状态 ==========
  @Column({
    type: 'simple-enum',
    enum: LeadStatus,
    default: LeadStatus.NEW,
  })
  status: LeadStatus;

  // ========== 转化信息 ==========
  @Column({ type: 'integer', nullable: true })
  convertedCustomerId: number | null; // 转化成的客户ID

  @Column({ type: 'datetime', nullable: true })
  convertedAt: Date; // 转化时间

  @Column({ type: 'text', nullable: true })
  lostReason: string; // 流失原因

  @Column({ type: 'datetime', nullable: true })
  lostAt: Date; // 流失时间

  // ========== 跟进记录（JSON 存摘要，详细在活动记录表） ==========
  @Column({ type: 'datetime', nullable: true })
  lastFollowUpAt: Date; // 最近跟进时间

  @Column({ type: 'text', nullable: true })
  notes: string; // 备注

  // ========== 关联网站 ==========
  @Column({ nullable: true })
  website: string; // 来源网站 URL

  @Column({ nullable: true })
  websiteId: number; // 来源网站配置ID

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
