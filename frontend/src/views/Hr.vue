<template>
  <div class="hr-container page-content-enter">
    <h1 class="page-title fade-in-up">{{ $t('hr.title') }}</h1>

    <!-- 功能模块标签页 -->
    <el-tabs v-model="activeModule" class="hr-tabs fade-in-delay-2" @tab-change="handleModuleChange">
      <!-- 行政前台 -->
      <el-tab-pane
        v-if="canAccessAdminReception"
        :label="$t('hr.modules.adminReception')"
        name="admin_reception"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><OfficeBuilding /></el-icon>
            <span>{{ $t('hr.modules.adminReception') }}</span>
          </span>
        </template>
        <AdminReceptionModule />
      </el-tab-pane>

      <!-- 行政招聘 -->
      <el-tab-pane
        v-if="canAccessAdminRecruiter"
        :label="$t('hr.modules.adminRecruiter')"
        name="admin_recruiter"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><UserFilled /></el-icon>
            <span>{{ $t('hr.modules.adminRecruiter') }}</span>
          </span>
        </template>
        <AdminRecruiterModule />
      </el-tab-pane>

      <!-- 公告发布 -->
      <el-tab-pane
        v-if="canAccessAnnouncement"
        :label="$t('hr.modules.announcement')"
        name="announcement"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><Document /></el-icon>
            <span>{{ $t('hr.modules.announcement') }}</span>
          </span>
        </template>
        <AnnouncementModule />
      </el-tab-pane>

      <!-- 活动策划 -->
      <el-tab-pane
        v-if="canAccessEventPlanning"
        :label="$t('hr.modules.eventPlanning')"
        name="event_planning"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><Calendar /></el-icon>
            <span>{{ $t('hr.modules.eventPlanning') }}</span>
          </span>
        </template>
        <EventPlanningModule />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { OfficeBuilding, UserFilled, Document, Calendar } from '@element-plus/icons-vue'
import { useUserStore } from '../store/user'
import { 
  WorkspaceModule, 
  canAccessWorkspaceModule,
  canPublishAnnouncement 
} from '../utils/permissions'

// 导入模块组件
import AdminReceptionModule from '../components/workspace/AdminReceptionModule.vue'
import AdminRecruiterModule from '../components/workspace/AdminRecruiterModule.vue'
import AnnouncementModule from '../components/workspace/AnnouncementModule.vue'
import EventPlanningModule from '../components/hr/EventPlanningModule.vue'

const userStore = useUserStore()

// 权限检查
const canAccessAdminReception = computed(() => {
  return canAccessWorkspaceModule(WorkspaceModule.ADMIN_RECEPTION, userStore.userInfo)
})

const canAccessAdminRecruiter = computed(() => {
  return canAccessWorkspaceModule(WorkspaceModule.ADMIN_RECRUITER, userStore.userInfo)
})

const canAccessAnnouncement = computed(() => {
  return canPublishAnnouncement(userStore.userInfo)
})

const canAccessEventPlanning = computed(() => {
  return canAccessWorkspaceModule(WorkspaceModule.ADMIN_RECEPTION, userStore.userInfo) ||
         canAccessWorkspaceModule(WorkspaceModule.ADMIN_RECRUITER, userStore.userInfo) ||
         canPublishAnnouncement(userStore.userInfo)
})

// 当前激活的模块
const activeModule = ref<string>('')

// 初始化：设置第一个可用模块为激活状态
onMounted(() => {
  if (canAccessAdminReception.value) {
    activeModule.value = 'admin_reception'
  } else if (canAccessAdminRecruiter.value) {
    activeModule.value = 'admin_recruiter'
  } else if (canAccessAnnouncement.value) {
    activeModule.value = 'announcement'
  } else if (canAccessEventPlanning.value) {
    activeModule.value = 'event_planning'
  }
})

// 处理模块切换
const handleModuleChange = (moduleKey: string) => {
  activeModule.value = moduleKey
}
</script>

<style scoped lang="scss">
.hr-container {
  padding: 24px;
  background: #f5f5f7;
  min-height: 100vh;

  .page-title {
    margin: 0 0 24px 0;
    font-size: 28px;
    font-weight: 600;
    color: #1d1d1f;
    letter-spacing: -0.02em;
  }

  .hr-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 24px;
      background: #ffffff;
      border-radius: 16px;
      padding: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    :deep(.el-tabs__nav-wrap) {
      &::after {
        display: none;
      }
    }

    :deep(.el-tabs__item) {
      border-radius: 12px;
      padding: 12px 20px;
      margin-right: 8px;
      font-weight: 500;
      color: #86868b;
      transition: all 0.2s ease;
      border-bottom: none !important;

      &:hover {
        color: #007aff;
        background: #f5f5f7;
      }

      &.is-active {
        color: #007aff;
        background: #e8f4ff;
        border-bottom: none !important;
      }
    }

    :deep(.el-tabs__active-bar) {
      display: none !important;
    }

    .tab-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}
</style>

