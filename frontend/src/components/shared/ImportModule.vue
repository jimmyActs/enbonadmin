<template>
  <div class="import-module">
    <!-- 导入管理标签页 -->
    <el-tabs v-model="activeTab" class="import-tabs">
      <!-- 商机导入 -->
      <el-tab-pane label="商机批量导入" name="leads">
        <template #label>
          <span class="tab-label">
            <el-icon><TrendCharts /></el-icon>
            <span>商机导入</span>
          </span>
        </template>
        <div class="panel-section">
          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="mb-16"
          >
            <template #title>
              支持 Excel 文件导入商机（.xlsx / .xls）。<strong>公司名称</strong>存在则覆盖更新，不存在则新建。
              请使用下方模板文件格式。
            </template>
          </el-alert>

          <div class="action-bar">
            <el-button type="primary" :icon="Download" @click="downloadLeadsTemplate" :loading="dlLoading">
              下载商机导入模板
            </el-button>
            <el-upload
              ref="leadsUploadRef"
              :auto-upload="false"
              :limit="1"
              accept=".xlsx,.xls"
              :on-change="onLeadsFileChange"
              :on-remove="() => { selectedLeadsFile = null }"
              class="upload-btn"
            >
              <el-button type="success" :icon="Upload">选择 Excel 文件</el-button>
            </el-upload>
            <el-button
              v-if="selectedLeadsFile"
              type="warning"
              :icon="Check"
              :loading="importingLeads"
              @click="doImportLeads"
            >
              开始导入
            </el-button>
          </div>

          <!-- 商机导入结果 -->
          <div v-if="leadsResult" class="import-result mt-16">
            <el-divider content-position="left">导入结果</el-divider>
            <el-descriptions :column="4" border size="small">
              <el-descriptions-item label="新增">
                <el-tag type="success">{{ leadsResult.imported }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="更新">
                <el-tag type="warning">{{ leadsResult.updated }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="跳过">
                <el-tag type="info">{{ leadsResult.skipped }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(leadsResult)">{{ getStatusText(leadsResult) }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
            <el-alert
              v-if="leadsResult.errors?.length"
              type="warning"
              :closable="false"
              class="mt-12"
              show-icon
            >
              <template #title>错误记录（前 10 条）</template>
              <ul class="error-list">
                <li v-for="(err, i) in leadsResult.errors.slice(0, 10)" :key="i">{{ err }}</li>
              </ul>
            </el-alert>
          </div>
        </div>
      </el-tab-pane>

      <!-- 员工导入 -->
      <el-tab-pane label="员工花名册导入" name="employees">
        <template #label>
          <span class="tab-label">
            <el-icon><User /></el-icon>
            <span>员工导入</span>
          </span>
        </template>
        <div class="panel-section">
          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="mb-16"
          >
            <template #title>
              支持 Excel 文件导入员工花名册。<strong>用户名</strong>存在则更新信息，不存在则新建账号（默认密码 123456）。
            </template>
          </el-alert>

          <div class="action-bar">
            <el-button type="primary" :icon="Download" @click="downloadEmployeesTemplate" :loading="dlLoading">
              下载员工导入模板
            </el-button>
            <el-upload
              ref="empUploadRef"
              :auto-upload="false"
              :limit="1"
              accept=".xlsx,.xls"
              :on-change="onEmpFileChange"
              :on-remove="() => { selectedEmpFile = null }"
              class="upload-btn"
            >
              <el-button type="success" :icon="Upload">选择 Excel 文件</el-button>
            </el-upload>
            <el-button
              v-if="selectedEmpFile"
              type="warning"
              :icon="Check"
              :loading="importingEmployees"
              @click="doImportEmployees"
            >
              开始导入
            </el-button>
          </div>

          <!-- 员工导入结果 -->
          <div v-if="empResult" class="import-result mt-16">
            <el-divider content-position="left">导入结果</el-divider>
            <el-descriptions :column="4" border size="small">
              <el-descriptions-item label="新增">
                <el-tag type="success">{{ empResult.imported }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="更新">
                <el-tag type="warning">{{ empResult.updated }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="跳过">
                <el-tag type="info">{{ empResult.skipped }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(empResult)">{{ getStatusText(empResult) }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
            <el-alert
              v-if="empResult.errors?.length"
              type="warning"
              :closable="false"
              class="mt-12"
              show-icon
            >
              <template #title>错误记录（前 10 条）</template>
              <ul class="error-list">
                <li v-for="(err, i) in empResult.errors.slice(0, 10)" :key="i">{{ err }}</li>
              </ul>
            </el-alert>
          </div>
        </div>
      </el-tab-pane>

      <!-- 导入历史 -->
      <el-tab-pane label="导入历史" name="history">
        <template #label>
          <span class="tab-label">
            <el-icon><Clock /></el-icon>
            <span>导入历史</span>
          </span>
        </template>
        <div class="panel-section">
          <div class="history-toolbar">
            <el-select v-model="historyModule" placeholder="全部模块" clearable size="default" style="width: 200px">
              <el-option label="商机导入" value="crm_leads" />
              <el-option label="员工导入" value="hr_employees" />
            </el-select>
            <el-button :icon="Refresh" @click="loadHistory" :loading="historyLoading">刷新</el-button>
          </div>

          <el-table :data="historyData" stripe size="small" class="mt-12" v-loading="historyLoading">
            <el-table-column prop="createdAt" label="导入时间" width="170">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column prop="module" label="模块" width="140">
              <template #default="{ row }">
                <el-tag size="small">{{ getModuleName(row.module) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="userName" label="操作人" width="120" />
            <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
            <el-table-column label="结果统计" width="260">
              <template #default="{ row }">
                <span class="stat-chip success">+{{ row.importedCount }}</span>
                <span class="stat-chip warning">~{{ row.updatedCount }}</span>
                <span class="stat-chip info">-{{ row.skippedCount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 'success' ? 'success' : row.status === 'partial' ? 'warning' : 'danger'">
                  {{ { success: '成功', partial: '部分成功', failed: '失败' }[row.status] || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="errorSummary" label="错误摘要" min-width="200" show-overflow-tooltip />
          </el-table>

          <el-pagination
            v-if="historyTotal > 0"
            v-model:current-page="historyPage"
            v-model:page-size="historyPageSize"
            :total="historyTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            class="mt-16"
            @current-change="loadHistory"
            @size-change="loadHistory"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download, Upload, Check, Refresh, TrendCharts, User, Clock,
} from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import {
  importCrmLeads, downloadCrmLeadsTemplate,
  type ImportResult,
} from '../../api/crm'
import {
  importEmployees, downloadEmployeeTemplate, getImportHistory,
  type ImportHistory,
} from '../../api/hr'

const activeTab = ref('leads')

// ==================== 商机导入 ====================
const leadsUploadRef = ref()
const selectedLeadsFile = ref<File | null>(null)
const importingLeads = ref(false)
const leadsResult = ref<ImportResult | null>(null)

const onLeadsFileChange = (file: any) => {
  selectedLeadsFile.value = file.raw
  leadsResult.value = null
}

const downloadLeadsTemplate = async () => {
  dlLoading.value = true
  try {
    const res = await downloadCrmLeadsTemplate()
    downloadExcel(res.buffer, res.filename)
    ElMessage.success('商机导入模板下载成功')
  } catch (e: any) {
    ElMessage.error('下载失败：' + (e?.message || '未知错误'))
  } finally {
    dlLoading.value = false
  }
}

const doImportLeads = async () => {
  if (!selectedLeadsFile.value) return
  importingLeads.value = true
  leadsResult.value = null
  try {
    const result = await importCrmLeads(selectedLeadsFile.value)
    leadsResult.value = result
    ElMessage.success(`商机导入完成：新增 ${result.imported}，更新 ${result.updated}，跳过 ${result.skipped}`)
  } catch (e: any) {
    ElMessage.error('导入失败：' + (e?.message || '未知错误'))
  } finally {
    importingLeads.value = false
  }
}

// ==================== 员工导入 ====================
const empUploadRef = ref()
const selectedEmpFile = ref<File | null>(null)
const importingEmployees = ref(false)
const empResult = ref<ImportResult | null>(null)
const dlLoading = ref(false)

const onEmpFileChange = (file: any) => {
  selectedEmpFile.value = file.raw
  empResult.value = null
}

const downloadEmployeesTemplate = async () => {
  dlLoading.value = true
  try {
    const res = await downloadEmployeeTemplate()
    downloadExcel(res.buffer, res.filename)
    ElMessage.success('员工导入模板下载成功')
  } catch (e: any) {
    ElMessage.error('下载失败：' + (e?.message || '未知错误'))
  } finally {
    dlLoading.value = false
  }
}

const doImportEmployees = async () => {
  if (!selectedEmpFile.value) return
  importingEmployees.value = true
  empResult.value = null
  try {
    const result = await importEmployees(selectedEmpFile.value)
    empResult.value = result
    ElMessage.success(`员工导入完成：新增 ${result.imported}，更新 ${result.updated}，跳过 ${result.skipped}`)
  } catch (e: any) {
    ElMessage.error('导入失败：' + (e?.message || '未知错误'))
  } finally {
    importingEmployees.value = false
  }
}

// ==================== 导入历史 ====================
const historyData = ref<ImportHistory[]>([])
const historyTotal = ref(0)
const historyPage = ref(1)
const historyPageSize = ref(20)
const historyModule = ref('')
const historyLoading = ref(false)

const loadHistory = async () => {
  historyLoading.value = true
  try {
    const res = await getImportHistory({
      module: historyModule.value || undefined,
      page: historyPage.value,
      pageSize: historyPageSize.value,
    })
    historyData.value = res.data
    historyTotal.value = res.total
  } catch (e: any) {
    ElMessage.error('加载历史记录失败：' + (e?.message || '未知错误'))
  } finally {
    historyLoading.value = false
  }
}

const getModuleName = (module: string) => ({
  crm_leads: '商机导入',
  hr_attendance: '考勤导入',
  hr_employees: '员工导入',
}[module] || module)

// ==================== 工具 ====================
const downloadExcel = (base64: string, filename: string) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const formatDate = (d: string) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN')
}

const getStatusType = (r: ImportResult) => {
  if (r.imported === 0 && r.updated === 0) return 'danger'
  if (r.skipped > 0) return 'warning'
  return 'success'
}

const getStatusText = (r: ImportResult) => {
  if (r.imported === 0 && r.updated === 0) return '失败'
  if (r.skipped > 0) return '部分成功'
  return '成功'
}

onMounted(() => { loadHistory() })
</script>

<style scoped lang="scss">
.import-module {
  .import-tabs {
    background: #fff;
    border-radius: 12px;
    padding: 16px 20px;
    border: 1px solid rgba(15, 23, 42, 0.06);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    :deep(.el-tabs__header) { margin-bottom: 16px; }
    :deep(.el-tabs__nav-wrap::after) { display: none; }
    :deep(.el-tabs__item) {
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    :deep(.el-tabs__content) { padding: 0; }
  }

  .panel-section {
    padding: 8px 0;
  }

  .tab-label {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .mb-16 { margin-bottom: 16px; }
  .mt-12 { margin-top: 12px; }
  .mt-16 { margin-top: 16px; }

  .action-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .upload-btn {
    :deep(.el-upload__input) { display: none; }
  }

  .import-result {
    padding: 16px;
    background: #f9fafb;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
  }

  .error-list {
    margin: 8px 0 0;
    padding-left: 20px;
    font-size: 13px;
    color: #d97706;
    li { margin-bottom: 4px; }
  }

  .history-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .stat-chip {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    margin-right: 4px;
    &.success { background: #dcfce7; color: #16a34a; }
    &.warning { background: #fef9c3; color: #d97706; }
    &.info { background: #f3f4f6; color: #6b7280; }
  }
}
</style>
