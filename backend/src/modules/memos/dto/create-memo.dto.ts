import { IsString, IsNotEmpty, IsOptional, IsIn, IsArray } from 'class-validator'; // 导入验证装饰器，用于请求体验证

export class CreateMemoDto { // 创建备忘录 DTO
  @IsString() // 标题为字符串
  @IsNotEmpty() // 标题必填
  title: string; // 备忘录标题

  @IsString() // 内容为字符串
  @IsNotEmpty() // 内容必填
  content: string; // 备忘录内容

  @IsString() // 分类为字符串
  @IsIn(['work', 'daily']) // 只能是 work 或 daily
  category: 'work' | 'daily'; // 备忘录分类

  @IsOptional() // 提醒时间可选
  @IsString() // 以字符串形式传递 ISO 时间
  reminderTime?: string; // 提醒时间字符串

  @IsOptional() // 提醒类型可选
  @IsIn(['once', 'daily', 'weekly']) // 限定值
  reminderType?: 'once' | 'daily' | 'weekly'; // 提醒类型

  @IsOptional() // 标签可选
  @IsArray() // 标签是数组
  @IsString({ each: true }) // 每个标签是字符串
  tags?: string[]; // 标签数组
}


