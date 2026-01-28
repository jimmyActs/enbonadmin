import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_links')
export class AiLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  account: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  password: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // 所属文件夹路径（AI 资产库内部的相对路径），根目录用 NULL 表示
  @Column({ type: 'varchar', length: 500, nullable: true })
  folderPath: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


