import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum PersonalDocumentCategory {
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  TEMPLATE = 'template',
  OTHER = 'other',
}

@Entity('personal_documents')
export class PersonalDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  tags?: string | null;

  @Column({
    type: 'simple-enum',
    enum: PersonalDocumentCategory,
    default: PersonalDocumentCategory.DOCUMENT,
  })
  category: PersonalDocumentCategory;

  @Column({ nullable: true })
  originalName?: string;

  @Column({ nullable: true })
  fileName?: string;

  @Column({ nullable: true })
  filePath?: string;

  @Column({ type: 'integer', default: 0 })
  fileSize: number;

  @Column({ default: false })
  pinned: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


