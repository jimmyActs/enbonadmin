<template>
  <div class="hr-dashboard page-content-enter" v-loading="loading">
    <!-- 人员概览 -->
    <el-card v-if="showOverviewCard" class="section-card overview-card fade-in-up">
      <template #header>
        <div class="card-header">
          <span>{{ $t('hr.dashboard.personnelOverview') }}</span>
        </div>
      </template>
      <el-row v-if="showHeadcountStat" :gutter="20" class="overview-kpis">
        <el-col :xs="12" :sm="6">
          <div class="kpi-pill">
            <div class="kpi-value">{{ employeeStats.total || 0 }}</div>
            <div class="kpi-label">{{ $t('hr.dashboard.totalHeadcount') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="kpi-pill">
            <div class="kpi-value">{{ personnelExtras.active }}</div>
            <div class="kpi-label">{{ $t('hr.dashboard.activeEmployees') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="kpi-pill accent-join">
            <div class="kpi-value">+{{ personnelExtras.joinThisMonth }}</div>
            <div class="kpi-label">{{ $t('hr.dashboard.joinThisMonth') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="kpi-pill accent-leave">
            <div class="kpi-value">-{{ personnelExtras.leaveThisMonth }}</div>
            <div class="kpi-label">{{ $t('hr.dashboard.leaveThisMonth') }}</div>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="24" class="overview-charts">
        <el-col v-if="showGenderChart" :xs="24" :lg="12">
          <div class="chart-subtitle">{{ $t('hr.dashboard.genderRatio') }}</div>
          <v-chart
            :key="`gender-${chartAnimKey}`"
            class="echart-box"
            :option="genderChartOption"
            autoresize
          />
        </el-col>
        <el-col v-if="showDepartmentChart" :xs="24" :lg="12">
          <div class="chart-subtitle">{{ $t('hr.dashboard.departmentDistribution') }}</div>
          <v-chart
            :key="`dept-${chartAnimKey}`"
            class="echart-box"
            :option="departmentBarOption"
            autoresize
          />
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="24" class="stats-row fade-in-up">
      <el-col v-if="showAttendanceStat" :xs="24" :sm="12" :lg="6">
        <div class="stat-card attendance-card">
          <div class="stat-icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.attendance?.attendanceRate || 0 }}%</div>
            <div class="stat-label">{{ $t('hr.dashboard.attendanceRate') }}</div>
            <div class="stat-sub">{{ $t('hr.dashboard.present') }}: {{ stats.attendance?.present || 0 }}</div>
          </div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
            {{ stats.attendance?.late || 0 }} {{ $t('hr.dashboard.lateCount') }}
          </div>
        </div>
      </el-col>

      <el-col v-if="showRecruitmentStat" :xs="24" :sm="12" :lg="6">
        <div class="stat-card recruitment-card">
          <div class="stat-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.recruitment?.total || 0 }}</div>
            <div class="stat-label">{{ $t('hr.dashboard.totalCandidates') }}</div>
            <div class="stat-sub">{{ $t('hr.dashboard.hired') }}: {{ stats.recruitment?.hired || 0 }}</div>
          </div>
          <div class="stat-trend">
            <el-icon><TrendCharts /></el-icon>
            {{ stats.recruitment?.interviewRate || 0 }}% {{ $t('hr.dashboard.interviewRate') }}
          </div>
        </div>
      </el-col>

      <el-col v-if="showPerformanceStat" :xs="24" :sm="12" :lg="6">
        <div class="stat-card performance-card">
          <div class="stat-icon">
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.performance?.avgScore || 0 }}</div>
            <div class="stat-label">{{ $t('hr.dashboard.avgScore') }}</div>
            <div class="stat-sub">{{ $t('hr.dashboard.totalRecords') }}: {{ stats.performance?.total || 0 }}</div>
          </div>
          <div class="stat-trend" :class="getRatingTrendClass()">
            <el-icon v-if="getRatingTrendClass() === 'up'"><Top /></el-icon>
            <el-icon v-else-if="getRatingTrendClass() === 'down'"><Bottom /></el-icon>
            <span v-else style="width:14px" />
            {{ getTopRating() }}
          </div>
        </div>
      </el-col>

      <el-col v-if="showHeadcountStat" :xs="24" :sm="12" :lg="6">
        <div class="stat-card employee-card">
          <div class="stat-icon">
            <el-icon><OfficeBuilding /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ employeeStats.total || 0 }}</div>
            <div class="stat-label">{{ $t('hr.dashboard.totalEmployees') }}</div>
            <div class="stat-sub">{{ $t('hr.dashboard.active') }}: {{ employeeStats.active || 0 }}</div>
          </div>
          <div class="stat-trend">
            <el-icon><PieChart /></el-icon>
            {{ employeeStats.departments?.length || 0 }} {{ $t('hr.dashboard.departments') }}
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="charts-row fade-in-up" style="animation-delay: 0.15s;">
      <el-col v-if="showAttendanceTrendChart" :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('hr.dashboard.attendanceTrend') }}</span>
            </div>
          </template>
          <v-chart
            :key="`att-${chartAnimKey}`"
            class="echart-box tall"
            :option="attendanceLineOption"
            autoresize
          />
        </el-card>
      </el-col>

      <el-col v-if="showRecruitmentFunnelChart" :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('hr.dashboard.recruitmentFunnel') }}</span>
            </div>
          </template>
          <v-chart
            :key="`fun-${chartAnimKey}`"
            class="echart-box tall"
            :option="funnelChartOption"
            autoresize
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="charts-row fade-in-up" style="animation-delay: 0.3s;">
      <el-col v-if="showPerformanceDistChart" :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('hr.dashboard.performanceDistribution') }}</span>
            </div>
          </template>
          <v-chart
            :key="`perf-${chartAnimKey}`"
            class="echart-box tall"
            :option="performancePieOption"
            autoresize
          />
        </el-card>
      </el-col>

      <el-col v-if="showRecruitmentChannelsChart" :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('hr.dashboard.recruitmentChannels') }}</span>
            </div>
          </template>
          <div class="channel-list">
            <div class="channel-item" v-for="channel in stats.recruitment?.sourceStats" :key="channel.source">
              <div class="channel-info">
                <span class="channel-name">{{ getChannelName(channel.source) }}</span>
                <span class="channel-count">{{ channel.total }} {{ $t('hr.dashboard.resumes') }}</span>
              </div>
              <div class="channel-bar-container">
                <div class="channel-bar">
                  <div
                    class="channel-bar-fill"
                    :style="{ width: channel.hireRate + '%' }"
                  ></div>
                </div>
                <span class="channel-rate">{{ channel.hireRate }}%</span>
              </div>
            </div>
            <el-empty v-if="!stats.recruitment?.sourceStats?.length" :description="$t('hr.dashboard.noChannelData')" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Clock, User, DataLine, OfficeBuilding, TrendCharts, Top, Bottom, PieChart } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart as EchartsPie, BarChart, FunnelChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { getHrDashboard } from '../../api/hr'
