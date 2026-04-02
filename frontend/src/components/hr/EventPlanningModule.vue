<template>
  <div class="event-planning-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Calendar /></el-icon>
            <span>{{ $t('hr.eventPlanning.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="showEventDialog = true">
              {{ $t('hr.eventPlanning.newEvent') }}
            </el-button>
            <el-button :icon="Refresh" @click="loadEvents">
              {{ $t('common.refresh') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-item">
          <div class="stat-value primary">{{ stats.total || 0 }}</div>
          <div class="stat-label">{{ $t('hr.eventPlanning.totalEvents') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value success">{{ stats.upcoming || 0 }}</div>
          <div class="stat-label">{{ $t('hr.eventPlanning.upcoming') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value warning">{{ stats.ongoing || 0 }}</div>
          <div class="stat-label">{{ $t('hr.eventPlanning.ongoing') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.completed || 0 }}</div>
          <div class="stat-label">{{ $t('hr.eventPlanning.completed') }}</div>
        </div>
      </div>

      <!-- 筛选区域 -->
      <div class="filter-bar">
        <el-select
          v-model="filters.status"
          :placeholder="$t('hr.eventPlanning.filterByStatus')"
          clearable
          style="width: 140px; margin-right: 12px;"
          @change="loadEvents"
        >
          <el-option :label="$t('hr.eventPlanning.all')" value="" />
          <el-option :label="$t('hr.eventPlanning.statuses.upcoming')" value="upcoming" />
          <el-option :label="$t('hr.eventPlanning.statuses.ongoing')" value="ongoing" />
          <el-option :label="$t('hr.eventPlanning.statuses.completed')" value="completed" />
          <el-option :label="$t('hr.eventPlanning.statuses.cancelled')" value="cancelled" />
        </el-select>
        <el-select
          v-model="filters.type"
          :placeholder="$t('hr.eventPlanning.filterByType')"
          clearable
          style="width: 140px; margin-right: 12px;"
          @change="loadEvents"
        >
          <el-option :label="$t('hr.eventPlanning.all')" value="" />
          <el-option :label="$t('hr.eventPlanning.types.team_building')" value="team_building" />
          <el-option :label="$t('hr.eventPlanning.types.meeting')" value="meeting" />
          <el-option :label="$t('hr.eventPlanning.types.training')" value="training" />
          <el-option :label="$t('hr.eventPlanning.types.celebration')" value="celebration" />
          <el-option :label="$t('hr.eventPlanning.types.other')" value="other" />
        </el-select>
        <el-input
          v-model="filters.keyword"
          :placeholder="$t('hr.eventPlanning.searchPlaceholder')"
          clearable
          style="width: 200px; margin-right: 12px;"
          @input="loadEvents"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 事件列表 -->
      <el-table :data="events" stripe v-loading="loading">
        <el-table-column prop="eventName" :label="$t('hr.eventPlanning.eventName')" min-width="150">
          <template #default="{ row }">
            <div class="event-name-cell">
              <span class="event-name">{{ row.eventName }}</span>
              <el-tag size="small" :type="getTypeTagType(row.type)">
                {{ getTypeText(row.type) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="eventDate" :label="$t('hr.eventPlanning.eventDate')" width="120">
          <template #default="{ row }">
            {{ formatDate(row.eventDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="location" :label="$t('hr.eventPlanning.location')" width="150" />
        <el-table-column prop="organizerName" :label="$t('hr.eventPlanning.organizer')" width="100" />
        <el-table-column prop="participantCount" :label="$t('hr.eventPlanning.participants')" width="100" align="center" />
        <el-table-column prop="budget" :label="$t('hr.eventPlanning.budget')" width="120">
          <template #default="{ row }">
            {{ row.budget ? '¥' + Number(row.budget).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('hr.eventPlanning.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)" />
            <el-button
              v-if="row.status === 'upcoming'"
              type="success"
              size="small"
              @click="handleUpdateStatus(row, 'ongoing')"
            >
              {{ $t('hr.eventPlanning.start') }}
            </el-button>
            <el-button
              v-if="row.status === 'ongoing'"
              type="warning"
              size="small"
              @click="handleUpdateStatus(row, 'completed')"
            >
              {{ $t('hr.eventPlanning.complete') }}
            </el-button>
            <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)" />
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadEvents"
          @current-change="loadEvents"
        />
      </div>
    </el-card>

    <!-- 新增/编辑事件对话框 -->
    <el-dialog
      v-model="showEventDialog"
      :title="editingEvent ? $t('hr.eventPlanning.editEvent') : $t('hr.eventPlanning.newEvent')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="600px"
    >
      <el-form ref="eventFormRef" :model="eventForm" label-width="130px">
        <el-form-item :label="$t('hr.eventPlanning.eventName')" prop="eventName">
          <el-input v-model="eventForm.eventName" />
        </el-form-item>
        <el-form-item :label="$t('hr.eventPlanning.eventType')" prop="type">
          <el-select v-model="eventForm.type" style="width: 100%;">
            <el-option :label="$t('hr.eventPlanning.types.team_building')" value="team_building" />
            <el-option :label="$t('hr.eventPlanning.types.meeting')" value="meeting" />
            <el-option :label="$t('hr.eventPlanning.types.training')" value="training" />
            <el-option :label="$t('hr.eventPlanning.types.celebration')" value="celebration" />
            <el-option :label="$t('hr.eventPlanning.types.other')" value="other" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.eventPlanning.eventDate')" prop="eventDate">
              <el-date-picker
                v-model="eventForm.eventDate"
                type="date"
                style="width: 100%;"
                :placeholder="$t('hr.eventPlanning.selectDate')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.eventPlanning.participants')">
              <el-input-number v-model="eventForm.participantCount" :min="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('hr.eventPlanning.location')" prop="location">
          <el-input v-model="eventForm.location" />
        </el-form-item>
        <el-form-item :label="$t('hr.eventPlanning.budget')">
          <el-input-number v-model="eventForm.budget" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('hr.eventPlanning.description')">
          <el-input v-model="eventForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('hr.eventPlanning.notes')">
          <el-input v-model="eventForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEventDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Calendar, Plus, Edit, Delete, Search, Refresh } from '@element-plus/icons-vue'
import { getHrEvents, createHrEvent, updateHrEvent, updateHrEventStatus, deleteHrEvent } from '../../api/hr'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const showEventDialog = ref(false)
const editingEvent = ref<any>(null)
const eventFormRef = ref<FormInstance>()

// 统计数据
const stats = ref<any>({ total: 0, upcoming: 0, ongoing: 0, completed: 0 })

// 事件列表
const events = ref<any[]>([])

// 筛选
const filters = reactive({
  status: '',
  type: '',
  keyword: '',
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 表单
const eventForm = reactive({
  eventName: '',
  type: 'meeting',
  eventDate: '',
  location: '',
  participantCount: 1,
  budget: 0,
  description: '',
  notes: '',
})

const loadStats = async () => {
  try {
    const res = await getHrEvents({ page: 1, pageSize: 100 })
    const allEvents = res.data || []
    const now = new Date()
    stats.value = {
      total: allEvents.length,
      upcoming: allEvents.filter((e: any) => new Date(e.eventDate) > now && e.status === 'upcoming').length,
      ongoing: allEvents.filter((e: any) => e.status === 'ongoing').length,
      completed: allEvents.filter((e: any) => e.status === 'completed').length,
    }
    pagination.total = res.total || allEvents.length
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const loadEvents = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (filters.status) params.status = filters.status
    if (filters.type) params.type = filters.type
    if (filters.keyword) params.keyword = filters.keyword

    const res = await getHrEvents(params)
    events.value = res.data || []
    pagination.total = res.total || 0
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const handleEdit = (row: any) => {
  editingEvent.value = row
  Object.assign(eventForm, { ...row })
  showEventDialog.value = true
}

const handleSave = async () => {
  if (!eventFormRef.value) return
  try {
    await eventFormRef.value.validate()
    saving.value = true

    const data = { ...eventForm }
    if (editingEvent.value) {
      await updateHrEvent(editingEvent.value.id, data)
    } else {
      await createHrEvent(data)
    }

    ElMessage.success(t('common.success'))
    showEventDialog.value = false
    editingEvent.value = null
    loadEvents()
    loadStats()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error?.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleUpdateStatus = async (row: any, status: string) => {
  try {
    await updateHrEventStatus(row.id, { status })
    ElMessage.success(t('common.success'))
    loadEvents()
    loadStats()
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  }
}

const handleDelete = async (row: any) => {
  try {
    await deleteHrEvent(row.id)
    ElMessage.success(t('common.success'))
    loadEvents()
    loadStats()
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  }
}

const getTypeTagType = (type: string): string => {
  const map: Record<string, string> = {
    team_building: 'success',
    meeting: 'primary',
    training: 'warning',
    celebration: 'danger',
    other: 'info',
  }
  return map[type] || 'info'
}

const getTypeText = (type: string): string => {
  return t(`hr.eventPlanning.types.${type}`) || type
}

const getStatusTagType = (status: string): string => {
  const map: Record<string, string> = {
    upcoming: 'info',
    ongoing: 'primary',
    completed: 'success',
    cancelled: 'danger',
  }
  return map[status] || 'info'
}

const getStatusText = (status: string): string => {
  return t(`hr.eventPlanning.statuses.${status}`) || status
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

onMounted(() => {
  loadStats()
  loadEvents()
})
</script>

<style scoped lang="scss">
.event-planning-module {
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

    .event-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .event-name {
        font-weight: 600;
        color: #1d1d1f;
      }
    }

    .pagination-wrapper {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
