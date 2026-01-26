import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, IsEmail, ValidateIf } from 'class-validator';
import { Department, Gender, EmploymentStatus, UserRole, OrgRoleType } from '../../users/entities/user.entity';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ValidateIf((o) => o.email && o.email.trim() !== '')
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsEnum(Department)
  @IsNotEmpty()
  department: Department;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsNumber()
  @IsOptional()
  age?: number;

  @IsString()
  @IsNotEmpty()
  position: string; // 职位/岗位

  @IsEnum(EmploymentStatus)
  @IsOptional()
  employmentStatus?: EmploymentStatus;

  // 组织结构相关（用于汇报/审批流）
  @IsString()
  @IsOptional()
  team?: string; // 所属小组/战区编码

  @IsEnum(OrgRoleType)
  @IsOptional()
  orgRoleType?: OrgRoleType; // 组织职责类型（普通成员/小组负责人/部门负责人）

  @IsNumber()
  @IsOptional()
  directLeaderId?: number; // 直接上级用户ID

  @IsDateString()
  @IsOptional()
  hireDate?: string; // 入职时间

  @IsString()
  @IsOptional()
  school?: string; // 毕业院校

  @IsString()
  @IsOptional()
  address?: string; // 地址

  // === 公司分配账号信息（仅人事/管理员在后台维护） ===
  @IsString() // VPN 登录账号（可选）
  @IsOptional() // 可选字段
  vpnAccount?: string; // VPN 登录账号

  @IsString() // VPN 登录密码（可选）
  @IsOptional() // 可选字段
  vpnPassword?: string; // VPN 登录密码

  @IsString() // Facebook 公司账号（可选）
  @IsOptional() // 可选字段
  facebookAccount?: string; // Facebook 公司账号

  @IsString() // Facebook 公司账号密码（可选）
  @IsOptional() // 可选字段
  facebookPassword?: string; // Facebook 公司账号密码

  @IsString() // LinkedIn 公司账号（可选）
  @IsOptional() // 可选字段
  linkedinAccount?: string; // LinkedIn 公司账号

  @IsString() // LinkedIn 公司账号密码（可选）
  @IsOptional() // 可选字段
  linkedinPassword?: string; // LinkedIn 公司账号密码

  @IsString() // WhatsApp 公司账号（可选）
  @IsOptional() // 可选字段
  whatsappAccount?: string; // WhatsApp 公司账号

  @IsString() // WhatsApp 公司账号密码（可选）
  @IsOptional() // 可选字段
  whatsappPassword?: string; // WhatsApp 公司账号密码

  @IsString() // Instagram 公司账号（可选）
  @IsOptional() // 可选字段
  instagramAccount?: string; // Instagram 公司账号

  @IsString() // Instagram 公司账号密码（可选）
  @IsOptional() // 可选字段
  instagramPassword?: string; // Instagram 公司账号密码
}

