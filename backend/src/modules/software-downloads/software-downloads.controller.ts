import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SoftwareDownloadsService } from './software-downloads.service';
import { UpsertSoftwareMetadataDto } from './dto/upsert-metadata.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('software-downloads')
export class SoftwareDownloadsController {
  constructor(private readonly service: SoftwareDownloadsService) {}

  @Get('meta')
  async getMetadata(
    @Query('driveId') driveId: string,
    @Query('rootPath') rootPath: string,
  ) {
    return this.service.findAllForRoot(driveId, rootPath || 'software-downloads');
  }

  @Post('meta')
  @RequirePermissions('workspace.software.manage')
  async upsertMetadata(@Body() dto: UpsertSoftwareMetadataDto) {
    return this.service.upsert(dto);
  }
}


