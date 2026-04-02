import {
  IsString, IsOptional, IsInt, IsEnum, IsNumber, MaxLength
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TargetPeriod, TargetStatus } from '../entities/crm-sales-target.entity';

export class CreateCrmSalesTargetDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  title?: string;

  @IsInt()
  @IsOptional()
  salesId?: number;

  @IsEnum(TargetPeriod)
  @IsOptional()
  period?: TargetPeriod;

  @IsInt()
  @IsOptional()
  year?: number;

  @IsInt()
  @IsOptional()
  quarter?: number;

  @IsInt()
  @IsOptional()
  month?: number;

  @IsNumber()
  @IsOptional()
  targetAmount?: number;

  @IsNumber()
  @IsOptional()
  targetRevenue?: number;

  @IsInt()
  @IsOptional()
  targetCustomers?: number;

  @IsInt()
  @IsOptional()
  actualCustomers?: number;

  @IsEnum(TargetStatus)
  @IsOptional()
  status?: TargetStatus;

  @IsString()
  @IsOptional()
  reviewComment?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
