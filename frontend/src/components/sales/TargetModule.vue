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

      <el-table :data="targets" stripe v-loading="loading">
        <el-table-column prop="period" :label="$t('sales.targets.period')" width="150" />
        <el-table-column prop="targetAmount" :label="$t('sales.targets.targetAmount')" width="150">
          <template #default="{ row }">
            ¥{{ row.targetAmount?.toLocaleString() || '0' }}
          </template>
        </el-table-column>
        <el-table-column prop="actualAmount" :label="$t('sales.targets.actualAmount')" width="150">
          <template #default="{ row }">
            ¥{{ row.actualAmount?.toLocaleString() || '0' }}
          </template>
        </el-table-column>
        <el-table-column prop="completionRate" :label="$t('sales.targets.completionRate')" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.completionRate"
              :color="getProgressColor(row.completionRate)"
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
        width="700px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="targetFormRef"
          :model="targetForm"
          :rules="targetRules"
          label-width="120px"
        >
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

          <el-form-item :label="$t('sales.targets.date')" prop="date">
            <el-date-picker
              v-model="targetForm.date"
              type="month"
              :placeholder="$t('sales.targets.datePlaceholder')"
              value-format="YYYY-MM"
              style="width: 100%"
              v-if="targetForm.period === 'monthly'"
            />
            <el-date-picker
              v-model="targetForm.date"
              type="quarter"
              :placeholder="$t('sales.targets.datePlaceholder')"
              value-format="YYYY-Q"
              style="width: 100%"
              v-if="targetForm.period === 'quarterly'"
            />
            <el-date-picker
              v-model="targetForm.date"
              type="year"
              :placeholder="$t('sales.targets.datePlaceholder')"
              value-format="YYYY"
              style="width: 100%"
              v-if="targetForm.period === 'yearly'"
            />
          </el-form-item>

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

          <el-form-item :label="$t('sales.targets.targetCustomers')" prop="targetCustomers">
            <el-input-number
              v-model="targetForm.targetCustomers"
              :min="0"
              style="width: 100%"
              :placeholder="$t('sales.targets.targetCustomersPlaceholder')"
            />
          </el-form-item>

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
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Aim, Plus, Edit, Delete } from '@element-plus/icons-vue'

interface Target {
  id: number
  period: 'monthly' | 'quarterly' | 'yearly'
  date: string
  targetAmount: number
  actualAmount: number
  completionRate: number
  targetCustomers: number
  actualCustomers: number
  description?: string
  createdAt: string
}

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const targets = ref<Target[]>([])
const showTargetDialog = ref(false)
const editingTarget = ref<Target | null>(null)
const targetFormRef = ref<FormInstance>()

const targetForm = ref({
  period: 'monthly' as Target['period'],
  date: '',
  targetAmount: 0,
  targetCustomers: 0,
  description: '',
})

const targetRules: FormRules = {
  period: [{ required: true, message: t('sales.targets.periodRequired'), trigger: 'change' }],
  date: [{ required: true, message: t('sales.targets.dateRequired'), trigger: 'change' }],
  targetAmount: [{ required: true, message: t('sales.targets.targetAmountRequired'), trigger: 'blur' }],
  targetCustomers: [{ required: true, message: t('sales.targets.targetCustomersRequired'), trigger: 'blur' }],
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return '#67c23a'
  if (percentage >= 80) return '#409eff'
  if (percentage >= 60) return '#e6a23c'
  return '#f56c6c'
}

const handleEdit = (target: Target) => {
  editingTarget.value = target
  targetForm.value = {
    period: target.period,
    date: target.date,
    targetAmount: target.targetAmount,
    targetCustomers: target.targetCustomers,
    description: target.description || '',
  }
  showTargetDialog.value = true
}

const handleDelete = async (target: Target) => {
  try {
    await ElMessageBox.confirm(
      t('sales.targets.deleteConfirm', { period: target.date }),
      t('common.warning'),
      { type: 'warning' }
    )
    const index = targets.value.findIndex(t => t.id === target.id)
    if (index !== -1) {
      targets.value.splice(index, 1)
    }
    ElMessage.success(t('common.success'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

const handleSave = async () => {
  if (!targetFormRef.value) return

  try {
    await targetFormRef.value.validate()
    saving.value = true

    // 计算完成率（这里需要根据实际数据计算）
    const actualAmount = 0 // TODO: 从实际数据获取
    const actualCustomers = 0 // TODO: 从实际数据获取
    const completionRate = targetForm.value.targetAmount > 0
      ? Math.round((actualAmount / targetForm.value.targetAmount) * 100)
      : 0

    const targetData: Omit<Target, 'id' | 'createdAt'> = {
      period: targetForm.value.period,
      date: targetForm.value.date,
      targetAmount: targetForm.value.targetAmount,
      actualAmount,
      completionRate,
      targetCustomers: targetForm.value.targetCustomers,
      actualCustomers,
      description: targetForm.value.description,
    }

    if (editingTarget.value) {
      const index = targets.value.findIndex(t => t.id === editingTarget.value!.id)
      if (index !== -1) {
        const current = targets.value[index]
        if (!current) return
        targets.value[index] = { ...targetData, id: editingTarget.value.id, createdAt: current.createdAt }
      }
    } else {
      targets.value.push({
        ...targetData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      })
    }

    ElMessage.success(t('common.success'))
    handleCancel()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  showTargetDialog.value = false
  editingTarget.value = null
  targetFormRef.value?.resetFields()
  targetForm.value = {
    period: 'monthly',
    date: '',
    targetAmount: 0,
    targetCustomers: 0,
    description: '',
  }
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

