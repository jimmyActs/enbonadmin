<template>
  <div class="pool-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Grid /></el-icon>
            <span>{{ $t('crm.pool.title') }}</span>
            <el-tag type="warning" size="small">{{ $t('crm.pool.tip') }}</el-tag>
          </div>
        </div>
      </template>

      <div class="filter-bar">
        <el-input v-model="searchText" :placeholder="$t('crm.pool.searchPlaceholder')" clearable
          style="width: 240px; margin-right: 12px;" @input="debouncedLoad">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="countryFilter" :placeholder="$t('sales.customers.country')" clearable filterable allow-create
          style="width: 150px; margin-right: 12px;" @change="handleFilter">
          <el-option :label="$t('crm.pool.allCountries')" value="" />
          <el-option v-for="c in countries" :key="c" :label="c" :value="c" />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">{{ $t('common.reset') }}</el-button>
      </div>

      <el-table :data="poolCustomers" stripe v-loading="loading" row-key="id" class="pool-table">
        <el-table-column prop="customerCode" :label="$t('crm.customers.customerCode')" width="170">
          <template #default="{ row }"><span class="customer-code">{{ row.customerCode }}</span></template>
        </el-table-column>
        <el-table-column prop="customerName" :label="$t('sales.customers.customerName')" min-width="160">
          <template #default="{ row }">
            <div>
              <div class="customer-name">{{ row.customerName }}</div>
              <div class="company-name" v-if="row.companyName">{{ row.companyName }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="country" :label="$t('sales.customers.country')" width="110" />
        <el-table-column prop="inquirySource" :label="$t('crm.customers.inquirySource')" width="130">
          <template #default="{ row }">
            {{ getInquirySourceLabel(row.inquirySource) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('crm.customers.starRating')" width="100">
          <template #default="{ row }">
            <span class="star-rating">{{ renderStars(row.starRating) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('sales.customers.status')" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="poolTime" :label="$t('crm.pool.poolTime')" width="150">
          <template #default="{ row }">{{ formatDate(row.poolTime) }}</template>
        </el-table-column>
        <el-table-column prop="poolReason" :label="$t('crm.pool.poolReason')" width="140">
          <template #default="{ row }">
            <el-tag size="small" type="warning">{{ getPoolReasonLabel(row.poolReason) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastContact" :label="$t('crm.customers.lastContact')" width="150">
          <template #default="{ row }">{{ formatDate(row.lastContact) }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" :icon="Pointer" @click="handleClaim(row)">
              {{ $t('crm.pool.claim') }}
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
        @current-change="loadPool"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Grid, Search, Refresh, Pointer } from '@element-plus/icons-vue'
import { getCrmPool, claimCrmFromPool, type CrmCustomer } from '../../api/crm'
import { CRM_COUNTRIES } from '../../utils/crm-countries'

const { t, locale } = useI18n()
const loading = ref(false)
const poolCustomers = ref<CrmCustomer[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchText = ref('')
const countryFilter = ref('')
const countries = ref<string[]>(CRM_COUNTRIES)

const inquirySources: Record<string, string> = {
  official_website: '官网询盘', exhibition: '展会', referral: '朋友推荐',
  social_media: '社媒询盘', cold_call: '电话开拓', website: '其他网站', partner: '合作伙伴', other: '其他',
}

const customerStatuses: Record<string, string> = {
  new: '新建', contacting: '跟进中', negotiating: '谈判中', closed: '已成交', lost: '已流失',
}

const poolReasons: Record<string, string> = {
  no_activity_30_days: '30天未跟进', owner_resigned: '负责人离职',
  manual_release: '手动释放', duplicate_release: '重复客户释放', supervisor_release: '主管释放',
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
const debouncedLoad = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; loadPool() }, 400)
}
const handleFilter = () => { currentPage.value = 1; loadPool() }
const resetFilter = () => { searchText.value = ''; countryFilter.value = ''; currentPage.value = 1; loadPool() }

const loadPool = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (searchText.value) params.keyword = searchText.value
    if (countryFilter.value) params.country = countryFilter.value
    const res = await getCrmPool(params)
    poolCustomers.value = res.data
    total.value = res.total
    const set = new Set(countries.value)
    res.data.forEach((c) => { if (c.country) set.add(c.country) })
    countries.value = Array.from(set)
  } catch (error: any) { ElMessage.error(error?.message || t('common.error')) }
  finally { loading.value = false }
}

const handleClaim = async (customer: CrmCustomer) => {
  try {
    await claimCrmFromPool(customer.id)
    ElMessage.success(t('crm.pool.claimSuccess', { name: customer.customerName }))
    await loadPool()
  } catch (error: any) { ElMessage.error(error.message || t('common.error')) }
}

const getInquirySourceLabel = (s: string | null | undefined) => s ? (inquirySources[s] || s) : '-'
const getStatusType = (s: string) => ({ new: 'info', contacting: 'primary', negotiating: 'warning', closed: 'success', lost: 'danger' }[s] || 'info')
const getStatusText = (s: string) => customerStatuses[s] || s
const getPoolReasonLabel = (s: string | null | undefined) => s ? (poolReasons[s] || s) : '-'
const renderStars = (r: number) => '★'.repeat(r || 0) + '☆'.repeat(5 - (r || 0))
const formatDate = (d: string | null | undefined) => d ? new Date(d).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US') : '-'

onMounted(() => { loadPool() })

onBeforeUnmount(() => { if (searchTimer) clearTimeout(searchTimer) })
</script>

<style scoped lang="scss">
.pool-module {
  .module-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    background: #fff;
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      font-weight: 600; color: #1d1d1f;
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
  .customer-code { font-family: 'Courier New', monospace; font-size: 12px; color: #64748b; }
  .customer-name { font-weight: 600; color: #1f2329; }
  .company-name { font-size: 12px; color: #64748b; margin-top: 2px; }
  .star-rating { color: #f59e0b; font-size: 14px; }
}
</style>
