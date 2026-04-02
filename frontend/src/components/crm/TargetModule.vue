<template>
  <div class="target-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><DataLine /></el-icon>
            <span>{{ $t('crm.targets.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('crm.targets.addTarget') }}</el-button>
        </div>
      </template>

      <!-- 年份筛选 -->
      <div class="filter-bar">
        <el-select v-model="selectedYear" :placeholder="$t('crm.targets.year')"
          style="width: 120px; margin-right: 12px;" @change="loadTargets">
          <el-option v-for="y in availableYears" :key="y" :label="y + $t('crm.targets.yearUnit')" :value="y" />
        </el-select>
        <el-select v-model="periodFilter" :placeholder="$t('crm.targets.periodType')" clearable
          style="width: 140px; margin-right: 12px;" @change="loadTargets">
          <el-option :label="$t('crm.targets.allPeriods')" value="" />
          <el-option :label="$t('crm.targets.monthly')" value="monthly" />
          <el-option :label="$t('crm.targets.quarterly')" value="quarterly" />
          <el-option :label="$t('crm.targets.yearly')" value="yearly" />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">{{ $t('common.reset') }}</el-button>
      </div>

      <!-- 汇总统计 -->
      <el-row :gutter="16" class="summary-row" v-if="targetStats.length > 0">
        <el-col :xs="24" :sm="12" :lg="6" v-for="stat in targetStats" :key="stat.salesId">
          <el-card shadow="never" class="sales-stat-card">
            <div class="sales-name">{{ stat.salesName }}</div>
            <el-divider style="margin: 8px 0;" />
            <div class="stat-row">
              <span class="stat-label">{{ $t('crm.targets.revenueProgress') }}</span>
              <span class="stat-value">
                ¥{{ Number(stat.totalAchievedRevenue).toLocaleString() }} / ¥{{ Number(stat.totalTargetRevenue).toLocaleString() }}
              </span>
            </div>
            <el-progress
              :percentage="Math.round(stat.revenueCompletionRate)"
              :stroke-width="8"
              :color="getProgressColor(stat.revenueCompletionRate)"
              style="margin: 8px 0;"
            />
            <div class="stat-row">
              <span class="stat-label">{{ $t('crm.targets.amountProgress') }}</span>
              <span class="stat-value">
                {{ stat.totalAchievedAmount }} / {{ stat.totalTargetAmount }}
              </span>
            </div>
            <el-progress
              :percentage="Math.round(stat.amountCompletionRate)"
              :stroke-width="8"
              :color="getProgressColor(stat.amountCompletionRate)"
            />
          </el-card>
        </el-col>
      </el-row>

      <!-- 目标列表 -->
      <el-table :data="targets" stripe v-loading="loading" row-key="id" class="target-table">
        <el-table-column prop="targetCode" :label="$t('crm.targets.targetCode')" width="160">
          <template #default="{ row }"><span class="target-code">{{ row.targetCode }}</span></template>
        </el-table-column>
        <el-table-column prop="title" :label="$t('crm.targets.title')" min-width="180" />
        <el-table-column prop="salesName" :label="$t('crm.targets.salesName')" width="120" />
        <el-table-column prop="period" :label="$t('crm.targets.period')" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getPeriodLabel(row.period) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('crm.targets.periodValue')" width="100">
          <template #default="{ row }">{{ getPeriodValue(row) }}</template>
        </el-table-column>
        <el-table-column :label="$t('crm.targets.targetAmount')" width="130">
          <template #default="{ row }">
            <div class="amount-cell">
              <div>{{ row.achievedAmount }} / {{ row.targetAmount }}</div>
              <el-progress :percentage="calcRate(row.achievedAmount, row.targetAmount)" :show-text="false"
                :stroke-width="4" :color="getProgressColor(calcRate(row.achievedAmount, row.targetAmount))" style="margin-top: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('crm.targets.targetRevenue')" width="160">
          <template #default="{ row }">
            <div class="amount-cell">
              <div>¥{{ Number(row.achievedRevenue).toLocaleString() }} / ¥{{ Number(row.targetRevenue).toLocaleString() }}</div>
              <el-progress :percentage="Math.round(row.completionRate)" :show-text="false"
                :stroke-width="4" :color="getProgressColor(row.completionRate)" style="margin-top: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('crm.targets.status')" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
            <el-button type="success" size="small" :icon="Check" @click="handleReview(row, 'confirmed')" v-if="row.status === 'submitted'">
              {{ $t('crm.targets.confirm') }}
            </el-button>
            <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="loadTargets"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 添加/编辑目标对话框 -->
    <el-dialog v-model="showDialog" :title="editingTarget ? $t('crm.targets.editTarget') : $t('crm.targets.addTarget')"
      width="600px" :close-on-click-modal="false"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <el-form ref="targetFormRef" :model="targetForm" :rules="targetRules" label-width="130px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.targets.period')">
              <el-select v-model="targetForm.period" style="width: 100%" @change="onPeriodChange">
                <el-option :label="$t('crm.targets.monthly')" value="monthly" />
                <el-option :label="$t('crm.targets.quarterly')" value="quarterly" />
                <el-option :label="$t('crm.targets.yearly')" value="yearly" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.targets.year')">
              <el-input-number v-model="targetForm.year" :min="2020" :max="2100" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" v-if="targetForm.period === 'monthly'">
          <el-col :span="12">
            <el-form-item :label="$t('crm.targets.month')">
              <el-select v-model="targetForm.month" style="width: 100%">
                <el-option v-for="m in 12" :key="m" :label="m + $t('crm.targets.monthUnit')" :value="m" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" v-if="targetForm.period === 'quarterly'">
          <el-col :span="12">
            <el-form-item :label="$t('crm.targets.quarter')">
              <el-select v-model="targetForm.quarter" style="width: 100%">
                <el-option :label="$t('crm.targets.q1')" :value="1" />
                <el-option :label="$t('crm.targets.q2')" :value="2" />
                <el-option :label="$t('crm.targets.q3')" :value="3" />
                <el-option :label="$t('crm.targets.q4')" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('crm.targets.targetAmount')">
          <el-input-number v-model="targetForm.targetAmount" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('crm.targets.targetRevenue')">
          <el-input-number v-model="targetForm.targetRevenue" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('sales.customers.notes')">
          <el-input v-model="targetForm.notes" type="textarea" :rows="2" :placeholder="$t('sales.customers.notesPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { DataLine, Plus, Refresh, Edit, Delete, Check } from '@element-plus/icons-vue'
import { getCrmTargets, createCrmTarget, updateCrmTarget, deleteCrmTarget, reviewCrmTarget, getCrmTargetStats,
  type CrmSalesTarget, type CrmTargetStat } from '../../api/crm'

const { t } = useI18n()
const loading = ref(false)
const saving = ref(false)
const targets = ref<CrmSalesTarget[]>([])
const targetStats = ref<CrmTargetStat[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const selectedYear = ref(new Date().getFullYear())
const periodFilter = ref('')
const showDialog = ref(false)
const editingTarget = ref<CrmSalesTarget | null>(null)
const targetFormRef = ref<FormInstance>()
const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

const targetForm = ref({
  period: 'monthly' as any, year: new Date().getFullYear(), month: new Date().getMonth() + 1,
  quarter: Math.ceil((new Date().getMonth() + 1) / 3),
  targetAmount: 0, targetRevenue: 0, notes: '',
})

const targetRules: FormRules = {
  period: [{ required: true, message: () => t('crm.targets.periodRequired') || '请选择周期类型', trigger: 'change' }],
  year: [{ required: true, message: () => t('crm.targets.yearRequired') || '请选择年份', trigger: 'change' }],
  targetAmount: [{ required: true, message: () => t('crm.targets.amountRequired') || '请输入目标数量', trigger: 'blur' }],
  targetRevenue: [{ required: true, message: () => t('crm.targets.revenueRequired') || '请输入目标营收', trigger: 'blur' }],
}

const loadTargets = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value, year: selectedYear.value }
    if (periodFilter.value) params.period = periodFilter.value
    const res = await getCrmTargets(params)
    targets.value = res.data
    total.value = res.total
    const statRes = await getCrmTargetStats({ year: selectedYear.value })
    targetStats.value = statRes
  } catch (error: any) { ElMessage.error(error?.message || t('common.error')) }
  finally { loading.value = false }
}

const onPeriodChange = () => {
  if (targetForm.value.period === 'monthly') {
    targetForm.value.month = new Date().getMonth() + 1
  } else if (targetForm.value.period === 'quarterly') {
    targetForm.value.quarter = Math.ceil((new Date().getMonth() + 1) / 3)
  }
}

const resetFilter = () => { periodFilter.value = ''; currentPage.value = 1; loadTargets() }

const getPeriodLabel = (p: string) =>
  ({ monthly: t('crm.targets.monthly'), quarterly: t('crm.targets.quarterly'), yearly: t('crm.targets.yearly') }[p] || p)

const getStatusLabel = (s: string) =>
  ({ draft: t('crm.targets.statusDraft'), submitted: t('crm.targets.statusSubmitted'), confirmed: t('crm.targets.statusConfirmed'), rejected: t('crm.targets.statusRejected'), archived: t('crm.targets.statusArchived') }[s] || s)
const getStatusTagType = (s: string) =>
  ({ draft: 'info', submitted: 'warning', confirmed: 'success', rejected: 'danger', archived: 'info' }[s] || 'info')

const getPeriodValue = (row: CrmSalesTarget) => {
  if (row.period === 'monthly') return `${row.year}/${row.month}`
  if (row.period === 'quarterly') return `${row.year} Q${row.quarter}`
  return `${row.year}`
}

const getProgressColor = (p: number) => p >= 100 ? '#22c55e' : p >= 70 ? '#f59e0b' : p >= 40 ? '#3b82f6' : '#ef4444'
const calcRate = (a: number, b: number) => b > 0 ? Math.min(100, Math.round((a / b) * 10000) / 100) : 0

const handleAdd = () => {
  editingTarget.value = null
  targetForm.value = { period: 'monthly', year: new Date().getFullYear(), month: new Date().getMonth() + 1, quarter: 1, targetAmount: 0, targetRevenue: 0, notes: '' }
  showDialog.value = true
}

const handleEdit = (target: CrmSalesTarget) => {
  editingTarget.value = target
  targetForm.value = {
    period: target.period, year: target.year, month: target.month || 1, quarter: target.quarter || 1,
    targetAmount: target.targetAmount, targetRevenue: Number(target.targetRevenue), notes: target.notes || '',
  }
  showDialog.value = true
}

const handleSave = async () => {
  if (!targetFormRef.value) return
  try {
    await targetFormRef.value.validate()
    saving.value = true
    const data: any = {
      period: targetForm.value.period, year: targetForm.value.year,
      targetAmount: targetForm.value.targetAmount, targetRevenue: targetForm.value.targetRevenue,
      notes: targetForm.value.notes || undefined,
    }
    if (targetForm.value.period === 'monthly') { data.month = targetForm.value.month }
    if (targetForm.value.period === 'quarterly') { data.quarter = targetForm.value.quarter }
    if (editingTarget.value) {
      await updateCrmTarget(editingTarget.value.id, data)
    } else {
      await createCrmTarget(data)
    }
    ElMessage.success(t('common.success'))
    showDialog.value = false
    await loadTargets()
  } catch (error: any) { if (error !== false) ElMessage.error(error.message || t('common.error')) }
  finally { saving.value = false }
}

const handleReview = async (target: CrmSalesTarget, status: 'confirmed' | 'rejected') => {
  try {
    await ElMessageBox.confirm(
      status === 'confirmed' ? t('crm.targets.confirmTip') : t('crm.targets.rejectTip'),
      t('crm.targets.review'), { type: status === 'confirmed' ? 'success' : 'warning' }
    )
    await reviewCrmTarget(target.id, status as any)
    ElMessage.success(t('common.success'))
    await loadTargets()
  } catch (error: any) { if (error !== 'cancel') ElMessage.error(error.message || t('common.error')) }
}

const handleDelete = async (target: CrmSalesTarget) => {
  try {
    await ElMessageBox.confirm(t('crm.targets.deleteConfirm', { title: target.title }), t('common.warning'), { type: 'warning' })
    await deleteCrmTarget(target.id)
    ElMessage.success(t('common.success'))
    await loadTargets()
  } catch (error: any) { if (error !== 'cancel') ElMessage.error(error.message || t('common.error')) }
}

onMounted(() => { loadTargets() })
</script>

<style scoped lang="scss">
.target-module {
  .module-card {
    border-radius: 16px; border: 1px solid #e5e5e7; box-shadow: 0 1px 3px rgba(0,0,0,0.04); background: #fff;
    .card-header {
      display: flex; align-items: center; justify-content: space-between; font-weight: 600; color: #1d1d1f;
      .header-left { display: flex; align-items: center; gap: 8px; }
    }
  }
  .filter-bar {
    display: flex; align-items: center; margin-bottom: 16px; padding: 16px; background: #f5f5f7;
    border-radius: 12px; flex-wrap: wrap; gap: 12px;
    :deep(.el-input__wrapper), :deep(.el-select .el-input__wrapper) {
      border-radius: 10px; border-color: #e5e5e7; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .el-button { border-radius: 10px; font-weight: 500; }
  }
  .summary-row { margin-bottom: 16px; }
  .sales-stat-card {
    border-radius: 12px; border: 1px solid #e5e5e7; padding: 16px;
    .sales-name { font-weight: 600; font-size: 16px; color: #1f2329; }
    .stat-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
    .stat-label { color: #6b7280; }
    .stat-value { font-weight: 600; color: #1f2329; }
  }
  .target-code { font-family: 'Courier New', monospace; font-size: 12px; color: #64748b; }
  .amount-cell { font-size: 13px; .el-progress { margin-top: 2px; } }
}
</style>
