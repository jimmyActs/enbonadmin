import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_payroll_structure')
export class HrPayrollStructure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  position: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  performanceSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  overtimePay: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  mealAllowance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  transportAllowance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  housingFund: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  socialSecurity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  otherDeductions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('hr_payroll')
export class HrPayroll {
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
  period: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  performanceSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  overtimePay: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  mealAllowance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  transportAllowance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  grossSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDeductions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  housingFund: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  socialSecurity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'int', default: 0 })
  lateCount: number;

  @Column({ type: 'int', default: 0 })
  earlyLeaveCount: number;

  @Column({ type: 'int', default: 0 })
  absentCount: number;

  @Column({ type: 'int', default: 0 })
  overtimeHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  attendanceDeduction: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  performanceScore: number;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string;

  @Column({ nullable: true })
  paidAt: string;

  @Column({ nullable: true })
  paidBy: number;

  @Column({ nullable: true })
  remarks: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ default: false })
  isDeleted: boolean; // 软删除标记

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
