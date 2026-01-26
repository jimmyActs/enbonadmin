import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { AnnouncementType } from '../entities/announcement.entity';

export class CreateAnnouncementDto {
  @IsEnum(AnnouncementType)
  @IsNotEmpty()
  type: AnnouncementType; // 类型：公告或通知

  @IsString()
  @IsNotEmpty()
  title: string; // 标题

  @IsString()
  @IsNotEmpty()
  content: string; // 内容

  @IsDateString()
  @IsOptional()
  publishTime?: string; // 发布时间（可选，不传则立即发布）

  @IsDateString()
  @IsOptional()
  expireTime?: string; // 过期时间（可选）
}

