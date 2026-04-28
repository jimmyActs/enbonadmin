<template>
  <div class="shipment-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Box /></el-icon>
            <span>{{ $t('crm.shipments.title') }}</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            {{ $t('crm.shipments.add') }}
          </el-button>
        </div>
      </template>

      <!-- 筛选 -->
      <div class="filter-bar">
        <el-input v-model="searchText" :placeholder="$t('crm.shipments.searchPlaceholder')" clearable
          style="width: 240px; margin-right: 12px;" @input="debouncedLoad">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="fileTypeFilter" :placeholder="$t('crm.shipments.filterByType')" clearable
          style="width: 160px; margin-right: 12px;" @change="handleFilter">
          <el-option :label="$t('crm.shipments.allTypes')" value="" />
          <el-option v-for="(label, key) in fileTypeMap" :key="key" :label="label" :value="key" />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">{{ $t('common.reset') }}</el-button>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="12" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">{{ $t('crm.shipments.total') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-invoice">
            <div class="stat-value">{{ stats.invoice }}</div>
            <div class="stat-label">{{ $t('crm.shipments.typeInvoice') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-packing">
            <div class="stat-value">{{ stats.packingList }}</div>
            <div class="stat-label">{{ $t('crm.shipments.typePackingList') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-bol">
            <div class="stat-value">{{ stats.bol }}</div>
            <div class="stat-label">{{ $t('crm.shipments.typeBillOfLading') }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- 出货文件列表 -->
      <el-table :data="shipments" stripe v-loading="loading" row-key="id" class="shipment-table">
        <el-table-column prop="shipmentCode" :label="$t('crm.shipments.code')" width="180">
          <template #default="{ row }">
            <span class="shipment-code">{{ row.shipmentCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="shipmentBatch" :label="$t('crm.shipments.batch')" width="150" show-overflow-tooltip />
        <el-table-column prop="customerName" :label="$t('crm.shipments.customer')" min-width="140" show-overflow-tooltip />
        <el-table-column prop="fileType" :label="$t('crm.shipments.fileType')" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="getFileTypeTagType(row.fileType)">{{ getFileTypeLabel(row.fileType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" :label="$t('crm.shipments.fileName')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="version" :label="$t('crm.shipments.version')" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.version || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="destinationCountry" :label="$t('crm.shipments.destination')" width="120" />
        <el-table-column prop="trackingNumber" :label="$t('crm.shipments.tracking')" width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.trackingNumber || '-' }}</template>
        </el-table-column>
        <el-table-column prop="qrCodeToken" :label="$t('crm.shipments.qrToken')" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.qrCodeToken" size="small" type="success" effect="plain">{{ $t('crm.shipments.hasQr') }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" :label="$t('crm.shipments.createdAt')" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="View" link @click="handleView(row)">{{ $t('common.view') }}</el-button>
            <el-button type="primary" size="small" :icon="Edit" link @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
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
        @current-change="loadShipments"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 添加/编辑出货文件对话框 -->
    <el-dialog v-model="showDialog" :title="editing ? $t('crm.shipments.edit') : $t('crm.shipments.add')"
      width="720px" :close-on-click-modal="false"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.shipments.batch')">
              <el-input v-model="form.shipmentBatch" :placeholder="$t('crm.shipments.batchPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.shipments.fileType')" prop="fileType">
              <el-select v-model="form.fileType" style="width: 100%;">
                <el-option v-for="(label, key) in fileTypeMap" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.shipments.customer')">
              <el-input v-model="form.customerName" :placeholder="$t('crm.shipments.customerPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.shipments.destination')">
              <el-input v-model="form.destinationCountry" :placeholder="$t('crm.shipments.destinationPlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.shipments.fileName')">
              <el-input v-model="form.fileName" :placeholder="$t('crm.shipments.fileNamePlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.shipments.version')">
              <el-input v-model="form.version" placeholder="v1.0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.shipments.productModel')">
              <el-input v-model="form.productModel" :placeholder="$t('crm.shipments.productModelPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.shipments.productName')">
              <el-input v-model="form.productName" :placeholder="$t('crm.shipments.productNamePlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="$t('crm.shipments.quantity')">
              <el-input-number v-model="form.quantity" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('crm.shipments.tracking')">
              <el-input v-model="form.trackingNumber" :placeholder="$t('crm.shipments.trackingPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('crm.shipments.shippingMethod')">
              <el-select v-model="form.shippingMethod" style="width: 100%;">
                <el-option label="海运 (Sea)" value="sea" />
                <el-option label="空运 (Air)" value="air" />
                <el-option label="快递 (Express)" value="express" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('crm.shipments.description')">
          <el-input v-model="form.description" type="textarea" :rows="2" :placeholder="$t('crm.shipments.descriptionPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="showDetailDialog" :title="$t('crm.shipments.detail')" width="600px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <div v-if="selectedShipment" class="shipment-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('crm.shipments.code')">{{ selectedShipment.shipmentCode }}</el-descriptions-item>
          <el-descriptions-item :label="$t('crm.shipments.fileType')">{{ getFileTypeLabel(selectedShipment.fileType) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('crm.shipments.customer')">{{ selectedShipment.customerName || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('crm.shipments.destination')">{{ selectedShipment.destinationCountry || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('crm.shipments.fileName')">{{ selectedShipment.fileName }}</el-descriptions-item>
          <el-descriptions-item :label="$t('crm.shipments.version')">{{ selectedShipment.version || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('crm.shipments.tracking')">{{ selectedShipment.trackingNumber || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('crm.shipments.shippingMethod')">{{ selectedShipment.shippingMethod || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('crm.shipments.productModel')" :span="2">{{ selectedShipment.productModel || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('crm.shipments.description')" :span="2">{{ selectedShipment.description || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('crm.shipments.qrToken')" :span="2">
            <template v-if="selectedShipment.qrCodeToken">
              <span class="qr-token">{{ selectedShipment.qrCodeToken }}</span>
              <el-tag size="small" type="success" style="margin-left: 8px;">{{ $t('crm.shipments.publicAccess') }}</el-tag>
            </template>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('crm.shipments.createdAt')" :span="2">{{ formatDate(selectedShipment.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Box, Plus, Search, Refresh, Edit, Delete, View } from '@element-plus/icons-vue'
import { getCrmShipmentFiles, createCrmShipmentFile, updateCrmShipmentFile, deleteCrmShipmentFile,
  type CrmShipmentFile, type ShipmentFileType } from '../../api/crm'

const { t, locale } = useI18n()

const loading = ref(false)
const saving = ref(false)
const shipments = ref<CrmShipmentFile[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchText = ref('')
const fileTypeFilter = ref('')
const showDialog = ref(false)
const showDetailDialog = ref(false)
const editing = ref<CrmShipmentFile | null>(null)
const selectedShipment = ref<CrmShipmentFile | null>(null)
const formRef = ref<FormInstance>()
const stats = ref({ total: 0, invoice: 0, packingList: 0, bol: 0 })

const fileTypeMap: Record<ShipmentFileType, string> = {
  invoice: '发票/商业发票', packing_list: '装箱单', bill_of_lading: '提单', coo: '原产地证',
  bl: '海运单', quantity_list: '数量清单', manual: '说明书', firmware: '固件',
  software: '软件', photo: '出货照片', video: '视频', other: '其他',
}

const fileTypeMapEn: Record<ShipmentFileType, string> = {
  invoice: 'Invoice', packing_list: 'Packing List', bill_of_lading: 'Bill of Lading', coo: 'COO',
  bl: 'B/L', quantity_list: 'Quantity List', manual: 'Manual', firmware: 'Firmware',
  software: 'Software', photo: 'Photos', video: 'Video', other: 'Other',
}

const form = ref({
  shipmentBatch: '',
  fileType: 'invoice' as ShipmentFileType,
  customerName: '',
  destinationCountry: '',
  fileName: '',
  version: '',
  productModel: '',
  productName: '',
  quantity: 1,
  trackingNumber: '',
  shippingMethod: '',
  description: '',
})

const rules: FormRules = {
  fileType: [{ required: true, message: t('crm.shipments.fileTypeRequired'), trigger: 'change' }],
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
const debouncedLoad = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; loadShipments() }, 400)
}

const handleFilter = () => { currentPage.value = 1; loadShipments() }

const resetFilter = () => {
  searchText.value = ''; fileTypeFilter.value = ''
  currentPage.value = 1; loadShipments()
}

const loadShipments = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (searchText.value) params.keyword = searchText.value
    const res = await getCrmShipmentFiles(params)
    shipments.value = res.data
    total.value = res.total
    computeStats()
  } catch (error: any) { ElMessage.error(error?.message || t('common.error')) }
  finally { loading.value = false }
}

const computeStats = () => {
  const all = shipments.value
  stats.value = {
    total: total.value,
    invoice: all.filter(s => s.fileType === 'invoice').length,
    packingList: all.filter(s => s.fileType === 'packing_list').length,
    bol: all.filter(s => s.fileType === 'bill_of_lading').length,
  }
}

const getFileTypeLabel = (s: ShipmentFileType) =>
  locale.value === 'zh-CN' ? fileTypeMap[s] || s : fileTypeMapEn[s] || s

const getFileTypeTagType = (s: ShipmentFileType): string => {
  const types: Record<string, string> = {
    invoice: 'danger', packing_list: 'warning', bill_of_lading: 'primary',
    coo: 'success', bl: 'info', quantity_list: 'warning', manual: '',
    firmware: 'info', software: '', photo: 'success', video: 'success', other: 'info',
  }
  return types[s] || 'info'
}

const formatDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US') : '-'

const handleAdd = () => {
  editing.value = null
  form.value = {
    shipmentBatch: '', fileType: 'invoice',
    customerName: '', destinationCountry: '',
    fileName: '', version: '', productModel: '',
    productName: '', quantity: 1, trackingNumber: '',
    shippingMethod: '', description: '',
  }
  // 检查是否有从报价单跳转过来的预填数据
  const prefill = sessionStorage.getItem('quotation_to_shipment')
  if (prefill) {
    sessionStorage.removeItem('quotation_to_shipment')
    try {
      const data = JSON.parse(prefill)
      form.value.customerName = data.customerName || ''
      form.value.productName = data.productName || ''
      form.value.shipmentBatch = data.quotationNumber ? `QT-${data.quotationNumber}` : ''
      ElMessage.info('已从报价单预填部分数据，请完善出货信息')
    } catch {}
  }
  showDialog.value = true
}

const handleEdit = (s: CrmShipmentFile) => {
  editing.value = s
  form.value = {
    shipmentBatch: s.shipmentBatch || '',
    fileType: s.fileType,
    customerName: s.customerName || '',
    destinationCountry: s.destinationCountry || '',
    fileName: s.fileName || '',
    version: s.version || '',
    productModel: s.productModel || '',
    productName: s.productName || '',
    quantity: s.quantity || 1,
    trackingNumber: s.trackingNumber || '',
    shippingMethod: s.shippingMethod || '',
    description: s.description || '',
  }
  showDialog.value = true
}

const handleView = (s: CrmShipmentFile) => {
  selectedShipment.value = s
  showDetailDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saving.value = true
    const data: any = {
      shipmentBatch: form.value.shipmentBatch || undefined,
      fileType: form.value.fileType,
      customerName: form.value.customerName || undefined,
      destinationCountry: form.value.destinationCountry || undefined,
      fileName: form.value.fileName || undefined,
      version: form.value.version || undefined,
      productModel: form.value.productModel || undefined,
      productName: form.value.productName || undefined,
      quantity: form.value.quantity || undefined,
      trackingNumber: form.value.trackingNumber || undefined,
      shippingMethod: form.value.shippingMethod || undefined,
      description: form.value.description || undefined,
    }
    if (editing.value) {
      await updateCrmShipmentFile(editing.value.id, data)
    } else {
      await createCrmShipmentFile(data)
    }
    ElMessage.success(t('common.success'))
    showDialog.value = false
    await loadShipments()
  } catch (error: any) { if (error !== false) ElMessage.error(error.message || t('common.error')) }
  finally { saving.value = false }
}

const handleDelete = async (s: CrmShipmentFile) => {
  try {
    await ElMessageBox.confirm(
      t('crm.shipments.deleteConfirm', { n: s.shipmentCode }),
      t('common.warning'), { type: 'warning' }
    )
    await deleteCrmShipmentFile(s.id)
    ElMessage.success(t('common.success'))
    await loadShipments()
  } catch (error: any) { if (error !== 'cancel') ElMessage.error(error.message || t('common.error')) }
}

onMounted(() => { loadShipments() })

defineExpose({ reload: loadShipments })
</script>

<style scoped lang="scss">
.shipment-module {
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
    &.stat-invoice { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); .stat-value, .stat-label { color: #fff; } }
    &.stat-packing { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); .stat-value, .stat-label { color: #fff; } }
    &.stat-bol { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); .stat-value, .stat-label { color: #fff; } }
  }
  .shipment-code { font-family: 'Courier New', monospace; font-size: 12px; color: #64748b; }
  .qr-token { font-family: 'Courier New', monospace; font-size: 11px; color: #64748b; word-break: break-all; }
}
</style>
