import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import * as crypto from 'crypto';

// AES-256-GCM 加密配置
const ENCRYPTION_KEY = process.env.PASSWORD_ENCRYPTION_KEY || 'development-key-32-bytes-long!!'; // 32 bytes
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * 加密敏感字段（公司账号密码等）
 * 使用 AES-256-GCM 模式，提供认证加密
 */
function encryptField(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    // 格式: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch {
    console.error('Encryption failed');
    return null;
  }
}

/**
 * 解密敏感字段
 */
function decryptField(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // 非加密格式（原数据），直接返回
      return encryptedText;
    }
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    // 尝试原值返回（兼容旧数据）
    return encryptedText;
  }
}

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
  GENERAL_OFFICE = 'general_office', // 总经办
  HR_CENTER = 'hr_center', // 人力资源中心
  FINANCE_CENTER = 'finance_center', // 财务管理中心
  BRAND_CENTER = 'brand_center', // 品牌管理中心
  DELIVERY_CENTER = 'delivery_center', // 交付管理中心
  RD_CENTER = 'rd_center', // 研发中心
  SALES_OPS = 'sales_ops', // 销售运营中心
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

  @Column({ unique: true, nullable: true })
  phone: string;

  /** 独立登录用户名（可独立于系统内显示名修改，需唯一） */
  @Column({ unique: true, nullable: true })
  loginUsername: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @Column({
    type: 'simple-enum',
    enum: Department,
    nullable: true,
  })
  department: Department;

  @Column({ default: true })
  isActive: boolean;

  // 员工信息扩展字段
  @Column({
    type: 'simple-enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  position: string; // 职位/岗位

  @Column({
    type: 'simple-enum',
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
    type: 'simple-enum',
    enum: OrgRoleType,
    default: OrgRoleType.STAFF,
  })
  orgRoleType: OrgRoleType; // 组织内职责类型（普通成员/小组负责人/部门负责人）

  @Column({ type: 'integer', nullable: true })
  directLeaderId: number | null; // 直接上级用户ID，用于汇报和审批流转

  // === 公司分配账号信息（仅人事/管理员可维护，员工只能查看） ===
  // 注意：所有密码字段已加密存储，使用 AES-256-GCM
  @Column({ nullable: true }) // VPN 登录账号
  vpnAccount: string;

  @Column({ nullable: true }) // VPN 登录密码（已加密存储）
  private _vpnPassword: string;

  @Column({ nullable: true }) // Facebook 公司账号
  facebookAccount: string;

  @Column({ nullable: true }) // Facebook 公司账号密码（已加密存储）
  private _facebookPassword: string;

  @Column({ nullable: true }) // LinkedIn 公司账号
  linkedinAccount: string;

  @Column({ nullable: true }) // LinkedIn 公司账号密码（已加密存储）
  private _linkedinPassword: string;

  @Column({ nullable: true }) // WhatsApp 公司账号
  whatsappAccount: string;

  @Column({ nullable: true }) // WhatsApp 公司账号密码（已加密存储）
  private _whatsappPassword: string;

  @Column({ nullable: true }) // Instagram 公司账号
  instagramAccount: string;

  @Column({ nullable: true }) // Instagram 公司账号密码（已加密存储）
  private _instagramPassword: string;

  // 加密字段 getter/setter
  set vpnPassword(value: string | null | undefined) {
    const encrypted = encryptField(value);
    this._vpnPassword = encrypted !== null ? encrypted : '';
  }
  get vpnPassword(): string {
    return this._vpnPassword || '';
  }

  set facebookPassword(value: string | null | undefined) {
    const encrypted = encryptField(value);
    this._facebookPassword = encrypted !== null ? encrypted : '';
  }
  get facebookPassword(): string {
    return this._facebookPassword || '';
  }

  set linkedinPassword(value: string | null | undefined) {
    const encrypted = encryptField(value);
    this._linkedinPassword = encrypted !== null ? encrypted : '';
  }
  get linkedinPassword(): string {
    return this._linkedinPassword || '';
  }

  set whatsappPassword(value: string | null | undefined) {
    const encrypted = encryptField(value);
    this._whatsappPassword = encrypted !== null ? encrypted : '';
  }
  get whatsappPassword(): string {
    return this._whatsappPassword || '';
  }

  set instagramPassword(value: string | null | undefined) {
    const encrypted = encryptField(value);
    this._instagramPassword = encrypted !== null ? encrypted : '';
  }
  get instagramPassword(): string {
    return this._instagramPassword || '';
  }

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date; // 最后登录时间

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