import { getEmployees, type Employee } from '../../api/employees'
import { useUserStore } from '../../store/user'

use([
  CanvasRenderer,
  LineChart,
  EchartsPie,
  BarChart,
  FunnelChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

const { t, locale } = useI18n()

// 部门名称映射
const departmentNames: Record<string, string> = {
  general_office: '总经办',
  hr_center: '人力资源中心',
  finance_center: '财务管理中心',
  brand_center: '品牌管理中心',
  delivery_center: '交付管理中心',
  rd_center: '研发中心',
  sales_ops: '销售运营中心',
}

// ==================== HR 数据看板岗位权限配置 ====================
// 根据岗位代码定义可见的统计卡片和图表模块
interface ModuleConfig {
  // 可见的统计卡片
  statCards: ('attendance' | 'recruitment' | 'performance' | 'headcount')[]
  // 可见的图表
  charts: ('gender' | 'department' | 'attendanceTrend' | 'recruitmentFunnel' | 'performanceDistribution' | 'recruitmentChannels')[]
  // 数据权限范围
  dataScope: 'all' | 'department' | 'self'
}

const HR_MODULE_CONFIG: Record<string, ModuleConfig> = {
  // 人资总监 - 全部数据
  hr_director: {
    statCards: ['attendance', 'recruitment', 'performance', 'headcount'],
    charts: ['gender', 'department', 'attendanceTrend', 'recruitmentFunnel', 'performanceDistribution', 'recruitmentChannels'],
    dataScope: 'all',
  },
  // 招聘人事专员 - 招聘数据为主
  hr_recruiter: {
    statCards: ['recruitment', 'headcount'],
    charts: ['department', 'recruitmentFunnel', 'recruitmentChannels'],
    dataScope: 'all',
  },
  // 行政人事专员 - 考勤和活动数据
  hr_admin: {
    statCards: ['attendance', 'headcount'],
    charts: ['gender', 'department', 'attendanceTrend'],
    dataScope: 'department',
  },
  // 人事行政前台 - 前台接待数据
  hr_front_desk: {
    statCards: ['headcount'],
    charts: ['department'],
    dataScope: 'department',
  },
  // HRBP（试用期）- 考勤和招聘
  hr_bp_probation: {
    statCards: ['attendance', 'recruitment', 'headcount'],
    charts: ['attendanceTrend', 'department'],
    dataScope: 'department',
  },
}

// 默认配置（其他HR岗位）
const DEFAULT_HR_CONFIG: ModuleConfig = {
  statCards: ['attendance', 'headcount'],
  charts: ['department'],
  dataScope: 'department',
}

// 获取当前用户岗位代码
// 优先级：positionCode（API返回，最新）> userInfo.position（JWT，兜底）
const getCurrentPositionCode = (): string => {
  try {
    const userStore = useUserStore()
    // positionCode 是 API（refreshPermissions）返回的，已通过 resolvePosition 解析
    if (userStore.positionCode) return userStore.positionCode
    // 兜底：JWT payload 中的 position（可能是岗位名称，需要手动匹配）
    if (userStore.userInfo?.position) return userStore.userInfo.position
    return ''
  } catch {
    return ''
  }
}

// 根据岗位获取模块配置
const getModuleConfig = (): ModuleConfig => {
  const positionCode = getCurrentPositionCode()
  return HR_MODULE_CONFIG[positionCode] || DEFAULT_HR_CONFIG
}

// 当前可见的统计卡片
const visibleStatCards = computed(() => {
  const config = getModuleConfig()
  return config.statCards
})

// 当前可见的图表
const visibleCharts = computed(() => {
  const config = getModuleConfig()
  return config.charts
})

// 是否显示人员概览卡片
const showOverviewCard = computed(() => {
  return visibleStatCards.value.length > 0 || visibleCharts.value.length > 0
})

// 是否显示考勤统计卡片
const showAttendanceStat = computed(() => {
  // 超级管理员显示全部统计卡片
  const userStore = useUserStore()
  if (userStore.isSuperAdmin) return true
  return visibleStatCards.value.includes('attendance')
})

// 是否显示招聘统计卡片
const showRecruitmentStat = computed(() => {
  // 超级管理员显示全部统计卡片
  const userStore = useUserStore()
  if (userStore.isSuperAdmin) return true
  return visibleStatCards.value.includes('recruitment')
})

// 是否显示绩效统计卡片
const showPerformanceStat = computed(() => {
  // 超级管理员显示全部统计卡片
  const userStore = useUserStore()
  if (userStore.isSuperAdmin) return true
  return visibleStatCards.value.includes('performance')
})

// 是否显示人数统计卡片
const showHeadcountStat = computed(() => {
  // 超级管理员显示全部统计卡片
  const userStore = useUserStore()
  if (userStore.isSuperAdmin) return true
  return visibleStatCards.value.includes('headcount')
})

// 是否显示性别分布图
const showGenderChart = computed(() => {
  // 超级管理员显示全部图表
  const userStore = useUserStore()
  if (userStore.isSuperAdmin) return true
  return visibleCharts.value.includes('gender')
})

// 是否显示部门分布图
const showDepartmentChart = computed(() => {
  // 超级管理员显示全部图表
  const userStore = useUserStore()
  if (userStore.isSuperAdmin) return true
  return visibleCharts.value.includes('department')
})

// 是否显示考勤趋势图
const showAttendanceTrendChart = computed(() => {
  // 超级管理员显示全部图表
  const userStore = useUserStore()
  if (userStore.isSuperAdmin) return true
  return visibleCharts.value.includes('attendanceTrend')
})

// 是否显示招聘漏斗图
const showRecruitmentFunnelChart = computed(() => {
  // 超级管理员显示全部图表
  const userStore = useUserStore()
  if (userStore.isSuperAdmin) return true
  return visibleCharts.value.includes('recruitmentFunnel')
})

// 是否显示绩效分布图
const showPerformanceDistChart = computed(() => {
  // 超级管理员显示全部图表
  const userStore = useUserStore()
  if (userStore.isSuperAdmin) return true
  return visibleCharts.value.includes('performanceDistribution')
})

// 是否显示招聘渠道图
const showRecruitmentChannelsChart = computed(() => {
  // 超级管理员显示全部图表
  const userStore = useUserStore()
  if (userStore.isSuperAdmin) return true
  return visibleCharts.value.includes('recruitmentChannels')
})

const ECHARTS_ANIM = {
  animation: true,
  animationDuration: 1100,
  animationEasing: 'cubicOut' as const,
  animationDurationUpdate: 720,
  animationEasingUpdate: 'cubicInOut' as const,
}

const loading = ref(false)
const chartAnimKey = ref(0)
const employeesList = ref<Employee[]>([])
const stats = ref<any>({
  attendance: { attendanceRate: 0, present: 0, late: 0, earlyLeave: 0, absent: 0, overtime: 0 },
  recruitment: { funnel: { resumes: 0, interviews: 0, offers: 0, hires: 0, interviewRate: 0, offerRate: 0, hireRate: 0 }, sourceStats: [] },
  performance: { ratingDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0 }, avgScore: 0, total: 0 },
  attendanceTrend: [],
})
const employeeStats = ref<any>({ total: 0, active: 0, departments: [] })

const bumpCharts = () => {
  nextTick(() => {
    chartAnimKey.value += 1
  })
}

const groupByDepartment = (employees: Employee[]) => {
  const grouped: Record<string, number> = {}
  employees.forEach((emp) => {
    if (emp.department) {
      grouped[emp.department] = (grouped[emp.department] || 0) + 1
    }
  })
  return Object.entries(grouped)
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count)
}

