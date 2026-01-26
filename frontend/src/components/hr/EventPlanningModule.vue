<template>
  <div class="event-planning-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Calendar /></el-icon>
            <span>{{ $t('hr.eventPlanning.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="showEventDialog = true">
            {{ $t('hr.eventPlanning.addEvent') }}
          </el-button>
        </div>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-bar">
        <el-input
          v-model="searchText"
          :placeholder="$t('hr.eventPlanning.searchPlaceholder')"
          clearable
          style="width: 300px; margin-right: 12px;"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="statusFilter"
          :placeholder="$t('hr.eventPlanning.filterByStatus')"
          clearable
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('hr.eventPlanning.all')" value="" />
          <el-option
            v-for="(label, key) in eventStatuses"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">
          {{ $t('common.reset') }}
        </el-button>
      </div>

      <!-- 活动列表 -->
      <div v-if="filteredEvents.length > 0" class="event-list">
        <el-card
          v-for="event in filteredEvents"
          :key="event.id"
          class="event-item"
          shadow="hover"
        >
          <div class="event-header">
            <div class="event-title-wrapper">
              <el-tag :type="getStatusType(event.status)" size="small" class="status-tag">
                {{ getStatusText(event.status) }}
              </el-tag>
              <span class="event-title">{{ event.title }}</span>
            </div>
            <div class="event-actions">
              <el-dropdown trigger="click">
                <span class="el-dropdown-link">
                  <el-icon><MoreFilled /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :icon="Edit" @click="handleEditEvent(event)">
                      {{ $t('common.edit') }}
                    </el-dropdown-item>
                    <el-dropdown-item :icon="Delete" @click="handleDeleteEvent(event)">
                      {{ $t('common.delete') }}
                    </el-dropdown-item>
                    <el-dropdown-item :icon="Document" @click="handlePublishEvent(event)" v-if="event.status !== 'published'">
                      {{ $t('hr.eventPlanning.publish') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="event-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="event-info-item">
                  <el-icon class="info-icon"><User /></el-icon>
                  <span class="info-label">{{ $t('hr.eventPlanning.participants') }}:</span>
                  <span class="info-value">{{ event.participants }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="event-info-item">
                  <el-icon class="info-icon"><Location /></el-icon>
                  <span class="info-label">{{ $t('hr.eventPlanning.location') }}:</span>
                  <span class="info-value">{{ event.location }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="event-info-item">
                  <el-icon class="info-icon"><Calendar /></el-icon>
                  <span class="info-label">{{ $t('hr.eventPlanning.eventDate') }}:</span>
                  <span class="info-value">{{ formatDate(event.eventDate) }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="event-info-item">
                  <el-icon class="info-icon"><Money /></el-icon>
                  <span class="info-label">{{ $t('hr.eventPlanning.budget') }}:</span>
                  <span class="info-value">¥{{ event.budget?.toLocaleString() || '0' }}</span>
                </div>
              </el-col>
            </el-row>

            <div class="event-description">
              <div class="description-label">{{ $t('hr.eventPlanning.content') }}:</div>
              <div class="description-text">{{ event.content }}</div>
            </div>

            <div v-if="event.preparations && event.preparations.length > 0" class="event-preparations">
              <div class="preparations-label">{{ $t('hr.eventPlanning.preparations') }}:</div>
              <ul class="preparations-list">
                <li v-for="(prep, index) in event.preparations" :key="index">{{ prep }}</li>
              </ul>
            </div>

            <div v-if="event.workflow && event.workflow.length > 0" class="event-workflow">
              <div class="workflow-label">{{ $t('hr.eventPlanning.workflow') }}:</div>
              <div class="workflow-steps">
                <div
                  v-for="(step, index) in event.workflow"
                  :key="index"
                  class="workflow-step"
                >
                  <div class="step-number">{{ index + 1 }}</div>
                  <div class="step-content">{{ step }}</div>
                </div>
              </div>
            </div>

            <div v-if="event.staff && event.staff.length > 0" class="event-staff">
              <div class="staff-label">{{ $t('hr.eventPlanning.staff') }}:</div>
              <div class="staff-list">
                <el-tag
                  v-for="(staff, index) in event.staff"
                  :key="index"
                  size="small"
                  class="staff-tag"
                >
                  {{ staff }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </div>
      <el-empty v-else :description="$t('common.noData')" />

      <!-- 添加/编辑活动对话框 -->
      <el-dialog
        v-model="showEventDialog"
        :title="editingEvent ? $t('hr.eventPlanning.editEvent') : $t('hr.eventPlanning.addEvent')"
        width="800px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="eventFormRef"
          :model="eventForm"
          :rules="eventRules"
          label-width="120px"
        >
          <el-form-item :label="$t('hr.eventPlanning.eventTitle')" prop="title">
            <el-input
              v-model="eventForm.title"
              :placeholder="$t('hr.eventPlanning.eventTitlePlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('hr.eventPlanning.content')" prop="content">
            <el-input
              v-model="eventForm.content"
              type="textarea"
              :rows="4"
              :placeholder="$t('hr.eventPlanning.contentPlaceholder')"
            />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('hr.eventPlanning.participants')" prop="participants">
                <el-input-number
                  v-model="eventForm.participants"
                  :min="1"
                  style="width: 100%"
                  :placeholder="$t('hr.eventPlanning.participantsPlaceholder')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('hr.eventPlanning.location')" prop="location">
                <el-input
                  v-model="eventForm.location"
                  :placeholder="$t('hr.eventPlanning.locationPlaceholder')"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('hr.eventPlanning.eventDate')" prop="eventDate">
                <el-date-picker
                  v-model="eventForm.eventDate"
                  type="datetime"
                  :placeholder="$t('hr.eventPlanning.eventDatePlaceholder')"
                  style="width: 100%"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('hr.eventPlanning.budget')" prop="budget">
                <el-input-number
                  v-model="eventForm.budget"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  :placeholder="$t('hr.eventPlanning.budgetPlaceholder')"
                >
                  <template #prefix>¥</template>
                </el-input-number>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('hr.eventPlanning.preparations')">
            <el-input
              v-model="eventForm.preparationsText"
              type="textarea"
              :rows="3"
              :placeholder="$t('hr.eventPlanning.preparationsPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('hr.eventPlanning.workflow')">
            <el-input
              v-model="eventForm.workflowText"
              type="textarea"
              :rows="4"
              :placeholder="$t('hr.eventPlanning.workflowPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('hr.eventPlanning.staff')">
            <el-select
              v-model="eventForm.staff"
              multiple
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
              :placeholder="$t('hr.eventPlanning.staffPlaceholder')"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item :label="$t('hr.eventPlanning.status')" prop="status">
            <el-select
              v-model="eventForm.status"
              :placeholder="$t('hr.eventPlanning.selectStatus')"
              style="width: 100%"
            >
              <el-option
                v-for="(label, key) in eventStatuses"
                :key="key"
                :label="label"
                :value="key"
              />
            </el-select>
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="handleCancelEvent">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleSaveEvent" :loading="saving">
            {{ $t('common.save') }}
          </el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Calendar,
  Plus,
  Search,
  Refresh,
  MoreFilled,
  Edit,
  Delete,
  Document,
  User,
  Location,
  Money,
} from '@element-plus/icons-vue'
import { createAnnouncement, AnnouncementType } from '../../api/announcements'
import { getEmployeesGrouped, type Employee } from '../../api/employees'
import { filterData } from '../../utils/search'

interface Event {
  id: number
  title: string
  content: string
  participants: number
  location: string
  eventDate: string
  budget: number
  preparations: string[]
  workflow: string[]
  staff: string[]
  status: 'draft' | 'approved' | 'published' | 'completed'
  createdAt: string
}

const { t, locale } = useI18n()

const events = ref<Event[]>([])
const searchText = ref('')
const statusFilter = ref('')
const showEventDialog = ref(false)
const editingEvent = ref<Event | null>(null)
const saving = ref(false)
const eventFormRef = ref<FormInstance>()
const allUsers = ref<Employee[]>([])

const eventForm = ref({
  title: '',
  content: '',
  participants: 0,
  location: '',
  eventDate: '',
  budget: 0,
  preparationsText: '',
  workflowText: '',
  staff: [] as string[],
  status: 'draft' as Event['status'],
})

const eventStatuses = computed(() => ({
  draft: t('hr.eventPlanning.statuses.draft'),
  approved: t('hr.eventPlanning.statuses.approved'),
  published: t('hr.eventPlanning.statuses.published'),
  completed: t('hr.eventPlanning.statuses.completed'),
}))

const eventRules: FormRules = {
  title: [{ required: true, message: t('hr.eventPlanning.titleRequired'), trigger: 'blur' }],
  content: [{ required: true, message: t('hr.eventPlanning.contentRequired'), trigger: 'blur' }],
  participants: [{ required: true, message: t('hr.eventPlanning.participantsRequired'), trigger: 'blur' }],
  location: [{ required: true, message: t('hr.eventPlanning.locationRequired'), trigger: 'blur' }],
  eventDate: [{ required: true, message: t('hr.eventPlanning.eventDateRequired'), trigger: 'change' }],
  budget: [{ required: true, message: t('hr.eventPlanning.budgetRequired'), trigger: 'blur' }],
}

// 筛选后的活动列表（域内搜索，只搜索活动策划数据）
const filteredEvents = computed(() => {
  return filterData(
    events.value,
    searchText.value,
    ['title', 'content', 'location'], // 只搜索活动相关字段
    statusFilter.value ? { status: statusFilter.value } : undefined
  )
})

const handleSearch = () => {
  // 筛选逻辑已在computed中实现
}

const handleFilter = () => {
  // 筛选逻辑已在computed中实现
}

const resetFilter = () => {
  searchText.value = ''
  statusFilter.value = ''
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString(locale.value)
}

const getStatusType = (status: string): string => {
  const map: Record<string, string> = {
    draft: 'info',
    approved: 'warning',
    published: 'success',
    completed: 'info',
  }
  return map[status] || 'info'
}

const getStatusText = (status: string): string => {
  return eventStatuses.value[status as keyof typeof eventStatuses.value] || status
}

const handleEditEvent = (event: Event) => {
  editingEvent.value = event
  eventForm.value = {
    title: event.title,
    content: event.content,
    participants: event.participants,
    location: event.location,
    eventDate: event.eventDate,
    budget: event.budget,
    preparationsText: event.preparations.join('\n'),
    workflowText: event.workflow.join('\n'),
    staff: event.staff,
    status: event.status,
  }
  showEventDialog.value = true
}

const handleDeleteEvent = async (event: Event) => {
  try {
    await ElMessageBox.confirm(
      t('hr.eventPlanning.deleteConfirm', { title: event.title }),
      t('common.warning'),
      { type: 'warning' }
    )
    const index = events.value.findIndex(e => e.id === event.id)
    if (index !== -1) {
      events.value.splice(index, 1)
    }
    ElMessage.success(t('common.success'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

const handlePublishEvent = async (event: Event) => {
  try {
    await ElMessageBox.confirm(
      t('hr.eventPlanning.publishConfirm', { title: event.title }),
      t('common.warning'),
      { type: 'info' }
    )

    // 创建公告推送所有人
    await createAnnouncement({
      type: AnnouncementType.EVENT,
      title: event.title,
      content: formatEventContent(event),
      publishTime: new Date().toISOString(),
    })

    event.status = 'published'
    ElMessage.success(t('hr.eventPlanning.publishSuccess'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

const formatEventContent = (event: Event): string => {
  let content = `${event.content}\n\n`
  content += `${t('hr.eventPlanning.participants')}: ${event.participants}\n`
  content += `${t('hr.eventPlanning.location')}: ${event.location}\n`
  content += `${t('hr.eventPlanning.eventDate')}: ${formatDate(event.eventDate)}\n`
  content += `${t('hr.eventPlanning.budget')}: ¥${event.budget.toLocaleString()}\n`
  
  if (event.preparations.length > 0) {
    content += `\n${t('hr.eventPlanning.preparations')}:\n`
    event.preparations.forEach(prep => {
      content += `- ${prep}\n`
    })
  }
  
  if (event.workflow.length > 0) {
    content += `\n${t('hr.eventPlanning.workflow')}:\n`
    event.workflow.forEach((step, index) => {
      content += `${index + 1}. ${step}\n`
    })
  }
  
  if (event.staff.length > 0) {
    content += `\n${t('hr.eventPlanning.staff')}: ${event.staff.join(', ')}\n`
  }
  
  return content
}

const handleSaveEvent = async () => {
  if (!eventFormRef.value) return

  try {
    await eventFormRef.value.validate()
    saving.value = true

    const eventData: Omit<Event, 'id' | 'createdAt'> = {
      title: eventForm.value.title,
      content: eventForm.value.content,
      participants: eventForm.value.participants,
      location: eventForm.value.location,
      eventDate: eventForm.value.eventDate,
      budget: eventForm.value.budget,
      preparations: eventForm.value.preparationsText
        .split('\n')
        .filter(p => p.trim() !== ''),
      workflow: eventForm.value.workflowText
        .split('\n')
        .filter(w => w.trim() !== ''),
      staff: eventForm.value.staff,
      status: eventForm.value.status,
    }

    if (editingEvent.value) {
      const index = events.value.findIndex(e => e.id === editingEvent.value!.id)
      if (index !== -1) {
        const current = events.value[index]
        if (!current) return
        events.value[index] = { ...eventData, id: editingEvent.value.id, createdAt: current.createdAt }
      }
    } else {
      events.value.push({
        ...eventData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      })
    }

    ElMessage.success(t('common.success'))
    handleCancelEvent()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleCancelEvent = () => {
  showEventDialog.value = false
  editingEvent.value = null
  eventFormRef.value?.resetFields()
  eventForm.value = {
    title: '',
    content: '',
    participants: 0,
    location: '',
    eventDate: '',
    budget: 0,
    preparationsText: '',
    workflowText: '',
    staff: [],
    status: 'draft',
  }
}

// 加载用户列表（用于员工选择，排除系统管理员）
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

// 初始化时加载用户列表
loadUsers()
</script>

<style scoped lang="scss">
.event-planning-module {
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

    .event-list {
      display: grid;
      gap: 16px;

      .event-item {
        border-radius: 12px;
        border: 1px solid #f0f0f0;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        :deep(.el-card__body) {
          padding: 20px;
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;

          .event-title-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;

            .status-tag {
              border-radius: 6px;
              font-weight: 500;
            }

            .event-title {
              font-size: 18px;
              font-weight: 600;
              color: #1d1d1f;
              letter-spacing: -0.01em;
            }
          }

          .event-actions {
            .el-dropdown-link {
              cursor: pointer;
              color: #86868b;
              font-size: 18px;
              &:hover {
                color: #007aff;
              }
            }
          }
        }

        .event-content {
          .event-info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;

            .info-icon {
              color: #007aff;
              font-size: 16px;
            }

            .info-label {
              font-size: 14px;
              color: #86868b;
              font-weight: 500;
            }

            .info-value {
              font-size: 14px;
              color: #1d1d1f;
              font-weight: 500;
            }
          }

          .event-description {
            margin: 16px 0;
            padding: 16px;
            background: #f5f5f7;
            border-radius: 12px;

            .description-label {
              font-size: 13px;
              color: #86868b;
              font-weight: 500;
              margin-bottom: 8px;
            }

            .description-text {
              font-size: 14px;
              color: #424242;
              line-height: 1.6;
            }
          }

          .event-preparations {
            margin: 16px 0;

            .preparations-label {
              font-size: 14px;
              color: #1d1d1f;
              font-weight: 600;
              margin-bottom: 8px;
            }

            .preparations-list {
              margin: 0;
              padding-left: 20px;
              color: #424242;
              font-size: 14px;
              line-height: 1.8;

              li {
                margin-bottom: 4px;
              }
            }
          }

          .event-workflow {
            margin: 16px 0;

            .workflow-label {
              font-size: 14px;
              color: #1d1d1f;
              font-weight: 600;
              margin-bottom: 12px;
            }

            .workflow-steps {
              display: flex;
              flex-direction: column;
              gap: 12px;

              .workflow-step {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px;
                background: #f5f5f7;
                border-radius: 10px;

                .step-number {
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: #007aff;
                  color: #ffffff;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  font-weight: 600;
                  flex-shrink: 0;
                }

                .step-content {
                  flex: 1;
                  font-size: 14px;
                  color: #424242;
                  line-height: 1.6;
                }
              }
            }
          }

          .event-staff {
            margin: 16px 0;

            .staff-label {
              font-size: 14px;
              color: #1d1d1f;
              font-weight: 600;
              margin-bottom: 8px;
            }

            .staff-list {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;

              .staff-tag {
                border-radius: 6px;
                background-color: #e8f4ff;
                color: #007aff;
                font-weight: 500;
              }
            }
          }
        }
      }
    }
  }
}
</style>

