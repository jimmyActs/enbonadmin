import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('workspace_storage_configs')
export class WorkspaceStorageConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  moduleKey: string; // 如 company-files / software-downloads / company-culture

  @Column()
  driveId: string; // 物理盘符（小写），如 d、e

  @Column()
  rootPath: string; // 该模块在盘上的根目录，如 company-files

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