const personnelExtras = computed(() => {
  const list = employeesList.value
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  let joinThisMonth = 0
  let leaveThisMonth = 0
  for (const e of list) {
    if (e.hireDate?.startsWith(ym)) joinThisMonth++
    if (e.employmentStatus === 'resigned' && e.updatedAt?.slice(0, 7) === ym) leaveThisMonth++
  }
  const active = list.filter((e) => e.isActive !== false && e.employmentStatus !== 'resigned').length
  return { joinThisMonth, leaveThisMonth, active }
})

const genderCounts = computed(() => {
  let male = 0
  let female = 0
  let other = 0
  for (const e of employeesList.value) {
    if (e.gender === 'male') male++
    else if (e.gender === 'female') female++
    else other++
  }
  return { male, female, other }
})

const formatShortDate = (iso: string) => {
  const d = (iso.split('T')[0] ?? iso) || iso
  const parts = d.split('-')
  const m = parts[1] ?? ''
  const day = parts[2] ?? ''
  if (locale.value === 'zh-CN') return m && day ? `${m}/${day}` : d
  return d.length > 5 ? d.slice(5) : d
}

const genderChartOption = computed(() => {
  const g = genderCounts.value
  const data = [
    { value: g.male, name: t('hr.dashboard.genderMale'), itemStyle: { color: '#5C6BFF' } },
    { value: g.female, name: t('hr.dashboard.genderFemale'), itemStyle: { color: '#ec4899' } },
    { value: g.other, name: t('hr.dashboard.genderOther'), itemStyle: { color: '#94a3b8' } },
  ].filter((x) => x.value > 0)

  return {
    ...ECHARTS_ANIM,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 12 } },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { color: '#334155', fontSize: 12 },
        data: data.length ? data : [{ value: 1, name: t('hr.dashboard.noData'), itemStyle: { color: '#e2e8f0' } }],
        animationDelay: (idx: number) => idx * 80,
      },
    ],
  }
})

