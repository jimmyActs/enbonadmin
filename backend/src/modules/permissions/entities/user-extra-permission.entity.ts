import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('user_extra_permission')
export class UserExtraPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number; // 用户ID

  @Column()
  permissionCode: string; // 权限码

  @Column({
    type: 'simple-enum',
    enum: ['SELF', 'DEPARTMENT', 'ORG'],
    default: 'SELF',
  })
  dataScope: 'SELF' | 'DEPARTMENT' | 'ORG'; // 数据范围

  @Column({
    type: 'simple-enum',
    enum: ['GRANT', 'DENY'],
    default: 'GRANT',
  })
  grantType: 'GRANT' | 'DENY'; // 授权类型

  @Column({ nullable: true })
  grantedBy: number; // 授权人用户ID

  @Column({ nullable: true })
  reason: string; // 授权原因

  @Column({ nullable: true })
  expiresAt: Date; // 过期时间

  @Column({ nullable: true })
  source: string; // 权限来源：'MANUAL'=手动分配，'POSITION'=职位自动分配

  @CreateDateColumn()
  createdAt: Date;
}
