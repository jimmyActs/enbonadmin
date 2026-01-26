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
    email: string;
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

