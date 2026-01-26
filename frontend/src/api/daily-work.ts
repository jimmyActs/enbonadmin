import api from './config'; // 导入通用 api 实例

export interface DailyWork { // 每日工作记录接口类型
  id: number; // 记录 ID
  date: string; // 工作日期（YYYY-MM-DD）
  title: string; // 标题
  description?: string | null; // 描述
  priority: 'high' | 'medium' | 'low'; // 优先级
  status: 'todo' | 'doing' | 'done'; // 状态
  completion: number; // 完成度 0-100
  incompleteItems?: string[]; // 未完成事项数组
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
} // 结束 DailyWork 接口

export interface CreateOrUpdateDailyWorkDto { // 创建 / 更新 DTO
  date: string; // 工作日期
  title: string; // 标题
  description?: string; // 描述
  priority: 'high' | 'medium' | 'low'; // 优先级
  status: 'todo' | 'doing' | 'done'; // 状态
  completion?: number; // 完成度
  incompleteItems?: string[]; // 未完成事项数组
} // 结束 DTO 接口

export const getMyDailyWorks = (date: string): Promise<DailyWork[]> => { // 获取当前用户某天的每日工作列表
  return api.get('/daily-works', { params: { date } }); // GET /daily-works?date=xxxx-xx-xx
}; // 结束函数

export const createDailyWork = (data: CreateOrUpdateDailyWorkDto): Promise<DailyWork> => { // 创建每日工作
  return api.post('/daily-works', data); // POST /daily-works
}; // 结束函数

export const updateDailyWork = (id: number, data: CreateOrUpdateDailyWorkDto): Promise<DailyWork> => { // 更新每日工作
  return api.put(`/daily-works/${id}`, data); // PUT /daily-works/:id
}; // 结束函数

export const deleteDailyWork = (id: number): Promise<{ success: boolean }> => { // 删除每日工作
  return api.delete(`/daily-works/${id}`); // DELETE /daily-works/:id
}; // 结束函数



