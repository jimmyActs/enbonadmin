import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (requiredPermissions.length === 0) {
      // 没有声明权限要求，直接放行
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException('缺少认证信息');
    }

    const token = authHeader.substring(7);
    let userId: number | undefined;
    let userRole: string | undefined;

    try {
      const payload: any = this.jwtService.verify(token);
      userId = payload.sub;
      userRole = payload.role;
    } catch {
      throw new ForbiddenException('无效的认证信息');
    }

    // 超级管理员账号默认拥有所有权限
    if (userRole === 'super_admin') {
      return true;
    }

    if (!userId) {
      throw new ForbiddenException('无效的认证信息');
    }

    const userPermissions = await this.permissionsService.getUserPermissions(userId);

    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException('没有执行该操作的权限');
    }

    return true;
  }
}


