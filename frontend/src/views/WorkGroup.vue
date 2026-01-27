<template>
  <div class="workgroup-container page-content-enter">
    <h1 class="page-title fade-in-up">{{ $t('workgroup.title') }}</h1>
    
    <!-- 统计卡片 -->
    <div class="statistics-card fade-in-delay-2">
      <div class="statistics-grid">
        <div class="statistic-item">
          <div class="statistic-icon total-icon">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="statistic-content">
            <div class="statistic-label">{{ $t('workgroup.totalEmployees') }}</div>
            <div class="statistic-value">{{ statistics?.total || 0 }}</div>
            <div class="statistic-online">
              <span class="online-indicator"></span>
              {{ $t('workgroup.statistics.online') }}: {{ getOnlineCount() }}
            </div>
          </div>
        </div>
        
        <el-popover
          v-if="statistics?.workStatus"
          placement="bottom"
          :width="420"
          trigger="hover"
          popper-class="work-status-popover"
        >
          <template #reference>
            <div class="statistic-item">
              <div class="statistic-icon away-icon">
                <!-- 出差统计改用飞机图标（Promotion） -->
                <el-icon><Promotion /></el-icon>
              </div>
              <div class="statistic-content">
                <div class="statistic-label">{{ $t('workgroup.statistics.away') }}</div>
                <div class="statistic-value">{{ getStatisticsCount('away') }}</div>
              </div>
            </div>
          </template>
          <div class="employee-popover-list">
            <div v-if="getEmployeesByWorkStatus('away').length === 0" class="empty-text">
              {{ $t('workgroup.noEmployees') }}
            </div>
            <el-row v-else :gutter="12">
              <el-col
                v-for="emp in getEmployeesByWorkStatus('away')"
                :key="emp.id"
                :span="12"
              >
                <div class="popover-employee-item">
                  <el-avatar :size="32" :src="getAvatarUrl(emp)" class="popover-avatar">
                    {{ getEmployeeDisplayName(emp).charAt(0) }}
                  </el-avatar>
                  <div class="popover-employee-info">
                    <div class="popover-employee-name">{{ getEmployeeDisplayName(emp) }}</div>
                    <div class="popover-employee-location">
                      <el-icon class="location-icon"><Location /></el-icon>
                      <span class="location-text">{{ getDisplayLocation(emp, true) }}</span>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-popover>

        <!-- 驻外统计（基于国家信息） -->
        <el-popover
          placement="bottom"
          :width="420"
          trigger="hover"
          popper-class="work-status-popover"
        >
          <template #reference>
            <div class="statistic-item">
              <div class="statistic-icon away-icon">
                <el-icon><Location /></el-icon>
              </div>
              <div class="statistic-content">
                <div class="statistic-label">{{ $t('workgroup.statistics.overseas') }}</div>
                <div class="statistic-value">{{ getOverseasEmployees().length }}</div>
                <div class="statistic-detail" v-if="getOverseasEmployees().length > 0">
                  {{ getOverseasEmployees().map(emp => getEmployeeDisplayName(emp)).join('、') }}
                </div>
              </div>
            </div>
          </template>
          <div class="employee-popover-list">
            <div v-if="getOverseasEmployees().length === 0" class="empty-text">
              {{ $t('workgroup.noEmployees') }}
            </div>
            <el-row v-else :gutter="12">
              <el-col
                v-for="emp in getOverseasEmployees()"
                :key="emp.id"
                :span="12"
              >
                <div class="popover-employee-item">
                  <el-avatar :size="32" :src="getAvatarUrl(emp)" class="popover-avatar">
                    {{ getEmployeeDisplayName(emp).charAt(0) }}
                  </el-avatar>
                  <div class="popover-employee-info">
                    <div class="popover-employee-name">{{ getEmployeeDisplayName(emp) }}</div>
                    <div class="popover-employee-location">
                      <el-icon class="location-icon"><Location /></el-icon>
                      <span class="location-text">{{ getDisplayLocation(emp, false) }}</span>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-popover>

        <el-popover
          v-if="statistics?.workStatus"
          placement="bottom"
          :width="420"
          trigger="hover"
          popper-class="work-status-popover"
        >
          <template #reference>
            <div class="statistic-item">
              <div class="statistic-icon leave-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="statistic-content">
                <div class="statistic-label">{{ $t('workgroup.statistics.leave') }}</div>
                <div class="statistic-value">{{ getStatisticsCount('leave') }}</div>
              </div>
            </div>
          </template>
          <div class="employee-popover-list">
            <div v-if="getEmployeesByWorkStatus('leave').length === 0" class="empty-text">
              {{ $t('workgroup.noEmployees') }}
            </div>
            <div
              v-for="emp in getEmployeesByWorkStatus('leave')"
              :key="emp.id"
              class="popover-employee-item"
            >
              <el-avatar :size="32" :src="getAvatarUrl(emp)" class="popover-avatar">
                {{ getEmployeeDisplayName(emp).charAt(0) }}
              </el-avatar>
              <div class="popover-employee-info">
                <div class="popover-employee-name">{{ getEmployeeDisplayName(emp) }}</div>
                <div class="popover-employee-department">{{ getDepartmentName(emp.department || '') }}</div>
              </div>
            </div>
          </div>
        </el-popover>
        
        <el-popover
          v-if="statistics?.workStatus"
          placement="bottom"
          :width="420"
          trigger="hover"
          popper-class="work-status-popover"
        >
          <template #reference>
            <div class="statistic-item">
              <div class="statistic-icon meeting-icon">
                <el-icon><VideoCamera /></el-icon>
              </div>
              <div class="statistic-content">
                <div class="statistic-label">{{ $t('workgroup.statistics.meeting') }}</div>
                <div class="statistic-value">{{ getStatisticsCount('meeting') }}</div>
              </div>
            </div>
          </template>
          <div class="employee-popover-list">
            <div v-if="getEmployeesByWorkStatus('meeting').length === 0" class="empty-text">
              {{ $t('workgroup.noEmployees') }}
            </div>
            <div
              v-for="emp in getEmployeesByWorkStatus('meeting')"
              :key="emp.id"
              class="popover-employee-item"
            >
              <el-avatar :size="32" :src="getAvatarUrl(emp)" class="popover-avatar">
                {{ getEmployeeDisplayName(emp).charAt(0) }}
              </el-avatar>
              <div class="popover-employee-info">
                <div class="popover-employee-name">{{ getEmployeeDisplayName(emp) }}</div>
                <div class="popover-employee-department">{{ getDepartmentName(emp.department || '') }}</div>
              </div>
            </div>
          </div>
        </el-popover>
        
        <el-popover
          v-if="statistics?.workStatus"
          placement="bottom"
          :width="300"
          trigger="hover"
          popper-class="work-status-popover"
        >
          <template #reference>
            <div class="statistic-item">
              <div class="statistic-icon busy-icon">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="statistic-content">
                <div class="statistic-label">{{ $t('workgroup.statistics.busy') }}</div>
                <div class="statistic-value">{{ getStatisticsCount('busy') }}</div>
              </div>
            </div>
          </template>
          <div class="employee-popover-list">
            <div v-if="getEmployeesByWorkStatus('busy').length === 0" class="empty-text">
              {{ $t('workgroup.noEmployees') }}
            </div>
            <div
              v-for="emp in getEmployeesByWorkStatus('busy')"
              :key="emp.id"
              class="popover-employee-item"
            >
              <el-avatar :size="32" :src="getAvatarUrl(emp)" class="popover-avatar">
                {{ getEmployeeDisplayName(emp).charAt(0) }}
              </el-avatar>
              <div class="popover-employee-info">
                <div class="popover-employee-name">{{ getEmployeeDisplayName(emp) }}</div>
                <div class="popover-employee-department">{{ getDepartmentName(emp.department || '') }}</div>
              </div>
            </div>
          </div>
        </el-popover>
      </div>
    </div>

    <!-- 部门 Tab + 搜索 -->
    <div class="departments-toolbar">
      <div class="dept-tabs">
        <el-scrollbar>
          <div class="dept-tabs-inner">
            <el-tag
              v-for="tab in departmentTabs"
              :key="tab.key"
              class="dept-tab"
              :effect="activeDeptKey === tab.key ? 'dark' : 'plain'"
              :type="activeDeptKey === tab.key ? 'primary' : 'info'"
              @click="activeDeptKey = tab.key"
            >
              {{ tab.label }}
            </el-tag>
          </div>
        </el-scrollbar>
      </div>
      <el-input
        v-model="searchKeyword"
        :placeholder="$t('workgroup.searchPlaceholder')"
        clearable
        class="departments-search"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 部门列表 -->
    <div class="departments-grid">
      <div
        v-for="deptItem in filteredDepartments"
        :key="deptItem.dept"
        class="department-card"
      >
        <div class="department-header">
          <div class="department-header-left">
            <el-icon class="department-icon"><OfficeBuilding /></el-icon>
            <span class="department-name">{{ getDepartmentName(deptItem.dept) }}</span>
            <!-- 部门状态统计 -->
            <div class="department-status-summary" v-if="getDepartmentStatusSummary(deptItem.employees).length > 0">
              <el-tag
                v-for="(statusInfo, idx) in getDepartmentStatusSummary(deptItem.employees)"
                :key="idx"
                :type="getWorkStatusType(statusInfo.status)"
                size="small"
                class="status-summary-tag"
              >
                {{ statusInfo.count }}{{ getWorkStatusText(statusInfo.status) }}
              </el-tag>
            </div>
          </div>
          <el-tag type="info" size="small" class="department-count">
            {{ deptItem.employees.filter(emp => emp.employmentStatus !== 'resigned').length }} {{ $t('workgroup.people') }}
          </el-tag>
        </div>
        
        <div class="employees-list">
          <div
            v-for="employee in deptItem.employees.filter(emp => emp.employmentStatus !== 'resigned')"
            :key="employee.id"
            class="employee-item"
          >
            <el-avatar 
              :size="48" 
              :src="getAvatarUrl(employee)" 
              class="employee-avatar"
              :class="{ 'offline': !isEmployeeOnline(employee) }"
            >
              {{ getEmployeeDisplayName(employee).charAt(0) }}
            </el-avatar>
            <div class="employee-info" :class="{ 'offline': !isEmployeeOnline(employee) }">
              <div class="employee-name-row">
                <span class="employee-name">{{ getEmployeeDisplayName(employee) }}</span>
              </div>
              <div class="employee-details">
                <span class="employee-position">{{ getPositionName(employee.position) }}</span>
                <span class="employee-separator">·</span>
                <span class="employee-department">{{ getDepartmentName(employee.department || '') }}</span>
              </div>
            </div>
            <div class="employee-actions">
              <el-tag
                v-if="getEffectiveWorkStatus(employee) && getEffectiveWorkStatus(employee) !== 'available'"
                :type="getWorkStatusType(getEffectiveWorkStatus(employee))"
                size="small"
                class="status-tag"
              >
                <el-icon class="work-status-icon-small">
                  <Promotion v-if="getBaseWorkStatus(getEffectiveWorkStatus(employee)) === 'away'" />
                  <Location v-else-if="getBaseWorkStatus(getEffectiveWorkStatus(employee)) === 'overseas'" />
                  <Clock v-else-if="getBaseWorkStatus(getEffectiveWorkStatus(employee)) === 'leave'" />
                  <VideoCamera v-else-if="getBaseWorkStatus(getEffectiveWorkStatus(employee)) === 'meeting'" />
                  <CircleCheck v-else-if="getBaseWorkStatus(getEffectiveWorkStatus(employee)) === 'busy' || getBaseWorkStatus(getEffectiveWorkStatus(employee)) === 'available'" />
                  <CircleClose v-else-if="getBaseWorkStatus(getEffectiveWorkStatus(employee)) === 'offline' || !isEmployeeOnline(employee)" />
                </el-icon>
                {{ getWorkStatusText(getEffectiveWorkStatus(employee)) }}
              </el-tag>
              <el-dropdown trigger="click" @command="handleCommand">
                <el-button type="text" size="small" class="action-button">
                  <el-icon><More /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="`remind-${employee.id}`" :data="employee">
                      <el-icon><Bell /></el-icon>
                      {{ $t('workgroup.setReminder') }}
                    </el-dropdown-item>
                    <el-dropdown-item :command="`card-${employee.id}`" :data="employee">
                      <el-icon><User /></el-icon>
                      {{ $t('workgroup.viewBusinessCard') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && Object.keys(groupedEmployees).length === 0" :description="$t('workgroup.noEmployees')" />

    <!-- 名片对话框 -->
    <el-dialog
      v-model="showBusinessCardDialog"
      :title="$t('workgroup.businessCard.title')"
      width="680px"
      :close-on-click-modal="false"
      class="business-card-dialog"
    >
      <div v-if="selectedCardEmployee" class="business-card-content">
        <!-- 顶部头像和基本信息区域 -->
        <div class="card-top-section">
          <div class="card-avatar-wrapper">
            <el-avatar :size="120" :src="getAvatarUrl(selectedCardEmployee)" class="card-avatar">
              {{ getEmployeeDisplayName(selectedCardEmployee).charAt(0) }}
            </el-avatar>
            <div class="card-status-badge">
              <el-tag 
                :type="getWorkStatusType(getEffectiveWorkStatus(selectedCardEmployee))" 
                size="small"
                class="status-badge-tag"
              >
                <el-icon class="status-badge-icon" v-if="isEmployeeOnline(selectedCardEmployee) && getEffectiveWorkStatus(selectedCardEmployee) !== 'offline'">
                  <Promotion v-if="getBaseWorkStatus(getEffectiveWorkStatus(selectedCardEmployee)) === 'away'" />
                  <Location v-else-if="getBaseWorkStatus(getEffectiveWorkStatus(selectedCardEmployee)) === 'overseas'" />
                  <Clock v-else-if="getBaseWorkStatus(getEffectiveWorkStatus(selectedCardEmployee)) === 'leave'" />
                  <VideoCamera v-else-if="getBaseWorkStatus(getEffectiveWorkStatus(selectedCardEmployee)) === 'meeting'" />
                  <CircleCheck v-else-if="getBaseWorkStatus(getEffectiveWorkStatus(selectedCardEmployee)) === 'busy' || getBaseWorkStatus(getEffectiveWorkStatus(selectedCardEmployee)) === 'available'" />
                </el-icon>
                {{ isEmployeeOnline(selectedCardEmployee) ? getWorkStatusText(getEffectiveWorkStatus(selectedCardEmployee)) : $t('workgroup.businessCard.offline') }}
              </el-tag>
            </div>
          </div>
          
          <div class="card-name-section">
            <h2 class="card-name">{{ getEmployeeDisplayName(selectedCardEmployee) }}</h2>
            <div class="card-names-row" v-if="selectedCardEmployee.chineseName || selectedCardEmployee.englishName">
              <span v-if="selectedCardEmployee.chineseName" class="card-chinese-name">
                {{ selectedCardEmployee.chineseName }}
              </span>
              <span v-if="selectedCardEmployee.chineseName && selectedCardEmployee.englishName" class="name-separator">·</span>
              <span v-if="selectedCardEmployee.englishName" class="card-english-name">
                {{ selectedCardEmployee.englishName }}
              </span>
            </div>
            <div class="card-role-info" v-if="selectedCardEmployee.position || selectedCardEmployee.department">
              <span v-if="selectedCardEmployee.position" class="card-position">{{ getPositionName(selectedCardEmployee.position) }}</span>
              <span v-if="selectedCardEmployee.position && selectedCardEmployee.department" class="role-separator">·</span>
              <span v-if="selectedCardEmployee.department" class="card-department">{{ getDepartmentName(selectedCardEmployee.department || '') }}</span>
            </div>
            <!-- 个性签名：放在职位/部门下面，浅色文字 -->
            <div class="card-signature" v-if="selectedCardEmployee.mood">
              {{ selectedCardEmployee.mood }}
            </div>
            
            <div class="card-location-info" v-if="selectedCardEmployee.country || selectedCardEmployee.city">
              <el-icon class="location-icon"><Location /></el-icon>
              <span class="location-text">
                <span v-if="selectedCardEmployee.country">{{ selectedCardEmployee.country }}</span>
                <span v-if="selectedCardEmployee.country && selectedCardEmployee.city">, </span>
                <span v-if="selectedCardEmployee.city">{{ selectedCardEmployee.city }}</span>
              </span>
            </div>
          </div>
        </div>
        
        <!-- 详细信息区域 -->
        <div class="card-info-grid">
          <div class="card-info-card" v-if="selectedCardEmployee.department">
            <div class="info-card-icon-wrapper">
              <el-icon class="info-card-icon"><OfficeBuilding /></el-icon>
            </div>
            <div class="info-card-content">
              <div class="info-card-label">{{ $t('workgroup.businessCard.department') }}</div>
              <div class="info-card-value">{{ getDepartmentName(selectedCardEmployee.department || '') }}</div>
            </div>
          </div>
          
          <div class="card-info-card" v-if="selectedCardEmployee.position">
            <div class="info-card-icon-wrapper">
              <el-icon class="info-card-icon"><User /></el-icon>
            </div>
            <div class="info-card-content">
              <div class="info-card-label">{{ $t('workgroup.businessCard.position') }}</div>
              <div class="info-card-value">{{ getPositionName(selectedCardEmployee.position) }}</div>
            </div>
          </div>
          <!-- 原来的“心情/签名”信息卡去掉，改为在顶部姓名区域展示 -->
        </div>
      </div>
    </el-dialog>

    <!-- 设置提醒对话框 -->
    <el-dialog
      v-model="showReminderDialog"
      :title="$t('workgroup.setReminder')"
      width="500px"
      :close-on-click-modal="false"
      class="reminder-dialog"
    >
      <el-form
        ref="reminderFormRef"
        :model="reminderForm"
        :rules="reminderRules"
        label-width="100px"
      >
        <el-form-item :label="$t('workgroup.targetUser')">
          <el-input :value="selectedEmployee ? getEmployeeDisplayName(selectedEmployee) : ''" disabled />
        </el-form-item>
        <el-form-item :label="$t('workgroup.reminderContent')" prop="content">
          <el-input
            v-model="reminderForm.content"
            type="textarea"
            :rows="3"
            :placeholder="$t('workgroup.reminderContentPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('workgroup.memo')" prop="memo">
          <el-input
            v-model="reminderForm.memo"
            type="textarea"
            :rows="2"
            :placeholder="$t('workgroup.memoPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('workgroup.reminderTime')" prop="reminderTime">
          <el-date-picker
            v-model="reminderForm.reminderTime"
            type="datetime"
            :placeholder="$t('workgroup.selectReminderTime')"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReminderDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleCreateReminder" :loading="submitting">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { OfficeBuilding, More, Bell, Location, Clock, VideoCamera, CircleCheck, CircleClose, UserFilled, User, ChatDotRound, Promotion, Search } from '@element-plus/icons-vue'
import { getEmployeesGrouped, getEmployeeStatistics, type Employee } from '../api/employees'
import { createReminder, type CreateReminderDto } from '../api/reminders'
import { getAvatarUrl as getEmployeeAvatarUrl } from '../api/users'
import { useUserStore } from '../store/user'
import { useEmployeeDisplayName } from '../utils/employee'

const { t, locale } = useI18n()
const userStore = useUserStore()
const { getEmployeeDisplayName } = useEmployeeDisplayName()

const loading = ref(false)
const submitting = ref(false)
const groupedEmployees = ref<Record<string, Employee[]>>({})
const statistics = ref<any>(null)
// 搜索关键字（按姓名或部门名优先展示匹配的大卡片）
const searchKeyword = ref('')
const showReminderDialog = ref(false)
const selectedEmployee = ref<Employee | null>(null)
const reminderFormRef = ref<FormInstance>()

const reminderForm = ref({
  content: '',
  memo: '',
  reminderTime: '',
})

const reminderRules = {
  content: [{ required: true, message: t('workgroup.reminderContentRequired'), trigger: 'blur' }],
  reminderTime: [{ required: true, message: t('workgroup.reminderTimeRequired'), trigger: 'change' }],
}

const getAvatarUrl = (employee: Employee): string => {
  // 如果有头像URL，使用头像URL
  if (employee.avatar) {
    return getEmployeeAvatarUrl(employee.avatar.split('/').pop()!)
  }
  return ''
}

const departmentNames: Record<string, { zh: string; en: string }> = {
  planning: { zh: '品牌管理中心', en: 'Brand Management Center' },
  sales: { zh: '销售部', en: 'Sales' },
  tech: { zh: '技术部', en: 'Technology' },
  finance: { zh: '财务部', en: 'Finance' },
  hr: { zh: '人力资源部', en: 'Human Resources' },
  domestic: { zh: '国内区', en: 'Domestic' },
  management: { zh: '总经办', en: 'Management' },
}

// 出差/驻外目的地编码 -> 中英双语标签
const destinationLabelMap: Record<string, string> = {
  china: '中国 / China',
  japan: '日本 / Japan',
  korea: '韩国 / Korea',
  india: '印度 / India',
  bangladesh: '孟加拉国 / Bangladesh',
  turkey: '土耳其 / Turkey',
  'saudi-arabia': '沙特阿拉伯 / Saudi Arabia',
  uae: '阿联酋 / United Arab Emirates',
  iran: '伊朗 / Iran',
  indonesia: '印尼 / Indonesia',
  philippines: '菲律宾 / Philippines',
  malaysia: '马来西亚 / Malaysia',
  vietnam: '越南 / Vietnam',
  thailand: '泰国 / Thailand',
  usa: '美国 / United States',
  uk: '英国 / United Kingdom',
  germany: '德国 / Germany',
  france: '法国 / France',
  spain: '西班牙 / Spain',
  italy: '意大利 / Italy',
  russia: '俄罗斯 / Russia',
  australia: '澳大利亚 / Australia',
  canada: '加拿大 / Canada',
}

const getDepartmentName = (dept: string): string => {
  const deptInfo = departmentNames[dept]
  if (!deptInfo) return dept
  return locale.value === 'en-US' ? deptInfo.en : deptInfo.zh
}

// 职位名称映射：支持职位编码 -> 多语言名称，兼容旧数据直接显示
const positionNames: Record<string, { zh: string; en: string }> = {
  recruitment_specialist: { zh: '招聘专员', en: 'Recruitment Specialist' },
  admin_specialist: { zh: '行政专员', en: 'Administrative Specialist' },
  front_desk_receptionist: { zh: '行政前台', en: 'Front Desk Receptionist' },
  director: { zh: '总监', en: 'Director' },
  sales: { zh: '销售', en: 'Sales' },
  supervisor: { zh: '主管', en: 'Supervisor' },
  graphic_designer: { zh: '平面设计师', en: 'Graphic Designer' },
  design_assistant: { zh: '设计助理', en: 'Design Assistant' },
  frontend_engineer: { zh: '前端开发工程师', en: 'Front-end Developer' },
  after_sales_engineer: { zh: '售后工程师', en: 'After-sales Engineer' },
  quality_specialist: { zh: '品质', en: 'Quality Specialist' },
  purchasing_specialist: { zh: '采购', en: 'Purchasing Specialist' },
  accountant_cashier: { zh: '会计出纳', en: 'Accountant & Cashier' },
  finance_specialist: { zh: '财务专员', en: 'Finance Specialist' },
  ceo: { zh: 'CEO', en: 'CEO' },
  chairman: { zh: '董事长', en: 'Chairman' },
  deputy_general_manager: { zh: '副总经理', en: 'Deputy General Manager' },
  special_shape_bu_gm: { zh: '异形事业部总经理', en: 'GM of Special-shaped Business Unit' },
  new_media_operator: { zh: '新媒体运营', en: 'New Media Operator' },
  copywriter: { zh: '文案专员', en: 'Copywriter' },
  modeling_3d_artist: { zh: '3D建模渲染师', en: '3D Modeling & Rendering Artist' },
  merchandiser: { zh: '跟单', en: 'Merchandiser' },
}

const getPositionName = (position?: string | null): string => {
  if (!position) return t('workgroup.noPosition')
  const info = positionNames[position]
  if (!info) return position
  return locale.value === 'en-US' ? info.en : info.zh
}

// 计算当前登录用户所属部门（用于将该部门置顶展示）
const currentUserDepartment = computed(() => userStore.userInfo?.department || '')

// 将部门记录转换为数组，并将当前用户部门置顶、其余按部门名称排序
const sortedDepartments = computed(() => {
  // 将对象转换为数组结构，便于排序
  const entries = Object.entries(groupedEmployees.value).map(([dept, employees]) => ({
    dept,
    employees,
  }))

  // 按规则排序：当前用户部门优先，其余按部门标识字母顺序
  return entries.sort((a, b) => {
    // 当前用户部门始终排在最前面
    if (a.dept === currentUserDepartment.value && b.dept !== currentUserDepartment.value) {
      return -1
    }
    if (b.dept === currentUserDepartment.value && a.dept !== currentUserDepartment.value) {
      return 1
    }
    // 其余部门按编码字母顺序排列，保证顺眼且稳定
    return a.dept.localeCompare(b.dept)
  })
})

// 根据搜索关键字调整部门顺序：匹配的部门或包含该员工的部门优先显示
const activeDeptKey = ref<string>('all')

// 顶部 Tab 用的数据源
const departmentTabs = computed(() => {
  const base = sortedDepartments.value
  return [
    { key: 'all', dept: 'all', label: t('workgroup.allDepartments') || '全部部门' },
    ...base.map(item => ({
      key: item.dept,
      dept: item.dept,
      label: getDepartmentName(item.dept),
    })),
  ]
})

const filteredDepartments = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  // 先按 tab 过滤部门
  let base = sortedDepartments.value
  if (activeDeptKey.value !== 'all') {
    base = base.filter(item => item.dept === activeDeptKey.value)
  }

  if (!keyword) {
    return base
  }

  const withIndex = base.map((item, index) => ({
    ...item,
    _index: index,
  }))

  const hasMatch = (item: { dept: string; employees: Employee[] }): boolean => {
    const deptName = getDepartmentName(item.dept).toLowerCase()
    if (deptName.includes(keyword)) return true
    return item.employees.some(emp => {
      const nick = (emp.nickname || '').toLowerCase()
      const user = (emp.username || '').toLowerCase()
      const cn = (emp.chineseName || '').toLowerCase()
      const en = (emp.englishName || '').toLowerCase()
      const display = getEmployeeDisplayName(emp).toLowerCase()
      return (
        nick.includes(keyword) ||
        user.includes(keyword) ||
        cn.includes(keyword) ||
        en.includes(keyword) ||
        display.includes(keyword)
      )
    })
  }

  return withIndex
    .sort((a, b) => {
      const aMatch = hasMatch(a)
      const bMatch = hasMatch(b)
      if (aMatch && !bMatch) return -1
      if (!aMatch && bMatch) return 1
      return a._index - b._index
    })
    .map(({ _index, ...rest }) => rest)
})

