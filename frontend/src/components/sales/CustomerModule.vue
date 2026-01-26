<template>
  <div class="customer-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><User /></el-icon>
            <span>{{ $t('sales.customers.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="showCustomerDialog = true">
            {{ $t('sales.customers.addCustomer') }}
          </el-button>
        </div>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-bar">
        <el-input
          v-model="searchText"
          :placeholder="$t('sales.customers.searchPlaceholder')"
          clearable
          style="width: 300px; margin-right: 12px;"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="countryFilter"
          :placeholder="$t('sales.customers.filterByCountry')"
          clearable
          filterable
          allow-create
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('sales.customers.all')" value="" />
          <el-option
            v-for="country in countries"
            :key="country"
            :label="country"
            :value="country"
          />
        </el-select>
        <el-select
          v-model="statusFilter"
          :placeholder="$t('sales.customers.filterByStatus')"
          clearable
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('sales.customers.all')" value="" />
          <el-option
            v-for="(label, key) in customerStatuses"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-select
          v-model="dealStatusFilter"
          :placeholder="$t('sales.customers.filterByDealStatus')"
          clearable
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('sales.customers.all')" value="" />
          <el-option
            v-for="(label, key) in dealStatuses"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">
          {{ $t('common.reset') }}
        </el-button>
      </div>

      <!-- 客户列表 -->
      <el-table :data="filteredCustomers" stripe v-loading="loading">
        <el-table-column prop="customerName" :label="$t('sales.customers.customerName')" min-width="150" />
        <el-table-column prop="country" :label="$t('sales.customers.country')" width="120" />
        <el-table-column prop="content" :label="$t('sales.customers.content')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="communicationResult" :label="$t('sales.customers.communicationResult')" min-width="150" show-overflow-tooltip />
        <el-table-column prop="status" :label="$t('sales.customers.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dealStatus" :label="$t('sales.customers.dealStatus')" width="120">
          <template #default="{ row }">
            <el-tag :type="getDealStatusType(row.dealStatus)">
              {{ getDealStatusText(row.dealStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="shipment" :label="$t('sales.customers.shipment')" width="120" />
        <el-table-column prop="products" :label="$t('sales.customers.products')" min-width="150" show-overflow-tooltip />
        <el-table-column prop="afterSales" :label="$t('sales.customers.afterSales')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.afterSales ? 'success' : 'info'">
              {{ row.afterSales ? $t('sales.customers.hasAfterSales') : $t('sales.customers.noAfterSales') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastContact" :label="$t('sales.customers.lastContact')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastContact) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)">
              {{ $t('common.edit') }}
            </el-button>
            <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">
              {{ $t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 添加/编辑客户对话框 -->
      <el-dialog
        v-model="showCustomerDialog"
        :title="editingCustomer ? $t('sales.customers.editCustomer') : $t('sales.customers.addCustomer')"
        width="900px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="customerFormRef"
          :model="customerForm"
          :rules="customerRules"
          label-width="120px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('sales.customers.customerName')" prop="customerName">
                <el-input
                  v-model="customerForm.customerName"
                  :placeholder="$t('sales.customers.customerNamePlaceholder')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('sales.customers.country')" prop="country">
                <el-select
                  v-model="customerForm.country"
                  filterable
                  allow-create
                  default-first-option
                  :placeholder="$t('sales.customers.countryPlaceholder')"
                  style="width: 100%"
                >
                  <el-option
                    v-for="country in countries"
                    :key="country"
                    :label="country"
                    :value="country"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('sales.customers.content')" prop="content">
            <el-input
              v-model="customerForm.content"
              type="textarea"
              :rows="4"
              :placeholder="$t('sales.customers.contentPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('sales.customers.communicationResult')" prop="communicationResult">
            <el-input
              v-model="customerForm.communicationResult"
              type="textarea"
              :rows="3"
              :placeholder="$t('sales.customers.communicationResultPlaceholder')"
            />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('sales.customers.status')" prop="status">
                <el-select
                  v-model="customerForm.status"
                  :placeholder="$t('sales.customers.selectStatus')"
                  style="width: 100%"
                >
                  <el-option
                    v-for="(label, key) in customerStatuses"
                    :key="key"
                    :label="label"
                    :value="key"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('sales.customers.dealStatus')" prop="dealStatus">
                <el-select
                  v-model="customerForm.dealStatus"
                  :placeholder="$t('sales.customers.selectDealStatus')"
                  style="width: 100%"
                >
                  <el-option
                    v-for="(label, key) in dealStatuses"
                    :key="key"
                    :label="label"
                    :value="key"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('sales.customers.shipment')">
                <el-input
                  v-model="customerForm.shipment"
                  :placeholder="$t('sales.customers.shipmentPlaceholder')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('sales.customers.products')">
                <el-input
                  v-model="customerForm.products"
                  :placeholder="$t('sales.customers.productsPlaceholder')"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('sales.customers.afterSales')">
            <el-switch
              v-model="customerForm.afterSales"
              :active-text="$t('sales.customers.hasAfterSales')"
              :inactive-text="$t('sales.customers.noAfterSales')"
            />
          </el-form-item>

          <el-form-item :label="$t('sales.customers.lastContact')" prop="lastContact">
            <el-date-picker
              v-model="customerForm.lastContact"
              type="datetime"
              :placeholder="$t('sales.customers.lastContactPlaceholder')"
              style="width: 100%"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </el-form-item>

          <el-form-item :label="$t('sales.customers.notes')">
            <el-input
              v-model="customerForm.notes"
              type="textarea"
              :rows="4"
              :placeholder="$t('sales.customers.notesPlaceholder')"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="handleCancel">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleSave" :loading="saving">
            {{ $t('common.save') }}
          </el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Plus, Search, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import { filterData } from '../../utils/search'

interface Customer {
  id: number
  customerName: string
  country: string
  content: string
  communicationResult: string
  status: 'new' | 'contacting' | 'negotiating' | 'closed' | 'lost'
  dealStatus: 'pending' | 'quoted' | 'ordered' | 'delivered' | 'completed'
  shipment: string
  products: string
  afterSales: boolean
  lastContact: string
  notes?: string
  createdAt: string
}

const { t, locale } = useI18n()

const loading = ref(false)
const saving = ref(false)
const customers = ref<Customer[]>([])
const searchText = ref('')
const countryFilter = ref('')
const statusFilter = ref('')
const dealStatusFilter = ref('')
const showCustomerDialog = ref(false)
const editingCustomer = ref<Customer | null>(null)
const customerFormRef = ref<FormInstance>()

const countries = ref<string[]>(['USA', 'UK', 'Germany', 'France', 'Japan', 'Korea', 'India', 'Australia'])

const customerForm = ref({
  customerName: '',
  country: '',
  content: '',
  communicationResult: '',
  status: 'new' as Customer['status'],
  dealStatus: 'pending' as Customer['dealStatus'],
  shipment: '',
  products: '',
  afterSales: false,
  lastContact: '',
  notes: '',
})

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

const customerRules: FormRules = {
  customerName: [{ required: true, message: t('sales.customers.customerNameRequired'), trigger: 'blur' }],
  country: [{ required: true, message: t('sales.customers.countryRequired'), trigger: 'change' }],
  content: [{ required: true, message: t('sales.customers.contentRequired'), trigger: 'blur' }],
  lastContact: [{ required: true, message: t('sales.customers.lastContactRequired'), trigger: 'change' }],
}

// 筛选后的客户列表（域内搜索，只搜索客户记录数据）
const filteredCustomers = computed(() => {
  const filters: Record<string, any> = {}
  if (countryFilter.value) {
    filters.country = countryFilter.value
  }
  if (statusFilter.value) {
    filters.status = statusFilter.value
  }
  if (dealStatusFilter.value) {
    filters.dealStatus = dealStatusFilter.value
  }

  return filterData(
    customers.value,
    searchText.value,
    ['customerName', 'country', 'content', 'products'], // 只搜索客户相关字段
    Object.keys(filters).length > 0 ? filters : undefined
  )
})

const handleSearch = () => {
  // 筛选逻辑已在computed中实现
}

const handleFilter = () => {
  // 筛选逻辑已在computed中实现
}

const resetFilter = () => {
  searchText.value = ''
  countryFilter.value = ''
  statusFilter.value = ''
  dealStatusFilter.value = ''
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString(locale.value)
}

const getStatusType = (status: string): string => {
  const map: Record<string, string> = {
    new: 'info',
    contacting: 'primary',
    negotiating: 'warning',
    closed: 'success',
    lost: 'danger',
  }
  return map[status] || 'info'
}

const getStatusText = (status: string): string => {
  return customerStatuses.value[status as keyof typeof customerStatuses.value] || status
}

const getDealStatusType = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'info',
    quoted: 'primary',
    ordered: 'warning',
    delivered: 'success',
    completed: 'success',
  }
  return map[status] || 'info'
}

const getDealStatusText = (status: string): string => {
  return dealStatuses.value[status as keyof typeof dealStatuses.value] || status
}

const handleEdit = (customer: Customer) => {
  editingCustomer.value = customer
  customerForm.value = {
    customerName: customer.customerName,
    country: customer.country,
    content: customer.content,
    communicationResult: customer.communicationResult,
    status: customer.status,
    dealStatus: customer.dealStatus,
    shipment: customer.shipment,
    products: customer.products,
    afterSales: customer.afterSales,
    lastContact: customer.lastContact,
    notes: customer.notes || '',
  }
  showCustomerDialog.value = true
}

const handleDelete = async (customer: Customer) => {
  try {
    await ElMessageBox.confirm(
      t('sales.customers.deleteConfirm', { name: customer.customerName }),
      t('common.warning'),
      { type: 'warning' }
    )
    const index = customers.value.findIndex(c => c.id === customer.id)
    if (index !== -1) {
      customers.value.splice(index, 1)
    }
    ElMessage.success(t('common.success'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

const handleSave = async () => {
  if (!customerFormRef.value) return

  try {
    await customerFormRef.value.validate()
    saving.value = true

    const customerData: Omit<Customer, 'id' | 'createdAt'> = {
      customerName: customerForm.value.customerName,
      country: customerForm.value.country,
      content: customerForm.value.content,
      communicationResult: customerForm.value.communicationResult,
      status: customerForm.value.status,
      dealStatus: customerForm.value.dealStatus,
      shipment: customerForm.value.shipment,
      products: customerForm.value.products,
      afterSales: customerForm.value.afterSales,
      lastContact: customerForm.value.lastContact,
      notes: customerForm.value.notes,
    }

    if (editingCustomer.value) {
      const index = customers.value.findIndex(c => c.id === editingCustomer.value!.id)
      if (index !== -1) {
        const current = customers.value[index]
        if (!current) return
        customers.value[index] = { ...customerData, id: editingCustomer.value.id, createdAt: current.createdAt }
      }
    } else {
      customers.value.push({
        ...customerData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      })
    }

    // 更新国家列表
    if (!countries.value.includes(customerForm.value.country)) {
      countries.value.push(customerForm.value.country)
    }

    ElMessage.success(t('common.success'))
    handleCancel()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  showCustomerDialog.value = false
  editingCustomer.value = null
  customerFormRef.value?.resetFields()
  customerForm.value = {
    customerName: '',
    country: '',
    content: '',
    communicationResult: '',
    status: 'new',
    dealStatus: 'pending',
    shipment: '',
    products: '',
    afterSales: false,
    lastContact: '',
    notes: '',
  }
}
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

      :deep(.el-input__wrapper) {
        border-radius: 10px;
        border-color: #e5e5e7;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }

      :deep(.el-select) {
        .el-input__wrapper {
          border-radius: 10px;
        }
      }

      .el-button {
        border-radius: 10px;
        font-weight: 500;
      }
    }
  }
}
</style>

