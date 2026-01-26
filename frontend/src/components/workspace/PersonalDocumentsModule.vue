<template>
  <div class="personal-docs-module">
    <div class="module-header">
      <div class="header-left">
        <el-icon class="header-icon"><FolderOpened /></el-icon>
        <div>
          <h2>{{ $t('workspace.personalDocs.title') }}</h2>
          <p>{{ $t('workspace.personalDocs.subtitle') }}</p>
        </div>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        {{ $t('workspace.personalDocs.addDocument') }}
      </el-button>
    </div>

    <el-row :gutter="16" class="summary-row">
      <el-col :md="6" :sm="12" :xs="24">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-value">{{ summaryData.total }}</div>
          <div class="summary-label">{{ $t('workspace.personalDocs.totalDocuments') }}</div>
        </el-card>
      </el-col>
      <el-col :md="6" :sm="12" :xs="24">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-value">{{ formatSize(summaryData.totalSize) }}</div>
          <div class="summary-label">{{ $t('workspace.personalDocs.totalStorage') }}</div>
        </el-card>
      </el-col>
      <el-col :md="12" :sm="24" :xs="24">
        <el-card shadow="hover" class="summary-card categories-card">
          <div class="categories-list">
            <div
              v-for="category in categoryOptions"
              :key="category.value"
              class="category-item"
            >
              <span class="category-name">{{ category.label }}</span>
              <span class="category-count">{{ summaryData.categories?.[category.value] || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :md="8" :sm="12" :xs="24">
          <el-input
            v-model="searchKeyword"
            :placeholder="$t('workspace.personalDocs.searchPlaceholder')"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :md="6" :sm="12" :xs="24">
          <el-select
            v-model="categoryFilter"
            class="category-select"
            :placeholder="$t('workspace.personalDocs.filterByCategory')"
            clearable
          >
            <el-option
              v-for="option in categoryOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <el-table
      :data="filteredDocuments"
      v-loading="loading"
      class="documents-table"
    >
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="doc-description" v-if="row.description">
            <strong>{{ $t('workspace.personalDocs.description') }}：</strong>{{ row.description }}
          </div>
          <div class="doc-tags" v-if="row.tagList && row.tagList.length">
            <strong>{{ $t('workspace.personalDocs.tags') }}：</strong>
            <el-tag
              v-for="tag in row.tagList"
              :key="tag"
              size="small"
              class="doc-tag"
            >{{ tag }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="title"
        :label="$t('workspace.personalDocs.tableHeaders.title')"
        min-width="220"
      >
        <template #default="{ row }">
          <div class="doc-title-cell">
            <el-icon class="pin-icon" :class="{ pinned: row.pinned }" @click.stop="handleTogglePin(row)">
              <StarFilled />
            </el-icon>
            <div class="title-wrapper">
              <div class="title-text">{{ row.title }}</div>
              <div class="title-sub" v-if="row.originalName">{{ row.originalName }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="category"
        :label="$t('workspace.personalDocs.tableHeaders.category')"
        width="140"
      >
        <template #default="{ row }">
          <el-tag type="info">{{ getCategoryLabel(row.category) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="fileSize"
        :label="$t('workspace.personalDocs.tableHeaders.size')"
        width="140"
      >
        <template #default="{ row }">
          {{ formatSize(row.fileSize || 0) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="updatedAt"
        :label="$t('workspace.personalDocs.tableHeaders.updatedAt')"
        width="180"
      >
        <template #default="{ row }">
          {{ formatDateTime(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('workspace.personalDocs.tableHeaders.actions')"
        width="220"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button link type="primary" @click="handleDownload(row)" :disabled="!row.filePath">
            {{ $t('workspace.personalDocs.actions.download') }}
          </el-button>
          <el-button link type="primary" @click="handleEdit(row)">
            {{ $t('workspace.personalDocs.actions.edit') }}
          </el-button>
          <el-button link type="danger" @click="handleDelete(row)">
            {{ $t('workspace.personalDocs.actions.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && filteredDocuments.length === 0" :description="$t('common.noData')" />

    <el-dialog
      v-model="dialogVisible"
      :title="editingDocument ? $t('workspace.personalDocs.editDocument') : $t('workspace.personalDocs.addDocument')"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <el-form-item :label="$t('workspace.personalDocs.form.title')" prop="title">
          <el-input v-model="formData.title" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('workspace.personalDocs.form.description')">
          <el-input type="textarea" v-model="formData.description" :rows="3" maxlength="300" show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('workspace.personalDocs.form.category')" prop="category">
          <el-select v-model="formData.category" style="width: 100%">
            <el-option
              v-for="option in categoryOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('workspace.personalDocs.form.tags')">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            :placeholder="$t('workspace.personalDocs.form.tagsPlaceholder')"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('workspace.personalDocs.form.file')" prop="file">
          <el-upload
            class="upload-block"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="uploadFileList"
            :limit="1"
            accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.csv,.txt,.zip"
          >
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-text">{{ $t('workspace.personalDocs.form.uploadText') }}</div>
            <template #tip>
              <div class="el-upload__tip">{{ $t('workspace.personalDocs.form.uploadTip') }}</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogClose">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { FolderOpened, Plus, Search, UploadFilled, StarFilled } from '@element-plus/icons-vue'
import {
  createPersonalDocument,
  deletePersonalDocument,
  downloadPersonalDocument,
  fetchPersonalDocumentSummary,
  fetchPersonalDocuments,
  togglePinPersonalDocument,
  updatePersonalDocument,
  type PersonalDocument,
  PersonalDocumentCategory,
  type PersonalDocumentSummary,
} from '../../api/personal-docs'

const { t } = useI18n()

const documents = ref<PersonalDocument[]>([])
const summary = ref<PersonalDocumentSummary>({ total: 0, totalSize: 0, categories: {} })
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingDocument = ref<PersonalDocument | null>(null)
const formRef = ref<FormInstance>()

const searchKeyword = ref('')
const categoryFilter = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const uploadFileList = ref<any[]>([])

const formData = reactive({
  title: '',
  description: '',
  category: PersonalDocumentCategory.DOCUMENT,
  tags: [] as string[],
})

const formRules: FormRules = {
  title: [{ required: true, message: t('workspace.personalDocs.validation.titleRequired'), trigger: 'blur' }],
  category: [{ required: true, message: t('workspace.personalDocs.validation.categoryRequired'), trigger: 'change' }],
}

const categoryOptions = computed(() => [
  { value: PersonalDocumentCategory.DOCUMENT, label: t('workspace.personalDocs.categories.document') },
  { value: PersonalDocumentCategory.SPREADSHEET, label: t('workspace.personalDocs.categories.spreadsheet') },
  { value: PersonalDocumentCategory.PRESENTATION, label: t('workspace.personalDocs.categories.presentation') },
  { value: PersonalDocumentCategory.TEMPLATE, label: t('workspace.personalDocs.categories.template') },
  { value: PersonalDocumentCategory.OTHER, label: t('workspace.personalDocs.categories.other') },
])

const summaryData = computed(() => summary.value)

const filteredDocuments = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  return documents.value
    .filter(doc => {
      const matchKeyword = keyword
        ? doc.title.toLowerCase().includes(keyword) ||
          (doc.description?.toLowerCase().includes(keyword) ?? false) ||
          (doc.tagList || []).some(tag => tag.toLowerCase().includes(keyword))
        : true
      const matchCategory = categoryFilter.value ? doc.category === categoryFilter.value : true
      return matchKeyword && matchCategory
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
})

const loadDocuments = async () => {
  try {
    loading.value = true
    documents.value = await fetchPersonalDocuments()
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const loadSummary = async () => {
  try {
    summary.value = await fetchPersonalDocumentSummary()
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load summary', error)
    }
  }
}

const resetForm = () => {
  formData.title = ''
  formData.description = ''
  formData.category = PersonalDocumentCategory.DOCUMENT
  formData.tags = []
  selectedFile.value = null
  uploadFileList.value = []
  editingDocument.value = null
  formRef.value?.clearValidate()
}

const openCreateDialog = () => {
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (doc: PersonalDocument) => {
  resetForm()
  editingDocument.value = doc
  formData.title = doc.title
  formData.description = doc.description || ''
  formData.category = doc.category
  formData.tags = doc.tagList || []
  if (doc.originalName) {
    uploadFileList.value = [
      {
        name: doc.originalName,
        status: 'finished',
        url: doc.filePath,
      },
    ]
  }
  dialogVisible.value = true
}

const handleFileChange = (uploadFile: any) => {
  if (uploadFile.raw) {
    selectedFile.value = uploadFile.raw as File
    uploadFileList.value = [uploadFile]
  }
}

const handleFileRemove = () => {
  selectedFile.value = null
  uploadFileList.value = []
}

const buildFormData = (): FormData => {
  const payload = new FormData()
  payload.append('title', formData.title)
  if (formData.description) payload.append('description', formData.description)
  if (formData.category) payload.append('category', formData.category)
  payload.append('tags', JSON.stringify(formData.tags))
  if (selectedFile.value) {
    payload.append('file', selectedFile.value)
  }
  return payload
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (error) {
    if (error !== false) {
      ElMessage.error((error as Error).message)
    }
    return
  }

  try {
    saving.value = true
    const payload = buildFormData()
    if (editingDocument.value) {
      await updatePersonalDocument(editingDocument.value.id, payload)
      ElMessage.success(t('common.updateSuccess'))
    } else {
      await createPersonalDocument(payload)
      ElMessage.success(t('common.createSuccess'))
    }
    dialogVisible.value = false
    await Promise.all([loadDocuments(), loadSummary()])
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

const handleDelete = async (doc: PersonalDocument) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.personalDocs.confirmDelete', { title: doc.title }),
      t('common.warning'),
      { type: 'warning' }
    )
    await deletePersonalDocument(doc.id)
    ElMessage.success(t('common.deleteSuccess'))
    await Promise.all([loadDocuments(), loadSummary()])
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || t('common.error'))
    }
  }
}

const handleDownload = async (doc: PersonalDocument) => {
  if (!doc.filePath) {
    ElMessage.warning(t('workspace.personalDocs.noFileWarning'))
    return
  }
  try {
    const blob = await downloadPersonalDocument(doc.id)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = doc.originalName || doc.title
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  }
}

const handleTogglePin = async (doc: PersonalDocument) => {
  try {
    await togglePinPersonalDocument(doc.id, !doc.pinned)
    await loadDocuments()
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  }
}

const handleDialogClose = () => {
  dialogVisible.value = false
}

const formatSize = (size: number): string => {
  if (!size) return '0 KB'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

const formatDateTime = (value: string): string => {
  return new Date(value).toLocaleString()
}

const getCategoryLabel = (value: string): string => {
  return categoryOptions.value.find(option => option.value === value)?.label || value
}

onMounted(async () => {
  await Promise.all([loadDocuments(), loadSummary()])
})
</script>

<style scoped lang="scss">
.personal-docs-module {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .module-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    padding: 20px 24px;
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #1d1d1f;
      }

      p {
        margin: 4px 0 0;
        color: #86868b;
      }
    }

    .header-icon {
      font-size: 28px;
      color: #007aff;
      background: #e8f4ff;
      padding: 12px;
      border-radius: 12px;
    }
  }

  .summary-row {
    .summary-card {
      border-radius: 16px;
      border: 1px solid #e5e5e7;
      text-align: center;
      padding: 18px 12px;

      .summary-value {
        font-size: 24px;
        font-weight: 600;
        color: #1d1d1f;
      }

      .summary-label {
        margin-top: 4px;
        color: #86868b;
      }
    }

    .categories-card {
      .categories-list {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 24px;
        justify-content: space-between;

        .category-item {
          display: flex;
          justify-content: space-between;
          width: calc(50% - 12px);
          color: #1d1d1f;

          .category-name {
            font-weight: 500;
          }

          .category-count {
            font-weight: 600;
            color: #007aff;
          }
        }
      }
    }
  }

  .filter-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;

    .category-select {
      width: 100%;
    }
  }

  .documents-table {
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #e5e5e7;

    :deep(.el-table__header th) {
      background: #f8f9fa;
      color: #1d1d1f;
      font-weight: 600;
    }
  }

  .doc-title-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .pin-icon {
      cursor: pointer;
      color: #d8d8d8;
      transition: color 0.2s;

      &.pinned {
        color: #f7b500;
      }

      &:hover {
        color: #f7b500;
      }
    }

    .title-wrapper {
      display: flex;
      flex-direction: column;

      .title-text {
        font-weight: 600;
        color: #1d1d1f;
      }

      .title-sub {
        font-size: 12px;
        color: #86868b;
      }
    }
  }

  .doc-description,
  .doc-tags {
    margin-bottom: 6px;

    strong {
      margin-right: 6px;
      color: #555;
    }

    .doc-tag {
      margin-right: 6px;
      margin-bottom: 4px;
    }
  }

  .upload-block {
    width: 100%;

    .upload-icon {
      font-size: 32px;
      color: #007aff;
    }

    .upload-text {
      margin-top: 8px;
      color: #1d1d1f;
    }
  }
}
</style>


