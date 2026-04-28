import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('crm_quotation_version')
export class CrmQuotationVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quotationId: number;

  @Column()
  version: number;

  @Column({ type: 'simple-json' })
  snapshot: Record<string, any>;

  @Column({ nullable: true })
  changeSummary: string;

  @Column()
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;
}
