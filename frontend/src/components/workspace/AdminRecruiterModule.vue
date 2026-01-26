<template>
  <div class="admin-recruiter-module">
    <!-- 目标统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon today">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">{{ $t('workspace.adminRecruiter.todayTarget') }}</div>
              <div class="stat-value">
                <span class="current">{{ todayProgress }}</span>
                <span class="separator">/</span>
                <span class="target">{{ todayTarget }}</span>
              </div>
              <div class="stat-progress">
                <el-progress 
                  :percentage="todayPercentage" 
                  :color="getProgressColor(todayPercentage)"
                  :show-text="false"
                />
              </div>
            </div>
            <el-button 
              type="text" 
              :icon="Edit" 
              @click="showTargetDialog = true"
              class="edit-btn"
            />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon week">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">{{ $t('workspace.adminRecruiter.weekTarget') }}</div>
              <div class="stat-value">
                <span class="current">{{ weekProgress }}</span>
                <span class="separator">/</span>
                <span class="target">{{ weekTarget }}</span>
              </div>
              <div class="stat-progress">
                <el-progress 
                  :percentage="weekPercentage" 
                  :color="getProgressColor(weekPercentage)"
                  :show-text="false"
                />
              </div>
            </div>
            <el-button 
              type="text" 
              :icon="Edit" 
              @click="showTargetDialog = true"
              class="edit-btn"
            />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon candidates">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">{{ $t('workspace.adminRecruiter.totalCandidates') }}</div>
              <div class="stat-value single">
                <span>{{ candidates.length }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><UserFilled /></el-icon>
            <span>{{ $t('workspace.adminRecruiter.candidateManagement') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleAddCandidate">
            {{ $t('workspace.adminRecruiter.addCandidate') }}
          </el-button>
        </div>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-bar">
        <el-input
          v-model="searchText"
          :placeholder="$t('workspace.adminRecruiter.searchPlaceholder')"
          clearable
          style="width: 300px; margin-right: 12px;"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="sourceFilter"
          :placeholder="$t('workspace.adminRecruiter.filterBySource')"
          clearable
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('workspace.adminRecruiter.all')" value="" />
          <el-option
            v-for="(label, key) in sourceOptions"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-select
          v-model="statusFilter"
          :placeholder="$t('workspace.adminRecruiter.filterByStatus')"
          clearable
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('workspace.adminRecruiter.all')" value="" />
          <el-option
            v-for="(label, key) in statusOptions"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">
          {{ $t('common.reset') }}
        </el-button>
      </div>

      <!-- 候选人列表 -->
      <el-table :data="filteredCandidates" stripe style="width: 100%">
        <el-table-column prop="name" :label="$t('workspace.adminRecruiter.name')" width="120" />
        <el-table-column prop="age" :label="$t('workspace.adminRecruiter.age')" width="80" />
        <el-table-column prop="school" :label="$t('workspace.adminRecruiter.school')" min-width="150" />
        <el-table-column prop="skills" :label="$t('workspace.adminRecruiter.skills')" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="skill in row.skills"
              :key="skill"
              size="small"
              style="margin-right: 4px;"
            >
              {{ skill }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" :label="$t('workspace.adminRecruiter.source')" width="120">
          <template #default="{ row }">
            <el-tag :type="getSourceTagType(row.source)" size="small">
              {{ getSourceLabel(row.source) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('workspace.adminRecruiter.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" :label="$t('workspace.adminRecruiter.createdAt')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEditCandidate(row)">
              {{ $t('common.edit') }}
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteCandidate(row)">
              {{ $t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 目标设置对话框 -->
    <el-dialog
      v-model="showTargetDialog"
      :title="$t('workspace.adminRecruiter.setTarget')"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="targetFormRef"
        :model="targetForm"
        :rules="targetRules"
        label-width="120px"
      >
        <el-form-item :label="$t('workspace.adminRecruiter.todayTarget')" prop="todayTarget">
          <el-input-number
            v-model="targetForm.todayTarget"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('workspace.adminRecruiter.weekTarget')" prop="weekTarget">
          <el-input-number
            v-model="targetForm.weekTarget"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTargetDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveTarget" :loading="saving">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑候选人对话框 -->
    <el-dialog
      v-model="showCandidateDialog"
      :title="editingCandidate ? $t('workspace.adminRecruiter.editCandidate') : $t('workspace.adminRecruiter.addCandidate')"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="candidateFormRef"
        :model="candidateForm"
        :rules="candidateRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('workspace.adminRecruiter.name')" prop="name">
              <el-input
                v-model="candidateForm.name"
                :placeholder="$t('workspace.adminRecruiter.namePlaceholder')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('workspace.adminRecruiter.age')" prop="age">
              <el-input-number
                v-model="candidateForm.age"
                :min="18"
                :max="65"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('workspace.adminRecruiter.school')" prop="school">
          <el-input
            v-model="candidateForm.school"
            :placeholder="$t('workspace.adminRecruiter.schoolPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminRecruiter.skills')" prop="skills">
          <el-select
            v-model="candidateForm.skills"
            multiple
            filterable
            allow-create
            :placeholder="$t('workspace.adminRecruiter.skillsPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="skill in commonSkills"
              :key="skill"
              :label="skill"
              :value="skill"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.adminRecruiter.source')" prop="source">
          <el-select
            v-model="candidateForm.source"
            :placeholder="$t('workspace.adminRecruiter.sourcePlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="(label, key) in sourceOptions"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.adminRecruiter.status')" prop="status">
          <el-select
            v-model="candidateForm.status"
            :placeholder="$t('workspace.adminRecruiter.statusPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="(label, key) in statusOptions"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.adminRecruiter.notes')">
          <el-input
            v-model="candidateForm.notes"
            type="textarea"
            :rows="3"
            :placeholder="$t('workspace.adminRecruiter.notesPlaceholder')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancelCandidate">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveCandidate" :loading="saving">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Calendar, UserFilled, Plus, Search, Refresh, Edit } from '@element-plus/icons-vue'
import { filterByMultipleFields } from '../../utils/search'

interface Candidate {
  id: number
  name: string
  age: number
  school: string
  skills: string[]
  source: 'boss' | 'zhaopin' | '58tongcheng' | 'referral'
  status: 'pending' | 'interviewing' | 'offered' | 'rejected' | 'hired'
  notes?: string
  createdAt: string
}

type CandidateForm = Omit<Candidate, 'id' | 'createdAt'>

const { t } = useI18n()

// 目标数据
const todayTarget = ref(5)
const weekTarget = ref(20)
const todayProgress = ref(0)
const weekProgress = ref(0)

const todayPercentage = computed(() => {
  if (todayTarget.value === 0) return 0
  return Math.min(100, Math.round((todayProgress.value / todayTarget.value) * 100))
})

const weekPercentage = computed(() => {
  if (weekTarget.value === 0) return 0
  return Math.min(100, Math.round((weekProgress.value / weekTarget.value) * 100))
})

// 候选人数据
const candidates = ref<Candidate[]>([])

// 对话框状态
const showTargetDialog = ref(false)
const showCandidateDialog = ref(false)
const editingCandidate = ref<Candidate | null>(null)
const saving = ref(false)

// 表单引用
const targetFormRef = ref<FormInstance>()
const candidateFormRef = ref<FormInstance>()

// 筛选条件
const searchText = ref('')
const sourceFilter = ref('')
const statusFilter = ref('')

// 目标表单
const targetForm = ref({
  todayTarget: 5,
  weekTarget: 20,
})

// 候选人表单
const candidateForm = ref<CandidateForm>({
  name: '',
  age: 25,
  school: '',
  skills: [] as string[],
  source: 'boss' as Candidate['source'],
  status: 'pending' as Candidate['status'],
  notes: '',
})

// 常用技能
const commonSkills = ref([
  'JavaScript', 'Vue', 'React', 'TypeScript', 'Node.js',
  'Java', 'Python', 'C++', 'Go', 'PHP',
  'UI设计', 'UX设计', '产品设计', '平面设计',
  '项目管理', '团队管理', '数据分析', '市场推广',
])

// 来源选项
const sourceOptions = computed<Record<Candidate['source'], string>>(() => ({
  boss: t('workspace.adminRecruiter.sources.boss'),
  zhaopin: t('workspace.adminRecruiter.sources.zhaopin'),
  '58tongcheng': t('workspace.adminRecruiter.sources.58tongcheng'),
  referral: t('workspace.adminRecruiter.sources.referral'),
}))

// 状态选项
const statusOptions = computed<Record<Candidate['status'], string>>(() => ({
  pending: t('workspace.adminRecruiter.statuses.pending'),
  interviewing: t('workspace.adminRecruiter.statuses.interviewing'),
  offered: t('workspace.adminRecruiter.statuses.offered'),
  rejected: t('workspace.adminRecruiter.statuses.rejected'),
  hired: t('workspace.adminRecruiter.statuses.hired'),
}))

const getSourceLabel = (source: Candidate['source']) => sourceOptions.value[source]
const getStatusLabel = (status: Candidate['status']) => statusOptions.value[status]

// 表单验证规则
const targetRules: FormRules = {
  todayTarget: [{ required: true, message: t('workspace.adminRecruiter.todayTargetRequired'), trigger: 'blur' }],
  weekTarget: [{ required: true, message: t('workspace.adminRecruiter.weekTargetRequired'), trigger: 'blur' }],
}

const candidateRules: FormRules = {
  name: [{ required: true, message: t('workspace.adminRecruiter.nameRequired'), trigger: 'blur' }],
  age: [{ required: true, message: t('workspace.adminRecruiter.ageRequired'), trigger: 'blur' }],
  school: [{ required: true, message: t('workspace.adminRecruiter.schoolRequired'), trigger: 'blur' }],
  skills: [{ required: true, message: t('workspace.adminRecruiter.skillsRequired'), trigger: 'change' }],
  source: [{ required: true, message: t('workspace.adminRecruiter.sourceRequired'), trigger: 'change' }],
  status: [{ required: true, message: t('workspace.adminRecruiter.statusRequired'), trigger: 'change' }],
}

// 筛选后的候选人列表（域内搜索，只搜索候选人数据）
const filteredCandidates = computed(() => {
  // 对于数组字段（skills），需要特殊处理
  let result = [...candidates.value]

  // 搜索筛选（包含数组字段的特殊处理）
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.school.toLowerCase().includes(search) ||
      c.skills.some(skill => skill.toLowerCase().includes(search))
    )
  }

  // 使用通用筛选工具处理来源和状态
  const filters: Record<string, any> = {}
  if (sourceFilter.value) {
    filters.source = sourceFilter.value
  }
  if (statusFilter.value) {
    filters.status = statusFilter.value
  }

  if (Object.keys(filters).length > 0) {
    result = filterByMultipleFields(result, filters)
  }

  return result
})

// 获取进度条颜色
const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return '#67c23a'
  if (percentage >= 80) return '#e6a23c'
  if (percentage >= 50) return '#409eff'
  return '#f56c6c'
}

// 获取来源标签类型
const getSourceTagType = (source: string): string => {
  const map: Record<string, string> = {
    boss: 'primary',
    zhaopin: 'success',
    '58tongcheng': 'warning',
    referral: 'info',
  }
  return map[source] || ''
}

// 获取状态标签类型
const getStatusTagType = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'info',
    interviewing: 'warning',
    offered: 'success',
    rejected: 'danger',
    hired: 'success',
  }
  return map[status] || ''
}

// 格式化日期
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 加载目标数据
const loadTargets = () => {
  const saved = localStorage.getItem('recruiter_targets')
  if (saved) {
    const data = JSON.parse(saved)
    todayTarget.value = data.todayTarget || 5
    weekTarget.value = data.weekTarget || 20
    targetForm.value = { ...data }
  }

  // 计算今日和本周进度
  const today = new Date().toISOString().split('T')[0]
  todayProgress.value = candidates.value.filter(c => {
    const candidateDate = new Date(c.createdAt).toISOString().split('T')[0]
    return candidateDate === today
  }).length

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekProgress.value = candidates.value.filter(c => {
    const candidateDate = new Date(c.createdAt)
    return candidateDate >= weekStart
  }).length
}

// 保存目标
const handleSaveTarget = async () => {
  if (!targetFormRef.value) return

  try {
    await targetFormRef.value.validate()
    saving.value = true

    todayTarget.value = targetForm.value.todayTarget
    weekTarget.value = targetForm.value.weekTarget
    localStorage.setItem('recruiter_targets', JSON.stringify(targetForm.value))

    ElMessage.success(t('common.success'))
    showTargetDialog.value = false
    loadTargets()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

// 添加候选人
const handleAddCandidate = () => {
  editingCandidate.value = null
  candidateForm.value = {
    name: '',
    age: 25,
    school: '',
    skills: [],
    source: 'boss',
    status: 'pending',
    notes: '',
  }
  showCandidateDialog.value = true
}

// 编辑候选人
const handleEditCandidate = (candidate: Candidate) => {
  editingCandidate.value = candidate
  candidateForm.value = {
    name: candidate.name,
    age: candidate.age,
    school: candidate.school,
    skills: [...candidate.skills],
    source: candidate.source,
    status: candidate.status,
    notes: candidate.notes || '',
  }
  showCandidateDialog.value = true
}

// 保存候选人
const handleSaveCandidate = async () => {
  if (!candidateFormRef.value) return

  try {
    await candidateFormRef.value.validate()
    saving.value = true

    // TODO: 调用后端API
    if (editingCandidate.value) {
      const index = candidates.value.findIndex(c => c.id === editingCandidate.value!.id)
      if (index !== -1) {
        const current = candidates.value[index]
        if (!current) return
        candidates.value[index] = {
          ...current,
          ...candidateForm.value,
        }
      }
    } else {
      candidates.value.push({
        id: Date.now(),
        ...candidateForm.value,
        createdAt: new Date().toISOString(),
      })
    }

    ElMessage.success(t('common.success'))
    handleCancelCandidate()
    loadTargets()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

// 删除候选人
const handleDeleteCandidate = async (candidate: Candidate) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.adminRecruiter.deleteCandidateConfirm', { name: candidate.name }),
      t('common.warning'),
      { type: 'warning' }
    )

    const index = candidates.value.findIndex(c => c.id === candidate.id)
    if (index !== -1) {
      candidates.value.splice(index, 1)
    }

    ElMessage.success(t('common.success'))
    loadTargets()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

// 取消
const handleCancelCandidate = () => {
  showCandidateDialog.value = false
  editingCandidate.value = null
  candidateFormRef.value?.resetFields()
}

// 筛选处理
const handleSearch = () => {
  // 筛选逻辑已在computed中实现
}

const handleFilter = () => {
  // 筛选逻辑已在computed中实现
}

const resetFilter = () => {
  searchText.value = ''
  sourceFilter.value = ''
  statusFilter.value = ''
}

// 加载候选人数据
const loadCandidates = () => {
  const saved = localStorage.getItem('recruiter_candidates')
  if (saved) {
    candidates.value = JSON.parse(saved)
  }
  loadTargets()
}

// 保存候选人数据
const saveCandidates = () => {
  localStorage.setItem('recruiter_candidates', JSON.stringify(candidates.value))
}

// 监听候选人变化，自动保存
watch(candidates, () => {
  saveCandidates()
  loadTargets()
}, { deep: true })

onMounted(() => {
  loadCandidates()
})
</script>

<style scoped lang="scss">
.admin-recruiter-module {
  .stats-row {
    margin-bottom: 20px;
  }

  .stat-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #fff;

        &.today {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.week {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.candidates {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
      }

      .stat-info {
        flex: 1;

        .stat-label {
          font-size: 14px;
          color: #86868b;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #1d1d1f;
          margin-bottom: 8px;

          .current {
            color: #007aff;
          }

          .separator {
            color: #86868b;
            margin: 0 4px;
          }

          .target {
            color: #86868b;
          }

          &.single {
            color: #007aff;
          }
        }

        .stat-progress {
          margin-top: 8px;
        }
      }

      .edit-btn {
        position: absolute;
        top: 0;
        right: 0;
        color: #86868b;

        &:hover {
          color: #007aff;
        }
      }
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

    :deep(.el-input__wrapper) {
      border-radius: 10px;
      border-color: #e5e5e7;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    :deep(.el-select) {
      .el-input__wrapper {
        border-radius: 10px;
      }
    }

    .el-button {
      border-radius: 10px;
      font-weight: 500;
    }
  }

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
    }
  }
}
</style>
