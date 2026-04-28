import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('position_config')
export class PositionConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // 岗位编码，例如 sales_rep

  @Column()
  name: string; // 岗位名称，例如 销售代表

  @Column({ nullable: true })
  nameEn: string; // 英文名称

  @Column()
  departmentCode: string; // 所属部门编码

  @Column({ default: 1 })
  level: number; // 职级：1=专员, 2=组长, 3=经理, 4=总监

  @Column({ default: false })
  isLeadership: boolean; // 是否管理岗

  @Column({ default: 0 })
  sortOrder: number; // 排序

  @Column({ default: true })
  isActive: boolean; // 是否启用

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
