import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('company_culture_hero')
export class CompanyCultureHero {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  subtitle: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vision: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  values: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  slogan: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  logoText: string | null;

  @Column({ type: 'text', nullable: true })
  logoImage: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('company_culture_members')
export class CompanyCultureMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tag: string | null;

  @Column({ type: 'text', nullable: true })
  avatar: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('company_culture_albums')
export class CompanyCultureAlbum {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tag: string | null;

  @Column({ type: 'boolean', default: false })
  pinned: boolean;

  @Column({ type: 'boolean', default: false })
  hidden: boolean;

  @Column({ type: 'varchar', length: 20, default: 'standard' })
  layout: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sizeClass: string | null;

  @Column({ type: 'text', nullable: true })
  coverImage: string | null;

  // JSON 字符串，存储照片数组 { url, caption? }[]
  @Column({ type: 'text', nullable: true })
  photosJson: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


