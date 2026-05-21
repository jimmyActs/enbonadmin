import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/permissions.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';
import { PermissionsService } from '../../modules/permissions/permissions.service';

/** 用户上下文（AuthGuard 注入，供 PermissionsGuard 和 Service 层使用） */
export interface UserContext {
  id: number;
  role: string;
  department?: string;
  position?: string;
  orgRoleType?: string;
  isSuperAdmin: boolean;
  /** 权限码列表（来自 RBAC 表） */
  permissions?: string[];
  /** 各权限码对应的 DataScope */
  dataScopes?: Record<string, string>;
}

/**
 * AuthGuard - JWT 身份验证守卫（全局）
 *
 * 工作流程：
 * 1. 若路由标记 @Public() → 跳过验证，直接返回 true
 * 2. 若无 Authorization Header → 抛出 Unauthorized（必须登录）
 * 3. 若 Token 无效/过期 → 抛 Unauthorized
 * 4. 若 Token 有效 → 查询用户权限，注入 request.userContext
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // === 1. @Public() 路由直接放行 ===
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;

    // === 2. 无 Token → 必须登录（抛出 401） ===
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录');
    }

    const token = authHeader.substring(7);

    let payload: {
      sub: number;
      role: string;
      department?: string;
      position?: string;
      orgRoleType?: string;
    };

    try {
      payload = this.jwtService.verify(token) as typeof payload;
    } catch {
      throw new UnauthorizedException('认证信息已过期，请重新登录');
    }

    // 超级管理员判断：满足任一即可
    // 1. JWT payload 的 role 为 super_admin（系统身份）
    // 2. 绑定了 isSuperAdmin: true 的角色模板（权限身份）
    const isByRole = payload.role === UserRole.SUPER_ADMIN;
    let isByTemplate = false;
    if (!isByRole) {
      try {
        isByTemplate = await this.permissionsService.isUserSuperAdmin(payload.sub, payload.role);
      } catch { /* ignore */ }
    }
    const isSuperAdmin = isByRole || isByTemplate;

    // === 3. 查询用户权限（合并 RBAC + PositionEngine） ===
    let permissions: string[] = [];
    try {
      if (isSuperAdmin) {
        permissions = await this.permissionsService.getAllPermissionCodes();
      } else {
        permissions = await this.permissionsService.getEffectivePermissionCodes(
          payload.sub,
          payload.position,
        );
      }
      console.log(`[AuthGuard] uid=${payload.sub} isSuperAdmin=${isSuperAdmin} permissions.length=${permissions.length}`, permissions.slice(0, 5));
    } catch (e) {
      console.error(`[AuthGuard] uid=${payload.sub} 查权限异常:`, e.message);
      if (!isSuperAdmin) {
        permissions = [];
      }
    }

    // === 4. 注入完整用户上下文 ===
    request.userContext = {
      id: payload.sub,
      role: payload.role,
      department: payload.department,
      position: payload.position,
      orgRoleType: payload.orgRoleType,
      isSuperAdmin,
      permissions,
    };

    return true;
  }
}
