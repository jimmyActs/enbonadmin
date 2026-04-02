import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/permissions.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserContext } from './auth.guard';

/**
 * PermissionGuard - 权限码检查守卫
 *
 * 工作流程：
 * 1. 若路由标记 @Public() → 跳过，直接放行
 * 2. 从 request.userContext 读取 AuthGuard 已注入的 permissions
 * 3. userContext 不存在 → 抛出 403（说明 AuthGuard 没有处理该请求）
 * 4. super_admin → 跳过，直接放行（AuthGuard 已标记 isSuperAdmin）
 * 5. requiredPermissions.every() 全匹配才放行，任一缺失则拒绝
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() 路由跳过权限检查
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    // 路由没有声明任何权限码要求 → 放行（由 AuthGuard 控制身份验证）
    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userContext: UserContext | undefined = request.userContext;

    // userContext 不存在 → AuthGuard 未处理，说明请求未通过身份验证
    if (!userContext) {
      throw new ForbiddenException('用户上下文未初始化，请重新登录');
    }

    // 超级管理员跳过权限码检查
    if (userContext.isSuperAdmin) {
      return true;
    }

    const userPermissions = userContext.permissions || [];

    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `权限不足，需要: ${requiredPermissions.join('、')}`,
      );
    }

    return true;
  }
}
