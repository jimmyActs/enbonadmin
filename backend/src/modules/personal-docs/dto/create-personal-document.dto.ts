import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PersonalDocumentCategory } from '../entities/personal-document.entity';

export class CreatePersonalDocumentDto {
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PersonalDocumentCategory)
  @IsOptional()
  category?: PersonalDocumentCategory;

  @IsString()
  @IsOptional()
  tags?: string; // JSON 字符串或逗号分隔

  @IsString()
  @IsOptional()
  originalName?: string;
}


