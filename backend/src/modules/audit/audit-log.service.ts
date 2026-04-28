import { Injectable, Scope, Inject, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { AuditLog, AuditAction, AuditModule } from './entities/audit-log.entity';

export interface AuditLogData {
  userId?: number;
  userName?: string;
  module: string;
  action: string;
  description?: string;
  resourceType?: string;
  resourceId?: number;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
  statusCode?: number;
  duration?: number;
  success?: boolean;
  errorMessage?: string;
}

@Injectable({ scope: Scope.DEFAULT })
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  /**
   * 记录审计日志
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      const auditLog = this.auditLogRepo.create({
        userId: data.userId ?? null,
        userName: data.userName ?? 'System',
        module: data.module,
        action: data.action,
        description: data.description ?? '',
        resourceType: data.resourceType ?? null,
        resourceId: data.resourceId ?? null,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        requestPath: data.requestPath ?? null,
        requestMethod: data.requestMethod ?? null,
        statusCode: data.statusCode ?? null,
        duration: data.duration ?? null,
        success: data.success ?? true,
        errorMessage: data.errorMessage ?? null,
      } as DeepPartial<AuditLog>);

      await this.auditLogRepo.save(auditLog);
    } catch (error) {
      // 审计日志记录失败不应影响主业务
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * 记录登录日志
   */
  async logLogin(userId: number, userName: string, success: boolean, ipAddress?: string, errorMessage?: string): Promise<void> {
    await this.log({
      userId,
      userName,
      module: AuditModule.AUTH,
      action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
      description: success ? '用户登录成功' : '用户登录失败',
      ipAddress,
      success,
      errorMessage,
    });
  }

  /**
   * 记录资源操作
   */
  async logResourceOperation(
    userId: number,
    userName: string,
    module: AuditModule,
    action: AuditAction,
    resourceType: string,
    resourceId: number,
    description: string,
    details?: Record<string, any>,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userName,
      module,
      action,
      resourceType,
      resourceId,
      description,
      details,
      ipAddress,
      success: true,
    });
  }

  /**
   * 查询审计日志
   */
  async findLogs(params: {
    userId?: number;
    module?: string;
    action?: string;
    resourceType?: string;
    resourceId?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const { userId, module, action, resourceType, resourceId, startDate, endDate, page = 1, pageSize = 20 } = params;

    const qb = this.auditLogRepo.createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC');

    if (userId) qb.andWhere('log.userId = :userId', { userId });
    if (module) qb.andWhere('log.module = :module', { module });
    if (action) qb.andWhere('log.action = :action', { action });
    if (resourceType) qb.andWhere('log.resourceType = :resourceType', { resourceType });
    if (resourceId) qb.andWhere('log.resourceId = :resourceId', { resourceId });
    if (startDate) qb.andWhere('log.createdAt >= :startDate', { startDate });
    if (endDate) qb.andWhere('log.createdAt <= :endDate', { endDate });

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * 获取用户操作统计
   */
  async getUserActionStats(userId: number, days: number = 7): Promise<Record<string, number>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.auditLogRepo
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId = :userId', { userId })
      .andWhere('log.createdAt >= :startDate', { startDate })
      .groupBy('log.action')
      .getRawMany();

    return result.reduce((acc, item) => {
      acc[item.action] = parseInt(item.count, 10);
      return acc;
    }, {} as Record<string, number>);
  }
}