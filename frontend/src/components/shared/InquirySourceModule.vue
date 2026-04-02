<template>
  <div class="inquiry-source-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Connection /></el-icon>
            <span>{{ $t('crm.inquirySources.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button type="info" :icon="Upload" @click="showImportDialog = true" v-if="isAdmin">
              {{ $t('hr.attendance.import') }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="isAdmin">
              {{ $t('crm.inquirySources.add') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-value">{{ sources.length }}</div>
          <div class="stat-label">{{ $t('crm.inquirySources.total') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value success">{{ activeCount }}</div>
          <div class="stat-label">{{ $t('crm.inquirySources.active') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value info">{{ autoAssignCount }}</div>
          <div class="stat-label">{{ $t('crm.inquirySources.autoAssign') }}</div>
        </div>
      </div>

      <!-- 询盘来源列表：max-height + doLayout 避免表体高度为 0；row-key 函数避免 id 异常 -->
      <el-table
        ref="sourceTableRef"
        class="inquiry-source-table"
        :data="sources"
        stripe
        v-loading="loading"
        :row-key="getRowKey"
        max-height="620"
        style="width: 100%"
        border
      >
        <el-table-column prop="name" :label="$t('crm.inquirySources.name')" min-width="150">
          <template #default="{ row }">
            <div class="source-name">
              <span>{{ row.name }}</span>
              <el-tag size="small" :type="row.isActive ? 'success' : 'info'" class="ml-8">
                {{ row.isActive ? $t('crm.inquirySources.enabled') : $t('crm.inquirySources.disabled') }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('crm.inquirySources.websiteType')" width="140">
          <template #default="{ row }">
            <span>{{ websiteTypes[row.websiteType] || row.websiteType }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="assignedDepartment" :label="$t('crm.inquirySources.assignedDepartment')" width="140" />
        <el-table-column :label="$t('crm.inquirySources.assignee')" width="130">
          <template #default="{ row }">
            <span>{{ getOwnerName(row.assignedToUserId) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('crm.inquirySources.autoAssign')" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.autoAssignEnabled ? 'success' : 'info'">
              {{ row.autoAssignEnabled ? $t('common.yes') : $t('common.no') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalInquiries" :label="$t('crm.inquirySources.totalInquiries')" width="110" align="center" />
        <el-table-column prop="pendingInquiries" :label="$t('crm.inquirySources.pending')" width="90" align="center" />
        <el-table-column :label="$t('crm.inquirySources.lastFetch')" width="160">
          <template #default="{ row }">
            <span>{{ row.lastFetchAt ? formatDate(row.lastFetchAt) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="160" fixed="right" v-if="isAdmin">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
            <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="editingSource ? $t('crm.inquirySources.editSource') : $t('crm.inquirySources.addSource')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="140px">
        <el-form-item :label="$t('crm.inquirySources.name')" prop="name">
          <el-input v-model="form.name" :placeholder="$t('crm.inquirySources.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('crm.inquirySources.websiteType')" prop="websiteType">
          <el-select v-model="form.websiteType" style="width: 100%;">
            <el-option v-for="(label, key) in websiteTypes" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('crm.inquirySources.websiteUrl')">
          <el-input v-model="form.websiteUrl" placeholder="https://..." />
        </el-form-item>
        <el-divider content-position="left">{{ $t('crm.inquirySources.autoAssignRule') }}</el-divider>
        <el-form-item :label="$t('crm.inquirySources.autoAssign')">
          <el-switch v-model="form.autoAssignEnabled" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.inquirySources.defaultCountry')">
              <el-input v-model="form.defaultCountry" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.inquirySources.assignedDepartment')">
              <el-input v-model="form.assignedDepartment" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('crm.inquirySources.assignee')">
          <el-select v-model="form.assignedToUserId" clearable filterable :placeholder="$t('crm.leads.assignedToPlaceholder')" style="width: 100%;">
            <el-option :label="$t('crm.leads.unassigned')" :value="0" />
            <el-option
              v-for="user in salesUsers"
              :key="user.id"
              :label="user.nickname || user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">{{ $t('crm.inquirySources.advanced') }}</el-divider>
        <el-form-item :label="$t('crm.inquirySources.isActive')">
          <el-switch v-model="form.isActive" />
        </el-form-item>
        <el-form-item :label="$t('crm.inquirySources.apiEndpoint')">
          <el-input v-model="form.apiEndpoint" placeholder="https://api.example.com/leads" />
        </el-form-item>
        <el-form-item :label="$t('crm.inquirySources.apiKey')">
          <el-input v-model="form.apiKey" placeholder="••••••••" show-password />
        </el-form-item>
        <el-form-item :label="$t('crm.inquirySources.webhookUrl')">
          <el-input v-model="form.webhookUrl" placeholder="https://your-domain.com/webhook/crm" />
        </el-form-item>
        <el-form-item :label="$t('crm.inquirySources.notes')">
          <el-input v-model="form.notes" type="textarea" :rows="2" />
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
      :title="$t('crm.inquirySources.batchImport')"
      width="520px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
    >
      <div class="import-section">
        <p class="import-tip">{{ $t('crm.inquirySources.importDesc') }}</p>
        <div class="import-actions">
          <el-button type="primary" :icon="Download" @click="handleDownloadTemplate">
            {{ $t('crm.inquirySources.downloadTemplate') }}
          </el-button>
        </div>
        <el-divider />
        <div class="upload-wrapper">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls,.csv"
            :on-change="handleFileChange"
          >
            <template #trigger>
              <el-button type="info" :icon="Upload">{{ $t('hr.attendance.selectFile') }}</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">{{ $t('hr.attendance.importTip') }}</div>
            </template>
          </el-upload>
          <div v-if="importFile" class="file-name">
            <el-icon><Document /></el-icon>
            {{ importFile.name }}
          </div>
        </div>
      </div>
      <!-- 导入结果 -->
      <div v-if="importResult" class="import-result">
        <el-alert
          :title="`${$t('crm.inquirySources.imported')}: ${importResult.imported} / ${$t('crm.inquirySources.updated')}: ${importResult.updated} / ${$t('crm.inquirySources.skipped')}: ${importResult.skipped}`"
          :type="importResult.errors.length ? 'warning' : 'success'"
          :closable="false"
        />
        <div v-if="importResult.errors.length" class="error-list">
          <div v-for="(err, i) in importResult.errors" :key="i" class="error-item">{{ err }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showImportDialog = false; importResult = null; importFile = null">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button type="primary" :loading="importing" :disabled="!importFile" @click="handleImport">
          {{ $t('hr.attendance.import') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { Connection, Plus, Upload, Download, Edit, Delete, Document } from '@element-plus/icons-vue'
import { getCrmInquirySources, createCrmInquirySource, updateCrmInquirySource, deleteCrmInquirySource,
  importCrmInquirySources, downloadInquirySourcesTemplate,
  type CrmInquirySource } from '../../api/crm'
import { getEmployees } from '../../api/employees'
import { useUserStore } from '../../store/user'
import type { WebsiteType } from '../../api/crm'

const { t } = useI18n()
const userStore = useUserStore()

const isAdmin = computed(() => {
  return userStore.userInfo?.role === 'super_admin' || userStore.userInfo?.role === 'department_head'
})

const loading = ref(false)
const saving = ref(false)
const importing = ref(false)
const sources = ref<CrmInquirySource[]>([])
const salesUsers = ref<{ id: number; username: string; nickname: string }[]>([])
const showDialog = ref(false)
const showImportDialog = ref(false)
const editingSource = ref<CrmInquirySource | null>(null)
const formRef = ref<FormInstance>()
const sourceTableRef = ref<TableInstance>()
const importFile = ref<File | null>(null)
const importResult = ref<{ imported: number; updated: number; skipped: number; errors: string[] } | null>(null)

const websiteTypes: Record<string, string> = {
  official: '官网',
  b2b_portal: 'B2B平台',
  alibaba: '阿里国际站',
  made_in_china: '中国制造网',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  other: '其他',
}

const form = ref({
  name: '',
  websiteType: 'official' as WebsiteType,
  websiteUrl: '',
  autoAssignEnabled: false,
  defaultCountry: '',
  assignedDepartment: '',
  assignedToUserId: undefined as number | undefined,
  isActive: true,
  apiEndpoint: '',
  apiKey: '',
  webhookUrl: '',
  notes: '',
})

const formRules: FormRules = {
  name: [{ required: true, message: t('crm.inquirySources.nameRequired'), trigger: 'blur' }],
}

const activeCount = computed(() => sources.value.filter(s => s.isActive).length)
const autoAssignCount = computed(() => sources.value.filter(s => s.autoAssignEnabled).length)

const getOwnerName = (ownerId: number | null | undefined): string => {
  if (!ownerId) return '-'
  const user = salesUsers.value.find(u => u.id === ownerId)
  return user?.nickname || user?.username || '-'
}

const formatDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'

/** 兼容接口直接返回数组或 { data: [] } */
function normalizeInquiryList(raw: unknown): CrmInquirySource[] {
  if (Array.isArray(raw)) return raw as CrmInquirySource[]
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: CrmInquirySource[] }).data
  }
  return []
}

const getRowKey = (row: CrmInquirySource) => (row.id != null ? row.id : `name:${row.name}`)

const loadSources = async () => {
  loading.value = true
  try {
    const raw = await getCrmInquirySources()
    sources.value = normalizeInquiryList(raw)
  } catch (error: any) { ElMessage.error(error?.message || t('common.error')) }
  finally {
    loading.value = false
    await nextTick()
    await nextTick()
    sourceTableRef.value?.doLayout?.()
  }
}

const loadSalesUsers = async () => {
  try {
    const employees = await getEmployees()
    salesUsers.value = employees.map((e: any) => ({
      id: e.id, username: e.username, nickname: e.nickname,
    }))
  } catch {}
}

const handleAdd = () => {
  editingSource.value = null
  form.value = {
    name: '', websiteType: 'official', websiteUrl: '',
    autoAssignEnabled: false, defaultCountry: '', assignedDepartment: '',
    assignedToUserId: undefined, isActive: true,
    apiEndpoint: '', apiKey: '', webhookUrl: '', notes: '',
  }
  showDialog.value = true
}

const handleEdit = (row: CrmInquirySource) => {
  editingSource.value = row
  form.value = {
    name: row.name,
    websiteType: (row.websiteType as WebsiteType) || 'official',
    websiteUrl: row.websiteUrl || '',
    autoAssignEnabled: row.autoAssignEnabled || false,
    defaultCountry: row.defaultCountry || '',
    assignedDepartment: row.assignedDepartment || '',
    assignedToUserId: row.assignedToUserId ?? undefined,
    isActive: row.isActive !== false,
    apiEndpoint: row.apiEndpoint || '',
    apiKey: row.apiKey || '',
    webhookUrl: row.webhookUrl || '',
    notes: row.notes || '',
  }
  showDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saving.value = true
    const data: any = {
      name: form.value.name,
      websiteType: form.value.websiteType,
      websiteUrl: form.value.websiteUrl || undefined,
      autoAssignEnabled: form.value.autoAssignEnabled,
      defaultCountry: form.value.defaultCountry || undefined,
      assignedDepartment: form.value.assignedDepartment || undefined,
      assignedToUserId: form.value.assignedToUserId || undefined,
      isActive: form.value.isActive,
      apiEndpoint: form.value.apiEndpoint || undefined,
      apiKey: form.value.apiKey || undefined,
      webhookUrl: form.value.webhookUrl || undefined,
      notes: form.value.notes || undefined,
    }
    if (editingSource.value) {
      await updateCrmInquirySource(editingSource.value.id, data)
    } else {
      await createCrmInquirySource(data)
    }
    ElMessage.success(t('common.success'))
    showDialog.value = false
    loadSources()
  } catch (error: any) { if (error !== false) ElMessage.error(error.message || t('common.error')) }
  finally { saving.value = false }
}

const handleDelete = async (row: CrmInquirySource) => {
  try {
    await ElMessageBox.confirm(t('crm.inquirySources.deleteConfirm'), t('common.warning'), { type: 'warning' })
    await deleteCrmInquirySource(row.id)
    ElMessage.success(t('common.success'))
    loadSources()
  } catch (error: any) { if (error !== 'cancel') ElMessage.error(error.message || t('common.error')) }
}

onMounted(() => { loadSources(); loadSalesUsers() })

const handleFileChange = (file: any) => {
  importFile.value = file.raw as File
}

const handleDownloadTemplate = async () => {
  try {
    const res = await downloadInquirySourcesTemplate()
    const link = document.createElement('a')
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.buffer}`
    link.download = res.filename
    link.click()
  } catch (e: any) { ElMessage.error(e?.message || t('common.error')) }
}

const handleImport = async () => {
  if (!importFile.value) return
  importing.value = true
  try {
    const result = await importCrmInquirySources(importFile.value)
    importResult.value = result
    if (!result.errors.length) {
      ElMessage.success(t('hr.attendance.importSuccess'))
      loadSources()
    } else if (result.imported === 0 && result.updated === 0) {
      ElMessage.warning(t('common.error'))
    } else {
      ElMessage.warning(`${t('hr.attendance.importSuccess')}，${result.skipped} 条跳过`)
    }
  } catch (e: any) { ElMessage.error(e?.message || t('common.error')) }
  finally { importing.value = false }
}
</script>

<style scoped lang="scss">
.inquiry-source-module {
  .module-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    /* 避免父级裁剪导致 el-table 表体不可见 */
    :deep(.el-card__body) {
      overflow: visible;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      color: #1d1d1f;
      .header-left { display: flex; align-items: center; gap: 8px; }
      .header-actions { display: flex; align-items: center; gap: 8px; }
    }

    .stats-row {
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
          &.info { color: #409eff; }
        }
        .stat-label {
          font-size: 12px;
          color: #86868b;
          margin-top: 4px;
        }
      }
    }

    .source-name {
      display: flex;
      align-items: center;
      .ml-8 { margin-left: 8px; }
    }

    .inquiry-source-table {
      margin-top: 4px;
    }
  }

  .import-section {
    .import-tip {
      font-size: 13px;
      color: #86868b;
      margin-bottom: 12px;
    }
    .import-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    .upload-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .file-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #409eff;
      padding: 8px 12px;
      background: #ecf5ff;
      border-radius: 8px;
    }
  }
  .import-result {
    margin-top: 16px;
    .error-list {
      margin-top: 8px;
      max-height: 160px;
      overflow-y: auto;
      .error-item {
        font-size: 12px;
        color: #f56c6c;
        padding: 2px 0;
      }
    }
  }
}
</style>
