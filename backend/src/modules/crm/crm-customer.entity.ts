import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, VersionColumn, Index } from 'typeorm';

/**
 * 客户星级枚举
 */
export enum CustomerStar {
  ONE = 1,   // ⭐
  TWO = 2,   // ⭐⭐
  THREE = 3, // ⭐⭐⭐
  FOUR = 4,  // ⭐⭐⭐⭐
  FIVE = 5,  // ⭐⭐⭐⭐⭐
}

/**
 * 入公海原因枚举
 */
export enum PoolReason {
  NO_ACTIVITY_30_DAYS = 'no_activity_30_days',   // 30天无跟进
  OWNER_RESIGNED = 'owner_resigned',             // 负责人离职
  MANUAL_RELEASE = 'manual_release',             // 手动释放
  DUPLICATE_RELEASE = 'duplicate_release',       // 重复客户释放
  SUPERVISOR_RELEASE = 'supervisor_release',     // 主管释放
}

@Entity('crm_customers')
export class CrmCustomer {
  @PrimaryGeneratedColumn()
  id: number;

  // ========== 基础信息 ==========
  @Column({ unique: true })
  customerCode: string; // 客户编码（系统自动生成，如 CRM-20260330-001）

  @Column()
  customerName: string; // 客户名称（公司/联系人名）

  @Column({ nullable: true })
  companyName: string; // 公司全称（用于查重）

  @Column({ nullable: true })
  country: string; // 国家/地区

  @Column({ nullable: true })
  phone: string; // 联系电话

  @Column({ nullable: true })
  email: string; // 联系邮箱

  @Column({ nullable: true })
  website: string; // 公司网站

  @Column({ nullable: true })
  address: string; // 详细地址

  // ========== 社交媒体 ==========
  @Column({ nullable: true })
  linkedInUrl: string; // LinkedIn 链接

  @Column({ nullable: true })
  facebookUrl: string; // Facebook 链接

  @Column({ nullable: true })
  whatsapp: string; // WhatsApp 账号

  @Column({ nullable: true })
  instagramUrl: string; // Instagram 链接

  // ========== 询盘/需求信息 ==========
  @Column({ type: 'text', nullable: true })
  content: string | null; // 询盘/需求内容

  @Column({ nullable: true })
  inquirySource: string; // 询盘来源（官网后台导入/展会名片/社媒询盘/电话/朋友推荐等）

  @Column({ type: 'timestamp', nullable: true })
  inquiryDate: Date; // 询盘日期

  @Column({ type: 'text', nullable: true })
  communicationResult: string | null; // 沟通结果总结

  // ========== 销售状态 ==========
  @Column({
    type: 'text',
    default: 'new',
  })
  status: 'new' | 'contacting' | 'negotiating' | 'closed' | 'lost'; // 客户状态

  @Column({
    type: 'text',
    default: 'pending',
  })
  dealStatus: 'pending' | 'quoted' | 'ordered' | 'delivered' | 'completed'; // 成交状态

  // ========== 产品与营收 ==========
  @Column({ type: 'text', nullable: true })
  products: string | null; // 关注产品

  @Column({ type: 'text', nullable: true })
  shipment: string; // 发货情况（如年出货金额/频率）

  @Column({ default: false })
  afterSales: boolean; // 是否已有售后

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  estimatedRevenue: number; // 预估收入

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  actualRevenue: number; // 实际收入

  // ========== 客户属性 ==========
  @Column({ type: 'simple-enum', enum: CustomerStar, default: CustomerStar.THREE })
  starRating: CustomerStar; // 客户星级（1-5星）

  @Column({ type: 'text', nullable: true })
  tags: string; // 客户标签，JSON 数组序列化存储，如 ["重点客户", "高意向", "长期合作"]

  // ========== 归属信息 ==========
  @Index()
  @Column({ type: 'integer', nullable: true })
  ownerId: number | null; // 当前负责人（销售）

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string | null; // 所属部门（冗余字段，关联创建人所在部门）

  @Column({ type: 'timestamp', nullable: true })
  ownerAssignedAt: Date; // 归属该业务的时间（每次变更 ownerId 时更新）

  @Column({ type: 'timestamp', nullable: true })
  lastMaintainAt: Date; // 最后维护客户信息的时间（更新任意字段时自动更新）

  @Column({ type: 'timestamp', nullable: true })
  lastContact: Date | null; // 最近联系时间（主动联系客户的记录时间）

  // ========== 公海机制 ==========
  @Index()
  @Column({ default: false })
  isInPool: boolean; // 是否在公海中

  @Column({ nullable: true })
  poolReason: PoolReason; // 入公海原因

  @Column({ type: 'timestamp', nullable: true })
  poolTime: Date; // 入公海时间

  // ========== 关联信息 ==========
  @Column({ type: 'integer', nullable: true })
  createdBy: number | null; // 创建人

  @Column({ type: 'integer', nullable: true })
  leadId: number | null; // 来源商机ID（若由商机转化而来）

  // ========== 其他 ==========
  @Column({ type: 'text', nullable: true })
  notes: string | null; // 备注

  @Column({ type: 'text', nullable: true })
  rejectReason: string | null; // 丢单原因（状态变为 lost 时填写）

  @VersionColumn()
  version: number;

  @Index()
  @Column({ default: false })
  isDeleted: boolean; // 软删除标记

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null; // 软删除时间

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