// 获取工作状态类型（用于标签颜色，支持出差/驻外目的地）
const getWorkStatusType = (status: string): string => {
  // 处理带目的地的状态（可能包含目的地）
  const baseStatus = status.includes(':') ? status.split(':')[0] : status
  
  const statusMap: Record<string, string> = {
  available: 'success', // 空闲 - 绿色
  busy: 'warning', // 忙碌 - 橙色
  away: 'primary', // 出差 - 蓝色
  overseas: 'primary', // 驻外 - 蓝色
  leave: 'info', // 请假 - 灰色
  meeting: 'warning', // 会议中 - 橙色
  offline: 'danger', // 离线 - 红色
  }
  return statusMap[baseStatus] || 'info'
}

// 获取基础工作状态（去掉目的地信息），如 'away:japan' -> 'away'
const getBaseWorkStatus = (status: string): string => {
  if (!status) return 'available'
  const base = status.includes(':') ? status.split(':')[0] : status
  return base || 'available'
}

// 获取工作状态文本（支持出差/驻外目的地）
const getWorkStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    available: t('workgroup.workStatus.available'),
    busy: t('workgroup.workStatus.busy'),
    away: t('workgroup.workStatus.away'),
    overseas: t('workgroup.workStatus.overseas'),
    leave: t('workgroup.workStatus.leave'),
    meeting: t('workgroup.workStatus.meeting'),
    offline: t('workgroup.workStatus.offline'),
  }

  // 处理带目的地编码的状态（如 'away:japan'、'overseas:turkey'）
  if (status.includes(':')) {
    const [baseStatus, codeRaw] = status.split(':')
    const baseText = statusMap[baseStatus] || baseStatus
    const code = (codeRaw || '').trim()
    const destText = code ? (destinationLabelMap[code] || code) : ''
    return destText ? `${baseText} - ${destText}` : baseText
  }

  return statusMap[status] || status
}

