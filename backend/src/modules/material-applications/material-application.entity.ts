import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MaterialApplicationStatus {
  PENDING = 'pending', // 待处理
  APPROVED = 'approved', // 已批准
  REJECTED = 'rejected', // 已拒绝
  PROCESSING = 'processing', // 处理中
  COMPLETED = 'completed', // 已完成
}

@Entity('material_applications')
export class MaterialApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  materialName: string; // 物料名称

  @Column()
  category: string; // 分类

  @Column({ type: 'integer' })
  quantity: number; // 数量

  @Column()
  unit: string; // 单位

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  urgency: string; // 紧急程度：normal, urgent

  @Column({ type: 'text' })
  reason: string; // 申请原因

  @Column({ nullable: true })
  expectedDate: string; // 期望到货日期

  @Column({ type: 'text', nullable: true })
  remarks: string; // 备注

  @Column({ type: 'varchar', length: 20, default: MaterialApplicationStatus.PENDING })
  status: string; // 状态

  @Column()
  applicantId: number; // 申请人ID

  @Column()
  applicantName: string; // 申请人姓名

  @Column({ nullable: true })
  applicantDepartment: string; // 申请人部门

  @Column({ nullable: true })
  handlerId: number; // 处理人ID

  @Column({ nullable: true })
  handlerName: string; // 处理人姓名

  @Column({ nullable: true })
  handleTime: string; // 处理时间

  @Column({ type: 'text', nullable: true })
  handleNotes: string; // 处理备注

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

