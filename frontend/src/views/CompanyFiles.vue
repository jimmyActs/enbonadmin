<template>
  <div class="company-files-page page-content-enter">
    <div class="container">
      <!-- 顶部标题 -->
      <header class="header fade-in-up">
        <h1>{{ t('workspace.companyFilesPage.title') }}</h1>
        <p>{{ t('workspace.companyFilesPage.subtitle') }}</p>
      </header>

      <!-- 顶部分类卡片 -->
      <div class="category-grid fade-in-delay-1">
        <div
          v-for="cat in categoryConfigs"
          :key="cat.key"
          class="cat-card"
          :class="{ active: activeCategory === cat.key }"
          @click="handleCategoryClick(cat.key)"
        >
          <div class="cat-icon">
            <el-icon>
              <component :is="cat.icon" />
            </el-icon>
          </div>
          <h3>{{ cat.title }}</h3>
          <p>{{ cat.desc }}</p>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-area fade-in-delay-2">
        <!-- 顶部筛选 + 返回 + 搜索 + 操作 -->
        <div class="content-nav">
          <div class="nav-left">
            <el-button
              v-if="pathSegments.length"
              class="back-btn"
              text
              size="small"
              :icon="ArrowLeft"
              @click="goBack"
            >
              返回上一级
            </el-button>
          </div>

          <div class="nav-right">
            <el-input
              v-model="searchKeyword"
              class="search-input"
              placeholder="搜索文件名称或关键词..."
              clearable
            />
            <el-button
              v-if="canManageWorkspace"
              type="primary"
              size="small"
              :icon="Upload"
              @click="showUploadDialog = true"
            >
              上传文件
            </el-button>
            <el-button
              v-if="canManageWorkspace"
              size="small"
              :icon="FolderAdd"
              @click="showCreateFolderDialog = true"
            >
              新建文件夹
            </el-button>
            <el-button
              v-if="canManageWorkspace && activeCategory === 'ai-assets'"
              size="small"
              :icon="Link"
              @click="openLinkDialog()"
            >
              新建链接
            </el-button>
          </div>
        </div>

        <!-- 文件网格 -->
        <div class="file-grid" v-loading="loading">
          <!-- AI 链接卡片（仅在 AI 资产库显示） -->
          <div
            v-if="activeCategory === 'ai-assets'"
            v-for="link in aiLinks"
            :key="'link-' + link.id"
            class="file-item ai-link-card"
          >
            <div class="file-preview ai-link-icon" @click="openAiLink(link)">
              🔗
            </div>
            <h4 class="file-name" :title="link.title">
              {{ link.title }}
            </h4>
            <p class="file-meta">
              {{ link.description || 'AI 平台链接' }}
            </p>
            <div class="file-actions ai-link-actions">
              <button class="btn-sm btn-view" @click="openAiLink(link)">
                打开
              </button>
              <el-dropdown
                v-if="canManageWorkspace"
                class="more-dropdown"
                trigger="click"
                @command="(command: 'edit' | 'delete') => handleAiLinkCommand(command, link)"
              >
                <span class="btn-sm btn-more">
                  <el-icon><MoreFilled /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="delete">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 普通文件/文件夹 -->
          <div
            v-for="item in filteredFiles"
            :key="item.path"
            class="file-item"
          >
            <div class="file-preview" @dblclick="handleOpen(item)">
              <template v-if="item.isDirectory">
                📂
              </template>
              <template v-else-if="item.isImage">
                <!-- 图片：懒加载缩略图（通过下载接口获取 Blob），失败时显示占位图标 -->
                <img
                  v-if="getPreviewThumbnail(item)"
                  :src="getPreviewThumbnail(item)"
                  :alt="getDisplayName(item)"
                  @error="handleImageError"
                />
                <span v-else>🖼️</span>
              </template>
              <template v-else-if="item.isVideo">
                🎬
              </template>
              <template v-else-if="item.isPdf">
                📄
              </template>
              <template v-else>
                📎
              </template>

              <span
                v-if="!item.isDirectory && getTypeBadge(item)"
                class="type-badge"
                :class="getTypeBadge(item)?.cls"
              >
                {{ getTypeBadge(item)?.text }}
              </span>
            </div>

            <h4 class="file-name" :title="getDisplayName(item)">
              {{ getDisplayName(item) }}
            </h4>
            <p class="file-meta">
              <template v-if="!item.isDirectory">
                {{ formatFileSize(item.size) }} · {{ formatDate(item.modified) }}
              </template>
              <template v-else>
                文件夹
              </template>
            </p>

            <div class="file-actions">
              <template v-if="item.isDirectory">
                <button class="btn-sm btn-view" @click="navigateToPath(item.path)">
                  打开文件夹
                </button>
                <el-dropdown
                  v-if="canManageWorkspace"
                  class="more-dropdown"
                  trigger="click"
                  @command="(command: string) => handleMoreCommand(command, item)"
                >
                  <span class="btn-sm btn-more">
                    <el-icon><MoreFilled /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="delete">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
              <template v-else>
                <button class="btn-sm btn-view" @click="handlePreview(item)">
                  {{ item.isVideo ? '播放' : '预览' }}
                </button>
                <button class="btn-sm btn-down" @click="handleDownload(item)">
                  下载
                </button>
                <el-dropdown
                  v-if="canManageWorkspace"
                  class="more-dropdown"
                  trigger="click"
                  @command="(command: string) => handleMoreCommand(command, item)"
                >
                  <span class="btn-sm btn-more">
                    <el-icon><MoreFilled /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="delete">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </div>
          </div>

          <el-empty
            v-if="!loading && filteredFiles.length === 0"
            :description="$t('common.noData')"
            class="empty-state"
          />
        </div>
      </div>

      <!-- 新建文件夹弹窗 -->
      <el-dialog
        v-model="showCreateFolderDialog"
        title="新建文件夹"
        width="420px"
        :close-on-click-modal="false"
      >
        <el-form label-position="top">
          <el-form-item label="文件夹名称">
            <el-input
              v-model="newFolderName"
              placeholder="请输入文件夹名称"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showCreateFolderDialog = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="savingFolder" @click="handleCreateFolder">
            {{ $t('common.confirm') }}
          </el-button>
        </template>
      </el-dialog>

      <!-- 上传文件弹窗 -->
      <el-dialog
        v-model="showUploadDialog"
        title="上传文件"
        width="460px"
        :close-on-click-modal="false"
      >
        <div class="upload-form" />
        <el-upload
          drag
          :auto-upload="false"
          :file-list="uploadFileList"
          :on-change="handleUploadChange"
          :on-remove="handleUploadRemove"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或点击上传
          </div>
        </el-upload>
        <template #footer>
          <el-button @click="showUploadDialog = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="uploading" @click="handleUploadSubmit">
            开始上传
          </el-button>
        </template>
      </el-dialog>

      <!-- 新建 / 编辑 AI 链接弹窗 -->
      <el-dialog
        v-model="showLinkDialog"
        :title="editingLink ? '编辑链接' : '新建链接'"
        width="480px"
        :close-on-click-modal="false"
      >
        <el-form :model="aiLinkForm" label-position="top">
          <el-form-item label="标题 / 平台名称">
            <el-input v-model="aiLinkForm.title" placeholder="例如：Midjourney / OpenAI / Stable Diffusion" />
          </el-form-item>
          <el-form-item label="链接 URL">
            <el-input v-model="aiLinkForm.url" placeholder="https://..." />
          </el-form-item>
          <el-form-item label="简介 / 用途说明">
            <el-input v-model="aiLinkForm.description" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="账号">
            <el-input v-model="aiLinkForm.account" placeholder="可选：共享账号" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="aiLinkForm.password" placeholder="可选：共享密码" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="aiLinkForm.notes" type="textarea" :rows="2" placeholder="可记录登录方式、注意事项等" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showLinkDialog = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="saveAiLink">
            {{ $t('common.confirm') }}
          </el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadUserFile } from 'element-plus'
