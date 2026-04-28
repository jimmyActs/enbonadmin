import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * 审计日志实体
 * 记录用户在系统中的关键操作，用于安全审计和合规追踪
 */
@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['module', 'action'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  /** 用户ID */
  @Column({ type: 'integer', nullable: true })
  @Index()
  userId: number | null;

  /** 用户名（冗余存储，便于查询） */
  @Column({ nullable: true, length: 100 })
  userName: string;

  /** 操作模块，如 'crm', 'hr', 'users' */
  @Column({ nullable: true, length: 50 })
  @Index()
  module: string;

  /** 操作类型，如 'CREATE', 'UPDATE', 'DELETE', 'LOGIN' */
  @Column({ nullable: true, length: 50 })
  @Index()
  action: string;

  /** 操作描述，如 '创建客户', '更新商机' */
  @Column({ nullable: true, length: 500 })
  description: string;

  /** 资源类型，如 'customer', 'lead', 'attendance' */
  @Column({ nullable: true, length: 100 })
  resourceType: string;

  /** 资源ID */
  @Column({ type: 'integer', nullable: true })
  resourceId: number | null;

  /** 操作详情（JSON 格式），如 { before: {...}, after: {...} } */
  @Column({ type: 'text', nullable: true })
  details: string;

  /** 请求IP地址 */
  @Column({ nullable: true, length: 50 })
  ipAddress: string;

  /** 请求User-Agent */
  @Column({ nullable: true, length: 500 })
  userAgent: string;

  /** 请求路径 */
  @Column({ nullable: true, length: 500 })
  requestPath: string;

  /** HTTP 方法 */
  @Column({ nullable: true, length: 10 })
  requestMethod: string;

  /** 响应状态码 */
  @Column({ type: 'integer', nullable: true })
  statusCode: number | null;

  /** 执行时长（毫秒） */
  @Column({ type: 'integer', nullable: true })
  duration: number | null;

  /** 是否成功 */
  @Column({ type: 'boolean', default: true })
  success: boolean;

  /** 错误信息（如果失败） */
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}

/**
 * 审计操作类型枚举
 */
export enum AuditAction {
  // 认证相关
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',

  // 资源操作
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',

  // 业务流程
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SUBMIT = 'SUBMIT',
  CANCEL = 'CANCEL',

  // 权限相关
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  ROLE_CHANGE = 'ROLE_CHANGE',
}

/**
 * 审计模块枚举
 */
export enum AuditModule {
  AUTH = 'auth',
  USERS = 'users',
  CRM = 'crm',
  HR = 'hr',
  SALES = 'sales',
  PERMISSIONS = 'permissions',
  FILES = 'files',
  ANNOUNCEMENTS = 'announcements',
  REMINDERS = 'reminders',
  WORKSPACE = 'workspace',
}