import api, { getApiBaseURL } from './config';

export interface UserProfile {
  id: number;
  username: string;
  nickname: string;
  chineseName?: string;
  englishName?: string;
  country?: string;
  city?: string;
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  avatar?: string;
  workStatus?: 'available' | 'busy' | 'away' | 'overseas' | 'leave' | 'meeting' | 'offline';
  mood?: string;
  position?: string;
  // 公司分配账号信息（只读）
  vpnAccount?: string; // VPN 登录账号
  vpnPassword?: string; // VPN 登录密码
  facebookAccount?: string; // Facebook 公司账号
  facebookPassword?: string; // Facebook 公司账号密码
  linkedinAccount?: string; // LinkedIn 公司账号
  linkedinPassword?: string; // LinkedIn 公司账号密码
  whatsappAccount?: string; // WhatsApp 公司账号
  whatsappPassword?: string; // WhatsApp 公司账号密码
  instagramAccount?: string; // Instagram 公司账号
  instagramPassword?: string; // Instagram 公司账号密码
  [key: string]: any;
}

export interface UpdateProfileDto {
  workStatus?: string; // 支持格式：'away' 或 'away:目的地'（如 'away:日本'）
  mood?: string;
  chineseName?: string;
  englishName?: string;
  country?: string;
  city?: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

// 获取当前用户信息
export const getProfile = (): Promise<UserProfile> => {
  return api.get('/users/profile');
};

// 更新用户个人信息
export const updateProfile = (data: UpdateProfileDto): Promise<UserProfile> => {
  return api.put('/users/profile', data);
};

// 上传头像
export const uploadAvatar = (file: File): Promise<{ avatarUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 获取头像URL
export const getAvatarUrl = (avatarPath?: string): string => {
  if (!avatarPath) return '';
  const baseURL = (api.defaults.baseURL as string | undefined) || getApiBaseURL();
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  if (avatarPath.startsWith('/')) {
    // 如果路径已经包含 /api，直接拼接，否则添加 /api
    if (avatarPath.startsWith('/api')) {
      // 移除 /api 前缀，因为 baseURL 已经包含了
      const pathWithoutApi = avatarPath.replace(/^\/api/, '');
      return `${baseURL}${pathWithoutApi}`;
    }
    return `${baseURL}${avatarPath}`;
  }
  return `${baseURL}/users/avatar/${avatarPath}`;
};

// 修改密码
export const changePassword = (data: ChangePasswordDto): Promise<void> => {
  return api.put('/users/change-password', data);
};

