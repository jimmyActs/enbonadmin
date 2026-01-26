import api from './config';

export enum AnnouncementType {
  ANNOUNCEMENT = 'announcement', // 公司公告
  NOTICE = 'notice', // 通知
  INDUSTRY_NEWS = 'industry_news', // 行业新闻
  EVENT = 'event', // 活动
}

export interface Announcement {
  id: number;
  creatorId: number;
  type: AnnouncementType;
  title: string;
  content: string;
  isActive: boolean;
  publishTime: string; // ISO date string
  expireTime?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
  isRead?: boolean; // 是否已读（从后端获取时包含）
  isSystem?: boolean; // 是否是系统管理员发布的（从后端获取时包含）
}

export interface CreateAnnouncementDto {
  type: AnnouncementType;
  title: string;
  content: string;
  publishTime?: string; // ISO date string
  expireTime?: string; // ISO date string
}

// 创建公告/通知
export const createAnnouncement = (data: CreateAnnouncementDto): Promise<Announcement> => {
  return api.post('/announcements', data);
};

// 获取所有有效的公告/通知（用于首页显示）
export const getActiveAnnouncements = (): Promise<Announcement[]> => {
  return api.get('/announcements/active');
};

// 获取所有公告/通知（管理用）
export const getAllAnnouncements = (): Promise<Announcement[]> => {
  return api.get('/announcements');
};

// 获取单个公告/通知
export const getAnnouncement = (id: number): Promise<Announcement> => {
  return api.get(`/announcements/${id}`);
};

// 更新公告/通知
export const updateAnnouncement = (id: number, data: Partial<CreateAnnouncementDto>): Promise<Announcement> => {
  return api.put(`/announcements/${id}`, data);
};

// 删除公告/通知
export const deleteAnnouncement = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/announcements/${id}`);
};

// 标记公告为已读
export const markAnnouncementAsRead = (id: number): Promise<any> => {
  return api.put(`/announcements/${id}/read`);
};

// 批量标记公告为已读
export const markAllAnnouncementsAsRead = (announcementIds: number[]): Promise<{ success: boolean }> => {
  return api.post('/announcements/read-all', { announcementIds });
};

