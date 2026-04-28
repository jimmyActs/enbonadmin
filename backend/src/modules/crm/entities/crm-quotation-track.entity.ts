import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type QuotationTrackType = 'STATUS_CHANGE' | 'VIEW' | 'COMMENT' | 'REVISION' | 'APPROVAL' | 'EMAIL' | 'REMINDER';

@Entity('crm_quotation_track')
export class CrmQuotationTrack {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quotationId: number;

  @Column({
    type: 'simple-enum',
    enum: ['STATUS_CHANGE', 'VIEW', 'COMMENT', 'REVISION', 'APPROVAL', 'EMAIL', 'REMINDER'],
  })
  trackType: QuotationTrackType;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  fromStatus: string;

  @Column({ nullable: true })
  toStatus: string;

  @Column({ type: 'simple-json', nullable: true })
  attachments: string[];

  @Column({ nullable: true })
  operatorId: number;

  @Column({ type: 'simple-json', nullable: true })
  extraData: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
