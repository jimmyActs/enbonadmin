<template>
  <div class="email-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Message /></el-icon>
            <span>{{ $t('crm.emails.title') }}</span>
          </div>
        </div>
      </template>

      <!-- 筛选 -->
      <div class="filter-bar">
        <el-input v-model="searchText" :placeholder="$t('crm.emails.searchPlaceholder')" clearable
          style="width: 240px; margin-right: 12px;" @input="debouncedLoad">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="directionFilter" :placeholder="$t('crm.emails.direction')" clearable
          style="width: 130px; margin-right: 12px;" @change="handleFilter">
          <el-option :label="$t('crm.emails.allDirections')" value="" />
          <el-option :label="$t('crm.emails.inbound')" value="inbound" />
          <el-option :label="$t('crm.emails.outbound')" value="outbound" />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">{{ $t('common.reset') }}</el-button>
      </div>

      <!-- 邮件列表 -->
      <el-table :data="emails" stripe v-loading="loading" row-key="id" class="email-table">
        <el-table-column prop="direction" :label="$t('crm.emails.direction')" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.direction === 'inbound' ? 'primary' : 'success'" effect="plain">
              {{ row.direction === 'inbound' ? $t('crm.emails.inbound') : $t('crm.emails.outbound') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="subject" :label="$t('crm.emails.subject')" min-width="250">
          <template #default="{ row }">
            <div class="email-subject-cell">
              <span class="subject-text" :class="{ unread: !row.isRead }">{{ row.subject || '-' }}</span>
              <span class="email-from">{{ row.fromName || row.fromEmail }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="snippet" :label="$t('crm.emails.snippet')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="emailDate" :label="$t('crm.emails.date')" width="160">
          <template #default="{ row }">{{ formatDate(row.emailDate) }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewEmail(row)">{{ $t('common.view') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="loadEmails"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 邮件详情对话框 -->
    <el-dialog v-model="showEmailDialog" :title="$t('crm.emails.emailDetail')" width="800px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000">
      <div v-if="selectedEmail" class="email-detail">
        <div class="email-meta">
          <div class="meta-row">
            <span class="meta-label">{{ $t('crm.emails.from') }}:</span>
            <span>{{ selectedEmail.fromName || '' }} &lt;{{ selectedEmail.fromEmail }}&gt;</span>
          </div>
          <div class="meta-row" v-if="selectedEmail.toRecipients">
            <span class="meta-label">{{ $t('crm.emails.to') }}:</span>
            <span>{{ selectedEmail.toRecipients }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">{{ $t('crm.emails.date') }}:</span>
            <span>{{ formatDate(selectedEmail.emailDate) }}</span>
          </div>
        </div>
        <el-divider />
        <div class="email-body" v-html="selectedEmail.bodyHtml || selectedEmail.bodyText || ''" />
        <div v-if="selectedEmail.attachments" class="email-attachments">
          <el-divider />
          <div class="attachments-label">{{ $t('crm.emails.attachments') }} ({{ parseAttachments(selectedEmail.attachments).length }})</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Message, Search, Refresh } from '@element-plus/icons-vue'
import { getCrmEmails, type CrmEmail } from '../../api/crm'

const { t, locale } = useI18n()
const loading = ref(false)
const emails = ref<CrmEmail[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchText = ref('')
const directionFilter = ref('')
const showEmailDialog = ref(false)
const selectedEmail = ref<CrmEmail | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null
const debouncedLoad = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; loadEmails() }, 400)
}

const handleFilter = () => { currentPage.value = 1; loadEmails() }
const resetFilter = () => { searchText.value = ''; directionFilter.value = ''; currentPage.value = 1; loadEmails() }

const loadEmails = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (searchText.value) params.keyword = searchText.value
    if (directionFilter.value) params.direction = directionFilter.value
    const res = await getCrmEmails(params)
    emails.value = res.data
    total.value = res.total
  } catch (error: any) { ElMessage.error(error?.message || t('common.error')) }
  finally { loading.value = false }
}

const viewEmail = (email: CrmEmail) => {
  selectedEmail.value = email
  showEmailDialog.value = true
}

const parseAttachments = (str: string | null | undefined): any[] => {
  if (!str) return []
  try { return JSON.parse(str) } catch { return [] }
}

const formatDate = (d: string | null | undefined) => d
  ? new Date(d).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US')
  : '-'

onMounted(() => { loadEmails() })
</script>

<style scoped lang="scss">
.email-module {
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
  .email-subject-cell {
    display: flex; flex-direction: column;
    .subject-text { font-weight: 600; color: #1f2329; &.unread { color: #409eff; } }
    .email-from { font-size: 12px; color: #64748b; margin-top: 2px; }
  }
  .email-detail {
    .email-meta { .meta-row { margin-bottom: 8px; display: flex; gap: 8px; align-items: baseline; }
      .meta-label { font-weight: 600; color: #64748b; min-width: 60px; } }
    .email-body { line-height: 1.8; color: #1f2329; min-height: 200px; }
    .attachments-label { font-weight: 600; color: #64748b; }
  }
}
</style>
