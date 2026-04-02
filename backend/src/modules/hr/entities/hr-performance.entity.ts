import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PerformanceStatus = 'draft' | 'submitted' | 'reviewed' | 'completed';
export type PerformanceRating = 'A' | 'B' | 'C' | 'D' | 'E';

@Entity('hr_performance_template')
export class HrPerformanceTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  position: string;

  @Column({ type: 'text', nullable: true })
  indicators: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('hr_performance')
export class HrPerformance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  employeeId: number;

  @Column({ nullable: true })
  employeeName: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  templateId: number;

  @Column({ nullable: true })
  period: string;

  @Column({ type: 'date', nullable: true })
  reviewDate: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  selfScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  supervisorScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  finalScore: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  rating: PerformanceRating;

  @Column({ type: 'text', nullable: true })
  selfComment: string;

  @Column({ type: 'text', nullable: true })
  supervisorComment: string;

  @Column({ nullable: true })
  reviewedBy: number;

  @Column({ nullable: true })
  reviewedByName: string;

  @Column({ nullable: true })
  reviewedAt: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: PerformanceStatus;

  @Column({ nullable: true })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