const isEmployeeOnline = (employee: Employee): boolean => {
  // 1）优先根据最近登录时间判断（只要最近一段时间内登录过后台，就算“在线”）
  if (employee.lastLoginAt) {
    const last = new Date(employee.lastLoginAt).getTime()
    // 和后端统计逻辑保持一致：最近 15 分钟内登录算在线
    const threshold = Date.now() - 15 * 60 * 1000
    if (last >= threshold) {
      return true
    }
  }

  // 2）如果没有登录时间，或者超过阈值，则退回到工作状态字段
  const status = getEffectiveWorkStatus(employee)
  return status !== 'offline'
}

// 获取有效的工作状态（考虑会议状态）
const getEffectiveWorkStatus = (employee: Employee): string => {
  // 检查是否有会议状态（从 localStorage 读取）
  const meetingKey = `meeting_status_${employee.id}`
  const meetingInfoStr = localStorage.getItem(meetingKey)
  if (meetingInfoStr) {
    try {
      const meetingInfo = JSON.parse(meetingInfoStr)
      const now = new Date()
      const startTime = new Date(meetingInfo.startTime)
      const endTime = new Date(meetingInfo.endTime)
      
      // 如果当前时间在会议时间范围内，返回会议中
      if (now >= startTime && now <= endTime) {
        return 'meeting'
      }
    } catch (e) {
      // 忽略解析错误
    }
  }
  
  return employee.workStatus || 'available'
}

