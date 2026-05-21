<template>
  <div class="lead-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><TrendCharts /></el-icon>
            <span>{{ $t('crm.leads.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            {{ $t('crm.leads.addLead') }}
          </el-button>
        </div>
      </template>

      <!-- 筛选 -->
      <div class="filter-bar">
        <el-input v-model="searchText" :placeholder="$t('crm.leads.searchPlaceholder')" clearable
          style="width: 240px; margin-right: 12px;" @input="debouncedLoad">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="sourceFilter" :placeholder="$t('crm.leads.filterBySource')" clearable filterable
          style="width: 150px; margin-right: 12px;" @change="handleFilter">
          <el-option :label="$t('crm.leads.allSources')" value="" />
          <el-option v-for="(label, key) in leadSources" :key="key" :label="label" :value="key" />
        </el-select>
        <el-select v-model="statusFilter" :placeholder="$t('crm.leads.status')" clearable
          style="width: 150px; margin-right: 12px;" @change="handleFilter">
          <el-option :label="$t('crm.leads.allStatuses')" value="" />
          <el-option :label="$t('crm.leads.statuses.new')" value="new" />
          <el-option :label="$t('crm.leads.statuses.qualified')" value="qualified" />
          <el-option :label="$t('crm.leads.statuses.contacted')" value="contacted" />
          <el-option :label="$t('crm.leads.statuses.proposal')" value="proposal" />
          <el-option :label="$t('crm.leads.statuses.negotiating')" value="negotiating" />
          <el-option :label="$t('crm.leads.statuses.won')" value="won" />
          <el-option :label="$t('crm.leads.statuses.lost')" value="lost" />
          <el-option :label="$t('crm.leads.statuses.converted')" value="converted" />
          <el-option :label="$t('crm.leads.statuses.invalid')" value="invalid" />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">{{ $t('common.reset') }}</el-button>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="12" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">{{ $t('crm.leads.total') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-new">
            <div class="stat-value">{{ stats.newLeads }}</div>
            <div class="stat-label">{{ $t('crm.leads.newLeads') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-qualified">
            <div class="stat-value">{{ stats.qualified }}</div>
            <div class="stat-label">{{ $t('crm.leads.qualified') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-won">
            <div class="stat-value">{{ stats.won }}</div>
            <div class="stat-label">{{ $t('crm.leads.won') }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- 商机列表 -->
      <el-table :data="leads" stripe v-loading="loading" row-key="id" class="lead-table">
        <el-table-column prop="leadCode" :label="$t('crm.leads.leadCode')" width="170">
          <template #default="{ row }">
            <span class="lead-code">{{ row.leadCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="contactName" :label="$t('crm.leads.contactName')" min-width="140">
          <template #default="{ row }">
            <div class="lead-contact">
              <div class="contact-name">{{ row.contactName || '-' }}</div>
              <div class="contact-company">{{ row.companyName || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="country" :label="$t('sales.customers.country')" width="100" />
        <el-table-column prop="source" :label="$t('crm.leads.source')" width="130">
          <template #default="{ row }">
            <el-tag size="small">{{ getSourceLabel(row.source) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" :label="$t('crm.leads.priority')" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="getPriorityType(row.priority)">{{ getPriorityLabel(row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('crm.leads.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="isAdmin" prop="assignedTo" :label="$t('crm.leads.assignedTo')" width="120">
          <template #default="{ row }">
            <span>{{ row.assignedToName || getOwnerName(row.assignedTo) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="inquiryContent" :label="$t('crm.leads.inquiryContent')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="lastFollowUpAt" :label="$t('crm.leads.lastFollowUp')" width="150">
          <template #default="{ row }">{{ formatDate(row.lastFollowUpAt) }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)" v-if="canEditLead(row)">{{ $t('common.edit') }}</el-button>
            <el-button type="success" size="small" :icon="Check" @click="handleConvert(row)" v-if="row.status !== 'converted' && row.status !== 'lost' && canEditLead(row)">
              {{ $t('crm.leads.convertToCustomer') }}
            </el-button>
            <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)" v-if="isAdmin">{{ $t('common.delete') }}</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('common.noData')" :image-size="80" />
        </template>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="loadLeads"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 添加/编辑商机对话框 -->
    <el-dialog v-model="showDialog" :title="editingLead ? $t('crm.leads.editLead') : $t('crm.leads.addLead')"
      width="800px" :close-on-click-modal="false"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <el-form ref="leadFormRef" :model="leadForm" :rules="leadRules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.leads.contactName')" prop="contactName">
              <el-input v-model="leadForm.contactName" :placeholder="$t('crm.leads.contactNamePlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.leads.companyName')">
              <el-input v-model="leadForm.companyName" :placeholder="$t('crm.leads.companyNamePlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('sales.customers.country')">
              <el-select v-model="leadForm.country" filterable allow-create default-first-option
                :placeholder="$t('sales.customers.countryPlaceholder')" style="width: 100%">
                <el-option v-for="c in countries" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.leads.phone')">
              <el-input v-model="leadForm.phone" :placeholder="locale === 'zh-CN' ? '请输入电话号码' : 'Enter phone number'" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.leads.email')">
              <el-input v-model="leadForm.email" :placeholder="locale === 'zh-CN' ? '请输入邮箱地址' : 'Enter email address'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.leads.source')">
              <el-select v-model="leadForm.source" :placeholder="$t('crm.leads.sourcePlaceholder')" style="width: 100%">
                <el-option v-for="(label, key) in leadSources" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.leads.priority')">
              <el-select v-model="leadForm.priority" style="width: 100%">
                <el-option v-for="(label, key) in leadPriorities" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.leads.status')">
              <el-select v-model="leadForm.status" style="width: 100%">
                <el-option v-for="(label, key) in leadStatuses" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="isAdmin" :gutter="16">
          <el-col :span="24">
            <el-form-item :label="$t('crm.leads.assignedTo')">
              <el-select
                v-model="leadForm.assignedTo"
                :placeholder="$t('crm.leads.assignedToPlaceholder')"
                clearable
                filterable
                style="width: 100%;"
              >
                <el-option :label="$t('crm.leads.unassigned')" :value="0" />
                <el-option
                  v-for="user in salesUsers"
                  :key="user.id"
                  :label="user.nickname || user.username"
                  :value="user.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('crm.leads.inquiryContent')">
          <el-input v-model="leadForm.inquiryContent" type="textarea" :rows="3"
            :placeholder="$t('crm.leads.inquiryContentPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('sales.customers.notes')">
          <el-input v-model="leadForm.notes" type="textarea" :rows="2" :placeholder="$t('sales.customers.notesPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { TrendCharts, Plus, Search, Refresh, Edit, Delete, Check } from '@element-plus/icons-vue'
import { getCrmLeads, createCrmLead, updateCrmLead, deleteCrmLead, convertCrmLead, getCrmLeadStats,
  type CrmLead, type CrmLeadStat } from '../../api/crm'
import { getEmployeeOptions } from '../../api/employees'
import { CRM_COUNTRIES } from '../../utils/crm-countries'
import { useUserStore } from '../../store/user'

const { t, locale } = useI18n()
const userStore = useUserStore()

const isAdmin = computed(() => {
  // 超级管理员 / 部门负责人 / HR总监 都视为管理员
  return userStore.userInfo?.isSuperAdmin === true ||
    userStore.userInfo?.role === 'super_admin' ||
    userStore.userInfo?.role === 'department_head' ||
    userStore.userInfo?.role === 'hr_director'
})

// 判断用户是否可以编辑某条商机（assignedTo 负责人 或 管理员可编辑）
const canEditLead = (lead: CrmLead): boolean => {
  if (isAdmin.value) return true
  return lead.assignedTo === userStore.userInfo?.id || lead.createdBy === userStore.userInfo?.id
}

const loading = ref(false)
const saving = ref(false)
const leads = ref<CrmLead[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchText = ref('')
const sourceFilter = ref('')
const statusFilter = ref('')
const showDialog = ref(false)
const editingLead = ref<CrmLead | null>(null)
const leadFormRef = ref<FormInstance>()
const stats = ref<CrmLeadStat>({ total: 0, newLeads: 0, qualified: 0, won: 0 })

const countries = ref<string[]>(CRM_COUNTRIES)
const salesUsers = ref<{ id: number; nickname: string }[]>([])

const leadSources = computed<Record<string, string>>(() => ({
  official_website: t('crm.leads.sources.official_website'),
  exhibition: t('crm.leads.sources.exhibition'),
  referral: t('crm.leads.sources.referral'),
  social_media: t('crm.leads.sources.social_media'),
  cold_call: t('crm.leads.sources.cold_call'),
  website: t('crm.leads.sources.website'),
  partner: t('crm.leads.sources.partner'),
  other: t('crm.leads.sources.other'),
}))

const leadStatuses = computed<Record<string, string>>(() => ({
  new: t('crm.leads.statuses.new'),
  qualified: t('crm.leads.statuses.qualified'),
  contacted: t('crm.leads.statuses.contacted'),
  proposal: t('crm.leads.statuses.proposal'),
  negotiating: t('crm.leads.statuses.negotiating'),
  won: t('crm.leads.statuses.won'),
  lost: t('crm.leads.statuses.lost'),
  converted: t('crm.leads.statuses.converted'),
  invalid: t('crm.leads.statuses.invalid'),
}))

const leadStatusesEn: Record<string, string> = {
  new: 'New', qualified: 'Qualified', contacted: 'Contacted', proposal: 'Quoted',
  negotiating: 'Negotiating', won: 'Won', lost: 'Lost', converted: 'Converted', invalid: 'Invalid',
}

const leadPriorities = computed<Record<string, string>>(() => ({
  low: t('crm.leads.priorities.low'),
  normal: t('crm.leads.priorities.normal'),
  high: t('crm.leads.priorities.high'),
  urgent: t('crm.leads.priorities.urgent'),
}))

// 状态标签类型映射（解决空字符串问题）
const leadStatusTagTypeMap: Record<string, string> = {
  new: 'info',
  qualified: 'success',
  contacted: 'primary',
  proposal: 'warning',
  negotiating: 'warning',
  won: 'success',
  lost: 'danger',
  converted: 'success',
  invalid: 'info',
}

const leadForm = ref({
  contactName: '', companyName: '', country: '', phone: '', email: '',
  source: 'official_website', priority: 'normal', status: 'new',
  assignedTo: undefined as number | undefined,
  inquiryContent: '', notes: '',
})

const leadRules: FormRules = {
  contactName: [{ required: true, message: t('crm.leads.contactNameRequired'), trigger: 'blur' }],
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
const debouncedLoad = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; loadLeads() }, 400)
}

const handleFilter = () => { currentPage.value = 1; loadLeads() }

const resetFilter = () => {
  searchText.value = ''; sourceFilter.value = ''; statusFilter.value = ''
  currentPage.value = 1; loadLeads()
}

const loadStats = async () => {
  try { stats.value = await getCrmLeadStats() } catch {}
}

const loadLeads = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (searchText.value) params.keyword = searchText.value
    if (sourceFilter.value) params.source = sourceFilter.value
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getCrmLeads(params)
    leads.value = res.data
    total.value = res.total
  } catch (error: any) { ElMessage.error(error?.message || t('common.error')) }
  finally { loading.value = false }
}

const getSourceLabel = (source: string) => leadSources.value[source] || source
const getPriorityLabel = (p: string) => leadPriorities.value[p] || p
const getPriorityType = (p: string): string => ({ low: 'info', normal: '', high: 'warning', urgent: 'danger' }[p] || 'info')
const getStatusLabel = (s: string) => {
  if (locale.value === 'en-US') return leadStatusesEn[s] || s
  return leadStatuses.value[s] || s
}
const getStatusTagType = (s: string): string => {
  return leadStatusTagTypeMap[s] || 'info'
}
const formatDate = (d: string | null | undefined) => d ? new Date(d).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US') : '-'

const getOwnerName = (ownerId: number | null | undefined): string => {
  if (!ownerId) return '-'
  return String(ownerId)
}

const loadSalesUsers = async () => {
  try {
    const employees = await getEmployeeOptions()
    salesUsers.value = employees.map((e: any) => ({
      id: e.id, nickname: e.nickname,
    }))
  } catch {}
}

const handleAdd = () => {
  editingLead.value = null
  leadForm.value = { contactName: '', companyName: '', country: '', phone: '', email: '',
    source: 'official_website', priority: 'normal', status: 'new',
    assignedTo: undefined, inquiryContent: '', notes: '' }
  showDialog.value = true
}

const handleEdit = (lead: CrmLead) => {
  editingLead.value = lead
  leadForm.value = {
    contactName: lead.contactName || '', companyName: lead.companyName || '', country: lead.country || '',
    phone: lead.phone || '', email: lead.email || '',
    source: lead.source as any || 'official_website', priority: lead.priority as any || 'normal',
    status: lead.status as any || 'new',
    assignedTo: lead.assignedTo ?? undefined,
    inquiryContent: lead.inquiryContent || '', notes: lead.notes || '',
  }
  showDialog.value = true
}

const handleSave = async () => {
  if (!leadFormRef.value) return
  try {
    await leadFormRef.value.validate()
    saving.value = true
    const data: any = {
      contactName: leadForm.value.contactName, companyName: leadForm.value.companyName || undefined,
      country: leadForm.value.country || undefined, phone: leadForm.value.phone || undefined,
      email: leadForm.value.email || undefined,
      source: leadForm.value.source, priority: leadForm.value.priority, status: leadForm.value.status,
      assignedTo: leadForm.value.assignedTo || undefined,
      inquiryContent: leadForm.value.inquiryContent || undefined, notes: leadForm.value.notes || undefined,
    }
    if (editingLead.value) {
      await updateCrmLead(editingLead.value.id, data)
    } else {
      await createCrmLead(data)
    }
    ElMessage.success(t('common.success'))
    showDialog.value = false
    await loadLeads()
    await loadStats()
  } catch (error: any) { if (error !== false) ElMessage.error(error.message || t('common.error')) }
  finally { saving.value = false }
}

const handleConvert = async (lead: CrmLead) => {
  try {
    await ElMessageBox.confirm(
      t('crm.leads.convertConfirm', { name: lead.companyName || lead.contactName }),
      t('crm.leads.convertToCustomer'), { type: 'info', confirmButtonText: t('common.confirm') }
    )
    const customer = await convertCrmLead(lead.id)
    const customerCode = customer.customerCode || 'N/A'
    ElMessage.success(t('crm.leads.convertSuccess', { code: customerCode }))

    // 引导下一步：询问是否立即创建报价单
    const createQuotation = await ElMessageBox.confirm(
      t('crm.leads.createQuotationPrompt', { code: customerCode }),
      t('crm.leads.nextStep'),
      { confirmButtonText: t('crm.leads.createQuotationNow') || '立即创建报价单', cancelButtonText: t('common.no') || '暂不需要', type: 'success' }
    ).then(() => true).catch(() => false)

    if (createQuotation) {
      // 预填报价单数据（使用 localStorage 跨路由传递）
      localStorage.setItem('pending_quotation_from_lead', JSON.stringify({
        customerId: customer.id,
        customerName: customer.customerName,
        estimatedRevenue: customer.estimatedRevenue,
        source: customer.inquirySource,
      }))
      // 跳转到 Sales 视图报价单标签
      window.location.href = '/sales?tab=quotations'
    }

    await loadLeads()
    await loadStats()
  } catch (error: any) { if (error !== 'cancel') ElMessage.error(error.message || t('common.error')) }
}

const handleDelete = async (lead: CrmLead) => {
  try {
    await ElMessageBox.confirm(
      t('crm.leads.deleteConfirm', { name: lead.contactName }),
      t('common.warning'), { type: 'warning' }
    )
    await deleteCrmLead(lead.id)
    ElMessage.success(t('common.success'))
    await loadLeads()
    await loadStats()
  } catch (error: any) { if (error !== 'cancel') ElMessage.error(error.message || t('common.error')) }
}

onMounted(() => { loadLeads(); loadStats(); if (isAdmin.value) loadSalesUsers() })

onBeforeUnmount(() => { if (searchTimer) clearTimeout(searchTimer) })
</script>

<style scoped lang="scss">
.lead-module {
  .module-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    background: #fff;
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      color: #1d1d1f;
      .header-left { display: flex; align-items: center; gap: 8px; }
    }
  }
  .filter-bar {
    display: flex; align-items: center; margin-bottom: 16px;
    padding: 16px; background: #f5f5f7; border-radius: 12px; flex-wrap: wrap; gap: 12px;
    :deep(.el-input__wrapper), :deep(.el-select .el-input__wrapper) {
      border-radius: 10px; border-color: #e5e5e7; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .el-button { border-radius: 10px; font-weight: 500; }
  }
  .stats-row { margin-bottom: 16px; }
  .stat-card {
    padding: 16px; border-radius: 12px; background: #f5f5f7; text-align: center;
    .stat-value { font-size: 24px; font-weight: 700; color: #1f2329; }
    .stat-label { font-size: 13px; color: #6b7280; margin-top: 4px; }
    &.stat-new { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); .stat-value, .stat-label { color: #fff; } }
    &.stat-qualified { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); .stat-value, .stat-label { color: #fff; } }
    &.stat-won { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); .stat-value, .stat-label { color: #fff; } }
  }
  .lead-code { font-family: 'Courier New', monospace; font-size: 12px; color: #64748b; }
  .lead-contact {
    .contact-name { font-weight: 600; color: #1f2329; }
    .contact-company { font-size: 12px; color: #64748b; margin-top: 2px; }
  }
}
</style>
