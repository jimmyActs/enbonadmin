import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('permissions')
@UseGuards(PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

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
  @Get('me')
  async getMyPermissions(@Req() req: any) {
    const user = req.user as { id?: number } | undefined;
    if (!user?.id) {
      throw new ForbiddenException('未登录或登录状态已失效');
    }
    const codes = await this.permissionsService.getUserPermissions(user.id);
    return { permissions: codes };
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
}


