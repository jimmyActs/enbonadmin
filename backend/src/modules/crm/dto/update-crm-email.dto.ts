import { IsString, IsOptional, IsInt, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { EmailDirection, EmailImportance } from '../entities/crm-email.entity';

export class UpdateCrmEmailDto {
  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  fromEmail?: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsString()
  @IsOptional()
  toRecipients?: string;

  @IsString()
  @IsOptional()
  ccRecipients?: string;

  @IsString()
  @IsOptional()
  bodyHtml?: string;

  @IsString()
  @IsOptional()
  bodyText?: string;

  @IsInt()
  @IsOptional()
  customerId?: number;

  @IsInt()
  @IsOptional()
  ownerId?: number;

  @IsEnum(EmailDirection)
  @IsOptional()
  direction?: EmailDirection;

  @IsEnum(EmailImportance)
  @IsOptional()
  importance?: EmailImportance;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsBoolean()
  @IsOptional()
  isStarred?: boolean;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsDateString()
  @IsOptional()
  emailDate?: string;
}