import {
  Upload,
  UploadFilled,
  FolderAdd,
  FolderOpened,
  Document,
  Grid,
  ArrowLeft,
  MoreFilled,
  Picture,
  VideoCamera,
  Promotion,
  Collection,
  Link,
} from '@element-plus/icons-vue'
import {
  getFileList,
  createFolder,
  uploadFile,
  deleteFile,
  renameFile,
  downloadFile,
  type FileItem,
} from '../api/files'
import { getWorkspaceStorageConfigs, type WorkspaceStorageConfig } from '../api/workspace-storage'
import {
  getCompanyFileCategories,
  getCompanyFileSeries,
  createCompanyFileSeries,
  type CompanyFileCategory,
  type CompanyFileSeries,
} from '../api/company-files'
import { getAiLinks, createAiLink, updateAiLink, deleteAiLink, type AiLink as ApiAiLink } from '../api/ai-links'
import { useUserStore } from '../store/user'

const { t, locale } = useI18n()
const userStore = useUserStore()

// 当前登录用户部门 & 是否品牌管理中心
const currentDepartment = computed(() => userStore.userInfo?.department || '')
const isBrandDepartment = computed(() => currentDepartment.value === 'planning')

// 是否具备“工作空间内容管理”权限：控制公司文件的上传/新建/重命名/删除等操作按钮
const canManageWorkspace = computed(() => {
  const role = userStore.userInfo?.role
  const hasBasePermission = userStore.hasPermission?.('workspace.companyFiles.manage') ?? false

  if (role === 'super_admin') return true

  // AI 资产库：仅品牌管理中心可操作
  if (activeCategory.value === 'ai-assets') {
    return hasBasePermission && isBrandDepartment.value
  }

  return hasBasePermission
})

// 默认盘符 & 根目录（如后台未配置时使用）
const DEFAULT_DRIVE_ID = ((import.meta as any).env?.VITE_WORKSPACE_DRIVE_ID as string | undefined)?.toLowerCase?.() || 'd'
const DEFAULT_ROOT_PATH = 'company-files'

// 从后台可配置的存储位置
const driveId = ref<string>(DEFAULT_DRIVE_ID)
const rootPath = ref<string>(DEFAULT_ROOT_PATH)

// 后端可配置的分类和系列
const categories = ref<CompanyFileCategory[]>([])
const activeCategory = ref<string>('specs')
const loading = ref(false)
const fileList = ref<FileItem[]>([])
const currentPath = ref('') // 相对于当前分区根的路径

interface SeriesTab {
  key: string
  label: string
  slug: string
  categoryKey?: string
}

// 系列筛选 & 搜索（目前不再在界面展示类型 Tab，但保留内部结构，以兼容历史带 [类型] 前缀的文件夹）
const seriesTabs = ref<SeriesTab[]>([])
const activeSeries = ref('all')
const searchKeyword = ref('')

// 文件夹相关状态
const showCreateFolderDialog = ref(false)
const newFolderName = ref('')
const savingFolder = ref(false)

