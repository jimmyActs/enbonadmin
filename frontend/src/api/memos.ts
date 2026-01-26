import api from './config'; // 导入通用 api 实例

export interface Memo { // 备忘录接口类型
  id: number; // 备忘录 ID
  title: string; // 标题
  content: string; // 内容
  category: 'work' | 'daily'; // 分类
  reminderTime?: string | null; // 提醒时间（ISO 字符串）
  reminderType?: 'once' | 'daily' | 'weekly' | null; // 提醒类型
  tags?: string[]; // 标签数组
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

export interface CreateOrUpdateMemoDto { // 创建 / 更新 DTO
  title: string; // 标题
  content: string; // 内容
  category: 'work' | 'daily'; // 分类
  reminderTime?: string; // 提醒时间
  reminderType?: 'once' | 'daily' | 'weekly'; // 提醒类型
  tags?: string[]; // 标签数组
}

export const getMyMemos = (): Promise<Memo[]> => { // 获取当前用户的全部备忘录
  return api.get('/memos'); // GET /memos
}; // 结束函数

export const createMemo = (data: CreateOrUpdateMemoDto): Promise<Memo> => { // 创建备忘录
  return api.post('/memos', data); // POST /memos
}; // 结束函数

export const updateMemo = (id: number, data: CreateOrUpdateMemoDto): Promise<Memo> => { // 更新备忘录
  return api.put(`/memos/${id}`, data); // PUT /memos/:id
}; // 结束函数

export const deleteMemo = (id: number): Promise<{ success: boolean }> => { // 删除备忘录
  return api.delete(`/memos/${id}`); // DELETE /memos/:id
}; // 结束函数


