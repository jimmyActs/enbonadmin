import api from './config';

// 上报当前用户心跳（保持在线）
export const sendHeartbeat = (): Promise<{ success: boolean }> => {
  return api.post('/online/heartbeat');
};

// 获取当前在线的用户ID列表
export const getOnlineUserIds = (): Promise<{ userIds: number[] }> => {
  return api.get('/online/list');
};


