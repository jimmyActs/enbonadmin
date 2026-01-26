import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CompanyFilesService } from './company-files.service';
import {
  CreateCompanyFileCategoryDto,
  UpdateCompanyFileCategoryDto,
} from './dto/create-category.dto';
import {
  CreateCompanyFileSeriesDto,
  UpdateCompanyFileSeriesDto,
} from './dto/create-series.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('company-files')
export class CompanyFilesController {
  constructor(private readonly companyFilesService: CompanyFilesService) {}

  // 分类 ----------------------------------------------------

  @Get('categories')
  findAllCategories() {
    return this.companyFilesService.findAllCategories();
  }

  @Post('categories')
  @RequirePermissions('workspace.companyFiles.manage')
  createCategory(@Body() dto: CreateCompanyFileCategoryDto) {
    return this.companyFilesService.createCategory(dto);
  }

  @Put('categories/:id')
  @RequirePermissions('workspace.companyFiles.manage')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyFileCategoryDto,
  ) {
    return this.companyFilesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @RequirePermissions('workspace.companyFiles.manage')
  removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.companyFilesService.removeCategory(id);
  }

  // 系列 ----------------------------------------------------

  @Get('series')
  findSeries(@Query('categoryKey') categoryKey?: string) {
    return this.companyFilesService.findSeries(categoryKey);
  }

  @Post('series')
  @RequirePermissions('workspace.companyFiles.manage')
  createSeries(@Body() dto: CreateCompanyFileSeriesDto) {
    return this.companyFilesService.createSeries(dto);
  }

  @Put('series/:id')
  @RequirePermissions('workspace.companyFiles.manage')
  updateSeries(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyFileSeriesDto,
  ) {
    return this.companyFilesService.updateSeries(id, dto);
  }

  @Delete('series/:id')
  @RequirePermissions('workspace.companyFiles.manage')
  removeSeries(@Param('id', ParseIntPipe) id: number) {
    return this.companyFilesService.removeSeries(id);
  }
}


