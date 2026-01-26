<template>
  <div class="review-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><DataAnalysis /></el-icon>
            <span>{{ $t('sales.review.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="showReviewDialog = true">
            {{ $t('sales.review.addReview') }}
          </el-button>
        </div>
      </template>

      <el-table :data="reviews" stripe v-loading="loading">
        <el-table-column prop="period" :label="$t('sales.review.period')" width="150" />
        <el-table-column prop="summary" :label="$t('sales.review.summary')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="achievements" :label="$t('sales.review.achievements')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="challenges" :label="$t('sales.review.challenges')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="improvements" :label="$t('sales.review.improvements')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createdAt" :label="$t('sales.review.createdAt')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
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

      <!-- 添加/编辑复盘对话框 -->
      <el-dialog
        v-model="showReviewDialog"
        :title="editingReview ? $t('sales.review.editReview') : $t('sales.review.addReview')"
        width="900px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="reviewFormRef"
          :model="reviewForm"
          :rules="reviewRules"
          label-width="120px"
        >
          <el-form-item :label="$t('sales.review.period')" prop="period">
            <el-date-picker
              v-model="reviewForm.period"
              type="month"
              :placeholder="$t('sales.review.periodPlaceholder')"
              value-format="YYYY-MM"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item :label="$t('sales.review.summary')" prop="summary">
            <el-input
              v-model="reviewForm.summary"
              type="textarea"
              :rows="4"
              :placeholder="$t('sales.review.summaryPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('sales.review.achievements')" prop="achievements">
            <el-input
              v-model="reviewForm.achievements"
              type="textarea"
              :rows="4"
              :placeholder="$t('sales.review.achievementsPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('sales.review.challenges')" prop="challenges">
            <el-input
              v-model="reviewForm.challenges"
              type="textarea"
              :rows="4"
              :placeholder="$t('sales.review.challengesPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('sales.review.improvements')" prop="improvements">
            <el-input
              v-model="reviewForm.improvements"
              type="textarea"
              :rows="4"
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { DataAnalysis, Plus, Edit, Delete } from '@element-plus/icons-vue'

interface Review {
  id: number
  period: string
  summary: string
  achievements: string
  challenges: string
  improvements: string
  createdAt: string
}

const { t, locale } = useI18n()

const loading = ref(false)
const saving = ref(false)
const reviews = ref<Review[]>([])
const showReviewDialog = ref(false)
const editingReview = ref<Review | null>(null)
const reviewFormRef = ref<FormInstance>()

const reviewForm = ref({
  period: '',
  summary: '',
  achievements: '',
  challenges: '',
  improvements: '',
})

const reviewRules: FormRules = {
  period: [{ required: true, message: t('sales.review.periodRequired'), trigger: 'change' }],
  summary: [{ required: true, message: t('sales.review.summaryRequired'), trigger: 'blur' }],
  achievements: [{ required: true, message: t('sales.review.achievementsRequired'), trigger: 'blur' }],
  challenges: [{ required: true, message: t('sales.review.challengesRequired'), trigger: 'blur' }],
  improvements: [{ required: true, message: t('sales.review.improvementsRequired'), trigger: 'blur' }],
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString(locale.value)
}

const handleEdit = (review: Review) => {
  editingReview.value = review
  reviewForm.value = {
    period: review.period,
    summary: review.summary,
    achievements: review.achievements,
    challenges: review.challenges,
    improvements: review.improvements,
  }
  showReviewDialog.value = true
}

const handleDelete = async (review: Review) => {
  try {
    await ElMessageBox.confirm(
      t('sales.review.deleteConfirm', { period: review.period }),
      t('common.warning'),
      { type: 'warning' }
    )
    const index = reviews.value.findIndex(r => r.id === review.id)
    if (index !== -1) {
      reviews.value.splice(index, 1)
    }
    ElMessage.success(t('common.success'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

const handleSave = async () => {
  if (!reviewFormRef.value) return

  try {
    await reviewFormRef.value.validate()
    saving.value = true

    const reviewData: Omit<Review, 'id' | 'createdAt'> = {
      period: reviewForm.value.period,
      summary: reviewForm.value.summary,
      achievements: reviewForm.value.achievements,
      challenges: reviewForm.value.challenges,
      improvements: reviewForm.value.improvements,
    }

    if (editingReview.value) {
      const index = reviews.value.findIndex(r => r.id === editingReview.value!.id)
      if (index !== -1) {
        const current = reviews.value[index]
        if (!current) return
        reviews.value[index] = { ...reviewData, id: editingReview.value.id, createdAt: current.createdAt }
      }
    } else {
      reviews.value.push({
        ...reviewData,
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
  showReviewDialog.value = false
  editingReview.value = null
  reviewFormRef.value?.resetFields()
  reviewForm.value = {
    period: '',
    summary: '',
    achievements: '',
    challenges: '',
    improvements: '',
  }
}
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

