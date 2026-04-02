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
 * 2. 若无 Authorization Header → 返回 true（让 PermissionsGuard 统一拦截）
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

    // === 2. 无 Token → 不抛错，让 PermissionsGuard 统一处理 ===
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true;
    }

    const token = authHeader.substring(7);

    let payload: {
      sub: number;
      role: string;
      department?: string;
      orgRoleType?: string;
    };

    try {
      payload = this.jwtService.verify(token) as typeof payload;
    } catch {
      throw new UnauthorizedException('认证信息已过期，请重新登录');
    }

    const isSuperAdmin = payload.role === UserRole.SUPER_ADMIN;

    // === 3. 查询用户权限 ===
    let permissions: string[] = [];
    try {
      if (isSuperAdmin) {
        // 超级管理员：强制获取全部权限码
        permissions = await this.permissionsService.getAllPermissionCodes();
      } else {
        permissions = await this.permissionsService.getUserEffectivePermissions(payload.sub);
      }
    } catch {
      // 查权限失败时，超级管理员走 isSuperAdmin 路线放行，普通用户则 permissions = []
      if (!isSuperAdmin) {
        permissions = [];
      }
    }

    // === 4. 注入完整用户上下文 ===
    request.userContext = {
      id: payload.sub,
      role: payload.role,
      department: payload.department,
      orgRoleType: payload.orgRoleType,
      isSuperAdmin,
      permissions,
    };

    return true;
  }
}
