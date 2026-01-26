import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('software_metadata')
@Unique(['driveId', 'path'])
export class SoftwareMetadata {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  driveId: string;

  // 相对于盘根目录的完整路径，例如 software-downloads/office/tunnel.exe
  @Column({ type: 'varchar', length: 512 })
  path: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  version?: string | null;

  @Column({ type: 'datetime', nullable: true })
  releaseDate?: Date | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


