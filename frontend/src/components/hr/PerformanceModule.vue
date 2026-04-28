<template>
  <div class="performance-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><DataLine /></el-icon>
            <span>{{ $t('hr.performance.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" :icon="Setting" @click="showTemplateDialog = true">
              {{ $t('hr.performance.template') }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">
              {{ $t('hr.performance.add') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-item">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">{{ $t('hr.performance.totalRecords') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value success">{{ stats.avgScore || 0 }}</div>
          <div class="stat-label">{{ $t('hr.performance.avgScore') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value info">{{ stats.ratingDistribution?.A || 0 }}</div>
          <div class="stat-label">A {{ $t('hr.performance.level') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value warning">{{ stats.ratingDistribution?.B || 0 }}</div>
          <div class="stat-label">B {{ $t('hr.performance.level') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.ratingDistribution?.C || 0 }}</div>
          <div class="stat-label">C {{ $t('hr.performance.level') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value warning">{{ stats.ratingDistribution?.D || 0 }}</div>
          <div class="stat-label">D {{ $t('hr.performance.level') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value danger">{{ stats.ratingDistribution?.E || 0 }}</div>
          <div class="stat-label">E {{ $t('hr.performance.level') }}</div>
        </div>
      </div>

      <!-- 筛选区域 -->
      <div class="filter-bar">
        <el-date-picker
          v-model="filters.period"
          type="month"
          value-format="YYYY-MM"
          :placeholder="$t('hr.performance.selectPeriod')"
          style="width: 160px; margin-right: 12px;"
          @change="loadData"
        />
        <el-select
          v-model="filters.status"
          :placeholder="$t('hr.performance.filterByStatus')"
          clearable
          style="width: 140px; margin-right: 12px;"
          @change="loadData"
        >
          <el-option :label="$t('hr.performance.all')" value="" />
          <el-option :label="$t('hr.performance.statuses.draft')" value="draft" />
          <el-option :label="$t('hr.performance.statuses.submitted')" value="submitted" />
          <el-option :label="$t('hr.performance.statuses.reviewed')" value="reviewed" />
        </el-select>
        <el-input
          v-model="filters.keyword"
          :placeholder="$t('hr.performance.searchPlaceholder')"
          clearable
          style="width: 200px; margin-right: 12px;"
          @input="loadData"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button :icon="Refresh" @click="resetFilters">{{ $t('common.reset') }}</el-button>
      </div>

      <!-- 绩效列表 -->
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="employeeName" :label="$t('hr.performance.employeeName')" width="120" />
        <el-table-column prop="department" :label="$t('hr.performance.department')" width="120" />
        <el-table-column prop="period" :label="$t('hr.performance.period')" width="120" />
        <el-table-column prop="selfScore" :label="$t('hr.performance.selfScore')" width="100">
          <template #default="{ row }">
            {{ typeof row.selfScore === 'number' ? row.selfScore.toFixed(1) : (parseFloat(row.selfScore)?.toFixed(1) || '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="supervisorScore" :label="$t('hr.performance.supervisorScore')" width="100">
          <template #default="{ row }">
            {{ typeof row.supervisorScore === 'number' ? row.supervisorScore.toFixed(1) : (parseFloat(row.supervisorScore)?.toFixed(1) || '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="finalScore" :label="$t('hr.performance.finalScore')" width="100">
          <template #default="{ row }">
            <span class="score-value" :class="getScoreClass(typeof row.finalScore === 'number' ? row.finalScore : parseFloat(row.finalScore) || 0)">
              {{ typeof row.finalScore === 'number' ? row.finalScore.toFixed(1) : (parseFloat(row.finalScore)?.toFixed(1) || '-') }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="rating" :label="$t('hr.performance.rating')" width="80">
          <template #default="{ row }">
            <el-tag :type="getRatingType(row.rating)" size="small">
              {{ row.rating || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('hr.performance.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewedByName" :label="$t('hr.performance.reviewer')" width="100" />
        <el-table-column :label="$t('common.operations')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)">
              {{ $t('common.edit') }}
            </el-button>
            <el-button v-if="row.status === 'submitted'" type="success" size="small" :icon="CircleCheck" @click="handleReview(row)">
              {{ $t('hr.performance.review') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="editing ? $t('hr.performance.edit') : $t('hr.performance.add')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item :label="$t('hr.performance.employeeName')" prop="employeeName">
          <el-input v-model="form.employeeName" />
        </el-form-item>
        <el-form-item :label="$t('hr.performance.department')" prop="department">
          <el-input v-model="form.department" />
        </el-form-item>
        <el-form-item :label="$t('hr.performance.period')" prop="period">
          <el-date-picker
            v-model="form.period"
            type="month"
            value-format="YYYY-MM"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item :label="$t('hr.performance.selfScore')" prop="selfScore">
          <el-input-number v-model="form.selfScore" :min="0" :max="100" :step="0.1" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('hr.performance.selfComment')">
          <el-input v-model="form.selfComment" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('hr.performance.remarks')">
          <el-input v-model="form.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <!-- 草稿：说明上级评分不在本弹窗 -->
      <el-alert
        v-if="editing && editing.status === 'draft'"
        type="warning"
        :closable="false"
        show-icon
        class="edit-dialog-alert"
      >
        {{ $t('hr.performance.draftSupervisorHint') }}
      </el-alert>

      <!-- 已提交：上级评分在「审核」里填，编辑里只做说明 + 快捷入口 -->
      <el-alert
        v-if="editing && editing.status === 'submitted'"
        type="info"
        :closable="false"
        show-icon
        class="edit-dialog-alert"
      >
        <template #title>{{ $t('hr.performance.supervisorReviewHintTitle') }}</template>
        <p class="edit-dialog-alert-text">{{ $t('hr.performance.supervisorReviewHintBody') }}</p>
      </el-alert>

      <!-- 已审核：在编辑里只读展示上级评分与结果（与列表列一致） -->
      <template v-if="editing && (editing.status === 'reviewed' || editing.status === 'completed')">
        <el-divider content-position="left">{{ $t('hr.performance.supervisorResultSection') }}</el-divider>
        <div class="supervisor-readonly-grid">
          <div class="sr-row">
            <span class="sr-label">{{ $t('hr.performance.supervisorScore') }}</span>
            <span class="sr-value score-value" :class="getScoreClass(Number(editing.supervisorScore))">
              {{ editing.supervisorScore != null ? Number(editing.supervisorScore).toFixed(1) : '-' }}
            </span>
          </div>
          <div class="sr-row" v-if="editing.supervisorComment">
            <span class="sr-label">{{ $t('hr.performance.supervisorComment') }}</span>
            <span class="sr-value">{{ editing.supervisorComment }}</span>
          </div>
          <div class="sr-row">
            <span class="sr-label">{{ $t('hr.performance.finalScore') }}</span>
            <span class="sr-value score-value" :class="getScoreClass(Number(editing.finalScore))">
              {{ editing.finalScore != null ? Number(editing.finalScore).toFixed(1) : '-' }}
            </span>
          </div>
          <div class="sr-row">
            <span class="sr-label">{{ $t('hr.performance.rating') }}</span>
            <el-tag :type="getRatingType(editing.rating || '')" size="small">{{ editing.rating || '-' }}</el-tag>
          </div>
          <div class="sr-row" v-if="editing.reviewedByName">
            <span class="sr-label">{{ $t('hr.performance.reviewer') }}</span>
            <span class="sr-value">{{ editing.reviewedByName }}</span>
          </div>
          <div class="sr-row" v-if="editing.reviewedAt">
            <span class="sr-label">{{ $t('hr.performance.reviewedAt') }}</span>
            <span class="sr-value">{{ formatReviewedAt(editing.reviewedAt) }}</span>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="showDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button
          v-if="editing && editing.status === 'draft'"
          type="warning"
          @click="handleSubmitForSupervisorReview"
          :loading="saving"
        >
          {{ $t('hr.performance.submitForSupervisorReview') }}
        </el-button>
        <el-button
          v-if="editing && editing.status === 'submitted'"
          type="success"
          :icon="CircleCheck"
          @click="openReviewFromEdit"
        >
          {{ $t('hr.performance.openSupervisorReview') }}
        </el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 绩效审核对话框 -->
    <el-dialog
      v-model="showReviewDialog"
      :title="$t('hr.performance.reviewDialog')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="580px"
      :close-on-click-modal="false"
    >
      <!-- 员工自评信息（只读展示） -->
      <el-alert
        v-if="reviewingRecord"
        :title="$t('hr.performance.selfAssessmentInfo')"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <div class="self-review-summary">
          <div class="self-review-row">
            <span class="label">{{ $t('hr.performance.selfScore') }}：</span>
            <span class="value score-value" :class="getScoreClass(reviewingRecord.selfScore)">
              {{ reviewingRecord.selfScore?.toFixed(1) || '-' }}
            </span>
          </div>
          <div class="self-review-row" v-if="reviewingRecord.selfComment">
            <span class="label">{{ $t('hr.performance.selfComment') }}：</span>
            <span class="value">{{ reviewingRecord.selfComment }}</span>
          </div>
        </div>
      </el-alert>

      <!-- 上级评分 -->
      <el-form ref="reviewFormRef" :model="reviewForm" :rules="reviewRules" label-width="140px">
        <el-form-item :label="$t('hr.performance.supervisorScore')" prop="supervisorScore">
          <el-input-number v-model="reviewForm.supervisorScore" :min="0" :max="100" :step="0.1" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('hr.performance.supervisorComment')">
          <el-input v-model="reviewForm.supervisorComment" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReviewDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveReview" :loading="saving">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 指标模板对话框 -->
    <el-dialog
      v-model="showTemplateDialog"
      :title="$t('hr.performance.template')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="template-header">
        <el-button type="primary" size="small" :icon="Plus" @click="handleAddTemplate">
          {{ $t('hr.performance.addTemplate') }}
        </el-button>
      </div>
      <el-table :data="templates" stripe size="small">
        <el-table-column prop="name" :label="$t('hr.performance.templateName')" width="150" />
        <el-table-column prop="position" :label="$t('hr.performance.position')" width="120" />
        <el-table-column prop="indicators" :label="$t('hr.performance.indicators')" min-width="200" show-overflow-tooltip />
        <el-table-column :label="$t('common.operations')" width="120">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEditTemplate(row)" />
            <el-button type="danger" size="small" :icon="Delete" @click="handleDeleteTemplate(row)" />
          </template>
        </el-table-column>
      </el-table>

      <el-divider v-if="showTemplateForm" />

      <el-form v-if="showTemplateForm" ref="templateFormRef" :model="templateForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.performance.templateName')" prop="name">
              <el-input v-model="templateForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.performance.position')" prop="position">
              <el-input v-model="templateForm.position" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('hr.performance.indicators')" prop="indicators">
          <el-input v-model="templateForm.indicators" type="textarea" :rows="4" placeholder="每行一个指标，格式：指标名称|权重|评分标准" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSaveTemplate" :loading="saving">{{ $t('common.save') }}</el-button>
          <el-button @click="showTemplateForm = false">{{ $t('common.cancel') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { DataLine, Plus, Edit, Delete, Search, Refresh, Setting, CircleCheck } from '@element-plus/icons-vue'
import {
  getPerformanceList, createPerformance, updatePerformance, reviewPerformance,
  getPerformanceStats, getPerformanceTemplates, createPerformanceTemplate,
  updatePerformanceTemplate, deletePerformanceTemplate,
  type HrPerformance, type HrPerformanceTemplate, type PerformanceStatus,
} from '../../api/hr'

const { t, locale } = useI18n()

const formatReviewedAt = (d: string) => {
  if (!d) return '-'
  return new Date(d).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US')
}

const loading = ref(false)
const saving = ref(false)
const list = ref<HrPerformance[]>([])
const stats = ref<any>({
  total: 0, avgScore: 0,
  ratingDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0 },
})
const templates = ref<HrPerformanceTemplate[]>([])
const showDialog = ref(false)
const showReviewDialog = ref(false)
const showTemplateDialog = ref(false)
const showTemplateForm = ref(false)
const editing = ref<HrPerformance | null>(null)
const editingTemplate = ref<HrPerformanceTemplate | null>(null)
const formRef = ref<FormInstance>()
const reviewFormRef = ref<FormInstance>()
const templateFormRef = ref<FormInstance>()
const reviewingRecord = ref<HrPerformance | null>(null)

const filters = reactive({
  period: '',
  status: '',
  keyword: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const form = reactive({
  employeeName: '',
  department: '',
  period: '',
  selfScore: 0,
  selfComment: '',
  notes: '',
})

const reviewForm = reactive({
  supervisorScore: 0,
  supervisorComment: '',
})

const templateForm = reactive({
  name: '',
  position: '',
  indicators: '',
})

const rules: FormRules = {
  employeeName: [{ required: true, message: t('hr.performance.employeeNameRequired'), trigger: 'blur' }],
  period: [{ required: true, message: t('hr.performance.periodRequired'), trigger: 'change' }],
  selfScore: [{ required: true, message: t('hr.performance.selfScoreRequired'), trigger: 'blur' }],
}

const reviewRules: FormRules = {
  supervisorScore: [{ required: true, message: t('hr.performance.supervisorScoreRequired'), trigger: 'blur' }],
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (filters.period) params.period = filters.period
    if (filters.status) params.status = filters.status
    if (filters.keyword) params.keyword = filters.keyword

    const res = await getPerformanceList(params)
    list.value = res.data
    pagination.total = res.total ?? 0
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const params: any = {}
    if (filters.period) params.period = filters.period
    stats.value = await getPerformanceStats(params)
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const loadTemplates = async () => {
  try {
    templates.value = await getPerformanceTemplates()
  } catch (error) {
    console.error('Failed to load templates:', error)
  }
}

const resetFilters = () => {
  filters.period = ''
  filters.status = ''
  filters.keyword = ''
  pagination.page = 1
  loadData()
  loadStats()
}

const handleAdd = () => {
  editing.value = null
  Object.assign(form, { employeeName: '', department: '', period: '', selfScore: 0, selfComment: '', notes: '' })
  showDialog.value = true
}

const handleEdit = (row: HrPerformance) => {
  editing.value = row
  Object.assign(form, {
    employeeName: row.employeeName ?? '',
    department: row.department ?? '',
    period: row.period ?? '',
    selfScore: Number(row.selfScore) || 0,
    selfComment: row.selfComment ?? '',
    notes: '',
  })
  showDialog.value = true
}

const openReviewFromEdit = () => {
  if (!editing.value || editing.value.status !== 'submitted') return
  const row = editing.value
  showDialog.value = false
  handleReview(row)
}

const buildPerformancePayload = () => ({
  employeeName: form.employeeName,
  department: form.department,
  period: form.period,
  selfScore: form.selfScore,
  selfComment: form.selfComment,
})

/** 草稿 → 已提交，列表才会出现「上级审核」 */
const handleSubmitForSupervisorReview = async () => {
  if (!formRef.value || !editing.value) return
  try {
    await formRef.value.validate()
    saving.value = true
    await updatePerformance(editing.value.id, {
      ...buildPerformancePayload(),
      status: 'submitted' as PerformanceStatus,
    })
    ElMessage.success(t('common.success'))
    showDialog.value = false
    loadData()
    loadStats()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saving.value = true

    const payload = buildPerformancePayload()

    if (editing.value) {
      await updatePerformance(editing.value.id, payload)
    } else {
      await createPerformance(payload)
    }

    ElMessage.success(t('common.success'))
    showDialog.value = false
    loadData()
    loadStats()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleReview = (row: HrPerformance) => {
  editing.value = row
  reviewingRecord.value = row
  reviewForm.supervisorScore = 0
  reviewForm.supervisorComment = ''
  showReviewDialog.value = true
}

const handleSaveReview = async () => {
  if (!reviewFormRef.value) return
  try {
    await reviewFormRef.value.validate()
    saving.value = true

    await reviewPerformance(editing.value!.id, reviewForm)

    ElMessage.success(t('common.success'))
    showReviewDialog.value = false
    loadData()
    loadStats()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleAddTemplate = () => {
  editingTemplate.value = null
  Object.assign(templateForm, { name: '', position: '', indicators: '' })
  showTemplateForm.value = true
}

const handleEditTemplate = (row: HrPerformanceTemplate) => {
  editingTemplate.value = row
  Object.assign(templateForm, { ...row })
  showTemplateForm.value = true
}

const handleSaveTemplate = async () => {
  try {
    saving.value = true
    if (editingTemplate.value) {
      await updatePerformanceTemplate(editingTemplate.value.id, templateForm)
    } else {
      await createPerformanceTemplate(templateForm)
    }
    ElMessage.success(t('common.success'))
    showTemplateForm.value = false
    loadTemplates()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

const handleDeleteTemplate = async (row: HrPerformanceTemplate) => {
  try {
    await ElMessageBox.confirm(t('hr.performance.deleteTemplateConfirm'), t('common.warning'), { type: 'warning' })
    await deletePerformanceTemplate(row.id)
    ElMessage.success(t('common.success'))
    loadTemplates()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

const getScoreClass = (score: number): string => {
  if (score >= 90) return 'score-a'
  if (score >= 80) return 'score-b'
  if (score >= 70) return 'score-c'
  if (score >= 60) return 'score-d'
  return 'score-e'
}

const getRatingType = (rating: string): string => {
  const map: Record<string, string> = { A: 'success', B: 'primary', C: 'warning', D: 'danger', E: 'info' }
  return map[rating] || 'info'
}

const getStatusType = (status: string): string => {
  const map: Record<string, string> = { draft: 'info', submitted: 'warning', reviewed: 'success', completed: 'success' }
  return map[status] || 'info'
}

const getStatusText = (status: string): string => {
  return t(`hr.performance.statuses.${status}`) || status
}

onMounted(() => {
  loadData()
  loadStats()
  loadTemplates()
})
</script>

<style scoped lang="scss">
.performance-module {
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
          &.info { color: #409eff; }
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

    .pagination-wrapper {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }

    .score-value {
      font-weight: 600;
      &.score-a { color: #67c23a; }
      &.score-b { color: #409eff; }
      &.score-c { color: #e6a23c; }
      &.score-d { color: #f56c6c; }
      &.score-e { color: #909399; }
    }

    .template-header {
      margin-bottom: 16px;
    }

    .self-review-summary {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .self-review-row {
        display: flex;
        align-items: baseline;
        gap: 8px;

        .label {
          font-weight: 500;
          color: #606266;
          flex-shrink: 0;
        }

        .value {
          color: #303133;
        }

        .score-value {
          font-size: 18px;
          font-weight: 700;
        }
      }
    }
  }
}

:deep(.edit-dialog-alert) {
  margin-top: 14px;
}

.edit-dialog-alert-text {
  margin: 6px 0 0;
  line-height: 1.5;
  font-size: 13px;
}

.supervisor-readonly-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0 8px;

  .sr-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 14px;
  }

  .sr-label {
    flex: 0 0 120px;
    color: #606266;
    font-weight: 500;
  }

  .sr-value {
    flex: 1;
    min-width: 0;
    color: #303133;
    word-break: break-word;
  }
}
</style>
