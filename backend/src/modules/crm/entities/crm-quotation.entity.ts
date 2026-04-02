import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

@Entity('crm_quotations')
export class CrmQuotation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  quotationNumber: string; // 报价单号

  @Column()
  customerName: string;

  @Column({ type: 'text', nullable: true })
  productName: string;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'simple-enum', enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'], default: 'draft' })
  status: QuotationStatus;

  @Column({ type: 'date' })
  quotationDate: string;

  @Column({ type: 'date', nullable: true })
  validUntil: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'integer', nullable: true })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
