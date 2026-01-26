import api from './config';

export interface Employee {
  id: number;
  username: string;
  employeeNumber?: string; // 员工编号
  nickname: string;
  chineseName?: string; // 中文名
  englishName?: string; // 英文名
  country?: string; // 国家
  city?: string; // 城市
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  position?: string;
  employmentStatus: 'active' | 'leave' | 'resigned' | 'suspended';
  hireDate?: string;
  school?: string;
  address?: string;
  avatar?: string; // 头像URL
  workStatus?: 'available' | 'busy' | 'away' | 'leave' | 'meeting' | 'offline'; // 工作状态
  mood?: string; // 心情
  lastLoginAt?: string; // 最后登录时间
  isActive: boolean;
  // 组织结构信息
  team?: string; // 小组/战区编码
  orgRoleType?: 'staff' | 'team_lead' | 'dept_manager'; // 组织职责类型
  directLeaderId?: number | null; // 直接上级用户ID
  // 公司分配账号信息（员工在个人信息中只读查看）
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  username: string;
  password: string;
  nickname: string;
  email?: string;
  phone?: string;
  role: 'super_admin' | 'department_head' | 'employee' | 'finance' | 'hr' | 'guest';
  department: 'planning' | 'sales' | 'tech' | 'finance' | 'hr' | 'domestic' | 'management';
  gender?: 'male' | 'female' | 'other';
  age?: number;
  position: string;
  employmentStatus?: 'active' | 'leave' | 'resigned' | 'suspended';
  hireDate?: string;
  school?: string;
  address?: string;
  // 组织结构信息（可选）
  team?: string;
  orgRoleType?: 'staff' | 'team_lead' | 'dept_manager';
  directLeaderId?: number;
  // 公司分配账号信息（仅人事/领导在后台配置）
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
}

export interface EmployeeStatistics {
  total: number;
  active: number;
  byDepartment: Array<{ department: string; count: number }>;
  byRole: Array<{ role: string; count: number }>;
  workStatus?: {
    away: number; // 出差人数
    awayDestinations: string[]; // 出差目的地列表
    leave: number; // 请假人数
    busy: number; // 忙碌人数
    meeting: number; // 会议中人数
    offline: number; // 离线人数
    available: number; // 空闲人数
    online: number; // 在线人数
  };
}

// 获取所有员工
export const getEmployees = (): Promise<Employee[]> => {
  return api.get('/employees');
};

// 获取员工统计信息
export const getEmployeeStatistics = (): Promise<EmployeeStatistics> => {
  return api.get('/employees/statistics');
};

// 根据部门获取员工
export const getEmployeesByDepartment = (department: string): Promise<Employee[]> => {
  return api.get(`/employees/department/${department}`);
};

// 按部门分组获取员工（用于工作群组）
export const getEmployeesGrouped = (): Promise<Record<string, Employee[]>> => {
  return api.get('/employees/grouped');
};

// 获取单个员工
export const getEmployee = (id: number): Promise<Employee> => {
  return api.get(`/employees/${id}`);
};

// 创建员工
export const createEmployee = (data: CreateEmployeeDto): Promise<Employee> => {
  return api.post('/employees', data);
};

// 更新员工
export const updateEmployee = (id: number, data: Partial<CreateEmployeeDto>): Promise<Employee> => {
  return api.put(`/employees/${id}`, data);
};

// 删除员工（软删除）
export const deleteEmployee = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/employees/${id}`);
};

