import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsInt } from 'class-validator';
import { LeadSource, LeadPriority, LeadStatus } from '../entities/crm-lead.entity';

export class UpdateCrmLeadDto {
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

  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @IsString()
  @IsOptional()
  website?: string;

  @IsInt()
  @IsOptional()
  websiteId?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @IsOptional()
  declaredLost?: number;

  @IsString()
  @IsOptional()
  lostReason?: string;
}
