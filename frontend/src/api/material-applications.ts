import api from './config'

export interface MaterialApplication {
  id: number
  materialName: string
  category: string
  quantity: number
  unit: string
  urgency: 'normal' | 'urgent'
  reason: string
  expectedDate?: string
  remarks?: string
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
  applicantId: number
  applicantName: string
  applicantDepartment?: string
  handlerId?: number
  handlerName?: string
  handleTime?: string
  handleNotes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMaterialApplicationDto {
  materialName: string
  category: string
  quantity: number
  unit: string
  urgency: 'normal' | 'urgent'
  reason: string
  expectedDate?: string
  remarks?: string
}

export interface UpdateMaterialApplicationStatusDto {
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
  handleNotes?: string
}

// 获取我的申请记录
export const getMyApplications = (): Promise<MaterialApplication[]> => {
  return api.get('/material-applications/my')
}

// 获取所有申请记录（行政人员）
export const getAllApplications = (): Promise<MaterialApplication[]> => {
  return api.get('/material-applications')
}

// 创建申请
export const createMaterialApplication = (data: CreateMaterialApplicationDto): Promise<MaterialApplication> => {
  return api.post('/material-applications', data)
}

// 更新申请状态（行政人员）
export const updateApplicationStatus = (
  id: number,
  data: UpdateMaterialApplicationStatusDto
): Promise<MaterialApplication> => {
  return api.put(`/material-applications/${id}/status`, data)
}

