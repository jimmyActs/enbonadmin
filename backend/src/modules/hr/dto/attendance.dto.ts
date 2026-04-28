import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Min, Max, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../entities/hr-attendance.entity';

/**
 * 考勤记录查询参数
 */
export class AttendanceQueryDto {
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
  @IsNumber()
  employeeId?: number;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  keyword?: string;
}

/**
 * 创建考勤记录
 */
export class CreateAttendanceDto {
  @IsOptional()
  @IsNumber()
  employeeId?: number;

  @IsString()
  @MinLength(1)
  employeeName: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lateMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  earlyLeaveMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtimeMinutes?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

/**
 * 更新考勤记录
 */
export class UpdateAttendanceDto {
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lateMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  earlyLeaveMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtimeMinutes?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}
