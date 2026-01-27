<template>
  <div class="workspace-container page-content-enter">
    <h1 class="page-title fade-in-up">{{ $t('workspace.title') }}</h1>

    <!-- 快捷卡片区域 -->
    <div class="quick-cards">
      <!-- 第一行：公司文件 / 公司文化 / 软件下载 -->
      <!-- 公司文件 -->
      <div
        class="quick-card-item fade-in-delay-1"
        @click="handleQuickCardClick('companyFiles')"
      >
        <div class="quick-card-icon company-files-icon">
          <el-icon><FolderOpened /></el-icon>
        </div>
        <div class="quick-card-content">
          <div class="quick-card-title">{{ $t('workspace.quickCards.companyFiles') }}</div>
          <div class="quick-card-desc">{{ $t('workspace.quickCards.companyFilesDesc') }}</div>
        </div>
      </div>

      <!-- 公司文化 -->
      <div
        class="quick-card-item fade-in-delay-2"
        @click="handleQuickCardClick('companyCulture')"
      >
        <div class="quick-card-icon company-culture-icon">
          <el-icon><Collection /></el-icon>
        </div>
        <div class="quick-card-content">
          <div class="quick-card-title">{{ $t('workspace.quickCards.companyCulture') }}</div>
          <div class="quick-card-desc">{{ $t('workspace.quickCards.companyCultureDesc') }}</div>
        </div>
      </div>

      <!-- 软件下载 -->
      <div
        class="quick-card-item fade-in-delay-3"
        @click="handleQuickCardClick('softwareDownloads')"
      >
        <div class="quick-card-icon software-downloads-icon">
          <el-icon><Download /></el-icon>
        </div>
        <div class="quick-card-content">
          <div class="quick-card-title">{{ $t('workspace.quickCards.softwareDownloads') }}</div>
          <div class="quick-card-desc">{{ $t('workspace.quickCards.softwareDownloadsDesc') }}</div>
        </div>
      </div>

      <!-- 第二行：物料申请 / 会议室申请 / 工具区 -->
      <!-- 物料申请 -->
      <div 
        class="quick-card-item fade-in-delay-4"
        @click="handleQuickCardClick('material')"
      >
        <div class="quick-card-icon material-icon">
          <el-icon><Box /></el-icon>
        </div>
        <div class="quick-card-content">
          <div class="quick-card-title">{{ $t('workspace.quickCards.material') }}</div>
          <div class="quick-card-desc">{{ $t('workspace.quickCards.materialDesc') }}</div>
        </div>
      </div>
      
      <!-- 会议室申请 -->
      <div 
        class="quick-card-item fade-in-delay-5"
        @click="handleQuickCardClick('meeting')"
      >
        <div class="quick-card-icon meeting-icon">
          <el-icon><VideoCamera /></el-icon>
        </div>
        <div class="quick-card-content">
          <div class="quick-card-title">{{ $t('workspace.quickCards.meeting') }}</div>
          <div class="quick-card-desc">{{ $t('workspace.quickCards.meetingDesc') }}</div>
        </div>
      </div>

      <!-- 工具区 -->
      <div
        class="quick-card-item fade-in-delay-6"
        @click="handleQuickCardClick('tools')"
      >
        <div class="quick-card-icon tools-icon">
          <el-icon><Tools /></el-icon>
        </div>
        <div class="quick-card-content">
          <div class="quick-card-title">{{ $t('workspace.quickCards.tools') }}</div>
          <div class="quick-card-desc">{{ $t('workspace.quickCards.toolsDesc') }}</div>
        </div>
      </div>
    </div>

    <!-- 工作空间模块标签页 -->
    <el-tabs v-model="activeModule" class="workspace-tabs fade-in-delay-3" @tab-change="handleModuleChange">
      <!-- 通用模块 -->
      <el-tab-pane
        v-for="module in availableModules"
        :key="module.key"
        :name="module.key"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><component :is="module.icon" /></el-icon>
            <span>{{ module.label }}</span>
          </span>
        </template>
        
        <!-- 工作空间模块内容 -->
        <transition name="fade-slide" mode="out-in">
          <MemoModule v-if="module.key === 'memo'" key="memo" />
          <DailyWorkModule v-else-if="module.key === 'daily_work'" key="daily_work" />
          <WeeklyWorkModule v-else-if="module.key === 'weekly_work'" key="weekly_work" />
          <RequestHelpModule v-else-if="module.key === 'request_help'" key="request_help" />
          <PersonalDocumentsModule v-else-if="module.key === 'personal_docs'" key="personal_docs" />
          <SalesModule v-else-if="module.key === 'sales'" key="sales" />
        </transition>
      </el-tab-pane>
    </el-tabs>

    <!-- 会议室申请对话框 -->
    <MeetingRoomDialog v-model="showMeetingDialog" />
    
    <!-- 物料申请对话框 -->
    <MaterialApplicationDialog v-model="showMaterialDialog" @submitted="handleMaterialApplicationSubmitted" />

    <!-- 工具区对话框 -->
    <ToolboxDialog v-model="showToolboxDialog" />
    
    <!-- 物料申请记录 -->
    <el-card v-if="showApplicationRecords" class="application-records-card fade-in-delay-4">
      <template #header>
        <div class="application-header">
          <div class="header-content">
            <div class="header-icon-wrapper">
              <el-icon class="header-icon"><Box /></el-icon>
            </div>
            <div class="header-text">
              <h3 class="header-title">{{ $t('workspace.materialApplication.myApplications') }}</h3>
              <p class="header-subtitle">{{ $t('workspace.quickCards.materialDesc') }}</p>
            </div>
          </div>
          <el-button type="primary" :icon="Plus" class="new-application-btn" @click="showMaterialDialog = true">
            {{ $t('workspace.quickCards.material') }}
          </el-button>
        </div>
      </template>
      
      <div class="table-container">
        <el-table 
          :data="myApplications" 
          v-loading="loadingApplications"
          class="modern-table"
          :row-class-name="getRowClassName"
        >
          <el-table-column prop="materialName" :label="$t('workspace.materialApplication.materialName')" min-width="160">
            <template #default="{ row }">
              <div class="material-name-cell">
                <el-icon class="material-icon"><Document /></el-icon>
                <span>{{ row.materialName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="category" :label="$t('workspace.adminReception.category')" width="130">
            <template #default="{ row }">
              <el-tag class="category-tag" size="small">{{ row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" :label="$t('workspace.adminReception.quantity')" width="120">
            <template #default="{ row }">
              <div class="quantity-cell">
                <span class="quantity-value">{{ row.quantity }}</span>
                <span class="quantity-unit">{{ row.unit }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="urgency" :label="$t('workspace.materialApplication.urgency')" width="110">
            <template #default="{ row }">
              <el-tag 
                :type="row.urgency === 'urgent' ? 'danger' : 'info'" 
                class="urgency-tag"
                :class="{ 'urgent-tag': row.urgency === 'urgent' }"
                effect="dark"
              >
                {{ row.urgency === 'urgent' ? $t('workspace.materialApplication.urgencyUrgent') : $t('workspace.materialApplication.urgencyNormal') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" :label="$t('workspace.adminReception.status')" width="130">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" class="status-tag" effect="plain">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" :label="$t('workspace.adminReception.requestTime')" width="180">
            <template #default="{ row }">
              <div class="time-cell">
                <el-icon class="time-icon"><Clock /></el-icon>
                <span>{{ formatDateTime(row.createdAt) }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <el-empty 
        v-if="!loadingApplications && myApplications.length === 0" 
        :description="$t('common.noData')"
        class="empty-state"
      >
        <template #image>
          <div class="empty-illustration">
            <el-icon><Box /></el-icon>
          </div>
        </template>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { getMyApplications } from '../api/material-applications'
import type { MaterialApplication } from '../api/material-applications'
import { 
  Notebook, 
  Calendar, 
  DataAnalysis, 
  ChatLineRound,
  Box,
  VideoCamera,
  Tools,
  Collection,
  Download,
  Plus,
  Document,
  Clock,
  FolderOpened
} from '@element-plus/icons-vue'
import { useUserStore } from '../store/user'
import { 
  WorkspaceModule, 
  getAvailableWorkspaceModules
} from '../utils/permissions'

// 导入模块组件（先创建占位符组件）
import MemoModule from '../components/workspace/MemoModule.vue'
import DailyWorkModule from '../components/workspace/DailyWorkModule.vue'
import WeeklyWorkModule from '../components/workspace/WeeklyWorkModule.vue'
import RequestHelpModule from '../components/workspace/RequestHelpModule.vue'
import PersonalDocumentsModule from '../components/workspace/PersonalDocumentsModule.vue'
import SalesModule from '../components/workspace/SalesModule.vue'
import MeetingRoomDialog from '../components/workspace/MeetingRoomDialog.vue'
import MaterialApplicationDialog from '../components/workspace/MaterialApplicationDialog.vue'
import ToolboxDialog from '../components/workspace/ToolboxDialog.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 模块配置
const moduleConfigs = [
  {
    key: WorkspaceModule.MEMO,
    label: t('workspace.modules.memo'),
    icon: Notebook,
  },
  {
    key: WorkspaceModule.DAILY_WORK,
    label: t('workspace.modules.dailyWork'),
    icon: Calendar,
  },
  {
    key: WorkspaceModule.WEEKLY_WORK,
    label: t('workspace.modules.weeklyWork'),
    icon: DataAnalysis,
  },
  {
    key: WorkspaceModule.REQUEST_HELP,
    label: t('workspace.modules.requestHelp'),
    icon: ChatLineRound,
  },
  {
    key: WorkspaceModule.PERSONAL_DOCS,
    label: t('workspace.modules.personalDocs'),
    icon: FolderOpened,
  },
]

// 获取用户可访问的模块
const availableModules = computed(() => {
  const userModules = getAvailableWorkspaceModules(userStore.userInfo)
  return moduleConfigs.filter(config => 
    userModules.includes(config.key as WorkspaceModule)
  )
})

// 当前激活的模块
const activeModule = ref<string>('')

// 初始化：设置第一个可用模块为激活状态
onMounted(() => {
  if (availableModules.value.length > 0 && availableModules.value[0]) {
    activeModule.value = availableModules.value[0].key
  }
  loadApplications()

  // 如果从首页带参数打开工具区，则自动弹出工具对话框
  if (route.query.open === 'tools') {
    showToolboxDialog.value = true
  }
})

// 处理模块切换
const handleModuleChange = (moduleKey: string) => {
  activeModule.value = moduleKey
}

// 处理快捷卡片点击
const handleQuickCardClick = (type: string) => {
  if (type === 'meeting') {
    // 打开会议室申请对话框
    showMeetingDialog.value = true
  } else if (type === 'material') {
    // 打开物料申请对话框
    showMaterialDialog.value = true
  } else if (type === 'tools') {
    showToolboxDialog.value = true
  } else if (
    type === 'companyFiles' ||
    type === 'companyCulture' ||
    type === 'softwareDownloads'
  ) {
    if (type === 'companyFiles') {
      router.push({ name: 'CompanyFiles' })
      return
    }
    if (type === 'companyCulture') {
      router.push({ name: 'CompanyCulture' })
      return
    }
    if (type === 'softwareDownloads') {
      router.push({ name: 'SoftwareDownloads' })
      return
    }
  }
}

const showMeetingDialog = ref(false)
const showMaterialDialog = ref(false)
const showToolboxDialog = ref(false)
const showApplicationRecords = ref(true)
const myApplications = ref<MaterialApplication[]>([])
const loadingApplications = ref(false)

// 加载申请记录
const loadApplications = async () => {
  try {
    loadingApplications.value = true
    myApplications.value = await getMyApplications()
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load applications:', error)
    }
  } finally {
    loadingApplications.value = false
  }
}

// 格式化日期时间
const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 获取状态类型
const getStatusType = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    processing: 'info',
    completed: 'success',
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: t('workspace.materialApplication.applicationStatuses.pending'),
    approved: t('workspace.materialApplication.applicationStatuses.approved'),
    rejected: t('workspace.materialApplication.applicationStatuses.rejected'),
    processing: t('workspace.materialApplication.applicationStatuses.processing'),
    completed: t('workspace.materialApplication.applicationStatuses.completed'),
  }
  return statusMap[status] || status
}

// 处理申请提交成功
const handleMaterialApplicationSubmitted = () => {
  loadApplications()
}

// 表格行类名
const getRowClassName = () => {
  return 'table-row'
}
</script>

<style scoped lang="scss">
.workspace-container {
  padding: 24px;
  background: transparent;
  min-height: 100vh;

  .page-title {
    margin: 0 0 24px 0;
    font-size: 28px;
    font-weight: 600;
    color: #1d1d1f;
    letter-spacing: -0.02em;
  }

  .workspace-tabs {
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

    :deep(.el-tabs__active-bar) {
      display: none !important;
    }

    :deep(.el-tabs__item) {
      border-radius: 12px;
      padding: 12px 20px;
      margin-right: 8px;
      font-weight: 500;
      color: #86868b;
      transition: all 0.2s ease;

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

    .tab-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  // 快捷卡片区域
  .quick-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 24px;

    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }

      .quick-card-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.78);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-2px);
        border-color: rgba(0, 0, 0, 0.10);
      }

      &:active {
        transform: translateY(-2px) scale(0.99);
      }

      .quick-card-icon {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .el-icon {
          font-size: 28px;
          color: #ffffff;
        }

        &.material-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.meeting-icon {
          background: linear-gradient(135deg, #007aff 0%, #0051d5 100%);
        }

        &.tools-icon {
          background: linear-gradient(135deg, #2d6cff 0%, #7c3aed 100%);
        }
      }

      .quick-card-content {
        flex: 1;
        min-width: 0;

        .quick-card-title {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }

        .quick-card-desc {
          font-size: 13px;
          color: #86868b;
          letter-spacing: -0.01em;
        }
      }
    }

    // 新增卡片的配色
    .company-files-icon {
      background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    }

    .company-culture-icon {
      background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
    }

    .software-downloads-icon {
      background: linear-gradient(135deg, #059669 0%, #14b8a6 100%);
    }
  }

  // 物料申请记录卡片样式
  .application-records-card {
    margin-top: 24px;
    border-radius: 20px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    background: #ffffff;

    :deep(.el-card__header) {
      padding: 20px 24px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-bottom: 1px solid #f0f0f0;
    }

    .application-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .header-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);

          .header-icon {
            font-size: 24px;
            color: #ffffff;
          }
        }

        .header-text {
          .header-title {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #1d1d1f;
            letter-spacing: -0.01em;
            line-height: 1.2;
          }

          .header-subtitle {
            margin: 4px 0 0 0;
            font-size: 13px;
            color: #86868b;
            line-height: 1.4;
          }
        }
      }

      .new-application-btn {
        border-radius: 12px;
        padding: 10px 20px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 122, 255, 0.35);
        }
      }
    }

    .table-container {
      padding: 0;
    }

    :deep(.modern-table) {
      .el-table__header {
        th {
          background: #f8f9fa;
          border: none;
          padding: 16px 12px;
          font-weight: 600;
          color: #1d1d1f;
          font-size: 13px;
          letter-spacing: 0.01em;
        }
      }

      .el-table__body {
        tr {
          transition: all 0.2s ease;

          &:hover {
            background: #f8f9fa !important;
            transform: scale(1.001);
          }

          td {
            border: none;
            border-bottom: 1px solid #f0f0f0;
            padding: 20px 12px;
          }
        }

        .table-row {
          border-radius: 0;
        }
      }

      .material-name-cell {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        color: #1d1d1f;

        .material-icon {
          color: #667eea;
          font-size: 18px;
        }
      }

      .category-tag {
        border-radius: 8px;
        border: none;
        background: #e8f4ff;
        color: #007aff;
        font-weight: 500;
        padding: 4px 12px;
      }

      .quantity-cell {
        display: flex;
        align-items: baseline;
        gap: 4px;

        .quantity-value {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
        }

        .quantity-unit {
          font-size: 13px;
          color: #86868b;
        }
      }

      .urgency-tag {
        border-radius: 8px;
        padding: 4px 12px;
        font-weight: 500;
        border: none;

        &.urgent-tag {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
        }
      }

      .status-tag {
        border-radius: 8px;
        padding: 4px 12px;
        font-weight: 500;
        border: 1px solid;
      }

      .time-cell {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #86868b;
        font-size: 13px;

        .time-icon {
          font-size: 14px;
          color: #a8a8aa;
        }
      }
    }

    .empty-state {
      padding: 60px 20px;

      :deep(.el-empty__image) {
        width: 200px;
        height: 200px;
      }

      .empty-illustration {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f8f9fa 0%, #e8f4ff 100%);
        border-radius: 20px;

        .el-icon {
          font-size: 80px;
          color: #c8d4e8;
        }
      }
    }
  }

  // 工作空间在平板和手机端的适配
  @media (max-width: 768px) {
    padding: 16px;

    .page-title {
      font-size: 22px;
    }

    .workspace-tabs {
      :deep(.el-tabs__header) {
        border-radius: 12px;
        padding: 4px;
      }
    }

    .application-records-card {
      margin-top: 16px;

      .application-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;

        .new-application-btn {
          width: 100%;
        }
      }

      .table-container {
        overflow-x: auto;
      }
    }
  }

  @media (max-width: 480px) {
    .quick-cards {
      gap: 12px;

      .quick-card-item {
        padding: 16px;
      }
    }
  }
}
</style>
