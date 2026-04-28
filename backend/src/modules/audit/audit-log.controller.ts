import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('audit')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('logs')
  @RequirePermissions('audit.view')
  async getLogs(
    @Query('userId') userId?: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.auditLogService.findLogs({
      userId: userId ? parseInt(userId, 10) : undefined,
      module,
      action,
      resourceType,
      resourceId: resourceId ? parseInt(resourceId, 10) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  @Get('user-stats')
  @RequirePermissions('audit.view')
  async getUserStats(@Query('userId') userId: string, @Query('days') days?: string) {
    return this.auditLogService.getUserActionStats(
      parseInt(userId, 10),
      days ? parseInt(days, 10) : 7,
    );
  }
}