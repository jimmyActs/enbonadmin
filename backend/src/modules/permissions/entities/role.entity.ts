import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // 角色编码，例如 hr_director_role

  @Column()
  name: string; // 显示名称，例如 人力资源总监模板

  // 说明字段，使用 text 类型并允许为空（TypeORM 在 sqlite 下不支持推断 union 类型，需要显式指定）
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isSystem: boolean; // 是否系统内置角色

  @Column({ default: false })
  isSuperAdmin: boolean; // 是否为超级管理员角色

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => UserRole, (ur) => ur.role)
  userRoles: UserRole[];
}


