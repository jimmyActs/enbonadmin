import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_payroll_alert')
export class HrPayrollAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ruleId: number;

  @Column()
  year: number;

  @Column({ nullable: true })
  quarter: number;

  @Column({ nullable: true })
  departmentCode: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  budgetAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  actualAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  overRate: number;

  @Column({
    type: 'simple-enum',
    enum: ['PENDING', 'ACKNOWLEDGED', 'RESOLVED'],
    default: 'PENDING',
  })
  status: string;

  @Column({ nullable: true })
  resolvedBy: number;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'simple-json', nullable: true })
  extraData: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
