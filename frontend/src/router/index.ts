import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store/user'
import i18n from '../i18n'
import {
  canAccessEmployeeManagement,
  canAccessHR,
  canAccessSales,
  canAccessFinance,
  canAccessCRM,
  canAccessFiles
} from '../utils/permissions'

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

// 路由守卫 - 增强权限检查
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const userStore = useUserStore()
  
  // 登录页处理
  if (to.path === '/login') {
    if (token) {
      next('/')
    } else {
      next()
    }
    return
  }
  
  // 检查是否登录
  if (!token) {
    next('/login')
    return
  }
  
  // 检查路由权限
  if (to.meta.requiresAuth) {
    let userInfo = userStore.userInfo
    
    // 如果用户信息未加载，尝试从localStorage加载
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
    
    const currentUserInfo = userInfo
    
    if (!currentUserInfo) {
      ElMessage.warning(i18n.global.t('common.userInfoLoadFailed'))
      next('/login')
      return
    }
    
    // 根据路由路径检查权限
    let hasPermission = false
    
    if (to.path === '/employees') {
      hasPermission = canAccessEmployeeManagement(currentUserInfo)
    } else if (to.path === '/hr') {
      hasPermission = canAccessHR(currentUserInfo)
    } else if (to.path === '/sales') {
      hasPermission = canAccessSales(currentUserInfo)
    } else if (to.path === '/finance') {
      hasPermission = canAccessFinance(currentUserInfo)
    } else if (to.path === '/crm') {
      // 小满CRM：目前仅对超级管理员开放
      hasPermission = canAccessCRM(currentUserInfo)
    } else if (to.path === '/workflow') {
      // 智能工作流：目前仅对超级管理员开放
      hasPermission = currentUserInfo.role === 'super_admin'
    } else if (to.path === '/files') {
      hasPermission = canAccessFiles(currentUserInfo)
    } else if (to.path === '/workspace/company-files') {
      // 公司文件暂时沿用文件管理访问权限
      hasPermission = canAccessFiles(currentUserInfo)
    } else if (to.path === '/workspace/software-downloads') {
      // 软件下载也沿用文件管理权限
      hasPermission = canAccessFiles(currentUserInfo)
    } else if (to.path === '/profile') {
      // 个人设置所有登录用户都可以访问
      hasPermission = true
    } else if (to.path === '/permissions') {
      // 权限管理中心：仅超级管理员可以访问
      hasPermission = currentUserInfo.role === 'super_admin'
    } else {
      // 其他路由默认允许
      hasPermission = true
    }
    
    if (!hasPermission) {
      ElMessage.warning(i18n.global.t('common.noPermission'))
      next('/index')
      return
    }
  }
  
  next()
})

export default router

