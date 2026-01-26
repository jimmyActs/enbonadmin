import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'; // 导入 TypeORM 装饰器，用于定义实体和字段

@Entity('memos') // 声明实体对应的表名为 memos
export class Memo { // 导出 Memo 实体类
  @PrimaryGeneratedColumn() // 主键自增 ID
  id: number; // 备忘录 ID

  @Column() // 标题列，必填
  title: string; // 备忘录标题

  @Column({ type: 'text' }) // 内容列，使用 text 存储长文本
  content: string; // 备忘录内容

  @Column({ type: 'text' }) // 分类列，存储 work / daily
  category: 'work' | 'daily'; // 备忘录分类

  @Column({ type: 'integer' }) // 关联用户 ID，整数
  userId: number; // 所属用户 ID

  @Column({ type: 'datetime', nullable: true }) // 提醒时间，可为空
  reminderTime: Date | null; // 提醒时间

  @Column({ type: 'text', nullable: true }) // 提醒类型，可为空
  reminderType: 'once' | 'daily' | 'weekly' | null; // 提醒类型

  @Column({ type: 'text', nullable: true }) // 标签字段，序列化为 JSON 字符串存储
  tags: string | null; // 标签 JSON 字符串

  @CreateDateColumn() // 创建时间自动维护
  createdAt: Date; // 创建时间

  @UpdateDateColumn() // 更新时间自动维护
  updatedAt: Date; // 更新时间
}


