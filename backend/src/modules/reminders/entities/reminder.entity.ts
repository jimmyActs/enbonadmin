import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  creatorId: number; // 创建者ID

  @Column()
  targetUserId: number; // 目标用户ID（被提醒的人）

  @Column({ type: 'text' })
  content: string; // 提醒内容

  @Column({ type: 'text', nullable: true })
  memo: string; // 备忘录

  @Column({ type: 'datetime' })
  reminderTime: Date; // 提醒时间

  @Column({ default: false })
  isCompleted: boolean; // 是否已完成

  @Column({ default: false })
  isRead: boolean; // 是否已读

  @Column({ default: false })
  isNotified: boolean; // 是否已通知（已触发提醒）

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

