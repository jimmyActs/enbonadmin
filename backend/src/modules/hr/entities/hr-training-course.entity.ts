import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hr_training_course')
export class HrTrainingCourse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({
    type: 'simple-enum',
    enum: ['VIDEO', 'DOCUMENT', 'OFFLINE'],
    default: 'VIDEO',
  })
  type: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  duration: number;

  @Column({ type: 'simple-json', nullable: true })
  materials: string[];

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: 60 })
  passingScore: number;

  @Column({ default: 3 })
  maxAttempts: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({ nullable: true })
  instructor: string;

  @Column({
    type: 'simple-enum',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT',
  })
  status: string;

  /** 发布范围：目标部门代码数组，为空/ALL表示全员可见 */
  @Column({ type: 'simple-json', nullable: true })
  targetDepartments: string[];

  /** 发布范围：指定人员ID数组，为空表示不限人员 */
  @Column({ type: 'simple-json', nullable: true })
  targetUserIds: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
