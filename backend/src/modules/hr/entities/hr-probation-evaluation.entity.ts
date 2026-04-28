import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_probation_evaluation')
export class HrProbationEvaluation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  probationId: number;

  @Column()
  evaluatorId: number;

  @Column({ type: 'date' })
  evaluationDate: Date;

  @Column()
  period: string;

  @Column({ nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  strengths: string;

  @Column({ type: 'text', nullable: true })
  weaknesses: string;

  @Column({ type: 'text', nullable: true })
  improvementPlan: string;

  @Column({ default: false })
  isDeleted: boolean; // 软删除标记

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
