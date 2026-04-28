import { defineStore } from 'pinia';
import { login } from '../api/auth';
import { refreshMyPermissions } from '../api/permissions';
import type { LoginRequest, LoginResponse } from '../api/auth';

interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  role: string;
  department: string | null;
  position: string | null;
  email: string;
  /** 权限码列表 */
  permissions?: string[];
  /** 是否超级管理员（包括系统身份和角色模板） */
  isSuperAdmin?: boolean;
  /** 可见模块列表 */
  visibleModules?: string[];
  /** 数据范围映射 */
  dataScopes?: Record<string, string>;
  /** 岗位编码 */
  positionCode?: string | null;
  /** 部门编码 */
  departmentCode?: string | null;
}

interface UserState {
  token: string | null;
  userInfo: UserInfo | null;
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token'),
    userInfo: safeJsonParse<UserInfo>(localStorage.getItem('user')),
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.userInfo?.nickname || state.userInfo?.username || '用户',

    /** 是否为超级管理员（包括系统身份和角色模板双重判定） */
    isSuperAdmin: (state) =>
      state.userInfo?.role === 'super_admin' || state.userInfo?.isSuperAdmin === true,

    /** 单一权限码检查（支持通配符匹配，如 hr.* 匹配 hr.recruitment.board.view） */
    hasPermission: (state) => (code: string): boolean => {
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.isSuperAdmin === true) return true;
      if (!state.userInfo?.permissions?.length) return false;
      return state.userInfo.permissions.some((p) => {
        if (p === '*') return true;
        if (p === code) return true;
        if (p.endsWith('.*')) {
          const prefix = p.slice(0, -2);
          return code.startsWith(prefix + '.') || code === prefix;
        }
        return false;
      });
    },

    /** 拥有所有指定权限码才返回 true */
    hasAllPermissions: (state) => (codes: string[]): boolean => {
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.isSuperAdmin === true) return true;
      if (!codes.length) return true;
      if (!state.userInfo?.permissions?.length) return false;
      return codes.every((code) => {
        const perms = state.userInfo?.permissions || [];
        return perms.some((p) => {
          if (p === '*' || p === code) return true;
          if (p.endsWith('.*')) {
            const prefix = p.slice(0, -2);
            return code.startsWith(prefix + '.') || code === prefix;
          }
          return false;
        });
      });
    },

    /** 拥有任一指定权限码就返回 true（支持通配符匹配） */
    hasAnyPermission: (state) => (codes: string[]): boolean => {
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.isSuperAdmin === true) return true;
      if (!codes.length) return true;
      if (!state.userInfo?.permissions?.length) return false;
      return codes.some((code) => {
        const perms = state.userInfo?.permissions || [];
        return perms.some((p) => {
          if (p === '*' || p === code) return true;
          if (p.endsWith('.*')) {
            const prefix = p.slice(0, -2);
            return code.startsWith(prefix + '.') || code === prefix;
          }
          return false;
        });
      });
    },

    /** 权限码列表（直接暴露） */
    permissions: (state): string[] => state.userInfo?.permissions || [],

    /** 可见模块列表 */
    visibleModules: (state): string[] => state.userInfo?.visibleModules || [],

    /** 数据范围映射 */
    dataScopes: (state): Record<string, string> => state.userInfo?.dataScopes || {},

    /** 检查是否可以访问某个模块 */
    canAccessModule: (state) => (moduleCode: string): boolean => {
      // 超级管理员可见全部模块
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.isSuperAdmin === true) return true;

      // 基础模块：所有登录用户都可见
      const baseModules = ['dashboard', 'workspace', 'workgroup', 'files'];
      if (baseModules.includes(moduleCode)) return true;

      // 主要检查：visibleModules 列表（由后端 PermissionEngineService 根据部门配置计算）
      const visible = state.userInfo?.visibleModules || [];
      if (visible.includes(moduleCode)) return true;

      // 回退检查：基于权限码推断模块权限
      // 例如：有 'hr.*' 权限 → 可访问 hr 模块
      const perms = state.userInfo?.permissions || [];
      const modulePermPrefix = moduleCode + '.';
      const hasModulePerm = perms.some((p) => {
        if (p === '*' || p === moduleCode) return true;
        if (p.startsWith(modulePermPrefix)) return true;
        if (p.endsWith('.*') && moduleCode.startsWith(p.slice(0, -2))) return true;
        return false;
      });
      if (hasModulePerm) return true;

      return false;
    },

    /** 检查用户是否在某模块有部门级或以上数据访问权限 */
    canAccessModuleData: (state) => (moduleCode: string): boolean => {
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.isSuperAdmin === true) return true;
      const scope = state.userInfo?.dataScopes?.[moduleCode];
      return scope === 'DEPARTMENT' || scope === 'ORG';
    },
  },

  actions: {
    async login(loginData: LoginRequest) {
      const response: LoginResponse = await login(loginData);
      this.token = response.access_token;
      this.userInfo = response.user;
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.userInfo));
      // 登录后立即从后端刷新完整权限上下文（包含 isSuperAdmin 和最新权限码列表）
      try {
        await this.refreshPermissions();
      } catch {
        // 刷新失败不影响登录
      }
      return response;
    },

    async logout() {
      this.token = null;
      this.userInfo = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },

    /**
     * 刷新当前用户的权限上下文
     * - 从后端获取最新的 isSuperAdmin + permissions + visibleModules + dataScopes
     * - 更新 Pinia store + localStorage
     * - 用于权限分配后无需重新登录即可生效
     */
    async refreshPermissions(): Promise<void> {
      try {
        const context = await refreshMyPermissions();
        if (this.userInfo) {
          // 替换整个 userInfo 对象，确保 Vue 响应式系统能检测到变化并触发菜单重新渲染
          this.userInfo = {
            id: this.userInfo.id,
            username: this.userInfo.username,
            nickname: this.userInfo.nickname,
            role: this.userInfo.role,
            department: this.userInfo.department,
            position: this.userInfo.position,
            email: this.userInfo.email,
            isSuperAdmin: context.isSuperAdmin,
            permissions: context.permissions,
            visibleModules: context.visibleModules,
            dataScopes: context.dataScopes,
            positionCode: context.positionCode,
            departmentCode: context.departmentCode,
          };
          localStorage.setItem('user', JSON.stringify(this.userInfo));
        }
      } catch (error) {
        console.error('刷新权限失败', error);
        throw error;
      }
    },

    /**
     * 从后端重新获取用户 Profile
     * 用于权限变更后同步用户信息
     */
    async fetchProfile(): Promise<void> {
      // 直接调用权限刷新接口，保持一致
      return this.refreshPermissions() as unknown as Promise<void>;
    },
  },
});
