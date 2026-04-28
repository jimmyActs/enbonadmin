<template>
  <div class="potential-matrix-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Grid /></el-icon>
            <span>{{ $t('hr.potential.title') || '潜力评估矩阵' }}</span>
          </div>
          <div class="header-actions">
            <el-select v-model="filters.department" :placeholder="$t('hr.potential.department') || '部门'" clearable size="default" style="width: 140px; margin-right: 12px;" @change="loadData">
              <el-option :label="$t('hr.common.allDepartments') || '全部部门'" value="" />
              <el-option v-for="dept in departmentOptions" :key="dept.value" :label="dept.label" :value="dept.value" />
            </el-select>
            <el-select v-model="filters.period" :placeholder="$t('hr.potential.period') || '考核周期'" clearable size="default" style="width: 140px; margin-right: 12px;" @change="loadData">
              <el-option v-for="p in periodOptions" :key="p" :label="p" :value="p" />
            </el-select>
            <el-button type="primary" :icon="Refresh" @click="loadData">{{ $t('common.refresh') || '刷新' }}</el-button>
          </div>
        </div>
      </template>

      <!-- 九宫格矩阵 -->
      <div class="matrix-container">
        <div class="matrix-chart" ref="matrixChartRef" v-loading="chartLoading"></div>

        <div class="matrix-legend">
          <div class="legend-title">{{ $t('hr.potential.legend') || '图例说明' }}</div>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-color star"></span>
              <span>{{ $t('hr.potential.starEmployee') || '明星员工' }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color core"></span>
              <span>{{ $t('hr.potential.coreTalent') || '核心人才' }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color backbone"></span>
              <span>{{ $t('hr.potential.backbone') || '骨干员工' }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color stable"></span>
              <span>{{ $t('hr.potential.stable') || '稳定贡献者' }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color expert"></span>
              <span>{{ $t('hr.potential.expert') || '专家' }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color develop"></span>
              <span>{{ $t('hr.potential.develop') || '待培养' }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color improve"></span>
              <span>{{ $t('hr.potential.improve') || '需改进' }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color traditional"></span>
              <span>{{ $t('hr.potential.traditional') || '传统员工' }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color risk"></span>
              <span>{{ $t('hr.potential.risk') || '高风险' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 员工明细列表 -->
      <el-table :data="employeeList" stripe v-loading="loading" max-height="400">
        <el-table-column prop="employeeId" :label="$t('hr.potential.employeeName') || '员工'" width="120">
          <template #default="{ row }">
            <div class="employee-cell">
              <span class="employee-name">{{ row.employeeName || `员工#${row.employeeId}` }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="department" :label="$t('hr.potential.department') || '部门'" width="120" />
        <el-table-column prop="performanceScore" :label="$t('hr.potential.performanceScore') || '绩效得分'" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getPerformanceTag(row.performanceScore)" size="small">
              {{ row.performanceScore?.toFixed(1) || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="potentialLevel" :label="$t('hr.potential.potentialLevel') || '潜力等级'" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getPotentialTag(row.potentialLevel)" size="small">
              {{ row.potentialLevel || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" :label="$t('hr.potential.category') || '九宫格分类'" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="getCategoryTag(row.category)" size="small">
              {{ getCategoryName(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="suggestion" :label="$t('hr.potential.suggestion') || '发展建议'" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Grid, Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getPotentialMatrix } from '../../api/hr'

const { t } = useI18n()

const loading = ref(false)
const chartLoading = ref(false)
const employeeList = ref<any[]>([])
const matrixChartRef = ref<HTMLElement>()
let matrixChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

interface PotentialData {
  employeeId: number
  employeeName?: string
  department?: string
  performanceScore?: number
  potentialLevel?: string
  category?: string
  suggestion?: string
  x?: number  // 九宫格X坐标 (绩效: 0-2)
  y?: number  // 九宫格Y坐标 (潜力: 0-2)
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

// 九宫格分类颜色映射
const categoryColors: Record<string, string> = {
  STAR: '#f56c6c',        // 明星员工 - 红色
  CORE: '#e6a23c',        // 核心人才 - 橙色
  BACKBONE: '#67c23a',    // 骨干员工 - 绿色
  STABLE: '#409eff',      // 稳定贡献者 - 蓝色
  EXPERT: '#909399',      // 专家 - 灰色
  DEVELOP: '#f0c674',      // 待培养 - 黄色
  IMPROVE: '#ff9f7f',     // 需改进 - 浅橙
  TRADITIONAL: '#c0c4cc', // 传统员工 - 浅灰
  RISK: '#d3d3d3',        // 高风险 - 更浅灰
}

const categoryNames: Record<string, string> = {
  STAR: '明星员工',
  CORE: '核心人才',
  BACKBONE: '骨干员工',
  STABLE: '稳定贡献者',
  EXPERT: '专家',
  DEVELOP: '待培养',
  IMPROVE: '需改进',
  TRADITIONAL: '传统员工',
  RISK: '高风险',
}

const categorySuggestions: Record<string, string> = {
  STAR: '重点培养，赋予更大挑战性任务，参与领导力发展项目',
  CORE: '持续培养，关注职业发展通道，适时晋升',
  BACKBONE: '保持稳定输出，考虑横向发展机会',
  STABLE: '保持现状，关注能力提升机会',
  EXPERT: '发挥专业优势，可担任内部导师角色',
  DEVELOP: '制定个性化培养计划，加强辅导和培训',
  IMPROVE: '设定明确改进目标，定期跟进评估',
  TRADITIONAL: '保持稳定，关注工作满意度',
  RISK: '制定绩效改进计划（PIP），必要时调整岗位',
}

// 根据绩效得分计算标签类型
const getPerformanceTag = (score?: number): string => {
  if (!score) return 'info'
  if (score >= 90) return 'success'
  if (score >= 75) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

// 根据潜力等级计算标签类型
const getPotentialTag = (level?: string): string => {
  if (!level) return 'info'
  const map: Record<string, string> = {
    HIGH: 'success',
    MEDIUM: 'primary',
    LOW: 'warning',
  }
  return map[level] || 'info'
}

// 根据分类计算标签类型
const getCategoryTag = (category?: string): string => {
  if (!category) return 'info'
  const map: Record<string, string> = {
    STAR: 'danger',
    CORE: 'warning',
    BACKBONE: 'success',
    STABLE: 'primary',
    EXPERT: 'info',
    DEVELOP: 'warning',
    IMPROVE: 'danger',
    TRADITIONAL: 'info',
    RISK: 'danger',
  }
  return map[category] || 'info'
}

// 获取分类名称
const getCategoryName = (category?: string): string => {
  return categoryNames[category || ''] || '-'
}

// 加载数据
const loadData = async () => {
  loading.value = true
  chartLoading.value = true

  try {
    const data = await getPotentialMatrix({
      department: filters.department || undefined,
      period: filters.period || undefined,
    })

    // 计算九宫格坐标
    employeeList.value = (data.employees || []).map((emp: any) => {
      const category = calculateCategory(emp.performanceScore, emp.potentialLevel)
      return {
        ...emp,
        category,
        suggestion: categorySuggestions[category] || '-',
        x: emp.performanceScore ? getPerformanceLevel(emp.performanceScore) : 1,
        y: emp.potentialLevel ? getPotentialY(emp.potentialLevel) : 1,
      }
    })

    await nextTick()
    renderMatrix()
  } catch (error) {
    console.error('Failed to load potential matrix:', error)
    // 使用模拟数据
    employeeList.value = generateMockData()
    await nextTick()
    renderMatrix()
  } finally {
    loading.value = false
    chartLoading.value = false
  }
}

// 计算九宫格分类
const calculateCategory = (performanceScore?: number, potentialLevel?: string): string => {
  if (!performanceScore || !potentialLevel) return 'STABLE'

  const perfLevel = getPerformanceLevel(performanceScore) // 0=低, 1=中, 2=高
  const potLevel = getPotentialY(potentialLevel) // 0=低, 1=中, 2=高

  const categories = [
    ['RISK', 'IMPROVE', 'DEVELOP'],      // 低绩效行
    ['TRADITIONAL', 'STABLE', 'BACKBONE'], // 中绩效行
    ['RISK', 'EXPERT', 'STAR'],          // 高绩效行（低潜力风险）
  ]

  // 特殊处理高潜力情况
  if (potLevel === 2) {
    if (perfLevel === 2) return 'CORE'  // 高潜力+高绩效=核心人才
    if (perfLevel === 1) return 'BACKBONE'
  }

  return categories[perfLevel]?.[potLevel] || 'STABLE'
}

// 将绩效得分转换为0-2的等级
const getPerformanceLevel = (score: number): number => {
  if (score >= 85) return 2  // 高
  if (score >= 70) return 1  // 中
  return 0  // 低
}

// 将潜力等级转换为0-2的Y坐标
const getPotentialY = (level: string): number => {
  const map: Record<string, number> = {
    HIGH: 2,
    MEDIUM: 1,
    LOW: 0,
  }
  return map[level] ?? 1
}

// 渲染九宫格矩阵图
const renderMatrix = () => {
  if (!matrixChartRef.value) return

  if (!matrixChart) {
    matrixChart = echarts.init(matrixChartRef.value)
  }

  // 统计数据
  const stats = employeeList.value.reduce((acc, emp) => {
    const cat = emp.category || 'STABLE'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.componentType === 'series') {
          const cat = params.name
          return `<b>${categoryNames[cat] || cat}</b><br/>人数: ${stats[cat] || 0}人`
        }
        return ''
      }
    },
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    grid: {
      left: '15%',
      right: '15%',
      top: '10%',
      bottom: '10%',
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: ['低', '中', '高'],
      position: 'bottom',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#606266',
      },
      name: '绩效 →',
      nameLocation: 'middle',
      nameGap: 35,
      nameTextStyle: { fontSize: 14, fontWeight: 'bold', color: '#303133' },
    },
    yAxis: {
      type: 'category',
      data: ['低', '中', '高'],
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#606266',
      },
      name: '潜力 →',
      nameLocation: 'middle',
      nameGap: 50,
      nameTextStyle: { fontSize: 14, fontWeight: 'bold', color: '#303133' },
    },
    series: [
      // 背景九宫格
      {
        type: 'heatmap',
        data: [
          [0, 2, 0], [1, 2, 0], [2, 2, 0],
          [0, 1, 0], [1, 1, 0], [2, 1, 0],
          [0, 0, 0], [1, 0, 0], [2, 0, 0],
        ],
        itemStyle: {
          color: (params: any) => {
            const colors = ['#ffe6e6', '#fff4e6', '#e6f4ff', '#f0f0f0', '#f5f7fa', '#fdf6ec', '#fef0f0', '#f5f5f5', '#f0f0f0']
            return colors[params.dataIndex]
          },
          borderColor: '#e5e5e5',
          borderWidth: 2,
          borderRadius: 4,
        },
        silent: true,
        emphasis: { disabled: true },
      },
      // 区域标签
      {
        type: 'scatter',
        symbol: 'none',
        data: [
          { value: [0, 2], name: 'RISK' },
          { value: [1, 2], name: 'DEVELOP' },
          { value: [2, 2], name: 'CORE' },
          { value: [0, 1], name: 'TRADITIONAL' },
          { value: [1, 1], name: 'STABLE' },
          { value: [2, 1], name: 'BACKBONE' },
          { value: [0, 0], name: 'RISK' },
          { value: [1, 0], name: 'IMPROVE' },
          { value: [2, 0], name: 'EXPERT' },
        ],
        label: {
          show: true,
          formatter: (params: any) => {
            const cat = params.data.name
            const count = stats[cat] || 0
            return `${categoryNames[cat]}\n(${count}人)`
          },
          fontSize: 12,
          color: '#606266',
          position: 'inside',
        },
        emphasis: { disabled: true },
      },
      // 员工散点
      {
        type: 'scatter',
        symbolSize: (value: any, params: any) => {
          return Math.min(50, 25 + employeeList.value.filter(e => e.category === params.data.category).length * 3)
        },
        data: employeeList.value.map(emp => ({
          value: [emp.x, emp.y],
          name: emp.employeeName || `员工${emp.employeeId}`,
          category: emp.category,
          itemStyle: {
            color: categoryColors[emp.category || 'STABLE'] || '#409eff',
            opacity: 0.85,
            shadowBlur: 8,
            shadowColor: 'rgba(0,0,0,0.2)',
          },
        })),
        emphasis: {
          scale: 1.3,
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(0,0,0,0.3)',
          },
          label: {
            show: true,
            formatter: '{b}',
            fontSize: 11,
            color: '#fff',
            fontWeight: 'bold',
          },
        },
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            const emp = employeeList.value.find(
              e => (e.employeeName || `员工${e.employeeId}`) === params.data.name
            )
            if (!emp) return params.data.name
            return `<b>${emp.employeeName || `员工#${emp.employeeId}`}</b><br/>
                    部门: ${emp.department || '-'}<br/>
                    绩效: ${emp.performanceScore?.toFixed(1) || '-'}<br/>
                    潜力: ${emp.potentialLevel || '-'}<br/>
                    分类: <b>${getCategoryName(emp.category)}</b><br/>
                    建议: ${emp.suggestion || '-'}`
          },
        },
      },
    ],
  }

  matrixChart.setOption(option, true)
  matrixChart.resize()
}

// 生成模拟数据（确定性哈希，保证每次刷新结果一致）
const stableRand = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

const generateMockData = (): PotentialData[] => {
  const names = ['张伟', '李娜', '王芳', '刘洋', '陈明', '杨静', '赵强', '黄丽', '周杰', '吴敏', '徐鹏', '孙悦']
  const depts = ['企划部', '销售部', '技术部', '财务部', '人事行政', '国内区']
  const potentials = ['HIGH', 'MEDIUM', 'LOW']

  return names.map((name, i) => {
    const performanceScore = Math.round((60 + stableRand(i) * 40) * 10) / 10
    const potentialLevel = potentials[Math.floor(stableRand(i + 100) * 3)]
    const category = calculateCategory(performanceScore, potentialLevel)

    return {
      employeeId: i + 1,
      employeeName: name,
      department: depts[Math.floor(stableRand(i + 200) * depts.length)],
      performanceScore,
      potentialLevel,
      category,
      suggestion: categorySuggestions[category] || '-',
      x: getPerformanceLevel(performanceScore),
      y: getPotentialY(potentialLevel),
    }
  })
}

onMounted(() => {
  loadData()

  resizeObserver = new ResizeObserver(() => {
    matrixChart?.resize()
  })
  if (matrixChartRef.value) {
    resizeObserver.observe(matrixChartRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  matrixChart?.dispose()
})
</script>

<style scoped lang="scss">
.potential-matrix-module {
  .matrix-container {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;

    .matrix-chart {
      flex: 1;
      min-width: 400px;
      height: 420px;
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .matrix-legend {
      width: 200px;
      padding: 16px;
      background: #fafafa;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      .legend-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e5e5;
      }

      .legend-items {
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 12px;
          color: #606266;

          .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            flex-shrink: 0;

            &.star { background: #f56c6c; }
            &.core { background: #e6a23c; }
            &.backbone { background: #67c23a; }
            &.stable { background: #409eff; }
            &.expert { background: #909399; }
            &.develop { background: #f0c674; }
            &.improve { background: #ff9f7f; }
            &.traditional { background: #c0c4cc; }
            &.risk { background: #d3d3d3; }
          }
        }
      }
    }
  }

  .employee-cell {
    .employee-name {
      font-weight: 500;
    }
  }
}
</style>