// 上传相关状态
const showUploadDialog = ref(false)
const uploadFileList = ref<UploadUserFile[]>([])
const uploading = ref(false)
const selectedSeriesForUpload = ref('')
const selectedSeriesForFolder = ref('')

// AI 链接相关状态（仅在 AI 资产库下使用）
interface AiLinkForm {
  id: number | null
  title: string
  url: string
  description: string
  account: string
  password: string
  notes: string
}

const aiLinks = ref<ApiAiLink[]>([])
// AI 资产库下，当前所在的「子文件夹路径」（相对于 ai-assets 根），根目录用空字符串表示
const aiCurrentFolderPath = ref('')
const showLinkDialog = ref(false)
const editingLink = ref<ApiAiLink | null>(null)
const aiLinkForm = ref<AiLinkForm>({
  id: null,
  title: '',
  url: '',
  description: '',
  account: '',
  password: '',
  notes: '',
})

// 图片缩略图缓存（公司文件模块）：key 为文件 path，value 为 Blob URL
const thumbnailMap = ref<Record<string, string>>({})
const thumbnailLoading = ref<Record<string, boolean>>({})

// 顶部展示用的分类卡片（已适配中英双语 & 后端配置）
const categoryConfigs = computed(() => {
  const localeIsZh = locale.value.startsWith('zh')

  const isBrandDept = isBrandDepartment.value || userStore.userInfo?.role === 'super_admin'

  // 如果后端还没返回，就用默认分类兜底
  let source: Array<CompanyFileCategory & { icon?: string; folder: string }> =
    categories.value.length
      ? categories.value
      : [
          {
            id: 1,
            key: 'specs',
            nameZh: '产品规格书',
            nameEn: 'Product Specs',
            descZh: '公司各类产品最新规格书',
            descEn: 'Latest specification sheets for all products.',
            icon: 'specs',
            folder: 'specs',
            sortOrder: 1,
            enabled: true,
          },
          {
            id: 2,
            key: 'images',
            nameZh: '图片素材',
            nameEn: 'Image Assets',
            descZh: '公司产品图片、案例图片等',
            descEn: 'Product photos, case images and more.',
            icon: 'images',
            folder: 'images',
            sortOrder: 2,
            enabled: true,
          },
          {
            id: 3,
            key: 'videos',
            nameZh: '视频素材',
            nameEn: 'Video Assets',
            descZh: '产品视频、宣传片、活动视频等',
            descEn: 'Product videos, promos and event footage.',
            icon: 'videos',
            folder: 'videos',
            sortOrder: 3,
            enabled: true,
          },
          {
            id: 4,
            key: 'marketing',
            nameZh: '推广素材',
            nameEn: 'Marketing Assets',
            descZh: '每日推广、社媒推广素材',
            descEn: 'Daily promotions and social media materials.',
            icon: 'marketing',
            folder: 'marketing',
            sortOrder: 4,
            enabled: true,
          },
          {
            id: 5,
            key: 'brand',
            nameZh: '品牌物料',
            nameEn: 'Brand Assets',
            descZh: 'LOGO、证书、其他文件等',
            descEn: 'Logos, certificates and other brand files.',
            icon: 'brand',
            folder: 'brand',
            sortOrder: 5,
            enabled: true,
          },
          {
            id: 6,
            key: 'ai-assets',
            nameZh: 'AI资产库',
            nameEn: 'AI Assets',
            descZh: 'AI 图片、视频、提示词、音乐等资产',
            descEn: 'AI images, videos, prompts, music and workflows.',
            icon: 'ai-assets',
            folder: 'ai-assets',
            sortOrder: 6,
            enabled: true,
          },
        ]

  // 非品牌部用户：隐藏 AI 资产库分类
  if (!isBrandDept) {
    source = source.filter((c) => c.key !== 'ai-assets')
  }

  // 统一的 UI 文案（不受后端数据库影响）
  const uiTextMap: Record<
    string,
    { titleZh: string; titleEn: string; descZh: string; descEn: string }
  > = {
    specs: {
      titleZh: '产品规格书',
      titleEn: 'Product Specs',
      descZh: '公司各类产品最新规格书',
      descEn: 'Latest specification sheets for all products.',
    },
    images: {
      titleZh: '图片素材',
      titleEn: 'Image Assets',
      descZh: '公司产品图片、案例图片等',
      descEn: 'Product photos, case images and more.',
    },
    videos: {
      titleZh: '视频素材',
      titleEn: 'Video Assets',
      descZh: '产品视频、宣传片、活动视频等',
      descEn: 'Product videos, promos and event footage.',
    },
    marketing: {
      titleZh: '推广素材',
      titleEn: 'Marketing Assets',
      descZh: '每日推广、社媒推广素材',
      descEn: 'Daily promotions and social media materials.',
    },
    brand: {
      titleZh: '品牌物料',
      titleEn: 'Brand Assets',
      descZh: 'LOGO、证书、其他文件等',
      descEn: 'Logos, certificates and other brand files.',
    },
    'ai-assets': {
      titleZh: 'AI资产库',
      titleEn: 'AI Assets',
      descZh: '品牌部内部的 AI 图片 / 视频 / 提示词 / 音乐等资产',
      descEn: 'AI images, videos, prompts, music and workflows for brand team.',
    },
  }

  const iconMap: Record<string, any> = {
    specs: Document,
    images: Picture,
    videos: VideoCamera,
    marketing: Promotion,
    brand: Collection,
    'ai-assets': Grid,
  }

  return source.map((c) => ({
    key: c.key,
    icon: iconMap[c.key] || FolderOpened,
    title: (() => {
      const ui = uiTextMap[c.key]
      const titleZh = ui?.titleZh || c.nameZh || c.nameEn
      const titleEn = ui?.titleEn || c.nameEn || c.nameZh
      return localeIsZh ? titleZh || titleEn : titleEn || titleZh
    })(),
    desc: (() => {
      const ui = uiTextMap[c.key]
      const descZh = ui?.descZh || c.descZh || c.descEn || ''
      const descEn = ui?.descEn || c.descEn || c.descZh || ''
      return localeIsZh ? descZh || descEn : descEn || descZh
    })(),
    folder: c.folder,
  }))
})

