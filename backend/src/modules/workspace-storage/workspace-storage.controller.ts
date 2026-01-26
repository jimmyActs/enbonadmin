import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { WorkspaceStorageService } from './workspace-storage.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('workspace-storage')
export class WorkspaceStorageController {
  constructor(private readonly service: WorkspaceStorageService) {}

  @Get('configs')
  @RequirePermissions('files.drive.manage') // 仅管理员可配置
  async getConfigs() {
    return this.service.findAll();
  }

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


