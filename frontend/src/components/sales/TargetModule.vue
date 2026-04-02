<template>
  <div class="target-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Aim /></el-icon>
            <span>{{ $t('sales.targets.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="showTargetDialog = true">
            {{ $t('sales.targets.addTarget') }}
          </el-button>
        </div>
      </template>

      <el-table :data="targets" stripe v-loading="loading" row-key="id">
        <el-table-column :label="$t('sales.targets.periodDate')" width="180">
          <template #default="{ row }">{{ periodDisplay(row) }}</template>
        </el-table-column>
        <el-table-column prop="period" :label="$t('sales.targets.period')" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getPeriodLabel(row.period) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetAmount" :label="$t('sales.targets.targetAmount')" width="150">
          <template #default="{ row }">
            ¥{{ row.targetAmount?.toLocaleString() || '0' }}
          </template>
        </el-table-column>
        <el-table-column prop="achievedAmount" label="实际完成" width="150">
          <template #default="{ row }">
            ¥{{ row.achievedAmount?.toLocaleString() || '0' }}
          </template>
        </el-table-column>
        <el-table-column prop="completionRate" :label="$t('sales.targets.completionRate')" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round(row.completionRate || 0)"
              :color="getProgressColor(row.completionRate || 0)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="targetCustomers" :label="$t('sales.targets.targetCustomers')" width="120" />
        <el-table-column prop="actualCustomers" :label="$t('sales.targets.actualCustomers')" width="120" />
        <el-table-column prop="description" :label="$t('sales.targets.description')" min-width="200" show-overflow-tooltip />
        <el-table-column :label="$t('common.operations')" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)">
              {{ $t('common.edit') }}
            </el-button>
            <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">
              {{ $t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 添加/编辑目标对话框 -->
      <el-dialog
        v-model="showTargetDialog"
        :title="editingTarget ? $t('sales.targets.editTarget') : $t('sales.targets.addTarget')"
        :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
        :z-index="100000"
        width="700px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="targetFormRef"
          :model="targetForm"
          :rules="targetRules"
          label-width="130px"
        >
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item :label="$t('sales.targets.period')" prop="period">
                <el-select
                  v-model="targetForm.period"
                  :placeholder="$t('sales.targets.periodPlaceholder')"
                  style="width: 100%"
                >
                  <el-option :label="$t('sales.targets.monthly')" value="monthly" />
                  <el-option :label="$t('sales.targets.quarterly')" value="quarterly" />
                  <el-option :label="$t('sales.targets.yearly')" value="yearly" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="$t('sales.targets.year')" prop="year">
                <el-date-picker
                  v-model="targetForm.year"
                  type="year"
                  value-format="YYYY"
                  style="width: 100%"
                  :placeholder="$t('sales.targets.yearPlaceholder')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item
                :label="targetForm.period === 'monthly' ? $t('sales.targets.month') : $t('sales.targets.quarter')"
                :prop="targetForm.period === 'monthly' ? 'month' : 'quarter'"
                v-if="targetForm.period !== 'yearly'"
              >
                <el-select
                  v-if="targetForm.period === 'monthly'"
                  v-model="targetForm.month"
                  style="width: 100%"
                >
                  <el-option
                    v-for="m in 12"
                    :key="m"
                    :label="`${m}月`"
                    :value="m"
                  />
                </el-select>
                <el-select
                  v-else
                  v-model="targetForm.quarter"
                  style="width: 100%"
                >
                  <el-option label="Q1" :value="1" />
                  <el-option label="Q2" :value="2" />
                  <el-option label="Q3" :value="3" />
                  <el-option label="Q4" :value="4" />
                </el-select>
              </el-form-item>
              <el-form-item v-else label=" "></el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('sales.targets.targetAmount')" prop="targetAmount">
                <el-input-number
                  v-model="targetForm.targetAmount"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  :placeholder="$t('sales.targets.targetAmountPlaceholder')"
                >
                  <template #prefix>¥</template>
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('sales.targets.targetCustomers')" prop="targetCustomers">
                <el-input-number
                  v-model="targetForm.targetCustomers"
                  :min="0"
                  style="width: 100%"
                  :placeholder="$t('sales.targets.targetCustomersPlaceholder')"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('sales.targets.description')">
            <el-input
              v-model="targetForm.description"
              type="textarea"
              :rows="4"
              :placeholder="$t('sales.targets.descriptionPlaceholder')"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="handleCancel">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleSave" :loading="saving">
            {{ $t('common.save') }}
          </el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Aim, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { getSalesTargets, createSalesTarget, updateSalesTarget, deleteSalesTarget } from '../../api/crm'
import type { CrmSalesTarget } from '../../api/crm'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const targets = ref<CrmSalesTarget[]>([])
const showTargetDialog = ref(false)
const editingTarget = ref<CrmSalesTarget | null>(null)
const targetFormRef = ref<FormInstance>()

const targetForm = ref({
  period: 'monthly' as CrmSalesTarget['period'],
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  quarter: Math.ceil((new Date().getMonth() + 1) / 3),
  targetAmount: 0,
  targetRevenue: 0,
  targetCustomers: 0,
  description: '',
})

const targetRules: FormRules = {
  period: [{ required: true, message: t('sales.targets.periodRequired'), trigger: 'change' }],
  year: [{ required: true, message: t('sales.targets.yearRequired'), trigger: 'blur' }],
  targetAmount: [{ required: true, message: t('sales.targets.targetAmountRequired'), trigger: 'blur' }],
  targetCustomers: [{ required: true, message: t('sales.targets.targetCustomersRequired'), trigger: 'blur' }],
}

// 显示用：把后端字段 year/month/quarter 格式化为可读字符串
const periodDisplay = (row: CrmSalesTarget) => {
  const year = row.year ?? new Date().getFullYear()
  if (row.period === 'monthly') return `${year}-${String(row.month || 1).padStart(2, '0')}`
  if (row.period === 'quarterly') return `${year}-Q${row.quarter || 1}`
  if (row.period === 'yearly') return String(year)
  return row.period || '-'
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return '#67c23a'
  if (percentage >= 80) return '#409eff'
  if (percentage >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getPeriodLabel = (p: string) => {
  const map: Record<string, string> = {
    monthly: t('sales.targets.monthly'),
    quarterly: t('sales.targets.quarterly'),
    yearly: t('sales.targets.yearly'),
  }
  return map[p] || p
}

// 加载目标列表
const loadTargets = async () => {
  loading.value = true
  try {
    const res = await getSalesTargets()
    targets.value = res.data
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTargets()
})

const reload = () => loadTargets()

defineExpose({ reload })

const handleEdit = (target: CrmSalesTarget) => {
  editingTarget.value = target
  targetForm.value = {
    period: target.period,
    year: target.year,
    month: target.month || new Date().getMonth() + 1,
    quarter: target.quarter || Math.ceil((new Date().getMonth() + 1) / 3),
    targetAmount: target.targetAmount,
    targetRevenue: target.targetRevenue || 0,
    targetCustomers: target.targetCustomers,
    description: target.description || '',
  }
  showTargetDialog.value = true
}

const handleDelete = async (target: CrmSalesTarget) => {
  try {
    await ElMessageBox.confirm(
      t('sales.targets.deleteConfirm', { period: periodDisplay(target) }),
      t('common.warning'),
      { type: 'warning' }
    )
    await deleteSalesTarget(target.id)
    await loadTargets()
    ElMessage.success(t('common.success'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || t('common.error'))
    }
  }
}

const handleSave = async () => {
  if (!targetFormRef.value) return

  try {
    await targetFormRef.value.validate()
    saving.value = true

    const targetData: any = {
      period: targetForm.value.period,
      year: typeof targetForm.value.year === 'string' ? parseInt(targetForm.value.year) : targetForm.value.year,
      month: targetForm.value.period === 'monthly' ? targetForm.value.month : undefined,
      quarter: targetForm.value.period === 'quarterly' ? targetForm.value.quarter : undefined,
      targetAmount: targetForm.value.targetAmount,
      targetRevenue: targetForm.value.targetRevenue,
      targetCustomers: targetForm.value.targetCustomers,
      description: targetForm.value.description,
    }

    if (editingTarget.value) {
      await updateSalesTarget(editingTarget.value.id, targetData)
    } else {
      await createSalesTarget(targetData)
    }

    await loadTargets()
    ElMessage.success(t('common.success'))
    handleCancel()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error?.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  showTargetDialog.value = false
  editingTarget.value = null
  targetFormRef.value?.resetFields()
}
</script>

<style scoped lang="scss">
.target-module {
  .module-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    background: #ffffff;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -0.01em;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }
}
</style>

