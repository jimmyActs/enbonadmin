import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type RecruitmentStatus = 'pending' | 'interviewing' | 'offered' | 'hired' | 'rejected' | 'withdrawn';
export type RecruitmentSource = 'boss' | 'zhilian' | 'liepin' | 'referral' | 'headhunter' | 'website' | 'campus' | 'other';
export type RecruitmentDemandStatus = 'pending' | 'approved' | 'rejected' | 'filled';

@Entity('hr_recruitment_demand')
export class HrRecruitmentDemand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  position: string;

  @Column({ type: 'int', default: 1 })
  headcount: number;

  @Column({ type: 'int', default: 0 })
  filledCount: number;

  @Column({ nullable: true })
  requirements: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  requesterId: number;

  @Column({ nullable: true })
  requesterName: string;

  @Column({ nullable: true })
  approvedBy: number;

  @Column({ nullable: true })
  approvedByName: string;

  @Column({ nullable: true })
  approvedAt: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: RecruitmentDemandStatus;

  @Column({ nullable: true })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('hr_candidate')
export class HrCandidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  demandId: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  education: string;

  @Column({ nullable: true })
  major: string;

  @Column({ nullable: true })
  experience: string;

  @Column({ nullable: true })
  currentCompany: string;

  @Column({ nullable: true })
  currentPosition: string;

  @Column({ nullable: true })
  expectedSalary: number;

  @Column({ nullable: true })
  source: RecruitmentSource;

  @Column({ nullable: true })
  resumeUrl: string;

  @Column({ nullable: true })
  interviewRecord: string;

  @Column({ nullable: true })
  interviewTime: string;

  @Column({ nullable: true })
  interviewerId: number;

  @Column({ nullable: true })
  interviewerName: string;

  @Column({ nullable: true })
  offerSalary: number;

  @Column({ nullable: true })
  joinDate: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: RecruitmentStatus;

  @Column({ nullable: true })
  rejectReason: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
