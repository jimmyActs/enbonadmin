import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_payroll_budget')
export class HrPayrollBudget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @Column({ nullable: true })
  quarter: number;

  @Column({ nullable: true })
  departmentCode: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalBudget: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  salaryBudget: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  bonusBudget: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  socialBudget: number;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
