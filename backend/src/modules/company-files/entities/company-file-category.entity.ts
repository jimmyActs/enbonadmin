import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('company_file_categories')
export class CompanyFileCategory {
  @PrimaryGeneratedColumn()
  id: number;

  // 唯一标识，用于前后端约定（例如：specs / images / videos）
  @Column({ type: 'varchar', length: 64, unique: true })
  key: string;

  // 中文名称
  @Column({ type: 'varchar', length: 100 })
  nameZh: string;

  // 英文名称
  @Column({ type: 'varchar', length: 100 })
  nameEn: string;

  // 中文描述
  @Column({ type: 'text', nullable: true })
  descZh?: string;

  // 英文描述
  @Column({ type: 'text', nullable: true })
  descEn?: string;

  // 图标（可以是 emoji 或图标类名）
  @Column({ type: 'varchar', length: 50, nullable: true })
  icon?: string;

  // 对应在共享盘下的文件夹目录名，例如：specs / images
  @Column({ type: 'varchar', length: 128 })
  folder: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


