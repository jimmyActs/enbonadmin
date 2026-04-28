import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrPerformanceTemplate } from './hr-performance-template.entity';
import { HrPerformanceIndicator } from './hr-performance-indicator.entity';

@Entity('hr_template_indicator')
export class HrTemplateIndicator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  templateId: number;

  @ManyToOne(() => HrPerformanceTemplate)
  @JoinColumn({ name: 'templateId' })
  template: HrPerformanceTemplate;

  @Column()
  indicatorId: number;

  @ManyToOne(() => HrPerformanceIndicator)
  @JoinColumn({ name: 'indicatorId' })
  indicator: HrPerformanceIndicator;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  weight: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  targetValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  stretchTarget: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  sortOrder: number;
}
