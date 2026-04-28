import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_employee_exit')
export class HrEmployeeExit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employeeId: number;

  @Column({ type: 'date' })
  exitDate: Date;

  @Column({
    type: 'simple-enum',
    enum: ['RESIGNATION', 'TERMINATION', 'RETIREMENT'],
  })
  exitType: string;

  @Column({ type: 'text', nullable: true })
  exitReason: string;

  @Column({ type: 'text', nullable: true })
  exitInterview: string;

  @Column({ default: false })
  isExitInterviewed: boolean;

  @Column({ nullable: true })
  probationStatus: string;

  @Column({ type: 'date', nullable: true })
  probationEndDate: Date;

  @Column({ default: 0 })
  warningCount: number;

  @Column({ type: 'simple-json', nullable: true })
  exitInterviewData: Record<string, any>;

  @Column({ default: false })
  isDeleted: boolean; // 软删除标记

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
