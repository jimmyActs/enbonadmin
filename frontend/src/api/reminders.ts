import api from './config';

export interface Reminder {
  id: number;
  creatorId: number;
  targetUserId: number;
  content: string;
  memo?: string;
  reminderTime: string; // ISO date string
  isCompleted: boolean;
  isRead: boolean;
  isNotified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderDto {
  targetUserId: number;
  content: string;
  memo?: string;
  reminderTime: string; // ISO date string
}

// 创建提醒
export const createReminder = (data: CreateReminderDto): Promise<Reminder> => {
  return api.post('/reminders', data);
};

// 获取我的待办事项（提醒）
export const getMyTodos = (): Promise<Reminder[]> => {
  return api.get('/reminders/todos');
};

// 标记提醒为已读
export const markReminderAsRead = (id: number): Promise<Reminder> => {
  return api.put(`/reminders/${id}/read`);
};

// 标记提醒为已完成
export const markReminderAsCompleted = (id: number): Promise<Reminder> => {
  return api.put(`/reminders/${id}/complete`);
};

// 删除提醒
export const deleteReminder = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/reminders/${id}`);
};

