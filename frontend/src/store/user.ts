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
}

interface UserState {
  token: string | null;
  userInfo: UserInfo | null;
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
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.userInfo?.nickname || state.userInfo?.username || '用户',
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

        return response;
      } catch (error) {
        console.error('登录失败:', error);
        throw error;
      }
    },

    logout() {
      this.token = null;
      this.userInfo = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

