import { IsString, IsOptional, IsInt, IsEnum, IsNumber } from 'class-validator';
import { TargetPeriod, TargetStatus } from '../entities/crm-sales-target.entity';

export class UpdateCrmSalesTargetDto {
  @IsString()
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
  achievedAmount?: number;

  @IsNumber()
  @IsOptional()
  targetRevenue?: number;

  @IsNumber()
  @IsOptional()
  achievedRevenue?: number;

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
  notes?: string;
}
