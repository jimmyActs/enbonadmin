import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_training_evaluation')
export class HrTrainingEvaluation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  recordId: number;

  @Column()
  evaluatorId: number;

  @Column({ type: 'date' })
  evaluationDate: Date;

  @Column({ nullable: true })
  rating: number;

  @Column({ nullable: true })
  contentRating: number;

  @Column({ nullable: true })
  instructorRating: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'text', nullable: true })
  suggestions: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
