import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
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
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import type { Request } from 'express';

@UseGuards(PermissionsGuard)
@Controller('company-files')
export class CompanyFilesController {
  constructor(
    private readonly companyFilesService: CompanyFilesService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 从请求中解析当前用户，用于按部门控制可见分类
   */
  private async getUserFromRequest(req: Request): Promise<any | null> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) return null;
      return user;
    } catch {
      return null;
    }
  }

  // 分类 ----------------------------------------------------

  @Get('categories')
  async findAllCategories(@Req() req: Request) {
    const categories = await this.companyFilesService.findAllCategories();

    // 默认：所有人都可以看到前 5 个分类
    const user = await this.getUserFromRequest(req);
    const role = user?.role;
    const department = user?.department;

    // 仅品牌管理中心（planning）和超级管理员可以看到 AI 资产库
    if (!user || (role !== 'super_admin' && department !== 'planning')) {
      return categories.filter((c) => c.key !== 'ai-assets');
    }

    return categories;
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