// 获取部门状态统计（只统计在职员工）
const getDepartmentStatusSummary = (employees: Employee[]) => {
  const statusCount: Record<string, number> = {}
  
  // 过滤离职员工
  const activeEmployees = employees.filter(emp => emp.employmentStatus !== 'resigned')
  
  activeEmployees.forEach(emp => {
    const status = getEffectiveWorkStatus(emp)
    // 只统计非空闲状态
    if (status !== 'available') {
      // 对于出差状态，统一统计为 'away'（不区分目的地）
      const baseStatus = status.startsWith('away') ? 'away' : status
      statusCount[baseStatus] = (statusCount[baseStatus] || 0) + 1
    }
  })
  
  // 转换为数组，按数量排序
  return Object.entries(statusCount)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)
}

// 根据工作状态获取员工列表
const getEmployeesByWorkStatus = (status: string): Employee[] => {
  const employees: Employee[] = []
  
  // 遍历所有部门的员工
  Object.values(groupedEmployees.value).forEach(deptEmployees => {
    deptEmployees.forEach(emp => {
      // 过滤离职员工
      if (emp.employmentStatus === 'resigned') {
        return
      }
      
      const workStatus = getEffectiveWorkStatus(emp)
      
      // 匹配状态
      if (status === 'away' && workStatus.startsWith('away')) {
        employees.push(emp)
      } else if (status === workStatus) {
        employees.push(emp)
      }
    })
  })
  
  return employees
}

