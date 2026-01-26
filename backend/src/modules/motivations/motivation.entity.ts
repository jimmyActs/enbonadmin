import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('motivations')
export class Motivation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  text: string; // 名言内容

  @Column({ nullable: true })
  author: string; // 作者/署名

  @Column({ type: 'varchar', length: 50, nullable: true, default: '#ffffff' })
  textColor: string; // 文字颜色

  @Column({ type: 'integer', nullable: true, default: 28 })
  fontSize: number; // 字体大小（px）

  @Column({ type: 'text', nullable: true })
  backgroundImage: string; // 背景图片URL

  @Column({ default: true })
  enabled: boolean; // 是否启用

  @Column({ nullable: true })
  updatedBy: string; // 最后更新人

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('banner_images')
export class BannerImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string; // 图片URL

  @Column({ default: true })
  enabled: boolean; // 是否启用

  @Column({ nullable: true })
  updatedBy: string; // 最后更新人

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

