import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrTrainingPlan } from './hr-training-plan.entity';
import { HrTrainingCourse } from './hr-training-course.entity';

@Entity('hr_training_plan_course')
export class HrTrainingPlanCourse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  planId: number;

  @ManyToOne(() => HrTrainingPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan: HrTrainingPlan;

  @Column()
  courseId: number;

  @ManyToOne(() => HrTrainingCourse)
  @JoinColumn({ name: 'courseId' })
  course: HrTrainingCourse;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ default: 0 })
  sortOrder: number;
}
