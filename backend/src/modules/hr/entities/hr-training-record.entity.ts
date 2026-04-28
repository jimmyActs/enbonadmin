import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { HrTrainingCourse } from './hr-training-course.entity';
import { HrTrainingPlan } from './hr-training-plan.entity';

@Entity('hr_training_record')
@Unique(['employeeId', 'courseId'])
export class HrTrainingRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employeeId: number;

  @Column()
  courseId: number;

  @ManyToOne(() => HrTrainingCourse)
  @JoinColumn({ name: 'courseId' })
  course: HrTrainingCourse;

  @Column({ nullable: true })
  planId: number;

  @ManyToOne(() => HrTrainingPlan, { nullable: true })
  @JoinColumn({ name: 'planId' })
  plan: HrTrainingPlan;

  @Column({ default: 0 })
  progress: number;

  @Column({
    type: 'simple-enum',
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
    default: 'NOT_STARTED',
  })
  status: string;

  @Column({ nullable: true })
  score: number;

  @Column({ default: 0 })
  attempts: number;

  @Column({ nullable: true })
  bestScore: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
