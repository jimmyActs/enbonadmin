import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('department_config')
export class DepartmentConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // 部门编码，例如 sales, hr

  @Column()
  name: string; // 部门名称，例如 销售部

  @Column({ nullable: true })
  nameEn: string; // 英文名称

  @Column({ nullable: true })
  parentCode: string; // 上级部门编码

  @Column({ nullable: true })
  managerId: number; // 部门负责人用户ID

  @Column({ default: true })
  isActive: boolean; // 是否启用

  @Column({ default: 0 })
  sortOrder: number; // 排序

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
