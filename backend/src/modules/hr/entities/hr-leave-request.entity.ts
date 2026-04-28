import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum LeaveStatus {
  PENDING = 'pending',      // 待审批
  APPROVED = 'approved',    // 已批准
  REJECTED = 'rejected',   // 已拒绝
  CANCELLED = 'cancelled',  // 已取消
}

export enum LeaveType {
  ANNUAL = 'annual',        // 年假
  SICK = 'sick',           // 病假
  PERSONAL = 'personal',    // 事假
  MATERNITY = 'maternity',  // 产假
  PATERNITY = 'paternity', // 陪产假
  MARRIAGE = 'marriage',   // 婚假
  BEREAVEMENT = 'bereavement', // 丧假
  UNPAID = 'unpaid',       // 无薪假
  OTHER = 'other',         // 其他
}

@Entity('hr_leave_requests')
export class HrLeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employeeId: number;

  @Column()
  employeeName: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  department: string | null;

  @Column({ type: 'enum', enum: LeaveType, default: LeaveType.PERSONAL })
  leaveType: LeaveType;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'int', default: 1 })
  days: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'enum', enum: LeaveStatus, default: LeaveStatus.PENDING })
  status: LeaveStatus;

  @Column({ nullable: true, type: 'int' })
  approverId: number | null;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  approverName: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  approvedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  approverComment: string | null;

  @Column({ nullable: true, type: 'text' })
  rejectReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
