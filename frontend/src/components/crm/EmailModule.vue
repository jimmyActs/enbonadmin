<template>
  <div class="email-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Message /></el-icon>
            <span>{{ $t('crm.emails.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" :icon="Edit" @click="openComposeDialog">
              {{ $t('crm.emails.compose') }}
            </el-button>
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
        <el-table-column :label="$t('common.operations')" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewEmail(row)">{{ $t('common.view') }}</el-button>
            <el-button type="success" size="small" link @click="replyEmail(row)">{{ $t('crm.emails.reply') }}</el-button>
            <el-button type="info" size="small" link @click="forwardEmail(row)">{{ $t('crm.emails.forward') }}</el-button>
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
          <div class="meta-row" v-if="selectedEmail.ccRecipients">
            <span class="meta-label">{{ $t('crm.emails.cc') }}:</span>
            <span>{{ selectedEmail.ccRecipients }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">{{ $t('crm.emails.date') }}:</span>
            <span>{{ formatDate(selectedEmail.emailDate) }}</span>
          </div>
        </div>
        <el-divider />
        <div class="email-body" v-html="sanitizedBody" />
      <div class="email-body-no-sanitize" v-if="false"><!-- 占位，避免lint --></div>
        <div v-if="selectedEmail.attachments" class="email-attachments">
          <el-divider />
          <div class="attachments-label">{{ $t('crm.emails.attachments') }} ({{ parseAttachments(selectedEmail.attachments).length }})</div>
        </div>
      </div>
    </el-dialog>

    <!-- 写邮件对话框 -->
    <el-dialog v-model="showComposeDialog" :title="$t('crm.emails.compose')" width="900px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000" :close-on-click-modal="false">
      <div class="compose-form">
        <div class="compose-row">
          <label>{{ $t('crm.emails.to') }}:</label>
          <el-input v-model="composeForm.to" :placeholder="$t('crm.emails.recipientPlaceholder')" />
        </div>
        <div class="compose-row">
          <label>{{ $t('crm.emails.cc') }}:</label>
          <el-input v-model="composeForm.cc" />
        </div>
        <div class="compose-row">
          <label>{{ $t('crm.emails.subject') }}:</label>
          <el-input v-model="composeForm.subject" :placeholder="$t('crm.emails.subjectPlaceholder')" />
        </div>
        <div class="compose-row body-row">
          <label>{{ $t('crm.emails.body') || '正文' }}:</label>
          <el-input v-model="composeForm.body" type="textarea" :rows="10"
            :placeholder="$t('crm.emails.bodyPlaceholder')" />
        </div>
        <div class="compose-row">
          <label>{{ $t('crm.emails.attachments') }}:</label>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="10"
            multiple
            :on-change="handleAttachmentChange"
          >
            <el-button size="small" :icon="Upload">{{ $t('crm.emails.attachmentTip') }}</el-button>
          </el-upload>
        </div>
      </div>
      <template #footer>
        <el-button @click="showComposeDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button @click="handleSaveDraft">{{ $t('crm.emails.draft') }}</el-button>
        <el-button type="primary" :loading="sending" @click="handleSend">{{ $t('crm.emails.send') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Message, Search, Refresh, Edit, Upload } from '@element-plus/icons-vue'
import { getCrmEmails, sendCrmEmail, saveCrmEmailDraft, markEmailRead, type CrmEmail } from '../../api/crm'
import { uploadFile } from '../../api/storage'

// XSS 防护：清理 HTML 内容中的危险标签和属性
const sanitizeHtml = (html: string): string => {
  if (!html) return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
}

// 计算属性：获取净化后的邮件正文
const sanitizedBody = computed(() => {
  if (!selectedEmail.value) return ''
  const body = selectedEmail.value.bodyHtml || selectedEmail.value.bodyText || ''
  return sanitizeHtml(body)
})

// 当前草稿ID（用于更新已有草稿）
const currentDraftId = ref<number | null>(null)

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
const showComposeDialog = ref(false)
const sending = ref(false)
const uploadRef = ref()
const attachmentFiles = ref<any[]>([])

const composeForm = reactive({
  to: '',
  cc: '',
  subject: '',
  body: '',
})

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
  // 自动标记已读
  if (!email.isRead) markEmailRead(email.id).catch(() => {})
}

const replyEmail = (email: CrmEmail) => {
  composeForm.to = email.fromEmail || ''
  composeForm.subject = `Re: ${email.subject || ''}`
  composeForm.body = `\n\n--- Original ---\n${email.fromName || email.fromEmail}\n${email.bodyText || ''}`
  showComposeDialog.value = true
}

const forwardEmail = (email: CrmEmail) => {
  composeForm.to = ''
  composeForm.subject = `Fwd: ${email.subject || ''}`
  composeForm.body = `\n\n--- Forwarded ---\nFrom: ${email.fromName || email.fromEmail}\nDate: ${formatDate(email.emailDate)}\nSubject: ${email.subject || ''}\n\n${email.bodyText || ''}`
  showComposeDialog.value = true
}

const handleAttachmentChange = (file: any) => {
  attachmentFiles.value.push(file.raw)
}

const handleSend = async () => {
  if (!composeForm.to.trim()) {
    ElMessage.warning(t('crm.emails.recipientRequired') || '请填写收件人')
    return
  }
  if (!composeForm.subject.trim()) {
    ElMessage.warning(t('crm.emails.subjectRequired') || '请填写邮件主题')
    return
  }
  sending.value = true
  try {
    // 先上传所有附件到 MinIO/存储服务
    const uploadedAttachments: { filename: string; size: number; url: string }[] = []
    for (const rawFile of attachmentFiles.value) {
      const result = await uploadFile('crm-attachments', rawFile, {
        module: 'crm-email',
        onProgress: (p) => { /* 可扩展：显示上传进度 */ },
      })
      if (result.success && result.data) {
        uploadedAttachments.push({
          filename: result.data.originalName,
          size: result.data.fileSize,
          url: result.data.downloadUrl,
        })
      }
    }
    await sendCrmEmail({
      to: composeForm.to,
      cc: composeForm.cc || undefined,
      subject: composeForm.subject,
      body: composeForm.body,
      attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
    })
    ElMessage.success(t('crm.emails.sendSuccess') || '邮件发送成功')
    showComposeDialog.value = false
    Object.assign(composeForm, { to: '', cc: '', subject: '', body: '' })
    attachmentFiles.value = []
    loadEmails()
  } catch (error: any) {
    ElMessage.error(error?.message || t('crm.emails.sendFailed') || '发送失败')
  } finally {
    sending.value = false
  }
}

// 打开写邮件对话框时重置草稿状态
const openComposeDialog = () => {
  currentDraftId.value = null
  Object.assign(composeForm, { to: '', cc: '', subject: '', body: '' })
  attachmentFiles.value = []
  showComposeDialog.value = true
}

// 草稿保存功能
const handleSaveDraft = async () => {
  if (!composeForm.subject && !composeForm.body) {
    ElMessage.warning(t('crm.emails.draftEmptyWarning') || '请输入主题或正文后再保存草稿')
    return
  }
  try {
    const data = {
      direction: 'outbound',
      subject: composeForm.subject || '(无主题)',
      bodyText: composeForm.body,
      toEmail: composeForm.to,
      ccRecipients: composeForm.cc || undefined,
      isDraft: true,
    }
    const result = await saveCrmEmailDraft(data)
    currentDraftId.value = result.id
    ElMessage.success(t('crm.emails.draftSaved') || '草稿已保存')
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error') || '保存失败')
  }
}

const parseAttachments = (str: string | null | undefined): any[] => {
  if (!str) return []
  try { return JSON.parse(str) } catch { return [] }
}

const formatDate = (d: string | null | undefined) => d
  ? new Date(d).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US')
  : '-'

onMounted(() => { loadEmails() })

onBeforeUnmount(() => { if (searchTimer) clearTimeout(searchTimer) })

defineExpose({ reload: loadEmails })
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
  .compose-form {
    .compose-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
      label { font-weight: 600; color: #64748b; min-width: 60px; line-height: 32px; }
      :deep(.el-input__wrapper), :deep(.el-textarea__inner) { border-radius: 8px; }
    }
    .body-row { align-items: flex-start; }
  }
}
</style>
