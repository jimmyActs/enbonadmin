import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_performance_template')
export class HrPerformanceTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  departmentCode: string;

  @Column({ type: 'simple-json', nullable: true })
  positionCodes: string[];

  @Column({ nullable: true })
  employeeLevel: string;

  @Column({ type: 'simple-enum', enum: ['KPI', 'OKR', 'MIXED'] })
  type: 'KPI' | 'OKR' | 'MIXED';

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 30 })
  selfWeight: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 70 })
  managerWeight: number;

  @Column({ type: 'simple-json', nullable: true })
  ratingRules: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: 0 })
  useCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
