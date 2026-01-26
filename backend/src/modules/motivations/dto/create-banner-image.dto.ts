import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBannerImageDto {
  @IsString()
  @IsNotEmpty({ message: '图片URL不能为空' })
  url: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return true;
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  enabled?: boolean = true;
}

export class UpdateBannerImageDto {
  @IsString()
  @IsOptional()
  url?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  enabled?: boolean;
}

