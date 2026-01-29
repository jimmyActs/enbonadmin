import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tag?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tag?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