// 统计“驻外”同事：工作状态为 overseas / overseas:countryCode，配合国家/城市信息展示
const getOverseasEmployees = (): Employee[] => {
  const overseas: Employee[] = []

  Object.values(groupedEmployees.value).forEach(deptEmployees => {
    deptEmployees.forEach(emp => {
      // 过滤离职员工
      if (emp.employmentStatus === 'resigned') {
        return
      }
      const status = getEffectiveWorkStatus(emp)
      const baseStatus = status.includes(':') ? status.split(':')[0] : status
      if (baseStatus === 'overseas') {
        overseas.push(emp)
      }
    })
  })

  return overseas
}

// 获取出差/驻外目的地（例如 workStatus = 'away:japan' 或 'overseas:japan' -> 返回 '日本 / Japan'）
const getAwayDestination = (employee: Employee): string => {
  const status = employee.workStatus || ''
  if (status.startsWith('away') || status.startsWith('overseas')) {
    const parts = status.split(':')
    if (parts.length > 1 && parts[1].trim()) {
      const code = parts[1].trim()
      return destinationLabelMap[code] || code
    }
  }
  return ''
}

// 获取展示用地区信息：preferAway 为 true 时优先使用出差目的地，否则使用国家 / 城市
const getDisplayLocation = (employee: Employee, preferAway = false): string => {
  const dest = getAwayDestination(employee)
  if (preferAway) {
    if (dest) return dest
  }
  const country = employee.country || ''
  const city = employee.city || ''
  if (country && city) return `${country} · ${city}`
  if (country) return country
  if (city) return city
  // 如果没有国家/城市信息，但有出差/驻外目的地，则也用于展示
  if (dest) return dest
  return '-'
}

