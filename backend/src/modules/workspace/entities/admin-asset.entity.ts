import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AssetCategory = 'office' | 'activity' | 'electronic' | 'vehicle' | 'furniture' | 'other';
export type AssetStatus = 'normal' | 'maintenance' | 'scrapped' | 'lost';

@Entity('admin_assets')
export class AdminAsset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  assetNumber: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 20 })
  category: AssetCategory;

  @Column({ type: 'date' })
  purchaseDate: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  purchasePrice: number;

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  status: AssetStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
