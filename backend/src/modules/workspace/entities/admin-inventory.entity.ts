import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type InventoryType = 'in' | 'out';

@Entity('admin_inventory')
export class AdminInventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  materialName: string;

  @Column({ nullable: true })
  category: string;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'varchar', length: 20, default: 'in' })
  type: InventoryType;

  @Column({ nullable: true })
  handlerId: number;

  @Column({ nullable: true })
  handlerName: string;

  @Column({ type: 'timestamp' })
  operateTime: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
