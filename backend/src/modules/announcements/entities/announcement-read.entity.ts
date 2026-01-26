import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * 用户阅读公告记录
 * 用于跟踪哪些用户已阅读哪些公告
 */
@Entity('announcement_reads')
@Index(['userId', 'announcementId'], { unique: true }) // 确保每个用户对每个公告只有一条记录
export class AnnouncementRead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number; // 用户ID

  @Column()
  announcementId: number; // 公告ID

  @Column({ default: false })
  isRead: boolean; // 是否已读

  @CreateDateColumn()
  readAt: Date; // 阅读时间
}

