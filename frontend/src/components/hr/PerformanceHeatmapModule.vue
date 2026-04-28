<template>
  <div class="performance-heatmap-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Histogram /></el-icon>
            <span>{{ $t('hr.heatmap.title') || '绩效热力图' }}</span>
          </div>
          <div class="header-actions">
            <el-select v-model="filters.department" :placeholder="$t('hr.heatmap.department') || '部门'" clearable size="default" style="width: 140px; margin-right: 12px;" @change="loadData">
              <el-option :label="$t('hr.common.allDepartments') || '全部部门'" value="" />
              <el-option v-for="dept in departmentOptions" :key="dept.value" :label="dept.label" :value="dept.value" />
            </el-select>
            <el-select v-model="filters.period" :placeholder="$t('hr.heatmap.period') || '考核周期'" clearable size="default" style="width: 140px; margin-right: 12px;" @change="loadData">
              <el-option v-for="p in periodOptions" :key="p" :label="p" :value="p" />
            </el-select>
            <el-button type="primary" :icon="Refresh" @click="loadData">{{ $t('common.refresh') || '刷新' }}</el-button>
          </div>
        </div>
      </template>

      <!-- 热力图 -->
      <div class="heatmap-container" v-loading="chartLoading">
        <div class="heatmap-chart" ref="heatmapChartRef"></div>
        <div class="heatmap-legend">
          <span class="legend-label">{{ $t('hr.heatmap.low') || '低' }}</span>
          <div class="legend-gradient"></div>
          <span class="legend-label">{{ $t('hr.heatmap.high') || '高' }}</span>
        </div>
      </div>

      <!-- 统计摘要 -->
      <div class="stats-summary">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="6">
            <div class="stat-card">
              <div class="stat-value">{{ summaryStats.avgScore?.toFixed(1) || '-' }}</div>
              <div class="stat-label">{{ $t('hr.heatmap.avgScore') || '团队平均分' }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card">
              <div class="stat-value">{{ summaryStats.topPerformers || 0 }}</div>
              <div class="stat-label">{{ $t('hr.heatmap.topPerformers') || '高绩效人数' }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card">
              <div class="stat-value">{{ summaryStats.needsAttention || 0 }}</div>
              <div class="stat-label">{{ $t('hr.heatmap.needsAttention') || '需关注人数' }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card">
              <div class="stat-value">{{ summaryStats.coverageRate?.toFixed(0) || '-' }}%</div>
              <div class="stat-label">{{ $t('hr.heatmap.coverageRate') || '评估覆盖率' }}</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 明细表格 -->
      <div class="detail-section">
        <div class="section-title">{{ $t('hr.heatmap.detailTable') || '绩效明细' }}</div>
        <el-table :data="detailData" stripe v-loading="loading" max-height="400" size="small">
          <el-table-column prop="employeeName" :label="$t('hr.heatmap.employeeName') || '员工'" width="120" fixed />
          <el-table-column prop="department" :label="$t('hr.heatmap.department') || '部门'" width="100" />
          <el-table-column
            v-for="indicator in indicators"
            :key="indicator.id"
            :label="indicator.name"
            width="120"
            align="center"
          >
            <template #default="{ row }">
              <div
                class="score-cell"
                :style="{ backgroundColor: getScoreColor(row.scores?.[indicator.id]) }"
                @click="showScoreDetail(row, indicator)"
              >
                {{ row.scores?.[indicator.id]?.toFixed(1) || '-' }}
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('hr.heatmap.totalScore') || '总分'" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-tag :type="getTotalTag(row.totalScore)" size="small">
                {{ row.totalScore?.toFixed(1) || '-' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 评分详情弹窗 -->
      <el-dialog
        v-model="showDetailDialog"
        :title="detailDialogTitle"
        width="400px"
      >
        <div v-if="selectedCell" class="score-detail">
          <div class="detail-row">
            <span class="detail-label">{{ $t('hr.heatmap.employee') || '员工' }}:</span>
            <span>{{ selectedCell.employeeName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ $t('hr.heatmap.indicator') || '指标' }}:</span>
            <span>{{ selectedCell.indicatorName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ $t('hr.heatmap.score') || '得分' }}:</span>
            <el-tag :type="getScoreTag(selectedCell.score)" size="large">
              {{ selectedCell.score?.toFixed(1) || '-' }}
            </el-tag>
          </div>
          <div class="detail-row" v-if="selectedCell.maxScore">
            <span class="detail-label">{{ $t('hr.heatmap.maxScore') || '满分' }}:</span>
            <span>{{ selectedCell.maxScore }}</span>
          </div>
          <div class="detail-row" v-if="selectedCell.rank">
            <span class="detail-label">{{ $t('hr.heatmap.rank') || '排名' }}:</span>
            <span>{{ selectedCell.rank }} / {{ selectedCell.totalCount }}</span>
          </div>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Histogram, Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getPerformanceHeatmap } from '../../api/hr'

const { t } = useI18n()

const loading = ref(false)
const chartLoading = ref(false)
const heatmapChartRef = ref<HTMLElement>()
let heatmapChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

interface Indicator {
  id: number
  name: string
  maxScore: number
  weight: number
}

interface HeatmapData {
  employees: Array<{
    employeeId: number
    employeeName?: string
    department?: string
    scores: Record<number, number>
    totalScore: number
  }>
  indicators: Indicator[]
  stats: {
    avgScore: number
    topPerformers: number
    needsAttention: number
    coverageRate: number
  }
}

const filters = reactive({
  department: '',
  period: '',
})

const departmentOptions = [
  { value: 'PLANNING', label: '企划部' },
  { value: 'SALES', label: '销售部' },
  { value: 'TECH', label: '技术部' },
  { value: 'FINANCE', label: '财务部' },
  { value: 'HR', label: '人事行政' },
  { value: 'DOMESTIC', label: '国内区' },
  { value: 'MANAGEMENT', label: '总经办' },
]

const periodOptions = computed(() => {
  const current = new Date().getFullYear()
  return [`${current}Q1`, `${current}Q2`, `${current}Q3`, `${current}Q4`, `${current}年度`]
})

const heatmapData = ref<HeatmapData | null>(null)
const indicators = ref<Indicator[]>([])
const detailData = ref<any[]>([])
const summaryStats = ref<any>({})

const showDetailDialog = ref(false)
const selectedCell = ref<any>(null)
const detailDialogTitle = computed(() =>
  selectedCell.value ? `${selectedCell.value.employeeName} - ${selectedCell.value.indicatorName}` : ''
)

// 加载数据
const loadData = async () => {
  loading.value = true
  chartLoading.value = true

  try {
    const data = await getPerformanceHeatmap({
      department: filters.department || undefined,
      period: filters.period || undefined,
    })

    heatmapData.value = data
    indicators.value = data.indicators || []
    detailData.value = data.employees || []
    summaryStats.value = data.stats || {}

    await nextTick()
    renderHeatmap()
  } catch (error) {
    console.error('Failed to load heatmap:', error)
    // 使用模拟数据
    const mockData = generateMockData()
    heatmapData.value = mockData
    indicators.value = mockData.indicators
    detailData.value = mockData.employees
    summaryStats.value = mockData.stats

    await nextTick()
    renderHeatmap()
  } finally {
    loading.value = false
    chartLoading.value = false
  }
}

// 渲染热力图
const renderHeatmap = () => {
  if (!heatmapChartRef.value || !heatmapData.value) return

  if (!heatmapChart) {
    heatmapChart = echarts.init(heatmapChartRef.value)
  }

  const employees = heatmapData.value.employees
  const inds = heatmapData.value.indicators

  // 构建热力图数据
  const heatmapDataList: [number, number, number][] = []
  employees.forEach((emp, empIdx) => {
    inds.forEach((ind, indIdx) => {
      const score = emp.scores?.[ind.id]
      if (score !== undefined) {
        // 归一化得分 (0-100)
        const normalizedScore = Math.min(100, Math.max(0, (score / ind.maxScore) * 100))
        heatmapDataList.push([indIdx, empIdx, normalizedScore])
      }
    })
  })

  // 获取最大员工数以确定Y轴范围
  const maxEmployees = Math.min(employees.length, 20)

  const option = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const emp = employees[params.value[1]]
        const ind = inds[params.value[0]]
        const score = params.value[2]
        const actualScore = emp?.scores?.[ind?.id] || 0
        return `<b>${emp?.employeeName || '员工'}</b><br/>
                指标: ${ind?.name || '-'}<br/>
                得分: <b>${actualScore.toFixed(1)}</b> / ${ind?.maxScore || 100}<br/>
                归一化: ${score.toFixed(1)}%`
      },
    },
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    grid: {
      left: '12%',
      right: '8%',
      top: '5%',
      bottom: '15%',
    },
    xAxis: {
      type: 'category',
      data: inds.map(i => i.name),
      position: 'bottom',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        rotate: 45,
        fontSize: 11,
        color: '#606266',
        interval: 0,
      },
      splitArea: { show: false },
    },
    yAxis: {
      type: 'category',
      data: employees.slice(0, maxEmployees).map(e => e.employeeName || `员工${e.employeeId}`),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 11,
        color: '#606266',
        width: 80,
        overflow: 'truncate',
      },
      splitArea: { show: false },
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '2%',
      inRange: {
        color: ['#e8f5e9', '#81c784', '#4caf50', '#ff9800', '#f44336'],
      },
      textStyle: {
        color: '#606266',
      },
    },
    series: [{
      type: 'heatmap',
      data: heatmapDataList.slice(0, maxEmployees * inds.length),
      label: {
        show: true,
        formatter: (params: any) => {
          const emp = employees[params.value[1]]
          const ind = inds[params.value[0]]
          return (emp?.scores?.[ind?.id] || 0).toFixed(0)
        },
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2,
        borderRadius: 4,
      },
    }],
  }

  heatmapChart.setOption(option, true)
  heatmapChart.resize()
}

