import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store/user'
import i18n from '../i18n'

/** 路由 → 所需权限码（任一满足即可访问，留空表示所有登录用户可访问） */
const routePermissionMap: Record<string, string[]> = {
  '/employees': ['employee.manage.view'],
  '/hr': ['hr.recruitment.board.view', 'hr.attendance.view', 'hr.payroll.view', 'hr.performance.view'],
  '/sales': ['crm.customer.view', 'crm.lead.view', 'crm.stats.view'],
  '/finance': ['finance.*', 'finance.report.view.basic'],
  '/crm': ['crm.customer.view', 'crm.lead.view', 'crm.stats.view'],
  '/crm/team-dashboard': ['crm.stats.team', 'crm.stats.view', 'crm.*'],
  '/workflow': [],          // 仅超级管理员可见（由路由守卫 isSuperAdmin 控制）
  // 文件管理：所有登录用户可访问（留空 = 无需特定权限）
  '/files': [],
  '/permissions': [],      // 仅超级管理员可见（由路由守卫 isSuperAdmin 控制）
  '/workspace/company-files': ['workspace.companyFiles.view', 'workspace.companyFiles.manage'],
  '/workspace/software-downloads': ['workspace.software.view', 'workspace.software.manage'],
  '/workspace/company-culture': ['workspace.companyCulture.manage', 'hr.banner.manage'],
}

/** 路由 → 所需可见模块（用于菜单显示控制） */
const routeModuleMap: Record<string, string> = {
  '/crm': 'crm',
  '/sales': 'sales_workbench',
  '/hr': 'hr',
  '/finance': 'finance',
  '/employees': 'employees',
  '/permissions': 'permissions',
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { titleKey: 'login.title' }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../layout/MainLayout.vue'),
    redirect: '/index',
    children: [
      {
        path: '/index',
        name: 'Index',
        component: () => import('../views/Index.vue'),
        meta: { titleKey: 'layout.menu.home' }
      },
      {
        path: '/workspace',
        name: 'Workspace',
        component: () => import('../views/Workspace.vue'),
        meta: { titleKey: 'layout.menu.workspace' }
      },
      {
        path: '/workspace/company-culture',
        name: 'CompanyCulture',
        component: () => import('../views/CompanyCulture.vue'),
        meta: { titleKey: 'workspace.companyCulturePage.title', requiresAuth: true }
      },
      {
        path: '/workspace/company-files',
        name: 'CompanyFiles',
        component: () => import('../views/CompanyFiles.vue'),
        meta: { titleKey: 'workspace.companyFiles.title', requiresAuth: true }
      },
      {
        path: '/workspace/software-downloads',
        name: 'SoftwareDownloads',
        component: () => import('../views/SoftwareDownloads.vue'),
        meta: { titleKey: 'workspace.softwareDownloadsPage.title', requiresAuth: true }
      },
      {
        path: '/workgroup',
        name: 'WorkGroup',
        component: () => import('../views/WorkGroup.vue'),
        meta: { titleKey: 'layout.menu.workGroup' }
      },
      {
        path: '/files',
        name: 'Files',
        component: () => import('../views/Files.vue'),
        meta: { titleKey: 'layout.menu.files', requiresAuth: true }
      },
      {
        path: '/crm',
        name: 'CRM',
        component: () => import('../views/Crm.vue'),
        meta: { titleKey: 'layout.menu.crm', requiresAuth: true }
      },
      {
        path: '/crm/team-dashboard',
        name: 'CrmTeamDashboard',
        component: () => import('../views/CrmTeamDashboard.vue'),
        meta: {
          titleKey: 'layout.menu.crmTeamDashboard',
          requiresAuth: true,
        }
      },
      {
        path: '/finance',
        name: 'Finance',
        component: () => import('../views/Finance.vue'),
        meta: { titleKey: 'layout.menu.finance', requiresAuth: true }
      },
      {
        path: '/hr',
        name: 'HR',
        component: () => import('../views/Hr.vue'),
        meta: { titleKey: 'layout.menu.hr', requiresAuth: true }
      },
      {
        path: '/sales',
        name: 'Sales',
        component: () => import('../views/Sales.vue'),
        meta: { titleKey: 'layout.menu.sales', requiresAuth: true }
      },
      {
        path: '/workflow',
        name: 'Workflow',
        component: () => import('../views/Workflow.vue'),
        meta: { titleKey: 'layout.menu.workflow', requiresAuth: true }
      },
      {
        path: '/employees',
        name: 'Employees',
        component: () => import('../views/Employees.vue'),
        meta: { titleKey: 'layout.menu.employees', requiresAuth: true }
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue'),
        meta: { titleKey: 'layout.user.profile', requiresAuth: true }
      },
      {
        path: '/self-service',
        name: 'SelfService',
        component: () => import('../views/SelfService.vue'),
        meta: { titleKey: 'selfService.title', requiresAuth: true }
      },
      {
        path: '/permissions',
        name: 'PermissionCenter',
        component: () => import('../views/PermissionCenter.vue'),
        meta: { titleKey: 'layout.menu.permissions', requiresAuth: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: { titleKey: 'common.notFound' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 基于权限码检查
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const userStore = useUserStore()

  if (to.path === '/login') {
    if (token) {
      next('/')
    } else {
      next()
    }
    return
  }

  if (!token) {
    next('/login')
    return
  }

  if (to.meta.requiresAuth) {
    let userInfo = userStore.userInfo

    if (!userInfo) {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          userInfo = JSON.parse(userStr)
          userStore.userInfo = userInfo
        } catch (e) {
          console.error('Failed to parse user info:', e)
        }
      }
    }

    if (!userInfo) {
      ElMessage.warning(i18n.global.t('common.userInfoLoadFailed'))
      next('/login')
      return
    }

    // 超级管理员 bypass 所有路由权限检查（包括系统身份和角色模板双重判定）
    if (userStore.isSuperAdmin) {
      next()
      return
    }

    // 模块可见性检查（基于后端 PermissionEngineService 计算的 visibleModules）
    const requiredModule = routeModuleMap[to.path]
    if (requiredModule && !userStore.canAccessModule(requiredModule)) {
      ElMessage.warning(i18n.global.t('common.noModuleAccess'))
      next('/index')
      return
    }

    // 从路由权限映射表中查找该路由需要的权限
    const requiredCodes = routePermissionMap[to.path]

    // 没有配置权限要求的路由（如首页）→ 直接放行
    if (!requiredCodes) {
      next()
      return
    }

    // 任一权限码满足即可访问
    const hasAccess = userStore.hasAnyPermission(requiredCodes)

    if (!hasAccess) {
      ElMessage.warning(i18n.global.t('common.noPermission'))
      next('/index')
      return
    }
  }

  next()
})

export default router
