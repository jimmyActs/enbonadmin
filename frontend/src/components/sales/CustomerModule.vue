<template>
  <div class="customer-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><User /></el-icon>
            <span>{{ $t('sales.customers.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button type="info" :icon="UserFilled" @click="showDuplicateDialog = true">
              {{ $t('crm.customers.checkDuplicate') }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">
              {{ $t('sales.customers.addCustomer') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-bar">
        <el-input
          v-model="searchText"
          :placeholder="$t('sales.customers.searchPlaceholder')"
          clearable
          style="width: 240px; margin-right: 12px;"
          @input="debouncedLoad"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="countryFilter"
          :placeholder="$t('sales.customers.filterByCountry')"
          clearable filterable allow-create
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('sales.customers.all')" value="" />
          <el-option v-for="c in countries" :key="c" :label="c" :value="c" />
        </el-select>

        <el-select
          v-model="statusFilter"
          :placeholder="$t('sales.customers.filterByStatus')"
          clearable
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('sales.customers.all')" value="" />
          <el-option v-for="(label, key) in customerStatuses" :key="key" :label="label" :value="key" />
        </el-select>

        <el-select
          v-model="dealStatusFilter"
          :placeholder="$t('sales.customers.filterByDealStatus')"
          clearable
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('sales.customers.all')" value="" />
          <el-option v-for="(label, key) in dealStatuses" :key="key" :label="label" :value="key" />
        </el-select>

        <el-select
          v-model="starFilter"
          :placeholder="$t('crm.customers.filterByStar')"
          clearable
          style="width: 130px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('sales.customers.all')" value="" />
          <el-option v-for="s in [5,4,3,2,1]" :key="s" :label="renderStars(s) + ' ' + s + $t('crm.customers.stars')" :value="s" />
        </el-select>

        <el-select
          v-model="inquirySourceFilter"
          :placeholder="$t('crm.customers.filterBySource')"
          clearable filterable
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('sales.customers.all')" value="" />
          <el-option v-for="(label, key) in inquirySources" :key="key" :label="label" :value="key" />
        </el-select>

        <el-button :icon="Refresh" @click="resetFilter">
          {{ $t('common.reset') }}
        </el-button>
      </div>

      <!-- 客户列表 -->
      <el-table :data="filteredCustomers" stripe v-loading="loading" row-key="id">
        <el-table-column prop="customerCode" :label="$t('crm.customers.customerCode')" width="170">
          <template #default="{ row }">
            <span class="customer-code">{{ row.customerCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" :label="$t('sales.customers.customerName')" min-width="160">
          <template #default="{ row }">
            <div class="customer-name-cell">
              <div class="customer-name">{{ row.customerName }}</div>
              <div class="customer-tags-row" v-if="row.starRating || row.tags">
                <span v-if="row.starRating" class="star-rating" :title="$t('crm.customers.starRating')">
                  {{ renderStars(row.starRating) }}
                </span>
                <el-tag v-for="tag in parseTags(row.tags)" :key="tag" size="small" effect="plain" class="tag-item">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="country" :label="$t('sales.customers.country')" width="110" />
        <el-table-column prop="inquirySource" :label="$t('crm.customers.inquirySource')" width="130">
          <template #default="{ row }">
            {{ getInquirySourceLabel(row.inquirySource) }}
          </template>
        </el-table-column>
        <el-table-column prop="content" :label="$t('sales.customers.content')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" :label="$t('sales.customers.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dealStatus" :label="$t('sales.customers.dealStatus')" width="120">
          <template #default="{ row }">
            <el-tag :type="getDealStatusType(row.dealStatus)">{{ getDealStatusText(row.dealStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="estimatedRevenue" :label="$t('crm.customers.estimatedRevenue')" width="120">
          <template #default="{ row }">
            {{ row.estimatedRevenue ? '¥' + Number(row.estimatedRevenue).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="lastContact" :label="$t('sales.customers.lastContact')" width="160">
          <template #default="{ row }">
            {{ formatDate(row.lastContact) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('crm.customers.ownerTime')" width="170">
          <template #default="{ row }">
            <div class="owner-time-cell">
              <span class="time-label">{{ $t('crm.customers.assignedAt') }}:</span>
              <span>{{ formatDate(row.ownerAssignedAt) }}</span>
              <br />
              <span class="time-label">{{ $t('crm.customers.lastMaintainAt') }}:</span>
              <span>{{ formatDate(row.lastMaintainAt) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)">
              {{ $t('common.edit') }}
            </el-button>
            <el-button type="warning" size="small" :icon="Message" @click="handleRelease(row)" v-if="!row.isInPool">
              {{ $t('crm.pool.release') }}
            </el-button>
            <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">
              {{ $t('common.delete') }}
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
        @current-change="loadCustomers"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 添加/编辑客户对话框 -->
    <el-dialog
      v-model="showCustomerDialog"
      :title="editingCustomer ? $t('sales.customers.editCustomer') : $t('sales.customers.addCustomer')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="1000px"
      :close-on-click-modal="false"
      class="customer-dialog"
    >
      <el-form ref="customerFormRef" :model="customerForm" :rules="customerRules" label-width="130px">
        <!-- 基本信息 -->
        <div class="form-section-title">{{ $t('crm.customers.basicInfo') }}</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('sales.customers.customerName')" prop="customerName">
              <el-input v-model="customerForm.customerName" :placeholder="$t('sales.customers.customerNamePlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customers.companyName')" prop="companyName">
              <el-input v-model="customerForm.companyName" :placeholder="$t('crm.customers.companyNamePlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="$t('sales.customers.country')" prop="country">
              <el-select v-model="customerForm.country" filterable allow-create default-first-option
                :placeholder="$t('sales.customers.countryPlaceholder')" style="width: 100%">
                <el-option v-for="c in countries" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('crm.customers.phone')">
              <el-input v-model="customerForm.phone" placeholder="+1 xxx-xxxx-xxxx" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('crm.customers.email')">
              <el-input v-model="customerForm.email" placeholder="contact@company.com" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 客户属性 -->
        <div class="form-section-title">{{ $t('crm.customers.customerAttributes') }}</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.customers.starRating')">
              <div class="star-selector">
                <el-rate v-model="customerForm.starRating" :max="5" allow-half />
                <span class="star-hint">{{ customerForm.starRating }} {{ $t('crm.customers.stars') }}</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customers.inquirySource')">
              <el-select v-model="customerForm.inquirySource" filterable allow-create
                :placeholder="$t('crm.customers.inquirySourcePlaceholder')" style="width: 100%">
                <el-option v-for="(label, key) in inquirySources" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('crm.customers.tags')">
          <div class="tags-input-area">
            <el-tag
              v-for="tag in parseTags(customerForm.tags)"
              :key="tag"
              closable
              @close="removeTag(tag)"
              class="tag-item"
            >{{ tag }}</el-tag>
            <el-input
              v-if="addingTag"
              v-model="newTagInput"
              size="small"
              class="tag-input"
              @keyup.enter="confirmAddTag"
              @blur="confirmAddTag"
              ref="tagInputRef"
            />
            <el-button v-else size="small" @click="startAddTag" class="add-tag-btn">
              + {{ $t('crm.customers.addTag') }}
            </el-button>
          </div>
        </el-form-item>

        <!-- 社交媒体 -->
        <div class="form-section-title">{{ $t('crm.customers.socialMedia') }}</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.customers.whatsapp')">
              <el-input v-model="customerForm.whatsapp" placeholder="+1 xxx-xxxx-xxxx" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customers.linkedIn')">
              <el-input v-model="customerForm.linkedInUrl" placeholder="https://linkedin.com/in/xxx" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.customers.facebook')">
              <el-input v-model="customerForm.facebookUrl" placeholder="https://facebook.com/xxx" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customers.instagram')">
              <el-input v-model="customerForm.instagramUrl" placeholder="https://instagram.com/xxx" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 需求与跟进 -->
        <div class="form-section-title">{{ $t('crm.customers.inquiryAndFollowup') }}</div>
        <el-form-item :label="$t('sales.customers.content')" prop="content">
          <el-input v-model="customerForm.content" type="textarea" :rows="3" :placeholder="$t('sales.customers.contentPlaceholder')" />
        </el-form-item>

        <el-form-item :label="$t('sales.customers.communicationResult')">
          <el-input v-model="customerForm.communicationResult" type="textarea" :rows="2" :placeholder="$t('sales.customers.communicationResultPlaceholder')" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="$t('sales.customers.status')" prop="status">
              <el-select v-model="customerForm.status" :placeholder="$t('sales.customers.selectStatus')" style="width: 100%">
                <el-option v-for="(label, key) in customerStatuses" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('sales.customers.dealStatus')" prop="dealStatus">
              <el-select v-model="customerForm.dealStatus" :placeholder="$t('sales.customers.selectDealStatus')" style="width: 100%">
                <el-option v-for="(label, key) in dealStatuses" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('sales.customers.lastContact')" prop="lastContact">
              <el-date-picker v-model="customerForm.lastContact" type="datetime"
                :placeholder="$t('sales.customers.lastContactPlaceholder')" style="width: 100%"
                format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 营收预估 -->
        <div class="form-section-title">{{ $t('crm.customers.revenueInfo') }}</div>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="$t('crm.customers.estimatedRevenue')">
              <el-input-number v-model="customerForm.estimatedRevenue" :min="0" :precision="2"
                :placeholder="$t('crm.customers.estimatedRevenuePlaceholder')" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('crm.customers.actualRevenue')">
              <el-input-number v-model="customerForm.actualRevenue" :min="0" :precision="2"
                :placeholder="$t('crm.customers.actualRevenuePlaceholder')" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('sales.customers.products')">
              <el-input v-model="customerForm.products" :placeholder="$t('sales.customers.productsPlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 备注 -->
        <el-form-item :label="$t('sales.customers.notes')">
          <el-input v-model="customerForm.notes" type="textarea" :rows="3" :placeholder="$t('sales.customers.notesPlaceholder')" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancel">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 客户查重对话框 -->
    <el-dialog v-model="showDuplicateDialog" :title="$t('crm.customers.checkDuplicate')" width="700px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <div class="duplicate-check-form">
        <el-row :gutter="12">
          <el-col :span="10">
            <el-input v-model="duplicateCheck.name" :placeholder="$t('crm.customers.duplicateCheckName')" clearable />
          </el-col>
          <el-col :span="8">
            <el-select v-model="duplicateCheck.country" :placeholder="$t('sales.customers.country')" clearable filterable allow-create style="width: 100%">
              <el-option v-for="c in countries" :key="c" :label="c" :value="c" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="doCheckDuplicate" :loading="checkingDuplicate">
              {{ $t('crm.customers.doCheck') }}
            </el-button>
          </el-col>
        </el-row>
      </div>

      <el-divider />

      <div v-if="duplicateResults.length > 0" class="duplicate-results">
        <el-alert :title="$t('crm.customers.foundResults', { count: duplicateResults.length })" type="info" show-icon />
        <el-table :data="duplicateResults" stripe size="small" style="margin-top: 12px;" row-key="id">
          <el-table-column prop="customerCode" :label="$t('crm.customers.customerCode')" width="160" />
          <el-table-column prop="customerName" :label="$t('sales.customers.customerName')" min-width="120" />
          <el-table-column prop="country" :label="$t('sales.customers.country')" width="90" />
          <el-table-column :label="$t('crm.customers.similarity')" width="90">
            <template #default="{ row }">
              <el-tag :type="row.similarity >= 70 ? 'danger' : row.similarity >= 40 ? 'warning' : 'info'">
                {{ row.similarity }}%
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" :label="$t('sales.customers.status')" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('crm.customers.starRating')" width="90">
            <template #default="{ row }">
              <span class="star-rating">{{ renderStars(row.starRating) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else-if="checkedDuplicate" class="no-results">
        <el-empty :description="$t('crm.customers.noResults')" />
      </div>
    </el-dialog>

    <!-- 释放到公海对话框 -->
    <el-dialog v-model="showReleaseDialog" :title="$t('crm.pool.releaseToPool')" width="400px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <el-form label-width="100px">
        <el-form-item :label="$t('crm.pool.releaseReason')">
          <el-select v-model="releaseReason" style="width: 100%">
            <el-option :label="$t('crm.pool.reasons.no_activity_30_days')" value="no_activity_30_days" />
            <el-option :label="$t('crm.pool.reasons.manual_release')" value="manual_release" />
            <el-option :label="$t('crm.pool.reasons.duplicate_release')" value="duplicate_release" />
            <el-option :label="$t('crm.pool.reasons.supervisor_release')" value="supervisor_release" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReleaseDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="warning" @click="confirmRelease" :loading="releasing">
          {{ $t('crm.pool.confirmRelease') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Plus, Search, Refresh, Edit, Delete, UserFilled, Message } from '@element-plus/icons-vue'
import { filterData } from '../../utils/search'
import {
  getCrmCustomers, createCrmCustomer, updateCrmCustomer, deleteCrmCustomer,
  checkCrmDuplicate, releaseCrmToPool,
  type CrmCustomer, type DuplicateCheckResult, type PoolReason
} from '../../api/crm'
import { CRM_COUNTRIES } from '../../utils/crm-countries'

const { t, locale } = useI18n()

const loading = ref(false)
const saving = ref(false)
const customers = ref<CrmCustomer[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchText = ref('')
const countryFilter = ref('')
const statusFilter = ref('')
const dealStatusFilter = ref('')
const starFilter = ref<number | ''>('')
const inquirySourceFilter = ref('')
const showCustomerDialog = ref(false)
const editingCustomer = ref<CrmCustomer | null>(null)
const customerFormRef = ref<FormInstance>()
const showDuplicateDialog = ref(false)
const showReleaseDialog = ref(false)
const releasing = ref(false)
const checkingDuplicate = ref(false)
const checkedDuplicate = ref(false)
const duplicateResults = ref<DuplicateCheckResult[]>([])
const duplicateCheck = ref({ name: '', country: '' })
const releaseReason = ref('manual_release')
const releasingCustomer = ref<CrmCustomer | null>(null)

const newTagInput = ref('')
const addingTag = ref(false)
const tagInputRef = ref<any>()

const countries = ref<string[]>(CRM_COUNTRIES)

const inquirySources = computed<Record<string, string>>(() => ({
  official_website: t('crm.customers.sources.official_website'),
  exhibition: t('crm.customers.sources.exhibition'),
  referral: t('crm.customers.sources.referral'),
  social_media: t('crm.customers.sources.social_media'),
  cold_call: t('crm.customers.sources.cold_call'),
  website: t('crm.customers.sources.website'),
  partner: t('crm.customers.sources.partner'),
  other: t('crm.customers.sources.other'),
}))

const customerForm = ref({
  customerName: '',
  companyName: '',
  country: '',
  phone: '',
  email: '',
  linkedInUrl: '',
  facebookUrl: '',
  whatsapp: '',
  instagramUrl: '',
  content: '',
  inquirySource: '',
  communicationResult: '',
  status: 'new',
  dealStatus: 'pending',
  products: '',
  estimatedRevenue: undefined as number | undefined,
  actualRevenue: undefined as number | undefined,
  starRating: 3,
  tags: '',
  lastContact: '',
  notes: '',
  ownerId: undefined as number | undefined,
})

const customerRules: FormRules = {
  customerName: [{ required: true, message: t('sales.customers.customerNameRequired'), trigger: 'blur' }],
}

const filteredCustomers = computed(() => {
  const filters: Record<string, any> = {}
  if (countryFilter.value) filters.country = countryFilter.value
  if (statusFilter.value) filters.status = statusFilter.value
  if (dealStatusFilter.value) filters.dealStatus = dealStatusFilter.value
  if (starFilter.value) filters.starRating = starFilter.value
  if (inquirySourceFilter.value) filters.inquirySource = inquirySourceFilter.value

  return filterData(
    customers.value,
    searchText.value,
    ['customerCode', 'customerName', 'companyName', 'country', 'content', 'products', 'email'],
    Object.keys(filters).length > 0 ? filters : undefined
  )
})

let searchTimer: ReturnType<typeof setTimeout> | null = null
const debouncedLoad = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; loadCustomers() }, 400)
}

const handleFilter = () => {
  currentPage.value = 1
  loadCustomers()
}

const resetFilter = () => {
  searchText.value = ''
  countryFilter.value = ''
  statusFilter.value = ''
  dealStatusFilter.value = ''
  starFilter.value = ''
  inquirySourceFilter.value = ''
  currentPage.value = 1
  loadCustomers()
}

const loadCustomers = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
    }
    if (searchText.value) params.keyword = searchText.value
    if (countryFilter.value) params.country = countryFilter.value
    if (statusFilter.value) params.status = statusFilter.value
    if (dealStatusFilter.value) params.dealStatus = dealStatusFilter.value
    if (starFilter.value) params.starRating = starFilter.value
    if (inquirySourceFilter.value) params.inquirySource = inquirySourceFilter.value

    const res = await getCrmCustomers(params)
    customers.value = res.data
    total.value = res.total

    // 动态扩展国家列表
    const set = new Set<string>(countries.value)
    customers.value.forEach((c) => { if (c.country) set.add(c.country) })
    countries.value = Array.from(set)
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const parseTags = (tagsStr: string | null | undefined): string[] => {
  if (!tagsStr) return []
  try {
    const parsed = JSON.parse(tagsStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const renderStars = (rating: number): string => {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

const getInquirySourceLabel = (source: string | null | undefined): string => {
  if (!source) return '-'
  return inquirySources.value[source] || source
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const getStatusType = (status: string): string => {
  return { new: 'info', contacting: 'primary', negotiating: 'warning', closed: 'success', lost: 'danger' }[status] || 'info'
}
const getStatusText = (status: string): string => customerStatuses.value[status as keyof typeof customerStatuses.value] || status
const getDealStatusType = (status: string): string => {
  return { pending: 'info', quoted: 'primary', ordered: 'warning', delivered: 'success', completed: 'success' }[status] || 'info'
}
const getDealStatusText = (status: string): string => dealStatuses.value[status as keyof typeof dealStatuses.value] || status

const customerStatuses = computed(() => ({
  new: t('sales.customers.statuses.new'),
  contacting: t('sales.customers.statuses.contacting'),
  negotiating: t('sales.customers.statuses.negotiating'),
  closed: t('sales.customers.statuses.closed'),
  lost: t('sales.customers.statuses.lost'),
}))

const dealStatuses = computed(() => ({
  pending: t('sales.customers.dealStatuses.pending'),
  quoted: t('sales.customers.dealStatuses.quoted'),
  ordered: t('sales.customers.dealStatuses.ordered'),
  delivered: t('sales.customers.dealStatuses.delivered'),
  completed: t('sales.customers.dealStatuses.completed'),
}))

const handleAdd = () => {
  editingCustomer.value = null
  customerForm.value = {
    customerName: '', companyName: '', country: '', phone: '', email: '',
    linkedInUrl: '', facebookUrl: '', whatsapp: '', instagramUrl: '',
    content: '', inquirySource: '', communicationResult: '',
    status: 'new', dealStatus: 'pending', products: '',
    estimatedRevenue: undefined, actualRevenue: undefined,
    starRating: 3, tags: '', lastContact: '', notes: '',
    ownerId: undefined,
  }
  showCustomerDialog.value = true
}

const handleEdit = (customer: CrmCustomer) => {
  editingCustomer.value = customer
  customerForm.value = {
    customerName: customer.customerName,
    companyName: customer.companyName || '',
    country: customer.country || '',
    phone: customer.phone || '',
    email: customer.email || '',
    linkedInUrl: customer.linkedInUrl || '',
    facebookUrl: customer.facebookUrl || '',
    whatsapp: customer.whatsapp || '',
    instagramUrl: customer.instagramUrl || '',
    content: customer.content || '',
    inquirySource: customer.inquirySource || '',
    communicationResult: customer.communicationResult || '',
    status: customer.status,
    dealStatus: customer.dealStatus,
    products: customer.products || '',
    estimatedRevenue: customer.estimatedRevenue ?? undefined,
    actualRevenue: customer.actualRevenue ?? undefined,
    starRating: customer.starRating || 3,
    tags: customer.tags || '',
    lastContact: customer.lastContact || '',
    notes: customer.notes || '',
    ownerId: customer.ownerId ?? undefined,
  }
  showCustomerDialog.value = true
}

const handleDelete = async (customer: CrmCustomer) => {
  try {
    await ElMessageBox.confirm(
      t('sales.customers.deleteConfirm', { name: customer.customerName }),
      t('common.warning'), { type: 'warning' }
    )
    await deleteCrmCustomer(customer.id)
    await loadCustomers()
    ElMessage.success(t('common.success'))
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error.message || t('common.error'))
  }
}

const handleRelease = (customer: CrmCustomer) => {
  releasingCustomer.value = customer
  releaseReason.value = 'manual_release'
  showReleaseDialog.value = true
}

const confirmRelease = async () => {
  if (!releasingCustomer.value) return
  releasing.value = true
  try {
    await releaseCrmToPool(releasingCustomer.value.id, releaseReason.value as PoolReason)
    ElMessage.success(t('crm.pool.releaseSuccess'))
    showReleaseDialog.value = false
    await loadCustomers()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    releasing.value = false
  }
}

const handleSave = async () => {
  if (!customerFormRef.value) return
  try {
    await customerFormRef.value.validate()
    saving.value = true

    const data: any = {
      customerName: customerForm.value.customerName,
      companyName: customerForm.value.companyName || undefined,
      country: customerForm.value.country || undefined,
      phone: customerForm.value.phone || undefined,
      email: customerForm.value.email || undefined,
      linkedInUrl: customerForm.value.linkedInUrl || undefined,
      facebookUrl: customerForm.value.facebookUrl || undefined,
      whatsapp: customerForm.value.whatsapp || undefined,
      instagramUrl: customerForm.value.instagramUrl || undefined,
      content: customerForm.value.content || undefined,
      inquirySource: customerForm.value.inquirySource || undefined,
      communicationResult: customerForm.value.communicationResult || undefined,
      status: customerForm.value.status,
      dealStatus: customerForm.value.dealStatus,
      products: customerForm.value.products || undefined,
      estimatedRevenue: customerForm.value.estimatedRevenue ?? undefined,
      actualRevenue: customerForm.value.actualRevenue ?? undefined,
      starRating: customerForm.value.starRating,
      tags: customerForm.value.tags || undefined,
      lastContact: customerForm.value.lastContact || undefined,
      notes: customerForm.value.notes || undefined,
    }

    if (editingCustomer.value) {
      await updateCrmCustomer(editingCustomer.value.id, data)
    } else {
      await createCrmCustomer(data)
    }

    if (customerForm.value.country && !countries.value.includes(customerForm.value.country)) {
      countries.value.push(customerForm.value.country)
    }

    await loadCustomers()
    ElMessage.success(t('common.success'))
    handleCancel()
  } catch (error: any) {
    if (error !== false) ElMessage.error(error.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  showCustomerDialog.value = false
  editingCustomer.value = null
  customerFormRef.value?.resetFields()
}

const startAddTag = () => {
  addingTag.value = true
  nextTick(() => tagInputRef.value?.focus())
}

const confirmAddTag = () => {
  const tag = newTagInput.value.trim()
  if (tag) {
    const tags = parseTags(customerForm.value.tags)
    if (!tags.includes(tag)) {
      tags.push(tag)
      customerForm.value.tags = JSON.stringify(tags)
    }
  }
  newTagInput.value = ''
  addingTag.value = false
}

const removeTag = (tag: string) => {
  const tags = parseTags(customerForm.value.tags).filter((t) => t !== tag)
  customerForm.value.tags = JSON.stringify(tags)
}

const doCheckDuplicate = async () => {
  if (!duplicateCheck.value.name && !duplicateCheck.value.country) {
    ElMessage.warning(t('crm.customers.duplicateCheckWarning'))
    return
  }
  checkingDuplicate.value = true
  checkedDuplicate.value = true
  try {
    const results = await checkCrmDuplicate(duplicateCheck.value)
    duplicateResults.value = results
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    checkingDuplicate.value = false
  }
}

onMounted(() => {
  loadCustomers()
})

const reload = () => loadCustomers()

defineExpose({ reload })
</script>

<style scoped lang="scss">
.customer-module {
  .module-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    background: #ffffff;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -0.01em;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .filter-bar {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      padding: 16px;
      background: #f5f5f7;
      border-radius: 12px;
      flex-wrap: wrap;
      gap: 12px;

      :deep(.el-input__wrapper), :deep(.el-select .el-input__wrapper) {
        border-radius: 10px;
        border-color: #e5e5e7;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }

      .el-button { border-radius: 10px; font-weight: 500; }
    }
  }

  .customer-code {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #64748b;
  }

  .customer-name-cell {
    .customer-name { font-weight: 600; color: #1f2329; }
    .customer-tags-row {
      display: flex;
      gap: 4px;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 4px;
      .star-rating { color: #f59e0b; font-size: 12px; }
      .tag-item { margin-right: 2px; }
    }
  }

  .owner-time-cell {
    font-size: 12px;
    color: #64748b;
    line-height: 1.6;
    .time-label { font-weight: 600; color: #94a3b8; margin-right: 2px; }
  }

  .star-rating { color: #f59e0b; font-size: 14px; }
  .star-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    .star-hint { color: #f59e0b; font-size: 14px; }
  }

  .form-section-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2329;
    margin: 8px 0 4px;
    padding-left: 4px;
    border-left: 3px solid #409eff;
  }

  .tags-input-area {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    min-height: 32px;
    padding: 4px;
    border: 1px solid #e5e5e7;
    border-radius: 8px;
    background: #fff;
    .tag-item { margin: 0; }
    .tag-input { width: 120px; }
    .add-tag-btn { font-size: 12px; color: #409eff; }
  }

  .duplicate-check-form { margin-bottom: 8px; }
  .duplicate-results, .no-results { max-height: 400px; overflow-y: auto; }
}
</style>