const activeCategoryConfig = computed<CompanyFileCategory | null>(() => {
  if (!categories.value.length) return null
  return categories.value.find(c => c.key === activeCategory.value) ?? categories.value[0] ?? null
})

// 当前分区 + 路径组合成实际后端路径
const fullPath = computed(() => {
  const cat = activeCategoryConfig.value
  const folder = cat?.folder || 'specs'
  const base = `${rootPath.value}/${folder}`
  return currentPath.value ? `${base}/${currentPath.value}` : base
})

// 面包屑
const pathSegments = computed(() => {
  if (!currentPath.value) return []
  return currentPath.value.split('/').filter(Boolean)
})

// 是否在当前大类的根目录（没有进入任何子文件夹）
const isAtCategoryRoot = computed(() => pathSegments.value.length === 0)

const goBack = () => {
  if (!currentPath.value) return
  const segments = currentPath.value.split('/').filter(Boolean)
  segments.pop()
  const newPath = segments.join('/')
  currentPath.value = newPath
  // 在 AI 资产库下返回上一级时，同步更新 AI 链接使用的文件夹路径
  if (activeCategory.value === 'ai-assets') {
    aiCurrentFolderPath.value = newPath
  }
  loadFiles()
}

// 加载当前分区下的文件列表
const loadFiles = async () => {
  if (!activeCategory.value || !activeCategoryConfig.value) return
  loading.value = true
  try {
    const list = await getFileList(driveId.value, fullPath.value).catch((error: any) => {
      // 如果当前分类目录不存在：
      // - 以前这里会调用 createFolder 自动创建根目录，但普通员工没有上传/建目录权限，会导致 403 报错；
      // - 现在改为：404 直接视为“该分类下还没有任何文件/文件夹”，返回空数组即可，避免无意义的 403。
      if (error?.response?.status === 404) {
        return []
      }
      throw error
    })
    fileList.value = list || []

    // 如果是在 AI 资产库分类下，同时加载当前文件夹下的 AI 链接列表
    if (activeCategory.value === 'ai-assets') {
      try {
        // 专门使用 aiCurrentFolderPath 作为 AI 链接的「所属文件夹」来源
        // 根目录仍然用空字符串表示（后端会保存为 NULL）
        const folderPath = aiCurrentFolderPath.value || ''
        aiLinks.value = await getAiLinks(folderPath)
      } catch (e) {
        console.error('加载 AI 链接失败', e)
      }
    } else {
      aiLinks.value = []
    }
  } catch (error: any) {
    console.error('加载公司文件失败:', error)
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const handleCategoryClick = (key: string) => {
  if (activeCategory.value === key) return
  activeCategory.value = key
  currentPath.value = ''
  // 切换到 AI 资产库时，同步复位 AI 链接使用的文件夹路径
  if (key === 'ai-assets') {
    aiCurrentFolderPath.value = ''
  }
  activeSeries.value = 'all'
  searchKeyword.value = ''
  loadFiles()
}

// 将后端返回的完整相对路径转换成「当前分区」内部的相对路径
const normalizeCategoryPath = (rawPath: string): string => {
  const cat = activeCategoryConfig.value
  const folder = cat?.folder || activeCategory.value
  const basePrefix = `${rootPath.value}/${folder}`
  if (rawPath.startsWith(basePrefix)) {
    const sub = rawPath.slice(basePrefix.length)
    return sub.replace(/^\/+/, '')
  }
  return rawPath.replace(/^\/+/, '')
}

const navigateToPath = (path: string) => {
  const normalized = normalizeCategoryPath(path)
  currentPath.value = normalized
  // 单独记录一份 AI 资产库下的当前子文件夹路径，避免任何地方对 currentPath 的误操作造成影响
  if (activeCategory.value === 'ai-assets') {
    aiCurrentFolderPath.value = normalized
  }
  loadFiles()
}

// 文件操作
const handleCreateFolder = async () => {
  if (!newFolderName.value.trim()) {
    ElMessage.warning(t('files.folderNameRequired'))
    return
  }
  savingFolder.value = true
  try {
    let folderName = newFolderName.value.trim()
    let typeSlug = ''

    if (isAtCategoryRoot.value) {
      // 在大类根目录，由用户选择类型
      typeSlug = selectedSeriesForFolder.value.trim()
    } else {
      // 在子文件夹内，自动从路径推断类型
      typeSlug = getCurrentTypeFromPath() || ''
    }

    if (typeSlug && typeSlug !== 'all') {
      await ensureSeriesExists(typeSlug)
      const safeType = typeSlug.replace(/[\\/]/g, '_')
      folderName = `[${safeType}] ${folderName}`
    }

    await createFolder(driveId.value, fullPath.value, folderName)
    showCreateFolderDialog.value = false
    newFolderName.value = ''
    selectedSeriesForFolder.value = ''
    await loadFiles()
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    savingFolder.value = false
  }
}

const handleDelete = async (item: FileItem) => {
  try {
    await ElMessageBox.confirm(
      t('files.deleteConfirm', { name: item.name }),
      t('common.warning'),
      { type: 'warning' }
    )
    await deleteFile(driveId.value, `${fullPath.value}/${item.name}`)
    await loadFiles()
    ElMessage.success(t('common.deleteSuccess'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || t('common.error'))
    }
  }
}

const handleRename = async (item: FileItem) => {
  try {
    const { value } = await ElMessageBox.prompt(
      t('files.renamePrompt', { name: item.name }),
      t('files.rename'),
      {
        inputValue: item.name,
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel')
      }
    )
    if (!value || value === item.name) return
    await renameFile(driveId.value, `${fullPath.value}/${item.name}`, value.trim())
    await loadFiles()
    ElMessage.success(t('common.saveSuccess'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || t('common.error'))
    }
  }
}

const handleDownload = async (item: FileItem) => {
  try {
    const blob = await downloadFile(driveId.value, `${fullPath.value}/${item.name}`)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  }
}

// 预览：根据文件类型选择最合适的方式，一处统一处理所有分类
const handlePreview = async (item: FileItem) => {
  try {
    // 1）图片：下载 -> Blob，在新标签直接打开图片
    if (item.isImage) {
      const blob = await downloadFile(driveId.value, item.path)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      // 一段时间后释放 URL，避免长期占用内存
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      return
    }

    // 2）PDF：下载 -> Blob，在新标签用浏览器自带 PDF 查看器打开
    if (item.isPdf) {
      const blob = await downloadFile(driveId.value, item.path)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      return
    }

    // 3）音频：下载 -> Blob，在新标签里嵌一个 <audio> 播放器，支持 MP3 等试听
    if (isAudioFile(item)) {
      const blob = await downloadFile(driveId.value, item.path)
      const url = URL.createObjectURL(blob)
      const win = window.open('', '_blank')
      if (win) {
        const title = item.name || 'Audio'
        win.document.write(`
          <html>
            <head><title>${title}</title></head>
            <body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;">
              <audio src="${url}" controls autoplay style="width:80%;max-width:600px;"></audio>
            </body>
          </html>
        `)
        win.document.close()
      }
      // 交给浏览器在标签页关闭时回收 URL
      return
    }

    // 4）视频：下载 -> Blob，在新标签里嵌一个 <video> 播放器
    if (item.isVideo) {
      const blob = await downloadFile(driveId.value, item.path)
      const url = URL.createObjectURL(blob)
      const win = window.open('', '_blank')
      if (win) {
        const title = item.name || 'Video'
        win.document.write(`
          <html>
            <head><title>${title}</title></head>
            <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;">
              <video src="${url}" controls autoplay style="max-width:100%;max-height:100%;"></video>
            </body>
          </html>
        `)
        win.document.close()
      }
      // 不急着 revoke，交给浏览器在标签页关闭时回收
      return
    }

    // 5）文本类（txt / json / log / csv 等）：下载 -> 在新标签页以纯文本形式展示
    if (item.isText) {
      const blob = await downloadFile(driveId.value, item.path)
      const text = await blob.text()
      const win = window.open('', '_blank')
      if (win) {
        const title = item.name || 'Text'
        // 简单的 HTML 转义，避免文本里包含 <script> 等被当成 HTML 解析
        const safeText = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')

        win.document.write(`
          <html>
            <head><title>${title}</title></head>
            <body style="margin:0;background:#111;color:#eee;font-family:monospace;">
              <pre style="white-space:pre-wrap;padding:16px;">${safeText}</pre>
            </body>
          </html>
        `)
        win.document.close()
      }
      return
    }

    // 6）Office 等其它类型：直接触发浏览器下载
    const blob = await downloadFile(driveId.value, item.path)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.name || 'file'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return
  } catch (e) {
    console.error('预览失败', e)
    ElMessage.error(t('files.previewFailed') || t('common.error'))
  }
}

// 上传
const handleUploadChange = (_file: UploadUserFile, fileListLocal: UploadUserFile[]) => {
  uploadFileList.value = fileListLocal
}

const handleUploadRemove = (_file: UploadUserFile, fileListLocal: UploadUserFile[]) => {
  uploadFileList.value = fileListLocal
}

const handleUploadSubmit = async () => {
  if (!uploadFileList.value.length) {
    ElMessage.warning(t('files.selectFileWarning'))
    return
  }
  uploading.value = true
  try {
    let typeSlug = ''

    if (isAtCategoryRoot.value) {
      typeSlug = selectedSeriesForUpload.value.trim()
    } else {
      typeSlug = getCurrentTypeFromPath() || ''
    }
    if (typeSlug && typeSlug !== 'all') {
      await ensureSeriesExists(typeSlug)
    }

    const safeType = typeSlug && typeSlug !== 'all'
      ? typeSlug.replace(/[\\/]/g, '_')
      : ''

    for (const f of uploadFileList.value) {
      if (!f.raw) continue
      let rawFile = f.raw as File

      if (safeType) {
        const originName = rawFile.name
        const dotIndex = originName.lastIndexOf('.')
        const ext = dotIndex > -1 ? originName.slice(dotIndex) : ''
        const base = dotIndex > -1 ? originName.slice(0, dotIndex) : originName
        const newName = `[${safeType}] ${base}${ext}`

        rawFile = new File([rawFile], newName, { type: rawFile.type })
      }

      await uploadFile(driveId.value, fullPath.value, rawFile)
    }
    uploadFileList.value = []
    showUploadDialog.value = false
    selectedSeriesForUpload.value = ''
    await loadFiles()
    ElMessage.success(t('files.uploadSuccess'))
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    uploading.value = false
  }
}

// AI 链接相关操作 ----------------------------------------------

const openLinkDialog = (link?: ApiAiLink) => {
  if (link) {
    editingLink.value = link
    aiLinkForm.value = {
      id: link.id,
      title: link.title,
      url: link.url,
      description: link.description || '',
      account: link.account || '',
      password: link.password || '',
      notes: link.notes || '',
    }
  } else {
    editingLink.value = null
    aiLinkForm.value = {
      id: null,
      title: '',
      url: '',
      description: '',
      account: '',
      password: '',
      notes: '',
    }
  }
  showLinkDialog.value = true
}

const saveAiLink = async () => {
  if (!aiLinkForm.value.title.trim() || !aiLinkForm.value.url.trim()) {
    ElMessage.warning('请填写标题和链接 URL')
    return
  }

  try {
    // 仅在 AI 资产库下使用 AI 链接功能，这里直接使用 aiCurrentFolderPath 作为所属文件夹路径
    // 根目录仍然用空字符串表示（后端会保存为 NULL）
    const folderPath = aiCurrentFolderPath.value || ''

    if (editingLink.value) {
      const updated = await updateAiLink(editingLink.value.id, {
        title: aiLinkForm.value.title,
        url: aiLinkForm.value.url,
        description: aiLinkForm.value.description || undefined,
        account: aiLinkForm.value.account || undefined,
        password: aiLinkForm.value.password || undefined,
        notes: aiLinkForm.value.notes || undefined,
        folderPath,
      })
      const idx = aiLinks.value.findIndex((l) => l.id === editingLink.value?.id)
      if (idx !== -1) {
        aiLinks.value[idx] = updated
      }
    } else {
      const created = await createAiLink({
        title: aiLinkForm.value.title,
        url: aiLinkForm.value.url,
        description: aiLinkForm.value.description || undefined,
        account: aiLinkForm.value.account || undefined,
        password: aiLinkForm.value.password || undefined,
        notes: aiLinkForm.value.notes || undefined,
        folderPath,
      })
      aiLinks.value.push(created)
    }

    showLinkDialog.value = false
    ElMessage.success(t('common.saveSuccess'))
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  }
}

const handleAiLinkCommand = async (command: 'edit' | 'delete', link: ApiAiLink) => {
  if (command === 'edit') {
    openLinkDialog(link)
  } else if (command === 'delete') {
    try {
      await ElMessageBox.confirm(`确定要删除链接「${link.title}」吗？`, t('common.warning'), { type: 'warning' })
      await deleteAiLink(link.id)
      aiLinks.value = aiLinks.value.filter((l) => l.id !== link.id)
      ElMessage.success(t('common.deleteSuccess'))
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error?.message || t('common.error'))
      }
    }
  }
}

