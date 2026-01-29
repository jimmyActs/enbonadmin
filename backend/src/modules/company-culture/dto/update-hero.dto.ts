import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHeroDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  vision?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  values?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slogan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  logoText?: string;

  @IsOptional()
  @IsString()
  logoImage?: string;
}


