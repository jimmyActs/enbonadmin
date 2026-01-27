import api from './config';

export interface PermissionRole {
  id: number; // 角色ID
  code: string; // 角色编码
  name: string; // 角色名称
  description?: string; // 描述
  isSystem: boolean; // 是否系统内置
  isSuperAdmin: boolean; // 是否超级管理员模板
}

export interface PermissionItem {
  id: number;
  code: string;
  name: string;
  module: string;
}

// 获取某个用户拥有的权限编码列表（仅限后台管理使用）
export const getUserPermissions = (userId: number): Promise<{ permissions: string[] }> => {
  return api.get(`/permissions/user/${userId}`);
};

// 获取当前登录用户自己的权限编码列表（前端按钮显示用）
export const getMyPermissions = (): Promise<{ permissions: string[] }> => {
  return api.get('/permissions/me');
};

// 获取全部权限点
export const getAllPermissions = (): Promise<{ permissions: PermissionItem[] }> => {
  return api.get('/permissions/tree');
};

// 获取全部角色模板
export const getAllRoles = (): Promise<PermissionRole[]> => {
  return api.get('/permissions/roles');
};

// 获取某个用户当前绑定的角色ID列表
export const getUserRoles = (userId: number): Promise<{ roleIds: number[] }> => {
  return api.get(`/permissions/user/${userId}/roles`);
};

// 为某个用户分配角色
export const assignRolesToUser = (
  userId: number,
  roleIds: number[],
): Promise<{ success: boolean }> => {
  return api.put(`/permissions/user/${userId}/roles`, { roleIds });
};


