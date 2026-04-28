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

// 用户权限上下文（刷新接口返回）
export interface UserPermissionContext {
  userId: number;
  role: string;
  isSuperAdmin: boolean;
  permissions: string[];
  visibleModules?: string[];
  dataScopes?: Record<string, string>;
  positionCode?: string | null;
  departmentCode?: string | null;
}

// 部门配置
export interface DepartmentConfig {
  id: number;
  code: string;
  name: string;
  nameEn?: string;
  parentCode?: string;
  managerId?: number;
  isActive: boolean;
  sortOrder: number;
}

// 岗位配置
export interface PositionConfig {
  id: number;
  code: string;
  name: string;
  nameEn?: string;
  departmentCode: string;
  level: number;
  isLeadership: boolean;
  sortOrder: number;
  isActive: boolean;
}

// 获取某个用户拥有的权限编码列表（仅限后台管理使用）
export const getUserPermissions = (userId: number): Promise<{ permissions: string[] }> => {
  return api.get(`/permissions/user/${userId}`);
};

// 获取当前登录用户自己的权限编码列表（前端按钮显示用）
export const getMyPermissions = (): Promise<{ permissions: string[] }> => {
  return api.get('/permissions/me');
};

// 刷新当前登录用户的权限上下文（无需重新登录）
export const refreshMyPermissions = (): Promise<UserPermissionContext> => {
  return api.get('/permissions/me/refresh');
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

// 获取所有部门列表
export const getDepartments = (): Promise<{ departments: DepartmentConfig[] }> => {
  return api.get('/permissions/departments');
};

// 获取所有岗位列表
export const getPositions = (): Promise<{ positions: PositionConfig[] }> => {
  return api.get('/permissions/positions');
};

// 获取某部门的岗位列表
export const getPositionsByDepartment = (departmentCode: string): Promise<{ positions: PositionConfig[] }> => {
  return api.get(`/permissions/positions/department/${departmentCode}`);
};


