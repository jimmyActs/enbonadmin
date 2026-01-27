<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '240px'" class="aside-container">
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
        <router-view v-slot="{ Component, route }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
import { 
  canAccessEmployeeManagement, 
  canAccessFinance,
  canAccessCRM,
  canAccessFiles,
  canAccessSales,
  canAccessHR
} from '../utils/permissions'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

const isCollapse = ref(false)

const activeMenu = computed(() => route.path)
const userName = computed(() => userStore.userName)

// 权限控制：根据角色显示不同菜单
const canAccessEmployeeManagementComputed = computed(() => {
  return canAccessEmployeeManagement(userStore.userInfo)
})

const canAccessFinanceComputed = computed(() => {
  return canAccessFinance(userStore.userInfo)
})

const canAccessCRMComputed = computed(() => {
  return canAccessCRM(userStore.userInfo)
})

const canAccessFilesComputed = computed(() => {
  return canAccessFiles(userStore.userInfo)
})

const canAccessSalesComputed = computed(() => {
  return canAccessSales(userStore.userInfo)
})

const canAccessHRComputed = computed(() => {
  return canAccessHR(userStore.userInfo)
})

// 是否为超级管理员账号（拥有权限管理中心入口）
const isSuperAdmin = computed(() => userStore.userInfo?.role === 'super_admin')

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

// 预加载常用页面 chunk（避免首次切换“等加载”的卡顿感）
onMounted(() => {
  // 小屏设备默认折叠侧边栏，避免手机端内容被压缩太窄
  if (window.innerWidth <= 768) {
    isCollapse.value = true
  }

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
  contain: paint;

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
  contain: paint;

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

.main-container {
  background: transparent;
  padding: 22px;
  overflow-y: auto;
  position: relative;
}
</style>

