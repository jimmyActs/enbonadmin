import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { WorkspaceStorageService } from './workspace-storage.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('workspace-storage')
export class WorkspaceStorageController {
  constructor(private readonly service: WorkspaceStorageService) {}

  /**
   * 读取工作空间存储配置
   *
   * 注意：这里不再做权限点限制，任何已登录用户都可以读取配置，
   * 这样普通员工在「公司文件 / 公司文化 / 软件下载」页面也能拿到正确的盘符和根目录，
   * 只在更新（PUT）时做管理员权限控制。
   */
  @Get('configs')
  async getConfigs() {
    return this.service.findAll();
  }

  /**
   * 更新工作空间存储配置
   * 仅具有 files.drive.manage 权限的管理员可以修改
   */
  @Put('configs')
  @RequirePermissions('files.drive.manage')
  async updateConfigs(
    @Body()
    body: { configs: Array<{ moduleKey: string; driveId: string; rootPath: string }> },
  ) {
    await this.service.upsertConfigs(body.configs || []);
    return { success: true };
  }
}