const openAiLink = (link: ApiAiLink) => {
  if (!link.url) return
  const target = link.url.startsWith('http://') || link.url.startsWith('https://') ? link.url : `https://${link.url}`
  window.open(target, '_blank')
}

// 工具函数：格式化
const formatFileSize = (size?: number): string => {
  if (!size && size !== 0) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleMoreCommand = (command: string, item: FileItem) => {
  if (command === 'rename') {
    handleRename(item)
  } else if (command === 'delete') {
    handleDelete(item)
  }
}

// 顶部网格使用的辅助
const getTypeBadge = (item: FileItem): { text: string; cls: string } | null => {
  if (item.isPdf) return { text: 'PDF', cls: 'bg-pdf' }
  if (item.isVideo) return { text: (item.extension || '').replace('.', '').toUpperCase() || 'MP4', cls: 'bg-mp4' }
  if (item.isImage) return { text: (item.extension || '').replace('.', '').toUpperCase() || 'IMG', cls: 'bg-img' }
  return null
}

// 判断是否为音频文件（用于预览逻辑）
const isAudioFile = (item: FileItem): boolean => {
  const ext = (item.extension || '').toLowerCase()
  return ['.mp3', '.wav', '.ogg', '.m4a', '.flac'].includes(ext)
}

// 懒加载缩略图：公司文件模块直接通过下载接口获取 Blob 并生成 URL
const getPreviewThumbnail = (item: FileItem): string | undefined => {
  if (!item.isImage) return undefined
  const key = item.path

  if (!thumbnailMap.value[key] && !thumbnailLoading.value[key]) {
    loadThumbnail(item.path)
  }

  return thumbnailMap.value[key]
}

const loadThumbnail = async (filePath: string) => {
  if (!driveId.value) return
  const key = filePath
  thumbnailLoading.value[key] = true
  try {
    const blob = await downloadFile(driveId.value, filePath)
    thumbnailMap.value[key] = URL.createObjectURL(blob)
  } catch (error) {
    console.error('公司文件缩略图加载失败:', filePath, error)
  } finally {
    thumbnailLoading.value[key] = false
  }
}

// 图片缩略图加载失败时：直接隐藏当前图片，由占位图标兜底
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

// 去掉前缀 [类型]，用于界面展示文件/文件夹名称
const getDisplayName = (item: FileItem): string => {
  if (!item.name) return ''
  const m = item.name.match(/^\[[^\]]+\]\s*(.+)$/)
  return m ? (m[1] ?? item.name) : item.name
}

