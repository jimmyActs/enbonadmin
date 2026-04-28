import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_probation')
export class HrProbation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employeeId: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'date', nullable: true })
  originalEndDate: Date;

  @Column({
    type: 'simple-enum',
    enum: ['ACTIVE', 'EXTENDED', 'PASSED', 'FAILED'],
    default: 'ACTIVE',
  })
  status: string;

  @Column({ default: 0 })
  reportCount: number;

  @Column({ default: 4 })
  reportRequired: number;

  @Column({ type: 'date', nullable: true })
  lastReportDate: Date;

  @Column({ type: 'simple-json', nullable: true })
  kpiTargets: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  kpiProgress: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  warnings: Array<{ date: string; type: string; content: string }>;

  @Column({ type: 'simple-json', nullable: true })
  evaluations: Record<string, any>[];

  @Column({ default: false })
  isDeleted: boolean; // 软删除标记

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
