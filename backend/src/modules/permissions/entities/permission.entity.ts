import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // 权限编码，例如 employee.manage.create

  @Column()
  name: string; // 中文名称

  @Column()
  module: string; // 所属模块，例如 employee / hr / files

  // 父级权限ID，使用 integer 类型并允许为空
  @Column({ type: 'integer', nullable: true })
  parentId: number | null; // 父级权限ID，用于构建树

  @Column({ nullable: true })
  description: string; // 说明

  @Column({ default: 0 })
  order: number; // 排序

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];
}