// 从文件名或路径中提取类型标记：[类型] xxx
const extractTypeFromItem = (item: FileItem): string | null => {
  // 先从名称中提取
  const nameMatch = item.name.match(/^\[(.+?)\]/)
  if (nameMatch) return nameMatch[1] ?? null

  // 再从路径中查找带 [] 的段
  if (item.path) {
    const segs = item.path.split('/').filter(Boolean)
    for (const seg of segs) {
      const m = seg.match(/^\[(.+?)\]/)
      if (m) return m[1] ?? null
    }
  }
  return null
}

// 过滤后的文件列表
const filteredFiles = computed(() => {
  let list = fileList.value

  if (activeSeries.value !== 'all') {
    const key = activeSeries.value
    const normalize = (s: string) => s.replace(/[\\/]/g, '_')
    const keyNorm = normalize(key)
    list = list.filter((f) => {
      const t = extractTypeFromItem(f)
      if (!t) return false
      return normalize(t) === keyNorm
    })
  }

  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(f => f.name.toLowerCase().includes(kw))
  }

  return list
})

const handleOpen = (item: FileItem) => {
  if (item.isDirectory) {
    navigateToPath(item.path)
  } else {
    handlePreview(item)
  }
}

// 从当前路径中推断所属类型（例如根目录下的 [日推] 文件夹内）
const getCurrentTypeFromPath = (): string | null => {
  if (!currentPath.value) return null
  const firstSeg = pathSegments.value[0]
  if (!firstSeg) return null
  const match = firstSeg.match(/^\[(.+?)\]/)
  return match ? (match[1] ?? null) : null
}

