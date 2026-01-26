import { IsString, IsNotEmpty, IsIn, IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator'; // 导入验证装饰器，用于请求体验证

export class CreateDailyWorkDto { // 创建 / 更新每日工作 DTO
  @IsString() // 日期为字符串
  @IsNotEmpty() // 日期必填
  date: string; // 工作日期（YYYY-MM-DD）

  @IsString() // 标题为字符串
  @IsNotEmpty() // 标题必填
  title: string; // 工作标题

  @IsOptional() // 描述可选
  @IsString() // 描述为字符串
  description?: string; // 工作描述

  @IsString() // 优先级为字符串
  @IsIn(['high', 'medium', 'low']) // 限定取值
  priority: 'high' | 'medium' | 'low'; // 优先级

  @IsString() // 状态为字符串
  @IsIn(['todo', 'doing', 'done']) // 限定取值
  status: 'todo' | 'doing' | 'done'; // 状态

  @IsOptional() // 完成度可选
  @IsNumber() // 完成度为数字
  @Min(0) // 最小值 0
  @Max(100) // 最大值 100
  completion?: number; // 完成百分比

  @IsOptional() // 未完成事项可选
  @IsArray() // 为数组
  @IsString({ each: true }) // 每项为字符串
  incompleteItems?: string[]; // 未完成事项数组
} // 结束 DTO 定义



