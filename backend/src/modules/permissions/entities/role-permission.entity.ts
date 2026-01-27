import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

export enum DataScope {
  SELF = 'SELF',
  DEPARTMENT = 'DEPARTMENT',
  ORG = 'ORG',
}

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column()
  roleId: number;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;

  @Column()
  permissionId: number;

  @Column({
    type: 'simple-enum',
    enum: DataScope,
    default: DataScope.SELF,
  })
  dataScope: DataScope;
}