// 获取分数颜色
const getScoreColor = (score?: number): string => {
  if (score === undefined || score === null) return '#f5f5f5'
  const ratio = score / 100
  if (ratio >= 0.9) return '#f44336'
  if (ratio >= 0.8) return '#ff9800'
  if (ratio >= 0.7) return '#4caf50'
  if (ratio >= 0.6) return '#81c784'
  return '#e8f5e9'
}

// 获取总分标签类型
const getTotalTag = (score?: number): string => {
  if (!score) return 'info'
  if (score >= 90) return 'success'
  if (score >= 75) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

// 获取得分标签类型
const getScoreTag = (score?: number): string => {
  if (!score) return 'info'
  if (score >= 90) return 'success'
  if (score >= 75) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

// 显示评分详情
const showScoreDetail = (row: any, indicator: any) => {
  const score = row.scores?.[indicator.id]
  if (score === undefined) return

  // 计算排名
  const scores = detailData.value.map(e => e.scores?.[indicator.id]).filter(s => s !== undefined)
  scores.sort((a, b) => b - a)
  const rank = scores.indexOf(score) + 1

  selectedCell.value = {
    employeeName: row.employeeName || `员工${row.employeeId}`,
    indicatorName: indicator.name,
    score,
    maxScore: indicator.maxScore,
    rank,
    totalCount: scores.length,
  }
  showDetailDialog.value = true
}

// 生成模拟数据（确定性哈希，保证每次刷新结果一致）
const stableRand = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

const generateMockData = (): HeatmapData => {
  const names = ['张伟', '李娜', '王芳', '刘洋', '陈明', '杨静', '赵强', '黄丽', '周杰', '吴敏', '徐鹏', '孙悦', '马超', '朱琳', '冯雪']
  const depts = ['企划部', '销售部', '技术部', '财务部', '人事行政', '国内区']

  const mockIndicators: Indicator[] = [
    { id: 1, name: '工作质量', maxScore: 100, weight: 0.25 },
    { id: 2, name: '工作效率', maxScore: 100, weight: 0.2 },
    { id: 3, name: '团队协作', maxScore: 100, weight: 0.15 },
    { id: 4, name: '创新能力', maxScore: 100, weight: 0.15 },
    { id: 5, name: '责任心', maxScore: 100, weight: 0.15 },
    { id: 6, name: '学习成长', maxScore: 100, weight: 0.1 },
  ]

  const employees = names.map((name, i) => {
    const scores: Record<number, number> = {}
    let totalScore = 0
    let totalWeight = 0

    mockIndicators.forEach(ind => {
      const score = 60 + stableRand(i * 100 + ind.id) * 40
      scores[ind.id] = Math.round(score * 10) / 10
      totalScore += score * ind.weight
      totalWeight += ind.weight
    })

    return {
      employeeId: i + 1,
      employeeName: name,
      department: depts[Math.floor(stableRand(i * 1000) * depts.length)],
      scores,
      totalScore: Math.round((totalScore / totalWeight) * 10) / 10,
    }
  })

  const allScores = employees.map(e => e.totalScore)
  const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length
  const topPerformers = allScores.filter(s => s >= 85).length
  const needsAttention = allScores.filter(s => s < 65).length

  return {
    employees,
    indicators: mockIndicators,
    stats: {
      avgScore: Math.round(avgScore * 10) / 10,
      topPerformers,
      needsAttention,
      coverageRate: Math.round((employees.length / 20) * 100),
    },
  }
}

onMounted(() => {
  loadData()

  resizeObserver = new ResizeObserver(() => {
    heatmapChart?.resize()
  })
  if (heatmapChartRef.value) {
    resizeObserver.observe(heatmapChartRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  heatmapChart?.dispose()
})
</script>

<style scoped lang="scss">
.performance-heatmap-module {
  .heatmap-container {
    position: relative;
    margin-bottom: 20px;

    .heatmap-chart {
      height: 400px;
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      border-radius: 12px;
      padding: 16px;
    }

    .heatmap-legend {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 12px;

      .legend-label {
        font-size: 12px;
        color: #606266;
      }

      .legend-gradient {
        width: 200px;
        height: 12px;
        background: linear-gradient(to right, #e8f5e9, #81c784, #4caf50, #ff9800, #f44336);
        border-radius: 6px;
      }
    }
  }

  .stats-summary {
    margin-bottom: 20px;

    .stat-card {
      padding: 16px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
      border-radius: 12px;
      text-align: center;

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .detail-section {
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
    }

    .score-cell {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }

  .score-detail {
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .detail-label {
        color: #909399;
        font-size: 14px;
      }

      span:last-child {
        font-weight: 500;
        color: #303133;
      }
    }
  }
}
</style>
