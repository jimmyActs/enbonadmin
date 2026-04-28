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
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { Department } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PermissionEngineService } from '../permissions/permission-engine.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
    private readonly permissionEngineService: PermissionEngineService,
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
   * 检查权限：只有超级管理员、部门领导、行政总监、行政前台可以访问
   * 判定条件（满足任一即可）：
   * 1. 用户的 role 字段为 'super_admin'（系统身份）
   * 2. 用户绑定了 isSuperAdmin: true 的角色模板（权限身份）
   */
  private async canAccessEmployeeManagementEx(userId: number, role: string): Promise<boolean> {
    // 条件1：系统身份
    if (role === 'super_admin') {
      return true;
    }
    // 条件2：通过角色模板获得的超级管理员身份
    const isByTemplate = await this.permissionsService.isUserSuperAdmin(userId, role);
    if (isByTemplate) {
      return true;
    }
    // 部门领导、行政总监、行政前台可以访问
    return (
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

    if (!await this.canAccessEmployeeManagementEx(user.id, user.role)) {
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

    if (!await this.canAccessEmployeeManagementEx(user.id, user.role)) {
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

    if (!await this.canAccessEmployeeManagementEx(user.id, user.role)) {
      throw new UnauthorizedException('无权访问');
    }

    // 【关键修复】同步等待权限分配完成，避免员工创建后立即登录时权限尚未写入
    // 旧代码使用 .then() 异步执行，导致时序问题：员工创建后立即登录，权限还在插入中
    const newEmployee = await this.employeesService.create(createEmployeeDto);

    // 创建员工后，同步根据职位分配权限（必须等待写入完成才能返回）
    if (newEmployee.position) {
      try {
        await this.permissionEngineService.autoAssignRoleByPosition(
          newEmployee.id,
          newEmployee.position,
          newEmployee.department || '',
        );
      } catch (e) {
        // 权限分配失败时记录日志，但不影响员工创建成功
        console.warn('[EmployeesController.create] autoAssignRoleByPosition failed:', e.message);
      }
    }

    return newEmployee;
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

    if (!await this.canAccessEmployeeManagementEx(user.id, user.role)) {
      throw new UnauthorizedException('无权访问');
    }

    // 检查是否操作系统管理员账户
    const targetEmployee = await this.employeesService.findOne(id);
    if (targetEmployee.username === 'admin' && !(await this.canAccessEmployeeManagementEx(user.id, user.role))) {
      throw new UnauthorizedException('无权操作系统管理员账户');
    }

    const newPosition = updateData.position;
    const positionChanged = newPosition && newPosition !== targetEmployee.position;

    // 【关键修复】同步等待权限重新分配完成
    const updatedEmployee = await this.employeesService.update(id, updateData);

    // 如果职位变更，同步重新分配职位权限（必须等待完成才能返回）
    if (positionChanged && newPosition) {
      try {
        await this.permissionEngineService.autoAssignRoleByPosition(
          updatedEmployee.id,
          newPosition,
          updatedEmployee.department || '',
        );
      } catch (e) {
        console.warn('[EmployeesController.update] autoAssignRoleByPosition failed on position update:', e.message);
      }
    }

    return updatedEmployee;
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

    if (!await this.canAccessEmployeeManagementEx(user.id, user.role)) {
      throw new UnauthorizedException('无权访问');
    }

    // 检查是否操作系统管理员账户
    const targetEmployee = await this.employeesService.findOne(id);
    if (targetEmployee.username === 'admin' && !(await this.canAccessEmployeeManagementEx(user.id, user.role))) {
      throw new UnauthorizedException('无权操作系统管理员账户');
    }

    await this.employeesService.remove(id);
    return { success: true };
  }
}

