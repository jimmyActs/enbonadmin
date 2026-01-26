import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MaterialApplicationsService } from './material-applications.service';
import { CreateMaterialApplicationDto } from './dto/create-material-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Controller('material-applications')
export class MaterialApplicationsController {
  constructor(
    private readonly applicationsService: MaterialApplicationsService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  // 从请求中获取用户信息
  private async getUserFromRequest(req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authHeader.substring(7);
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      return user || null;
    } catch (error) {
      return null;
    }
  }

  // 检查是否为行政部
  private async isHRDepartment(user: any): Promise<boolean> {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.department === 'hr';
  }

  // 创建申请
  @Post()
  async create(@Body() createDto: CreateMaterialApplicationDto, @Request() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new ForbiddenException('未授权');
    }

    return this.applicationsService.create(
      createDto,
      user.id,
      user.nickname || user.username,
      user.department,
    );
  }

  // 获取我的申请记录（必须在 @Get() 之前，否则会被通用路由覆盖）
  @Get('my')
  async getMyApplications(@Request() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new ForbiddenException('未授权');
    }

    return this.applicationsService.findMyApplications(user.id);
  }

  // 获取所有申请记录（行政人员）
  @Get()
  async findAll(@Request() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new ForbiddenException('未授权');
    }

    const isHR = await this.isHRDepartment(user);
    if (!isHR) {
      throw new ForbiddenException('只有行政部人员可以查看所有申请记录');
    }

    return this.applicationsService.findAll();
  }

  // 更新申请状态（行政人员）
  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateApplicationStatusDto,
    @Request() req: any,
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new ForbiddenException('未授权');
    }

    const isHR = await this.isHRDepartment(user);
    if (!isHR) {
      throw new ForbiddenException('只有行政部人员可以处理申请');
    }

    return this.applicationsService.updateStatus(
      id,
      updateDto,
      user.id,
      user.nickname || user.username,
    );
  }
}

