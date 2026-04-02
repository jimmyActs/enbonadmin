import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

/**
 * 导入历史记录
 * 记录每次 Excel 批量导入的操作信息
 */
@Entity('import_history')
export class ImportHistory {
  @PrimaryGeneratedColumn()
  id: number;

  /** 模块类型：crm_leads | hr_attendance | hr_employees */
  @Column({ type: 'varchar', length: 32 })
  module: string;

  /** 操作人 ID */
  @Column({ type: 'integer', nullable: true })
  userId: number;

  /** 操作人姓名（冗余存储） */
  @Column({ type: 'varchar', length: 128, nullable: true })
  userName: string;

  /** 操作类型：import | export */
  @Column({ type: 'varchar', length: 16, default: 'import' })
  action: string;

  /** 本次导入总记录数 */
  @Column({ type: 'integer', default: 0 })
  totalRecords: number;

  /** 成功导入数 */
  @Column({ type: 'integer', default: 0 })
  importedCount: number;

  /** 更新数（upsert 覆盖） */
  @Column({ type: 'integer', default: 0 })
  updatedCount: number;

  /** 跳过数（格式错误/缺少必填字段） */
  @Column({ type: 'integer', default: 0 })
  skippedCount: number;

  /** 源文件名 */
  @Column({ type: 'varchar', length: 256, nullable: true })
  fileName: string;

  /** 错误摘要（取前5条） */
  @Column({ type: 'text', nullable: true })
  errorSummary: string;

  /** 成功/失败/部分成功 */
  @Column({ type: 'varchar', length: 16, default: 'success' })
  status: 'success' | 'partial' | 'failed';

  @CreateDateColumn()
  createdAt: Date;
}
