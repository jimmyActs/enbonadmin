import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('share_links')
export class ShareLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  driveId: string;

  @Column()
  path: string;

  @Column({ unique: true })
  token: string;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}

