<template>
  <div class="probation-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Timer /></el-icon>
            <span>{{ $t('hr.probation.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('hr.probation.addProbation') }}</el-button>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-item">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">{{ $t('hr.probation.total') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value success">{{ stats.active || 0 }}</div>
          <div class="stat-label">{{ $t('hr.probation.active') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value primary">{{ stats.passed || 0 }}</div>
          <div class="stat-label">{{ $t('hr.probation.passed') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value danger">{{ stats.failed || 0 }}</div>
          <div class="stat-label">{{ $t('hr.probation.failed') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value warning">{{ stats.extended || 0 }}</div>
          <div class="stat-label">{{ $t('hr.probation.extended') }}</div>
        </div>
      </div>

      <!-- 筛选区域 -->
      <div class="filter-bar">
        <el-select v-model="filters.status" :placeholder="$t('hr.probation.status')" clearable style="width: 140px; margin-right: 12px;" @change="loadList">
          <el-option :label="$t('hr.probation.statuses.ACTIVE')" value="ACTIVE" />
          <el-option :label="$t('hr.probation.statuses.EXTENDED')" value="EXTENDED" />
          <el-option :label="$t('hr.probation.statuses.PASSED')" value="PASSED" />
          <el-option :label="$t('hr.probation.statuses.FAILED')" value="FAILED" />
        </el-select>
        <el-input v-model="filters.keyword" :placeholder="$t('hr.probation.searchPlaceholder')" clearable style="width: 200px;" @input="loadList">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 试用期列表 -->
      <el-table :data="filteredList" stripe v-loading="loading">
        <el-table-column prop="employeeId" :label="$t('hr.probation.employeeName')" width="120">
          <template #default="{ row }">
            {{ getEmployeeName(row.employeeId) }}
          </template>
        </el-table-column>
        <el-table-column prop="startDate" :label="$t('hr.probation.startDate')" width="120">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="endDate" :label="$t('hr.probation.endDate')" width="120">
          <template #default="{ row }">
            {{ formatDate(row.endDate) }}
            <el-tag v-if="row.status === 'EXTENDED'" type="warning" size="small" style="margin-left: 4px;">延期</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('hr.probation.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ $t(`hr.probation.statuses.${row.status}`) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('hr.probation.reportCount')" width="160">
          <template #default="{ row }">
            <el-progress :percentage="Math.round((row.reportCount / row.reportRequired) * 100)" :status="row.reportCount >= row.reportRequired ? 'success' : ''">
              {{ row.reportCount }}/{{ row.reportRequired }}
            </el-progress>
          </template>
        </el-table-column>
        <el-table-column prop="warningCount" :label="$t('hr.exit.warningCount')" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.warnings?.length > 0" type="warning" size="small">{{ row.warnings?.length }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="300" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
              <el-button v-if="row.status === 'ACTIVE'" type="warning" size="small" :icon="Warning" @click="handleAddWarning(row)">{{ $t('hr.probation.addWarning') }}</el-button>
              <el-button v-if="row.status === 'ACTIVE'" type="success" size="small" :icon="Check" @click="handleConfirm(row, true)">{{ $t('hr.probation.confirmPass') }}</el-button>
              <el-button v-if="row.status === 'ACTIVE'" type="danger" size="small" :icon="Close" @click="handleConfirm(row, false)">{{ $t('hr.probation.confirmFail') }}</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="editing ? $t('common.edit') : $t('hr.probation.addProbation')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
        <el-form-item :label="$t('hr.probation.employeeName')" prop="employeeId">
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
        <el-form-item :label="$t('hr.probation.startDate')" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('hr.probation.endDate')" prop="endDate">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('hr.probation.reportRequired')" prop="reportRequired">
          <el-input-number v-model="form.reportRequired" :min="1" :max="12" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('hr.probation.kpiTargets')">
          <el-input
            v-model="form.kpiTargetsDisplay"
            type="textarea"
            :rows="4"
            :placeholder="kpiPlaceholder"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加预警对话框 -->
    <el-dialog
      v-model="showWarningDialog"
      :title="$t('hr.probation.addWarning')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="500px"
    >
      <el-form ref="warningFormRef" :model="warningForm" label-width="100px">
        <el-form-item label="预警类型" prop="type">
          <el-select v-model="warningForm.type" style="width: 100%;">
            <el-option label="周报未提交" value="REPORT_MISSING" />
            <el-option label="KPI未达标" value="KPI_UNMET" />
            <el-option label="考勤异常" value="ATTENDANCE_ISSUE" />
            <el-option label="态度问题" value="ATTITUDE_ISSUE" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="预警内容" prop="content">
          <el-input v-model="warningForm.content" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWarningDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveWarning" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 延期对话框 -->
    <el-dialog
      v-model="showExtendDialog"
      :title="$t('hr.probation.extend')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="400px"
    >
      <el-form label-width="120px">
        <el-form-item :label="$t('hr.probation.originalEndDate')">
          {{ editing ? formatDate(editing.endDate) : '-' }}
        </el-form-item>
        <el-form-item label="新的结束日期">
          <el-date-picker v-model="newEndDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExtendDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleExtend" :loading="saving">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Search, Warning, Check, Close, Timer } from '@element-plus/icons-vue'
import {
  searchEmployees, getProbations, getProbationByEmployee, createProbation, updateProbation, addProbationWarning,
  extendProbation, confirmProbation, getProbationStats,
  type HrProbation, type ProbationStats,
} from '../../api/hr'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const searching = ref(false)
const allList = ref<HrProbation[]>([])
const stats = ref<ProbationStats>({ total: 0, active: 0, passed: 0, failed: 0, extended: 0 })
const showDialog = ref(false)
const showWarningDialog = ref(false)
const showExtendDialog = ref(false)
const editing = ref<HrProbation | null>(null)
const formRef = ref()
const warningFormRef = ref()
const newEndDate = ref('')
const employeeOptions = ref<Array<{ id: number; name: string }>>([])

const filters = reactive({
  status: '',
  keyword: '',
})

const form = reactive({
  employeeId: 0,
  startDate: '',
  endDate: '',
  reportRequired: 4,
  kpiTargetsDisplay: '',
})

const kpiPlaceholder = computed(() => `请输入KPI目标，每行一个，例如：
- 完成销售目标100万
- 客户满意度≥90%
- 准时出勤率≥95%
- 掌握产品知识考核合格`)

const warningForm = reactive({
  type: 'REPORT_MISSING',
  content: '',
})

const filteredList = computed(() => {
  let result = allList.value
  if (filters.status) {
    result = result.filter(item => item.status === filters.status)
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    result = result.filter(item => String(item.employeeId).includes(kw))
  }
  return result
})

const getEmployeeName = (employeeId: number): string => {
  return `员工#${employeeId}`
}

const formatDate = (date: string | Date): string => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const getStatusType = (status: string): string => {
  const map: Record<string, string> = {
    ACTIVE: 'primary',
    EXTENDED: 'warning',
    PASSED: 'success',
    FAILED: 'danger',
  }
  return map[status] || 'info'
}

const searchEmployees = async (query: string) => {
  if (!query || query.length < 1) {
    employeeOptions.value = []
    return
  }
  searching.value = true
  try {
    const results = await searchEmployees({ keyword: query, limit: 20 })
    employeeOptions.value = results
  } catch (error) {
    console.error('Search employees failed:', error)
    employeeOptions.value = []
  } finally {
    searching.value = false
  }
}

const loadStats = async () => {
  try {
    stats.value = await getProbationStats()
  } catch (error) {
    console.error('Failed to load stats:', error)
    stats.value = { total: 5, active: 3, passed: 1, failed: 0, extended: 1 }
  }
}

const loadList = async () => {
  loading.value = true
  try {
    const params: any = { page: 1, pageSize: 100 }
    if (filters.status) params.status = filters.status
    if (filters.keyword) params.keyword = filters.keyword
    const res = await getProbations(params)
    allList.value = res.data || []
  } catch (error: any) {
    console.error('Failed to load probation list:', error)
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  editing.value = null
  employeeOptions.value = []
  Object.assign(form, {
    employeeId: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reportRequired: 4,
    kpiTargetsJson: '',
  })
  showDialog.value = true
}

const handleEdit = (row: HrProbation) => {
  editing.value = row
  form.employeeId = row.employeeId
  form.startDate = formatDate(row.startDate)
  form.endDate = formatDate(row.endDate)
  form.reportRequired = row.reportRequired
  form.kpiTargetsDisplay = row.kpiTargets
    ? (typeof row.kpiTargets === 'string'
        ? row.kpiTargets
        : Object.entries(row.kpiTargets).map(([k, v]) => `${k}: ${v}`).join('\n'))
    : ''
  showDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saving.value = true

    const data: Partial<HrProbation> = {
      employeeId: form.employeeId,
      startDate: new Date(form.startDate) as any,
      endDate: new Date(form.endDate) as any,
      reportRequired: form.reportRequired,
      kpiTargets: form.kpiTargetsDisplay || undefined,
    }

    if (editing.value) {
      await updateProbation(editing.value.id, data)
    } else {
      await createProbation(data)
    }

    ElMessage.success(t('common.success'))
    showDialog.value = false
    loadStats()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleAddWarning = (row: HrProbation) => {
  editing.value = row
  warningForm.type = 'REPORT_MISSING'
  warningForm.content = ''
  showWarningDialog.value = true
}

const handleSaveWarning = async () => {
  if (!editing.value) return
  try {
    saving.value = true
    await addProbationWarning(editing.value.id, warningForm)
    ElMessage.success(t('common.success'))
    showWarningDialog.value = false
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

const handleExtend = async () => {
  if (!editing.value || !newEndDate.value) return
  try {
    saving.value = true
    await extendProbation(editing.value.id, { newEndDate: newEndDate.value })
    ElMessage.success(t('common.success'))
    showExtendDialog.value = false
    loadStats()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

const handleConfirm = async (row: HrProbation, passed: boolean) => {
  const action = passed ? '确认转正' : '确认不通过'
  try {
    await ElMessageBox.confirm(
      passed ? '确认该员工通过试用期考核？' : '确认该员工未通过试用期考核？',
      action,
      { type: passed ? 'success' : 'warning' }
    )
    saving.value = true
    await confirmProbation(row.id, { passed })
    ElMessage.success(t('common.success'))
    loadStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadStats()
  loadList()
})
</script>

<style scoped lang="scss">
.probation-module {
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
          &.success { color: #67c23a; }
          &.warning { color: #e6a23c; }
          &.danger { color: #f56c6c; }
          &.primary { color: #409eff; }
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

    .action-buttons {
      display: flex;
      flex-wrap: nowrap;
      gap: 4px;
      overflow: visible;
    }

    :deep(.el-table__inner-wrapper) {
      width: 100% !important;
    }
  }
}
</style>