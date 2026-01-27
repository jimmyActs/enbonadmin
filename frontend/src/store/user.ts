import { defineStore } from 'pinia';
import { login } from '../api/auth';
import type { LoginRequest, LoginResponse } from '../api/auth';
import { getUserPermissions } from '../api/permissions';

interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  role: string;
  department: string | null;
  email: string;
}

interface UserState {
  token: string | null;
  userInfo: UserInfo | null;
  permissions: string[];
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (e) {
    console.warn('localStorage JSON解析失败，已忽略该值:', e);
    return null;
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token'),
    userInfo: safeJsonParse<UserInfo>(localStorage.getItem('user')),
    permissions: [],
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.userInfo?.nickname || state.userInfo?.username || '用户',
    hasPermission: (state) => (code: string) => state.permissions.includes(code),
  },

  actions: {
    async login(loginData: LoginRequest) {
      try {
        const response: LoginResponse = await login(loginData);
        this.token = response.access_token;
        this.userInfo = response.user;

        // 保存到localStorage
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.userInfo));

         // 登录成功后加载当前用户的权限点（仅用于前端按钮显示控制，真正校验仍由后端完成）
         await this.loadPermissions();

        return response;
      } catch (error) {
        console.error('登录失败:', error);
        throw error;
      }
    },

    async loadPermissions() {
      if (!this.userInfo) return;
      try {
        const res = await getUserPermissions(this.userInfo.id);
        this.permissions = res.permissions || [];
      } catch (e) {
        console.warn('加载权限失败，已忽略，仅影响前端按钮显示:', e);
      }
    },

    logout() {
      this.token = null;
      this.userInfo = null;
      this.permissions = [];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

