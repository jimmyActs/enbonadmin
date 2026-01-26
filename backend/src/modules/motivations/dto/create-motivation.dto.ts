import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMotivationDto {
  @IsString()
  @IsNotEmpty({ message: '内容文本不能为空' })
  text: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  textColor?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return 28;
    const num = parseInt(value, 10);
    return isNaN(num) ? 28 : Math.max(12, Math.min(72, num));
  })
  fontSize?: number;

  @IsString()
  @IsOptional()
  backgroundImage?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return true;
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  enabled?: boolean = true;
}

export class UpdateMotivationDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  textColor?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : Math.max(12, Math.min(72, num));
  })
  fontSize?: number;

  @IsString()
  @IsOptional()
  backgroundImage?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  enabled?: boolean;
}