// 确保一个类型（系列）存在：没有就创建，并同步到左侧 Tab & 后端
const ensureSeriesExists = async (seriesInput: string) => {
  const raw = (seriesInput || '').trim()
  if (!raw || raw === 'all') return

  // 约定：用户可以输入 “中文/English” 的形式，系统自动拆成中英双语
  const parts = raw.split('/').map(p => p.trim()).filter(Boolean)
  const nameZh = parts[0] || raw
  const nameEn = parts[1] || parts[0] || raw
  const slug = raw // 暂时直接用原始字符串作为 key，保持直观

  const exists = seriesTabs.value.find(
    (t) => t.slug === slug && t.categoryKey === activeCategory.value,
  )
  if (exists) {
    activeSeries.value = exists.key
    return
  }

  const label = raw
  const newTab: SeriesTab = {
    key: slug,
    label,
    slug,
    categoryKey: activeCategory.value,
  }
  seriesTabs.value.push(newTab)
  activeSeries.value = newTab.key

  // 同步到后端（失败了也不影响前端使用）
  try {
    await createCompanyFileSeries({
      categoryKey: activeCategory.value,
      nameZh,
      nameEn,
      slug,
    })
  } catch (error) {
    console.error('创建公司文件类型失败:', error)
  }
}

const loadCategoriesAndSeries = async () => {
  try {
    const [cats, series, wsCfgs] = await Promise.all([
      getCompanyFileCategories(),
      getCompanyFileSeries(),
      getWorkspaceStorageConfigs(),
    ])

    categories.value = (cats || []).filter(c => c.enabled)
    if (!categories.value.length) {
      // 如果后端暂时没有数据，使用默认五大类作为兜底
      categories.value = [
        {
          id: 1,
          key: 'specs',
          nameZh: '产品规格书',
          nameEn: 'Product Specs',
          descZh: 'PDF 说明书 / 认证证书',
          descEn: 'PDF manuals / certificates',
          icon: '📘',
          folder: 'specs',
          sortOrder: 1,
          enabled: true,
        },
        {
          id: 2,
          key: 'images',
          nameZh: '产品图片',
          nameEn: 'Product Images',
          descZh: '高清精修图 / 现场实拍',
          descEn: 'High‑resolution product photos',
          icon: '🖼️',
          folder: 'images',
          sortOrder: 2,
          enabled: true,
        },
        {
          id: 3,
          key: 'videos',
          nameZh: '产品视频',
          nameEn: 'Product Videos',
          descZh: '宣传片 / 拆解 / 安装',
          descEn: 'Promo / demo / installation',
          icon: '🎬',
          folder: 'videos',
          sortOrder: 3,
          enabled: true,
        },
        {
          id: 4,
          key: 'marketing',
          nameZh: '推广素材',
          nameEn: 'Marketing Assets',
          descZh: '朋友圈文案 / 海报模板',
          descEn: 'Marketing copy / poster templates',
          icon: '🚀',
          folder: 'marketing',
          sortOrder: 4,
          enabled: true,
        },
        {
          id: 5,
          key: 'brand',
          nameZh: '品牌物料',
          nameEn: 'Brand Assets',
          descZh: 'Logo / VI标准 / 灯箱图',
          descEn: 'Logo / VI / brand materials',
          icon: '📂',
          folder: 'brand',
          sortOrder: 5,
          enabled: true,
        },
      ]
    }

    if (!activeCategory.value && categories.value.length) {
      activeCategory.value = categories.value[0]?.key ?? ''
    }

    const localeIsZh = locale.value.startsWith('zh')
    const dynamicTabs: SeriesTab[] = (series || []).map((s: CompanyFileSeries) => ({
      key: s.slug,
      label: localeIsZh ? s.nameZh : s.nameEn || s.nameZh,
      slug: s.slug,
      categoryKey: s.categoryKey,
    }))

    seriesTabs.value = [
      { key: 'all', label: localeIsZh ? '全部类型' : 'All types', slug: 'all' },
      ...dynamicTabs,
    ]

    // 应用后台配置的存储位置（如有）
    const cfg = (wsCfgs as WorkspaceStorageConfig[]).find(c => c.moduleKey === 'company-files')
    if (cfg) {
      driveId.value = (cfg.driveId || DEFAULT_DRIVE_ID).toLowerCase()
      rootPath.value = cfg.rootPath || DEFAULT_ROOT_PATH
    }
  } catch (error: any) {
    console.error('加载公司文件配置失败:', error)
    ElMessage.error(error?.message || t('common.error'))
  }
}

