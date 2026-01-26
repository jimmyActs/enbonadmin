import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCompanyFileCategoryDto {
  @IsString()
  @MaxLength(64)
  key: string;

  @IsString()
  @MaxLength(100)
  nameZh: string;

  @IsString()
  @MaxLength(100)
  nameEn: string;

  @IsOptional()
  @IsString()
  descZh?: string;

  @IsOptional()
  @IsString()
  descEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsString()
  @MaxLength(128)
  folder: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateCompanyFileCategoryDto extends CreateCompanyFileCategoryDto {}


