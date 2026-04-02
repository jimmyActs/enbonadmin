<template>
  <div class="attendance-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Clock /></el-icon>
            <span>{{ $t('hr.attendance.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button :icon="Upload" @click="handleExport" :loading="exporting">
              {{ $t('hr.attendance.export') || '导出' }}
            </el-button>
            <el-button type="primary" :icon="Upload" @click="showImportDialog = true">
              {{ $t('hr.attendance.import') }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">
              {{ $t('hr.attendance.add') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-item">
          <div class="stat-value success">{{ stats.attendanceRate || 0 }}%</div>
          <div class="stat-label">{{ $t('hr.attendance.attendanceRate') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.present || 0 }}</div>
          <div class="stat-label">{{ $t('hr.attendance.present') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value warning">{{ stats.late || 0 }}</div>
          <div class="stat-label">{{ $t('hr.attendance.late') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value danger">{{ stats.absent || 0 }}</div>
          <div class="stat-label">{{ $t('hr.attendance.absent') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value info">{{ stats.overtime || 0 }}</div>
          <div class="stat-label">{{ $t('hr.attendance.overtime') }}</div>
        </div>
      </div>

      <!-- 筛选区域 -->
      <div class="filter-bar">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="~"
          :start-placeholder="$t('hr.attendance.startDate')"
          :end-placeholder="$t('hr.attendance.endDate')"
          value-format="YYYY-MM-DD"
          style="width: 260px; margin-right: 12px;"
          @change="loadData"
        />
        <el-select
          v-model="filters.status"
          :placeholder="$t('hr.attendance.filterByStatus')"
          clearable
          style="width: 140px; margin-right: 12px;"
          @change="loadData"
        >
          <el-option :label="$t('hr.attendance.all')" value="" />
          <el-option :label="$t('hr.attendance.statuses.present')" value="present" />
          <el-option :label="$t('hr.attendance.statuses.late')" value="late" />
          <el-option :label="$t('hr.attendance.statuses.early_leave')" value="early_leave" />
          <el-option :label="$t('hr.attendance.statuses.absent')" value="absent" />
          <el-option :label="$t('hr.attendance.statuses.overtime')" value="overtime" />
          <el-option :label="$t('hr.attendance.statuses.leave')" value="leave" />
        </el-select>
        <el-input
          v-model="filters.keyword"
          :placeholder="$t('hr.attendance.searchPlaceholder')"
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

      <!-- 考勤列表 -->
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="employeeName" :label="$t('hr.attendance.employeeName')" width="120" />
        <el-table-column prop="department" :label="$t('hr.attendance.department')" width="120" />
        <el-table-column prop="date" :label="$t('hr.attendance.date')" width="120" />
        <el-table-column prop="checkInTime" :label="$t('hr.attendance.checkIn')" width="100" />
        <el-table-column prop="checkOutTime" :label="$t('hr.attendance.checkOut')" width="100" />
        <el-table-column prop="status" :label="$t('hr.attendance.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lateMinutes" :label="$t('hr.attendance.lateMinutes')" width="100" />
        <el-table-column prop="overtimeMinutes" :label="$t('hr.attendance.overtimeMinutes')" width="100" />
        <el-table-column prop="remarks" :label="$t('hr.attendance.remarks')" min-width="150" show-overflow-tooltip />
        <el-table-column :label="$t('common.operations')" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)" />
            <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)" />
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
      :title="editing ? $t('hr.attendance.edit') : $t('hr.attendance.add')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item :label="$t('hr.attendance.employeeName')" prop="employeeName">
          <el-input v-model="form.employeeName" />
        </el-form-item>
        <el-form-item :label="$t('hr.attendance.department')" prop="department">
          <el-input v-model="form.department" />
        </el-form-item>
        <el-form-item :label="$t('hr.attendance.date')" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.attendance.checkIn')">
              <el-time-picker v-model="form.checkInTime" format="HH:mm" value-format="HH:mm:ss" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.attendance.checkOut')">
              <el-time-picker v-model="form.checkOutTime" format="HH:mm" value-format="HH:mm:ss" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('hr.attendance.status')" prop="status">
          <el-select v-model="form.status" style="width: 100%;">
            <el-option :label="$t('hr.attendance.statuses.present')" value="present" />
            <el-option :label="$t('hr.attendance.statuses.late')" value="late" />
            <el-option :label="$t('hr.attendance.statuses.early_leave')" value="early_leave" />
            <el-option :label="$t('hr.attendance.statuses.absent')" value="absent" />
            <el-option :label="$t('hr.attendance.statuses.overtime')" value="overtime" />
            <el-option :label="$t('hr.attendance.statuses.leave')" value="leave" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.attendance.lateMinutes')">
              <el-input-number v-model="form.lateMinutes" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.attendance.overtimeMinutes')">
              <el-input-number v-model="form.overtimeMinutes" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('hr.attendance.remarks')">
          <el-input v-model="form.remarks" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      :title="$t('hr.attendance.import')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="900px"
      :close-on-click-modal="false"
    >
      <!-- 步骤1：上传 -->
      <div v-if="!previewData.length" style="padding: 8px 0 16px;">
        <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
          {{ $t('hr.attendance.importTip') }}
        </el-alert>
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.xls"
          :on-change="handleFileChange"
          drag
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">
            拖拽 Excel 文件到此处，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div style="font-size:12px;color:#999;margin-top:6px;">
              支持 .xlsx / .xls，首行必须包含字段名（姓名/部门/日期/状态等）
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 步骤2：预览 -->
      <div v-else>
        <el-alert type="success" :closable="false" style="margin-bottom: 12px;">
          已解析 <strong>{{ previewData.length }}</strong> 条记录，请确认后导入
        </el-alert>
        <el-table :data="previewData.slice(0, 20)" stripe max-height="320" size="small">
          <el-table-column prop="employeeName" label="姓名" width="120" />
          <el-table-column prop="department" label="部门" width="120" />
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="checkInTime" label="上班打卡" width="100" />
          <el-table-column prop="checkOutTime" label="下班打卡" width="100" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag size="small">{{ row.status || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remarks" label="备注" min-width="150" show-overflow-tooltip />
        </el-table>
        <div v-if="previewData.length > 20" style="text-align:center;color:#999;font-size:12px;margin-top:8px;">
          仅显示前 20 条，共 {{ previewData.length }} 条
        </div>
      </div>

      <template #footer>
        <el-button @click="closeImport">{{ $t('common.cancel') }}</el-button>
        <el-button v-if="previewData.length" type="info" @click="previewData = []">
          重新选择文件
        </el-button>
        <el-button
          type="primary"
          :loading="importing"
          :disabled="!previewData.length"
          @click="handleImport"
        >
          {{ previewData.length ? `确认导入 ${previewData.length} 条` : $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Clock, Plus, Edit, Delete, Search, Refresh, Upload } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import {
  getAttendanceList,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  importAttendance,
  exportAttendance,
  type AttendanceImportResult,
  type HrAttendance,
} from '../../api/hr'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const importing = ref(false)
const exporting = ref(false)
const list = ref<HrAttendance[]>([])
const stats = ref<any>({
  attendanceRate: 0, present: 0, late: 0, absent: 0, overtime: 0,
})
const showDialog = ref(false)
const showImportDialog = ref(false)
const editing = ref<HrAttendance | null>(null)
const formRef = ref<FormInstance>()
const uploadRef = ref()
const importFile = ref<File | null>(null)
const previewData = ref<Record<string, any>[]>([])

const dateRange = ref<string[]>([])
const filters = reactive({
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
  date: '',
  checkInTime: '',
  checkOutTime: '',
  status: 'present' as any,
  lateMinutes: 0,
  earlyLeaveMinutes: 0,
  overtimeMinutes: 0,
  remarks: '',
})

const rules: FormRules = {
  employeeName: [{ required: true, message: t('hr.attendance.employeeNameRequired'), trigger: 'blur' }],
  date: [{ required: true, message: t('hr.attendance.dateRequired'), trigger: 'change' }],
  status: [{ required: true, message: t('hr.attendance.statusRequired'), trigger: 'change' }],
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    if (filters.status) params.status = filters.status
    if (filters.keyword?.trim()) params.keyword = filters.keyword.trim()

    const res = await getAttendanceList(params)
    list.value = res.data
    pagination.total = res.total
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const params: any = {}
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    stats.value = await getAttendanceStats(params)
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const resetFilters = () => {
  dateRange.value = []
  filters.status = ''
  filters.keyword = ''
  pagination.page = 1
  loadData()
  loadStats()
}

const handleAdd = () => {
  editing.value = null
  Object.assign(form, {
    employeeName: '',
    department: '',
    date: '',
    checkInTime: '',
    checkOutTime: '',
    status: 'present',
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    overtimeMinutes: 0,
    remarks: '',
  })
  showDialog.value = true
}

const handleEdit = (row: HrAttendance) => {
  editing.value = row
  Object.assign(form, { ...row })
  showDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saving.value = true

    if (editing.value) {
      await updateAttendance(editing.value.id, { ...form })
    } else {
      await createAttendance(form)
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

const handleDelete = async (row: HrAttendance) => {
  try {
    await ElMessageBox.confirm(t('hr.attendance.deleteConfirm'), t('common.warning'), { type: 'warning' })
    await deleteAttendance(row.id)
    ElMessage.success(t('common.success'))
    loadData()
    loadStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

const handleFileChange = (file: any) => {
  importFile.value = file.raw
  const reader = new FileReader()
  reader.onload = (e: any) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: true })
      const firstSheetName = workbook.SheetNames[0]
      if (!firstSheetName) {
        ElMessage.error('Excel 文件中没有工作表')
        previewData.value = []
        return
      }
      const ws = workbook.Sheets[firstSheetName]
      if (!ws) {
        ElMessage.error('无法读取 Excel 工作表')
        previewData.value = []
        return
      }
      const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
      if (!raw.length) {
        ElMessage.warning('Excel 文件为空或格式不正确')
        previewData.value = []
        return
      }
      const fieldMap: Record<string, string> = {
        '姓名': 'employeeName', '员工姓名': 'employeeName',
        '部门': 'department', '日期': 'date',
        '上班打卡时间': 'checkInTime', '下班打卡时间': 'checkOutTime',
        '打卡时间': 'checkInTime',
        '状态': 'status', '考勤状态': 'status',
        '迟到分钟': 'lateMinutes', '早退分钟': 'earlyLeaveMinutes',
        '加班分钟': 'overtimeMinutes', '备注': 'remarks',
        'employeeName': 'employeeName', 'department': 'department',
        'date': 'date', 'checkInTime': 'checkInTime',
        'checkOutTime': 'checkOutTime', 'status': 'status',
        'lateMinutes': 'lateMinutes', 'earlyLeaveMinutes': 'earlyLeaveMinutes',
        'overtimeMinutes': 'overtimeMinutes', 'remarks': 'remarks',
      }
      previewData.value = raw.map(row => {
        const normalized: Record<string, any> = {}
        for (const [k, v] of Object.entries(row)) {
          const field = fieldMap[k?.toString()?.trim()] ?? k?.toString()?.trim()
          if (field) normalized[field] = v
        }
        if (normalized.date) {
          if (typeof normalized.date === 'number') {
            const d = new Date((normalized.date - 25569) * 86400 * 1000)
            normalized.date = d.toISOString().split('T')[0]
          } else if (typeof normalized.date === 'string' && normalized.date.includes('/')) {
            const parts = normalized.date.split('/')
            normalized.date = `${parts[0]}-${(parts[1] || '').padStart(2, '0')}-${(parts[2] || '').padStart(2, '0')}`
          }
        }
        return normalized
      })
    } catch (err: any) {
      ElMessage.error('文件解析失败：' + (err.message || '格式不支持'))
      previewData.value = []
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

const handleImport = async () => {
  if (!previewData.value.length) return
  importing.value = true
  try {
    const result: AttendanceImportResult = await importAttendance(previewData.value)
    const msgs: string[] = []
    if (result.imported) msgs.push(`新增 ${result.imported} 条`)
    if (result.updated) msgs.push(`更新 ${result.updated} 条`)
    if (result.skipped) msgs.push(`跳过 ${result.skipped} 条`)
    if (msgs.length) ElMessage.success(msgs.join('，') + '，导入完成！')
    else ElMessage.warning('没有需要导入的记录')
    if (result.errors.length) ElMessage.warning(`部分行失败：${result.errors[0]}`)
    closeImport()
    loadData()
    loadStats()
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    importing.value = false
  }
}

const closeImport = () => {
  showImportDialog.value = false
  previewData.value = []
  importFile.value = null
  uploadRef.value?.clearFiles()
}

const handleExport = async () => {
  exporting.value = true
  try {
    const [start, end] = dateRange.value ?? []
    const res = await exportAttendance({ startDate: start, endDate: end })
    const blob = await fetch(`data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.buffer}`).then(r => r.blob())
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = res.filename
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

const getStatusType = (status: string): string => {
  const map: Record<string, string> = {
    present: 'success',
    late: 'warning',
    early_leave: 'warning',
    absent: 'danger',
    overtime: 'info',
    leave: 'info',
  }
  return map[status] || 'info'
}

const getStatusText = (status: string): string => {
  return t(`hr.attendance.statuses.${status}`) || status
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style scoped lang="scss">
.attendance-module {
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
          &.danger { color: #f56c6c; }
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
  }
}
</style>