const departmentBarOption = computed(() => {
  const depts = employeeStats.value.departments || []
  const names = depts.map((d: { department: string }) => {
    const name = d.department || ''
    return departmentNames[name] || name || t('hr.common.noDepartment')
  })
  const values = depts.map((d: { count: number }) => d.count)
  return {
    ...ECHARTS_ANIM,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: '#64748b', fontSize: 11 },
      inverse: true,
    },
    series: [
      {
        type: 'bar',
        data: values,
        barMaxWidth: 22,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#43e97b' },
              { offset: 1, color: '#38f9d7' },
            ],
          },
          borderRadius: [0, 6, 6, 0],
        },
        animationDelay: (idx: number) => idx * 60,
      },
    ],
  }
})

const attendanceLineOption = computed(() => {
  const trend = stats.value.attendanceTrend || []
  const categories = trend.length
    ? trend.map((p: { date: string }) => formatShortDate(p.date))
    : []
  const late = trend.map((p: { late: number }) => p.late)
  const early = trend.map((p: { earlyLeave: number }) => p.earlyLeave)

  return {
    ...ECHARTS_ANIM,
    tooltip: { trigger: 'axis' },
    legend: {
      data: [t('hr.dashboard.lateTrend'), t('hr.dashboard.earlyLeaveTrend')],
      bottom: 0,
      textStyle: { color: '#64748b', fontSize: 12 },
    },
    grid: { left: '3%', right: '4%', bottom: '14%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: categories,
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [
      {
        name: t('hr.dashboard.lateTrend'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#f59e0b' },
        areaStyle: { color: 'rgba(245, 158, 11, 0.12)' },
        data: late,
        animationDelay: (idx: number) => idx * 40,
      },
      {
        name: t('hr.dashboard.earlyLeaveTrend'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#8b5cf6' },
        areaStyle: { color: 'rgba(139, 92, 246, 0.12)' },
        data: early,
        animationDelay: (idx: number) => idx * 40 + 20,
      },
    ],
  }
})

const funnelChartOption = computed(() => {
  const funnel = stats.value.recruitment?.funnel || {}
  const data = [
    { value: funnel.resumes || 0, name: t('hr.dashboard.resumes') },
    { value: funnel.interviews || 0, name: t('hr.dashboard.interviews') },
    { value: funnel.offers || 0, name: t('hr.dashboard.offers') },
    { value: funnel.hires || 0, name: t('hr.dashboard.hires') },
  ]
  return {
    ...ECHARTS_ANIM,
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [
      {
        type: 'funnel',
        left: '8%',
        top: 24,
        bottom: 24,
        width: '84%',
        min: 0,
        minSize: '12%',
        maxSize: '100%',
        sort: 'descending',
        gap: 6,
        label: {
          show: true,
          position: 'inside',
          fontSize: 12,
          color: '#fff',
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          borderRadius: 8,
        },
        data,
        animationDelay: (idx: number) => idx * 120,
      },
    ],
  }
})

const performancePieOption = computed(() => {
  const rd = stats.value.performance?.ratingDistribution || {}
  const order = ['A', 'B', 'C', 'D', 'E']
  const colors: Record<string, string> = {
    A: '#34c759',
    B: '#007aff',
    C: '#ff9500',
    D: '#ff6b6b',
    E: '#8e8e93',
  }
  const data = order
    .map((k) => ({
      value: rd[k] || 0,
      name: k,
      itemStyle: { color: colors[k] },
    }))
    .filter((x) => x.value > 0)

  return {
    ...ECHARTS_ANIM,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, data: order, textStyle: { color: '#64748b', fontSize: 12 } },
    series: [
      {
        type: 'pie',
        radius: ['36%', '62%'],
        center: ['50%', '46%'],
        roseType: 'radius',
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { color: '#334155' },
        data: data.length ? data : [{ value: 1, name: t('hr.dashboard.noData'), itemStyle: { color: '#e2e8f0' } }],
        animationDelay: (idx: number) => idx * 90,
      },
    ],
  }
})

const loadStats = async () => {
  loading.value = true
  try {
    const [dashboardRes, employeesRes] = await Promise.all([
      getHrDashboard(),
      getEmployees(),
    ])
    stats.value = dashboardRes || {
      attendance: { attendanceRate: 0, present: 0, late: 0, earlyLeave: 0, absent: 0, overtime: 0 },
      recruitment: { funnel: { resumes: 0, interviews: 0, offers: 0, hires: 0, hireRate: 0 }, sourceStats: [] },
      performance: { ratingDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0 }, avgScore: 0, total: 0 },
      attendanceTrend: [],
    }
    const list = Array.isArray(employeesRes) ? employeesRes : []
    employeesList.value = list
    employeeStats.value = {
      total: list.length,
      active: list.filter((e) => e.isActive !== false && e.employmentStatus !== 'resigned').length,
      departments: groupByDepartment(list),
    }
    bumpCharts()
  } catch (error) {
    console.error('Failed to load dashboard stats:', error)
  } finally {
    loading.value = false
  }
}

const getRatingTrendClass = () => {
  const rd = stats.value.performance?.ratingDistribution || {}
  if ((rd.A || 0) > (rd.E || 0)) return 'up'
  if ((rd.E || 0) > (rd.A || 0)) return 'down'
  return ''
}

const getTopRating = () => {
  const rd = stats.value.performance?.ratingDistribution || {}
  const max = Math.max(rd.A || 0, rd.B || 0, rd.C || 0, rd.D || 0, rd.E || 0)
  if (max === rd.A) return 'A ' + t('hr.dashboard.topRating')
  if (max === rd.B) return 'B ' + t('hr.dashboard.most')
  if (max === rd.C) return 'C ' + t('hr.dashboard.most')
  return '-'
}

const getChannelName = (source: string) => {
  if (!source) return '-'
  const names: Record<string, string> = {
    boss: t('hr.recruitment.channels.boss'),
    zhilian: t('hr.recruitment.channels.zhilian'),
    liepin: t('hr.recruitment.channels.liepin'),
    referral: t('hr.recruitment.channels.referral'),
    headhunter: t('hr.recruitment.channels.headhunter'),
    website: t('hr.recruitment.channels.website'),
    campus: t('hr.recruitment.channels.campus'),
    other: t('hr.recruitment.channels.other'),
  }
  return names[source] || source
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped lang="scss">
.hr-dashboard {
  padding: 0;

  .section-card {
    margin-bottom: 24px;
    border-radius: 16px;
    border: 1px solid #f0f0f0;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
    }
    .card-header {
      font-size: 16px;
      font-weight: 600;
      color: #1d1d1f;
    }
  }

  .overview-kpis {
    margin-bottom: 8px;
  }

  .kpi-pill {
    background: #f5f5f7;
    border-radius: 14px;
    padding: 16px 18px;
    text-align: center;
    border: 1px solid #ececf0;
    .kpi-value {
      font-size: 26px;
      font-weight: 700;
      color: #1d1d1f;
      line-height: 1.2;
    }
    .kpi-label {
      margin-top: 6px;
      font-size: 13px;
      color: #86868b;
    }
    &.accent-join .kpi-value {
      color: #16a34a;
    }
    &.accent-leave .kpi-value {
      color: #dc2626;
    }
  }

  .overview-charts {
    margin-top: 8px;
  }

  .chart-subtitle {
    font-size: 14px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 8px;
    padding-left: 4px;
  }

  .echart-box {
    height: 280px;
    width: 100%;
    &.tall {
      height: 300px;
    }
  }

  .stats-row {
    margin-bottom: 24px;

    .stat-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      border: 1px solid #f0f0f0;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;

        .el-icon {
          font-size: 28px;
        }
      }

      &.attendance-card .stat-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
      }

      &.recruitment-card .stat-icon {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: #fff;
      }

      &.performance-card .stat-icon {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: #fff;
      }

      &.employee-card .stat-icon {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        color: #fff;
      }

      .stat-content {
        flex: 1;

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #1d1d1f;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 14px;
          color: #86868b;
          margin-top: 4px;
        }

        .stat-sub {
          font-size: 12px;
          color: #aeaeb2;
          margin-top: 2px;
        }
      }

      .stat-trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #86868b;
        padding: 6px 12px;
        background: #f5f5f7;
        border-radius: 8px;

        &.up {
          color: #34c759;
          background: rgba(52, 199, 89, 0.1);
        }

        &.down {
          color: #ff3b30;
          background: rgba(255, 59, 48, 0.1);
        }
      }
    }
  }

  .charts-row {
    margin-bottom: 24px;

    .chart-card {
      border-radius: 16px;
      border: 1px solid #f0f0f0;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      overflow: hidden;

      :deep(.el-card__header) {
        padding: 16px 20px;
        border-bottom: 1px solid #f0f0f0;
      }

      .card-header {
        font-size: 16px;
        font-weight: 600;
        color: #1d1d1f;
      }
    }
  }

  .channel-list {
    padding: 10px 0;
    min-height: 200px;

    .channel-item {
      margin-bottom: 16px;

      .channel-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;

        .channel-name {
          font-weight: 500;
          color: #1d1d1f;
        }

        .channel-count {
          font-size: 12px;
          color: #86868b;
        }
      }

      .channel-bar-container {
        display: flex;
        align-items: center;
        gap: 12px;

        .channel-bar {
          flex: 1;
          height: 8px;
          background: #f5f5f7;
          border-radius: 4px;
          overflow: hidden;

          .channel-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 4px;
            transition: width 1s ease;
          }
        }

        .channel-rate {
          font-size: 14px;
          font-weight: 600;
          color: #667eea;
        }
      }
    }
  }
}
</style>
