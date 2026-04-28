import { Injectable, UnauthorizedException, Inject, forwardRef, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PermissionEngineService } from '../permissions/permission-engine.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  department?: string;
  position?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
    @Inject(forwardRef(() => PermissionEngineService))
    private readonly permissionEngineService: PermissionEngineService,
  ) {}

  /**
   * 用户登录（支持用户名、登录用户名、手机号登录）
   */
  async login(loginDto: LoginDto) {
    // 优先查找用户：支持 username / loginUsername / phone
    let user = await this.usersService.findByUsername(loginDto.username);

    // 如果没找到，尝试按 loginUsername 查找
    if (!user && loginDto.username) {
      user = await this.usersService.findByLoginUsername(loginDto.username);
    }

    // 如果还没找到，尝试按手机号查找
    if (!user && loginDto.username) {
      user = await this.usersService.findByPhone(loginDto.username);
    }

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账户已被禁用');
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await this.usersService.update(user.id, { lastLoginAt: user.lastLoginAt });

    // 如果用户还没有分配任何角色，自动根据其 role 字段分配对应的角色模板
    try {
      await this.permissionsService.autoAssignDefaultRoleByUserRole(user.id, user.role);
    } catch (e) {
      this.logger.warn('autoAssignDefaultRoleByUserRole failed: ' + e.message);
    }

    // 根据职位自动分配岗位权限（兜底：即使员工创建时没触发，登录时也会分配）
    if (user.position) {
      try {
        await this.permissionEngineService.autoAssignRoleByPosition(
          user.id,
          user.position,
          user.department || '',
        );
      } catch (e) {
        this.logger.warn('autoAssignRoleByPosition failed: ' + e.message);
      }
    }

    // 获取该用户的实际权限码列表（合并所有角色模板的权限）
    let permissions: string[] = [];
    try {
      permissions = await this.permissionsService.getUserEffectivePermissions(user.id);
    } catch (e) {
      this.logger.warn('getUserEffectivePermissions failed: ' + e.message);
    }

    let isSuperAdmin = false;
    try {
      isSuperAdmin = await this.permissionsService.isUserSuperAdmin(user.id, user.role);
    } catch (e) {
      this.logger.warn('isUserSuperAdmin failed: ' + e.message);
    }

    // 计算用户可见模块和数据范围（传入 RBAC 权限码，确保菜单正确）
    let userContext = { visibleModules: ['dashboard', 'workspace', 'workgroup', 'files'] as string[], dataScopes: {} as Record<string, string>, permissions: [] as string[] };
    try {
      userContext = await this.permissionEngineService.computeUserContext({
        userId: user.id,
        positionCode: user.position || null,
        departmentCode: user.department || null,
        isSuperAdmin,
      }, permissions);
    } catch (e) {
      this.logger.warn('computeUserContext failed: ' + e.message);
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      department: user.department,
      position: user.position,
    };

    const expiresIn = loginDto.remember === 'true' ? '7d' : '24h';
    const token = this.jwtService.sign(payload, { expiresIn });

    // 合并最终权限码：RBAC + PositionEngine
    const allPermissions = [...permissions, ...(userContext.permissions || [])];
    const uniquePermissions = [...new Set(allPermissions)];

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        loginUsername: user.loginUsername,
        nickname: user.nickname,
        role: user.role,
        department: user.department,
        position: user.position,
        email: user.email,
        phone: user.phone,
        isSuperAdmin,
        permissions: uniquePermissions, // 合并后的权限码列表
        visibleModules: userContext.visibleModules,
        dataScopes: userContext.dataScopes,
      },
    };
  }

  /**
   * 验证用户
   */
  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    return user;
  }
}
