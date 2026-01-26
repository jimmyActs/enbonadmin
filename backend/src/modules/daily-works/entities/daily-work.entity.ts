import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'; // 导入 TypeORM 装饰器，用于定义实体和字段

@Entity('daily_works') // 声明实体对应的表名为 daily_works
export class DailyWork { // 导出 DailyWork 实体类
  @PrimaryGeneratedColumn() // 主键自增 ID
  id: number; // 每日工作记录 ID

  @Column({ type: 'text' }) // 日期列，使用文本存储 YYYY-MM-DD
  date: string; // 工作日期（YYYY-MM-DD）

  @Column() // 标题列，必填
  title: string; // 工作标题

  @Column({ type: 'text', nullable: true }) // 描述列，长文本，可为空
  description: string | null; // 工作描述

  @Column({ type: 'text' }) // 优先级列，枚举 high/medium/low
  priority: 'high' | 'medium' | 'low'; // 优先级

  @Column({ type: 'text' }) // 状态列，枚举 todo/doing/done
  status: 'todo' | 'doing' | 'done'; // 状态

  @Column({ type: 'integer' }) // 完成度列，0-100 的整数
  completion: number; // 完成百分比

  @Column({ type: 'text', nullable: true }) // 未完成事项列，JSON 字符串，可为空
  incompleteItems: string | null; // 未完成事项数组的 JSON 字符串

  @Column({ type: 'integer' }) // 关联用户 ID，整数
  userId: number; // 所属用户 ID

  @CreateDateColumn() // 创建时间自动维护
  createdAt: Date; // 创建时间

  @UpdateDateColumn() // 更新时间自动维护
  updatedAt: Date; // 更新时间
} // 结束 DailyWork 实体定义



