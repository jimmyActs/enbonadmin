<template>
  <div class="recruitment-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><UserFilled /></el-icon>
            <span>{{ $t('hr.recruitment.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="showDemandDialog = true" v-if="canCreateDemand">
              {{ $t('hr.recruitment.newDemand') }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="showCandidateDialog = true">
              {{ $t('hr.recruitment.addCandidate') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-item">
          <div class="stat-value primary">{{ stats.total || 0 }}</div>
          <div class="stat-label">{{ $t('hr.recruitment.totalCandidates') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value warning">{{ stats.interviewing || 0 }}</div>
          <div class="stat-label">{{ $t('hr.recruitment.interviewing') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value success">{{ stats.hired || 0 }}</div>
          <div class="stat-label">{{ $t('hr.recruitment.hired') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value danger">{{ stats.rejected || 0 }}</div>
          <div class="stat-label">{{ $t('hr.recruitment.rejected') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.recruitment?.funnel?.hireRate || 0 }}%</div>
          <div class="stat-label">{{ $t('hr.recruitment.hireRate') }}</div>
        </div>
      </div>

      <!-- Tab切换 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 招聘需求 -->
        <el-tab-pane :label="$t('hr.recruitment.demands')" name="demands">
          <el-table :data="demands" stripe v-loading="loading" size="small">
            <el-table-column prop="department" :label="$t('hr.recruitment.department')" width="120" />
            <el-table-column prop="position" :label="$t('hr.recruitment.position')" width="150" />
            <el-table-column prop="headcount" :label="$t('hr.recruitment.headcount')" width="100" />
            <el-table-column prop="filledCount" :label="$t('hr.recruitment.filledCount')" width="100" />
            <el-table-column prop="requesterName" :label="$t('hr.recruitment.requester')" width="100" />
            <el-table-column prop="status" :label="$t('hr.recruitment.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="getDemandStatusType(row.status)" size="small">
                  {{ getDemandStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operations')" width="150">
              <template #default="{ row }">
                <el-button v-if="row.status === 'pending'" type="success" size="small" @click="handleApprove(row)">
                  {{ $t('hr.recruitment.approve') }}
                </el-button>
                <el-button v-if="row.status === 'pending'" type="danger" size="small" @click="handleRejectDemand(row)">
                  {{ $t('hr.recruitment.reject') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 候选人池 -->
        <el-tab-pane :label="$t('hr.recruitment.candidates')" name="candidates">
          <!-- 筛选区域 -->
          <div class="filter-bar">
            <el-select
              v-model="candidateFilters.status"
              :placeholder="$t('hr.recruitment.filterByStatus')"
              clearable
              style="width: 140px; margin-right: 12px;"
              @change="loadCandidates"
            >
              <el-option :label="$t('hr.recruitment.all')" value="" />
              <el-option :label="$t('hr.recruitment.statuses.pending')" value="pending" />
              <el-option :label="$t('hr.recruitment.statuses.interviewing')" value="interviewing" />
              <el-option :label="$t('hr.recruitment.statuses.offered')" value="offered" />
              <el-option :label="$t('hr.recruitment.statuses.hired')" value="hired" />
              <el-option :label="$t('hr.recruitment.statuses.rejected')" value="rejected" />
            </el-select>
            <el-select
              v-model="candidateFilters.source"
              :placeholder="$t('hr.recruitment.filterBySource')"
              clearable
              style="width: 140px; margin-right: 12px;"
              @change="loadCandidates"
            >
              <el-option :label="$t('hr.recruitment.all')" value="" />
              <el-option :label="$t('hr.recruitment.channels.boss')" value="boss" />
              <el-option :label="$t('hr.recruitment.channels.zhilian')" value="zhilian" />
              <el-option :label="$t('hr.recruitment.channels.liepin')" value="liepin" />
              <el-option :label="$t('hr.recruitment.channels.referral')" value="referral" />
              <el-option :label="$t('hr.recruitment.channels.headhunter')" value="headhunter" />
            </el-select>
            <el-input
              v-model="candidateFilters.keyword"
              :placeholder="$t('hr.recruitment.searchPlaceholder')"
              clearable
              style="width: 200px; margin-right: 12px;"
              @input="loadCandidates"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <el-table :data="candidates" stripe v-loading="loading">
            <el-table-column prop="name" :label="$t('hr.recruitment.name')" width="100" />
            <el-table-column prop="gender" :label="$t('hr.recruitment.gender')" width="80" />
            <el-table-column prop="phone" :label="$t('hr.recruitment.phone')" width="130" />
            <el-table-column prop="email" :label="$t('hr.recruitment.email')" min-width="150" />
            <el-table-column prop="source" :label="$t('hr.recruitment.source')" width="100">
              <template #default="{ row }">
                {{ getSourceText(row.source) }}
              </template>
            </el-table-column>
            <el-table-column prop="expectedSalary" :label="$t('hr.recruitment.expectedSalary')" width="120">
              <template #default="{ row }">
                {{ row.expectedSalary ? '¥' + row.expectedSalary?.toLocaleString() : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" :label="$t('hr.recruitment.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="getCandidateStatusType(row.status)" size="small">
                  {{ getCandidateStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operations')" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" :icon="Edit" @click="handleEditCandidate(row)" />
                <el-button type="success" size="small" @click="handleUpdateStatus(row, 'interviewing')">
                  {{ $t('hr.recruitment.toInterview') }}
                </el-button>
                <el-button type="danger" size="small" :icon="Delete" @click="handleDeleteCandidate(row)" />
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="candidatePagination.page"
              v-model:page-size="candidatePagination.pageSize"
              :total="candidatePagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              @size-change="loadCandidates"
              @current-change="loadCandidates"
            />
          </div>
        </el-tab-pane>

        <!-- 渠道分析 -->
        <el-tab-pane :label="$t('hr.recruitment.channelAnalysis')" name="channels">
          <el-table :data="stats.sourceStats || []" stripe>
            <el-table-column prop="source" :label="$t('hr.recruitment.source')" width="150">
              <template #default="{ row }">
                {{ getSourceText(row.source) }}
              </template>
            </el-table-column>
            <el-table-column prop="total" :label="$t('hr.recruitment.resumeCount')" width="150">
              <template #default="{ row }">
                {{ row.total }}
              </template>
            </el-table-column>
            <el-table-column prop="hired" :label="$t('hr.recruitment.hired')" width="150" />
            <el-table-column prop="hireRate" :label="$t('hr.recruitment.hireRate')" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.hireRate" :color="getProgressColor(row.hireRate)" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 面试日历 -->
        <el-tab-pane :label="$t('hr.recruitment.interviewCalendar')" name="calendar">
          <!-- 月份切换 -->
          <div class="calendar-header">
            <el-button :icon="ArrowLeft" size="small" @click="prevMonth" />
            <span class="calendar-month-label">{{ calendarYear }}年{{ calendarMonth }}月</span>
            <el-button :icon="ArrowRight" size="small" @click="nextMonth" />
            <el-button size="small" @click="goToCurrentMonth">{{ $t('common.today') }}</el-button>
          </div>

          <!-- 统计 -->
          <div class="calendar-stats">
            <el-tag type="warning">{{ interviewCandidates.length }} {{ $t('hr.recruitment.interviewsScheduled') }}</el-tag>
            <el-tag type="success">{{ interviewCandidates.filter(c => c.status === 'hired').length }} {{ $t('hr.recruitment.hired') }}</el-tag>
          </div>

          <!-- 日历格子 -->
          <div class="calendar-grid">
            <div class="calendar-weekday" v-for="d in weekdays" :key="d">{{ d }}</div>
            <div
              v-for="(day, idx) in calendarDays"
              :key="idx"
              class="calendar-day"
              :class="{
                'other-month': day.isOtherMonth,
                'today': day.isToday,
                'has-interviews': day.candidates.length > 0,
              }"
            >
              <span class="day-num">{{ day.date }}</span>
              <div class="day-events">
                <div
                  v-for="c in day.candidates.slice(0, 2)"
                  :key="c.id"
                  class="event-item"
                  :class="'status-' + c.status"
                  @click="handleScheduleInterview(c)"
                  :title="c.name + ' - ' + getSourceText(c.source)"
                >
                  {{ c.name }}
                </div>
                <div v-if="day.candidates.length > 2" class="event-more" @click="calendarMonth = calendarMonth; loadCalendarCandidates">
                  +{{ day.candidates.length - 2 }}
                </div>
              </div>
            </div>
          </div>

          <!-- 面试列表 -->
          <div class="interview-list" v-if="interviewCandidates.length">
            <div class="list-title">{{ $t('hr.recruitment.upcomingInterviews') }}</div>
            <el-table :data="interviewCandidates" stripe size="small">
              <el-table-column prop="name" :label="$t('hr.recruitment.name')" width="100" />
              <el-table-column prop="interviewTime" :label="$t('hr.recruitment.interviewTime')" width="160">
                <template #default="{ row }">
                  {{ row.interviewTime ? new Date(row.interviewTime).toLocaleString('zh-CN') : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="interviewerName" :label="$t('hr.recruitment.interviewer')" width="120" />
              <el-table-column prop="interviewRecord" :label="$t('hr.recruitment.interviewRecord')" min-width="150" show-overflow-tooltip />
              <el-table-column prop="status" :label="$t('hr.recruitment.status')" width="100">
                <template #default="{ row }">
                  <el-tag :type="getCandidateStatusType(row.status)" size="small">{{ getCandidateStatusText(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('common.operations')" width="120">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click="handleScheduleInterview(row)">{{ $t('hr.recruitment.reschedule') }}</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增需求对话框 -->
    <el-dialog v-model="showDemandDialog" :title="$t('hr.recruitment.newDemand')" width="600px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <el-form ref="demandFormRef" :model="demandForm" label-width="120px">
        <el-form-item :label="$t('hr.recruitment.department')" prop="department">
          <el-select v-model="demandForm.department" filterable clearable :placeholder="$t('hr.recruitment.selectDepartment')" style="width: 100%;">
            <el-option
              v-for="dept in departmentOptions"
              :key="dept.value"
              :label="dept.label"
              :value="dept.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.position')" prop="position">
          <el-select v-model="demandForm.position" filterable clearable :placeholder="$t('hr.recruitment.selectPosition')" style="width: 100%;">
            <el-option
              v-for="pos in positionOptions"
              :key="pos.code"
              :label="pos.label"
              :value="pos.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.headcount')" prop="headcount">
          <el-input-number v-model="demandForm.headcount" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.requirements')">
          <el-input v-model="demandForm.requirements" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.reason')">
          <el-input v-model="demandForm.reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.notes')">
          <el-input v-model="demandForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDemandDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveDemand" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增候选人对话框 -->
    <el-dialog v-model="showCandidateDialog" :title="$t('hr.recruitment.addCandidate')" width="700px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <el-form ref="candidateFormRef" :model="candidateForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.name')" prop="name">
              <el-input v-model="candidateForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.gender')">
              <el-select v-model="candidateForm.gender" style="width: 100%;">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.phone')" prop="phone">
              <el-input v-model="candidateForm.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.email')">
              <el-input v-model="candidateForm.email" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.source')" prop="source">
              <el-select v-model="candidateForm.source" style="width: 100%;">
                <el-option :label="$t('hr.recruitment.channels.boss')" value="boss" />
                <el-option :label="$t('hr.recruitment.channels.zhilian')" value="zhilian" />
                <el-option :label="$t('hr.recruitment.channels.liepin')" value="liepin" />
                <el-option :label="$t('hr.recruitment.channels.referral')" value="referral" />
                <el-option :label="$t('hr.recruitment.channels.headhunter')" value="headhunter" />
                <el-option :label="$t('hr.recruitment.channels.website')" value="website" />
                <el-option :label="$t('hr.recruitment.channels.campus')" value="campus" />
                <el-option :label="$t('hr.recruitment.channels.other')" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.expectedSalary')">
              <el-input-number v-model="candidateForm.expectedSalary" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.education')">
              <el-input v-model="candidateForm.education" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.experience')">
              <el-input v-model="candidateForm.experience" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('hr.recruitment.currentCompany')">
          <el-input v-model="candidateForm.currentCompany" />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.notes')">
          <el-input v-model="candidateForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCandidateDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveCandidate" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 面试安排对话框 -->
    <el-dialog v-model="showInterviewDialog" :title="$t('hr.recruitment.scheduleInterview')" width="600px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <el-form ref="interviewFormRef" :model="interviewForm" label-width="130px">
        <el-form-item :label="$t('hr.recruitment.name')">
          <el-input :value="schedulingCandidate?.name || ''" disabled />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.interviewTime')" prop="interviewTime">
          <el-date-picker
            v-model="interviewForm.interviewTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="$t('hr.recruitment.selectInterviewTime')"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.interviewer')">
          <el-input v-model="interviewForm.interviewerName" :placeholder="$t('hr.recruitment.interviewerPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.sendEmailNotification')">
          <el-switch v-model="interviewForm.sendEmail" />
          <span class="email-notice-tip">{{ $t('hr.recruitment.emailNoticeTip') }}</span>
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.emailTemplate')" v-if="interviewForm.sendEmail">
          <el-input v-model="interviewForm.emailContent" type="textarea" :rows="4"
            :placeholder="$t('hr.recruitment.emailContentPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.interviewRecord')">
          <el-input v-model="interviewForm.interviewRecord" type="textarea" :rows="3"
            :placeholder="$t('hr.recruitment.interviewRecordPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInterviewDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveInterview" :loading="savingInterview">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { UserFilled, Plus, Edit, Delete, Search, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useUserStore } from '../../store/user'
import { departments, allPositions } from '../../utils/organization'
import {
  getRecruitmentDemands, createRecruitmentDemand, approveRecruitmentDemand, rejectRecruitmentDemand,
  getCandidates, createCandidate, updateCandidate, updateCandidateStatus, deleteCandidate,
  getRecruitmentStats, scheduleInterview, sendInterviewEmail,
  type HrRecruitmentDemand, type HrCandidate,
} from '../../api/hr'

const { t, locale } = useI18n()
const userStore = useUserStore()

// 只有 HR 权限的人才可以在招聘管理 tab 中新增需求
const canCreateDemand = computed(() =>
  userStore.hasPermission('hr.recruitment.board.view') || userStore.isSuperAdmin
)

// 部门下拉选项
const departmentOptions = computed(() => {
  return departments.map(dept => ({
    value: dept.value,
    label: locale.value === 'en-US' ? dept.labelEn : dept.label,
  }))
})

// 岗位下拉选项
const positionOptions = computed(() => {
  return allPositions.map(pos => ({
    code: pos.code,
    label: locale.value === 'en-US' ? pos.nameEn : pos.name,
  }))
})

const loading = ref(false)
const saving = ref(false)
const savingInterview = ref(false)
const activeTab = ref('demands')

// 统计数据
const stats = ref<any>({
  total: 0, interviewing: 0, hired: 0, rejected: 0, pending: 0,
  sourceStats: [],
  funnel: { resumes: 0, interviews: 0, offers: 0, hires: 0, hireRate: 0 },
})

// 需求列表
const demands = ref<HrRecruitmentDemand[]>([])

// 候选人列表
const candidates = ref<HrCandidate[]>([])
const candidateFilters = reactive({
  status: '',
  source: '',
  keyword: '',
})
const candidatePagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 面试日历
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1
const calendarYear = ref(currentYear)
const calendarMonth = ref(currentMonth)
const interviewCandidates = ref<HrCandidate[]>([])
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 对话框
const showDemandDialog = ref(false)
const showCandidateDialog = ref(false)
const showInterviewDialog = ref(false)
const demandFormRef = ref<FormInstance>()
const candidateFormRef = ref<FormInstance>()
const interviewFormRef = ref<FormInstance>()
const schedulingCandidate = ref<HrCandidate | null>(null)

const demandForm = reactive({
  department: '',
  position: '',
  headcount: 1,
  requirements: '',
  reason: '',
  notes: '',
})

const candidateForm = reactive({
  name: '',
  gender: '',
  phone: '',
  email: '',
  source: '' as any,
  expectedSalary: 0,
  education: '',
  major: '',
  experience: '',
  currentCompany: '',
  currentPosition: '',
  notes: '',
})

const editingCandidate = ref<HrCandidate | null>(null)

const interviewForm = reactive({
  interviewTime: '',
  interviewerName: '',
  interviewRecord: '',
  sendEmail: true,
  emailContent: '',
})

const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()

  const days: { date: number; isOtherMonth: boolean; isToday: boolean; candidates: HrCandidate[] }[] = []
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ date: daysInPrevMonth - i, isOtherMonth: true, isToday: false, candidates: [] })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const today = new Date()
    const isToday = d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayCands = interviewCandidates.value.filter(c => {
      if (!c.interviewTime) return false
      return c.interviewTime.startsWith(dayStr)
    })
    days.push({ date: d, isOtherMonth: false, isToday, candidates: dayCands })
  }
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: d, isOtherMonth: true, isToday: false, candidates: [] })
  }
  return days
})

// 加载统计数据
const loadStats = async () => {
  try {
    stats.value = await getRecruitmentStats()
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

// 加载需求列表
const loadDemands = async () => {
  loading.value = true
  try {
    const res = await getRecruitmentDemands()
    demands.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

// 加载候选人列表
const loadCandidates = async () => {
  loading.value = true
  try {
    const params: any = {
      page: candidatePagination.page,
      pageSize: candidatePagination.pageSize,
    }
    if (candidateFilters.status) params.status = candidateFilters.status
    if (candidateFilters.source) params.source = candidateFilters.source
    if (candidateFilters.keyword) params.keyword = candidateFilters.keyword

    const res = await getCandidates(params)
    candidates.value = res.data
    candidatePagination.total = res.total
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

// 保存需求
const handleSaveDemand = async () => {
  if (!demandFormRef.value) return
  try {
    await demandFormRef.value.validate()
    saving.value = true
    await createRecruitmentDemand(demandForm)
    ElMessage.success(t('common.success'))
    showDemandDialog.value = false
    loadDemands()
    loadStats()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

// 审批需求
const handleApprove = async (row: HrRecruitmentDemand) => {
  try {
    await approveRecruitmentDemand(row.id)
    ElMessage.success(t('common.success'))
    loadDemands()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

const handleRejectDemand = async (row: HrRecruitmentDemand) => {
  try {
    await rejectRecruitmentDemand(row.id)
    ElMessage.success(t('common.success'))
    loadDemands()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 保存候选人
const handleSaveCandidate = async () => {
  if (!candidateFormRef.value) return
  try {
    await candidateFormRef.value.validate()
    saving.value = true

    if (editingCandidate.value) {
      await updateCandidate(editingCandidate.value.id, candidateForm)
    } else {
      await createCandidate(candidateForm)
    }

    ElMessage.success(t('common.success'))
    showCandidateDialog.value = false
    loadCandidates()
    loadStats()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleEditCandidate = (row: HrCandidate) => {
  editingCandidate.value = row
  Object.assign(candidateForm, { ...row })
  showCandidateDialog.value = true
}

const handleUpdateStatus = async (row: HrCandidate, status: any) => {
  try {
    await updateCandidateStatus(row.id, { status })
    ElMessage.success(t('common.success'))
    loadCandidates()
    loadStats()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

const handleDeleteCandidate = async (row: HrCandidate) => {
  try {
    await deleteCandidate(row.id)
    ElMessage.success(t('common.success'))
    loadCandidates()
    loadStats()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 状态显示
const getDemandStatusType = (status: string): string => {
  const map: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger', filled: 'info' }
  return map[status] || 'info'
}

const getDemandStatusText = (status: string): string => {
  return t(`hr.recruitment.demandStatuses.${status}`) || status
}

const getCandidateStatusType = (status: string): string => {
  const map: Record<string, string> = { pending: 'info', interviewing: 'warning', offered: 'primary', hired: 'success', rejected: 'danger', withdrawn: 'info' }
  return map[status] || 'info'
}

const getCandidateStatusText = (status: string): string => {
  return t(`hr.recruitment.statuses.${status}`) || status
}

const getSourceText = (source: string): string => {
  return t(`hr.recruitment.channels.${source}`) || source
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 50) return '#67c23a'
  if (percentage >= 30) return '#e6a23c'
  return '#f56c6c'
}

// 面试日历相关
const loadCalendarCandidates = async () => {
  try {
    const allCandidates = await getCandidates({ page: 1, pageSize: 1000, status: 'interviewing' as any })
    interviewCandidates.value = allCandidates.data
  } catch {}
}

// 月份导航方法（处理跨年）
const prevMonth = () => {
  if (calendarMonth.value === 1) {
    calendarMonth.value = 12
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
}

const nextMonth = () => {
  if (calendarMonth.value === 12) {
    calendarMonth.value = 1
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
}

const goToCurrentMonth = () => {
  calendarMonth.value = currentMonth
  calendarYear.value = currentYear
}

const handleScheduleInterview = (candidate: HrCandidate) => {
  schedulingCandidate.value = candidate
  interviewForm.interviewTime = candidate.interviewTime || ''
  interviewForm.interviewerName = candidate.interviewerName || ''
  interviewForm.interviewRecord = candidate.interviewRecord || ''
  interviewForm.sendEmail = true
  interviewForm.emailContent = `尊敬的 ${candidate.name}：

您好！恭喜您通过了初步筛选，邀请您参加面试。

面试时间：待确认
面试地点：待确认
面试官：待确认

请回复确认参加面试。如有疑问请联系人事部。

祝好！
人事部`
  showInterviewDialog.value = true
}

const handleSaveInterview = async () => {
  if (!schedulingCandidate.value) return
  savingInterview.value = true
  try {
    await updateCandidateStatus(schedulingCandidate.value.id, {
      status: 'interviewing',
    })
    // 更新面试信息
    const body: any = { ...candidateForm }
    Object.assign(body, {
      interviewTime: interviewForm.interviewTime || undefined,
      interviewerName: interviewForm.interviewerName || undefined,
      interviewRecord: interviewForm.interviewRecord || undefined,
    })
    await updateCandidate(schedulingCandidate.value.id, body)
    // 发送邮件通知
    if (interviewForm.sendEmail && schedulingCandidate.value.email) {
      try {
        await sendInterviewEmail(schedulingCandidate.value.id, {
          email: schedulingCandidate.value.email,
          subject: `面试邀请 - ${schedulingCandidate.value.name}`,
          content: interviewForm.emailContent,
        })
        ElMessage.success(t('hr.recruitment.emailSentSuccess') || '面试邀请已发送')
      } catch (emailError: any) {
        // 邮件发送失败不影响主流程，只提示警告
        ElMessage.warning('面试信息已保存，但邮件发送失败：' + (emailError.message || ''))
      }
    }
    ElMessage.success(t('common.success'))
    showInterviewDialog.value = false
    loadCalendarCandidates()
    loadCandidates()
    loadStats()
  } catch (error: any) {
    if (error !== false) ElMessage.error(error.message || t('common.error'))
  } finally {
    savingInterview.value = false
  }
}

// Tab 切换时刷新对应数据
const handleTabChange = (tab: string) => {
  if (tab === 'demands') {
    loadDemands()
  } else if (tab === 'candidates') {
    loadCandidates()
  } else if (tab === 'calendar') {
    loadCalendarCandidates()
  }
  // 始终刷新统计数据
  loadStats()
}

onMounted(() => {
  loadStats()
  loadDemands()
  loadCandidates()
})
</script>

<style scoped lang="scss">
.recruitment-module {
  .module-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #1d1d1f;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .stats-cards {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;

      .stat-item {
        flex: 1;
        text-align: center;

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1d1d1f;

          &.primary { color: #007aff; }
          &.success { color: #67c23a; }
          &.warning { color: #e6a23c; }
          &.danger { color: #f56c6c; }
        }

        .stat-label {
          font-size: 12px;
          color: #86868b;
          margin-top: 4px;
        }
      }
    }

    .filter-bar {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    .pagination-wrapper {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }

    .calendar-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      .calendar-month-label { font-weight: 600; font-size: 16px; min-width: 120px; text-align: center; }
    }
    .calendar-stats { display: flex; gap: 12px; margin-bottom: 16px; }
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      background: #f5f5f5;
      border-radius: 8px;
      padding: 8px;
      margin-bottom: 20px;
      .calendar-weekday {
        text-align: center;
        font-weight: 600;
        font-size: 12px;
        color: #909399;
        padding: 8px 0;
      }
      .calendar-day {
        background: #fff;
        border-radius: 6px;
        min-height: 80px;
        padding: 4px;
        position: relative;
        &.other-month { opacity: 0.4; }
        &.today { background: #ecf5ff; border: 1px solid #409eff; }
        .day-num { font-size: 12px; color: #606266; font-weight: 600; margin-bottom: 2px; }
        .day-events { display: flex; flex-direction: column; gap: 2px; }
        .event-item {
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 3px;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          &.status-pending { background: #f4f4f5; color: #909399; }
          &.status-interviewing { background: #fdf6ec; color: #e6a23c; }
          &.status-hired { background: #f0f9eb; color: #67c23a; }
          &.status-rejected { background: #fef0f0; color: #f56c6c; }
          &.status-offered { background: #ecf5ff; color: #409eff; }
        }
        .event-more { font-size: 10px; color: #409eff; cursor: pointer; }
      }
    }
    .interview-list {
      .list-title { font-weight: 600; font-size: 14px; margin-bottom: 12px; }
    }
    .email-notice-tip { margin-left: 8px; font-size: 12px; color: #909399; }
  }
}
</style>
