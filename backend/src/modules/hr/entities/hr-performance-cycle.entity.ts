import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_performance_cycle')
export class HrPerformanceCycle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'simple-enum', enum: ['KPI', 'OKR', 'MIXED'] })
  type: 'KPI' | 'OKR' | 'MIXED';

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ type: 'date', nullable: true })
  selfReviewStart: Date;

  @Column({ type: 'date', nullable: true })
  selfReviewEnd: Date;

  @Column({ type: 'date', nullable: true })
  managerReviewStart: Date;

  @Column({ type: 'date', nullable: true })
  managerReviewEnd: Date;

  @Column({ type: 'date', nullable: true })
  hrReviewStart: Date;

  @Column({ type: 'date', nullable: true })
  hrReviewEnd: Date;

  @Column({ type: 'date', nullable: true })
  resultPublishDate: Date;

  @Column({
    type: 'simple-enum',
    enum: ['DRAFT', 'SELF_REVIEW', 'MANAGER_REVIEW', 'HR_REVIEW', 'PUBLISHED', 'CLOSED'],
    default: 'DRAFT',
  })
  status: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
