import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, IsArray, Min, Max, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 试用期查询参数
 */
export class ProbationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}

/**
 * 创建试用期记录
 */
export class CreateProbationDto {
  @IsNumber()
  employeeId: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  reportRequired?: number = 4;

  @IsOptional()
  @IsString()
  kpiTargets?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warningTypes?: string[];
}

/**
 * 更新试用期记录
 */
export class UpdateProbationDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  reportRequired?: number;

  @IsOptional()
  @IsString()
  kpiTargets?: string;
}

/**
 * 添加试用期预警
 */
export class AddProbationWarningDto {
  @IsString()
  type: string;

  @IsString()
  content: string;
}

/**
 * 确认试用期结果
 */
export class ConfirmProbationDto {
  @IsBoolean()
  passed: boolean;

  @IsOptional()
  @IsString()
  comment?: string;
}

/**
 * 延期试用期
 */
export class ExtendProbationDto {
  @IsDateString()
  newEndDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
