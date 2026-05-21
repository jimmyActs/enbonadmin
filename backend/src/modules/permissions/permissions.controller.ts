import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Put, ForbiddenException, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionsService } from './permissions.service';
import { PermissionEngineService } from './permission-engine.service';
import { RequirePermissions, Public } from '../../common/decorators/permissions.decorator';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { forwardRef } from '@nestjs/common';
import { RolePermission } from './entities/role-permission.entity';

@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly permissionEngineService: PermissionEngineService,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
  ) {}

  /**
   * 获取全部角色模板列表
   */
  @Get('roles')
  @RequirePermissions('system.permission.view')
  async getRoles() {
    const roles = await this.permissionsService.getAllRoles();
    return roles;
  }

  /**
   * 【诊断端点】检查数据库里实际有哪些权限码
   * 任何人可访问，无需登录
   */
  @Get('debug/permissions')
  @RequirePermissions('system.permission.view')
  async debugPermissions() {
    const allPerms = await this.permissionsService.getAllPermissions();
    return {
      total: allPerms.length,
      codes: allPerms.map(p => ({ id: p.id, code: p.code, module: p.module })).sort((a, b) => a.id - b.id),
    };
  }

  /**
   * 【诊断端点】检查 hr_director_role 的实际权限
   * 任何人可访问，无需登录
   */
  @Get('debug/hr-director-perms')
  @RequirePermissions('system.permission.view')
  async debugHrDirectorPerms() {
    const allPerms = await this.permissionsService.getAllPermissions();
    const roles = await this.permissionsService.getAllRoles();
    const hrDirectorRole = roles.find(r => r.code === 'hr_director_role');
    if (!hrDirectorRole) return { error: 'hr_director_role not found' };

    const rolePerms = await this.rolePermissionRepo.find({ where: { roleId: hrDirectorRole.id } });
    const permIds = rolePerms.map(rp => rp.permissionId);
    const matchedPerms = allPerms.filter(p => permIds.includes(p.id));

    return {
      roleId: hrDirectorRole.id,
      roleName: hrDirectorRole.name,
      permissionCount: matchedPerms.length,
      permissions: matchedPerms.map(p => ({ id: p.id, code: p.code, module: p.module })).sort((a, b) => a.id - b.id),
    };
  }

  /**
   * 获取全部权限点列表（前端可据此构建权限树）
   */
  @Get('tree')
  @RequirePermissions('system.permission.view')
  async getPermissionTree() {
    const permissions = await this.permissionsService.getAllPermissions();
    return { permissions };
  }

  /**
   * 获取某个用户拥有的权限编码列表
   */
  @Get('user/:userId')
  @RequirePermissions('system.permission.view')
  async getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    const codes = await this.permissionsService.getUserPermissions(userId);
    return { permissions: codes };
  }

  /**
   * 获取当前登录用户自己的权限编码列表
   * - 给前端用于“当前账号按钮显示控制”，不要求具备 system.permission.view
   */
  @Public()
  @Get('me')
  async getMyPermissions(@Req() req: any) {
    const authHeader: string | undefined = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException('未登录或登录状态已失效');
    }

    const token = authHeader.substring(7);
    let userId: number | undefined;

    try {
      const payload: any = this.jwtService.verify(token);
      userId = payload.sub;
    } catch {
      throw new ForbiddenException('登录状态已失效，请重新登录');
    }

    if (!userId) {
      throw new ForbiddenException('未登录或登录状态已失效');
    }

    const codes = await this.permissionsService.getUserPermissions(userId);
    return { permissions: codes };
  }

  /**
   * 刷新当前登录用户的权限上下文
   * - 返回完整的权限信息：isSuperAdmin + permissions + visibleModules + dataScopes
   * - 用于权限分配后无需重新登录即可刷新权限
   * - 注意：此接口内部已手动验证 JWT，不依赖 AuthGuard
   */
  @Public()
  @Get('me/refresh')
  async refreshMyPermissions(@Req() req: any) {
    const authHeader: string | undefined = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException('未登录或登录状态已失效');
    }

    const token = authHeader.substring(7);
    let userId: number | undefined;
    let userRole: string | undefined;
    let department: string | undefined;
    let position: string | undefined;

    try {
      const payload: any = this.jwtService.verify(token);
      userId = payload.sub;
      userRole = payload.role;
      department = payload.department;
      position = payload.position;
    } catch {
      throw new ForbiddenException('登录状态已失效，请重新登录');
    }

    if (!userId) {
      throw new ForbiddenException('未登录或登录状态已失效');
    }

    // 获取 RBAC 权限码（来自 role_permissions 表）
    // 这确保 computeUserContext 始终有权限码可用，即使 PositionPermission 表为空
    const rbacContext = await this.permissionsService.getUserPermissionContext(userId, userRole);

    // 确保职位权限已分配（兜底：登录时已分配，这里确保数据一致）
    if (position) {
      try {
        await this.permissionEngineService.autoAssignRoleByPosition(userId, position, department || '');
      } catch { /* ignore */ }
    }

    // 计算可见模块和数据范围（传入 RBAC 权限码，确保菜单正确）
    const userContext = await this.permissionEngineService.computeUserContext({
      userId,
      positionCode: position || null,
      departmentCode: department || null,
      isSuperAdmin: rbacContext.isSuperAdmin,
    }, rbacContext.permissions);

    // 合并最终权限码：RBAC + PositionEngine（去重）
    const allPermissions = this.mergePermissionsList(rbacContext.permissions, userContext.permissions);

    // 诊断信息
    const diagnostic = {
      departmentModuleCount: await this.permissionEngineService.getDepartmentModuleCount(),
      hrCenterModuleExists: await this.permissionEngineService.checkDepartmentModule('hr_center', 'hr'),
      hrDirectorPermissionExists: await this.permissionEngineService.checkPositionPermission('hr_director'),
    };

    return {
      userId,
      role: userRole,
      isSuperAdmin: rbacContext.isSuperAdmin,
      permissions: allPermissions,
      visibleModules: userContext.visibleModules,
      dataScopes: userContext.dataScopes,
      positionCode: userContext.positionCode,
      departmentCode: userContext.departmentCode,
      // 诊断信息
      _diagnostic: diagnostic,
    };
  }

  /**
   * 合并两个权限码列表（去重）
   */
  private mergePermissionsList(a: string[], b: string[]): string[] {
    const set = new Set<string>(a);
    for (const c of b) set.add(c);
    return Array.from(set);
  }

  /**
   * 获取某个用户当前绑定的角色ID列表
   */
  @Get('user/:userId/roles')
  @RequirePermissions('system.permission.view')
  async getUserRoles(@Param('userId', ParseIntPipe) userId: number) {
    const roleIds = await this.permissionsService.getUserRoleIds(userId);
    return { roleIds };
  }

  /**
   * 为某个用户分配角色（覆盖式）
   */
  @Put('user/:userId/roles')
  @RequirePermissions('system.permission.assign')
  async assignRoles(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { roleIds: number[] },
  ) {
    await this.permissionsService.assignRolesToUser(userId, body.roleIds || []);
    return { success: true };
  }

  // ========== 部门和岗位配置接口 ==========

  /**
   * 获取所有部门列表
   */
  @Get('departments')
  @RequirePermissions('system.permission.view')
  async getDepartments() {
    const departments = await this.permissionEngineService.getAllDepartments();
    return { departments };
  }

  /**
   * 获取所有岗位列表
   */
  @Get('positions')
  @RequirePermissions('system.permission.view')
  async getPositions() {
    const positions = await this.permissionEngineService.getAllPositions();
    return { positions };
  }

  /**
   * 获取某部门的岗位列表
   */
  @Get('positions/department/:departmentCode')
  @RequirePermissions('system.permission.view')
  async getPositionsByDepartment(@Param('departmentCode') departmentCode: string) {
    const positions = await this.permissionEngineService.getPositionsByDepartment(departmentCode);
    return { positions };
  }

  /**
   * 诊断权限数据状态
   * - 检查部门配置、岗位配置、部门-模块映射、岗位-权限映射是否完整
   * - 如数据不完整，自动触发初始化
   */
  @Get('diagnostic')
  async diagnostic() {
    const result = {
      departmentModuleCount: 0,
      positionPermissionCount: 0,
      departmentConfigCount: 0,
      positionConfigCount: 0,
      hrCenterHasHrModule: false,
      hrDirectorHasHrPermission: false,
      initialized: false,
    };

    result.departmentModuleCount = await this.permissionEngineService.getDepartmentModuleCount();
    result.positionPermissionCount = await this.permissionEngineService.getPositionPermissionCount();
    result.departmentConfigCount = await this.permissionEngineService.getDepartmentConfigCount();
    result.positionConfigCount = await this.permissionEngineService.getPositionConfigCount();

    // 检查关键数据是否存在
    result.hrCenterHasHrModule = await this.permissionEngineService.checkDepartmentModule('hr_center', 'hr');
    result.hrDirectorHasHrPermission = await this.permissionEngineService.checkPositionPermission('hr_director');

    // 如果数据不完整，触发初始化
    if (result.departmentModuleCount === 0 || result.positionPermissionCount === 0) {
      await this.permissionEngineService.seedPositionAndDepartmentConfig();
    }

    // initialized: 数据已存在（无论是原本就有还是刚初始化）
    result.initialized = result.departmentModuleCount > 0 && result.positionPermissionCount > 0;

    return result;
  }

  /**
   * 诊断人资总监账号的权限状态
   * 返回该用户的详细权限信息，用于调试
   */
  @Get('diagnostic/hr-director')
  @RequirePermissions('system.permission.view')
  async diagnosticHrDirector() {
    // 查找人资总监用户
    const hrDirector = await this.usersService.findByUsername('hr_director');

    if (!hrDirector) {
      return { error: '人资总监用户不存在' };
    }

    const result = {
      user: {
        id: hrDirector.id,
        username: hrDirector.username,
        department: hrDirector.department,
        position: hrDirector.position,
        role: hrDirector.role,
      },
      computeContext: null as any,
      departmentModuleMappings: [] as any[],
      positionPermissions: [] as any[],
    };

    // 计算权限上下文（传入 RBAC 权限码）
    const rbacContext = await this.permissionsService.getUserPermissionContext(hrDirector.id, hrDirector.role);
    result.computeContext = await this.permissionEngineService.computeUserContext({
      userId: hrDirector.id,
      positionCode: hrDirector.position,
      departmentCode: hrDirector.department,
      isSuperAdmin: rbacContext.isSuperAdmin,
    }, rbacContext.permissions);

    // 查询 hr_center 的部门-模块映射
    result.departmentModuleMappings = await this.permissionEngineService.getDepartmentModules('hr_center');

    // 查询 hr_director 的岗位权限
    result.positionPermissions = await this.permissionEngineService.getPositionPermissionList('hr_director');

    return result;
  }

  /**
   * 诊断当前登录用户的权限状态
   */
  @Public()
  @Get('diagnostic/me')
  async diagnosticMe(@Req() req: any) {
    const authHeader: string | undefined = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException('未登录');
    }

    const token = authHeader.substring(7);
    let userId: number | undefined;
    let userRole: string | undefined;
    let department: string | undefined;
    let position: string | undefined;

    try {
      const payload: any = this.jwtService.verify(token);
      userId = payload.sub;
      userRole = payload.role;
      department = payload.department;
      position = payload.position;
    } catch {
      throw new ForbiddenException('登录状态已失效');
    }

    const user = userId ? await this.usersService.findById(userId) : null;

    const rbacContext = await this.permissionsService.getUserPermissionContext(userId!, userRole);
    const context = await this.permissionEngineService.computeUserContext({
      userId: userId!,
      positionCode: position || null,
      departmentCode: department || null,
      isSuperAdmin: rbacContext.isSuperAdmin,
    }, rbacContext.permissions);

    return {
      userId,
      user: user ? {
        id: user.id,
        username: user.username,
        department: user.department,
        position: user.position,
        role: user.role,
      } : null,
      jwt: { department, position, role: userRole },
      computedContext: context,
      rbacPermissions: rbacContext.permissions,
    };
  }

  /**
   * 强制重新初始化权限配置数据
   */
  @Post('reseed')
  @RequirePermissions('system.permission.manage')
  async reseed() {
    await this.permissionEngineService.seedPositionAndDepartmentConfig();
    return { success: true, message: '权限配置数据已重新初始化' };
  }
}


