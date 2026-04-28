import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * 客户变更历史记录
 * 记录客户字段的所有变更，用于审计追踪
 */
@Entity('crm_customer_changelog')
export class CrmCustomerChangelog {
  @PrimaryGeneratedColumn()
  id: number;

  /** 关联的客户ID */
  @Column({ type: 'integer' })
  customerId: number;

  /** 操作类型 */
  @Column({ type: 'text' })
  action: 'create' | 'update' | 'assign_owner' | 'release_to_pool' | 'claim_from_pool' | 'delete';

  /** 变更的字段名 */
  @Column({ nullable: true })
  field: string;

  /** 变更前的值 */
  @Column({ type: 'text', nullable: true })
  oldValue: string;

  /** 变更后的值 */
  @Column({ type: 'text', nullable: true })
  newValue: string;

  /** 变更摘要（多字段变更时使用） */
  @Column({ type: 'text', nullable: true })
  summary: string;

  /** 操作人ID */
  @Column({ type: 'integer', nullable: true })
  operatorId: number;

  /** 操作人名称 */
  @Column({ nullable: true })
  operatorName: string;

  /** 客户端IP */
  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
