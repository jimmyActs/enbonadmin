import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';
import { DataScope } from './role-permission.entity';

@Entity('position_permission')
@Unique('UQ_position_permission', ['positionCode', 'permissionCode'])
export class PositionPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  positionCode: string; // 岗位编码

  @Column()
  permissionCode: string; // 权限码，例如 crm.customer.view

  @Column({
    type: 'simple-enum',
    enum: DataScope,
    default: DataScope.SELF,
  })
  dataScope: DataScope; // 数据范围 SELF/DEPARTMENT/ORG

  @Column({
    type: 'simple-enum',
    enum: ['GRANT', 'DENY'],
    default: 'GRANT',
  })
  grantType: 'GRANT' | 'DENY'; // 授权类型

  @Column({ default: true })
  isDefault: boolean; // 是否默认权限（不可手动删除）

  @CreateDateColumn()
  createdAt: Date;
}
