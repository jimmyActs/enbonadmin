import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  currency: string; // USD, EUR, GBP, JPY

  @Column('decimal', { precision: 10, scale: 4 })
  rate: number; // 汇率值，1目标货币 = rate CNY

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  change: number; // 变化百分比

  @Column({ nullable: true })
  updatedBy: string; // 更新者用户名

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

