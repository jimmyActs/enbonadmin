/**
 * 权限管理工具函数
 * 
 * ⚠️ 警告：此文件已弃用！
 * 
 * 本文件中的函数使用硬编码的角色检查（如 UserRole.SUPER_ADMIN, UserRole.HR_DIRECTOR 等），
 * 这是旧系统的做法，已不再推荐使用。
 * 
 * 新的权限系统基于后端 PermissionEngineService：
 * - visibleModules：由后端根据用户所属部门（departmentCode）计算
 * - permissions：由后端根据用户岗位（positionCode）计算
 * - dataScopes：数据范围（SELF/DEPARTMENT/ORG）
 * 
 * 前端应该使用 userStore 的方法：
 * - userStore.canAccessModule('crm')     → 检查模块可见性
 * - userStore.hasPermission('code')      → 检查权限码
 * - userStore.hasAnyPermission(codes)    → 任一权限码检查
 * - userStore.canAccessModuleData('crm') → 检查数据范围
 * 
 * 此文件仅保留用于兼容旧代码，后续会逐步移除。
 * @deprecated 请使用 useUserStore 的权限方法
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin', // 超级管理员
  DEPARTMENT_HEAD = 'department_head', // 部门领导
  EMPLOYEE = 'employee', // 普通员工
  HR_DIRECTOR = 'hr_director', // 行政总监
  HR_RECEPTION = 'hr_reception', // 行政前台
  FINANCE = 'finance', // 财务
  GUEST = 'guest', // 访客
  HR = 'hr', // 人事行政（兼容旧数据）
}

interface UserInfo {
  role: string;
  department?: string | null;
  position?: string;
}

/**
 * 检查是否可以访问人员管理
 */
export function canAccessEmployeeManagement(userInfo: UserInfo | null): boolean {
  if (!userInfo) return false;
  const role = userInfo.role;
  return (
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.DEPARTMENT_HEAD ||
    role === UserRole.HR_DIRECTOR ||
    role === UserRole.HR_RECEPTION ||
    role === UserRole.HR // 兼容旧数据
  );
}

/**
 * 检查是否可以发布公告/通知
 */
export function canPublishAnnouncement(userInfo: UserInfo | null): boolean {
  if (!userInfo) return false;
  const role = userInfo.role;
  
  // 超级管理员可以发布
  if (role === UserRole.SUPER_ADMIN) return true;
  
  // 行政总监和行政前台可以发布
  if (role === UserRole.HR_DIRECTOR || role === UserRole.HR_RECEPTION) return true;
  
  // 兼容旧数据：人力资源中心
  if (role === UserRole.HR && userInfo.department === 'hr_center') {
    const position = (userInfo.position || '').toLowerCase();
    return (
      position.includes('前台') ||
      position.includes('总监') ||
      position.includes('reception') ||
      position.includes('director') ||
      position.includes('行政') ||
      position.includes('admin')
    );
  }
  
  return false;
}

/**
 * 检查是否可以访问财务模块
 */
export function canAccessFinance(userInfo: UserInfo | null): boolean {
  if (!userInfo) return false;
  const role = userInfo.role;
  return (
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.FINANCE ||
    role === UserRole.DEPARTMENT_HEAD
  );
}

/**
 * 检查是否可以访问CRM模块
 */
export function canAccessCRM(userInfo: UserInfo | null): boolean {
  if (!userInfo) return false;
  const role = userInfo.role;
  // 超级管理员可以访问
  if (role === UserRole.SUPER_ADMIN) return true;
  // 其他角色通过 visibleModules 控制（由后端返回）
  return false;
}

/**
 * 检查是否可以访问文件管理
 */
export function canAccessFiles(userInfo: UserInfo | null): boolean {
  if (!userInfo) return false;
  const role = userInfo.role;
  // 访客只能查看，不能操作
  return role !== UserRole.GUEST;
}

/**
 * 检查是否可以访问销售管理
 */
export function canAccessSales(userInfo: UserInfo | null): boolean {
  if (!userInfo) return false;
  const role = userInfo.role;
  const department = userInfo.department;

  // 超级管理员、部门领导可以访问
  if (role === UserRole.SUPER_ADMIN || role === UserRole.DEPARTMENT_HEAD) {
    return true;
  }

  // 销售运营中心人员可以访问
  if (department === 'sales_ops') {
    return true;
  }

  return false;
}

