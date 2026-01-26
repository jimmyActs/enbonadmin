import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('drive_names')
export class DriveName {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  driveId: string; // 盘ID，如 public-d, planning-e

  @Column()
  displayName: string; // 显示名称，如 "图片区", "产品区"

  @Column({ default: false })
  enabled: boolean; // 是否启用该盘（用于文件管理中展示）

  @Column({ default: false })
  enableQuotaScan: boolean; // 是否开启容量扫描（开启后会对该盘进行递归扫描统计已用空间）

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

