<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$t('workspace.meetingRoom.title')"
    width="900px"
    :close-on-click-modal="false"
    class="meeting-room-dialog"
    @close="handleClose"
  >
    <!-- 会议室状态展示 -->
    <div class="meeting-rooms-status">
      <h3 class="section-title">{{ $t('workspace.meetingRoom.currentStatus') }}</h3>
      <div class="rooms-grid">
        <div
          v-for="room in meetingRooms"
          :key="room.id"
          class="room-card"
          :class="{ 'is-occupied': room.status === 'occupied' }"
        >
          <div class="room-image-wrapper">
            <img 
              :src="getRoomImage(room)" 
              :alt="room.name"
              class="room-image"
              @error="handleImageError"
            />
          </div>
          <div class="room-header">
            <el-icon class="room-icon">
              <VideoCamera v-if="room.type === 'meeting'" />
              <OfficeBuilding v-else />
            </el-icon>
            <div class="room-info">
              <div class="room-name">{{ room.name }}</div>
              <div class="room-type">{{ room.type === 'meeting' ? $t('workspace.meetingRoom.meetingRoom') : $t('workspace.meetingRoom.multiFunctionHall') }}</div>
            </div>
            <el-tag :type="room.status === 'available' ? 'success' : 'danger'" size="large">
              {{ room.status === 'available' ? $t('workspace.meetingRoom.available') : $t('workspace.meetingRoom.occupied') }}
            </el-tag>
          </div>
          
          <div v-if="room.status === 'occupied'" class="room-occupancy">
            <div class="occupancy-info">
              <div class="occupancy-item">
                <span class="label">{{ $t('workspace.meetingRoom.department') }}:</span>
                <span class="value">{{ room.currentBooking?.department }}</span>
              </div>
              <div class="occupancy-item">
                <span class="label">{{ $t('workspace.meetingRoom.meetingTitle') }}:</span>
                <span class="value">{{ room.currentBooking?.title }}</span>
              </div>
              <div class="occupancy-item">
                <span class="label">{{ $t('workspace.meetingRoom.startTime') }}:</span>
                <span class="value">{{ formatDateTime(room.currentBooking?.startTime) }}</span>
              </div>
              <div class="occupancy-item">
                <span class="label">{{ $t('workspace.meetingRoom.endTime') }}:</span>
                <span class="value">{{ formatDateTime(room.currentBooking?.endTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 申请记录标签页 -->
    <el-tabs v-model="activeTab" class="booking-tabs">
      <el-tab-pane :label="$t('workspace.meetingRoom.bookRoom')" name="book">
        <!-- 申请会议室表单 -->
        <div class="booking-form">
          <h3 class="section-title">{{ $t('workspace.meetingRoom.bookRoom') }}</h3>
      <el-form
        ref="bookingFormRef"
        :model="bookingForm"
        :rules="bookingRules"
        label-width="120px"
      >
        <el-form-item :label="$t('workspace.meetingRoom.room')" prop="roomId">
          <el-select
            v-model="bookingForm.roomId"
            :placeholder="$t('workspace.meetingRoom.selectRoom')"
            style="width: 100%"
          >
            <el-option
              v-for="room in availableRooms"
              :key="room.id"
              :label="room.name"
              :value="room.id"
            >
              <span>{{ room.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ room.type === 'meeting' ? $t('workspace.meetingRoom.meetingRoom') : $t('workspace.meetingRoom.multiFunctionHall') }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.meetingRoom.department')" prop="department">
          <el-input
            v-model="bookingForm.department"
            :placeholder="$t('workspace.meetingRoom.departmentPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.meetingRoom.meetingTitle')" prop="title">
          <el-input
            v-model="bookingForm.title"
            :placeholder="$t('workspace.meetingRoom.titlePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.meetingRoom.startTime')" prop="startTime">
          <el-date-picker
            v-model="bookingForm.startTime"
            type="datetime"
            :placeholder="$t('workspace.meetingRoom.startTimePlaceholder')"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.meetingRoom.endTime')" prop="endTime">
          <el-date-picker
            v-model="bookingForm.endTime"
            type="datetime"
            :placeholder="$t('workspace.meetingRoom.endTimePlaceholder')"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.meetingRoom.participants')" prop="participants">
          <el-select
            v-model="bookingForm.participants"
            multiple
            filterable
            :placeholder="$t('workspace.meetingRoom.participantsPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="emp in allEmployees"
              :key="emp.id"
              :label="emp.nickname"
              :value="emp.id"
            >
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-avatar :size="24" :src="getAvatarUrl(emp)">
                  {{ emp.nickname.charAt(0) }}
                </el-avatar>
                <span>{{ emp.nickname }}</span>
                <span style="color: #909399; font-size: 12px; margin-left: 8px;">
                  {{ getDepartmentName(emp.department || '') }}
                </span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.meetingRoom.notes')">
          <el-input
            v-model="bookingForm.notes"
            type="textarea"
            :rows="3"
            :placeholder="$t('workspace.meetingRoom.notesPlaceholder')"
          />
        </el-form-item>
      </el-form>
    </div>
      </el-tab-pane>

      <el-tab-pane :label="$t('workspace.meetingRoom.bookingRecords')" name="records">
        <div class="booking-records">
          <h3 class="section-title">{{ $t('workspace.meetingRoom.allBookings') }}</h3>
          <el-table :data="bookingRecords" stripe v-loading="loadingRecords">
            <el-table-column prop="createdAt" :label="$t('workspace.meetingRoom.applicationDate')" width="120">
              <template #default="{ row }">
                {{ formatDate(row.createdAt || row.startTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="roomName" :label="$t('workspace.meetingRoom.room')" width="120" />
            <el-table-column prop="department" :label="$t('workspace.meetingRoom.department')" width="120" />
            <el-table-column prop="applicantName" :label="$t('workspace.meetingRoom.applicant')" width="100">
              <template #default="{ row }">
                {{ row.applicantName || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="title" :label="$t('workspace.meetingRoom.meetingTitle')" min-width="150" />
            <el-table-column prop="startTime" :label="$t('workspace.meetingRoom.startTime')" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.startTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="endTime" :label="$t('workspace.meetingRoom.endTime')" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.endTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" :label="$t('workspace.meetingRoom.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="getBookingStatusType(row.status)">
                  {{ getBookingStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operations')" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.applicantId === userStore.userInfo?.id && row.status === 'approved' && isBookingActive(row)"
                  type="danger"
                  size="small"
                  @click="handleCancelBooking(row)"
                >
                  {{ $t('workspace.meetingRoom.cancel') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loadingRecords && bookingRecords.length === 0" :description="$t('common.noData')" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="handleClose">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting" :disabled="activeTab !== 'book'">
        {{ $t('workspace.meetingRoom.submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { VideoCamera, OfficeBuilding } from '@element-plus/icons-vue'
import { useUserStore } from '../../store/user'
import { getEmployees } from '../../api/employees'
import api, { getApiBaseURL } from '../../api/config'

interface Props {
  modelValue: boolean
}

interface MeetingRoom {
  id: number
  name: string
  type: 'meeting' | 'multifunction'
  status: 'available' | 'occupied'
  currentBooking?: {
    department: string
    title: string
    startTime: string
    endTime: string
  }
}

interface BookingRecord {
  id: number
  roomId: number
  roomName: string
  department: string
  title: string
  startTime: string
  endTime: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  notes?: string
  applicantName?: string // 申请人姓名
  applicantId?: number // 申请人ID
  createdAt?: string // 申请时间
  participantIds?: number[] // 参会人员ID列表
  participants?: Array<{ id: number; name: string }> // 参会人员信息
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const userStore = useUserStore()
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const bookingFormRef = ref<FormInstance>()
const submitting = ref(false)
const activeTab = ref('book')
const loadingRecords = ref(false)

// 会议室数据
const meetingRooms = ref<MeetingRoom[]>([
  {
    id: 1,
    name: '会议室',
    type: 'meeting',
    status: 'available',
  },
  {
    id: 2,
    name: '多功能厅',
    type: 'multifunction',
    status: 'available',
  },
])

// 申请记录（所有人的申请）
const bookingRecords = ref<BookingRecord[]>([])

// 所有员工列表（用于选择参会人员）
const allEmployees = ref<Array<{ id: number; nickname: string; department?: string; avatar?: string }>>([])

const bookingForm = ref({
  roomId: '',
  department: '',
  title: '',
  startTime: '',
  endTime: '',
  notes: '',
  participants: [] as number[], // 参会人员ID列表
})

const bookingRules: FormRules = {
  roomId: [{ required: true, message: t('workspace.meetingRoom.selectRoom'), trigger: 'change' }],
  department: [{ required: true, message: t('workspace.meetingRoom.departmentRequired'), trigger: 'blur' }],
  title: [{ required: true, message: t('workspace.meetingRoom.titleRequired'), trigger: 'blur' }],
  startTime: [{ required: true, message: t('workspace.meetingRoom.startTimeRequired'), trigger: 'change' }],
  endTime: [{ required: true, message: t('workspace.meetingRoom.endTimeRequired'), trigger: 'change' }],
  participants: [{ required: true, message: t('workspace.meetingRoom.participantsRequired'), trigger: 'change' }],
}

// 可用会议室列表
const availableRooms = computed(() => {
  return meetingRooms.value.filter(room => room.status === 'available')
})

// 获取会议室图片
const getRoomImage = (room: MeetingRoom): string => {
  if (room.type === 'meeting') {
    return '/enbon-meeting.jpg'
  } else {
    return '/enbon-multifunction.jpg'
  }
}

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 如果图片加载失败，使用占位符或隐藏
  img.style.display = 'none'
}

// 加载会议室数据
const loadMeetingRooms = async () => {
  try {
    // 从 localStorage 加载所有申请记录，计算当前会议室状态
    const allBookings = loadAllBookings()
    const now = new Date()
    
    meetingRooms.value.forEach(room => {
      // 查找该会议室当前是否有进行中的申请
      const activeBooking = allBookings.find(booking => {
        if (booking.roomId !== room.id || booking.status !== 'approved') return false
        const start = new Date(booking.startTime)
        const end = new Date(booking.endTime)
        return now >= start && now <= end
      })
      
      if (activeBooking) {
        room.status = 'occupied'
        room.currentBooking = {
          department: activeBooking.department,
          title: activeBooking.title,
          startTime: activeBooking.startTime,
          endTime: activeBooking.endTime,
        }
      } else {
        room.status = 'available'
        room.currentBooking = undefined
      }
    })
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn('加载会议室状态失败:', error)
    }
  }
}

// 提交申请
const handleSubmit = async () => {
  if (activeTab.value !== 'book') {
    ElMessage.warning(t('workspace.meetingRoom.switchToBookTab'))
    return
  }

  if (!bookingFormRef.value) return
  
  try {
    await bookingFormRef.value.validate()
    submitting.value = true
    
    const selectedRoom = meetingRooms.value.find(r => r.id === Number(bookingForm.value.roomId))
    
    // 获取参会人员信息
    const participants = allEmployees.value
      .filter((emp: any) => bookingForm.value.participants.includes(emp.id))
      .map((emp: any) => ({ id: emp.id, name: emp.nickname }))
    
    // 创建申请记录
    const newBooking: BookingRecord = {
      id: Date.now(),
      roomId: Number(bookingForm.value.roomId),
      roomName: selectedRoom?.name || '',
      department: bookingForm.value.department,
      title: bookingForm.value.title,
      startTime: bookingForm.value.startTime,
      endTime: bookingForm.value.endTime,
      status: 'approved', // 默认自动批准
      notes: bookingForm.value.notes,
      applicantName: userStore.userInfo?.nickname || userStore.userInfo?.username || '',
      applicantId: userStore.userInfo?.id,
      createdAt: new Date().toISOString(),
      participantIds: bookingForm.value.participants,
      participants: participants,
    }
    
    // 更新参会人员的工作状态为"会议中"
    updateParticipantsWorkStatus(bookingForm.value.participants, 'meeting', bookingForm.value.startTime, bookingForm.value.endTime)
    
    // 保存到 localStorage（所有人的申请）
    saveBooking(newBooking)
    
    // 重新加载数据
    loadMeetingRooms()
    loadBookingRecords()
    
    ElMessage.success(t('workspace.meetingRoom.submitSuccess'))
    handleClose()
    activeTab.value = 'records'
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    submitting.value = false
  }
}

// 取消申请
const handleCancelBooking = async (record: BookingRecord) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.meetingRoom.cancelBookingConfirm'),
      t('common.warning'),
      { type: 'warning' }
    )
    
    // 更新申请状态
    record.status = 'cancelled'
    saveBooking(record)
    
    // 重新加载数据
    loadMeetingRooms()
    loadBookingRecords()
    
    ElMessage.success(t('workspace.meetingRoom.cancelSuccess'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

// 判断申请是否进行中
const isBookingActive = (record: BookingRecord): boolean => {
  const now = new Date()
  const start = new Date(record.startTime)
  const end = new Date(record.endTime)
  return now >= start && now <= end
}

// 获取申请状态类型
const getBookingStatusType = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'info',
    cancelled: 'info',
  }
  return map[status] || 'info'
}

// 获取申请状态文本
const getBookingStatusText = (status: string): string => {
  return t(`workspace.meetingRoom.bookingStatuses.${status}`)
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  bookingFormRef.value?.resetFields()
  bookingForm.value = {
    roomId: '',
    department: '',
    title: '',
    startTime: '',
    endTime: '',
    notes: '',
    participants: [],
  }
}

// 获取部门名称
const getDepartmentName = (dept: string): string => {
  const deptMap: Record<string, string> = {
    planning: t('workgroup.departments.planning'),
    sales: t('workgroup.departments.sales'),
    tech: t('workgroup.departments.tech'),
    finance: t('workgroup.departments.finance'),
    hr: t('workgroup.departments.hr'),
    domestic: t('workgroup.departments.domestic'),
    management: t('workgroup.departments.management'),
  }
  return deptMap[dept] || dept
}

// 更新参会人员的工作状态
const updateParticipantsWorkStatus = (participantIds: number[], status: string, startTime: string, endTime: string) => {
  // 将会议信息存储到 localStorage，用于工作群组显示
  const meetingInfo = {
    participantIds,
    status,
    startTime,
    endTime,
    createdAt: new Date().toISOString(),
  }
  
  // 存储到 localStorage，key 为每个参会人员的ID
  participantIds.forEach(id => {
    const key = `meeting_status_${id}`
    localStorage.setItem(key, JSON.stringify(meetingInfo))
  })
  
  // 触发自定义事件，通知工作群组更新
  window.dispatchEvent(new CustomEvent('meeting-status-updated', { detail: meetingInfo }))
}

// 获取头像URL
const getAvatarUrl = (emp: any): string => {
  if (!emp.avatar) return ''
  const baseURL = (api.defaults.baseURL as string | undefined) || getApiBaseURL()
  if (emp.avatar.startsWith('http')) {
    return emp.avatar
  }
  if (emp.avatar.startsWith('/')) {
    if (emp.avatar.startsWith('/api')) {
      const pathWithoutApi = emp.avatar.replace(/^\/api/, '')
      return `${baseURL}${pathWithoutApi}`
    }
    return `${baseURL}${emp.avatar}`
  }
  return `${baseURL}/users/avatar/${emp.avatar}`
}

// 加载所有员工（排除系统管理员）
const loadAllEmployees = async () => {
  try {
    const employees = await getEmployees()
    // 过滤掉系统管理员（super_admin角色）
    allEmployees.value = employees.filter(emp => emp.role !== 'super_admin')
  } catch (error: any) {
    console.error('Failed to load employees:', error)
  }
}

// 格式化日期时间
const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化日期（只显示日期）
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 加载所有申请记录（所有人的申请）
const loadBookingRecords = async () => {
  try {
    loadingRecords.value = true
    bookingRecords.value = loadAllBookings()
    // 按申请时间倒序排列
    bookingRecords.value.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.startTime).getTime()
      const timeB = new Date(b.createdAt || b.startTime).getTime()
      return timeB - timeA
    })
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn('加载申请记录失败:', error)
    }
    bookingRecords.value = []
  } finally {
    loadingRecords.value = false
  }
}

// 从 localStorage 加载所有申请记录
const loadAllBookings = (): BookingRecord[] => {
  try {
    const stored = localStorage.getItem('meetingRoomBookings')
    if (stored) {
      return JSON.parse(stored)
    }
    return []
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn('加载申请记录失败:', error)
    }
    return []
  }
}

// 保存申请记录到 localStorage
const saveBooking = (booking: BookingRecord) => {
  try {
    const allBookings = loadAllBookings()
    // 检查是否已存在（避免重复）
    const existingIndex = allBookings.findIndex(b => b.id === booking.id)
    if (existingIndex !== -1) {
      allBookings[existingIndex] = booking
    } else {
      allBookings.push(booking)
    }
    localStorage.setItem('meetingRoomBookings', JSON.stringify(allBookings))
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn('保存申请记录失败:', error)
    }
  }
}

// 删除申请记录（保留以备将来使用）
// const removeBooking = (bookingId: number) => {
//   try {
//     const allBookings = loadAllBookings()
//     const filtered = allBookings.filter(b => b.id !== bookingId)
//     localStorage.setItem('meetingRoomBookings', JSON.stringify(filtered))
//   } catch (error: any) {
//     if (import.meta.env.DEV) {
//       console.warn('删除申请记录失败:', error)
//     }
//   }
// }

// 监听对话框打开，加载数据
watch(dialogVisible, (visible) => {
  if (visible) {
    loadAllEmployees()
    loadMeetingRooms()
    loadBookingRecords()
    // 设置定时刷新（每30秒刷新一次，实现同步更新）
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }
    refreshTimer = setInterval(() => {
      loadMeetingRooms()
      loadBookingRecords()
    }, 30000) // 30秒刷新一次
  } else {
    // 关闭对话框时清除定时器
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }
})

let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (dialogVisible.value) {
    loadMeetingRooms()
    loadBookingRecords()
  }
})

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped lang="scss">
.meeting-room-dialog {
  :deep(.el-dialog) {
    border-radius: 20px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #1d1d1f;
    margin: 0 0 16px 0;
    letter-spacing: -0.01em;
  }

  .meeting-rooms-status {
    margin-bottom: 24px;

    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;

      .room-card {
        padding: 0;
        background: #ffffff;
        border: 1px solid #e5e5e7;
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.2s ease;

        &.is-occupied {
          border-color: #ffcccc;
        }

        .room-image-wrapper {
          width: 100%;
          height: 200px;
          overflow: hidden;
          background: #f5f5f7;
          position: relative;

          .room-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
        }

        .room-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;

          .room-icon {
            font-size: 32px;
            color: #007aff;
          }

          .room-info {
            flex: 1;

            .room-name {
              font-size: 16px;
              font-weight: 600;
              color: #1d1d1f;
              margin-bottom: 4px;
            }

            .room-type {
              font-size: 13px;
              color: #86868b;
            }
          }
        }

        .room-occupancy {
          padding: 12px 20px;
          border-top: 1px solid #e5e5e7;

          .occupancy-info {
            .occupancy-item {
              display: flex;
              align-items: center;
              margin-bottom: 8px;
              font-size: 13px;

              &:last-child {
                margin-bottom: 0;
              }

              .label {
                color: #86868b;
                margin-right: 8px;
                min-width: 60px;
              }

              .value {
                color: #1d1d1f;
                font-weight: 500;
              }
            }
          }
        }
      }
    }
  }

  .booking-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }

  .booking-form {
    .el-form-item {
      margin-bottom: 20px;
    }

    :deep(.el-input__wrapper) {
      border-radius: 10px;
      border-color: #e5e5e7;
    }

    :deep(.el-select) {
      .el-input__wrapper {
        border-radius: 10px;
      }
    }
  }

  .booking-records {
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1d1d1f;
      margin: 0 0 16px 0;
      letter-spacing: -0.01em;
    }
  }
}
</style>

