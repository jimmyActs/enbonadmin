import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'required_permissions';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// ============================================================
// @Public() 装饰器：标记路由不需要身份验证（AuthGuard 跳过）
// ============================================================
export const IS_PUBLIC_KEY = 'is_public';

/**
 * 标记为公开接口，跳过 AuthGuard 身份验证
 * 用于登录、公告浏览等无需认证的接口
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
