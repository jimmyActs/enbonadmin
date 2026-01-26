import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('company_file_series')
export class CompanyFileSeries {
  @PrimaryGeneratedColumn()
  id: number;

  // 关联的分类 key（与 CompanyFileCategory.key 对应）
  @Column({ type: 'varchar', length: 64 })
  categoryKey: string;

  @Column({ type: 'varchar', length: 100 })
  nameZh: string;

  @Column({ type: 'varchar', length: 100 })
  nameEn: string;

  // 用于前端过滤或路径映射的简短标识，例如 rental / outdoor
  @Column({ type: 'varchar', length: 64 })
  slug: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


