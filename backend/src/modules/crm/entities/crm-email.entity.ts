import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 邮件方向枚举
 */
export enum EmailDirection {
  INBOUND = 'inbound',   // 收到（业务收到客户邮件）
  OUTBOUND = 'outbound', // 发出（业务发给客户邮件）
}

/**
 * 邮件重要性枚举
 */
export enum EmailImportance {
  NORMAL = 'normal',
  IMPORTANT = 'important',
  URGENT = 'urgent',
}

/**
 * 邮件往来记录实体
 * 用于主管通过管理账号查看业务与客户之间的邮件往来内容
 */
@Entity('crm_emails')
export class CrmEmail {
  @PrimaryGeneratedColumn()
  id: number;

  // ========== 邮件标识 ==========
  @Column()
  messageId: string; // 邮件唯一标识（来自邮件服务器 Message-ID）

  @Column({ nullable: true })
  subject: string; // 邮件主题

  @Column({ type: 'text', nullable: true })
  snippet: string; // 邮件摘要（前100字预览）

  // ========== 发送方/接收方 ==========
  @Column()
  fromEmail: string; // 发件人邮箱

  @Column({ nullable: true })
  fromName: string; // 发件人姓名

  @Column({ type: 'text', nullable: true })
  toRecipients: string; // 收件人，JSON 数组序列化 ["a@example.com", "b@example.com"]

  @Column({ type: 'text', nullable: true })
  ccRecipients: string; // 抄送人，JSON 数组序列化

  // ========== 邮件内容 ==========
  @Column({ type: 'text', nullable: true })
  bodyHtml: string; // HTML 正文

  @Column({ type: 'text', nullable: true })
  bodyText: string; // 纯文本正文

  @Column({ nullable: true })
  bodyPreview: string; // 前200字符纯文本预览（用于列表展示）

  // ========== 附件 ==========
  @Column({ nullable: true })
  attachments: string; // 附件列表，JSON 序列化 [{filename, size, url}]

  @Column({ nullable: true })
  hasAttachments: boolean; // 是否有附件

  // ========== 业务关联 ==========
  @Column({ type: 'integer', nullable: true })
  customerId: number; // 关联的客户ID（由业务手动关联或自动匹配）

  @Column({ type: 'integer', nullable: true })
  ownerId: number; // 负责该客户/跟进该邮件的业务用户ID

  @Column({
    type: 'simple-enum',
    enum: EmailDirection,
    default: EmailDirection.INBOUND,
  })
  direction: EmailDirection;

  // ========== 元数据 ==========
  @Column({
    type: 'simple-enum',
    enum: EmailImportance,
    default: EmailImportance.NORMAL,
  })
  importance: EmailImportance;

  @Column({ nullable: true })
  isRead: boolean; // 是否已读

  @Column({ nullable: true })
  isStarred: boolean; // 是否标星

  @Column({ nullable: true })
  isArchived: boolean; // 是否归档

  @Column({ nullable: true })
  tags: string; // 标签，JSON 数组

  @Column({ nullable: true })
  conversationId: string; // 会话ID（用于邮件往来线程展示）

  // ========== 时间戳 ==========
  @Column({ type: 'timestamp', nullable: true })
  emailDate: Date; // 邮件发送时间（来自邮件头）

  @Column({ default: false })
  isDeleted: boolean; // 软删除标记

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
