import api from './config';

export interface LoginRequest {
  username: string;
  password: string;
  remember?: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    nickname: string;
    role: string;
    department: string | null;
    position: string | null;
    email: string;
    /** 权限码列表，如 ['hr.payroll.view', 'hr.payroll.edit'] */
    permissions?: string[];
    /** 是否超级管理员 */
    isSuperAdmin?: boolean;
    /** 可见模块列表 */
    visibleModules?: string[];
    /** 数据范围映射 */
    dataScopes?: Record<string, string>;
    /** 岗位编码 */
    positionCode?: string | null;
    /** 部门编码 */
    departmentCode?: string | null;
  };
}

/**
 * 用户登录
 */
export const login = (data: LoginRequest): Promise<LoginResponse> => {
  return api.post('/auth/login', data);
};

/**
 * 用户登出
 */
export const logout = (): Promise<void> => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return Promise.resolve();
};
