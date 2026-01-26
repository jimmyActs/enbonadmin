<template>
  <div class="request-help-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><ChatLineRound /></el-icon>
            <span>{{ $t('workspace.requestHelp.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
            {{ $t('workspace.requestHelp.createRequest') }}
          </el-button>
        </div>
      </template>

      <!-- 标签页：我的需求 / 收到的需求 -->
      <el-tabs v-model="activeTab" class="request-tabs">
        <el-tab-pane :label="$t('workspace.requestHelp.myRequests')" name="my">
          <div class="requests-list">
            <div
              v-for="request in myRequests"
              :key="request.id"
              class="request-item"
            >
              <div class="request-header">
                <h3 class="request-title">{{ request.title }}</h3>
                <el-tag
                  :type="getStatusType(request.status)"
                  size="small"
                >
                  {{ getStatusText(request.status) }}
                </el-tag>
              </div>
              <p class="request-content">{{ request.content }}</p>
              <div class="request-meta">
                <span class="request-target">
                  <el-icon><User /></el-icon>
                  {{ request.targetUserName }}
                </span>
                <span class="request-time">{{ formatDateTime(request.createdAt) }}</span>
              </div>
              <div class="request-actions">
                <el-button
                  v-if="request.status === 'pending' || request.status === 'processing'"
                  type="text"
                  size="small"
                  @click="handleCancelRequest(request)"
                >
                  {{ $t('workspace.requestHelp.cancel') }}
                </el-button>
              </div>
            </div>
            <el-empty v-if="myRequests.length === 0" :description="$t('common.noData')" />
          </div>
        </el-tab-pane>

        <el-tab-pane :label="$t('workspace.requestHelp.receivedRequests')" name="received">
          <div class="requests-list">
            <div
              v-for="request in receivedRequests"
              :key="request.id"
              class="request-item"
            >
              <div class="request-header">
                <h3 class="request-title">{{ request.title }}</h3>
                <el-tag
                  :type="getStatusType(request.status)"
                  size="small"
                >
                  {{ getStatusText(request.status) }}
                </el-tag>
              </div>
              <p class="request-content">{{ request.content }}</p>
              <div class="request-meta">
                <span class="request-source">
                  <el-icon><User /></el-icon>
                  {{ request.creatorName }} · {{ request.department }}
                </span>
                <span class="request-time">{{ formatDateTime(request.createdAt) }}</span>
              </div>
              <div class="request-actions">
                <el-button
                  v-if="request.status === 'pending'"
                  type="primary"
                  size="small"
                  @click="handleAcceptRequest(request)"
                >
                  {{ $t('workspace.requestHelp.accept') }}
                </el-button>
                <el-button
                  v-if="request.status === 'processing'"
                  type="success"
                  size="small"
                  @click="handleCompleteRequest(request)"
                >
                  {{ $t('workspace.requestHelp.complete') }}
                </el-button>
                <el-button
                  v-if="request.status === 'pending'"
                  type="danger"
                  size="small"
                  @click="handleRejectRequest(request)"
                >
                  {{ $t('workspace.requestHelp.reject') }}
                </el-button>
              </div>
            </div>
            <el-empty v-if="receivedRequests.length === 0" :description="$t('common.noData')" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 创建需求对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="$t('workspace.requestHelp.createRequest')"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="requestFormRef"
        :model="requestForm"
        :rules="requestRules"
        label-width="100px"
      >
        <el-form-item :label="$t('workspace.requestHelp.department')" prop="department">
          <el-select
            v-model="requestForm.department"
            :placeholder="$t('workspace.requestHelp.selectDepartment')"
            style="width: 100%"
            @change="handleDepartmentChange"
          >
            <el-option
              v-for="dept in departments"
              :key="dept"
              :label="getDepartmentName(dept)"
              :value="dept"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.requestHelp.targetUser')" prop="targetUserId">
            <el-select
              v-model="requestForm.targetUserId"
              :placeholder="$t('workspace.requestHelp.selectUser')"
              style="width: 100%"
              filterable
              clearable
            >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="user.nickname"
              :value="user.id"
            >
              <span>{{ user.nickname }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ getDepartmentName(user.department || '') }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.requestHelp.requestTitle')" prop="title">
          <el-input
            v-model="requestForm.title"
            :placeholder="$t('workspace.requestHelp.titlePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.requestHelp.requestContent')" prop="content">
          <el-input
            v-model="requestForm.content"
            type="textarea"
            :rows="5"
            :placeholder="$t('workspace.requestHelp.contentPlaceholder')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancel">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ $t('workspace.requestHelp.submit') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ChatLineRound, Plus, User } from '@element-plus/icons-vue'
import { getEmployeesGrouped, type Employee } from '../../api/employees'

interface Request {
  id: number
  title: string
  content: string
  department: string
  targetUserId: number
  targetUserName: string
  creatorName?: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  createdAt: string
}

const { t, locale } = useI18n()

const requestFormRef = ref<FormInstance>()
const showCreateDialog = ref(false)
const submitting = ref(false)
const activeTab = ref('my')

// 部门列表
const departments = ref<string[]>(['planning', 'sales', 'tech', 'finance', 'hr', 'domestic', 'management'])

// 用户列表
const allUsers = ref<Employee[]>([])
const availableUsers = computed(() => {
  if (!requestForm.value.department) {
    return allUsers.value
  }
  return allUsers.value.filter(user => user.department === requestForm.value.department)
})

// 需求列表（暂时使用模拟数据）
const myRequests = ref<Request[]>([
  {
    id: 1,
    title: '请求设计支持',
    content: '需要为新产品设计海报，请设计部门协助',
    department: 'planning',
    targetUserId: 2,
    targetUserName: '设计师A',
    status: 'processing',
    createdAt: new Date().toISOString(),
  },
])

const receivedRequests = ref<Request[]>([
  {
    id: 2,
    title: '需要技术支持',
    content: '系统出现问题，需要技术部门协助排查',
    department: 'sales',
    targetUserId: 1,
    targetUserName: '我',
    creatorName: '销售A',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
])

const requestForm = ref({
  department: '',
  targetUserId: null as number | null,
  title: '',
  content: '',
})

const requestRules: FormRules = {
  department: [{ required: true, message: t('workspace.requestHelp.departmentRequired'), trigger: 'change' }],
  targetUserId: [
    {
      required: true,
      validator: (_rule: any, value: number | null, callback: any) => {
        if (!value) {
          callback(new Error(t('workspace.requestHelp.targetUserRequired')))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
  title: [{ required: true, message: t('workspace.requestHelp.titleRequired'), trigger: 'blur' }],
  content: [{ required: true, message: t('workspace.requestHelp.contentRequired'), trigger: 'blur' }],
}

// 部门名称映射
const departmentNames: Record<string, { zh: string; en: string }> = {
  planning: { zh: '企划部', en: 'Planning' },
  sales: { zh: '销售部', en: 'Sales' },
  tech: { zh: '技术部', en: 'Technology' },
  finance: { zh: '财务部', en: 'Finance' },
  hr: { zh: '人事行政', en: 'HR & Admin' },
  domestic: { zh: '国内区', en: 'Domestic' },
  management: { zh: '总经办', en: 'Management' },
}

const getDepartmentName = (dept: string): string => {
  const deptInfo = departmentNames[dept]
  if (!deptInfo) return dept
  return locale.value === 'en-US' ? deptInfo.en : deptInfo.zh
}

// 加载用户列表（排除系统管理员）
const loadUsers = async () => {
  try {
    const grouped = await getEmployeesGrouped()
    const users: Employee[] = []
    Object.values(grouped).forEach(employees => {
      employees.forEach(emp => {
        // 排除离职员工和系统管理员
        if (emp.employmentStatus !== 'resigned' && emp.role !== 'super_admin') {
          users.push(emp)
        }
      })
    })
    allUsers.value = users
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 部门变化时重置用户选择
const handleDepartmentChange = () => {
  requestForm.value.targetUserId = null
}

// 提交需求
const handleSubmit = async () => {
  if (!requestFormRef.value) return
  
  try {
    await requestFormRef.value.validate()
    submitting.value = true

    if (!requestForm.value.targetUserId) {
      ElMessage.error(t('workspace.requestHelp.targetUserRequired'))
      return
    }
    
    const targetUser = allUsers.value.find(u => u.id === requestForm.value.targetUserId)
    
    // TODO: 调用后端API
    // await createRequest(requestForm.value)

    const newRequest: Request = {
      id: Date.now(),
      title: requestForm.value.title,
      content: requestForm.value.content,
      department: requestForm.value.department,
      targetUserId: requestForm.value.targetUserId,
      targetUserName: targetUser?.nickname || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    myRequests.value.push(newRequest)

    ElMessage.success(t('workspace.requestHelp.submitSuccess'))
    handleCancel()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    submitting.value = false
  }
}

// 接受需求
const handleAcceptRequest = async (request: Request) => {
  try {
    // TODO: 调用后端API
    request.status = 'processing'
    ElMessage.success(t('workspace.requestHelp.acceptSuccess'))
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 完成需求
const handleCompleteRequest = async (request: Request) => {
  try {
    // TODO: 调用后端API
    request.status = 'completed'
    ElMessage.success(t('workspace.requestHelp.completeSuccess'))
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 拒绝需求
const handleRejectRequest = async (request: Request) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.requestHelp.rejectConfirm'),
      t('common.warning'),
      { type: 'warning' }
    )
    // TODO: 调用后端API
    request.status = 'cancelled'
    ElMessage.success(t('workspace.requestHelp.rejectSuccess'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

// 取消需求
const handleCancelRequest = async (request: Request) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.requestHelp.cancelConfirm'),
      t('common.warning'),
      { type: 'warning' }
    )
    // TODO: 调用后端API
    request.status = 'cancelled'
    ElMessage.success(t('workspace.requestHelp.cancelSuccess'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

// 取消
const handleCancel = () => {
  showCreateDialog.value = false
  requestFormRef.value?.resetFields()
  requestForm.value = {
    department: '',
    targetUserId: null,
    title: '',
    content: '',
  }
}

// 获取状态类型
const getStatusType = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'info',
  }
  return map[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string): string => {
  return t(`workspace.requestHelp.statuses.${status}`)
}

// 格式化日期时间
const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped lang="scss">
.request-help-module {
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

  .request-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }

  .requests-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .request-item {
      padding: 20px;
      background: #ffffff;
      border: 1px solid #e5e5e7;
      border-radius: 16px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      .request-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;

        .request-title {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0;
          letter-spacing: -0.01em;
        }
      }

      .request-content {
        font-size: 14px;
        color: #86868b;
        line-height: 1.6;
        margin: 0 0 12px 0;
        word-break: break-word;
      }

      .request-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 13px;

        .request-target,
        .request-source {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #007aff;

          .el-icon {
            font-size: 14px;
          }
        }

        .request-time {
          color: #86868b;
        }
      }

      .request-actions {
        display: flex;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid #f5f5f7;
      }
    }
  }
}
</style>
