import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  SUPER_ADMIN = 'super_admin', // 超级管理员
  DEPARTMENT_HEAD = 'department_head', // 部门领导
  EMPLOYEE = 'employee', // 普通员工
  HR_DIRECTOR = 'hr_director', // 行政总监
  HR_RECEPTION = 'hr_reception', // 行政前台
  FINANCE = 'finance', // 财务
  GUEST = 'guest', // 访客
  // 兼容旧数据，保留HR角色
  HR = 'hr', // 人事行政（已废弃，保留用于兼容）
}

export enum Department {
  PLANNING = 'planning', // 企划部
  SALES = 'sales', // 销售部
  TECH = 'tech', // 技术部
  FINANCE = 'finance', // 财务部
  HR = 'hr', // 人事行政
  DOMESTIC = 'domestic', // 国内区
  MANAGEMENT = 'management', // 总经办
}

export enum Gender {
  MALE = 'male', // 男
  FEMALE = 'female', // 女
  OTHER = 'other', // 其他
}

export enum EmploymentStatus {
  ACTIVE = 'active', // 在职
  LEAVE = 'leave', // 请假
  RESIGNED = 'resigned', // 离职
  SUSPENDED = 'suspended', // 停职
}

export enum WorkStatus {
  AVAILABLE = 'available', // 空闲
  BUSY = 'busy', // 忙碌
  AWAY = 'away', // 出差
  OVERSEAS = 'overseas', // 驻外（常驻国外办公）
  LEAVE = 'leave', // 请假
  MEETING = 'meeting', // 会议中
  OFFLINE = 'offline', // 离线
}

// 组织内职责类型，用于审批流和团队负责人识别
export enum OrgRoleType {
  STAFF = 'staff', // 普通成员
  TEAM_LEAD = 'team_lead', // 小组负责人
  DEPT_MANAGER = 'dept_manager', // 部门负责人
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true, nullable: true })
  employeeNumber: string; // 员工编号，格式：001, 002, ...

  @Column()
  password: string;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  chineseName: string; // 中文名

  @Column({ nullable: true })
  englishName: string; // 英文名

  @Column({ nullable: true })
  country: string; // 国家

  @Column({ nullable: true })
  city: string; // 城市

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'text',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @Column({
    type: 'text',
    enum: Department,
    nullable: true,
  })
  department: Department;

  @Column({ default: true })
  isActive: boolean;

  // 员工信息扩展字段
  @Column({
    type: 'text',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  position: string; // 职位/岗位

  @Column({
    type: 'text',
    enum: EmploymentStatus,
    default: EmploymentStatus.ACTIVE,
  })
  employmentStatus: EmploymentStatus;

  @Column({ type: 'date', nullable: true })
  hireDate: Date; // 入职时间

  @Column({ nullable: true })
  school: string; // 毕业院校

  @Column({ nullable: true })
  address: string; // 地址

  @Column({ nullable: true })
  avatar: string; // 头像URL

  @Column({
    type: 'text',
    nullable: true,
    default: WorkStatus.AVAILABLE,
  })
  workStatus: string; // 工作状态（支持格式：'away' 或 'away:目的地'）

  @Column({ nullable: true })
  mood: string; // 心情/个性签名

  // 组织结构扩展字段
  @Column({ nullable: true })
  team: string; // 所属小组/战区编码，例如 sales_japan_korea

  @Column({
    type: 'text',
    enum: OrgRoleType,
    default: OrgRoleType.STAFF,
  })
  orgRoleType: OrgRoleType; // 组织内职责类型（普通成员/小组负责人/部门负责人）

  @Column({ type: 'integer', nullable: true })
  directLeaderId: number | null; // 直接上级用户ID，用于汇报和审批流转

  // === 公司分配账号信息（仅人事/管理员可维护，员工只能查看） ===
  @Column({ nullable: true }) // VPN 登录账号
  vpnAccount: string; // VPN 登录账号

  @Column({ nullable: true }) // VPN 登录密码（当前为明文存储，后续可改为加密）
  vpnPassword: string; // VPN 登录密码

  @Column({ nullable: true }) // Facebook 公司账号
  facebookAccount: string; // Facebook 公司账号

  @Column({ nullable: true }) // Facebook 公司账号密码
  facebookPassword: string; // Facebook 公司账号密码

  @Column({ nullable: true }) // LinkedIn 公司账号
  linkedinAccount: string; // LinkedIn 公司账号

  @Column({ nullable: true }) // LinkedIn 公司账号密码
  linkedinPassword: string; // LinkedIn 公司账号密码

  @Column({ nullable: true }) // WhatsApp 公司账号
  whatsappAccount: string; // WhatsApp 公司账号

  @Column({ nullable: true }) // WhatsApp 公司账号密码
  whatsappPassword: string; // WhatsApp 公司账号密码

  @Column({ nullable: true }) // Instagram 公司账号
  instagramAccount: string; // Instagram 公司账号

  @Column({ nullable: true }) // Instagram 公司账号密码
  instagramPassword: string; // Instagram 公司账号密码

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date; // 最后登录时间

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

