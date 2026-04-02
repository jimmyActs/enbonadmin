import { defineStore } from 'pinia';
import { login } from '../api/auth';
import type { LoginRequest, LoginResponse } from '../api/auth';

interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  role: string;
  department: string | null;
  email: string;
  /** 权限码列表 */
  permissions?: string[];
}

interface UserState {
  token: string | null;
  userInfo: UserInfo | null;
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token'),
    userInfo: safeJsonParse<UserInfo>(localStorage.getItem('user')),
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.userInfo?.nickname || state.userInfo?.username || '用户',

    /** 是否为超级管理员 */
    isSuperAdmin: (state) => state.userInfo?.role === 'super_admin',

    /** 单一权限码检查 */
    hasPermission: (state) => (code: string): boolean => {
      // 超级管理员拥有所有权限
      if (state.userInfo?.role === 'super_admin') return true;
      if (!state.userInfo?.permissions?.length) return false;
      return state.userInfo.permissions.includes(code);
    },

    /** 拥有所有指定权限码才返回 true */
    hasAllPermissions: (state) => (codes: string[]): boolean => {
      if (state.userInfo?.role === 'super_admin') return true;
      if (!state.userInfo?.permissions?.length) return false;
      return codes.every((code) => state.userInfo!.permissions!.includes(code));
    },

    /** 拥有任一指定权限码就返回 true */
    hasAnyPermission: (state) => (codes: string[]): boolean => {
      if (state.userInfo?.role === 'super_admin') return true;
      if (!state.userInfo?.permissions?.length) return false;
      return codes.some((code) => state.userInfo!.permissions!.includes(code));
    },

    /** 权限码列表（直接暴露） */
    permissions: (state): string[] => state.userInfo?.permissions || [],
  },

  actions: {
    async login(loginData: LoginRequest) {
      const response: LoginResponse = await login(loginData);
      this.token = response.access_token;
      this.userInfo = response.user;
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.userInfo));
      return response;
    },

    logout() {
      this.token = null;
      this.userInfo = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});
