<template>
  <div class="weekly-work-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><DataAnalysis /></el-icon>
            <span>{{ $t('workspace.weeklyWork.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button :icon="Plus" @click="showPlanDialog = true">
              {{ $t('workspace.weeklyWork.addPlan') }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="showSummaryDialog = true">
              {{ $t('workspace.weeklyWork.addSummary') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 周选择器 -->
      <div class="week-selector">
        <el-button :icon="ArrowLeft" circle @click="previousWeek" />
        <el-date-picker
          v-model="selectedWeek"
          type="week"
          :placeholder="$t('workspace.weeklyWork.selectWeek')"
          format="YYYY 第 ww 周"
          value-format="YYYY-MM-DD"
          @change="loadWeeklyWork"
        />
        <el-button :icon="ArrowRight" circle @click="nextWeek" />
        <el-button type="text" @click="goToCurrentWeek">
          {{ $t('workspace.weeklyWork.thisWeek') }}
        </el-button>
      </div>

      <!-- 周计划和总结 -->
      <div class="weekly-content">
        <div class="week-plan-section">
          <h3 class="section-title">
            <el-icon><Calendar /></el-icon>
            {{ $t('workspace.weeklyWork.weekPlan') }}
          </h3>
          <div class="plan-list">
            <div
              v-for="plan in weeklyPlans"
              :key="plan.id"
              class="plan-item"
            >
              <div class="plan-header">
                <h4 class="plan-title">{{ plan.title }}</h4>
                <div class="plan-actions">
                  <el-button
                    type="text"
                    size="small"
                    :icon="Edit"
                    @click="handleEditPlan(plan)"
                  />
                  <el-button
                    type="text"
                    size="small"
                    :icon="Delete"
                    @click="handleDeletePlan(plan)"
                  />
                </div>
              </div>
              <p class="plan-content">{{ plan.content }}</p>
              <div class="plan-footer">
                <el-tag
                  :type="plan.status === 'completed' ? 'success' : plan.status === 'in_progress' ? 'warning' : 'info'"
                  size="small"
                >
                  {{ getPlanStatusText(plan.status) }}
                </el-tag>
                <span class="plan-time">{{ formatDate(plan.createdAt) }}</span>
              </div>
            </div>
            <el-empty v-if="weeklyPlans.length === 0" :description="$t('workspace.weeklyWork.noPlan')" />
          </div>
        </div>

        <div class="week-summary-section">
          <h3 class="section-title">
            <el-icon><Document /></el-icon>
            {{ $t('workspace.weeklyWork.weekSummary') }}
          </h3>
          <div class="summary-list">
            <div
              v-for="summary in weeklySummaries"
              :key="summary.id"
              class="summary-item"
            >
              <div class="summary-header">
                <h4 class="summary-title">{{ summary.title }}</h4>
                <div class="summary-actions">
                  <el-button
                    type="text"
                    size="small"
                    :icon="Edit"
                    @click="handleEditSummary(summary)"
                  />
                  <el-button
                    type="text"
                    size="small"
                    :icon="Delete"
                    @click="handleDeleteSummary(summary)"
                  />
                </div>
              </div>
              <p class="summary-content">{{ summary.content }}</p>
              <div class="summary-footer">
                <span class="summary-time">{{ formatDate(summary.createdAt) }}</span>
              </div>
            </div>
            <el-empty v-if="weeklySummaries.length === 0" :description="$t('workspace.weeklyWork.noSummary')" />
          </div>
        </div>
      </div>
    </el-card>

    <!-- 添加周计划对话框 -->
    <el-dialog
      v-model="showPlanDialog"
      :title="editingPlan ? $t('workspace.weeklyWork.editPlan') : $t('workspace.weeklyWork.addPlan')"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="planFormRef"
        :model="planForm"
        :rules="planRules"
        label-width="100px"
      >
        <el-form-item :label="$t('workspace.weeklyWork.planTitle')" prop="title">
          <el-input
            v-model="planForm.title"
            :placeholder="$t('workspace.weeklyWork.titlePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.weeklyWork.planContent')" prop="content">
          <el-input
            v-model="planForm.content"
            type="textarea"
            :rows="6"
            :placeholder="$t('workspace.weeklyWork.contentPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.weeklyWork.status')" prop="status">
          <el-select
            v-model="planForm.status"
            :placeholder="$t('workspace.weeklyWork.selectStatus')"
            style="width: 100%"
          >
            <el-option
              :label="$t('workspace.weeklyWork.statuses.notStarted')"
              value="not_started"
            />
            <el-option
              :label="$t('workspace.weeklyWork.statuses.inProgress')"
              value="in_progress"
            />
            <el-option
              :label="$t('workspace.weeklyWork.statuses.completed')"
              value="completed"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancelPlan">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSavePlan" :loading="saving">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加周总结对话框 -->
    <el-dialog
      v-model="showSummaryDialog"
      :title="editingSummary ? $t('workspace.weeklyWork.editSummary') : $t('workspace.weeklyWork.addSummary')"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="summaryFormRef"
        :model="summaryForm"
        :rules="summaryRules"
        label-width="100px"
      >
        <el-form-item :label="$t('workspace.weeklyWork.summaryTitle')" prop="title">
          <el-input
            v-model="summaryForm.title"
            :placeholder="$t('workspace.weeklyWork.titlePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.weeklyWork.summaryContent')" prop="content">
          <el-input
            v-model="summaryForm.content"
            type="textarea"
            :rows="8"
            :placeholder="$t('workspace.weeklyWork.summaryPlaceholder')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancelSummary">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveSummary" :loading="saving">
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
import { DataAnalysis, Plus, Edit, Delete, Calendar, Document, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

interface WeeklyPlan {
  id: number
  week: string
  title: string
  content: string
  status: 'not_started' | 'in_progress' | 'completed'
  createdAt: string
}

interface WeeklySummary {
  id: number
  week: string
  title: string
  content: string
  createdAt: string
}

const { t } = useI18n()

const planFormRef = ref<FormInstance>()
const summaryFormRef = ref<FormInstance>()
const showPlanDialog = ref(false)
const showSummaryDialog = ref(false)
const editingPlan = ref<WeeklyPlan | null>(null)
const editingSummary = ref<WeeklySummary | null>(null)
const saving = ref(false)

// 获取当前周的开始日期（周一）
const getCurrentWeekStart = (): string => {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1))
  const dateStr = monday.toISOString().split('T')[0]
  if (dateStr) {
    return dateStr
  }
  const fallback = today.toISOString().split('T')[0]
  if (fallback) {
    return fallback
  }
  return new Date().toISOString().split('T')[0] || '2025-01-01'
}

const selectedWeek = ref<string>(getCurrentWeekStart())

// 周计划和总结列表（暂时使用模拟数据）
const weeklyPlans = ref<WeeklyPlan[]>([])
const weeklySummaries = ref<WeeklySummary[]>([])

const planForm = ref({
  title: '',
  content: '',
  status: 'not_started' as 'not_started' | 'in_progress' | 'completed',
})

const summaryForm = ref({
  title: '',
  content: '',
})

const planRules: FormRules = {
  title: [{ required: true, message: t('workspace.weeklyWork.titleRequired'), trigger: 'blur' }],
  content: [{ required: true, message: t('workspace.weeklyWork.contentRequired'), trigger: 'blur' }],
}

const summaryRules: FormRules = {
  title: [{ required: true, message: t('workspace.weeklyWork.titleRequired'), trigger: 'blur' }],
  content: [{ required: true, message: t('workspace.weeklyWork.contentRequired'), trigger: 'blur' }],
}

// 加载周工作
const loadWeeklyWork = async () => {
  try {
    // 从 localStorage 加载数据
    const weekKey = selectedWeek.value || getCurrentWeekStart()
    const storageKey = `weeklyWork_${weekKey}`
    const stored = localStorage.getItem(storageKey)
    
    if (stored) {
      const data = JSON.parse(stored)
      weeklyPlans.value = data.plans || []
      weeklySummaries.value = data.summaries || []
    } else {
      weeklyPlans.value = []
      weeklySummaries.value = []
    }
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn('加载周工作失败:', error)
    }
    weeklyPlans.value = []
    weeklySummaries.value = []
  }
}

// 上一周
const previousWeek = () => {
  if (!selectedWeek.value) return
  const date = new Date(selectedWeek.value)
  date.setDate(date.getDate() - 7)
  const newDate = date.toISOString().split('T')[0]
  if (newDate) {
    selectedWeek.value = newDate
    loadWeeklyWork()
  }
}

// 下一周
const nextWeek = () => {
  if (!selectedWeek.value) return
  const date = new Date(selectedWeek.value)
  date.setDate(date.getDate() + 7)
  const newDate = date.toISOString().split('T')[0]
  if (newDate) {
    selectedWeek.value = newDate
    loadWeeklyWork()
  }
}

// 回到本周
const goToCurrentWeek = () => {
  selectedWeek.value = getCurrentWeekStart()
  loadWeeklyWork()
}

// 保存周计划
const handleSavePlan = async () => {
  if (!planFormRef.value) return
  
  try {
    await planFormRef.value.validate()
    saving.value = true

    const weekValue = selectedWeek.value || getCurrentWeekStart()
    const storageKey = `weeklyWork_${weekValue}`
    
    // 加载该周的数据
    let weekData: { plans: WeeklyPlan[]; summaries: WeeklySummary[] } = { plans: [], summaries: [] }
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      weekData = JSON.parse(stored)
    }
    
    if (editingPlan.value) {
      const index = weekData.plans.findIndex(p => p.id === editingPlan.value!.id)
      if (index !== -1) {
        const existingPlan = weekData.plans[index]
        if (existingPlan) {
          weekData.plans[index] = {
            id: editingPlan.value.id,
            week: weekValue,
            title: planForm.value.title,
            content: planForm.value.content,
            status: planForm.value.status,
            createdAt: existingPlan.createdAt,
          }
        }
      }
    } else {
      const newPlan: WeeklyPlan = {
        id: Date.now(),
        week: weekValue,
        title: planForm.value.title,
        content: planForm.value.content,
        status: planForm.value.status,
        createdAt: new Date().toISOString(),
      }
      weekData.plans.push(newPlan)
    }
    
    // 保存到 localStorage
    localStorage.setItem(storageKey, JSON.stringify(weekData))
    
    // 如果编辑的是当前选中周的计划，更新显示
    if (weekValue === selectedWeek.value) {
      weeklyPlans.value = weekData.plans
      weeklySummaries.value = weekData.summaries
    }

    ElMessage.success(t('common.success'))
    handleCancelPlan()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

// 保存周总结
const handleSaveSummary = async () => {
  if (!summaryFormRef.value) return
  
  try {
    await summaryFormRef.value.validate()
    saving.value = true

    const weekValue = selectedWeek.value || getCurrentWeekStart()
    const storageKey = `weeklyWork_${weekValue}`
    
    // 加载该周的数据
    let weekData: { plans: WeeklyPlan[]; summaries: WeeklySummary[] } = { plans: [], summaries: [] }
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      weekData = JSON.parse(stored)
    }
    
    if (editingSummary.value) {
      const index = weekData.summaries.findIndex(s => s.id === editingSummary.value!.id)
      if (index !== -1) {
        const existingSummary = weekData.summaries[index]
        if (existingSummary) {
          weekData.summaries[index] = {
            id: editingSummary.value.id,
            week: weekValue,
            title: summaryForm.value.title,
            content: summaryForm.value.content,
            createdAt: existingSummary.createdAt,
          }
        }
      }
    } else {
      const newSummary: WeeklySummary = {
        id: Date.now(),
        week: weekValue,
        title: summaryForm.value.title,
        content: summaryForm.value.content,
        createdAt: new Date().toISOString(),
      }
      weekData.summaries.push(newSummary)
    }
    
    // 保存到 localStorage
    localStorage.setItem(storageKey, JSON.stringify(weekData))
    
    // 如果编辑的是当前选中周的总结，更新显示
    if (weekValue === selectedWeek.value) {
      weeklyPlans.value = weekData.plans
      weeklySummaries.value = weekData.summaries
    }

    ElMessage.success(t('common.success'))
    handleCancelSummary()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

// 编辑周计划
const handleEditPlan = (plan: WeeklyPlan) => {
  editingPlan.value = plan
  planForm.value = {
    title: plan.title,
    content: plan.content,
    status: plan.status,
  }
  showPlanDialog.value = true
}

// 编辑周总结
const handleEditSummary = (summary: WeeklySummary) => {
  editingSummary.value = summary
  summaryForm.value = {
    title: summary.title,
    content: summary.content,
  }
  showSummaryDialog.value = true
}

// 删除周计划
const handleDeletePlan = async (plan: WeeklyPlan) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.weeklyWork.deletePlanConfirm', { title: plan.title }),
      t('common.warning'),
      { type: 'warning' }
    )
    
    const weekValue = plan.week || selectedWeek.value || getCurrentWeekStart()
    const storageKey = `weeklyWork_${weekValue}`
    
    // 加载该周的数据
    let weekData: { plans: WeeklyPlan[]; summaries: WeeklySummary[] } = { plans: [], summaries: [] }
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      weekData = JSON.parse(stored)
    }
    
    // 删除
    const index = weekData.plans.findIndex(p => p.id === plan.id)
    if (index !== -1) {
      weekData.plans.splice(index, 1)
      localStorage.setItem(storageKey, JSON.stringify(weekData))
    }
    
    // 如果删除的是当前选中周的计划，更新显示
    if (weekValue === selectedWeek.value) {
      weeklyPlans.value = weekData.plans
      weeklySummaries.value = weekData.summaries
    }
    
    ElMessage.success(t('common.success'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

// 删除周总结
const handleDeleteSummary = async (summary: WeeklySummary) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.weeklyWork.deleteSummaryConfirm', { title: summary.title }),
      t('common.warning'),
      { type: 'warning' }
    )
    
    const weekValue = summary.week || selectedWeek.value || getCurrentWeekStart()
    const storageKey = `weeklyWork_${weekValue}`
    
    // 加载该周的数据
    let weekData: { plans: WeeklyPlan[]; summaries: WeeklySummary[] } = { plans: [], summaries: [] }
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      weekData = JSON.parse(stored)
    }
    
    // 删除
    const index = weekData.summaries.findIndex(s => s.id === summary.id)
    if (index !== -1) {
      weekData.summaries.splice(index, 1)
      localStorage.setItem(storageKey, JSON.stringify(weekData))
    }
    
    // 如果删除的是当前选中周的总结，更新显示
    if (weekValue === selectedWeek.value) {
      weeklyPlans.value = weekData.plans
      weeklySummaries.value = weekData.summaries
    }
    
    ElMessage.success(t('common.success'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

// 取消周计划
const handleCancelPlan = () => {
  showPlanDialog.value = false
  editingPlan.value = null
  planFormRef.value?.resetFields()
  planForm.value = {
    title: '',
    content: '',
    status: 'not_started',
  }
}

// 取消周总结
const handleCancelSummary = () => {
  showSummaryDialog.value = false
  editingSummary.value = null
  summaryFormRef.value?.resetFields()
  summaryForm.value = {
    title: '',
    content: '',
  }
}

// 获取计划状态文本
const getPlanStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'not_started': 'notStarted',
    'in_progress': 'inProgress',
    'completed': 'completed',
  }
  const i18nKey = statusMap[status] || status
  return t(`workspace.weeklyWork.statuses.${i18nKey}`)
}

// 格式化日期
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

onMounted(() => {
  loadWeeklyWork()
})
</script>

<style scoped lang="scss">
.weekly-work-module {
  .module-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      color: #1d1d1f;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .week-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f5f5f7;

    :deep(.el-date-editor) {
      width: 200px;

      .el-input__wrapper {
        border-radius: 10px;
        border-color: #e5e5e7;
      }
    }
  }

  .weekly-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }

    .week-plan-section,
    .week-summary-section {
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
        font-weight: 600;
        color: #1d1d1f;
        margin: 0 0 16px 0;
        letter-spacing: -0.01em;

        .el-icon {
          font-size: 20px;
          color: #007aff;
        }
      }

      .plan-list,
      .summary-list {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .plan-item,
        .summary-item {
          padding: 20px;
          background: #ffffff;
          border: 1px solid #e5e5e7;
          border-radius: 16px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transform: translateY(-2px);
          }

          .plan-header,
          .summary-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;

            .plan-title,
            .summary-title {
              font-size: 16px;
              font-weight: 600;
              color: #1d1d1f;
              margin: 0;
              letter-spacing: -0.01em;
            }

            .plan-actions,
            .summary-actions {
              display: flex;
              gap: 4px;
            }
          }

          .plan-content,
          .summary-content {
            font-size: 14px;
            color: #86868b;
            line-height: 1.6;
            margin: 0 0 12px 0;
            word-break: break-word;
          }

          .plan-footer,
          .summary-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 12px;
            border-top: 1px solid #f5f5f7;

            .plan-time,
            .summary-time {
              font-size: 12px;
              color: #86868b;
            }
          }
        }
      }
    }
  }
}
</style>
