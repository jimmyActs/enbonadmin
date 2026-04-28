import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_performance_indicator')
export class HrPerformanceIndicator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  nameEn: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'simple-enum', enum: ['KPI', 'OKR'] })
  type: 'KPI' | 'OKR';

  @Column({ type: 'simple-enum', enum: ['NUMBER', 'PERCENTAGE', 'RATIO', 'BOOLEAN'], default: 'NUMBER' })
  dataType: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-enum', enum: ['HIGHER_BETTER', 'LOWER_BETTER'], default: 'HIGHER_BETTER' })
  targetDirection: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  weightMin: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  weightMax: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weightSuggest: number;

  @Column({ type: 'text', nullable: true })
  calculationRule: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ default: 0 })
  useCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
