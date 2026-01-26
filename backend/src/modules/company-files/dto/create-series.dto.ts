import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCompanyFileSeriesDto {
  @IsString()
  @MaxLength(64)
  categoryKey: string;

  @IsString()
  @MaxLength(100)
  nameZh: string;

  @IsString()
  @MaxLength(100)
  nameEn: string;

  @IsString()
  @MaxLength(64)
  slug: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateCompanyFileSeriesDto extends CreateCompanyFileSeriesDto {}


