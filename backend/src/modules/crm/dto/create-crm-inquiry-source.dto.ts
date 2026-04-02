import {
  IsString, IsOptional, IsInt, IsEnum, IsBoolean, MaxLength
} from 'class-validator';
import { WebsiteType } from '../entities/crm-inquiry-source.entity';

export class CreateCrmInquirySourceDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(WebsiteType)
  @IsOptional()
  websiteType?: WebsiteType;

  @IsString()
  @IsOptional()
  websiteUrl?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  apiEndpoint?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @IsString()
  @IsOptional()
  webhookSecret?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  autoFetch?: boolean;

  @IsInt()
  @IsOptional()
  fetchIntervalMinutes?: number;

  @IsString()
  @IsOptional()
  defaultCountry?: string;

  @IsString()
  @IsOptional()
  assignedDepartment?: string;

  @IsInt()
  @IsOptional()
  assignedToUserId?: number;

  @IsBoolean()
  @IsOptional()
  autoAssignEnabled?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