/**
 * 检查是否可以访问人力资源部
 * 只有人力资源中心（department === 'hr_center'）或者 hr_director 角色的同事才能看到
 */
export function canAccessHR(userInfo: UserInfo | null): boolean {
  if (!userInfo) return false;
  const role = userInfo.role;
  const department = userInfo.department;

  // 超级管理员可以访问
  if (role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // HR总监角色可以访问
  if (role === UserRole.HR_DIRECTOR) {
    return true;
  }

  // 人力资源中心部门的同事可以访问
  if (department === 'hr_center') {
    return true;
  }

  return false;
}

/**
 * 获取角色显示名称
 */
export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    [UserRole.SUPER_ADMIN]: '超级管理员',
    [UserRole.DEPARTMENT_HEAD]: '部门领导',
    [UserRole.EMPLOYEE]: '普通员工',
    [UserRole.HR_DIRECTOR]: '行政总监',
    [UserRole.HR_RECEPTION]: '行政前台',
    [UserRole.FINANCE]: '财务',
    [UserRole.GUEST]: '访客',
    [UserRole.HR]: '人事行政',
  };
  return roleMap[role] || role;
}

/**
 * 工作空间模块类型
 */
export enum WorkspaceModule {
  // 通用模块
  MEMO = 'memo', // 备忘录
  DAILY_WORK = 'daily_work', // 每日工作
  WEEKLY_WORK = 'weekly_work', // 每周工作
  REQUEST_HELP = 'request_help', // 发布需求
  PERSONAL_DOCS = 'personal_docs', // 个人文档
  
  // 角色特定模块
  ADMIN_RECEPTION = 'admin_reception', // 行政前台
  ADMIN_RECRUITER = 'admin_recruiter', // 行政招聘
  SALES = 'sales', // 销售
  ANNOUNCEMENT = 'announcement', // 公告发布
  EVENT_PLANNING = 'event_planning', // 活动策划
}

/**
 * 检查是否可以访问工作空间模块
 */
export function canAccessWorkspaceModule(module: WorkspaceModule, userInfo: UserInfo | null): boolean {
  if (!userInfo) return false;
  const role = userInfo.role;
  const position = (userInfo.position || '').toLowerCase();
  
  // 通用模块：所有登录用户都可以访问
  if (
    module === WorkspaceModule.MEMO ||
    module === WorkspaceModule.DAILY_WORK ||
    module === WorkspaceModule.WEEKLY_WORK ||
    module === WorkspaceModule.REQUEST_HELP ||
    module === WorkspaceModule.PERSONAL_DOCS
  ) {
    return role !== UserRole.GUEST;
  }
  
  // 公告发布：行政总监、行政前台
  if (module === WorkspaceModule.ANNOUNCEMENT) {
    return canPublishAnnouncement(userInfo);
  }
  
  // 行政前台模块
  if (module === WorkspaceModule.ADMIN_RECEPTION) {
    return (
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.HR_RECEPTION ||
      (role === UserRole.HR && position.includes('前台'))
    );
  }
  
  // 行政招聘模块
  if (module === WorkspaceModule.ADMIN_RECRUITER) {
    return (
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.HR_DIRECTOR ||
      role === UserRole.HR_RECEPTION ||
      (role === UserRole.HR && (position.includes('招聘') || position.includes('recruiter')))
    );
  }
  
  // 销售模块
  if (module === WorkspaceModule.SALES) {
    return (
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.DEPARTMENT_HEAD ||
      role === UserRole.EMPLOYEE ||
      (userInfo.department === 'sales_ops')
    );
  }
  
  return false;
}

/**
 * 获取用户可访问的工作空间模块列表
 */
export function getAvailableWorkspaceModules(userInfo: UserInfo | null): WorkspaceModule[] {
  if (!userInfo) return [];
  
  const modules: WorkspaceModule[] = [];
  
  // 检查每个模块
  Object.values(WorkspaceModule).forEach(module => {
    if (canAccessWorkspaceModule(module, userInfo)) {
      modules.push(module);
    }
  });
  
  return modules;
}