// 计算当前在线人数（按工作状态是否为“离线”来统计）
const getOnlineCount = (): number => {
  let count = 0
  Object.values(groupedEmployees.value).forEach(deptEmployees => {
    deptEmployees.forEach(emp => {
      // 过滤离职员工
      if (emp.employmentStatus === 'resigned') return
      if (isEmployeeOnline(emp)) {
        count += 1
      }
    })
  })
  return count
}

const loadData = async () => {
  loading.value = true
  try {
    const [grouped, stats] = await Promise.all([
      getEmployeesGrouped(),
      getEmployeeStatistics(),
    ])
    groupedEmployees.value = grouped
    statistics.value = stats
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const getStatisticsCount = (status: string): number => {
  if (status === 'meeting') {
    return getEmployeesByWorkStatus('meeting').length
  }
  if (status === 'away') {
    const count = getEmployeesByWorkStatus('away').length
    return count || statistics.value?.workStatus?.away || 0
  }
  if (status === 'busy') {
    const count = getEmployeesByWorkStatus('busy').length
    return count || statistics.value?.workStatus?.busy || 0
  }
  if (status === 'leave') {
    const count = getEmployeesByWorkStatus('leave').length
    return count || statistics.value?.workStatus?.leave || 0
  }
  const workStatusStats = statistics.value?.workStatus as Record<string, number> | undefined
  return workStatusStats?.[status] || 0
}

const showBusinessCardDialog = ref(false)
const selectedCardEmployee = ref<Employee | null>(null)

const handleCommand = (command: string) => {
  if (command.startsWith('remind-')) {
    const parts = command.split('-')
    if (parts.length < 2 || !parts[1]) return
    const employeeId = parseInt(parts[1])
    if (isNaN(employeeId)) return
    const employee = findEmployeeById(employeeId)
    if (employee) {
      selectedEmployee.value = employee
      reminderForm.value = {
        content: '',
        memo: '',
        reminderTime: '',
      }
      showReminderDialog.value = true
    }
  } else if (command.startsWith('card-')) {
    const parts = command.split('-')
    if (parts.length < 2 || !parts[1]) return
    const employeeId = parseInt(parts[1])
    if (isNaN(employeeId)) return
    const employee = findEmployeeById(employeeId)
    if (employee) {
      selectedCardEmployee.value = employee
      showBusinessCardDialog.value = true
    }
  }
}


const findEmployeeById = (id: number): Employee | null => {
  for (const employees of Object.values(groupedEmployees.value)) {
    const employee = employees.find(emp => emp.id === id)
    if (employee) return employee
  }
  return null
}

const handleCreateReminder = async () => {
  if (!reminderFormRef.value) return
  
  try {
    await reminderFormRef.value.validate()
    
    if (!selectedEmployee.value) {
      ElMessage.error(t('common.error'))
      return
    }

    submitting.value = true

    const createData: CreateReminderDto = {
      targetUserId: selectedEmployee.value.id,
      content: reminderForm.value.content,
      memo: reminderForm.value.memo || undefined,
      reminderTime: reminderForm.value.reminderTime,
    }

    await createReminder(createData)
    ElMessage.success(t('workgroup.reminderCreated'))
    showReminderDialog.value = false
  } catch (error: any) {
    if (error !== false) { // 表单验证失败时error为false
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    submitting.value = false
  }
}

// 监听会议状态更新事件
const handleMeetingStatusUpdate = () => {
  // 重新加载数据以更新工作状态
  loadData()
}

// 监听用户信息更新事件（当个人设置更新时触发，重新加载员工数据以同步状态）
const handleProfileUpdate = () => {
  loadData()
}

let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadData()
  // 监听会议状态更新事件
  window.addEventListener('meeting-status-updated', handleMeetingStatusUpdate)
  
  // 设置定时刷新（每30秒刷新一次，实现实时同步）
  refreshTimer = setInterval(() => {
    loadData()
  }, 30000) // 30秒刷新一次
  
  // 监听用户信息更新事件
  window.addEventListener('profile-updated', handleProfileUpdate)
})

onBeforeUnmount(() => {
  // 组件卸载时清除定时器和事件监听
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  window.removeEventListener('meeting-status-updated', handleMeetingStatusUpdate)
  window.removeEventListener('profile-updated', handleProfileUpdate)
})
</script>

<style scoped lang="scss">
.workgroup-container {
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

  // 部门筛选工具条
  .departments-toolbar {
    margin: 16px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;

    .dept-tabs {
      flex: 1;

      .dept-tabs-inner {
        display: flex;
        gap: 8px;
        padding-bottom: 2px;
      }

      .dept-tab {
        cursor: pointer;
      }
    }

    .departments-search {
      width: 260px;

      :deep(.el-input__wrapper) {
        border-radius: 999px;
      }
    }
  }

  // 统计卡片
  .statistics-card {
    background: #ffffff;
    border: 1px solid #e5e5e7;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .statistics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;

      .statistic-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-radius: 12px;
        background: #f5f5f7;
        transition: all 0.2s ease;

        &:hover {
          background: #e8e8ed;
          transform: translateY(-1px);
        }

        .statistic-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          .el-icon {
            font-size: 24px;
          }

          &.total-icon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          &.away-icon {
            background: linear-gradient(135deg, #007aff 0%, #0051d5 100%);
            color: white;
          }

          &.leave-icon {
            background: linear-gradient(135deg, #86868b 0%, #6e6e73 100%);
            color: white;
          }

          &.meeting-icon {
            background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
            color: white;
          }

          &.busy-icon {
            background: linear-gradient(135deg, #ff3b30 0%, #d70015 100%);
            color: white;
          }
        }

        .statistic-content {
          flex: 1;
          min-width: 0;

          .statistic-label {
            font-size: 12px;
            color: #86868b;
            font-weight: 500;
            letter-spacing: -0.01em;
            margin-bottom: 4px;
          }

          .statistic-value {
            font-size: 24px;
            font-weight: 600;
            color: #1d1d1f;
            letter-spacing: -0.02em;
            line-height: 1.2;
          }

          .statistic-online {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #86868b;
            margin-top: 6px;
            font-weight: 500;

            .online-indicator {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #34c759;
              display: inline-block;
              animation: pulse 2s infinite;
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }

          .statistic-detail {
            font-size: 11px;
            color: #86868b;
            margin-top: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }

  // 部门列表：改为整行大卡片，纵向排布，阅读更舒展
  .departments-grid {
    display: grid;
    grid-template-columns: 1fr; // 每行一张部门卡片
    gap: 16px;

    .department-card {
      background: #ffffff;
      border: 1px solid #e5e5e7;
      border-radius: 16px;
      padding: 20px 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }

      .department-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f5f5f7;

        .department-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;

          .department-icon {
            font-size: 20px;
            color: #007aff;
          }

          .department-name {
            font-size: 16px;
            font-weight: 600;
            color: #1d1d1f;
            letter-spacing: -0.01em;
          }

          .department-status-summary {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-left: 8px;

            .status-summary-tag {
              border-radius: 8px;
              font-size: 11px;
              padding: 2px 8px;
              font-weight: 500;
            }
          }
        }

        .department-count {
          border-radius: 12px;
          font-weight: 500;
        }
      }

      .employees-list {
        // 员工区域采用响应式网格化布局，在一张部门大卡片里最多可放多列小卡片
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 12px 16px;

        .employee-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          transition: background-color 0.2s ease;

          &:hover {
            background: #f5f5f7;
          }

          .employee-avatar {
            background: #007aff;
            color: white;
            font-weight: 600;
            flex-shrink: 0;
            border: 2px solid #e5e5e7;
            transition: all 0.3s ease;

            &.offline {
              filter: grayscale(100%);
              opacity: 0.6;
              border-color: #d1d1d6;
            }
          }

          .employee-info {
            flex: 1;
            min-width: 0;
            transition: all 0.3s ease;

            &.offline {
              opacity: 0.6;

              .employee-name {
                color: #86868b;
              }

              .employee-details {
                color: #a8a8aa;
              }
            }

            .employee-name-row {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 4px;
              flex-wrap: wrap;
              
              .employee-name {
                font-size: 15px;
                font-weight: 600;
                color: #1d1d1f;
                letter-spacing: -0.01em;
                transition: color 0.3s ease;
              }

              .work-status-tag {
                border-radius: 8px;
                font-weight: 500;
                font-size: 11px;
                padding: 2px 8px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                
                .work-status-icon {
                  font-size: 12px;
                }
              }
            }

            .employee-details {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 12px;
              color: #86868b;

              .employee-separator {
                color: #d1d1d6;
              }
            }
          }

          .employee-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;

            .status-tag {
              border-radius: 8px;
              font-weight: 500;
              display: inline-flex;
              align-items: center;
              gap: 4px;

              .work-status-icon-small {
                font-size: 12px;
              }
            }

            .action-button {
              padding: 6px;
              color: #86868b;
              transition: color 0.2s ease;

              &:hover {
                color: #007aff;
              }
            }
          }
        }
      }
    }
  }
}

// 名片对话框样式
:deep(.business-card-dialog) {
  .el-dialog {
    border-radius: 20px;
    overflow: hidden;
  }
  
  .el-dialog__header {
    padding: 24px 32px 20px;
    border-bottom: 1px solid #f5f5f7;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    
    .el-dialog__title {
      font-size: 20px;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -0.02em;
    }
  }
  
  .el-dialog__body {
    padding: 0;
  }
  
  .business-card-content {
    padding: 40px 32px 32px;
    background: #ffffff;
    
    // 顶部区域
    .card-top-section {
      display: flex;
      align-items: flex-start;
      gap: 32px;
      margin-bottom: 40px;
      padding-bottom: 32px;
      border-bottom: 2px solid #f5f5f7;
      
      .card-avatar-wrapper {
        position: relative;
        flex-shrink: 0;
        
        .card-avatar {
          border: 4px solid #ffffff;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease;
          
          &:hover {
            transform: scale(1.05);
          }
        }
        
        .card-status-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          background: #ffffff;
          border-radius: 20px;
          padding: 3px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          
          .status-badge-tag {
            border-radius: 16px;
            font-weight: 500;
            font-size: 11px;
            padding: 5px 12px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            border: none;
            white-space: nowrap;
            
            .status-badge-icon {
              font-size: 12px;
              flex-shrink: 0;
            }
          }
        }
      }
      
      .card-name-section {
        flex: 1;
        min-width: 0;
        
        .card-name {
          margin: 0 0 12px 0;
          font-size: 32px;
          font-weight: 700;
          color: #1d1d1f;
          letter-spacing: -0.03em;
          line-height: 1.2;
        }
        
        .card-names-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          
          .card-chinese-name {
            font-size: 16px;
            color: #86868b;
            font-weight: 500;
          }
          
          .name-separator {
            color: #d1d1d6;
            font-size: 16px;
          }
          
          .card-english-name {
            font-size: 16px;
            color: #86868b;
            font-weight: 500;
            font-style: italic;
          }
        }
        
        .card-role-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          
          .card-position {
            font-size: 15px;
            color: #007aff;
            font-weight: 600;
            background: #f0f7ff;
            padding: 6px 14px;
            border-radius: 12px;
          }
          
          .role-separator {
            color: #d1d1d6;
            font-size: 14px;
          }
          
          .card-department {
            font-size: 15px;
            color: #86868b;
            font-weight: 500;
          }
        }

        .card-signature {
          margin-top: 8px;
          font-size: 13px;
          color: #a8a8aa;
          font-style: italic;
          line-height: 1.5;
        }
        
        .card-location-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 10px 14px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e5e5e7;
          
          .location-icon {
            font-size: 18px;
            color: #007aff;
            flex-shrink: 0;
          }
          
          .location-text {
            font-size: 14px;
            color: #515154;
            font-weight: 500;
          }
        }
      }
    }
    
    // 信息网格区域
    .card-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      
      .card-info-card {
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        border: 1px solid #e5e5e7;
        border-radius: 16px;
        padding: 20px;
        display: flex;
        align-items: flex-start;
        gap: 16px;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border-color: #007aff;
        }
        
        .info-card-icon-wrapper {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #007aff 0%, #0051d5 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
          
          .info-card-icon {
            font-size: 24px;
            color: #ffffff;
          }
        }
        
        .info-card-content {
          flex: 1;
          min-width: 0;
          
          .info-card-label {
            font-size: 12px;
            color: #86868b;
            font-weight: 500;
            margin-bottom: 8px;
            letter-spacing: -0.01em;
            text-transform: uppercase;
          }
          
          .info-card-value {
            font-size: 16px;
            color: #1d1d1f;
            font-weight: 600;
            line-height: 1.5;
            word-break: break-word;
            
            &.mood-text {
              font-weight: 500;
              font-style: italic;
              color: #515154;
            }
          }
        }
      }
    }
  }
}

