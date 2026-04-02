import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type EventType = 'team_building' | 'meeting' | 'training' | 'celebration' | 'other';

@Entity('hr_events')
export class HrEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventName: string;

  @Column({ type: 'varchar', default: 'meeting' })
  type: EventType;

  @Column({ type: 'date' })
  eventDate: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  organizerId: number;

  @Column({ nullable: true })
  organizerName: string;

  @Column({ type: 'int', default: 1 })
  participantCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  budget: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', default: 'upcoming' })
  status: EventStatus;

  @Column({ nullable: true })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
