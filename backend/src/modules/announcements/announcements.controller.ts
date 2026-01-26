import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  ParseIntPipe,
  UnauthorizedException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserRole, Department } from '../users/entities/user.entity';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 从请求中获取用户信息
   */
  private async getUserFromRequest(req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return null;
    }
    try {
      const payload = this.jwtService.verify(token);
      return await this.usersService.findById(payload.sub);
    } catch {
      return null;
    }
  }

  /**
   * 创建公告/通知（仅限行政部前台和总监）
   */
  @Post()
  @RequirePermissions('hr.announcement.create')
  async create(@Body() createAnnouncementDto: CreateAnnouncementDto, @Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    return this.announcementsService.create(user.id, createAnnouncementDto);
  }

  /**
   * 获取所有有效的公告/通知（用于首页显示）
   */
  @Get('active')
  async getActiveAnnouncements(@Req() req: any) {
    const user = await this.getUserFromRequest(req);
    const userId = user?.id;
    return this.announcementsService.getActiveAnnouncements(userId);
  }

  /**
   * 获取所有公告/通知（管理用）
   */
  @Get()
  @RequirePermissions('hr.announcement.manage.all')
  async findAll(@Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    return this.announcementsService.findAll();
  }

  /**
   * 获取单个公告/通知
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.findOne(id);
  }

  /**
   * 更新公告/通知
   */
  @Put(':id')
  @RequirePermissions('hr.announcement.manage.all')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateAnnouncementDto>,
    @Req() req: any,
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    return this.announcementsService.update(id, updateData);
  }

  /**
   * 删除公告/通知（软删除）
   */
  @Delete(':id')
  @RequirePermissions('hr.announcement.manage.all')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    await this.announcementsService.remove(id);
    return { success: true };
  }

  /**
   * 标记公告为已读
   */
  @Put(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    return this.announcementsService.markAsRead(user.id, id);
  }

  /**
   * 批量标记公告为已读
   */
  @Post('read-all')
  async markAllAsRead(@Body() body: { announcementIds: number[] }, @Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    await this.announcementsService.markAllAsRead(user.id, body.announcementIds || []);
    return { success: true };
  }
}

