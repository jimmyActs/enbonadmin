import {
  IsString, IsOptional, IsInt, IsEnum, IsDateString, MaxLength, IsBoolean, IsNumber
} from 'class-validator';
import { Transform } from 'class-transformer';
import { LeadSource, LeadPriority } from '../entities/crm-lead.entity';

export class CreateCrmLeadDto {
  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsEnum(LeadSource)
  @IsOptional()
  source?: LeadSource;

  @IsString()
  @IsOptional()
  sourceDetail?: string;

  @IsString()
  @IsOptional()
  inquiryContent?: string;

  @IsEnum(LeadPriority)
  @IsOptional()
  priority?: LeadPriority;

  @IsInt()
  @IsOptional()
  assignedTo?: number;

  @IsString()
  @IsOptional()
  website?: string;

  @IsInt()
  @IsOptional()
  websiteId?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
