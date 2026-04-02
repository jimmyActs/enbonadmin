<template>
  <div class="review-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><DataLine /></el-icon>
            <span>{{ $t('sales.review.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            {{ $t('sales.review.addReview') }}
          </el-button>
        </div>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-bar">
        <el-select
          v-model="periodFilter"
          :placeholder="$t('sales.review.periodPlaceholder')"
          clearable
          style="width: 160px; margin-right: 12px;"
          @change="loadReviews"
        >
          <el-option :label="$t('sales.targets.monthly')" value="monthly" />
          <el-option :label="$t('sales.targets.quarterly')" value="quarterly" />
          <el-option :label="$t('sales.targets.yearly')" value="yearly" />
        </el-select>
        <el-date-picker
          v-model="dateFilter"
          type="month"
          value-format="YYYY-MM"
          :placeholder="$t('sales.review.periodPlaceholder')"
          style="width: 160px; margin-right: 12px;"
          @change="loadReviews"
        />
        <el-button :icon="Refresh" @click="resetFilters">{{ $t('common.reset') }}</el-button>
      </div>

      <!-- 复盘列表 -->
      <el-table :data="reviews" stripe v-loading="loading" row-key="id">
        <el-table-column prop="period" :label="$t('sales.review.period')" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ getPeriodLabel(row.period) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('sales.targets.periodDate')" width="120">
          <template #default="{ row }">{{ row.date }}</template>
        </el-table-column>
        <el-table-column prop="summary" :label="$t('sales.review.summary')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="achievements" :label="$t('sales.review.achievements')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="challenges" :label="$t('sales.review.challenges')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="improvements" :label="$t('sales.review.improvements')" min-width="200" show-overflow-tooltip />
        <el-table-column :label="$t('common.operations')" width="180" fixed="right">
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
    </el-card>

    <!-- 添加/编辑复盘对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="editingReview ? $t('sales.review.editReview') : $t('sales.review.addReview')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form ref="reviewFormRef" :model="reviewForm" :rules="reviewRules" label-width="140px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('sales.review.period')" prop="period">
              <el-select v-model="reviewForm.period" style="width: 100%;">
                <el-option :label="$t('sales.targets.monthly')" value="monthly" />
                <el-option :label="$t('sales.targets.quarterly')" value="quarterly" />
                <el-option :label="$t('sales.targets.yearly')" value="yearly" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sales.targets.periodDate')" prop="date">
              <el-date-picker
                v-if="reviewForm.period === 'monthly'"
                v-model="reviewForm.date"
                type="month"
                value-format="YYYY-MM"
                style="width: 100%;"
              />
              <el-date-picker
                v-else-if="reviewForm.period === 'quarterly'"
                v-model="reviewForm.date"
                type="quarter"
                value-format="YYYY-Q"
                style="width: 100%;"
              />
              <el-date-picker
                v-else
                v-model="reviewForm.date"
                type="year"
                value-format="YYYY"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('sales.review.summary')" prop="summary">
          <el-input
            v-model="reviewForm.summary"
            type="textarea"
            :rows="3"
            :placeholder="$t('sales.review.summaryPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('sales.review.achievements')">
          <el-input
            v-model="reviewForm.achievements"
            type="textarea"
            :rows="3"
            :placeholder="$t('sales.review.achievementsPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('sales.review.challenges')">
          <el-input
            v-model="reviewForm.challenges"
            type="textarea"
            :rows="3"
            :placeholder="$t('sales.review.challengesPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('sales.review.improvements')">
          <el-input
            v-model="reviewForm.improvements"
            type="textarea"
            :rows="3"
            :placeholder="$t('sales.review.improvementsPlaceholder')"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { DataLine, Plus, Edit, Delete, Refresh } from '@element-plus/icons-vue'
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  type SalesReview,
  type ReviewPeriod,
  type ReviewSyncResult,
} from '../../api/crm'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const reviews = ref<SalesReview[]>([])
const showDialog = ref(false)
const editingReview = ref<SalesReview | null>(null)
const reviewFormRef = ref<FormInstance>()
const periodFilter = ref('')
const dateFilter = ref('')

const reviewForm = ref({
  period: 'monthly' as ReviewPeriod,
  date: '',
  summary: '',
  achievements: '',
  challenges: '',
  improvements: '',
})

const reviewRules: FormRules = {
  period: [{ required: true, message: t('sales.review.periodRequired'), trigger: 'change' }],
  date: [{ required: true, message: t('sales.review.dateRequired'), trigger: 'change' }],
  summary: [{ required: true, message: t('sales.review.summaryRequired'), trigger: 'blur' }],
  achievements: [{ required: true, message: t('sales.review.achievementsRequired'), trigger: 'blur' }],
  challenges: [{ required: true, message: t('sales.review.challengesRequired'), trigger: 'blur' }],
  improvements: [{ required: true, message: t('sales.review.improvementsRequired'), trigger: 'blur' }],
}

const getPeriodLabel = (p: string) => {
  const map: Record<string, string> = {
    monthly: t('sales.targets.monthly'),
    quarterly: t('sales.targets.quarterly'),
    yearly: t('sales.targets.yearly'),
  }
  return map[p] || p
}

const loadReviews = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (periodFilter.value) params.period = periodFilter.value
    if (dateFilter.value) params.keyword = dateFilter.value
    const res = await getReviews(params)
    reviews.value = res.data
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  periodFilter.value = ''
  dateFilter.value = ''
  loadReviews()
}

const handleAdd = () => {
  editingReview.value = null
  reviewForm.value = {
    period: 'monthly',
    date: new Date().toISOString().slice(0, 7),
    summary: '',
    achievements: '',
    challenges: '',
    improvements: '',
  }
  showDialog.value = true
}

const handleEdit = (review: SalesReview) => {
  editingReview.value = review
  reviewForm.value = {
    period: review.period,
    date: review.date,
    summary: review.summary,
    achievements: review.achievements,
    challenges: review.challenges,
    improvements: review.improvements,
  }
  showDialog.value = true
}

const handleSave = async () => {
  if (!reviewFormRef.value) return
  try {
    await reviewFormRef.value.validate()
    saving.value = true

    if (editingReview.value) {
      await updateReview(editingReview.value.id, reviewForm.value)
      ElMessage.success(t('common.success'))
    } else {
      const res = await createReview(reviewForm.value) as { review: SalesReview; syncResult?: ReviewSyncResult }
      // 业绩联动提示
      if (res.syncResult) {
        const { targetTitle, achievedAmount, completionRate } = res.syncResult
        ElMessage.success(
          t('sales.review.reviewSavedWithSync', {
            targetTitle,
            achievedAmount,
            completionRate: completionRate.toFixed(1),
          })
        )
      } else {
        ElMessage.success(t('common.success'))
      }
    }
    showDialog.value = false
    loadReviews()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error?.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleDelete = async (review: SalesReview) => {
  try {
    await ElMessageBox.confirm(
      t('sales.review.deleteConfirm', { period: review.date }),
      t('common.warning'),
      { type: 'warning' }
    )
    await deleteReview(review.id)
    ElMessage.success(t('common.success'))
    loadReviews()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || t('common.error'))
    }
  }
}

const handleCancel = () => {
  showDialog.value = false
  reviewFormRef.value?.resetFields()
}

onMounted(() => {
  loadReviews()
})

const reload = () => loadReviews()

defineExpose({ reload })
</script>

<style scoped lang="scss">
.review-module {
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
      .header-left { display: flex; align-items: center; gap: 8px; }
    }
  }

  .filter-bar {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px;
    background: #f5f5f7;
    border-radius: 12px;
    flex-wrap: wrap;
    gap: 12px;

    :deep(.el-input__wrapper), :deep(.el-select .el-input__wrapper) {
      border-radius: 10px;
      border-color: #e5e5e7;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .el-button { border-radius: 10px; font-weight: 500; }
  }
}
</style>
