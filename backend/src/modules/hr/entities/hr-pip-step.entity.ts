import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrPip } from './hr-pip.entity';

@Entity('hr_pip_step')
export class HrPipStep {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pipId: number;

  @ManyToOne(() => HrPip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pipId' })
  pip: HrPip;

  @Column()
  stepOrder: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  targetDate: Date;

  @Column({
    type: 'simple-enum',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'],
    default: 'PENDING',
  })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  completionNote: string;

  @Column({ default: false })
  isDeleted: boolean; // 软删除标记

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
