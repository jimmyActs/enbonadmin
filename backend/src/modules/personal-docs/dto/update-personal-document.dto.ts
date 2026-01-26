import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PersonalDocumentCategory } from '../entities/personal-document.entity';

export class UpdatePersonalDocumentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PersonalDocumentCategory)
  @IsOptional()
  category?: PersonalDocumentCategory;

  @IsString()
  @IsOptional()
  tags?: string;
}


