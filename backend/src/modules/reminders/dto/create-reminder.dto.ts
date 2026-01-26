import { IsNumber, IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateReminderDto {
  @IsNumber()
  @IsNotEmpty()
  targetUserId: number; // 目标用户ID

  @IsString()
  @IsNotEmpty()
  content: string; // 提醒内容

  @IsString()
  @IsOptional()
  memo?: string; // 备忘录

  @IsDateString()
  @IsNotEmpty()
  reminderTime: string; // 提醒时间（ISO格式）
}

