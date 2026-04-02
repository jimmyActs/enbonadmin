import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 网站类型枚举
 */
export enum WebsiteType {
  OFFICIAL = 'official',       // 官网
  B2B_PORTAL = 'b2b_portal',  // B2B 平台
  ALIBABA = 'alibaba',         // 阿里国际站
  MADE_IN_CHINA = 'made_in_china', // 中国制造网
  FACEBOOK = 'facebook',       // Facebook 主页/广告
  LINKEDIN = 'linkedin',       // LinkedIn
  INSTAGRAM = 'instagram',     // Instagram
  OTHER = 'other',             // 其他
}

/**
 * 询盘来源网站配置实体
 * 用于配置各运营网站的询盘接入和自动分配规则
 */
@Entity('crm_inquiry_sources')
export class CrmInquirySource {
  @PrimaryGeneratedColumn()
  id: number;

  // ========== 网站基本信息 ==========
  @Column()
  name: string; // 网站名称（如 "ENBON 官网"）

  @Column({
    type: 'simple-enum',
    enum: WebsiteType,
    default: WebsiteType.OFFICIAL,
  })
  websiteType: WebsiteType;

  @Column({ nullable: true })
  websiteUrl: string; // 网站 URL

  @Column({ nullable: true })
  logo: string; // 网站 Logo URL

  // ========== 接入配置 ==========
  @Column({ nullable: true })
  apiEndpoint: string; // API 接入端点（用于拉取询盘）

  @Column({ nullable: true })
  apiKey: string; // API 密钥（加密存储）

  @Column({ nullable: true })
  webhookUrl: string; // Webhook 回调地址（用于接收实时询盘推送）

  @Column({ nullable: true })
  webhookSecret: string; // Webhook 签名密钥

  @Column({ default: true })
  isActive: boolean; // 是否启用

  @Column({ default: false })
  autoFetch: boolean; // 是否自动定时拉取询盘

  @Column({ nullable: true })
  fetchIntervalMinutes: number; // 自动拉取间隔（分钟）

  // ========== 自动分配规则 ==========
  @Column({ nullable: true })
  defaultCountry: string; // 默认负责国家

  @Column({ nullable: true })
  assignedDepartment: string; // 分配部门（如 "销售部-日本组"）

  @Column({ nullable: true })
  assignedToUserId: number; // 固定分配给哪个用户

  @Column({ nullable: true })
  autoAssignEnabled: boolean; // 是否启用自动分配规则

  // ========== 统计 ==========
  @Column({ type: 'integer', default: 0 })
  totalInquiries: number; // 累计询盘数

  @Column({ type: 'integer', default: 0 })
  pendingInquiries: number; // 待处理询盘数

  @Column({ type: 'datetime', nullable: true })
  lastFetchAt: Date; // 最近一次拉取时间

  @Column({ type: 'datetime', nullable: true })
  lastInquiryAt: Date; // 最新一条询盘时间

  // ========== 备注 ==========
  @Column({ type: 'text', nullable: true })
  notes: string; // 备注

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
