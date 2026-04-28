import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('department_module')
export class DepartmentModule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  departmentCode: string; // 部门编码

  @Column()
  moduleCode: string; // 模块编码，例如 crm, hr, sales_workbench

  @Column({ default: true })
  isVisible: boolean; // 是否可见

  @Column({ default: 0 })
  sortOrder: number; // 排序

  @CreateDateColumn()
  createdAt: Date;
}
