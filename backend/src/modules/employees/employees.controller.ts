import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseIntPipe,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { Department } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('employees')
@UseGuards(PermissionsGuard)
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
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
      const user = await this.usersService.findById(payload.sub);
      return user;
    } catch {
      return null;
    }
  }

  /**
   * 检查权限：只有admin、部门领导、行政总监、行政前台可以访问
   */
  private canAccessEmployeeManagement(role: string): boolean {
    return (
      role === 'super_admin' ||
      role === 'department_head' ||
      role === 'hr_director' ||
      role === 'hr_reception' ||
      role === 'hr' // 兼容旧数据
    );
  }

  /**
   * 获取所有员工列表
   */
  @Get()
  @RequirePermissions('employee.manage.view')
  async findAll(@Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    if (!this.canAccessEmployeeManagement(user.role)) {
      throw new UnauthorizedException('无权访问');
    }

    return this.employeesService.findAll();
  }

  /**
   * 获取用于前端选择的基础员工列表（会议室参会人等）
   * 说明：
   * - 只返回基础字段（id / nickname / department / avatar / employmentStatus / workStatus）；
   * - 对所有已登录用户开放，不再要求员工管理权限；
   * - 避免暴露敏感账号和联系方式。
   */
  @Get('options/basic')
  async getBasicOptions(@Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    return this.employeesService.findAllBasicForOptions();
  }

  /**
   * 获取员工统计信息（工作群组需要，所有登录用户都可以访问）
   */
  @Get('statistics')
  async getStatistics(@Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    // 工作群组统计信息对所有登录用户开放
    return this.employeesService.getStatistics();
  }

  /**
   * 根据部门获取员工
   */
  @Get('department/:department')
  async findByDepartment(
    @Param('department') department: Department,
    @Req() req: any,
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    return this.employeesService.findByDepartment(department);
  }

  /**
   * 按部门分组获取员工（用于工作群组）
   */
  @Get('grouped')
  async getEmployeesByDepartment(@Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    return this.employeesService.getEmployeesByDepartment();
  }

  /**
   * 获取单个员工信息
   */
  @Get(':id')
  @RequirePermissions('employee.manage.view')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    if (!this.canAccessEmployeeManagement(user.role)) {
      throw new UnauthorizedException('无权访问');
    }

    return this.employeesService.findOne(id);
  }

  /**
   * 创建新员工
   */
  @Post()
  @RequirePermissions('employee.manage.create')
  async create(@Body() createEmployeeDto: CreateEmployeeDto, @Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    if (!this.canAccessEmployeeManagement(user.role)) {
      throw new UnauthorizedException('无权访问');
    }

    return this.employeesService.create(createEmployeeDto);
  }

  /**
   * 更新员工信息
   */
  @Put(':id')
  @RequirePermissions('employee.manage.update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateEmployeeDto> & { isActive?: boolean },
    @Req() req: any,
  ) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    if (!this.canAccessEmployeeManagement(user.role)) {
      throw new UnauthorizedException('无权访问');
    }

    // 检查是否操作系统管理员账户
    const targetEmployee = await this.employeesService.findOne(id);
    if (targetEmployee.username === 'admin' && user.role !== 'super_admin') {
      throw new UnauthorizedException('无权操作系统管理员账户');
    }

    return this.employeesService.update(id, updateData);
  }

  /**
   * 删除员工（软删除）
   */
  @Delete(':id')
  @RequirePermissions('employee.manage.delete')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    if (!this.canAccessEmployeeManagement(user.role)) {
      throw new UnauthorizedException('无权访问');
    }

    // 检查是否操作系统管理员账户
    const targetEmployee = await this.employeesService.findOne(id);
    if (targetEmployee.username === 'admin' && user.role !== 'super_admin') {
      throw new UnauthorizedException('无权操作系统管理员账户');
    }

    await this.employeesService.remove(id);
    return { success: true };
  }
}

