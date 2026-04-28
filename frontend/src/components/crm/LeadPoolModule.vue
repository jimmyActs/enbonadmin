<template>
  <div class="lead-pool-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Grid /></el-icon>
            <span>{{ $t('crm.leadPool.title') }}</span>
            <el-tag type="warning" size="small">{{ $t('crm.leadPool.tip') }}</el-tag>
          </div>
          <el-button
            v-if="canClaim"
            type="success"
            :icon="Plus"
            @click="handleAutoAssign"
            :loading="autoAssigning"
          >
            {{ $t('crm.leadPool.autoAssign') }}
          </el-button>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-input
          v-model="searchText"
          :placeholder="$t('crm.leadPool.searchPlaceholder')"
          clearable
          style="width: 240px; margin-right: 12px;"
          @input="debouncedLoad"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select
          v-model="countryFilter"
          :placeholder="$t('crm.leadPool.allCountries')"
          clearable
          filterable
          allow-create
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('crm.leadPool.allCountries')" value="" />
          <el-option v-for="c in countries" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select
          v-model="sourceFilter"
          :placeholder="$t('crm.leads.filterBySource')"
          clearable
          filterable
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('crm.leads.allSources')" value="" />
          <el-option v-for="(label, key) in leadSources" :key="key" :label="label" :value="key" />
        </el-select>
        <el-select
          v-model="priorityFilter"
          :placeholder="$t('crm.leadPool.allPriorities')"
          clearable
          style="width: 130px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('crm.leadPool.allPriorities')" value="" />
          <el-option v-for="(label, key) in leadPriorities" :key="key" :label="label" :value="key" />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">{{ $t('common.reset') }}</el-button>
      </div>

      <!-- 统计 -->
      <div class="pool-stats">
        <div class="pool-stat-item">
          <span class="stat-label">{{ $t('crm.leads.total') }}</span>
          <span class="stat-value">{{ total }}</span>
        </div>
      </div>

      <!-- 公海商机列表 -->
      <el-table
        :data="poolLeads"
        stripe
        v-loading="loading"
        row-key="id"
        class="pool-table"
      >
        <el-table-column prop="leadCode" :label="$t('crm.leads.leadCode')" width="170">
          <template #default="{ row }">
            <span class="lead-code">{{ row.leadCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="contactName" :label="$t('crm.leads.contactName')" min-width="150">
          <template #default="{ row }">
            <div class="lead-contact">
              <div class="contact-name">{{ row.contactName || '-' }}</div>
              <div class="contact-company">{{ row.companyName || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="country" :label="$t('sales.customers.country')" width="110" />
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
        <el-table-column prop="inquiryContent" :label="$t('crm.leads.inquiryContent')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="sourceDetail" :label="$t('crm.leads.sourceDetail')" width="130" show-overflow-tooltip />
        <el-table-column prop="poolTime" :label="$t('crm.leadPool.poolTime')" width="150">
          <template #default="{ row }">{{ formatDate(row.poolTime) }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canClaim"
              type="success"
              size="small"
              :icon="Plus"
              @click="handleClaim(row)"
              :loading="claimingId === row.id"
            >
              {{ $t('crm.leadPool.claim') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="loadLeadPool"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Grid, Search, Refresh, Plus } from '@element-plus/icons-vue'
import { getCrmLeadPool, claimCrmLeadFromPool, autoAssignCrmLeadPool, type CrmLead } from '../../api/crm'
import { useUserStore } from '../../store/user'
import { CRM_COUNTRIES } from '../../utils/crm-countries'

const { t, locale } = useI18n()
const userStore = useUserStore()

const canClaim = computed(() => userStore.hasPermission('crm.lead.pool') || userStore.userInfo?.role === 'super_admin')

const loading = ref(false)
const autoAssigning = ref(false)
const claimingId = ref<number | null>(null)
const poolLeads = ref<CrmLead[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchText = ref('')
const countryFilter = ref('')
const sourceFilter = ref('')
const priorityFilter = ref('')

const countries = ref<string[]>(CRM_COUNTRIES)

const leadSources: Record<string, string> = {
  official_website: locale.value === 'zh-CN' ? '官网询盘' : 'Website',
  exhibition: locale.value === 'zh-CN' ? '展会' : 'Exhibition',
  referral: locale.value === 'zh-CN' ? '朋友推荐' : 'Referral',
  social_media: locale.value === 'zh-CN' ? '社媒询盘' : 'Social Media',
  cold_call: locale.value === 'zh-CN' ? '电话开拓' : 'Cold Call',
  website: locale.value === 'zh-CN' ? '其他网站' : 'Other Website',
  partner: locale.value === 'zh-CN' ? '合作伙伴' : 'Partner',
  other: locale.value === 'zh-CN' ? '其他' : 'Other',
}

const leadPriorities: Record<string, string> = {
  low: locale.value === 'zh-CN' ? '低' : 'Low',
  normal: locale.value === 'zh-CN' ? '普通' : 'Normal',
  high: locale.value === 'zh-CN' ? '高' : 'High',
  urgent: locale.value === 'zh-CN' ? '紧急' : 'Urgent',
}

const leadPrioritiesEn: Record<string, string> = {
  low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent',
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
const debouncedLoad = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; loadLeadPool() }, 400)
}

const handleFilter = () => { currentPage.value = 1; loadLeadPool() }

const resetFilter = () => {
  searchText.value = ''
  countryFilter.value = ''
  sourceFilter.value = ''
  priorityFilter.value = ''
  currentPage.value = 1
  loadLeadPool()
}

const loadLeadPool = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (searchText.value) params.keyword = searchText.value
    if (countryFilter.value) params.country = countryFilter.value
    if (sourceFilter.value) params.source = sourceFilter.value
    if (priorityFilter.value) params.priority = priorityFilter.value
    const res = await getCrmLeadPool(params)
    poolLeads.value = res.data
    total.value = res.total
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const getSourceLabel = (source: string) => leadSources[source] || source

const getPriorityLabel = (p: string) => {
  if (locale.value === 'en-US') return leadPrioritiesEn[p] || p
  return leadPriorities[p] || p
}

const getPriorityType = (p: string): string => {
  const typeMap: Record<string, string> = {
    low: 'info', normal: '', high: 'warning', urgent: 'danger',
  }
  return typeMap[p] || 'info'
}

const formatDate = (d: string | null | undefined) => {
  if (!d) return '-'
  return new Date(d).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US')
}

const handleClaim = async (lead: CrmLead) => {
  try {
    await ElMessageBox.confirm(
      t('crm.leadPool.claimConfirm'),
      t('crm.leadPool.claim'),
      { type: 'info', confirmButtonText: t('common.confirm') }
    )
    claimingId.value = lead.id
    await claimCrmLeadFromPool(lead.id)
    ElMessage.success(t('crm.leadPool.claimSuccess', { name: lead.companyName || lead.contactName }))
    await loadLeadPool()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || t('common.error'))
  } finally {
    claimingId.value = null
  }
}

const handleAutoAssign = async () => {
  try {
    await ElMessageBox.confirm(
      t('crm.leadPool.autoAssignConfirm'),
      t('crm.leadPool.autoAssign'),
      { type: 'warning', confirmButtonText: t('common.confirm') }
    )
    autoAssigning.value = true
    const result = await autoAssignCrmLeadPool()
    ElMessage.success(t('crm.leadPool.autoAssignSuccess', { count: result.assigned, remaining: result.remaining }))
    await loadLeadPool()
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || t('common.error'))
  } finally {
    autoAssigning.value = false
  }
}

onMounted(() => { loadLeadPool() })
</script>

<style scoped lang="scss">
.lead-pool-module {
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
  .pool-stats {
    display: flex; gap: 16px; margin-bottom: 16px;
    .pool-stat-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; background: #fff7e6; border-radius: 8px;
      .stat-label { font-size: 13px; color: #6b7280; }
      .stat-value { font-size: 18px; font-weight: 700; color: #f59e0b; }
    }
  }
  .lead-code { font-family: 'Courier New', monospace; font-size: 12px; color: #64748b; }
  .lead-contact {
    .contact-name { font-weight: 600; color: #1f2329; }
    .contact-company { font-size: 12px; color: #64748b; margin-top: 2px; }
  }
}
</style>
