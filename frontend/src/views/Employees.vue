<template>
  <div class="employees-container page-content-enter">
    <h1 class="page-title fade-in-up">{{ $t('employees.title') }}</h1>

    <!-- 统计卡片 -->
    <div class="statistics-grid">
      <div class="statistic-card fade-in-delay-1">
        <div class="statistic-icon">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="statistic-content">
          <div class="statistic-label">{{ $t('employees.totalEmployees') }}</div>
          <div class="statistic-value">{{ statistics?.total || 0 }}</div>
        </div>
      </div>
      <div class="statistic-card fade-in-delay-2">
        <div class="statistic-icon active-icon">
          <el-icon><Avatar /></el-icon>
        </div>
        <div class="statistic-content">
          <div class="statistic-label">{{ $t('employees.activeEmployees') }}</div>
          <div class="statistic-value">{{ statistics?.active || 0 }}</div>
        </div>
      </div>
      <div class="statistic-card fade-in-delay-3">
        <div class="statistic-icon">
          <el-icon><OfficeBuilding /></el-icon>
        </div>
        <div class="statistic-content">
          <div class="statistic-label">{{ $t('employees.departmentCount') }}</div>
          <div class="statistic-value">{{ statistics?.byDepartment?.length || 0 }}</div>
        </div>
      </div>
      <div class="statistic-card">
        <div class="statistic-icon">
          <el-icon><Briefcase /></el-icon>
        </div>
        <div class="statistic-content">
          <div class="statistic-label">{{ $t('employees.positions') }}</div>
          <div class="statistic-value">{{ statistics?.byRole?.length || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-card">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="handleAdd" class="toolbar-button-primary">
          {{ $t('employees.addEmployee') }}
        </el-button>
        <el-button :icon="Refresh" @click="loadEmployees" class="toolbar-button-secondary">
          {{ $t('common.refresh') }}
        </el-button>
        <el-button :icon="Upload" @click="handleImportEmployees" class="toolbar-button-secondary">
          {{ $t('employees.importEmployees') }}
        </el-button>
        <el-button :icon="Download" @click="handleDownloadTemplate" :loading="downloadingTemplate" class="toolbar-button-secondary">
          下载导入模板
        </el-button>
        <el-button :icon="Download" @click="handleExportEmployees" :loading="exportingEmployees" class="toolbar-button-secondary">
          {{ $t('employees.exportEmployees') }}
        </el-button>
        <el-select
          v-model="selectedDepartment"
          :placeholder="$t('employees.filterByDepartment')"
          class="toolbar-select"
          clearable
          @change="handleDepartmentFilter"
        >
          <el-option
            :label="$t('employees.filterAllDepartments')"
            value=""
          />
          <el-option
            v-for="dept in departments"
            :key="dept.value"
            :label="dept.label"
            :value="dept.value"
          />
        </el-select>
        <div class="toolbar-spacer"></div>
        <el-input
          v-model="searchKeyword"
          :placeholder="$t('employees.searchPlaceholder')"
          class="toolbar-search"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <!-- 隐藏的文件上传控件（供导入使用） -->
      <input
        ref="empUploadInput"
        type="file"
        accept=".xlsx,.xls"
        style="display: none"
        @change="onEmpFileSelected"
      />
    </div>

    <!-- 员工列表 -->
    <div class="table-card">
      <el-table
        v-loading="loading"
        :data="filteredEmployees"
        class="modern-table"
        stripe
      >
        <el-table-column prop="employeeNumber" :label="$t('employees.employeeNumber')" min-width="100" />
        <el-table-column prop="nickname" :label="$t('employees.name')" min-width="120" />
        <el-table-column prop="username" :label="$t('employees.loginAccount')" min-width="120" />
        <el-table-column prop="position" :label="$t('employees.position')" min-width="150">
          <template #default="{ row }">
            {{ getPositionName(row.position) }}
          </template>
        </el-table-column>
        <el-table-column prop="department" :label="$t('employees.department')" min-width="120">
          <template #default="{ row }">
            {{ getDepartmentName(row.department) }}
          </template>
        </el-table-column>
        <el-table-column prop="team" :label="$t('employees.team')" min-width="140">
          <template #default="{ row }">
            {{ getTeamName(row.team) }}
          </template>
        </el-table-column>
        <el-table-column prop="employmentStatus" :label="$t('employees.statusLabel')" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.employmentStatus)" size="small">
              {{ getStatusText(row.employmentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hireDate" :label="$t('employees.hireDate')" min-width="120">
          <template #default="{ row }">
            {{ row.hireDate ? formatDate(row.hireDate) : '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('employees.operations')" width="280" fixed="right">
          <template #default="{ row }">
            <div class="operation-buttons" v-if="canOperateEmployee(row)">
              <el-button type="info" size="small" :icon="View" @click="handleViewDetail(row)" class="operation-button-view">
                {{ $t('employees.viewDetail') }}
              </el-button>
              <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)" class="operation-button-edit">
                {{ $t('common.edit') }}
              </el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)" class="operation-button-delete">
                {{ $t('common.delete') }}
              </el-button>
            </div>
            <div v-else class="operation-disabled">
              <el-text type="info" size="small">{{ $t('employees.noPermission') }}</el-text>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="$t('employees.viewDetail')"
      width="720px"
      :close-on-click-modal="false"
      align-center
      class="employee-detail-dialog"
    >
      <div class="employee-detail" v-if="detailEmployee">
        <div class="detail-header">
          <div class="avatar-wrapper">
            <el-avatar
              :size="100"
              :src="getAvatarUrl(detailEmployee.avatar)"
              class="detail-avatar"
              :fit="'cover'"
            >
              <span v-if="!detailEmployee.avatar" class="avatar-fallback">
                {{ detailEmployee.nickname?.charAt(0) || 'U' }}
              </span>
            </el-avatar>
          </div>
          <div class="detail-info">
            <h3 class="detail-name">{{ detailEmployee.nickname }}</h3>
            <p class="detail-position">
              <template v-if="detailEmployee.department === 'sales_ops' && detailEmployee.team">
                {{ getPositionName(detailEmployee.position) }} · {{ getTeamName(detailEmployee.team) }}
              </template>
              <template v-else>
                {{ getPositionName(detailEmployee.position) }}
              </template>
            </p>
            <el-tag 
              :type="getStatusType(detailEmployee.employmentStatus)" 
              size="small"
              class="status-tag"
              round
            >
              {{ getStatusText(detailEmployee.employmentStatus) }}
            </el-tag>
          </div>
        </div>
        <div class="detail-content">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">{{ $t('employees.employeeNumber') }}</div>
              <div class="info-value">{{ detailEmployee.employeeNumber || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('employees.loginAccount') }}</div>
              <div class="info-value">{{ detailEmployee.username }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('employees.department') }}</div>
              <div class="info-value">{{ getDepartmentName(detailEmployee?.department) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.role') }}</div>
              <div class="info-value">
                <template v-if="detailEmployee">
                  {{ roles.find(r => r.value === (detailEmployee as Employee).role)?.label || (detailEmployee as Employee).role || '-' }}
                </template>
                <template v-else>-</template>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('employees.hireDate') }}</div>
              <div class="info-value">{{ detailEmployee?.hireDate ? formatDate(detailEmployee.hireDate) : '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.email') }}</div>
              <div class="info-value">{{ detailEmployee?.email || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.phone') }}</div>
              <div class="info-value">{{ detailEmployee?.phone || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.school') }}</div>
              <div class="info-value">{{ detailEmployee?.school || '-' }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.vpnAccount') }}</div>
              <div class="info-value">{{ detailEmployee?.vpnAccount || $t('profile.companyAccounts.none') }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.vpnPassword') }}</div>
              <div class="info-value">{{ detailEmployee?.vpnPassword || $t('profile.companyAccounts.none') }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.facebookAccount') }}</div>
              <div class="info-value">{{ detailEmployee?.facebookAccount || $t('profile.companyAccounts.none') }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.facebookPassword') }}</div>
              <div class="info-value">{{ detailEmployee?.facebookPassword || $t('profile.companyAccounts.none') }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.linkedinAccount') }}</div>
              <div class="info-value">{{ detailEmployee?.linkedinAccount || $t('profile.companyAccounts.none') }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.linkedinPassword') }}</div>
              <div class="info-value">{{ detailEmployee?.linkedinPassword || $t('profile.companyAccounts.none') }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.whatsappAccount') }}</div>
              <div class="info-value">{{ detailEmployee?.whatsappAccount || $t('profile.companyAccounts.none') }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.whatsappPassword') }}</div>
              <div class="info-value">{{ detailEmployee?.whatsappPassword || $t('profile.companyAccounts.none') }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.instagramAccount') }}</div>
              <div class="info-value">{{ detailEmployee?.instagramAccount || $t('profile.companyAccounts.none') }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ $t('employees.form.instagramPassword') }}</div>
              <div class="info-value">{{ detailEmployee?.instagramPassword || $t('profile.companyAccounts.none') }}</div>
            </div>

            <div class="info-item full-width">
              <div class="info-label">{{ $t('employees.form.address') }}</div>
              <div class="info-value">{{ detailEmployee?.address || '-' }}</div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDetailDialog = false" class="footer-button">
            {{ $t('common.close') }}
          </el-button>
          <el-button 
            type="primary" 
            @click="handleEditFromDetail" 
            v-if="detailEmployee && canOperateEmployee(detailEmployee)"
            class="footer-button"
          >
            {{ $t('common.edit') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
      class="modern-dialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        :key="`form-${isEdit ? 'edit' : 'add'}`"
      >
        <el-row :gutter="20" v-if="isEdit && formData.employeeNumber">
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.employeeNumber')">
              <el-input v-model="formData.employeeNumber" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.username')" prop="username">
              <el-input v-model="formData.username" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.password')" prop="password">
              <el-input 
                v-model="formData.password" 
                type="password" 
                show-password 
                :placeholder="isEdit ? $t('employees.form.passwordPlaceholder') : ''"
              />
              <div v-if="isEdit" class="password-hint">
                {{ $t('employees.form.passwordHint') }}
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.nickname')" prop="nickname">
              <el-input v-model="formData.nickname" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.gender')" prop="gender">
              <el-select v-model="formData.gender" style="width: 100%">
                <el-option :label="$t('employees.genderOptions.male')" value="male" />
                <el-option :label="$t('employees.genderOptions.female')" value="female" />
                <el-option :label="$t('employees.genderOptions.other')" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.age')" prop="age">
              <el-input-number v-model="formData.age" :min="16" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.hireDate')" prop="hireDate">
              <el-date-picker
                v-model="formData.hireDate"
                type="date"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.department')" prop="department">
              <el-select v-model="formData.department" style="width: 100%">
                <el-option
                  v-for="dept in departments"
                  :key="dept.value"
                  :label="dept.label"
                  :value="dept.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.position')" prop="position">
              <el-select v-model="formData.position" style="width: 100%" filterable @change="handlePositionChange">
                <el-option
                  v-for="pos in positionOptions"
                  :key="pos.value"
                  :label="pos.label"
                  :value="pos.value"
                  :disabled="isPositionDisabled(pos.value)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12" v-if="isSuperAdmin">
            <el-form-item :label="$t('employees.form.role')" prop="role">
              <el-select v-model="formData.role" style="width: 100%">
                <el-option
                  v-for="role in roles"
                  :key="role.value"
                  :label="role.label"
                  :value="role.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.status')" prop="employmentStatus">
              <el-select v-model="formData.employmentStatus" style="width: 100%">
                <el-option
                  v-for="status in employmentStatuses"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.email')" prop="email">
              <el-input v-model="formData.email" type="email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.phone')" prop="phone">
              <el-input v-model="formData.phone" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('employees.form.school')" prop="school">
          <el-input v-model="formData.school" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12" v-if="showTeamField">
            <el-form-item :label="$t('employees.form.team')" prop="team">
              <el-select v-model="formData.team" clearable style="width: 100%">
                <el-option :label="$t('employees.teams.none')" value="" />
                <el-option
                  v-for="team in availableTeams"
                  :key="team.value"
                  :label="team.label"
                  :value="team.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.orgRoleType')" prop="orgRoleType">
              <el-select v-model="formData.orgRoleType" clearable style="width: 100%">
                <el-option :label="$t('employees.orgRoleTypes.staff')" value="staff" />
                <el-option :label="$t('employees.orgRoleTypes.team_lead')" value="team_lead" />
                <el-option :label="$t('employees.orgRoleTypes.dept_manager')" value="dept_manager" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('employees.form.directLeader')" prop="directLeaderId">
          <el-select
            v-model="formData.directLeaderId"
            clearable
            filterable
            style="width: 100%"
            :placeholder="$t('employees.form.directLeader')"
          >
            <el-option
              v-for="leader in leaderOptions"
              :key="leader.id"
              :label="`${leader.nickname || leader.username} (${getDepartmentName(leader.department)})`"
              :value="leader.id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.vpnAccount')" prop="vpnAccount">
              <el-input v-model="formData.vpnAccount" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.vpnPassword')" prop="vpnPassword">
              <el-input v-model="formData.vpnPassword" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.facebookAccount')" prop="facebookAccount">
              <el-input v-model="formData.facebookAccount" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.facebookPassword')" prop="facebookPassword">
              <el-input v-model="formData.facebookPassword" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.linkedinAccount')" prop="linkedinAccount">
              <el-input v-model="formData.linkedinAccount" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.linkedinPassword')" prop="linkedinPassword">
              <el-input v-model="formData.linkedinPassword" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.whatsappAccount')" prop="whatsappAccount">
              <el-input v-model="formData.whatsappAccount" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.whatsappPassword')" prop="whatsappPassword">
              <el-input v-model="formData.whatsappPassword" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.instagramAccount')" prop="instagramAccount">
              <el-input v-model="formData.instagramAccount" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employees.form.instagramPassword')" prop="instagramPassword">
              <el-input v-model="formData.instagramPassword" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('employees.form.address')" prop="address">
          <el-input v-model="formData.address" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Edit, Delete, View, UserFilled, Avatar, OfficeBuilding, Briefcase, Upload, Download } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '../store/user'
import {
  getEmployees,
  getEmployeeStatistics,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
  type CreateEmployeeDto,
} from '../api/employees'
import { getAvatarUrl as getEmployeeAvatarUrl } from '../api/users'
import { importEmployees, exportEmployees, downloadEmployeeTemplate } from '../api/hr'
import { departments, allPositions as allPositionsData, getDepartmentLabel, getPositionLabel } from '../utils/organization'

const { t, locale } = useI18n()
const userStore = useUserStore()

const isSuperAdmin = computed(() => {
  return userStore.isSuperAdmin
})

const canOperateEmployee = (employee: Employee): boolean => {
  if (userStore.isSuperAdmin) return true
  if (employee.username === 'admin') return false
  return userStore.hasPermission('employees.edit') || userStore.hasPermission('employees.manage')
}

const loading = ref(false)
const submitting = ref(false)
const exportingEmployees = ref(false)
const downloadingTemplate = ref(false)
const employees = ref<Employee[]>([])
const statistics = ref<any>(null)
const searchKeyword = ref('')
const selectedDepartment = ref('')
const showDialog = ref(false)
const showDetailDialog = ref(false)
const detailEmployee = ref<Employee | null>(null)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const empUploadInput = ref<HTMLInputElement>()

const formData = ref<Partial<CreateEmployeeDto> & { id?: number; employeeNumber?: string }>({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  role: 'employee',
  department: 'general_office',
  gender: 'male',
  age: undefined,
  position: '',
  employmentStatus: 'active',
  hireDate: new Date().toISOString().split('T')[0],
  school: '',
  address: '',
  team: '',
  orgRoleType: 'staff',
  directLeaderId: undefined,
  vpnAccount: '',
  vpnPassword: '',
  facebookAccount: '',
  facebookPassword: '',
  linkedinAccount: '',
  linkedinPassword: '',
  whatsappAccount: '',
  whatsappPassword: '',
  instagramAccount: '',
  instagramPassword: '',
})

const formRules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('employees.form.usernameRequired'), trigger: 'blur' }],
  password: [{ required: !isEdit.value, message: t('employees.form.passwordRequired'), trigger: 'blur' }],
  nickname: [{ required: true, message: t('employees.form.nicknameRequired'), trigger: 'blur' }],
  department: [{ required: true, message: t('employees.form.departmentRequired'), trigger: 'change' }],
  position: [{ required: true, message: t('employees.form.positionRequired'), trigger: 'change' }],
  role: [{ required: true, message: t('employees.form.roleRequired'), trigger: 'change' }],
}))

// 使用共享的组织架构配置
const allPositions = allPositionsData

const filteredPositions = computed(() => {
  if (!formData.value.department) return []
  return allPositions.filter(p => p.departmentCode === formData.value.department)
})

const positionOptions = computed(() => filteredPositions.value.map(p => ({
  label: p.name,
  value: p.code
})))

const sensitivePositionCodes = ['ceo', 'chairman']

const getPositionName = (position?: string | null): string => {
  if (!position) return '-'
  // 使用共享配置，支持国际化
  return getPositionLabel(position, locale.value === 'en-US' ? 'en' : 'zh')
}

const isPositionDisabled = (code: string): boolean => {
  if (!sensitivePositionCodes.includes(code)) return false
  const holder = employees.value.find(emp => {
    if (emp.position !== code) return false
    if (formData.value.id && emp.id === formData.value.id) return false
    return true
  })
  return !!holder
}

const roles = [
  { label: t('employees.roles.superAdmin'), value: 'super_admin' },
  { label: t('employees.roles.departmentHead'), value: 'department_head' },
  { label: t('employees.roles.employee'), value: 'employee' },
  { label: t('employees.roles.hrDirector'), value: 'hr_director' },
  { label: t('employees.roles.hrReception'), value: 'hr_reception' },
  { label: t('employees.roles.finance'), value: 'finance' },
  { label: t('employees.roles.guest'), value: 'guest' },
  { label: t('employees.roles.hr'), value: 'hr' },
]

// 职位 → 系统身份映射：选择职位时自动设置对应角色
const positionRoleMapping: Record<string, string> = {
  chairman: 'super_admin',
  ceo: 'super_admin',
  hr_director: 'hr_director',
  hr_front_desk: 'hr_reception',
  hr_recruiter: 'hr',
  hr_admin: 'hr',
  hr_cleaner: 'employee',
  hr_clerk: 'employee',
  hr_bp_probation: 'employee',
  finance_director: 'finance',
  accountant: 'finance',
  finance_specialist: 'finance',
  finance_saudi: 'finance',
  brand_director: 'department_head',
  brand_planner_leader: 'department_head',
  web_front_end: 'employee',
  operations_assistant: 'employee',
  new_media_ops: 'employee',
  graphic_designer: 'employee',
  graphic_designer_asst: 'employee',
  '3d_animator': 'employee',
  social_media_mgr: 'employee',
  delivery_vp: 'super_admin',
  quality_supervisor: 'department_head',
  quality_specialist: 'employee',
  tech_supervisor: 'department_head',
  led_struct_engineer: 'employee',
  warehouse_specialist: 'employee',
  procurement_specialist: 'employee',
  pmc_supervisor: 'department_head',
  pmc_specialist: 'employee',
  after_sales_engineer: 'employee',
  after_sales_asst: 'employee',
  saudi_warehouse: 'employee',
  intl_after_sales: 'employee',
  rd_director: 'department_head',
  structural_engineer: 'employee',
  electronic_engineer: 'employee',
  engineer_asst: 'employee',
  sales_director: 'department_head',
  sales_supervisor: 'department_head',
  sales_overseas: 'employee',
  sales_merchandiser: 'employee',
  sales_japanese_merch: 'employee',
  sales_ali_ops: 'employee',
  sales_after_sales: 'employee',
  sales_after_sales_mgr: 'department_head',
  sales_intl_after_sales: 'employee',
  sales_resident: 'employee',
  sales_leader: 'department_head',
  sales_after_sales_lead: 'department_head',
}

const handlePositionChange = (positionCode: string) => {
  if (positionCode && positionRoleMapping[positionCode]) {
    ;(formData.value as any).role = positionRoleMapping[positionCode]
  }
}

const employmentStatuses = computed(() => [
  { label: t('employees.employmentStatuses.active'), value: 'active' },
  { label: t('employees.employmentStatuses.leave'), value: 'leave' },
  { label: t('employees.employmentStatuses.resigned'), value: 'resigned' },
  { label: t('employees.employmentStatuses.suspended'), value: 'suspended' },
])

const teams = [
  { label: '日韩运营组', value: 'ops_jk' },
  { label: '印度运营组', value: 'ops_india' },
  { label: '中东运营组', value: 'ops_me' },
  { label: '欧亚运营组', value: 'ops_ea' },
  { label: '巴伊运营组', value: 'ops_bay' },
]

const availableTeams = computed(() => {
  if (formData.value.department === 'sales_ops') {
    return teams
  }
  return []
})

const showTeamField = computed(() => availableTeams.value.length > 0)

const dialogTitle = computed(() => {
  return isEdit.value ? t('employees.editEmployee') : t('employees.addEmployee')
})

const filteredEmployees = computed(() => {
  let result = employees.value

  if (selectedDepartment.value) {
    result = result.filter(emp => emp.department === selectedDepartment.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(emp =>
      emp.nickname.toLowerCase().includes(keyword) ||
      emp.position?.toLowerCase().includes(keyword) ||
      emp.department?.toLowerCase().includes(keyword) ||
      emp.username?.toLowerCase().includes(keyword) ||
      emp.employeeNumber?.toLowerCase().includes(keyword)
    )
  }

  return result
})

const leaderOptions = computed(() => {
  return employees.value.filter(emp => {
    if (formData.value.id && emp.id === formData.value.id) return false
    if (emp.orgRoleType !== 'team_lead' && emp.orgRoleType !== 'dept_manager') return false
    if (formData.value.team && emp.team && emp.team !== formData.value.team) return false
    return true
  })
})

const getDepartmentName = (dept?: string): string => {
  if (!dept) return '-'
  // 使用共享配置，支持国际化
  return getDepartmentLabel(dept, locale.value === 'en-US' ? 'en' : 'zh')
}

const getTeamName = (team?: string): string => {
  if (!team) return '-'
  const teamInfo = teams.find(t => t.value === team)
  return teamInfo?.label || team
}

const getStatusType = (status: string): string => {
  const map: Record<string, string> = {
    active: 'success',
    leave: 'warning',
    resigned: 'danger',
    suspended: 'info',
  }
  return map[status] || 'info'
}

const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    active: t('employees.status.active'),
    leave: t('employees.status.leave'),
    resigned: t('employees.status.resigned'),
    suspended: t('employees.status.suspended'),
  }
  return map[status] || status
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString(locale.value)
}

const loadEmployees = async () => {
  loading.value = true
  try {
    const [emps, stats] = await Promise.all([
      getEmployees(),
      getEmployeeStatistics(),
    ])
    employees.value = emps
    statistics.value = stats
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

// ==================== 员工导入/导出 ====================
const handleImportEmployees = () => {
  empUploadInput.value?.click()
}

const onEmpFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = '' // 清空以便下次重复选择同一文件

  try {
    const result = await importEmployees(file)
    ElMessage.success(
      `员工导入完成：新增 ${result.imported || 0}，更新 ${result.updated || 0}，跳过 ${result.skipped || 0}`
    )
    loadEmployees() // 刷新列表
  } catch (err: any) {
    ElMessage.error('导入失败：' + (err?.message || '未知错误'))
  }
}

const handleDownloadTemplate = async () => {
  downloadingTemplate.value = true
  try {
    const res = await downloadEmployeeTemplate()
    const binary = atob(res.buffer)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = res.filename
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('员工导入模板下载成功')
  } catch (err: any) {
    ElMessage.error('下载失败：' + (err?.message || '未知错误'))
  } finally {
    downloadingTemplate.value = false
  }
}

const handleExportEmployees = async () => {
  exportingEmployees.value = true
  try {
    const res = await exportEmployees()
    const binary = atob(res.buffer)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = res.filename
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('员工花名册导出成功')
  } catch (err: any) {
    ElMessage.error('导出失败：' + (err?.message || '未知错误'))
  } finally {
    exportingEmployees.value = false
  }
}

const handleSearch = () => {
}

const handleDepartmentFilter = () => {
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = {
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
    role: 'employee',
    department: 'general_office',
    gender: 'male',
    age: undefined,
    position: '',
    employmentStatus: 'active',
    hireDate: new Date().toISOString().split('T')[0],
    school: '',
    address: '',
    team: '',
    orgRoleType: 'staff',
    directLeaderId: undefined,
    vpnAccount: '',
    vpnPassword: '',
    facebookAccount: '',
    facebookPassword: '',
    linkedinAccount: '',
    linkedinPassword: '',
    whatsappAccount: '',
    whatsappPassword: '',
    instagramAccount: '',
    instagramPassword: '',
  }
  showDialog.value = true
}

const getAvatarUrl = (avatar?: string): string => {
  if (!avatar) return ''
  
  const filename = avatar.includes('/') ? avatar.split('/').pop() : avatar
  
  if (filename) {
    return getEmployeeAvatarUrl(filename)
  }
  
  return ''
}

const handleViewDetail = (employee: Employee) => {
  detailEmployee.value = employee
  showDetailDialog.value = true
}

const handleEditFromDetail = () => {
  if (detailEmployee.value) {
    showDetailDialog.value = false
    handleEdit(detailEmployee.value)
  }
}

const handleEdit = (employee: Employee) => {
  isEdit.value = true
  formData.value = {
    id: employee.id,
    username: employee.username,
    password: '',
    nickname: employee.nickname,
    email: employee.email,
    phone: employee.phone,
    role: employee.role as any,
    department: employee.department as any,
    gender: employee.gender as any,
    age: employee.age,
    position: employee.position,
    employmentStatus: employee.employmentStatus as any,
    hireDate: employee.hireDate,
    school: employee.school,
    address: employee.address,
    team: employee.team,
    orgRoleType: (employee.orgRoleType as any) || 'staff',
    directLeaderId: employee.directLeaderId ?? undefined,
    vpnAccount: employee.vpnAccount,
    vpnPassword: employee.vpnPassword,
    facebookAccount: employee.facebookAccount,
    facebookPassword: employee.facebookPassword,
    linkedinAccount: employee.linkedinAccount,
    linkedinPassword: employee.linkedinPassword,
    whatsappAccount: employee.whatsappAccount,
    whatsappPassword: employee.whatsappPassword,
    instagramAccount: employee.instagramAccount,
    instagramPassword: employee.instagramPassword,
  }
  showDialog.value = true
}

const handleDelete = async (employee: Employee) => {
  try {
    await ElMessageBox.confirm(
      t('employees.deleteConfirm', { name: employee.nickname }),
      t('common.warning'),
      {
        type: 'warning',
      }
    )
    await deleteEmployee(employee.id)
    ElMessage.success(t('common.success'))
    loadEmployees()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()

    const currentPosition = formData.value.position as string | undefined
    if (currentPosition && sensitivePositionCodes.includes(currentPosition)) {
      const holder = employees.value.find(emp => {
        if (emp.position !== currentPosition) return false
        if (formData.value.id && emp.id === formData.value.id) return false
        return true
      })
      if (holder) {
        ElMessage.error(t('employees.sensitivePositions.alreadyTaken'))
        return
      }
    }

    submitting.value = true

    const submitData = { ...formData.value }
    
    if (isEdit.value && !submitData.password) {
      delete submitData.password
    }

    const optionalFields: (keyof typeof submitData)[] = [
      'email',
      'phone',
      'school',
      'address',
      'vpnAccount',
      'vpnPassword',
      'facebookAccount',
      'facebookPassword',
      'linkedinAccount',
      'linkedinPassword',
      'whatsappAccount',
      'whatsappPassword',
      'instagramAccount',
      'instagramPassword',
      'team',
      'orgRoleType',
      'directLeaderId',
    ]
    optionalFields.forEach(field => {
      if (submitData[field] === '' || submitData[field] === null) {
        delete submitData[field]
      }
    })

    if (isEdit.value) {
      await updateEmployee(formData.value.id!, submitData)
      ElMessage.success(t('common.updateSuccess'))
    } else {
      await createEmployee(submitData as CreateEmployeeDto)
      ElMessage.success(t('common.createSuccess'))
    }

    showDialog.value = false
    loadEmployees()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadEmployees()
})
</script>

<style scoped lang="scss">
.employees-container {
  padding: 24px;
  background: #f5f5f7;
  min-height: 100vh;
  
  .page-title {
    margin: 0 0 24px 0;
    font-size: 28px;
    font-weight: 600;
    color: #1d1d1f;
    letter-spacing: -0.02em;
  }

  .statistics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .statistic-card {
      background: #ffffff;
      border: 1px solid #e5e5e7;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }

      .statistic-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #f5f5f7;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .el-icon {
          font-size: 24px;
          color: #86868b;
        }

        &.active-icon {
          background: #e8f5e9;
          
          .el-icon {
            color: #34c759;
          }
        }
      }

      .statistic-content {
        flex: 1;
        min-width: 0;

        .statistic-label {
          font-size: 13px;
          color: #86868b;
          margin-bottom: 4px;
          font-weight: 500;
          letter-spacing: -0.01em;
        }

        .statistic-value {
          font-size: 24px;
          font-weight: 600;
          color: #1d1d1f;
          letter-spacing: -0.02em;
        }
      }
    }
  }

  .toolbar-card {
    background: #ffffff;
    border: 1px solid #e5e5e7;
    border-radius: 16px;
    padding: 16px 20px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;

      .toolbar-button-primary {
        border-radius: 10px;
        font-weight: 500;
        padding: 10px 20px;
        height: 40px;
        letter-spacing: -0.01em;
      }

      .toolbar-button-secondary {
        border-radius: 10px;
        border-color: #e5e5e7;
        color: #1d1d1f;
        font-weight: 500;
        padding: 10px 20px;
        height: 40px;
        letter-spacing: -0.01em;

        &:hover {
          border-color: #d1d1d6;
          background: #f5f5f7;
        }
      }

      .toolbar-select {
        width: 200px;
        
        :deep(.el-input__wrapper) {
          border-radius: 10px;
          border-color: #e5e5e7;
        }
      }

      .toolbar-spacer {
        flex: 1;
      }

      .toolbar-search {
        width: 300px;
        
        :deep(.el-input__wrapper) {
          border-radius: 10px;
          border-color: #e5e5e7;
        }
      }
    }
  }

  .table-card {
    background: #ffffff;
    border: 1px solid #e5e5e7;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    width: 100%;

    .modern-table {
      width: 100%;

      :deep(.el-table) {
        width: 100%;
      }

      :deep(.el-table__header-wrapper),
      :deep(.el-table__body-wrapper) {
        width: 100%;
      }

      :deep(.el-table__header) {
        width: 100%;

        th {
          background: #f5f5f7;
          border-bottom: 1px solid #e5e5e7;
          color: #1d1d1f;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: -0.01em;
          padding: 12px 0;
        }
      }

      :deep(.el-table__body) {
        width: 100%;

        tr {
          transition: background-color 0.15s ease;

          &:hover {
            background: #f5f5f7 !important;
          }

          td {
            border-bottom: 1px solid #f5f5f7;
            padding: 16px 0;
            color: #1d1d1f;
            font-size: 14px;
          }
        }
      }

      :deep(.el-table__row--striped) {
        background: #fafafa;
      }
    }
  }

  .operation-buttons {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;

    .operation-button-view,
    .operation-button-edit,
    .operation-button-delete {
      flex-shrink: 0;
      margin: 0;
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: 500;
      letter-spacing: -0.01em;
      font-size: 12px;
    }

    .operation-button-view {
      background: #909399;
      border-color: #909399;
      color: #fff;

      &:hover {
        background: #73767a;
        border-color: #73767a;
      }
    }

    .operation-button-edit {
      background: #007aff;
      border-color: #007aff;

      &:hover {
        background: #0051d5;
        border-color: #0051d5;
      }
    }

    .operation-button-delete {
      background: #ff3b30;
      border-color: #ff3b30;

      &:hover {
        background: #d70015;
        border-color: #d70015;
      }
    }
  }

  .password-hint {
    font-size: 12px;
    color: #86868b;
    margin-top: 4px;
  }

  .operation-disabled {
    text-align: center;
    padding: 8px 0;
    color: #86868b;
    font-size: 12px;
  }

  .employee-detail {
    .detail-header {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 0;
      margin-bottom: 32px;

      .avatar-wrapper {
        flex-shrink: 0;
        
        .detail-avatar {
          border: 3px solid #f0f2f5;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            transform: scale(1.02);
          }

          .avatar-fallback {
            font-size: 40px;
            font-weight: 600;
            color: #fff;
          }
        }
      }

      .detail-info {
        flex: 1;
        min-width: 0;

        .detail-name {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
          color: #1d1d1f;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .detail-position {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #86868b;
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        .status-tag {
          border-radius: 12px;
          padding: 4px 12px;
          font-weight: 500;
          font-size: 12px;
        }
      }
    }

    .detail-content {
      margin-top: 0;
      
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        
        .info-item {
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          
          &:hover {
            background: #f0f2f5;
            transform: translateY(-1px);
            border-color: #e5e5e7;
          }
          
          &.full-width {
            grid-column: 1 / -1;
          }
          
          .info-label {
            font-size: 12px;
            color: #86868b;
            font-weight: 500;
            margin-bottom: 8px;
            letter-spacing: 0.02em;
            text-transform: uppercase;
          }
          
          .info-value {
            font-size: 15px;
            color: #1d1d1f;
            font-weight: 500;
            letter-spacing: -0.01em;
            word-break: break-word;
          }
        }
      }
    }
  }

  :deep(.employee-detail-dialog) {
    .el-dialog {
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      border: none;
      margin-top: 8vh !important;
    }
    
    .el-dialog__wrapper {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 8vh;
    }

    .el-dialog__header {
      padding: 24px 28px 20px;
      border-bottom: 1px solid #f0f2f5;
      background: #ffffff;
      margin: 0;

      .el-dialog__title {
        font-size: 20px;
        font-weight: 600;
        color: #1d1d1f;
        letter-spacing: -0.02em;
      }

      .el-dialog__headerbtn {
        top: 24px;
        right: 28px;
        
        .el-dialog__close {
          color: #86868b;
          font-size: 20px;
          transition: color 0.2s ease;
          
          &:hover {
            color: #1d1d1f;
          }
        }
      }
    }

    .el-dialog__body {
      padding: 28px;
      background: #ffffff;
    }

    .el-dialog__footer {
      padding: 20px 28px;
      border-top: 1px solid #f0f2f5;
      background: #ffffff;
      
      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        
        .footer-button {
          border-radius: 10px;
          font-weight: 500;
          letter-spacing: -0.01em;
          padding: 10px 20px;
          height: 40px;
          transition: all 0.2s ease;
          
          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }
  }
}

:deep(.modern-dialog) {
  .el-dialog {
    border-radius: 16px;
    overflow: hidden;
    margin-top: 8vh;
  }

  .el-dialog__header {
    padding: 20px 24px;
    border-bottom: 1px solid #e5e5e7;
    background: #ffffff;

    .el-dialog__title {
      font-size: 20px;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -0.02em;
    }
  }

  .el-dialog__body {
    padding: 24px;
    background: #ffffff;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid #e5e5e7;
    background: #ffffff;

    .el-button {
      border-radius: 10px;
      font-weight: 500;
      letter-spacing: -0.01em;
    }
  }

  .el-form-item__label {
    color: #1d1d1f;
    font-weight: 500;
    font-size: 14px;
  }

  .el-input__wrapper {
    border-radius: 10px;
    border-color: #e5e5e7;
  }

  .el-select .el-input__wrapper {
    border-radius: 10px;
  }
}

@media (max-width: 1200px) {
  .employees-container {
    .statistics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 768px) {
  .employees-container {
    padding: 16px;

    .statistics-grid {
      grid-template-columns: 1fr;
    }

    .toolbar-card .toolbar {
      flex-wrap: wrap;

      .toolbar-search {
        width: 100%;
      }
    }
  }
}
</style>