// 提醒对话框样式
:deep(.reminder-dialog) {
  .el-dialog {
    border-radius: 16px;
  }

  .el-form-item__label {
    color: #1d1d1f;
    font-weight: 500;
  }

  .el-input__wrapper {
    border-radius: 10px;
    border-color: #e5e5e7;
  }
}

// 工作状态下拉列表样式
:deep(.work-status-popover) {
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);

  .employee-popover-list {
  max-height: 320px;
  overflow-y: auto;

  .empty-text {
    text-align: center;
    color: #86868b;
    font-size: 13px;
    padding: 20px 0;
  }

  .popover-employee-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 10px;
    border-radius: 12px;
    background: #f8f9fb;
    border: 1px solid #eceef2;
    transition: all 0.2s ease;

    &:hover {
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }

    .popover-avatar {
      background: #007aff;
      color: white;
      font-weight: 600;
      flex-shrink: 0;
      margin-bottom: 6px;
    }

    .popover-employee-info {
      text-align: center;
      width: 100%;

      .popover-employee-name {
        font-size: 14px;
        font-weight: 500;
        color: #1d1d1f;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .popover-employee-location {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #86868b;

        .location-icon {
          font-size: 12px;
          color: #d1d1d6;
        }

        .location-text {
          max-width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .workgroup-container {
    padding: 20px;

    .departments-toolbar {
      flex-direction: column;
      align-items: stretch;

      .departments-search {
        width: 100%;
      }
    }
  }
}

@media (max-width: 768px) {
  .workgroup-container {
    padding: 16px;

    .statistics-card {
      .statistics-grid {
        grid-template-columns: 1fr;
      }
    }

    .departments-grid {
      grid-template-columns: 1fr;

      .department-card {
        .employees-list {
          .employee-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;

            .employee-actions {
              width: 100%;
              justify-content: flex-end;
            }
          }
        }
      }
    }
  }
}
</style>

