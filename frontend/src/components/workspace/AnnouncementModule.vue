<template>
  <div class="announcement-module">
    <!-- 公告发布区域 -->
    <el-card class="publish-card">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>{{ $t('workspace.publishAnnouncement') }}</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="publish-tabs">
        <el-tab-pane :label="$t('hr.announcement.announcement')" name="announcement">
          <el-form
            ref="announcementFormRef"
            :model="announcementForm"
            :rules="announcementRules"
            label-width="100px"
          >
            <el-form-item :label="$t('workspace.title')" prop="title">
              <el-input
                v-model="announcementForm.title"
                :placeholder="$t('workspace.titlePlaceholder')"
              />
            </el-form-item>
            <el-form-item :label="$t('workspace.content')" prop="content">
              <el-input
                v-model="announcementForm.content"
                type="textarea"
                :rows="6"
                :placeholder="$t('workspace.contentPlaceholder')"
              />
            </el-form-item>
            <el-form-item :label="$t('workspace.publishTime')">
              <el-date-picker
                v-model="announcementForm.publishTime"
                type="datetime"
                :placeholder="$t('workspace.publishTimePlaceholder')"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
            <el-form-item :label="$t('workspace.expireTime')">
              <el-date-picker
                v-model="announcementForm.expireTime"
                type="datetime"
                :placeholder="$t('workspace.expireTimePlaceholder')"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handlePublishAnnouncement" :loading="submitting">
                {{ $t('workspace.publish') }}
              </el-button>
              <el-button @click="resetAnnouncementForm">{{ $t('common.reset') }}</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane :label="$t('hr.announcement.notice')" name="notice">
          <el-form
            ref="noticeFormRef"
            :model="noticeForm"
            :rules="noticeRules"
            label-width="100px"
          >
            <el-form-item :label="$t('workspace.title')" prop="title">
              <el-input
                v-model="noticeForm.title"
                :placeholder="$t('workspace.titlePlaceholder')"
              />
            </el-form-item>
            <el-form-item :label="$t('workspace.content')" prop="content">
              <el-input
                v-model="noticeForm.content"
                type="textarea"
                :rows="6"
                :placeholder="$t('workspace.contentPlaceholder')"
              />
            </el-form-item>
            <el-form-item :label="$t('workspace.publishTime')">
              <el-date-picker
                v-model="noticeForm.publishTime"
                type="datetime"
                :placeholder="$t('workspace.publishTimePlaceholder')"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
            <el-form-item :label="$t('workspace.expireTime')">
              <el-date-picker
                v-model="noticeForm.expireTime"
                type="datetime"
                :placeholder="$t('workspace.expireTimePlaceholder')"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handlePublishNotice" :loading="submitting">
                {{ $t('workspace.publish') }}
              </el-button>
              <el-button @click="resetNoticeForm">{{ $t('common.reset') }}</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane :label="$t('hr.announcement.industryNews')" name="industry_news">
          <el-form
            ref="industryNewsFormRef"
            :model="industryNewsForm"
            :rules="industryNewsRules"
            label-width="100px"
          >
            <el-form-item :label="$t('workspace.title')" prop="title">
              <el-input
                v-model="industryNewsForm.title"
                :placeholder="$t('hr.announcement.industryNewsTitlePlaceholder')"
              />
            </el-form-item>
            <el-form-item :label="$t('workspace.content')" prop="content">
              <el-input
                v-model="industryNewsForm.content"
                type="textarea"
                :rows="8"
                :placeholder="$t('hr.announcement.industryNewsContentPlaceholder')"
              />
            </el-form-item>
            <el-form-item :label="$t('hr.announcement.source')" prop="source">
              <el-input
                v-model="industryNewsForm.source"
                :placeholder="$t('hr.announcement.sourcePlaceholder')"
              />
            </el-form-item>
            <el-form-item :label="$t('hr.announcement.keywords')">
              <el-select
                v-model="industryNewsForm.keywords"
                multiple
                filterable
                allow-create
                default-first-option
                :reserve-keyword="false"
                :placeholder="$t('hr.announcement.keywordsPlaceholder')"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item :label="$t('workspace.publishTime')">
              <el-date-picker
                v-model="industryNewsForm.publishTime"
                type="datetime"
                :placeholder="$t('workspace.publishTimePlaceholder')"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
            <el-form-item :label="$t('workspace.expireTime')">
              <el-date-picker
                v-model="industryNewsForm.expireTime"
                type="datetime"
                :placeholder="$t('workspace.expireTimePlaceholder')"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handlePublishIndustryNews" :loading="submitting">
                {{ $t('workspace.publish') }}
              </el-button>
              <el-button @click="resetIndustryNewsForm">{{ $t('common.reset') }}</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 首页 Banner 管理 -->
    <el-card class="banner-card" style="margin-top: 24px;">
      <template #header>
        <div class="card-header">
          <el-icon><Picture /></el-icon>
          <span>{{ $t('hr.announcement.bannerTitle') }}</span>
          <el-button
            type="primary"
            size="small"
            :icon="Plus"
            @click="handleOpenAddBanner"
            style="margin-left: auto;"
          >
            {{ $t('hr.announcement.bannerAdd') }}
          </el-button>
        </div>
      </template>

      <el-table v-loading="bannerLoading" :data="banners" stripe>
        <el-table-column prop="text" :label="$t('hr.announcement.bannerText')" min-width="260" />
        <el-table-column prop="author" :label="$t('hr.announcement.bannerAuthor')" width="160" />
        <el-table-column prop="backgroundImage" :label="$t('hr.announcement.bannerImage')" min-width="260">
          <template #default="{ row }">
            <el-link v-if="row.backgroundImage" :href="row.backgroundImage" target="_blank" type="primary">
              {{ row.backgroundImage }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" :label="$t('hr.announcement.bannerEnabled')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? $t('workspace.active') : $t('workspace.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="160" fixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button type="primary" size="small" :icon="Edit" @click="handleOpenEditBanner(row)">
                {{ $t('hr.announcement.bannerEdit') }}
              </el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="handleDeleteBanner(row)">
                {{ $t('common.delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 首页 Banner 编辑弹窗 -->
    <el-dialog
      v-model="bannerDialogVisible"
      :title="bannerDialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="bannerFormRef"
        :model="bannerForm"
        :rules="bannerRules"
        label-width="120px"
      >
        <el-form-item :label="$t('hr.announcement.bannerText')" prop="text">
          <el-input
            v-model="bannerForm.text"
            type="textarea"
            :rows="3"
            :placeholder="$t('hr.announcement.bannerTextPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('hr.announcement.bannerAuthor')" prop="author">
          <el-input
            v-model="bannerForm.author"
            :placeholder="$t('hr.announcement.bannerAuthorPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('hr.announcement.bannerImage')" prop="backgroundImage">
          <div class="banner-image-input-row">
            <el-input
              v-model="bannerForm.backgroundImage"
              :placeholder="$t('hr.announcement.bannerImagePlaceholder')"
            />
            <el-upload
              class="banner-upload"
              :action="bannerUploadAction"
              :headers="bannerUploadHeaders"
              :before-upload="beforeBannerUpload"
              :on-success="handleBannerUploadSuccess"
              :on-error="handleBannerUploadError"
              :show-file-list="false"
              accept="image/*"
            >
              <el-button type="primary" size="small" style="margin-left: 8px;">
                上传图片
              </el-button>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item :label="$t('hr.announcement.bannerEnabled')" prop="enabled">
          <el-switch v-model="bannerForm.enabled" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="bannerDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="bannerSaving" @click="handleSaveBanner">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 已发布的公告 / 通知 / 行业新闻 列表 -->
    <el-card class="announcements-card" style="margin-top: 24px;">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>{{ $t('workspace.publishedItems') }}</span>
          <el-button :icon="Refresh" circle size="small" @click="loadAnnouncements" style="margin-left: auto;" />
        </div>
      </template>

      <el-table v-loading="loading" :data="announcements" stripe>
        <el-table-column prop="type" :label="$t('workspace.type')" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" :label="$t('workspace.title')" min-width="200" />
        <el-table-column prop="publishTime" :label="$t('workspace.publishTime')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.publishTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="expireTime" :label="$t('workspace.expireTime')" width="180">
          <template #default="{ row }">
            {{ row.expireTime ? formatDate(row.expireTime) : $t('workspace.noExpire') }}
          </template>
        </el-table-column>
        <el-table-column prop="isActive" :label="$t('workspace.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">
              {{ row.isActive ? $t('workspace.active') : $t('workspace.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operations')" width="150" fixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)">
                {{ $t('common.edit') }}
              </el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">
                {{ $t('common.delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Document, Refresh, Edit, Delete, Picture, Plus } from '@element-plus/icons-vue'
import {
  createAnnouncement,
  getAllAnnouncements,
  deleteAnnouncement,
  type Announcement,
  type CreateAnnouncementDto,
  AnnouncementType,
} from '../../api/announcements'
import {
  getMotivations,
  createMotivation,
  updateMotivation,
  deleteMotivation,
  type Motivation,
  type CreateMotivationDto,
  type UpdateMotivationDto,
} from '../../api/motivations'
import { getApiBaseURL } from '../../api/config'

const { t, locale } = useI18n()

// 公告 / 通知 / 行业新闻 发布相关状态
const loading = ref(false)
const submitting = ref(false)
const activeTab = ref('announcement')
const announcements = ref<Announcement[]>([])
const announcementFormRef = ref<FormInstance>()
const noticeFormRef = ref<FormInstance>()
const industryNewsFormRef = ref<FormInstance>()

const announcementForm = ref({
  title: '',
  content: '',
  publishTime: '',
  expireTime: '',
})

const noticeForm = ref({
  title: '',
  content: '',
  publishTime: '',
  expireTime: '',
})

const industryNewsForm = ref({
  title: '',
  content: '',
  source: '',
  keywords: [] as string[],
  publishTime: '',
  expireTime: '',
})

const announcementRules: FormRules = {
  title: [{ required: true, message: t('workspace.titleRequired'), trigger: 'blur' }],
  content: [{ required: true, message: t('workspace.contentRequired'), trigger: 'blur' }],
}

const noticeRules: FormRules = {
  title: [{ required: true, message: t('workspace.titleRequired'), trigger: 'blur' }],
  content: [{ required: true, message: t('workspace.contentRequired'), trigger: 'blur' }],
}

const industryNewsRules: FormRules = {
  title: [{ required: true, message: t('workspace.titleRequired'), trigger: 'blur' }],
  content: [{ required: true, message: t('workspace.contentRequired'), trigger: 'blur' }],
  source: [{ required: true, message: t('hr.announcement.sourceRequired'), trigger: 'blur' }],
}

// 首页 Banner（motivations）管理状态
const banners = ref<Motivation[]>([])
const bannerLoading = ref(false)
const bannerSaving = ref(false)
const bannerDialogVisible = ref(false)
const bannerDialogTitle = ref('')
const editingBannerId = ref<number | null>(null)
const bannerFormRef = ref<FormInstance>()
const bannerForm = ref<{
  text: string
  author: string
  backgroundImage: string
  enabled: boolean
}>({
  text: '',
  author: '',
  backgroundImage: '',
  enabled: true,
})

const bannerRules: FormRules = {
  text: [{ required: true, message: t('hr.announcement.bannerTextPlaceholder'), trigger: 'blur' }],
}

// Banner 图片上传相关（走 motivations/banner-images 上传接口）
const bannerUploadAction = `${getApiBaseURL().replace(/\/$/, '')}/motivations/banner-images/upload`

// 上传请求头：从本地存储里读取 token，拼出 Authorization 头
const bannerUploadHeaders = computed(() => {
  const token = localStorage.getItem('token') || '' // 从 localStorage 读取登录 token
  return token ? { Authorization: `Bearer ${token}` } : {} // 有 token 时带上 Authorization 头
})

const beforeBannerUpload = (file: File) => {
  const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    ElMessage.error('只能上传图片文件（JPG/PNG/GIF/WEBP）')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB')
    return false
  }
  return true
}

const handleBannerUploadSuccess = (response: any) => {
  let url = ''
  if (response?.url) {
    url = response.url
  } else if (response?.data?.url) {
    url = response.data.url
  }
  if (url) {
    bannerForm.value.backgroundImage = url
    ElMessage.success('上传成功')
  } else {
    ElMessage.warning('上传成功，但未获取到图片地址')
  }
}

const handleBannerUploadError = (error: any) => {
  console.error('横幅图片上传失败:', error)
  ElMessage.error('上传失败，请重试')
}

const loadAnnouncements = async () => {
  loading.value = true
  try {
    const data = await getAllAnnouncements()
    announcements.value = data
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const handlePublishAnnouncement = async () => {
  if (!announcementFormRef.value) return
  
  try {
    await announcementFormRef.value.validate()
    submitting.value = true

    const createData: CreateAnnouncementDto = {
      type: AnnouncementType.ANNOUNCEMENT,
      title: announcementForm.value.title,
      content: announcementForm.value.content,
      publishTime: announcementForm.value.publishTime || undefined,
      expireTime: announcementForm.value.expireTime || undefined,
    }

    await createAnnouncement(createData)
    ElMessage.success(t('workspace.publishSuccess'))
    resetAnnouncementForm()
    loadAnnouncements()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    submitting.value = false
  }
}

const handlePublishNotice = async () => {
  if (!noticeFormRef.value) return
  
  try {
    await noticeFormRef.value.validate()
    submitting.value = true

    const createData: CreateAnnouncementDto = {
      type: AnnouncementType.NOTICE,
      title: noticeForm.value.title,
      content: noticeForm.value.content,
      publishTime: noticeForm.value.publishTime || undefined,
      expireTime: noticeForm.value.expireTime || undefined,
    }

    await createAnnouncement(createData)
    ElMessage.success(t('workspace.publishSuccess'))
    resetNoticeForm()
    loadAnnouncements()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    submitting.value = false
  }
}

const resetAnnouncementForm = () => {
  announcementForm.value = {
    title: '',
    content: '',
    publishTime: '',
    expireTime: '',
  }
  announcementFormRef.value?.resetFields()
}

const resetNoticeForm = () => {
  noticeForm.value = {
    title: '',
    content: '',
    publishTime: '',
    expireTime: '',
  }
  noticeFormRef.value?.resetFields()
}

const handlePublishIndustryNews = async () => {
  if (!industryNewsFormRef.value) return
  
  try {
    await industryNewsFormRef.value.validate()
    submitting.value = true

    const createData: CreateAnnouncementDto = {
      type: AnnouncementType.INDUSTRY_NEWS,
      title: industryNewsForm.value.title,
      content: industryNewsForm.value.content,
      publishTime: industryNewsForm.value.publishTime || undefined,
      expireTime: industryNewsForm.value.expireTime || undefined,
      // TODO: 添加 source 和 keywords 字段到后端
    }

    await createAnnouncement(createData)
    ElMessage.success(t('workspace.publishSuccess'))
    resetIndustryNewsForm()
    loadAnnouncements()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    submitting.value = false
  }
}

const resetIndustryNewsForm = () => {
  industryNewsForm.value = {
    title: '',
    content: '',
    source: '',
    keywords: [],
    publishTime: '',
    expireTime: '',
  }
  industryNewsFormRef.value?.resetFields()
}

const handleEdit = (_announcement: Announcement) => {
  ElMessage.info(t('workspace.editComingSoon'))
}

const handleDelete = async (announcement: Announcement) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.deleteConfirm', { title: announcement.title }),
      t('common.warning'),
      { type: 'warning' }
    )
    await deleteAnnouncement(announcement.id)
    ElMessage.success(t('common.success'))
    loadAnnouncements()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString(locale.value)
}

const getTypeTagType = (type: string): string => {
  const map: Record<string, string> = {
    announcement: 'success',
    notice: 'info',
    industry_news: 'primary',
    event: 'warning',
  }
  return map[type] || 'info'
}

const getTypeText = (type: string): string => {
  const map: Record<string, string> = {
    announcement: t('hr.announcement.announcement'),
    notice: t('hr.announcement.notice'),
    industry_news: t('hr.announcement.industryNews'),
    event: t('hr.announcement.event'),
  }
  return map[type] || type
}

// 加载首页 Banner（全部 motivations）
const loadBanners = async () => {
  bannerLoading.value = true
  try {
    const data = await getMotivations()
    banners.value = data
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    bannerLoading.value = false
  }
}

// 重置 Banner 表单
const resetBannerForm = () => {
  bannerForm.value = {
    text: '',
    author: '',
    backgroundImage: '',
    enabled: true,
  }
  bannerFormRef.value?.resetFields()
}

// 新建 Banner
const handleOpenAddBanner = () => {
  editingBannerId.value = null
  bannerDialogTitle.value = t('hr.announcement.bannerAdd')
  resetBannerForm()
  bannerDialogVisible.value = true
}

// 编辑 Banner
const handleOpenEditBanner = (banner: Motivation) => {
  editingBannerId.value = banner.id
  bannerDialogTitle.value = t('hr.announcement.bannerEdit')
  bannerForm.value = {
    text: banner.text || '',
    author: banner.author || '',
    backgroundImage: banner.backgroundImage || '',
    enabled: banner.enabled,
  }
  bannerDialogVisible.value = true
}

// 保存 Banner（新增或更新）
const handleSaveBanner = async () => {
  if (!bannerFormRef.value) return

  try {
    await bannerFormRef.value.validate()
    bannerSaving.value = true

    const payload: CreateMotivationDto | UpdateMotivationDto = {
      text: bannerForm.value.text.trim(),
      author: bannerForm.value.author.trim() || undefined,
      backgroundImage: bannerForm.value.backgroundImage.trim() || undefined,
      enabled: bannerForm.value.enabled,
    }

    if (editingBannerId.value) {
      await updateMotivation(editingBannerId.value, payload as UpdateMotivationDto)
    } else {
      await createMotivation(payload as CreateMotivationDto)
    }

    ElMessage.success(t('common.saveSuccess') || t('common.success'))
    bannerDialogVisible.value = false
    await loadBanners()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    bannerSaving.value = false
  }
}

// 删除 Banner
const handleDeleteBanner = async (banner: Motivation) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.deleteConfirm', { title: banner.text }),
      t('common.warning'),
      { type: 'warning' },
    )
    await deleteMotivation(banner.id)
    ElMessage.success(t('common.success'))
    await loadBanners()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

onMounted(() => {
  loadAnnouncements()
  loadBanners()
})
</script>

<style scoped lang="scss">
.announcement-module {
  .publish-card,
  .announcements-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -0.01em;
    }

    .publish-tabs {
      :deep(.el-tabs__header) {
        margin-bottom: 20px;
      }

      :deep(.el-form-item__label) {
        color: #1d1d1f;
        font-weight: 500;
      }

      :deep(.el-input__wrapper) {
        border-radius: 10px;
        border-color: #e5e5e7;
      }
    }
  }

  .banner-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -0.01em;
    }

    .banner-image-input-row {
      display: flex;
      align-items: center;
      :deep(.el-input) {
        flex: 1;
      }
    }
  }

  // 操作按钮对齐
  .operation-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;

    .el-button {
      flex-shrink: 0;
      margin: 0;
    }
  }
}
</style>

