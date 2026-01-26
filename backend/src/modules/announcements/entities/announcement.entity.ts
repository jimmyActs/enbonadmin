import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AnnouncementType {
  ANNOUNCEMENT = 'announcement', // 公司公告
  NOTICE = 'notice', // 通知
}

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  creatorId: number; // 创建者ID

  @Column({ type: 'text', enum: AnnouncementType })
  type: AnnouncementType; // 类型：公告或通知

  @Column({ type: 'text' })
  title: string; // 标题

  @Column({ type: 'text' })
  content: string; // 内容

  @Column({ default: true })
  isActive: boolean; // 是否激活

  @Column({ type: 'datetime', nullable: true })
  publishTime: Date | null; // 发布时间

  @Column({ type: 'datetime', nullable: true })
  expireTime: Date | null; // 过期时间（可选）

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

