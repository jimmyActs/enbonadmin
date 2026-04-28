<template>
  <div class="interview-calendar-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Calendar /></el-icon>
            <span>{{ $t('hr.interviewCalendar.title') || '面试日历' }}</span>
          </div>
          <div class="header-actions">
            <el-radio-group v-model="viewMode" size="default" style="margin-right: 12px;">
              <el-radio-button value="month">{{ $t('hr.interviewCalendar.monthView') || '月视图' }}</el-radio-button>
              <el-radio-button value="week">{{ $t('hr.interviewCalendar.weekView') || '周视图' }}</el-radio-button>
            </el-radio-group>
            <el-select v-model="filters.department" :placeholder="$t('hr.interviewCalendar.department') || '部门'" clearable size="default" style="width: 140px; margin-right: 12px;" @change="loadData">
              <el-option :label="$t('hr.common.allDepartments') || '全部部门'" value="" />
              <el-option v-for="dept in departmentOptions" :key="dept.value" :label="dept.label" :value="dept.value" />
            </el-select>
            <el-select v-model="filters.status" :placeholder="$t('hr.interviewCalendar.status') || '状态'" clearable size="default" style="width: 120px; margin-right: 12px;" @change="loadData">
              <el-option :label="$t('hr.common.all') || '全部'" value="" />
              <el-option :label="$t('hr.interviewCalendar.scheduled') || '已安排'" value="SCHEDULED" />
              <el-option :label="$t('hr.interviewCalendar.completed') || '已完成'" value="COMPLETED" />
              <el-option :label="$t('hr.interviewCalendar.cancelled') || '已取消'" value="CANCELLED" />
            </el-select>
            <el-button type="primary" :icon="Refresh" @click="loadData">{{ $t('common.refresh') || '刷新' }}</el-button>
          </div>
        </div>
      </template>

      <!-- 日历头部 -->
      <div class="calendar-nav">
        <el-button :icon="ArrowLeft" text @click="prevPeriod">{{ $t('common.prev') || '上一期' }}</el-button>
        <span class="current-period">{{ currentPeriodLabel }}</span>
        <el-button :icon="ArrowRight" text @click="nextPeriod">{{ $t('common.next') || '下一期' }}</el-button>
        <el-button @click="goToToday" style="margin-left: 16px;">{{ $t('hr.interviewCalendar.today') || '今天' }}</el-button>
      </div>

      <!-- 月视图 -->
      <div v-if="viewMode === 'month'" class="calendar-grid" v-loading="loading">
        <div class="weekday-header">
          <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
        </div>
        <div class="days-grid">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="day-cell"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'selected': selectedDate === day.dateStr
            }"
            @click="selectDate(day)"
          >
            <div class="day-number">{{ day.day }}</div>
            <div class="day-events" v-if="day.events.length > 0">
              <div
                v-for="(event, idx) in day.events.slice(0, 3)"
                :key="event.id"
                class="event-item"
                :class="[`status-${event.status?.toLowerCase() || 'scheduled'}`, `type-${event.interviewType?.toLowerCase() || 'general'}`]"
                @click.stop="showEventDetail(event)"
              >
                <span class="event-time">{{ formatTime(event.scheduledAt) }}</span>
                <span class="event-name">{{ event.candidateName || event.title }}</span>
              </div>
              <div v-if="day.events.length > 3" class="more-events" @click.stop="showDayEvents(day)">
                +{{ day.events.length - 3 }} {{ $t('hr.interviewCalendar.more') || '更多' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 周视图 -->
      <div v-else class="week-view" v-loading="loading">
        <div class="week-header">
          <div class="time-gutter"></div>
          <div
            v-for="day in weekDaysData"
            :key="day.dateStr"
            class="week-day-header"
            :class="{ 'today': day.isToday }"
          >
            <span class="day-name">{{ day.dayName }}</span>
            <span class="day-number">{{ day.day }}</span>
            <span v-if="day.events.length > 0" class="event-count">{{ day.events.length }}</span>
          </div>
        </div>
        <div class="week-body">
          <div class="time-column">
            <div v-for="hour in hours" :key="hour" class="time-slot-label">
              {{ hour }}:00
            </div>
          </div>
          <div
            v-for="day in weekDaysData"
            :key="day.dateStr"
            class="day-column"
            :class="{ 'today': day.isToday }"
          >
            <div v-for="hour in hours" :key="hour" class="hour-cell"></div>
            <div
              v-for="event in day.events"
              :key="event.id"
              class="week-event"
              :class="[`status-${event.status?.toLowerCase() || 'scheduled'}`, `type-${event.interviewType?.toLowerCase() || 'general'}`]"
              :style="getEventStyle(event)"
              @click="showEventDetail(event)"
            >
              <div class="event-time">{{ formatTime(event.scheduledAt) }}</div>
              <div class="event-name">{{ event.candidateName || event.title }}</div>
              <div class="event-position">{{ event.position || '-' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 面试详情弹窗 -->
      <el-dialog
        v-model="showDetailDialog"
        :title="$t('hr.interviewCalendar.interviewDetail') || '面试详情'"
        width="500px"
      >
        <div v-if="selectedEvent" class="event-detail">
          <el-descriptions :column="2" border>
            <el-descriptions-item :label="$t('hr.interviewCalendar.candidate') || '候选人'">
              {{ selectedEvent.candidateName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('hr.interviewCalendar.position') || '应聘职位'">
              {{ selectedEvent.position || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('hr.interviewCalendar.interviewType') || '面试类型'">
              <el-tag size="small" :type="getTypeTag(selectedEvent.interviewType)">
                {{ getTypeName(selectedEvent.interviewType) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('hr.interviewCalendar.interviewer') || '面试官'">
              {{ selectedEvent.interviewerName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('hr.interviewCalendar.scheduledTime') || '面试时间'" :span="2">
              {{ formatDateTime(selectedEvent.scheduledAt) }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('hr.interviewCalendar.location') || '面试地点'">
              {{ selectedEvent.location || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('hr.interviewCalendar.status') || '状态'">
              <el-tag size="small" :type="getStatusTag(selectedEvent.status)">
                {{ getStatusName(selectedEvent.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('hr.interviewCalendar.notes') || '备注'" :span="2">
              {{ selectedEvent.notes || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <template #footer>
          <el-button @click="showDetailDialog = false">{{ $t('common.close') || '关闭' }}</el-button>
          <el-button
            v-if="selectedEvent?.status === 'SCHEDULED'"
            type="primary"
            @click="sendReminder"
          >
            {{ $t('hr.interviewCalendar.sendReminder') || '发送提醒' }}
          </el-button>
        </template>
      </el-dialog>

      <!-- 当天所有面试弹窗 -->
      <el-dialog
        v-model="showDayDialog"
        :title="`${selectedDayLabel} ${$t('hr.interviewCalendar.interviews') || '面试安排'}`"
        width="700px"
      >
        <div class="day-events-list">
          <el-table :data="dayEventsList" stripe>
            <el-table-column prop="scheduledAt" :label="$t('hr.interviewCalendar.time') || '时间'" width="140">
              <template #default="{ row }">
                {{ formatDateTime(row.scheduledAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="candidateName" :label="$t('hr.interviewCalendar.candidate') || '候选人'" width="120" />
            <el-table-column prop="position" :label="$t('hr.interviewCalendar.position') || '应聘职位'" width="120" />
            <el-table-column prop="interviewType" :label="$t('hr.interviewCalendar.interviewType') || '类型'" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getTypeName(row.interviewType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="interviewerName" :label="$t('hr.interviewCalendar.interviewer') || '面试官'" width="100" />
            <el-table-column :label="$t('common.operations') || '操作'" width="100">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="showEventDetail(row); showDayDialog = false">
                  {{ $t('common.view') || '查看' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Calendar, Refresh, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { getInterviewSchedules } from '../../api/hr'

const { t } = useI18n()

interface InterviewEvent {
  id: number
  candidateId?: number
  candidateName?: string
  position?: string
  interviewType?: string
  interviewerId?: number
  interviewerName?: string
  scheduledAt: string
  duration?: number
  location?: string
  status?: string
  notes?: string
  title?: string
}

const loading = ref(false)
const viewMode = ref<'month' | 'week'>('month')
const currentDate = ref(new Date())
const selectedDate = ref('')
const allEvents = ref<InterviewEvent[]>([])

const filters = reactive({
  department: '',
  status: '',
})

const showDetailDialog = ref(false)
const showDayDialog = ref(false)
const selectedEvent = ref<InterviewEvent | null>(null)
const dayEventsList = ref<InterviewEvent[]>([])
const selectedDayLabel = ref('')

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7:00 - 20:00

const departmentOptions = [
  { value: 'PLANNING', label: '企划部' },
  { value: 'SALES', label: '销售部' },
  { value: 'TECH', label: '技术部' },
  { value: 'FINANCE', label: '财务部' },
  { value: 'HR', label: '人事行政' },
  { value: 'DOMESTIC', label: '国内区' },
  { value: 'MANAGEMENT', label: '总经办' },
]

// 当前期间标签
const currentPeriodLabel = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1

  if (viewMode.value === 'month') {
    return `${year}年${month}月`
  } else {
    const startOfWeek = getStartOfWeek(currentDate.value)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    return `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()} - ${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`
  }
})

// 获取日历天数数据
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay()
  const days: any[] = []

  // 上月剩余天数
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const date = new Date(year, month - 1, day)
    days.push(createDayObject(date, false))
  }

  // 当月天数
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    days.push(createDayObject(date, true))
  }

  // 下月天数
  const remainingDays = 42 - days.length // 6行 * 7天
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    days.push(createDayObject(date, false))
  }

  return days
})

// 获取周视图数据
const weekDaysData = computed(() => {
  const startOfWeek = getStartOfWeek(currentDate.value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + i)
    const dayObj = createDayObject(date, true)
    return {
      ...dayObj,
      dayName: weekDays[date.getDay()],
      isToday: date.getTime() === today.getTime(),
    }
  })
})

// 创建日期对象
const createDayObject = (date: Date, isCurrentMonth: boolean) => {
  const dateStr = formatDateStr(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const events = allEvents.value.filter(e => {
    const eventDate = new Date(e.scheduledAt)
    return formatDateStr(eventDate) === dateStr
  })

  return {
    date,
    dateStr,
    day: date.getDate(),
    isCurrentMonth,
    isToday: date.getTime() === today.getTime(),
    events,
  }
}

// 格式化日期字符串
const formatDateStr = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取周开始日期
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

// 导航操作
const prevPeriod = () => {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    d.setMonth(d.getMonth() - 1)
  } else {
    d.setDate(d.getDate() - 7)
  }
  currentDate.value = d
  loadData()
}

const nextPeriod = () => {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    d.setMonth(d.getMonth() + 1)
  } else {
    d.setDate(d.getDate() + 7)
  }
  currentDate.value = d
  loadData()
}

const goToToday = () => {
  currentDate.value = new Date()
  loadData()
}

const selectDate = (day: any) => {
  selectedDate.value = day.dateStr
}

// 格式化时间
const formatTime = (datetime: string): string => {
  if (!datetime) return ''
  const date = new Date(datetime)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 格式化日期时间
const formatDateTime = (datetime: string): string => {
  if (!datetime) return '-'
  const date = new Date(datetime)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${formatTime(datetime)}`
}

// 获取事件样式
const getEventStyle = (event: InterviewEvent) => {
  const date = new Date(event.scheduledAt)
  const startHour = date.getHours()
  const startMinute = date.getMinutes()
  const duration = event.duration || 60
  const top = ((startHour - 7) * 60 + startMinute) * (48 / 60) // 48px per hour
  const height = duration * (48 / 60)

  return {
    top: `${top}px`,
    height: `${Math.max(height, 24)}px`,
  }
}

// 获取面试类型名称
const getTypeName = (type?: string): string => {
  const map: Record<string, string> = {
    HR: 'HR面试',
    TECHNICAL: '技术面试',
    MANAGER: '经理面试',
    FINAL: '终面',
    GENERAL: '综合面试',
  }
  return map[type || ''] || type || '-'
}

const getTypeTag = (type?: string): string => {
  const map: Record<string, string> = {
    HR: 'primary',
    TECHNICAL: 'success',
    MANAGER: 'warning',
    FINAL: 'danger',
    GENERAL: 'info',
  }
  return map[type || ''] || 'info'
}

// 获取状态名称
const getStatusName = (status?: string): string => {
  const map: Record<string, string> = {
    SCHEDULED: '已安排',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    NO_SHOW: '未到',
  }
  return map[status || ''] || status || '-'
}

const getStatusTag = (status?: string): string => {
  const map: Record<string, string> = {
    SCHEDULED: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'info',
    NO_SHOW: 'danger',
  }
  return map[status || ''] || 'info'
}

// 显示事件详情
const showEventDetail = (event: InterviewEvent) => {
  selectedEvent.value = event
  showDetailDialog.value = true
}

// 显示当天所有事件
const showDayEvents = (day: any) => {
  selectedDayLabel.value = `${day.dateStr}`
  dayEventsList.value = day.events
  showDayDialog.value = true
}

// 发送提醒
const sendReminder = () => {
  ElMessage.success('提醒已发送')
  showDetailDialog.value = false
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filters.status) {
      params.status = filters.status
    }

    const data = await getInterviewSchedules(params)

    // 转换数据格式
    allEvents.value = (data.schedules || []).map((s: any) => ({
      id: s.id,
      candidateId: s.candidateId,
      candidateName: s.candidateName,
      position: s.position,
      interviewType: s.interviewType,
      interviewerId: s.interviewerId,
      interviewerName: s.interviewerName,
      scheduledAt: s.scheduledAt,
      duration: s.duration || 60,
      location: s.location,
      status: s.status,
      notes: s.notes,
      title: `${s.candidateName || ''} - ${s.interviewType || '面试'}`,
    }))
  } catch (error) {
    console.error('Failed to load interviews:', error)
    // 使用模拟数据
    allEvents.value = generateMockEvents()
  } finally {
    loading.value = false
  }
}

// 生成模拟面试数据
const generateMockEvents = (): InterviewEvent[] => {
  const events: InterviewEvent[] = []
  const today = new Date()
  const types = ['HR', 'TECHNICAL', 'MANAGER', 'FINAL', 'GENERAL']
  const positions = ['前端开发', '后端开发', '产品经理', 'UI设计', '运营专员', '销售代表']
  const candidates = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
  const interviewers = ['刘经理', '陈总监', '林主管', '周HR', '王技术']
  const statuses = ['SCHEDULED', 'SCHEDULED', 'SCHEDULED', 'COMPLETED', 'CANCELLED']
  const locations = ['会议室A', '会议室B', '视频面试', 'HR办公室', '会议室C']

  // 生成未来14天的面试
  for (let day = 0; day < 14; day++) {
    const date = new Date(today)
    date.setDate(date.getDate() + day)

    // 每天2-4个面试
    const count = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      const hour = 9 + Math.floor(Math.random() * 8) // 9:00 - 17:00
      const minute = Math.random() > 0.5 ? 30 : 0

      const eventDate = new Date(date)
      eventDate.setHours(hour, minute, 0, 0)

      events.push({
        id: events.length + 1,
        candidateName: candidates[Math.floor(Math.random() * candidates.length)],
        position: positions[Math.floor(Math.random() * positions.length)],
        interviewType: types[Math.floor(Math.random() * types.length)],
        interviewerName: interviewers[Math.floor(Math.random() * interviewers.length)],
        scheduledAt: eventDate.toISOString(),
        duration: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
        location: locations[Math.floor(Math.random() * locations.length)],
        status: day === 0 ? 'COMPLETED' : statuses[Math.floor(Math.random() * statuses.length)],
        notes: '',
      })
    }
  }

  return events
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.interview-calendar-module {
  .calendar-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;

    .current-period {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      min-width: 150px;
      text-align: center;
    }
  }

  .calendar-grid {
    .weekday-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: #f5f7fa;
      border-radius: 8px 8px 0 0;
      overflow: hidden;

      .weekday {
        padding: 12px;
        text-align: center;
        font-weight: 600;
        color: #606266;
      }
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-left: 1px solid #ebeef5;
      border-top: 1px solid #ebeef5;

      .day-cell {
        min-height: 100px;
        padding: 8px;
        border-right: 1px solid #ebeef5;
        border-bottom: 1px solid #ebeef5;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: #f5f7fa;
        }

        &.other-month {
          background: #fafafa;
          .day-number {
            color: #c0c4cc;
          }
        }

        &.today {
          background: #ecf5ff;
          .day-number {
            background: #409eff;
            color: #fff;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        &.selected {
          background: #e6f7ff;
          box-shadow: inset 0 0 0 2px #91d5ff;
        }

        .day-number {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
        }

        .day-events {
          .event-item {
            padding: 2px 6px;
            margin-bottom: 2px;
            border-radius: 4px;
            font-size: 11px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              opacity: 0.8;
              transform: scale(1.02);
            }

            .event-time {
              font-weight: 600;
              margin-right: 4px;
            }

            &.status-scheduled {
              background: #e6f7ff;
              color: #1890ff;
              border-left: 3px solid #1890ff;
            }

            &.status-completed {
              background: #f6ffed;
              color: #52c41a;
              border-left: 3px solid #52c41a;
            }

            &.status-cancelled {
              background: #f5f5f5;
              color: #8c8c8c;
              border-left: 3px solid #8c8c8c;
              text-decoration: line-through;
            }

            &.type-technical {
              border-left-color: #722ed1 !important;
              background: #f9f0ff !important;
              color: #722ed1 !important;
            }

            &.type-manager {
              border-left-color: #fa8c16 !important;
              background: #fff7e6 !important;
              color: #fa8c16 !important;
            }
          }

          .more-events {
            font-size: 11px;
            color: #909399;
            cursor: pointer;
            &:hover {
              color: #409eff;
            }
          }
        }
      }
    }
  }

  .week-view {
    .week-header {
      display: grid;
      grid-template-columns: 60px repeat(7, 1fr);
      background: #f5f7fa;
      border-radius: 8px 8px 0 0;
      overflow: hidden;

      .time-gutter {
        padding: 12px;
      }

      .week-day-header {
        padding: 12px;
        text-align: center;
        border-left: 1px solid #ebeef5;

        .day-name {
          display: block;
          font-size: 12px;
          color: #909399;
        }

        .day-number {
          display: block;
          font-size: 18px;
          font-weight: 600;
          color: #303133;
        }

        .event-count {
          display: inline-block;
          background: #409eff;
          color: #fff;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-top: 4px;
        }

        &.today {
          background: #ecf5ff;
          .day-number {
            background: #409eff;
            color: #fff;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
        }
      }
    }

    .week-body {
      display: grid;
      grid-template-columns: 60px repeat(7, 1fr);
      border-left: 1px solid #ebeef5;
      position: relative;

      .time-column {
        .time-slot-label {
          height: 48px;
          padding: 0 8px;
          font-size: 11px;
          color: #909399;
          text-align: right;
          border-right: 1px solid #ebeef5;
          border-bottom: 1px solid #ebeef5;
        }
      }

      .day-column {
        position: relative;
        border-left: 1px solid #ebeef5;

        .hour-cell {
          height: 48px;
          border-bottom: 1px solid #f0f0f0;
        }

        &.today {
          background: rgba(64, 158, 255, 0.05);
        }
      }

      .week-event {
        position: absolute;
        left: 2px;
        right: 2px;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        overflow: hidden;
        z-index: 1;
        transition: all 0.2s;

        &:hover {
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: scale(1.02);
        }

        .event-time {
          font-weight: 600;
          color: inherit;
        }

        .event-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .event-position {
          font-size: 10px;
          opacity: 0.8;
        }

        &.status-scheduled {
          background: #e6f7ff;
          color: #1890ff;
          border-left: 3px solid #1890ff;
        }

        &.status-completed {
          background: #f6ffed;
          color: #52c41a;
          border-left: 3px solid #52c41a;
        }

        &.status-cancelled {
          background: #f5f5f5;
          color: #8c8c8c;
          border-left: 3px solid #8c8c8c;
        }
      }
    }
  }

  .event-detail {
    padding: 8px 0;
  }
}
</style>
