<template>
  <div class="review-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Memo /></el-icon>
            <span>{{ $t('crm.reviews.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            {{ $t('crm.reviews.add') }}
          </el-button>
        </div>
      </template>

      <!-- 筛选 -->
      <div class="filter-bar">
        <el-select v-model="periodFilter" :placeholder="$t('crm.reviews.filterByPeriod')" clearable
          style="width: 150px; margin-right: 12px;" @change="handleFilter">
          <el-option :label="$t('crm.reviews.allPeriods')" value="" />
          <el-option :label="$t('crm.reviews.monthly')" value="monthly" />
          <el-option :label="$t('crm.reviews.quarterly')" value="quarterly" />
          <el-option :label="$t('crm.reviews.yearly')" value="yearly" />
        </el-select>
        <el-input v-model="searchText" :placeholder="$t('crm.reviews.searchPlaceholder')" clearable
          style="width: 240px; margin-right: 12px;" @input="debouncedLoad">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button :icon="Refresh" @click="resetFilter">{{ $t('common.reset') }}</el-button>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="12" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">{{ $t('crm.reviews.total') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-monthly">
            <div class="stat-value">{{ stats.monthly }}</div>
            <div class="stat-label">{{ $t('crm.reviews.monthly') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-quarterly">
            <div class="stat-value">{{ stats.quarterly }}</div>
            <div class="stat-label">{{ $t('crm.reviews.quarterly') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-yearly">
            <div class="stat-value">{{ stats.yearly }}</div>
            <div class="stat-label">{{ $t('crm.reviews.yearly') }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- 复盘列表 -->
      <el-table :data="reviews" stripe v-loading="loading" row-key="id" class="review-table">
        <el-table-column prop="period" :label="$t('crm.reviews.periodType')" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="getPeriodTagType(row.period)">{{ getPeriodLabel(row.period) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="date" :label="$t('crm.reviews.periodValue')" width="130">
          <template #default="{ row }">{{ row.date }}</template>
        </el-table-column>
        <el-table-column prop="summary" :label="$t('crm.reviews.summary')" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="review-summary">{{ row.summary }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="achievements" :label="$t('crm.reviews.achievements')" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="achievements-text">{{ row.achievements || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="challenges" :label="$t('crm.reviews.challenges')" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="challenges-text">{{ row.challenges || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" :label="$t('crm.reviews.createdAt')" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="View" link @click="handleView(row)">{{ $t('common.view') }}</el-button>
            <el-button type="primary" size="small" :icon="Edit" link @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
            <el-button type="danger" size="small" :icon="Delete" link @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('common.noData')" :image-size="80" />
        </template>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="loadReviews"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 添加/编辑复盘对话框 -->
    <el-dialog v-model="showDialog" :title="editing ? $t('crm.reviews.edit') : $t('crm.reviews.add')"
      width="760px" :close-on-click-modal="false"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.reviews.periodType')" prop="period">
              <el-select v-model="form.period" style="width: 100%;" @change="onPeriodChange">
                <el-option :label="$t('crm.reviews.monthly')" value="monthly" />
                <el-option :label="$t('crm.reviews.quarterly')" value="quarterly" />
                <el-option :label="$t('crm.reviews.yearly')" value="yearly" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.reviews.periodValue')" prop="date">
              <el-select v-model="form.date" style="width: 100%;" :placeholder="$t('crm.reviews.selectPeriodValue')">
                <el-option v-for="opt in periodOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('crm.reviews.summary')" prop="summary">
          <el-input v-model="form.summary" type="textarea" :rows="3"
            :placeholder="$t('crm.reviews.summaryPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('crm.reviews.achievements')">
          <el-input v-model="form.achievements" type="textarea" :rows="3"
            :placeholder="$t('crm.reviews.achievementsPlaceholder')" />
          <div class="field-tip">{{ $t('crm.reviews.achievementsTip') }}</div>
        </el-form-item>
        <el-form-item :label="$t('crm.reviews.challenges')">
          <el-input v-model="form.challenges" type="textarea" :rows="2"
            :placeholder="$t('crm.reviews.challengesPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('crm.reviews.improvements')">
          <el-input v-model="form.improvements" type="textarea" :rows="2"
            :placeholder="$t('crm.reviews.improvementsPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="showDetailDialog" :title="$t('crm.reviews.detail')" width="700px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <div v-if="selectedReview" class="review-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('crm.reviews.periodType')">
            <el-tag size="small" :type="getPeriodTagType(selectedReview.period)">{{ getPeriodLabel(selectedReview.period) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('crm.reviews.periodValue')">{{ selectedReview.date }}</el-descriptions-item>
          <el-descriptions-item :label="$t('crm.reviews.createdAt')" :span="2">{{ formatDate(selectedReview.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <div class="section-title">{{ $t('crm.reviews.summary') }}</div>
          <div class="section-content">{{ selectedReview.summary }}</div>
        </div>
        <div class="detail-section" v-if="selectedReview.achievements">
          <div class="section-title">{{ $t('crm.reviews.achievements') }}</div>
          <div class="section-content">{{ selectedReview.achievements }}</div>
        </div>
        <div class="detail-section" v-if="selectedReview.challenges">
          <div class="section-title">{{ $t('crm.reviews.challenges') }}</div>
          <div class="section-content">{{ selectedReview.challenges }}</div>
        </div>
        <div class="detail-section" v-if="selectedReview.improvements">
          <div class="section-title">{{ $t('crm.reviews.improvements') }}</div>
          <div class="section-content">{{ selectedReview.improvements }}</div>
        </div>

        <!-- 目标同步结果 -->
        <el-alert v-if="syncResult" :title="t('crm.reviews.targetSynced')"
          type="success" :description="syncResultText" :closable="false"
          style="margin-top: 16px;" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Memo, Plus, Search, Refresh, Edit, Delete, View } from '@element-plus/icons-vue'
import { getReviews, createReview, updateReview, deleteReview,
  type SalesReview, type ReviewPeriod, type ReviewSyncResult } from '../../api/crm'

const { t, locale } = useI18n()

const loading = ref(false)
const saving = ref(false)
const reviews = ref<SalesReview[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchText = ref('')
const periodFilter = ref('')
const showDialog = ref(false)
const showDetailDialog = ref(false)
const editing = ref<SalesReview | null>(null)
const selectedReview = ref<SalesReview | null>(null)
const syncResult = ref<ReviewSyncResult | null>(null)
const formRef = ref<FormInstance>()
const stats = ref({ total: 0, monthly: 0, quarterly: 0, yearly: 0 })

const form = ref({
  period: 'monthly' as ReviewPeriod,
  date: '',
  summary: '',
  achievements: '',
  challenges: '',
  improvements: '',
})

const rules: FormRules = {
  period: [{ required: true, message: t('crm.reviews.periodRequired'), trigger: 'change' }],
  date: [{ required: true, message: t('crm.reviews.dateRequired'), trigger: 'change' }],
  summary: [{ required: true, message: t('crm.reviews.summaryRequired'), trigger: 'blur' }],
}

const getPeriodOptions = (period: ReviewPeriod) => {
  const now = new Date()
  const year = now.getFullYear()
  if (period === 'monthly') {
    const opts = []
    for (let m = 1; m <= 12; m++) {
      const v = `${year}-${String(m).padStart(2, '0')}`
      const label = locale.value === 'zh-CN' ? `${year}年${m}月` : `${year}-${String(m).padStart(2, '0')}`
      opts.push({ value: v, label })
    }
    return opts
  }
  if (period === 'quarterly') {
    return [
      { value: `${year}-Q1`, label: locale.value === 'zh-CN' ? `${year}年Q1` : `${year} Q1` },
      { value: `${year}-Q2`, label: locale.value === 'zh-CN' ? `${year}年Q2` : `${year} Q2` },
      { value: `${year}-Q3`, label: locale.value === 'zh-CN' ? `${year}年Q3` : `${year} Q3` },
      { value: `${year}-Q4`, label: locale.value === 'zh-CN' ? `${year}年Q4` : `${year} Q4` },
    ]
  }
  return [{ value: String(year), label: String(year) }]
}

const periodOptions = computed(() => getPeriodOptions(form.value.period))

const onPeriodChange = () => { form.value.date = '' }

const getPeriodLabel = (p: ReviewPeriod) => {
  const m: Record<ReviewPeriod, string> = { monthly: '月度', quarterly: '季度', yearly: '年度' }
  const mEn: Record<ReviewPeriod, string> = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }
  return locale.value === 'zh-CN' ? m[p] || p : mEn[p] || p
}

const getPeriodTagType = (p: ReviewPeriod): string =>
  ({ monthly: 'primary', quarterly: 'warning', yearly: 'success' }[p] || 'info')

let searchTimer: ReturnType<typeof setTimeout> | null = null
const debouncedLoad = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; loadReviews() }, 400)
}

const handleFilter = () => { currentPage.value = 1; loadReviews() }

const resetFilter = () => {
  searchText.value = ''; periodFilter.value = ''
  currentPage.value = 1; loadReviews()
}

const loadReviews = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (periodFilter.value) params.period = periodFilter.value
    if (searchText.value) params.keyword = searchText.value
    const res = await getReviews(params)
    reviews.value = res.data
    total.value = res.total
    computeStats()
  } catch (error: any) { ElMessage.error(error?.message || t('common.error')) }
  finally { loading.value = false }
}

const computeStats = () => {
  const all = reviews.value
  stats.value = {
    total: total.value,
    monthly: all.filter(r => r.period === 'monthly').length,
    quarterly: all.filter(r => r.period === 'quarterly').length,
    yearly: all.filter(r => r.period === 'yearly').length,
  }
}

const formatDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US') : '-'

const syncResultText = computed(() => {
  if (!syncResult.value) return ''
  const { targetTitle, achievedAmount, achievedRevenue, completionRate } = syncResult.value
  return t('crm.reviews.syncResultText', { title: targetTitle, amount: achievedAmount, revenue: achievedRevenue, rate: completionRate })
})

const handleAdd = () => {
  editing.value = null
  form.value = { period: 'monthly', date: '', summary: '', achievements: '', challenges: '', improvements: '' }
  syncResult.value = null
  showDialog.value = true
}

const handleEdit = (r: SalesReview) => {
  editing.value = r
  form.value = {
    period: r.period,
    date: r.date,
    summary: r.summary,
    achievements: r.achievements || '',
    challenges: r.challenges || '',
    improvements: r.improvements || '',
  }
  syncResult.value = null
  showDialog.value = true
}

const handleView = (r: SalesReview) => {
  selectedReview.value = r
  syncResult.value = null
  showDetailDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saving.value = true
    const data = {
      period: form.value.period,
      date: form.value.date,
      summary: form.value.summary,
      achievements: form.value.achievements || undefined,
      challenges: form.value.challenges || undefined,
      improvements: form.value.improvements || undefined,
    }
    if (editing.value) {
      await updateReview(editing.value.id, data)
      ElMessage.success(t('common.success'))
    } else {
      const res: any = await createReview(data)
      ElMessage.success(t('common.success'))
      if (res.syncResult) {
        syncResult.value = res.syncResult
        ElMessage.info(t('crm.reviews.targetSynced'))
      }
    }
    showDialog.value = false
    await loadReviews()
  } catch (error: any) { if (error !== false) ElMessage.error(error.message || t('common.error')) }
  finally { saving.value = false }
}

const handleDelete = async (r: SalesReview) => {
  try {
    await ElMessageBox.confirm(
      t('crm.reviews.deleteConfirm', { d: r.date }),
      t('common.warning'), { type: 'warning' }
    )
    await deleteReview(r.id)
    ElMessage.success(t('common.success'))
    await loadReviews()
  } catch (error: any) { if (error !== 'cancel') ElMessage.error(error.message || t('common.error')) }
}

onMounted(() => { loadReviews() })

onBeforeUnmount(() => { if (searchTimer) clearTimeout(searchTimer) })
</script>

<style scoped lang="scss">
.review-module {
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
  .stats-row { margin-bottom: 16px; }
  .stat-card {
    padding: 16px; border-radius: 12px; background: #f5f5f7; text-align: center;
    .stat-value { font-size: 22px; font-weight: 700; color: #1f2329; }
    .stat-label { font-size: 13px; color: #6b7280; margin-top: 4px; }
    &.stat-monthly { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); .stat-value, .stat-label { color: #fff; } }
    &.stat-quarterly { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); .stat-value, .stat-label { color: #fff; } }
    &.stat-yearly { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); .stat-value, .stat-label { color: #fff; } }
  }
  .review-summary { font-weight: 600; color: #1f2329; }
  .achievements-text { color: #22c55e; font-size: 13px; }
  .challenges-text { color: #f5576c; font-size: 13px; }
  .field-tip { font-size: 12px; color: #909399; margin-top: 4px; }
  .detail-section {
    margin-top: 16px;
    .section-title { font-weight: 600; font-size: 14px; color: #303133; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #ebeef5; }
    .section-content { font-size: 14px; color: #606266; line-height: 1.8; white-space: pre-wrap; }
  }
}
</style>
