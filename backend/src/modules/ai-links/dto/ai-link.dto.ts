import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAiLinkDto {
  @IsString()
  @MaxLength(200)
  title: string;

  // 这里只做字符串校验，不强制 IsUrl，避免内部地址 / 带参数被拦截
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  account?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  password?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  // 所属文件夹路径（AI 资产库内部相对路径），根目录可为空
  @IsOptional()
  @IsString()
  @MaxLength(500)
  folderPath?: string;
}

export class UpdateAiLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  account?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  password?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  folderPath?: string;
}


