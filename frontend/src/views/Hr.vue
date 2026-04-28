<template>
  <div class="hr-container page-content-enter">
    <h1 class="page-title fade-in-up">{{ $t('hr.title') }}</h1>

    <!-- 功能模块标签页 -->
    <el-tabs v-model="activeModule" class="hr-tabs fade-in-delay-2" @tab-change="handleModuleChange">
      <!-- 数据看板：任何人可以访问（只展示有权限看的数据） -->
      <el-tab-pane
        :label="$t('hr.modules.dashboard')"
        name="dashboard"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><DataBoard /></el-icon>
            <span>{{ $t('hr.modules.dashboard') }}</span>
          </span>
        </template>
        <HrDashboard />
      </el-tab-pane>

      <!-- 考勤管理 -->
      <el-tab-pane
        v-if="canViewAttendance"
        :label="$t('hr.modules.attendance')"
        name="attendance"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><Clock /></el-icon>
            <span>{{ $t('hr.modules.attendance') }}</span>
          </span>
        </template>
        <AttendanceModule />
      </el-tab-pane>

      <!-- 绩效管理 -->
      <el-tab-pane
        v-if="canViewPerformance"
        :label="$t('hr.modules.performance')"
        name="performance"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><DataLine /></el-icon>
            <span>{{ $t('hr.modules.performance') }}</span>
          </span>
        </template>
        <PerformanceModule />
      </el-tab-pane>

      <!-- 招聘管理 -->
      <el-tab-pane
        v-if="canViewRecruitment"
        :label="$t('hr.modules.recruitment')"
        name="recruitment"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><UserFilled /></el-icon>
            <span>{{ $t('hr.modules.recruitment') }}</span>
          </span>
        </template>
        <RecruitmentModule />
      </el-tab-pane>

      <!-- 薪资管理 -->
      <el-tab-pane
        v-if="canViewPayroll"
        :label="$t('hr.modules.payroll')"
        name="payroll"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><Money /></el-icon>
            <span>{{ $t('hr.modules.payroll') }}</span>
          </span>
        </template>
        <PayrollModule />
      </el-tab-pane>

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

      <!-- 公告发布 -->
      <el-tab-pane
        v-if="canPublishAnnouncement"
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
        v-if="canViewEvent || canCreateEvent"
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

      <!-- 离职管理 -->
      <el-tab-pane
        v-if="canViewExit"
        :label="$t('hr.modules.exit')"
        name="exit"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><Switch /></el-icon>
            <span>{{ $t('hr.modules.exit') }}</span>
          </span>
        </template>
        <ExitAnalysisModule />
      </el-tab-pane>

      <!-- 试用期跟踪 -->
      <el-tab-pane
        v-if="canViewProbation"
        :label="$t('hr.modules.probation')"
        name="probation"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><Timer /></el-icon>
            <span>{{ $t('hr.modules.probation') }}</span>
          </span>
        </template>
        <ProbationModule />
      </el-tab-pane>

      <!-- 薪酬预算 -->
      <el-tab-pane
        v-if="canViewPayrollBudget"
        :label="$t('hr.modules.payrollBudget')"
        name="payroll_budget"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><Money /></el-icon>
            <span>{{ $t('hr.modules.payrollBudget') }}</span>
          </span>
        </template>
        <PayrollBudgetModule />
      </el-tab-pane>

      <!-- 培训管理 -->
      <el-tab-pane
        v-if="canViewTraining"
        :label="$t('hr.modules.training')"
        name="training"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><Reading /></el-icon>
            <span>{{ $t('hr.modules.training') }}</span>
          </span>
        </template>
        <TrainingModule />
      </el-tab-pane>

      <!-- 导入管理 -->
      <el-tab-pane
        v-if="canAccessImport"
        name="import"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><Upload /></el-icon>
            <span>导入管理</span>
          </span>
        </template>
        <ImportModule />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { DataBoard, Clock, DataLine, UserFilled, Money, OfficeBuilding, Document, Calendar, Upload, Switch, Timer, Reading } from '@element-plus/icons-vue'
import { useUserStore } from '../store/user'

// 导入模块组件
import HrDashboard from '../components/hr/HrDashboard.vue'
import AttendanceModule from '../components/hr/AttendanceModule.vue'
import PerformanceModule from '../components/hr/PerformanceModule.vue'
import RecruitmentModule from '../components/hr/RecruitmentModule.vue'
import PayrollModule from '../components/hr/PayrollModule.vue'
import AdminReceptionModule from '../components/workspace/AdminReceptionModule.vue'
import AnnouncementModule from '../components/workspace/AnnouncementModule.vue'
import EventPlanningModule from '../components/hr/EventPlanningModule.vue'
import ImportModule from '../components/shared/ImportModule.vue'
import ExitAnalysisModule from '../components/hr/ExitAnalysisModule.vue'
import ProbationModule from '../components/hr/ProbationModule.vue'
import PayrollBudgetModule from '../components/hr/PayrollBudgetModule.vue'
import TrainingModule from '../components/hr/TrainingModule.vue'

const userStore = useUserStore()

// 权限检查（基于权限码）
const canViewDashboard = computed(() =>
  userStore.hasAnyPermission(['hr.recruitment.board.view', 'hr.attendance.view', 'hr.performance.view', 'hr.payroll.view'])
)
const canViewAttendance = computed(() => userStore.hasPermission('hr.attendance.view'))
const canEditAttendance = computed(() => userStore.hasPermission('hr.attendance.edit'))
const canImportAttendance = computed(() => userStore.hasPermission('hr.attendance.import'))
const canExportAttendance = computed(() => userStore.hasPermission('hr.attendance.export'))
const canViewPerformance = computed(() => userStore.hasPermission('hr.performance.view'))
const canEvaluatePerformance = computed(() => userStore.hasPermission('hr.performance.evaluate'))
const canViewPayroll = computed(() => userStore.hasPermission('hr.payroll.view'))
const canEditPayroll = computed(() => userStore.hasPermission('hr.payroll.edit'))
const canApprovePayroll = computed(() => userStore.hasPermission('hr.payroll.approve'))
const canViewRecruitment = computed(() => userStore.hasPermission('hr.recruitment.board.view'))
const canEditRecruitment = computed(() => userStore.hasPermission('hr.recruitment.candidate.edit'))
const canApproveRecruitment = computed(() => userStore.hasPermission('hr.recruitment.offer.approve'))
const canAccessAdminReception = computed(() => userStore.hasAnyPermission(['hr.announcement.view', 'request.material.my.view']))
const canPublishAnnouncement = computed(() => userStore.hasPermission('hr.announcement.publish'))
const canViewEvent = computed(() => userStore.hasPermission('hr.event.view'))
const canCreateEvent = computed(() => userStore.hasPermission('hr.event.create'))
const canAccessImport = computed(() => userStore.hasAnyPermission(['hr.attendance.import', 'hr.payroll.import']))
const canViewExit = computed(() => userStore.hasAnyPermission(['hr.exit.view', 'hr.exit.stats']))
const canViewProbation = computed(() => userStore.hasAnyPermission(['hr.probation.view', 'hr.probation.manage']))
const canViewPayrollBudget = computed(() => userStore.hasAnyPermission(['hr.payroll.budget.manage', 'hr.payroll.cost.view', 'hr.payroll.alert.manage']))
const canViewTraining = computed(() => userStore.hasAnyPermission(['hr.training.view', 'hr.training.create', 'hr.training.stats']))

// 当前激活的模块
const activeModule = ref<string>('')

// 初始化：设置第一个可用模块为激活状态
onMounted(() => {
  activeModule.value = 'dashboard'
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
