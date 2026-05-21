<template>
  <div class="quotation-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Tickets /></el-icon>
            <span>{{ $t('crm.quotations.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            {{ $t('crm.quotations.add') }}
          </el-button>
        </div>
      </template>

      <!-- 筛选 -->
      <div class="filter-bar">
        <el-input v-model="searchText" :placeholder="$t('crm.quotations.searchPlaceholder')" clearable
          style="width: 240px; margin-right: 12px;" @input="debouncedLoad">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="statusFilter" :placeholder="$t('crm.quotations.filterByStatus')" clearable
          style="width: 150px; margin-right: 12px;" @change="handleFilter">
          <el-option :label="$t('crm.quotations.allStatuses')" value="" />
          <el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">{{ $t('common.reset') }}</el-button>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="12" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">{{ $t('crm.quotations.total') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-draft">
            <div class="stat-value">{{ stats.draft }}</div>
            <div class="stat-label">{{ $t('crm.quotations.statusDraft') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-accepted">
            <div class="stat-value">{{ stats.accepted }}</div>
            <div class="stat-label">{{ $t('crm.quotations.statusAccepted') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-total-amount">
            <div class="stat-value">{{ formatCurrency(stats.totalAmount) }}</div>
            <div class="stat-label">{{ $t('crm.quotations.totalAmount') }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- 报价单列表 -->
      <el-table :data="quotations" stripe v-loading="loading" row-key="id" class="quotation-table">
        <el-table-column prop="quotationNumber" :label="$t('crm.quotations.number')" width="180">
          <template #default="{ row }">
            <span class="quotation-code">{{ row.quotationNumber }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" :label="$t('crm.quotations.customerName')" min-width="150" />
        <el-table-column prop="productName" :label="$t('crm.quotations.product')" min-width="160" show-overflow-tooltip />
        <el-table-column :label="$t('crm.quotations.amount')" width="130">
          <template #default="{ row }">
            <span class="amount-value">¥{{ formatNumber(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" :label="$t('crm.quotations.quantity')" width="90" align="center" />
        <el-table-column prop="unitPrice" :label="$t('crm.quotations.unitPrice')" width="120">
          <template #default="{ row }">¥{{ formatNumber(row.unitPrice) }}</template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('crm.quotations.status')" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quotationDate" :label="$t('crm.quotations.date')" width="110">
          <template #default="{ row }">{{ row.quotationDate || '-' }}</template>
        </el-table-column>
        <el-table-column prop="validUntil" :label="$t('crm.quotations.validUntil')" width="110">
          <template #default="{ row }">
            <span :class="{ 'expired': isExpired(row.validUntil) }">{{ row.validUntil || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" link @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
            <el-button v-if="row.status === 'draft'" type="success" size="small" :icon="Check" link @click="handleSend(row)">
              {{ $t('crm.quotations.send') }}
            </el-button>
            <el-button v-if="row.status === 'sent'" type="warning" size="small" :icon="Check" link @click="handleAccept(row)">
              {{ $t('crm.quotations.accept') }}
            </el-button>
            <el-button type="danger" size="small" :icon="Delete" link @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
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
        @current-change="loadQuotations"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 添加/编辑报价单对话框 -->
    <el-dialog v-model="showDialog" :title="editing ? $t('crm.quotations.edit') : $t('crm.quotations.add')"
      width="680px" :close-on-click-modal="false"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.quotations.customerName')" prop="customerName">
              <el-select
                v-model="form.customerId"
                filterable
                allow-create
                default-first-option
                :loading="customersLoading"
                :placeholder="$t('crm.quotations.customerNamePlaceholder')"
                style="width: 100%;"
                @change="onCustomerChange"
              >
                <el-option v-for="c in customers" :key="c.id" :label="c.companyName" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.quotations.product')">
              <el-input v-model="form.productName" :placeholder="$t('crm.quotations.productPlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="$t('crm.quotations.quantity')">
              <el-input-number v-model="form.quantity" :min="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('crm.quotations.unitPrice')">
              <el-input-number v-model="form.unitPrice" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('crm.quotations.totalAmount')">
              <el-input :value="calcTotal" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.quotations.date')">
              <el-date-picker v-model="form.quotationDate" type="date" value-format="YYYY-MM-DD"
                :placeholder="$t('crm.quotations.datePlaceholder')" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.quotations.validUntil')">
              <el-date-picker v-model="form.validUntil" type="date" value-format="YYYY-MM-DD"
                :placeholder="$t('crm.quotations.validUntilPlaceholder')" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.quotations.status')">
              <el-select v-model="form.status" style="width: 100%;">
                <el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('crm.quotations.notes')">
          <el-input v-model="form.notes" type="textarea" :rows="3" :placeholder="$t('crm.quotations.notesPlaceholder')" />
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
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Tickets, Plus, Search, Refresh, Edit, Delete, Check } from '@element-plus/icons-vue'
import { getQuotations, createQuotation, updateQuotation, deleteQuotation, getCrmCustomers,
  type Quotation, type QuotationStatus, type CrmCustomer } from '../../api/crm'

const { t, locale } = useI18n()

const loading = ref(false)
const saving = ref(false)
const quotations = ref<Quotation[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchText = ref('')
const statusFilter = ref('')
const showDialog = ref(false)
const editing = ref<Quotation | null>(null)
const formRef = ref<FormInstance>()
const stats = ref({ total: 0, draft: 0, accepted: 0, totalAmount: 0 })

const statusMap: Record<QuotationStatus, string> = {
  draft: '草稿',
  sent: '已发送',
  accepted: '已接受',
  rejected: '已拒绝',
  expired: '已过期',
}

const statusMapEn: Record<QuotationStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
}

const form = ref({
  customerId: null as number | null,
  customerName: '',
  productName: '',
  quantity: 1,
  unitPrice: 0,
  quotationDate: new Date().toISOString().split('T')[0],
  validUntil: '',
  status: 'draft' as QuotationStatus,
  notes: '',
})

const customers = ref<CrmCustomer[]>([])
const customersLoading = ref(false)

const calcTotal = computed(() => {
  const total = (form.value.quantity || 0) * (form.value.unitPrice || 0)
  return locale.value === 'zh-CN' ? `¥${total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
})

const onCustomerChange = (val: number | null) => {
  if (val) {
    const c = customers.value.find(c => c.id === val)
    if (c) form.value.customerName = c.companyName || ''
  }
}

const rules: FormRules = {
  customerName: [{ required: true, message: t('crm.quotations.customerNameRequired'), trigger: 'blur' }],
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
const debouncedLoad = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; loadQuotations() }, 400)
}

const handleFilter = () => { currentPage.value = 1; loadQuotations() }

const resetFilter = () => {
  searchText.value = ''; statusFilter.value = ''
  currentPage.value = 1; loadQuotations()
}

const loadQuotations = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (searchText.value) params.keyword = searchText.value
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getQuotations(params)
    quotations.value = res.data
    total.value = res.total
    computeStats()
  } catch (error: any) { ElMessage.error(error?.message || t('common.error')) }
  finally { loading.value = false }
}

const computeStats = () => {
  const all = quotations.value
  stats.value = {
    total: total.value,
    draft: all.filter(q => q.status === 'draft').length,
    accepted: all.filter(q => q.status === 'accepted').length,
    totalAmount: all.reduce((sum, q) => sum + (q.totalAmount || 0), 0),
  }
}

const getStatusLabel = (s: QuotationStatus) =>
  locale.value === 'zh-CN' ? statusMap[s] || s : statusMapEn[s] || s

const getStatusTagType = (s: QuotationStatus): string =>
  ({ draft: 'info', sent: 'primary', accepted: 'success', rejected: 'danger', expired: 'warning' }[s] || 'info')

const formatCurrency = (v: number) =>
  locale.value === 'zh-CN' ? `¥${(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 0 })}` : `$${(v || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`

const formatNumber = (v: number) =>
  (v || 0).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', { minimumFractionDigits: 2 })

const isExpired = (d: string | null | undefined) => {
  if (!d) return false
  return new Date(d) < new Date()
}

const handleAdd = () => {
  editing.value = null
  form.value = {
    customerId: null,
    customerName: '',
    productName: '',
    quantity: 1, unitPrice: 0,
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: '', status: 'draft',
    notes: '',
  }
  showDialog.value = true
}

const handleEdit = (q: Quotation) => {
  editing.value = q
  form.value = {
    customerId: (q as any).customerId ?? null,
    customerName: q.customerName,
    productName: q.productName || '',
    quantity: q.quantity || 1,
    unitPrice: q.unitPrice || 0,
    quotationDate: q.quotationDate || '',
    validUntil: q.validUntil || '',
    status: q.status,
    notes: q.notes || '',
  }
  showDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saving.value = true
    const data: any = {
      customerId: form.value.customerId ?? null,
      customerName: form.value.customerName,
      productName: form.value.productName || undefined,
      quantity: form.value.quantity,
      unitPrice: form.value.unitPrice,
      quotationDate: form.value.quotationDate || undefined,
      validUntil: form.value.validUntil || undefined,
      status: form.value.status,
      notes: form.value.notes || undefined,
    }
    if (editing.value) {
      const res: any = await updateQuotation(editing.value.id, data)
      if (res.message) ElMessage.success(res.message)
      else ElMessage.success(t('common.success'))
    } else {
      await createQuotation(data)
      ElMessage.success(t('common.success'))
    }
    showDialog.value = false
    await loadQuotations()
  } catch (error: any) { if (error !== false) ElMessage.error(error.message || t('common.error')) }
  finally { saving.value = false }
}

const handleSend = async (q: Quotation) => {
  try {
    await ElMessageBox.confirm(t('crm.quotations.sendConfirm', { n: q.quotationNumber }), t('crm.quotations.send'), { type: 'info' })
    await updateQuotation(q.id, { status: 'sent' })
    ElMessage.success(t('crm.quotations.sendSuccess'))
    await loadQuotations()
  } catch (error: any) { if (error !== 'cancel') ElMessage.error(error.message || t('common.error')) }
}

const handleAccept = async (q: Quotation) => {
  try {
    await ElMessageBox.confirm(t('crm.quotations.acceptConfirm', { n: q.quotationNumber }), t('crm.quotations.accept'), { type: 'info' })
    const res: any = await updateQuotation(q.id, { status: 'accepted' })
    if (res.message) ElMessage.success(res.message)

    // 询问是否同步创建出货记录
    const createShipment = await ElMessageBox.confirm(
      t('crm.quotations.createShipmentPrompt') || '报价已接受！是否同时创建出货记录？',
      t('crm.quotations.acceptSuccess') || '接受成功',
      { confirmButtonText: t('crm.quotations.createShipmentYes') || '创建出货记录', cancelButtonText: t('common.no') || '暂不需要', type: 'success' }
    ).then(() => true).catch(() => false)

    if (createShipment) {
      // 预填出货记录表单（通过 sessionStorage 传递数据）
      sessionStorage.setItem('quotation_to_shipment', JSON.stringify({
        customerId: q.customerId,
        customerName: q.customerName,
        quotationId: q.id,
        quotationNumber: q.quotationNumber,
        productName: q.productName,
      }))
      // 跳转到 Sales > Shipments 标签
      window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: 'shipments' } }))
    }

    await loadQuotations()
  } catch (error: any) { if (error !== 'cancel') ElMessage.error(error.message || t('common.error')) }
}

const handleDelete = async (q: Quotation) => {
  try {
    await ElMessageBox.confirm(t('crm.quotations.deleteConfirm', { n: q.quotationNumber }), t('common.warning'), { type: 'warning' })
    await deleteQuotation(q.id)
    ElMessage.success(t('common.success'))
    await loadQuotations()
  } catch (error: any) { if (error !== 'cancel') ElMessage.error(error.message || t('common.error')) }
}

const loadCustomers = async () => {
  customersLoading.value = true
  try {
    const res = await getCrmCustomers({ page: 1, pageSize: 500 })
    customers.value = res.data
  } catch {}
  finally { customersLoading.value = false }
}

onMounted(() => {
  loadQuotations()
  loadCustomers()
  // 检查是否有从线索转化跳转过来的预填数据
  const prefill = sessionStorage.getItem('lead_converted_customer')
  if (prefill) {
    sessionStorage.removeItem('lead_converted_customer')
    try {
      const data = JSON.parse(prefill)
      // 自动打开新建报价单对话框并预填
      handleAdd()
      nextTick(() => {
        if (formRef.value) {
          form.value.customerId = data.customerId
          form.value.customerName = data.customerName
          if (data.estimatedRevenue) form.value.unitPrice = Number(data.estimatedRevenue)
        }
      })
      ElMessage.info('已从转化客户预填部分数据，请完善报价信息')
    } catch {}
  }
  // 监听从线索转化跳转过来的事件
  window.addEventListener('navigate-to-sales-tab', handleNavToSalesTab)
})

onUnmounted(() => {
  window.removeEventListener('navigate-to-sales-tab', handleNavToSalesTab)
  if (searchTimer) clearTimeout(searchTimer)
})

const handleNavToSalesTab = (e: Event) => {
  const detail = (e as CustomEvent).detail
  if (detail?.tab === 'quotations' && detail?.prefill) {
    const prefill = sessionStorage.getItem('lead_converted_customer')
    if (prefill) {
      sessionStorage.removeItem('lead_converted_customer')
      try {
        const data = JSON.parse(prefill)
        handleAdd()
        nextTick(() => {
          if (formRef.value) {
            form.value.customerId = data.customerId
            form.value.customerName = data.customerName
          }
        })
      } catch {}
    }
  }
}
</script>

<style scoped lang="scss">
.quotation-module {
  .module-card {
    border-radius: 16px; border: 1px solid #e5e5e7; box-shadow: 0 1px 3px rgba(0,0,0,0.04); background: #fff;
    .card-header {
      display: flex; align-items: center; justify-content: space-between; font-weight: 600; color: #1d1d1f;
      .header-left { display: flex; align-items: center; gap: 8px; }
    }
  }
  .filter-bar {
    display: flex; align-items: center; margin-bottom: 16px; padding: 16px; background: #f5f5f7;
    border-radius: 12px; flex-wrap: wrap; gap: 12px;
    :deep(.el-input__wrapper), :deep(.el-select .el-input__wrapper) {
      border-radius: 10px; border-color: #e5e5e7; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .el-button { border-radius: 10px; font-weight: 500; }
  }
  .stats-row { margin-bottom: 16px; }
  .stat-card {
    padding: 16px; border-radius: 12px; background: #f5f5f7; text-align: center;
    .stat-value { font-size: 22px; font-weight: 700; color: #1f2329; }
    .stat-label { font-size: 13px; color: #6b7280; margin-top: 4px; }
    &.stat-draft { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); .stat-value, .stat-label { color: #fff; } }
    &.stat-accepted { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); .stat-value, .stat-label { color: #fff; } }
    &.stat-total-amount { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); .stat-value, .stat-label { color: #fff; } }
  }
  .quotation-code { font-family: 'Courier New', monospace; font-size: 12px; color: #64748b; }
  .amount-value { font-weight: 700; color: #f5576c; }
  .expired { color: #f56c6c; }
}
</style>
