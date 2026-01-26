<template>
  <div class="quotation-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Document /></el-icon>
            <span>{{ $t('sales.quotation.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="showQuotationDialog = true">
            {{ $t('sales.quotation.addQuotation') }}
          </el-button>
        </div>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-bar">
        <el-input
          v-model="searchText"
          :placeholder="$t('sales.quotation.searchPlaceholder')"
          clearable
          style="width: 300px; margin-right: 12px;"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="statusFilter"
          :placeholder="$t('sales.quotation.filterByStatus')"
          clearable
          style="width: 150px; margin-right: 12px;"
          @change="handleFilter"
        >
          <el-option :label="$t('sales.quotation.all')" value="" />
          <el-option
            v-for="(label, key) in quotationStatuses"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">
          {{ $t('common.reset') }}
        </el-button>
      </div>

      <!-- 报价单列表 -->
      <el-table :data="filteredQuotations" stripe v-loading="loading">
        <el-table-column prop="quotationNumber" :label="$t('sales.quotation.quotationNumber')" width="150" />
        <el-table-column prop="customerName" :label="$t('sales.quotation.customerName')" width="150" />
        <el-table-column prop="productName" :label="$t('sales.quotation.productName')" min-width="150" />
        <el-table-column prop="quantity" :label="$t('sales.quotation.quantity')" width="100" />
        <el-table-column prop="unitPrice" :label="$t('sales.quotation.unitPrice')" width="120">
          <template #default="{ row }">
            ¥{{ row.unitPrice?.toLocaleString() || '0' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" :label="$t('sales.quotation.totalAmount')" width="150">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toLocaleString() || '0' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('sales.quotation.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quotationDate" :label="$t('sales.quotation.quotationDate')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.quotationDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="validUntil" :label="$t('sales.quotation.validUntil')" width="180">
          <template #default="{ row }">
            {{ row.validUntil ? formatDate(row.validUntil) : '-' }}
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
            <el-button type="success" size="small" :icon="Download" @click="handleDownload(row)">
              {{ $t('common.download') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 添加/编辑报价单对话框 -->
      <el-dialog
        v-model="showQuotationDialog"
        :title="editingQuotation ? $t('sales.quotation.editQuotation') : $t('sales.quotation.addQuotation')"
        width="900px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="quotationFormRef"
          :model="quotationForm"
          :rules="quotationRules"
          label-width="120px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('sales.quotation.quotationNumber')" prop="quotationNumber">
                <el-input
                  v-model="quotationForm.quotationNumber"
                  :placeholder="$t('sales.quotation.quotationNumberPlaceholder')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('sales.quotation.customerName')" prop="customerName">
                <el-input
                  v-model="quotationForm.customerName"
                  :placeholder="$t('sales.quotation.customerNamePlaceholder')"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('sales.quotation.productName')" prop="productName">
                <el-input
                  v-model="quotationForm.productName"
                  :placeholder="$t('sales.quotation.productNamePlaceholder')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('sales.quotation.quantity')" prop="quantity">
                <el-input-number
                  v-model="quotationForm.quantity"
                  :min="1"
                  style="width: 100%"
                  :placeholder="$t('sales.quotation.quantityPlaceholder')"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('sales.quotation.unitPrice')" prop="unitPrice">
                <el-input-number
                  v-model="quotationForm.unitPrice"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  :placeholder="$t('sales.quotation.unitPricePlaceholder')"
                >
                  <template #prefix>¥</template>
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('sales.quotation.totalAmount')" prop="totalAmount">
                <el-input-number
                  v-model="quotationForm.totalAmount"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  :placeholder="$t('sales.quotation.totalAmountPlaceholder')"
                  :disabled="true"
                >
                  <template #prefix>¥</template>
                </el-input-number>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('sales.quotation.quotationDate')" prop="quotationDate">
                <el-date-picker
                  v-model="quotationForm.quotationDate"
                  type="datetime"
                  :placeholder="$t('sales.quotation.quotationDatePlaceholder')"
                  style="width: 100%"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('sales.quotation.validUntil')">
                <el-date-picker
                  v-model="quotationForm.validUntil"
                  type="datetime"
                  :placeholder="$t('sales.quotation.validUntilPlaceholder')"
                  style="width: 100%"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('sales.quotation.status')" prop="status">
            <el-select
              v-model="quotationForm.status"
              :placeholder="$t('sales.quotation.selectStatus')"
              style="width: 100%"
            >
              <el-option
                v-for="(label, key) in quotationStatuses"
                :key="key"
                :label="label"
                :value="key"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="$t('sales.quotation.notes')">
            <el-input
              v-model="quotationForm.notes"
              type="textarea"
              :rows="4"
              :placeholder="$t('sales.quotation.notesPlaceholder')"
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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Document, Plus, Search, Refresh, Edit, Delete, Download } from '@element-plus/icons-vue'
import { filterData } from '../../utils/search'

interface Quotation {
  id: number
  quotationNumber: string
  customerName: string
  productName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  quotationDate: string
  validUntil?: string
  notes?: string
  createdAt: string
}

const { t, locale } = useI18n()

const loading = ref(false)
const saving = ref(false)
const quotations = ref<Quotation[]>([])
const searchText = ref('')
const statusFilter = ref('')
const showQuotationDialog = ref(false)
const editingQuotation = ref<Quotation | null>(null)
const quotationFormRef = ref<FormInstance>()

const quotationForm = ref({
  quotationNumber: '',
  customerName: '',
  productName: '',
  quantity: 1,
  unitPrice: 0,
  totalAmount: 0,
  status: 'draft' as Quotation['status'],
  quotationDate: '',
  validUntil: '',
  notes: '',
})

const quotationStatuses = computed(() => ({
  draft: t('sales.quotation.statuses.draft'),
  sent: t('sales.quotation.statuses.sent'),
  accepted: t('sales.quotation.statuses.accepted'),
  rejected: t('sales.quotation.statuses.rejected'),
  expired: t('sales.quotation.statuses.expired'),
}))

const quotationRules: FormRules = {
  quotationNumber: [{ required: true, message: t('sales.quotation.quotationNumberRequired'), trigger: 'blur' }],
  customerName: [{ required: true, message: t('sales.quotation.customerNameRequired'), trigger: 'blur' }],
  productName: [{ required: true, message: t('sales.quotation.productNameRequired'), trigger: 'blur' }],
  quantity: [{ required: true, message: t('sales.quotation.quantityRequired'), trigger: 'blur' }],
  unitPrice: [{ required: true, message: t('sales.quotation.unitPriceRequired'), trigger: 'blur' }],
  quotationDate: [{ required: true, message: t('sales.quotation.quotationDateRequired'), trigger: 'change' }],
}

// 自动计算总金额
watch(() => [quotationForm.value.quantity, quotationForm.value.unitPrice], () => {
  quotationForm.value.totalAmount = quotationForm.value.quantity * quotationForm.value.unitPrice
})

// 筛选后的报价单列表（域内搜索，只搜索报价单数据）
const filteredQuotations = computed(() => {
  return filterData(
    quotations.value,
    searchText.value,
    ['quotationNumber', 'customerName', 'productName'], // 只搜索报价单相关字段
    statusFilter.value ? { status: statusFilter.value } : undefined
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
  statusFilter.value = ''
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString(locale.value)
}

const getStatusType = (status: string): string => {
  const map: Record<string, string> = {
    draft: 'info',
    sent: 'primary',
    accepted: 'success',
    rejected: 'danger',
    expired: 'warning',
  }
  return map[status] || 'info'
}

const getStatusText = (status: string): string => {
  return quotationStatuses.value[status as keyof typeof quotationStatuses.value] || status
}

const handleEdit = (quotation: Quotation) => {
  editingQuotation.value = quotation
  quotationForm.value = {
    quotationNumber: quotation.quotationNumber,
    customerName: quotation.customerName,
    productName: quotation.productName,
    quantity: quotation.quantity,
    unitPrice: quotation.unitPrice,
    totalAmount: quotation.totalAmount,
    status: quotation.status,
    quotationDate: quotation.quotationDate,
    validUntil: quotation.validUntil || '',
    notes: quotation.notes || '',
  }
  showQuotationDialog.value = true
}

const handleDelete = async (quotation: Quotation) => {
  try {
    await ElMessageBox.confirm(
      t('sales.quotation.deleteConfirm', { number: quotation.quotationNumber }),
      t('common.warning'),
      { type: 'warning' }
    )
    const index = quotations.value.findIndex(q => q.id === quotation.id)
    if (index !== -1) {
      quotations.value.splice(index, 1)
    }
    ElMessage.success(t('common.success'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

const handleDownload = (_quotation: Quotation) => {
  ElMessage.info(t('sales.quotation.downloadComingSoon'))
  // TODO: 实现报价单下载功能
}

const handleSave = async () => {
  if (!quotationFormRef.value) return

  try {
    await quotationFormRef.value.validate()
    saving.value = true

    const quotationData: Omit<Quotation, 'id' | 'createdAt'> = {
      quotationNumber: quotationForm.value.quotationNumber,
      customerName: quotationForm.value.customerName,
      productName: quotationForm.value.productName,
      quantity: quotationForm.value.quantity,
      unitPrice: quotationForm.value.unitPrice,
      totalAmount: quotationForm.value.totalAmount,
      status: quotationForm.value.status,
      quotationDate: quotationForm.value.quotationDate,
      validUntil: quotationForm.value.validUntil || undefined,
      notes: quotationForm.value.notes,
    }

    if (editingQuotation.value) {
      const index = quotations.value.findIndex(q => q.id === editingQuotation.value!.id)
      if (index !== -1) {
        const current = quotations.value[index]
        if (!current) return
        quotations.value[index] = { ...quotationData, id: editingQuotation.value.id, createdAt: current.createdAt }
      }
    } else {
      quotations.value.push({
        ...quotationData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      })
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
  showQuotationDialog.value = false
  editingQuotation.value = null
  quotationFormRef.value?.resetFields()
  quotationForm.value = {
    quotationNumber: '',
    customerName: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    status: 'draft',
    quotationDate: '',
    validUntil: '',
    notes: '',
  }
}
</script>

<style scoped lang="scss">
.quotation-module {
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

