import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('folder_permissions')
export class FolderPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  driveId: string;

  @Column()
  path: string; // 文件夹路径

  @Column()
  userId: number; // 创建者/所有者ID

  @Column({ default: false })
  isLocked: boolean; // 是否锁定（隐藏）

  @Column({ nullable: true })
  password?: string; // 可选密码（如果设置了密码，需要密码才能解锁）

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

