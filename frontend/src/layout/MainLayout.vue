<template>
  <el-container class="layout-container" :class="{ 'is-mobile': isMobile }">
    <!-- 侧边栏 -->
    <el-aside
      :width="isCollapse ? '64px' : '240px'"
      class="aside-container"
      :class="{ 'is-collapsed': isCollapse, 'is-open': !isCollapse }"
    >
      <div class="logo">
        <span v-if="!isCollapse">{{ $t('layout.appName') }}</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/index">
          <el-icon><HomeFilled /></el-icon>
          <template #title>{{ $t('layout.menu.home') }}</template>
        </el-menu-item>
        <el-menu-item index="/workspace">
          <el-icon><Briefcase /></el-icon>
          <template #title>{{ $t('layout.menu.workspace') }}</template>
        </el-menu-item>
        <el-menu-item index="/workgroup">
          <el-icon><UserFilled /></el-icon>
          <template #title>{{ $t('layout.menu.workGroup') }}</template>
        </el-menu-item>
        <el-menu-item 
          v-if="canAccessFilesComputed"
          index="/files"
        >
          <el-icon><FolderOpened /></el-icon>
          <template #title>{{ $t('layout.menu.files') }}</template>
        </el-menu-item>
        <el-menu-item 
          v-if="canAccessCRMComputed"
          index="/crm"
        >
          <el-icon><User /></el-icon>
          <template #title>{{ $t('layout.menu.crm') }}</template>
        </el-menu-item>
        <el-menu-item 
          v-if="canAccessFinanceComputed"
          index="/finance"
        >
          <el-icon><Money /></el-icon>
          <template #title>{{ $t('layout.menu.finance') }}</template>
        </el-menu-item>
        <el-menu-item 
          v-if="canAccessHRComputed"
          index="/hr"
        >
          <el-icon><OfficeBuilding /></el-icon>
          <template #title>{{ $t('layout.menu.hr') }}</template>
        </el-menu-item>
        <el-menu-item 
          v-if="canAccessSalesComputed"
          index="/sales"
        >
          <el-icon><TrendCharts /></el-icon>
          <template #title>{{ $t('layout.menu.sales') }}</template>
        </el-menu-item>
        <el-menu-item 
          v-if="isSuperAdmin"
          index="/workflow"
        >
          <el-icon><Document /></el-icon>
          <template #title>{{ $t('layout.menu.workflow') }}</template>
        </el-menu-item>
        <el-menu-item 
          v-if="canAccessEmployeeManagementComputed"
          index="/employees"
        >
          <el-icon><Avatar /></el-icon>
          <template #title>{{ $t('layout.menu.employees') }}</template>
        </el-menu-item>
        <!-- 权限管理中心，仅超级管理员可见 -->
        <el-menu-item 
          v-if="isSuperAdmin"
          index="/permissions"
        >
          <el-icon><Document /></el-icon>
          <template #title>{{ $t('layout.menu.permissions') }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部栏 -->
      <el-header class="header-container">
        <div class="header-left">
          <el-icon @click="toggleCollapse" class="collapse-icon">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <LanguageSwitcher />
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-icon><User /></el-icon>
              <span>{{ userName || $t('layout.user.userName') }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">{{ $t('layout.user.profile') }}</el-dropdown-item>
                <el-dropdown-item command="logout" divided>{{ $t('layout.user.logout') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主要内容 -->
      <el-main class="main-container">
        <!-- 面包屑导航 -->
        <el-breadcrumb separator="/" class="page-breadcrumb" v-if="breadcrumbs.length > 0">
          <el-breadcrumb-item :to="{ path: '/' }">
            <el-icon><HomeFilled /></el-icon>
            <span>{{ $t('layout.menu.index') || '首页' }}</span>
          </el-breadcrumb-item>
          <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="item.path ? { path: item.path } : undefined">
            {{ item.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>

        <router-view v-slot="{ Component, route }">
          <transition name="fade-slide">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <!-- 移动端侧边栏遮罩层 -->
    <div
      v-if="isMobile && !isCollapse"
      class="sidebar-overlay"
      @click="toggleCollapse"
    />
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  HomeFilled,
  FolderOpened,
  User,
  Money,
  OfficeBuilding,
  Document,
  Fold,
  Expand,
  ArrowDown,
  Briefcase,
  UserFilled,
  Avatar,
  TrendCharts
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store/user'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import { sendHeartbeat } from '../api/online'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

const isCollapse = ref(false)
const isMobile = ref(false)

const activeMenu = computed(() => route.path)
const userName = computed(() => userStore.userName)

// 权限控制：菜单是否显示
// 统一使用 userStore.isSuperAdmin，与路由守卫保持一致
const isSuperAdmin = computed(() => userStore.isSuperAdmin)

// 面包屑导航：根据当前路由生成面包屑
const breadcrumbs = computed(() => {
  const crumbs: { title: string; path?: string }[] = []
  const { path } = route

  // 根据路径匹配生成面包屑
  const pathMap: Record<string, { title: string; parent?: string }> = {
    '/index': { title: '首页' },
    '/workspace': { title: '工作空间' },
    '/workgroup': { title: '工作小组' },
    '/files': { title: '文件管理' },
    '/crm': { title: 'CRM管理' },
    '/crm/team-dashboard': { title: '团队看板', parent: '/crm' },
    '/sales': { title: '销售工作台' },
    '/hr': { title: '人力资源' },
    '/employees': { title: '人员管理' },
    '/permissions': { title: '权限中心' },
    '/workflow': { title: '工作流' },
  }

  const enMap: Record<string, { title: string; parent?: string }> = {
    '/index': { title: 'Home' },
    '/workspace': { title: 'Workspace' },
    '/workgroup': { title: 'Work Group' },
    '/files': { title: 'Files' },
    '/crm': { title: 'CRM' },
    '/crm/team-dashboard': { title: 'Team Dashboard', parent: '/crm' },
    '/sales': { title: 'Sales' },
    '/hr': { title: 'HR' },
    '/employees': { title: 'Employees' },
    '/permissions': { title: 'Permissions' },
    '/workflow': { title: 'Workflow' },
  }

  const isZh = !route.path.startsWith('/en')
  const map = isZh ? pathMap : enMap

  for (const [p, info] of Object.entries(map)) {
    if (path === p || path.startsWith(p + '/')) {
      if (info.parent) {
        const parent = map[info.parent]
        if (parent) crumbs.push({ title: parent.title, path: info.parent })
      }
      crumbs.push({ title: info.title, path: p })
      break
    }
  }

  return crumbs
})

// 超级管理员 bypass 所有菜单权限检查
// 新增：根据 visibleModules 模块可见性动态控制
const canAccessEmployeeManagementComputed = computed(() =>
  isSuperAdmin.value || userStore.canAccessModule('employees')
)
const canAccessFinanceComputed = computed(() =>
  isSuperAdmin.value || userStore.canAccessModule('finance')
)
const canAccessCRMComputed = computed(() =>
  isSuperAdmin.value || userStore.canAccessModule('crm')
)
// 文件管理：使用统一的 canAccessModule('files') 检查，与权限体系一致
const canAccessFilesComputed = computed(() =>
  isSuperAdmin.value || userStore.canAccessModule('files')
)
const canAccessSalesComputed = computed(() =>
  isSuperAdmin.value || userStore.canAccessModule('sales_workbench')
)
const canAccessHRComputed = computed(() =>
  isSuperAdmin.value || userStore.canAccessModule('hr')
)

let heartbeatTimer: ReturnType<typeof setInterval> | null = null

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout()
    ElMessage.success(t('layout.logoutSuccess'))
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}

let resizeHandler: (() => void) | null = null

// 预加载常用页面 chunk（避免首次切换“等加载”的卡顿感）
onMounted(async () => {
  // 页面加载时强制刷新权限数据，避免 localStorage 中残留的旧数据导致菜单错误
  try {
    await userStore.refreshPermissions()
  } catch {
    // 静默忽略
  }

  const handleResize = () => {
    isMobile.value = window.innerWidth <= 768
    if (isMobile.value) {
      // 移动端默认折叠侧边栏，避免内容区被压缩太窄
      isCollapse.value = true
    }
  }
  handleResize()
  window.addEventListener('resize', handleResize)
  resizeHandler = handleResize

  const preload = () => {
    void import('../views/Index.vue')
    void import('../views/Workspace.vue')
    void import('../views/Files.vue')
    void import('../views/Hr.vue')
    void import('../views/Sales.vue')
    void import('../views/Workflow.vue')
    void import('../views/Employees.vue')
  }

  const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: { timeout?: number }) => void)
  if (ric) ric(preload, { timeout: 1500 })
  else setTimeout(preload, 800)

  // 启动在线心跳：进入主布局后，每 60 秒上报一次“我在线”
  const send = () => {
    if (!userStore.isLoggedIn) return
    void sendHeartbeat().catch(() => {
      // 心跳失败通常是网络抖动或登录过期，这里静默处理
    })
  }

  send()
  heartbeatTimer = setInterval(send, 60 * 1000)
})

onBeforeUnmount(() => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
})
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.aside-container {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.58));
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  transition: width 0.3s;
  /* 注意：不要加 contain: paint/ layout/ strict，否则弹窗会被限制在侧边栏的 stacking context 内 */

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(28, 28, 30, 0.92);
    font-size: 18px;
    font-weight: bold;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    img {
      width: 32px;
      height: 32px;
      margin-right: 8px;
    }
  }

  .sidebar-menu {
    border-right: none;
    background: transparent;

    :deep(.el-menu-item) {
      color: rgba(28, 28, 30, 0.72);
      border-radius: 14px;
      margin: 6px 10px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background: rgba(45, 108, 255, 0.10);
        color: rgba(28, 28, 30, 0.92);
        transform: translateX(2px);
      }

      &.is-active {
        background: linear-gradient(180deg, rgba(45, 108, 255, 0.22), rgba(45, 108, 255, 0.14));
        color: rgba(28, 28, 30, 0.92);
        transform: translateX(0);
      }
    }
  }
}

