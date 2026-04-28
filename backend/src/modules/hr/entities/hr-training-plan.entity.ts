import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_training_plan')
export class HrTrainingPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'simple-enum',
    enum: ['ALL', 'DEPARTMENT', 'POSITION', 'MANUAL'],
  })
  targetType: string;

  @Column({ type: 'text', nullable: true })
  targetValue: string;

  @Column({
    type: 'simple-enum',
    enum: ['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT',
  })
  status: string;

  @Column()
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
