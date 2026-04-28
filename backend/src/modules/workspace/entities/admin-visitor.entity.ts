import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type VisitorStatus = 'in' | 'out';

@Entity('admin_visitors')
export class AdminVisitor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  visitorName: string;

  @Column()
  company: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column()
  purpose: string;

  @Column({ type: 'timestamp' })
  checkInTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOutTime: Date;

  @Column({ type: 'varchar', length: 20, default: 'in' })
  status: VisitorStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  hostEmployeeId: number;

  @Column({ nullable: true })
  hostEmployeeName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