.header-container {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.62));
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .header-left {
    .collapse-icon {
      font-size: 24px;
      cursor: pointer;
      color: rgba(28, 28, 30, 0.68);
      
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  .header-right {
    .user-dropdown {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: rgba(28, 28, 30, 0.68);

      .el-icon {
        margin: 0 4px;
      }

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
}

.page-breadcrumb {
  margin-bottom: 16px;
  padding: 0 4px;
  font-size: 13px;

  :deep(.el-breadcrumb__item) {
    font-size: 13px;
    .el-breadcrumb__inner { color: #909399; }
    .el-breadcrumb__inner a { color: #409eff !important; font-weight: 400; }
    .el-breadcrumb__inner a:hover { color: #66b1ff !important; }
    &:last-child .el-breadcrumb__inner { color: #303133; font-weight: 500; }
  }
}

.main-container {
  background: transparent;
  padding: 22px;
  overflow-y: auto;
  position: relative;
}

// 小屏幕下的侧边栏抽屉样式
@media (max-width: 768px) {
  .layout-container.is-mobile {
    flex-direction: column;

    .aside-container {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 2000;
      width: 240px !important;
      transform: translateX(-100%);
      box-shadow: 4px 0 16px rgba(0, 0, 0, 0.18);
      border-right: none;
      background: #ffffff;
    }

    .aside-container.is-open {
      transform: translateX(0);
    }

    .header-container {
      padding: 0 12px;
    }

    .main-container {
      padding: 16px 12px 20px;
    }

    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
      z-index: 1990;
    }
  }
}
</style>

