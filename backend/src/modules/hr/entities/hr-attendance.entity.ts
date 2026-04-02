import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave' | 'leave' | 'overtime';

@Entity('hr_attendance')
export class HrAttendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  employeeId: number;

  @Column({ nullable: true })
  employeeName: string;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'date', nullable: true })
  date: string;

  @Column({ type: 'time', nullable: true })
  checkInTime: string;

  @Column({ type: 'time', nullable: true })
  checkOutTime: string;

  @Column({ type: 'varchar', length: 50, default: 'present' })
  status: AttendanceStatus;

  @Column({ type: 'int', default: 0 })
  lateMinutes: number;

  @Column({ type: 'int', default: 0 })
  earlyLeaveMinutes: number;

  @Column({ type: 'int', default: 0 })
  overtimeMinutes: number;

  @Column({ nullable: true })
  remarks: string;

  @Column({ nullable: true })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
