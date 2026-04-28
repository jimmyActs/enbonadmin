import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_pip')
export class HrPip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employeeId: number;

  @Column()
  performanceId: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({
    type: 'simple-enum',
    enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'TERMINATED'],
    default: 'DRAFT',
  })
  status: string;

  @Column({ nullable: true })
  finalResult: string;

  @Column({ type: 'text', nullable: true })
  finalComment: string;

  @Column({ type: 'text', nullable: true })
  improvementPlan: string;

  @Column()
  createdBy: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  terminatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean; // 软删除标记

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
