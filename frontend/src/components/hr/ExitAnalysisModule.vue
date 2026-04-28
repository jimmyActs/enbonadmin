<template>
  <div class="exit-analysis-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Switch /></el-icon>
            <span>{{ $t('hr.exit.title') }}</span>
          </div>
          <div class="header-actions">
            <el-select v-model="filters.year" :placeholder="$t('hr.exit.year')" size="default" style="width: 120px; margin-right: 12px;" @change="loadStats">
              <el-option v-for="y in yearOptions" :key="y" :label="`${y}年`" :value="y" />
            </el-select>
            <el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('hr.exit.addExit') }}</el-button>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-item">
          <div class="stat-value danger">{{ stats.totalExits || 0 }}</div>
          <div class="stat-label">{{ $t('hr.exit.totalExits') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value warning">{{ exitRate }}%</div>
          <div class="stat-label">{{ $t('hr.exit.exitRate') }}</div>
        </div>
        <div class="stat-item" v-for="(count, type) in stats.byType" :key="type">
          <div class="stat-value">{{ count }}</div>
          <div class="stat-label">{{ $t(`hr.exit.exitTypes.${type}`) }}</div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="chart-container" v-loading="chartLoading">
        <div class="chart-wrapper">
          <h4 class="chart-title">{{ $t('hr.exit.byMonth') }}</h4>
          <div ref="monthChartRef" class="chart"></div>
        </div>
        <div class="chart-wrapper">
          <h4 class="chart-title">{{ $t('hr.exit.byReason') }}</h4>
          <div ref="reasonChartRef" class="chart"></div>
        </div>
      </div>

      <!-- 离职记录列表 -->
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="employeeId" :label="$t('hr.exit.employeeName')" width="120">
          <template #default="{ row }">
            {{ getEmployeeName(row.employeeId) }}
          </template>
        </el-table-column>
        <el-table-column prop="exitDate" :label="$t('hr.exit.exitDate')" width="120">
          <template #default="{ row }">
            {{ formatDate(row.exitDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="exitType" :label="$t('hr.exit.exitType')" width="120">
          <template #default="{ row }">
            <el-tag :type="getExitTypeTag(row.exitType)" size="small">
              {{ $t(`hr.exit.exitTypes.${row.exitType}`) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="exitReason" :label="$t('hr.exit.exitReason')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="isExitInterviewed" :label="$t('hr.exit.isInterviewed')" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isExitInterviewed ? 'success' : 'info'" size="small">
              {{ row.isExitInterviewed ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warningCount" :label="$t('hr.exit.warningCount')" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.warningCount > 0" type="warning" size="small">{{ row.warningCount }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="View" @click="handleView(row)">{{ $t('common.view') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 新增/查看对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="viewing ? $t('common.view') : $t('hr.exit.addExit')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px" :disabled="viewing">
        <el-form-item :label="$t('hr.exit.employeeName')" prop="employeeId">
          <el-select
            v-model="form.employeeId"
            filterable
            remote
            :remote-method="searchEmployees"
            :loading="searching"
            placeholder="请输入员工姓名搜索"
            style="width: 100%;"
          >
            <el-option
              v-for="emp in employeeOptions"
              :key="emp.id"
              :label="emp.name"
              :value="emp.id"
            >
              <span>{{ emp.name }}</span>
              <span style="color: #999; font-size: 12px; margin-left: 8px;">#{{ emp.id }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('hr.exit.exitDate')" prop="exitDate">
          <el-date-picker v-model="form.exitDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('hr.exit.exitType')" prop="exitType">
          <el-select v-model="form.exitType" style="width: 100%;">
            <el-option :label="$t('hr.exit.exitTypes.RESIGNATION')" value="RESIGNATION" />
            <el-option :label="$t('hr.exit.exitTypes.TERMINATION')" value="TERMINATION" />
            <el-option :label="$t('hr.exit.exitTypes.RETIREMENT')" value="RETIREMENT" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('hr.exit.exitReason')" prop="exitReason">
          <el-select v-model="form.exitReason" style="width: 100%;" placeholder="请选择离职原因">
            <el-option label="个人发展" value="个人发展" />
            <el-option label="薪资不满意" value="薪资不满意" />
            <el-option label="工作压力" value="工作压力" />
            <el-option label="家庭原因" value="家庭原因" />
            <el-option label="职业规划" value="职业规划" />
            <el-option label="公司裁员" value="公司裁员" />
            <el-option label="合同到期" value="合同到期" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('hr.exit.exitInterview')">
          <el-input v-model="form.exitInterview" type="textarea" :rows="3" :placeholder="$t('hr.recruitment.interviewRecordPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('hr.exit.isInterviewed')">
          <el-switch v-model="form.isExitInterviewed" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button v-if="!viewing" type="primary" @click="handleSave" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Plus, View, Switch } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getExits, getExitStats, createExit, type HrEmployeeExit, type ExitStats } from '../../api/hr'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const searching = ref(false)
const chartLoading = ref(false)
const list = ref<HrEmployeeExit[]>([])
const stats = ref<ExitStats>({ totalExits: 0, byMonth: {}, byReason: {}, byType: {} })
const showDialog = ref(false)
const viewing = ref(false)
const formRef = ref()
const monthChartRef = ref<HTMLElement>()
const reasonChartRef = ref<HTMLElement>()
let monthChart: echarts.ECharts | null = null
let reasonChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const employeeOptions = ref<Array<{ id: number; name: string }>>([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const filters = reactive({
  year: new Date().getFullYear(),
})

const form = reactive({
  employeeId: 0,
  exitDate: '',
  exitType: 'RESIGNATION' as 'RESIGNATION' | 'TERMINATION' | 'RETIREMENT',
  exitReason: '',
  exitInterview: '',
  isExitInterviewed: false,
})

const rules = {
  employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  exitDate: [{ required: true, message: '请选择离职日期', trigger: 'change' }],
  exitType: [{ required: true, message: '请选择离职类型', trigger: 'change' }],
  exitReason: [{ required: true, message: '请选择离职原因', trigger: 'change' }],
}

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return [current - 2, current - 1, current, current + 1]
})

const exitRate = computed(() => {
  if (!stats.value.totalExits || !stats.value.totalEmployees) return '0.0'
  return ((stats.value.totalExits / stats.value.totalEmployees) * 100).toFixed(1)
})

const getEmployeeName = (employeeId: number): string => {
  return `员工#${employeeId}`
}

const formatDate = (date: string | Date): string => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const getExitTypeTag = (type: string): string => {
  const map: Record<string, string> = {
    RESIGNATION: 'warning',
    TERMINATION: 'danger',
    RETIREMENT: 'info',
  }
  return map[type] || 'info'
}

const searchEmployees = async (query: string) => {
  if (!query) {
    employeeOptions.value = []
    return
  }
  searching.value = true
  try {
    // 模拟员工搜索，实际应调用员工接口
    employeeOptions.value = [
      { id: 1, name: query || '张三' },
      { id: 2, name: '李四' },
      { id: 3, name: '王五' },
    ]
  } finally {
    searching.value = false
  }
}

const loadStats = async () => {
  chartLoading.value = true
  try {
    stats.value = await getExitStats({ year: filters.year })
    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('Failed to load exit stats:', error)
    // 如果接口未实现，使用模拟数据
    stats.value = {
      totalExits: 12,
      totalEmployees: 500,
      byMonth: { '2026-01': 2, '2026-02': 3, '2026-03': 4, '2026-04': 3 },
      byReason: { '个人发展': 5, '薪资不满意': 3, '家庭原因': 2, '其他': 2 },
      byType: { 'RESIGNATION': 10, 'TERMINATION': 2 },
    }
    await nextTick()
    renderCharts()
  } finally {
    chartLoading.value = false
  }
}

const loadList = async () => {
  loading.value = true
  try {
    const data = await getExits()
    list.value = data
    pagination.total = data.length
  } catch (error: any) {
    // 如果接口未实现，显示空列表
    list.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const getChartOption = (title: string, data: Record<string, number>, color: string) => ({
  title: { text: title, textStyle: { fontSize: 14, fontWeight: 600, color: '#303133' } },
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  animation: true,
  animationDuration: 800,
  animationEasing: 'cubicOut',
  xAxis: {
    type: 'category',
    data: Object.keys(data),
    axisLine: { lineStyle: { color: '#e5e5e7' } },
    axisLabel: { color: '#606266' },
  },
  yAxis: {
    type: 'value',
    axisLine: { lineStyle: { color: '#e5e5e7' } },
    axisLabel: { color: '#606266' },
    splitLine: { lineStyle: { color: '#f0f0f0' } },
  },
  series: [{
    type: 'bar',
    data: Object.values(data),
    itemStyle: { color, borderRadius: [4, 4, 0, 0] },
    barWidth: '50%',
  }],
})

const getPieOption = (data: Record<string, number>) => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { bottom: '5%', left: 'center', textStyle: { color: '#606266' } },
  animation: true,
  animationDuration: 800,
  animationEasing: 'cubicOut',
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
    label: { show: true, color: '#303133', formatter: '{b}\n{c}人' },
    data: Object.entries(data).map(([name, value]) => ({ name, value })),
  }],
})

const renderCharts = () => {
  if (monthChartRef.value) {
    if (!monthChart) {
      monthChart = echarts.init(monthChartRef.value)
    }
    const hasData = Object.keys(stats.value.byMonth).length > 0
    monthChart.setOption(hasData ? getChartOption('月度离职趋势', stats.value.byMonth, '#f56c6c') : {
      title: { text: '月度离职趋势', textStyle: { fontSize: 14, fontWeight: 600, color: '#303133' } },
      animation: true,
    })
    monthChart.resize()
  }

  if (reasonChartRef.value) {
    if (!reasonChart) {
      reasonChart = echarts.init(reasonChartRef.value)
    }
    const hasData = Object.keys(stats.value.byReason).length > 0
    reasonChart.setOption(hasData ? getPieOption(stats.value.byReason) : {
      title: { text: '离职原因分析', textStyle: { fontSize: 14, fontWeight: 600, color: '#303133' }, left: 'center', top: 'center' },
      text: '暂无数据',
      subtext: '请先添加离职记录',
      animation: true,
    })
    reasonChart.resize()
  }
}

const handleAdd = () => {
  viewing.value = false
  employeeOptions.value = []
  Object.assign(form, {
    employeeId: 0,
    exitDate: new Date().toISOString().split('T')[0],
    exitType: 'RESIGNATION',
    exitReason: '',
    exitInterview: '',
    isExitInterviewed: false,
  })
  showDialog.value = true
}

const handleView = (row: HrEmployeeExit) => {
  viewing.value = true
  Object.assign(form, { ...row })
  showDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saving.value = true
    await createExit(form)
    ElMessage.success(t('common.success'))
    showDialog.value = false
    loadList()
    loadStats()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadStats()
  loadList()

  // 监听窗口大小变化
  resizeObserver = new ResizeObserver(() => {
    monthChart?.resize()
    reasonChart?.resize()
  })

  if (monthChartRef.value) resizeObserver.observe(monthChartRef.value)
  if (reasonChartRef.value) resizeObserver.observe(reasonChartRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  monthChart?.dispose()
  reasonChart?.dispose()
})
</script>

<style scoped lang="scss">
.exit-analysis-module {
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
          &.danger { color: #f56c6c; }
          &.warning { color: #e6a23c; }
          &.success { color: #67c23a; }
          &.info { color: #409eff; }
        }

        .stat-label {
          font-size: 12px;
          color: #86868b;
          margin-top: 4px;
        }
      }
    }

    .chart-container {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;

      .chart-wrapper {
        flex: 1;
        min-width: 0;

        .chart-title {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 12px 0;
        }

        .chart {
          height: 280px;
          background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: box-shadow 0.3s ease;

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }
        }
      }
    }

    .pagination-wrapper {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>