onMounted(async () => {
  // 进入页面时刷新一次当前账号的权限，确保刚被分配/收回权限后按钮显示与后端一致
  try {
    await userStore.loadPermissions?.()
  } catch (e) {
    // 忽略权限刷新失败，仅影响前端按钮显示
    console.warn('刷新权限失败，仅影响前端按钮显示', e)
  }

  await loadCategoriesAndSeries()
  await loadFiles()
})
</script>

<style scoped lang="scss">
.company-files-page {
  min-height: 100vh;
  padding: 32px 32px 40px;
  background: #f5f5f7;

  .container {
    max-width: 1400px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: 32px;

    h1 {
      font-size: 32px;
      font-weight: 600;
      margin: 0;
      color: #1d1d1f;
    }

    p {
      color: #86868b;
      margin: 8px 0 0;
      font-size: 14px;
    }
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .cat-card {
    background: #ffffff;
    padding: 24px 20px;
    border-radius: 22px;
    transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
    border: 1px solid transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);

    .cat-icon {
      font-size: 36px;
      margin-bottom: 12px;
    }

    h3 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
      color: #1d1d1f;
    }

    p {
      margin: 6px 0 0;
      font-size: 13px;
      color: #86868b;
    }

    &.active {
      background: linear-gradient(135deg, #0071e3 0%, #005bb7 100%);
      color: #ffffff;
      box-shadow: 0 15px 35px rgba(0, 113, 227, 0.3);
      transform: scale(1.02);
      border-color: transparent;

      h3 {
        color: #ffffff;
      }

      p {
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }

  .content-area {
    background: #ffffff;
    border-radius: 28px;
    padding: 24px 24px 28px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02);
  }

  .content-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    border-bottom: 1px solid #f2f2f2;
    padding-bottom: 16px;
  }

  .series-tabs {
    display: flex;
    gap: 8px;
    background: #f2f2f7;
    padding: 4px;
    border-radius: 12px;
  }

  .s-tab {
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 500;
    color: #86868b;
    cursor: pointer;
    border-radius: 9px;
    transition: all 0.2s;

    &.active {
      background: #ffffff;
      color: #1d1d1f;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 10px;

    .search-input {
      width: 260px;

      :deep(.el-input__wrapper) {
        background: #f2f2f7;
        box-shadow: none;
        border-radius: 12px;
      }

      :deep(.el-input__inner) {
        font-size: 13px;
      }
    }
  }

  .file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
  }

  .file-item {
    position: relative;
    background: #ffffff;
    border: 1px solid #f2f2f2;
    border-radius: 16px;
    padding: 18px;
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    cursor: pointer;
    text-align: center;

    &:hover {
      transform: translateY(-4px);
      border-color: #0071e3;
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.04);
    }
  }

  .file-preview {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 56px;
    margin-bottom: 14px;
    background: #f9f9fb;
    border-radius: 12px;
    position: relative;
    overflow: hidden;

    img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
    }
  }

  .type-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    color: white;
    text-transform: uppercase;
  }

  .bg-pdf {
    background: #ff3b30;
  }

  .bg-mp4 {
    background: #5856d6;
  }

  .bg-img {
    background: #34c759;
  }

  .file-name {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 4px;
    line-height: 1.4;
    white-space: normal;
    word-break: break-all;
  }

  .file-meta {
    font-size: 12px;
    color: #86868b;
    margin-bottom: 14px;
  }

  .file-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.25s;
  }

  // AI 链接卡片样式
  .ai-link-card {
    .ai-link-icon {
      font-size: 32px;
    }

    .ai-link-actions {
      opacity: 1;
      transform: none;
      margin-top: auto;
    }
  }

  .file-item:hover .file-actions {
    opacity: 1;
    transform: translateY(0);
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
    border-radius: 20px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: 0.2s;
  }

  .btn-view {
    background: #f2f2f7;
    color: #1d1d1f;
  }

  .btn-down {
    background: #0071e3;
    color: #ffffff;
  }

  .btn-view:hover {
    background: #e5e5ea;
  }

  .more-dropdown {
    .btn-more {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      padding: 6px 0;
      border-radius: 999px;
      background: #f2f2f7;
      border: none;
      cursor: pointer;
      color: #86868b;
      transition: 0.2s;
    }

    .btn-more:hover {
      background: #e5e5ea;
      color: #1d1d1f;
    }
  }

  .empty-state {
    grid-column: 1/-1;
    margin-top: 32px;
  }

  // 公司文件在平板和手机端的适配
  @media (max-width: 1200px) {
    padding: 24px 20px 32px;

    .category-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 768px) {
    padding: 20px 12px 28px;

    .container {
      max-width: 100%;
    }

    .header {
      margin-bottom: 20px;

      h1 {
        font-size: 24px;
      }
    }

    .category-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .content-area {
      padding: 16px 14px 20px;
      border-radius: 20px;
    }

    .content-nav {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .nav-right {
      width: 100%;

      .search-input {
        width: 100%;
      }
    }

    .file-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }
  }

  @media (max-width: 480px) {
    .category-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>


