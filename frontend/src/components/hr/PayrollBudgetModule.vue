<template>
  <div class="payroll-budget-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Money /></el-icon>
            <span>{{ $t('hr.payrollBudget.title') }}</span>
          </div>
          <div class="header-actions">
            <el-select v-model="filters.year" placeholder="选择年份" size="default" style="width: 120px; margin-right: 12px;" @change="loadCostStats">
              <el-option v-for="y in yearOptions" :key="y" :label="`${y}年`" :value="y" />
            </el-select>
            <el-select v-model="filters.quarter" placeholder="选择季度" size="default" clearable style="width: 100px; margin-right: 12px;" @change="loadCostStats">
              <el-option label="Q1" :value="1" />
              <el-option label="Q2" :value="2" />
              <el-option label="Q3" :value="3" />
              <el-option label="Q4" :value="4" />
            </el-select>
            <el-button type="primary" :icon="Plus" @click="handleAddBudget">{{ $t('hr.payrollBudget.addBudget') }}</el-button>
          </div>
        </div>
      </template>

      <!-- 成本统计 -->
      <div class="section-title">
        <span>{{ $t('hr.payrollBudget.costStats') }}</span>
      </div>
      <div class="stats-cards">
        <div class="stat-item" v-for="(budget, dept) in costStats.byDept" :key="dept">
          <div class="stat-value">{{ formatCurrency(budget.totalBudget) }}</div>
          <div class="stat-label">{{ dept === 'all' ? '全部部门' : dept }}</div>
          <div class="stat-actual">{{ $t('hr.payrollBudget.actual') }}: {{ formatCurrency(budget.totalActual) }}</div>
        </div>
        <div v-if="Object.keys(costStats.byDept).length === 0" class="no-data">
          {{ $t('hr.dashboard.noData') }}
        </div>
      </div>

      <!-- 预算列表 -->
      <div class="section-title">
        <span>预算列表</span>
      </div>
      <el-table :data="budgets" stripe v-loading="loading" size="small">
        <el-table-column prop="year" :label="$t('hr.payrollBudget.year')" width="80" />
        <el-table-column prop="quarter" :label="$t('hr.payrollBudget.quarter')" width="80">
          <template #default="{ row }">
            {{ row.quarter ? `Q${row.quarter}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="departmentCode" :label="$t('hr.payrollBudget.department')" width="120">
          <template #default="{ row }">
            {{ row.departmentCode || '全部' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalBudget" :label="$t('hr.payrollBudget.totalBudget')" width="140">
          <template #default="{ row }">
            {{ formatCurrency(row.totalBudget) }}
          </template>
        </el-table-column>
        <el-table-column prop="salaryBudget" :label="$t('hr.payrollBudget.salaryBudget')" width="140">
          <template #default="{ row }">
            {{ formatCurrency(row.salaryBudget) }}
          </template>
        </el-table-column>
        <el-table-column prop="bonusBudget" :label="$t('hr.payrollBudget.bonusBudget')" width="140">
          <template #default="{ row }">
            {{ formatCurrency(row.bonusBudget) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="$t('common.remarks')" show-overflow-tooltip />
        <el-table-column :label="$t('common.operations')" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEditBudget(row)" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 预警管理 -->
      <div class="section-title" style="margin-top: 24px;">
        <span>{{ $t('hr.payrollBudget.alertManagement') }}</span>
        <el-radio-group v-model="alertFilter" size="small" style="margin-left: 16px;">
          <el-radio-button label="">{{ $t('hr.payrollBudget.alerts') }}</el-radio-button>
          <el-radio-button label="PENDING">{{ $t('hr.payrollBudget.pending') }}</el-radio-button>
          <el-radio-button label="RESOLVED">{{ $t('hr.payrollBudget.resolved') }}</el-radio-button>
        </el-radio-group>
      </div>
      <el-table :data="filteredAlerts" stripe v-loading="alertLoading" size="small">
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getAlertTypeTag(row.type)" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="80">
          <template #default="{ row }">
            <el-tag :type="getAlertLevelTag(row.level)" size="small">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" :label="$t('hr.payrollBudget.alerts')" min-width="300" />
        <el-table-column prop="departmentCode" :label="$t('hr.payrollBudget.department')" width="100">
          <template #default="{ row }">
            {{ row.departmentCode || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('hr.probation.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'RESOLVED' ? 'success' : 'warning'" size="small">
              {{ row.status === 'RESOLVED' ? $t('hr.payrollBudget.resolved') : $t('hr.payrollBudget.pending') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" :label="$t('common.date')" width="120">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status !== 'RESOLVED'" type="primary" size="small" @click="handleResolveAlert(row)">{{ $t('hr.payrollBudget.resolve') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 预算编辑对话框 -->
    <el-dialog
      v-model="showBudgetDialog"
      :title="editingBudget ? $t('common.edit') : $t('hr.payrollBudget.addBudget')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="budgetFormRef" :model="budgetForm" :rules="budgetRules" label-width="140px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.payrollBudget.year')" prop="year">
              <el-input-number v-model="budgetForm.year" :min="2020" :max="2030" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.payrollBudget.quarter')">
              <el-select v-model="budgetForm.quarter" clearable style="width: 100%;">
                <el-option label="Q1" :value="1" />
                <el-option label="Q2" :value="2" />
                <el-option label="Q3" :value="3" />
                <el-option label="Q4" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('hr.payrollBudget.department')">
          <el-input v-model="budgetForm.departmentCode" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.payrollBudget.totalBudget')" prop="totalBudget">
              <el-input-number v-model="budgetForm.totalBudget" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.payrollBudget.salaryBudget')">
              <el-input-number v-model="budgetForm.salaryBudget" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.payrollBudget.bonusBudget')">
              <el-input-number v-model="budgetForm.bonusBudget" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.payrollBudget.socialBudget')">
              <el-input-number v-model="budgetForm.socialBudget" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="budgetForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBudgetDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveBudget" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 预警处理对话框 -->
    <el-dialog
      v-model="showAlertDialog"
      :title="$t('hr.payrollBudget.resolve')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="预警信息">
          <div class="alert-message">{{ resolvingAlert?.message }}</div>
        </el-form-item>
        <el-form-item label="处理说明" prop="resolution">
          <el-input v-model="alertResolution" type="textarea" :rows="4" placeholder="请输入处理说明或解决方案" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAlertDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmitResolve" :loading="saving">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Money } from '@element-plus/icons-vue'
import {
  getPayrollBudgets, createPayrollBudget, updatePayrollBudget,
  getPayrollCostStats, getPayrollAlerts, resolvePayrollAlert,
  type HrPayrollBudget, type HrPayrollAlert, type PayrollCostStats,
} from '../../api/hr'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const alertLoading = ref(false)
const budgets = ref<HrPayrollBudget[]>([])
const costStats = ref<PayrollCostStats>({ year: new Date().getFullYear(), budgets: [], byDept: {} })
const alerts = ref<HrPayrollAlert[]>([])
const showBudgetDialog = ref(false)
const showAlertDialog = ref(false)
const editingBudget = ref<HrPayrollBudget | null>(null)
const resolvingAlert = ref<HrPayrollAlert | null>(null)
const alertResolution = ref('')
const alertFilter = ref('')
const budgetFormRef = ref()

const filters = reactive({
  year: new Date().getFullYear(),
  quarter: undefined as number | undefined,
})

const budgetForm = reactive({
  year: new Date().getFullYear(),
  quarter: undefined as number | undefined,
  departmentCode: '',
  totalBudget: 0,
  salaryBudget: 0,
  bonusBudget: 0,
  socialBudget: 0,
  description: '',
})

const budgetRules = {
  year: [{ required: true, message: '请输入年份', trigger: 'blur' }],
  totalBudget: [{ required: true, message: '请输入总预算', trigger: 'blur' }],
}

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return [current - 1, current, current + 1]
})

const filteredAlerts = computed(() => {
  if (!alertFilter.value) return alerts.value
  return alerts.value.filter(a => a.status === alertFilter.value)
})

const formatCurrency = (value: number | string | undefined): string => {
  if (!value) return '¥0.00'
  return `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

const formatDate = (date: string | Date): string => {
  if (!date) return '-'
  return new Date(date).toISOString().split('T')[0]
}

const getAlertTypeTag = (type: string): string => {
  const map: Record<string, string> = {
    OVER_BUDGET: 'danger',
    APPROACHING_LIMIT: 'warning',
    COST_ANOMALY: 'info',
  }
  return map[type] || 'info'
}

const getAlertLevelTag = (level: string): string => {
  const map: Record<string, string> = {
    LOW: 'info',
    MEDIUM: 'warning',
    HIGH: 'danger',
    CRITICAL: 'danger',
  }
  return map[level] || 'info'
}

const loadCostStats = async () => {
  try {
    costStats.value = await getPayrollCostStats({ year: filters.year, quarter: filters.quarter })
  } catch (error) {
    console.error('Failed to load cost stats:', error)
  }
}

const loadBudgets = async () => {
  loading.value = true
  try {
    budgets.value = await getPayrollBudgets()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const loadAlerts = async () => {
  alertLoading.value = true
  try {
    alerts.value = await getPayrollAlerts({ status: alertFilter.value || undefined })
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    alertLoading.value = false
  }
}

const handleAddBudget = () => {
  editingBudget.value = null
  Object.assign(budgetForm, {
    year: new Date().getFullYear(),
    quarter: undefined,
    departmentCode: '',
    totalBudget: 0,
    salaryBudget: 0,
    bonusBudget: 0,
    socialBudget: 0,
    description: '',
  })
  showBudgetDialog.value = true
}

const handleEditBudget = (row: HrPayrollBudget) => {
  editingBudget.value = row
  Object.assign(budgetForm, { ...row })
  showBudgetDialog.value = true
}

const handleSaveBudget = async () => {
  if (!budgetFormRef.value) return
  try {
    await budgetFormRef.value.validate()
    saving.value = true

    if (editingBudget.value) {
      await updatePayrollBudget(editingBudget.value.id, budgetForm)
    } else {
      await createPayrollBudget(budgetForm)
    }

    ElMessage.success(t('common.success'))
    showBudgetDialog.value = false
    loadBudgets()
    loadCostStats()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleResolveAlert = (row: HrPayrollAlert) => {
  resolvingAlert.value = row
  alertResolution.value = ''
  showAlertDialog.value = true
}

const handleSubmitResolve = async () => {
  if (!resolvingAlert.value || !alertResolution.value) {
    ElMessage.warning('请输入处理说明')
    return
  }
  try {
    saving.value = true
    await resolvePayrollAlert(resolvingAlert.value.id, { resolution: alertResolution.value })
    ElMessage.success(t('common.success'))
    showAlertDialog.value = false
    loadAlerts()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCostStats()
  loadBudgets()
  loadAlerts()
})
</script>

<style scoped lang="scss">
.payroll-budget-module {
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

    .section-title {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e5e7;
    }

    .stats-cards {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;

      .stat-item {
        flex: 1;
        text-align: center;

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #1d1d1f;
        }

        .stat-label {
          font-size: 14px;
          color: #606266;
          margin-top: 4px;
        }

        .stat-actual {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }

      .no-data {
        flex: 1;
        text-align: center;
        color: #909399;
        padding: 20px;
      }
    }

    .alert-message {
      padding: 12px;
      background: #fef0f0;
      border-radius: 4px;
      color: #f56c6c;
      line-height: 1.6;
    }
  }
}
</style>