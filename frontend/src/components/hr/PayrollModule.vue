<template>
  <div class="payroll-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Money /></el-icon>
            <span>{{ $t('hr.payroll.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" :icon="Setting" @click="showStructureDialog = true">
              {{ $t('hr.payroll.structure') }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">
              {{ $t('hr.payroll.calculate') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-item">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">{{ $t('hr.payroll.totalRecords') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value success">{{ formatMoney(stats.totalNetSalary) }}</div>
          <div class="stat-label">{{ $t('hr.payroll.totalNetSalary') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ formatMoney(stats.totalGrossSalary) }}</div>
          <div class="stat-label">{{ $t('hr.payroll.totalGrossSalary') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value warning">{{ formatMoney(stats.avgNetSalary) }}</div>
          <div class="stat-label">{{ $t('hr.payroll.avgNetSalary') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value danger">{{ formatMoney(stats.totalDeductions) }}</div>
          <div class="stat-label">{{ $t('hr.payroll.totalDeductions') }}</div>
        </div>
      </div>

      <!-- 筛选区域 -->
      <div class="filter-bar">
        <el-date-picker
          v-model="filters.period"
          type="month"
          value-format="YYYY-MM"
          :placeholder="$t('hr.payroll.selectPeriod')"
          style="width: 160px; margin-right: 12px;"
          @change="loadData"
        />
        <el-select
          v-model="filters.status"
          :placeholder="$t('hr.payroll.filterByStatus')"
          clearable
          style="width: 140px; margin-right: 12px;"
          @change="loadData"
        >
          <el-option :label="$t('hr.payroll.all')" value="" />
          <el-option :label="$t('hr.payroll.statuses.draft')" value="draft" />
          <el-option :label="$t('hr.payroll.statuses.paid')" value="paid" />
        </el-select>
        <el-input
          v-model="filters.keyword"
          :placeholder="$t('hr.payroll.searchPlaceholder')"
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

      <!-- 薪资列表 -->
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="employeeName" :label="$t('hr.payroll.employeeName')" width="120" />
        <el-table-column prop="department" :label="$t('hr.payroll.department')" width="120" />
        <el-table-column prop="period" :label="$t('hr.payroll.period')" width="120" />
        <el-table-column prop="baseSalary" :label="$t('hr.payroll.baseSalary')" width="120">
          <template #default="{ row }">
            {{ formatMoney(row.baseSalary) }}
          </template>
        </el-table-column>
        <el-table-column prop="performanceSalary" :label="$t('hr.payroll.performanceSalary')" width="120">
          <template #default="{ row }">
            {{ formatMoney(row.performanceSalary) }}
          </template>
        </el-table-column>
        <el-table-column prop="grossSalary" :label="$t('hr.payroll.grossSalary')" width="120">
          <template #default="{ row }">
            {{ formatMoney(row.grossSalary) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalDeductions" :label="$t('hr.payroll.deductions')" width="100">
          <template #default="{ row }">
            <span class="deduction">-{{ formatMoney(row.totalDeductions) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="netSalary" :label="$t('hr.payroll.netSalary')" width="120">
          <template #default="{ row }">
            <span class="net-salary">{{ formatMoney(row.netSalary) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('hr.payroll.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'paid' ? 'success' : 'info'" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)" />
            <el-button type="info" size="small" :icon="Download" @click="handleDownloadPayslip(row)">
              PDF
            </el-button>
            <el-button v-if="row.status === 'draft'" type="success" size="small" @click="handleConfirm(row)">
              {{ $t('hr.payroll.confirm') }}
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

    <!-- 计算薪资对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="$t('hr.payroll.calculate')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" label-width="140px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.payroll.employeeName')" prop="employeeName">
              <el-input v-model="form.employeeName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.payroll.period')" prop="period">
              <el-date-picker
                v-model="form.period"
                type="month"
                value-format="YYYY-MM"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.payroll.department')">
              <el-input v-model="form.department" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.payroll.position')">
              <el-input v-model="form.position" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">{{ $t('hr.payroll.salaryItems') }}</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="$t('hr.payroll.baseSalary')">
              <el-input-number v-model="form.baseSalary" :min="0" :step="100" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('hr.payroll.performanceSalary')">
              <el-input-number v-model="form.performanceSalary" :min="0" :step="100" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('hr.payroll.overtimePay')">
              <el-input-number v-model="form.overtimePay" :min="0" :step="50" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="$t('hr.payroll.mealAllowance')">
              <el-input-number v-model="form.mealAllowance" :min="0" :step="50" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('hr.payroll.transportAllowance')">
              <el-input-number v-model="form.transportAllowance" :min="0" :step="50" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">{{ $t('hr.payroll.deductionItems') }}</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="$t('hr.payroll.socialSecurity')">
              <el-input-number v-model="form.socialSecurity" :min="0" :step="50" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('hr.payroll.housingFund')">
              <el-input-number v-model="form.housingFund" :min="0" :step="50" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('hr.payroll.tax')">
              <el-input-number v-model="form.tax" :min="0" :step="50" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">{{ $t('hr.payroll.attendanceDeduction') }}</el-divider>

        <div class="attendance-sync-bar">
          <span class="sync-tip">{{ $t('hr.payroll.attendanceSyncTip') }}</span>
          <el-button type="primary" plain size="small" :icon="Refresh" :loading="loadingAttendance" @click="handleFetchAttendance">
            {{ $t('hr.payroll.fetchAttendance') }}
          </el-button>
        </div>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item :label="$t('hr.payroll.lateCount')">
              <el-input-number v-model="form.lateCount" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item :label="$t('hr.payroll.earlyLeaveCount')">
              <el-input-number v-model="form.earlyLeaveCount" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item :label="$t('hr.payroll.absentCount')">
              <el-input-number v-model="form.absentCount" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item :label="$t('hr.payroll.overtimeHours')">
              <el-input-number v-model="form.overtimeHours" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.payroll.attendanceDeductionAmount')">
              <el-input-number v-model="form.attendanceDeduction" :min="0" :step="50" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.payroll.performanceScore')">
              <el-input-number v-model="form.performanceScore" :min="0" :max="100" :step="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 预览 -->
        <el-divider content-position="left">{{ $t('hr.payroll.preview') }}</el-divider>

        <div class="salary-preview">
          <div class="preview-row">
            <span>{{ $t('hr.payroll.grossSalary') }}：</span>
            <span class="preview-value">{{ formatMoney(calculateGross()) }}</span>
          </div>
          <div class="preview-row">
            <span>{{ $t('hr.payroll.deductions') }}：</span>
            <span class="preview-value deduction">-{{ formatMoney(calculateDeductions()) }}</span>
          </div>
          <el-divider style="margin: 12px 0;" />
          <div class="preview-row total">
            <span>{{ $t('hr.payroll.netSalary') }}：</span>
            <span class="preview-value">{{ formatMoney(calculateNet()) }}</span>
          </div>
        </div>

        <el-form-item :label="$t('hr.payroll.remarks')">
          <el-input v-model="form.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 薪资结构配置对话框 -->
    <el-dialog
      v-model="showStructureDialog"
      :title="$t('hr.payroll.structure')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="structure-header">
        <el-button type="primary" size="small" :icon="Plus" @click="handleAddStructure">
          {{ $t('hr.payroll.addStructure') }}
        </el-button>
      </div>
      <el-table :data="structures" stripe size="small">
        <el-table-column prop="name" :label="$t('hr.payroll.structureName')" width="120" />
        <el-table-column prop="position" :label="$t('hr.payroll.position')" width="120" />
        <el-table-column prop="baseSalary" :label="$t('hr.payroll.baseSalary')" width="100">
          <template #default="{ row }">
            {{ formatMoney(row.baseSalary) }}
          </template>
        </el-table-column>
        <el-table-column prop="performanceSalary" :label="$t('hr.payroll.performanceSalary')" width="100">
          <template #default="{ row }">
            {{ formatMoney(row.performanceSalary) }}
          </template>
        </el-table-column>
        <el-table-column prop="socialSecurity" :label="$t('hr.payroll.socialSecurity')" width="100">
          <template #default="{ row }">
            {{ formatMoney(row.socialSecurity) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="100">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEditStructure(row)" />
          </template>
        </el-table-column>
      </el-table>

      <el-divider v-if="showStructureForm" />

      <el-form v-if="showStructureForm" ref="structureFormRef" :model="structureForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.payroll.structureName')">
              <el-input v-model="structureForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.payroll.position')">
              <el-input v-model="structureForm.position" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.payroll.baseSalary')">
              <el-input-number v-model="structureForm.baseSalary" :min="0" :step="500" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.payroll.performanceSalary')">
              <el-input-number v-model="structureForm.performanceSalary" :min="0" :step="500" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.payroll.socialSecurity')">
              <el-input-number v-model="structureForm.socialSecurity" :min="0" :step="100" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.payroll.housingFund')">
              <el-input-number v-model="structureForm.housingFund" :min="0" :step="100" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" @click="handleSaveStructure" :loading="saving">{{ $t('common.save') }}</el-button>
          <el-button @click="showStructureForm = false">{{ $t('common.cancel') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Money, Plus, Edit, Search, Refresh, Setting, Download } from '@element-plus/icons-vue'
import {
  getPayrollList, calculatePayroll, updatePayroll, confirmPayroll,
  getPayrollStats, getPayrollStructures, createPayrollStructure, updatePayrollStructure,
  getPayrollPayslip,
  type HrPayroll, type HrPayrollStructure,
} from '../../api/hr'
import { getAttendanceStats, getAttendanceList } from '../../api/hr'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const loadingAttendance = ref(false)
const list = ref<HrPayroll[]>([])
const stats = ref<any>({
  total: 0, totalNetSalary: 0, totalGrossSalary: 0, avgNetSalary: 0, totalDeductions: 0,
})
const structures = ref<HrPayrollStructure[]>([])

const showDialog = ref(false)
const showStructureDialog = ref(false)
const showStructureForm = ref(false)
const editing = ref<HrPayroll | null>(null)
const editingStructure = ref<HrPayrollStructure | null>(null)
const formRef = ref<FormInstance>()
const structureFormRef = ref<FormInstance>()

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
  position: '',
  period: '',
  baseSalary: 0,
  performanceSalary: 0,
  overtimePay: 0,
  mealAllowance: 0,
  transportAllowance: 0,
  socialSecurity: 0,
  housingFund: 0,
  tax: 0,
  lateCount: 0,
  earlyLeaveCount: 0,
  absentCount: 0,
  overtimeHours: 0,
  attendanceDeduction: 0,
  performanceScore: 0,
  remarks: '',
})

const structureForm = reactive({
  name: '',
  position: '',
  baseSalary: 0,
  performanceSalary: 0,
  socialSecurity: 0,
  housingFund: 0,
  mealAllowance: 0,
  transportAllowance: 0,
  overtimePay: 0,
  otherDeductions: 0,
  tax: 0,
  remarks: '',
})

// 计算薪资
const calculateGross = () => {
  return form.baseSalary + form.performanceSalary + form.overtimePay + form.mealAllowance + form.transportAllowance
}

const calculateDeductions = () => {
  return form.socialSecurity + form.housingFund + form.tax + form.attendanceDeduction
}

const calculateNet = () => {
  return calculateGross() - calculateDeductions()
}

// 格式化金额
const formatMoney = (value: number): string => {
  return value ? '¥' + value.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '¥0.00'
}

// 加载数据
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

    const res = await getPayrollList(params)
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
    if (filters.period) params.period = filters.period
    else {
      // Default to current month so stats always show data
      const now = new Date()
      params.period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }
    stats.value = await getPayrollStats(params)
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const loadStructures = async () => {
  try {
    structures.value = await getPayrollStructures()
  } catch (error) {
    console.error('Failed to load structures:', error)
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

// 操作
const handleAdd = () => {
  editing.value = null
  Object.assign(form, {
    employeeName: '', department: '', position: '', period: '',
    baseSalary: 0, performanceSalary: 0, overtimePay: 0, mealAllowance: 0,
    transportAllowance: 0, socialSecurity: 0, housingFund: 0, tax: 0,
    lateCount: 0, earlyLeaveCount: 0, absentCount: 0, overtimeHours: 0,
    attendanceDeduction: 0, performanceScore: 0, remarks: '',
  })
  showDialog.value = true
}

const handleEdit = (row: HrPayroll) => {
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
      await updatePayroll(editing.value.id, form)
    } else {
      await calculatePayroll({ ...form })
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

const handleConfirm = async (row: HrPayroll) => {
  try {
    await confirmPayroll(row.id)
    ElMessage.success(t('common.success'))
    loadData()
    loadStats()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 薪资结构
const handleAddStructure = () => {
  editingStructure.value = null
  Object.assign(structureForm, {
    name: '', position: '', baseSalary: 0, performanceSalary: 0,
    socialSecurity: 0, housingFund: 0, mealAllowance: 0, transportAllowance: 0,
    overtimePay: 0, otherDeductions: 0, tax: 0, remarks: '',
  })
  showStructureForm.value = true
}

const handleEditStructure = (row: HrPayrollStructure) => {
  editingStructure.value = row
  Object.assign(structureForm, { ...row })
  showStructureForm.value = true
}

const handleSaveStructure = async () => {
  try {
    saving.value = true
    if (editingStructure.value) {
      await updatePayrollStructure(editingStructure.value.id, structureForm)
    } else {
      await createPayrollStructure(structureForm)
    }
    ElMessage.success(t('common.success'))
    showStructureForm.value = false
    loadStructures()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

// 状态显示
const getStatusText = (status: string): string => {
  return t(`hr.payroll.statuses.${status}`) || status
}

// 从考勤系统拉取数据
const handleFetchAttendance = async () => {
  if (!form.period) {
    ElMessage.warning(t('hr.payroll.selectPeriodFirst') || '请先选择薪资周期')
    return
  }
  loadingAttendance.value = true
  try {
    const [year, month] = form.period.split('-')
    const startDate = `${year}-${month}-01`
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

    // 查询考勤统计
    const stats = await getAttendanceStats({ startDate, endDate })
    form.lateCount = stats.late || 0
    form.earlyLeaveCount = stats.earlyLeave || 0
    form.absentCount = stats.absent || 0
    form.overtimeHours = Math.round((stats.totalOvertimeMinutes || 0) / 60)

    // 从考勤记录中获取详情
    const records = await getAttendanceList({
      page: 1, pageSize: 100,
      startDate, endDate,
      status: 'late',
    })
    const lateDays = new Set(records.data.map(r => r.date)).size
    form.attendanceDeduction = lateDays * 50 // 每次迟到扣50元

    ElMessage.success(
      t('hr.payroll.attendanceFetched', {
        late: form.lateCount,
        early: form.earlyLeaveCount,
        absent: form.absentCount,
        deduction: form.attendanceDeduction,
      }) || `已拉取考勤数据：迟到 ${form.lateCount} 次，早退 ${form.earlyLeaveCount} 次，旷工 ${form.absentCount} 次，扣款 ¥${form.attendanceDeduction}`
    )
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    loadingAttendance.value = false
  }
}

// 生成工资条 PDF
const handleDownloadPayslip = async (row: HrPayroll) => {
  try {
    const res = await getPayrollPayslip(row.id)
    const blob = await fetch(`data:application/pdf;base64,${res.buffer}`).then(r => r.blob())
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = res.filename
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success(t('hr.payroll.payslipDownloaded') || '工资条已下载')
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  }
}

onMounted(() => {
  loadData()
  loadStats()
  loadStructures()
})
</script>

<style scoped lang="scss">
.payroll-module {
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
          font-size: 20px;
          font-weight: 700;
          color: #1d1d1f;

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

    :deep(.el-table__inner-wrapper) {
      width: 100% !important;
    }
    :deep(.el-table__body-wrapper) {
      width: 100% !important;
    }

    .deduction {
      color: #f56c6c;
    }

    .net-salary {
      font-weight: 700;
      color: #67c23a;
    }
  }

  .salary-preview {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;

    .preview-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      &.total {
        font-weight: 700;
        font-size: 16px;
      }

      .preview-value {
        font-weight: 600;
        color: #1d1d1f;

        &.deduction {
          color: #f56c6c;
        }
      }
    }
  }

  .attendance-sync-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #ecf5ff;
    border: 1px solid #409eff;
    border-radius: 8px;
    padding: 10px 16px;
    margin-bottom: 16px;
    .sync-tip { font-size: 13px; color: #409eff; }
  }

  .structure-header {
    margin-bottom: 16px;
  }
}
</style>
