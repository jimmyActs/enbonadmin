import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ReviewPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum ReviewStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
}

@Entity('crm_reviews')
export class CrmReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'simple-enum', enum: ReviewPeriod, default: ReviewPeriod.MONTHLY })
  period: ReviewPeriod;

  @Column()
  date: string; // YYYY-MM / YYYY-Q / YYYY

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text', nullable: true })
  achievements: string;

  @Column({ type: 'text', nullable: true })
  challenges: string;

  @Column({ type: 'text', nullable: true })
  improvements: string;

  @Column({ type: 'integer', nullable: true })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
