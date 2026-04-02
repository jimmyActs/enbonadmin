<template>
  <div class="recruitment-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><UserFilled /></el-icon>
            <span>{{ $t('hr.recruitment.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="showDemandDialog = true">
              {{ $t('hr.recruitment.newDemand') }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="showCandidateDialog = true">
              {{ $t('hr.recruitment.addCandidate') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-item">
          <div class="stat-value primary">{{ stats.total || 0 }}</div>
          <div class="stat-label">{{ $t('hr.recruitment.totalCandidates') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value warning">{{ stats.interviewing || 0 }}</div>
          <div class="stat-label">{{ $t('hr.recruitment.interviewing') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value success">{{ stats.hired || 0 }}</div>
          <div class="stat-label">{{ $t('hr.recruitment.hired') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value danger">{{ stats.rejected || 0 }}</div>
          <div class="stat-label">{{ $t('hr.recruitment.rejected') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.recruitment?.funnel?.hireRate || 0 }}%</div>
          <div class="stat-label">{{ $t('hr.recruitment.hireRate') }}</div>
        </div>
      </div>

      <!-- Tab切换 -->
      <el-tabs v-model="activeTab">
        <!-- 招聘需求 -->
        <el-tab-pane :label="$t('hr.recruitment.demands')" name="demands">
          <el-table :data="demands" stripe v-loading="loading" size="small">
            <el-table-column prop="department" :label="$t('hr.recruitment.department')" width="120" />
            <el-table-column prop="position" :label="$t('hr.recruitment.position')" width="150" />
            <el-table-column prop="headcount" :label="$t('hr.recruitment.headcount')" width="100" />
            <el-table-column prop="filledCount" :label="$t('hr.recruitment.filledCount')" width="100" />
            <el-table-column prop="requesterName" :label="$t('hr.recruitment.requester')" width="100" />
            <el-table-column prop="status" :label="$t('hr.recruitment.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="getDemandStatusType(row.status)" size="small">
                  {{ getDemandStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operations')" width="150">
              <template #default="{ row }">
                <el-button v-if="row.status === 'pending'" type="success" size="small" @click="handleApprove(row)">
                  {{ $t('hr.recruitment.approve') }}
                </el-button>
                <el-button v-if="row.status === 'pending'" type="danger" size="small" @click="handleRejectDemand(row)">
                  {{ $t('hr.recruitment.reject') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 候选人池 -->
        <el-tab-pane :label="$t('hr.recruitment.candidates')" name="candidates">
          <!-- 筛选区域 -->
          <div class="filter-bar">
            <el-select
              v-model="candidateFilters.status"
              :placeholder="$t('hr.recruitment.filterByStatus')"
              clearable
              style="width: 140px; margin-right: 12px;"
              @change="loadCandidates"
            >
              <el-option :label="$t('hr.recruitment.all')" value="" />
              <el-option :label="$t('hr.recruitment.statuses.pending')" value="pending" />
              <el-option :label="$t('hr.recruitment.statuses.interviewing')" value="interviewing" />
              <el-option :label="$t('hr.recruitment.statuses.offered')" value="offered" />
              <el-option :label="$t('hr.recruitment.statuses.hired')" value="hired" />
              <el-option :label="$t('hr.recruitment.statuses.rejected')" value="rejected" />
            </el-select>
            <el-select
              v-model="candidateFilters.source"
              :placeholder="$t('hr.recruitment.filterBySource')"
              clearable
              style="width: 140px; margin-right: 12px;"
              @change="loadCandidates"
            >
              <el-option :label="$t('hr.recruitment.all')" value="" />
              <el-option :label="$t('hr.recruitment.channels.boss')" value="boss" />
              <el-option :label="$t('hr.recruitment.channels.zhilian')" value="zhilian" />
              <el-option :label="$t('hr.recruitment.channels.liepin')" value="liepin" />
              <el-option :label="$t('hr.recruitment.channels.referral')" value="referral" />
              <el-option :label="$t('hr.recruitment.channels.headhunter')" value="headhunter" />
            </el-select>
            <el-input
              v-model="candidateFilters.keyword"
              :placeholder="$t('hr.recruitment.searchPlaceholder')"
              clearable
              style="width: 200px; margin-right: 12px;"
              @input="loadCandidates"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <el-table :data="candidates" stripe v-loading="loading">
            <el-table-column prop="name" :label="$t('hr.recruitment.name')" width="100" />
            <el-table-column prop="gender" :label="$t('hr.recruitment.gender')" width="80" />
            <el-table-column prop="phone" :label="$t('hr.recruitment.phone')" width="130" />
            <el-table-column prop="email" :label="$t('hr.recruitment.email')" min-width="150" />
            <el-table-column prop="source" :label="$t('hr.recruitment.source')" width="100">
              <template #default="{ row }">
                {{ getSourceText(row.source) }}
              </template>
            </el-table-column>
            <el-table-column prop="expectedSalary" :label="$t('hr.recruitment.expectedSalary')" width="120">
              <template #default="{ row }">
                {{ row.expectedSalary ? '¥' + row.expectedSalary?.toLocaleString() : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" :label="$t('hr.recruitment.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="getCandidateStatusType(row.status)" size="small">
                  {{ getCandidateStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operations')" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" :icon="Edit" @click="handleEditCandidate(row)" />
                <el-button type="success" size="small" @click="handleUpdateStatus(row, 'interviewing')">
                  {{ $t('hr.recruitment.toInterview') }}
                </el-button>
                <el-button type="danger" size="small" :icon="Delete" @click="handleDeleteCandidate(row)" />
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="candidatePagination.page"
              v-model:page-size="candidatePagination.pageSize"
              :total="candidatePagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              @size-change="loadCandidates"
              @current-change="loadCandidates"
            />
          </div>
        </el-tab-pane>

        <!-- 渠道分析 -->
        <el-tab-pane :label="$t('hr.recruitment.channelAnalysis')" name="channels">
          <el-table :data="stats.sourceStats || []" stripe>
            <el-table-column prop="source" :label="$t('hr.recruitment.source')" width="150">
              <template #default="{ row }">
                {{ getSourceText(row.source) }}
              </template>
            </el-table-column>
            <el-table-column prop="total" :label="$t('hr.recruitment.resumeCount')" width="150">
              <template #default="{ row }">
                {{ row.total }}
              </template>
            </el-table-column>
            <el-table-column prop="hired" :label="$t('hr.recruitment.hired')" width="150" />
            <el-table-column prop="hireRate" :label="$t('hr.recruitment.hireRate')" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.hireRate" :color="getProgressColor(row.hireRate)" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增需求对话框 -->
    <el-dialog v-model="showDemandDialog" :title="$t('hr.recruitment.newDemand')" width="600px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <el-form ref="demandFormRef" :model="demandForm" label-width="120px">
        <el-form-item :label="$t('hr.recruitment.department')" prop="department">
          <el-input v-model="demandForm.department" />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.position')" prop="position">
          <el-input v-model="demandForm.position" />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.headcount')" prop="headcount">
          <el-input-number v-model="demandForm.headcount" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.requirements')">
          <el-input v-model="demandForm.requirements" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.reason')">
          <el-input v-model="demandForm.reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.notes')">
          <el-input v-model="demandForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDemandDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveDemand" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增候选人对话框 -->
    <el-dialog v-model="showCandidateDialog" :title="$t('hr.recruitment.addCandidate')" width="700px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <el-form ref="candidateFormRef" :model="candidateForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.name')" prop="name">
              <el-input v-model="candidateForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.gender')">
              <el-select v-model="candidateForm.gender" style="width: 100%;">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.phone')" prop="phone">
              <el-input v-model="candidateForm.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.email')">
              <el-input v-model="candidateForm.email" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.source')" prop="source">
              <el-select v-model="candidateForm.source" style="width: 100%;">
                <el-option :label="$t('hr.recruitment.channels.boss')" value="boss" />
                <el-option :label="$t('hr.recruitment.channels.zhilian')" value="zhilian" />
                <el-option :label="$t('hr.recruitment.channels.liepin')" value="liepin" />
                <el-option :label="$t('hr.recruitment.channels.referral')" value="referral" />
                <el-option :label="$t('hr.recruitment.channels.headhunter')" value="headhunter" />
                <el-option :label="$t('hr.recruitment.channels.website')" value="website" />
                <el-option :label="$t('hr.recruitment.channels.campus')" value="campus" />
                <el-option :label="$t('hr.recruitment.channels.other')" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.expectedSalary')">
              <el-input-number v-model="candidateForm.expectedSalary" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.education')">
              <el-input v-model="candidateForm.education" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.recruitment.experience')">
              <el-input v-model="candidateForm.experience" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('hr.recruitment.currentCompany')">
          <el-input v-model="candidateForm.currentCompany" />
        </el-form-item>
        <el-form-item :label="$t('hr.recruitment.notes')">
          <el-input v-model="candidateForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCandidateDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveCandidate" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { UserFilled, Plus, Edit, Delete, Search } from '@element-plus/icons-vue'
import {
  getRecruitmentDemands, createRecruitmentDemand, approveRecruitmentDemand, rejectRecruitmentDemand,
  getCandidates, createCandidate, updateCandidate, updateCandidateStatus, deleteCandidate,
  getRecruitmentStats,
  type HrRecruitmentDemand, type HrCandidate,
} from '../../api/hr'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const activeTab = ref('demands')

// 统计数据
const stats = ref<any>({
  total: 0, interviewing: 0, hired: 0, rejected: 0, pending: 0,
  sourceStats: [],
  funnel: { resumes: 0, interviews: 0, offers: 0, hires: 0, hireRate: 0 },
})

// 需求列表
const demands = ref<HrRecruitmentDemand[]>([])

// 候选人列表
const candidates = ref<HrCandidate[]>([])
const candidateFilters = reactive({
  status: '',
  source: '',
  keyword: '',
})
const candidatePagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 对话框
const showDemandDialog = ref(false)
const showCandidateDialog = ref(false)
const demandFormRef = ref<FormInstance>()
const candidateFormRef = ref<FormInstance>()

const demandForm = reactive({
  department: '',
  position: '',
  headcount: 1,
  requirements: '',
  reason: '',
  notes: '',
})

const candidateForm = reactive({
  name: '',
  gender: '',
  phone: '',
  email: '',
  source: '' as any,
  expectedSalary: 0,
  education: '',
  major: '',
  experience: '',
  currentCompany: '',
  currentPosition: '',
  notes: '',
})

const editingCandidate = ref<HrCandidate | null>(null)

// 加载统计数据
const loadStats = async () => {
  try {
    stats.value = await getRecruitmentStats()
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

// 加载需求列表
const loadDemands = async () => {
  loading.value = true
  try {
    const res = await getRecruitmentDemands()
    demands.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

// 加载候选人列表
const loadCandidates = async () => {
  loading.value = true
  try {
    const params: any = {
      page: candidatePagination.page,
      pageSize: candidatePagination.pageSize,
    }
    if (candidateFilters.status) params.status = candidateFilters.status
    if (candidateFilters.source) params.source = candidateFilters.source
    if (candidateFilters.keyword) params.keyword = candidateFilters.keyword

    const res = await getCandidates(params)
    candidates.value = res.data
    candidatePagination.total = res.total
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

// 保存需求
const handleSaveDemand = async () => {
  if (!demandFormRef.value) return
  try {
    await demandFormRef.value.validate()
    saving.value = true
    await createRecruitmentDemand(demandForm)
    ElMessage.success(t('common.success'))
    showDemandDialog.value = false
    loadDemands()
    loadStats()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

// 审批需求
const handleApprove = async (row: HrRecruitmentDemand) => {
  try {
    await approveRecruitmentDemand(row.id)
    ElMessage.success(t('common.success'))
    loadDemands()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

const handleRejectDemand = async (row: HrRecruitmentDemand) => {
  try {
    await rejectRecruitmentDemand(row.id)
    ElMessage.success(t('common.success'))
    loadDemands()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 保存候选人
const handleSaveCandidate = async () => {
  if (!candidateFormRef.value) return
  try {
    await candidateFormRef.value.validate()
    saving.value = true

    if (editingCandidate.value) {
      await updateCandidate(editingCandidate.value.id, candidateForm)
    } else {
      await createCandidate(candidateForm)
    }

    ElMessage.success(t('common.success'))
    showCandidateDialog.value = false
    loadCandidates()
    loadStats()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleEditCandidate = (row: HrCandidate) => {
  editingCandidate.value = row
  Object.assign(candidateForm, { ...row })
  showCandidateDialog.value = true
}

const handleUpdateStatus = async (row: HrCandidate, status: any) => {
  try {
    await updateCandidateStatus(row.id, { status })
    ElMessage.success(t('common.success'))
    loadCandidates()
    loadStats()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

const handleDeleteCandidate = async (row: HrCandidate) => {
  try {
    await deleteCandidate(row.id)
    ElMessage.success(t('common.success'))
    loadCandidates()
    loadStats()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 状态显示
const getDemandStatusType = (status: string): string => {
  const map: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger', filled: 'info' }
  return map[status] || 'info'
}

const getDemandStatusText = (status: string): string => {
  return t(`hr.recruitment.demandStatuses.${status}`) || status
}

const getCandidateStatusType = (status: string): string => {
  const map: Record<string, string> = { pending: 'info', interviewing: 'warning', offered: 'primary', hired: 'success', rejected: 'danger', withdrawn: 'info' }
  return map[status] || 'info'
}

const getCandidateStatusText = (status: string): string => {
  return t(`hr.recruitment.statuses.${status}`) || status
}

const getSourceText = (source: string): string => {
  return t(`hr.recruitment.channels.${source}`) || source
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 50) return '#67c23a'
  if (percentage >= 30) return '#e6a23c'
  return '#f56c6c'
}

onMounted(() => {
  loadStats()
  loadDemands()
  loadCandidates()
})
</script>

<style scoped lang="scss">
.recruitment-module {
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

          &.primary { color: #007aff; }
          &.success { color: #67c23a; }
          &.warning { color: #e6a23c; }
          &.danger { color: #f56c6c; }
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
  }
}
</style>
