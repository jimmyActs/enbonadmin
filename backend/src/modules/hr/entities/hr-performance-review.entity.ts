import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('hr_performance_review')
export class HrPerformanceReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  cycleId: number;

  @Index()
  @Column()
  employeeId: number;

  @Column()
  templateId: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  selfScore: number;

  @Column({ type: 'text', nullable: true })
  selfComment: string;

  @Column({ type: 'timestamp', nullable: true })
  selfSubmittedAt: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  managerScore: number;

  @Column({ type: 'text', nullable: true })
  managerComment: string;

  @Column({ nullable: true })
  managerId: number;

  @Column({ type: 'timestamp', nullable: true })
  managerSubmittedAt: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hrScore: number;

  @Column({ type: 'text', nullable: true })
  hrComment: string;

  @Column({ nullable: true })
  hrReviewerId: number;

  @Column({ type: 'timestamp', nullable: true })
  hrSubmittedAt: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  finalScore: number;

  @Column({ nullable: true })
  rating: string;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: false })
  isDeleted: boolean; // 软删除标记

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
