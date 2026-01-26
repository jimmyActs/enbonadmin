<template>
  <div class="company-files-page page-content-enter">
    <div class="container">
      <!-- 顶部标题 -->
      <header class="header fade-in-up">
        <h1>{{ t('workspace.softwareDownloadsPage.title') }}</h1>
        <p>{{ t('workspace.softwareDownloadsPage.subtitle') }}</p>
      </header>

      <!-- 顶部分类卡片（三大类） -->
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
              {{ t('common.back') }}
            </el-button>
            <div
              v-if="isAtCategoryRoot"
              class="series-tabs"
            >
              <div
                v-for="tab in visibleSeriesTabs"
                :key="tab.key"
                class="s-tab"
                :class="{ active: activeSeries === tab.key }"
                @click="activeSeries = tab.key"
              >
                {{ tab.label }}
              </div>
            </div>
          </div>

          <div class="nav-right">
            <el-input
              v-model="searchKeyword"
              class="search-input"
              :placeholder="t('workspace.softwareDownloadsPage.searchPlaceholder')"
              clearable
            />
            <el-button
              type="primary"
              size="small"
              :icon="Upload"
              @click="showUploadDialog = true"
            >
              {{ t('common.upload') }}
            </el-button>
            <el-button
              size="small"
              :icon="FolderAdd"
              @click="showCreateFolderDialog = true"
            >
              {{ t('files.createFolder') }}
            </el-button>
          </div>
        </div>

        <!-- 文件网格 -->
        <div class="file-grid" v-loading="loading">
          <div
            v-for="item in filteredFiles"
            :key="item.path"
            class="file-item"
          >
            <div class="file-preview" @dblclick="handleOpen(item)">
              <template v-if="item.isDirectory">
                <div class="folder-cover">
                  <el-icon class="folder-icon"><Folder /></el-icon>
                </div>
              </template>
              <template v-else>
                <div class="software-cover">
                  <el-icon class="cover-icon"><Grid /></el-icon>
                </div>
              </template>
            </div>

            <h4 class="file-name" :title="getDisplayName(item)">
              {{ getDisplayName(item) }}
            </h4>
            <p class="file-meta">
              <template v-if="!item.isDirectory">
                {{ formatFileSize(item.size) }} · {{ formatDate(item.modified) }}
              </template>
              <template v-else>
                {{ t('files.folder') || '文件夹' }}
              </template>
            </p>

            <div class="file-actions">
              <template v-if="item.isDirectory">
                <button class="btn-sm btn-view" @click="navigateToPath(item.path)">
                  {{ t('files.openFolder') || '打开文件夹' }}
                </button>
              </template>
              <template v-else>
                <button class="btn-sm btn-down" @click="handleDownload(item)">
                  {{ t('files.download') || '下载' }}
                </button>
              </template>
              <el-dropdown
                class="more-dropdown"
                trigger="click"
                @command="(command: 'rename' | 'delete') => handleMoreCommand(command, item)"
              >
                <span class="btn-sm btn-more">
                  <el-icon><MoreFilled /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="rename">{{ t('files.rename') || '重命名' }}</el-dropdown-item>
                    <el-dropdown-item command="delete">{{ t('common.delete') || '删除' }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <el-empty
            v-if="!loading && filteredFiles.length === 0"
            :description="$t('common.noData')"
            class="empty-state"
          />
        </div>

        <!-- 新建文件夹弹窗 -->
        <el-dialog
          v-model="showCreateFolderDialog"
          :title="t('workspace.softwareDownloadsPage.newFolderTitle')"
          width="420px"
          :close-on-click-modal="false"
          append-to-body
        >
          <el-form label-position="top">
            <el-form-item v-if="isAtCategoryRoot" :label="t('workspace.softwareDownloadsPage.typeLabel')">
              <el-select
                v-model="selectedSeriesForFolder"
                filterable
                allow-create
                default-first-option
                :placeholder="t('workspace.softwareDownloadsPage.typePlaceholder')"
              >
                <el-option
                  v-for="opt in seriesOptionsForCurrentCategory"
                  :key="opt.slug"
                  :label="opt.label"
                  :value="opt.slug"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('workspace.softwareDownloadsPage.folderNameLabel')">
              <el-input
                v-model="newFolderName"
                :placeholder="t('files.folderNamePlaceholder')"
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
          :title="t('workspace.softwareDownloadsPage.uploadTitle')"
          width="460px"
          :close-on-click-modal="false"
          append-to-body
        >
          <div class="upload-form">
            <el-form label-position="top">
              <el-form-item v-if="isAtCategoryRoot" :label="t('workspace.softwareDownloadsPage.typeLabel')">
                <el-select
                  v-model="selectedSeriesForUpload"
                  filterable
                  allow-create
                  default-first-option
                  :placeholder="t('workspace.softwareDownloadsPage.typePlaceholder')"
                >
                  <el-option
                    v-for="opt in seriesOptionsForCurrentCategory"
                    :key="opt.slug"
                    :label="opt.label"
                    :value="opt.slug"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
          <el-upload
            drag
            :auto-upload="false"
            :file-list="uploadFileList"
            :on-change="handleUploadChange"
            :on-remove="handleUploadRemove"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              {{ t('workspace.softwareDownloadsPage.uploadDragText') }}
            </div>
          </el-upload>
          <template #footer>
            <el-button @click="showUploadDialog = false">{{ $t('common.cancel') }}</el-button>
            <el-button type="primary" :loading="uploading" @click="handleUploadSubmit">
              {{ t('workspace.softwareDownloadsPage.startUpload') }}
            </el-button>
          </template>
        </el-dialog>
      </div>
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
  Folder,
  ArrowLeft,
  MoreFilled,
  Monitor,
  Cpu,
  Grid,
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

const { t, locale } = useI18n()

const DEFAULT_DRIVE_ID = ((import.meta as any).env?.VITE_WORKSPACE_DRIVE_ID as string | undefined)?.toLowerCase?.() || 'd'
const DEFAULT_ROOT_PATH = 'software-downloads'

const driveId = ref<string>(DEFAULT_DRIVE_ID)
const rootPath = ref<string>(DEFAULT_ROOT_PATH)

// 大类配置：办公软件 / 调试软件 / 其他软件
const categories = ref([
  { key: 'office', folder: 'office' },
  { key: 'debug', folder: 'debug' },
  { key: 'other', folder: 'other' },
])
const activeCategory = ref<string>('office')
const loading = ref(false)
const fileList = ref<FileItem[]>([])
const currentPath = ref('')

interface SeriesTab {
  key: string
  label: string
  slug: string
  categoryKey?: string
}

// 系列筛选 & 搜索（自定义类型）
const seriesTabs = ref<SeriesTab[]>([
  { key: 'all', label: t('common.all'), slug: 'all' },
])
const activeSeries = ref('all')
const searchKeyword = ref('')

// 针对当前大类可选的类型（左侧 Tab 同源）
const seriesOptionsForCurrentCategory = computed(() =>
  seriesTabs.value.filter(
    (t) => t.key !== 'all' && t.categoryKey === activeCategory.value,
  ),
)

// 左侧展示用的 Tab 列表（只显示当前大类的类型）
const visibleSeriesTabs = computed(() =>
  seriesTabs.value.filter(
    (t) => t.key === 'all' || t.categoryKey === activeCategory.value,
  ),
)

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

// 顶部展示用的分类卡片
const categoryConfigs = computed(() => {
  const localeIsZh = locale.value.startsWith('zh')

  const ui = {
    office: {
      titleZh: '办公软件',
      titleEn: 'Office Software',
      descZh: 'VPN、常用办公工具等',
      descEn: 'VPN clients and common office tools.',
      icon: Monitor,
    },
    debug: {
      titleZh: '调试软件',
      titleEn: 'Debug Tools',
      descZh: 'LED 控制器调试、串口、抓包等工具',
      descEn: 'LED controller utilities, serial and capture tools.',
      icon: Cpu,
    },
    other: {
      titleZh: '其他软件',
      titleEn: 'Other Software',
      descZh: '驱动、安装包等',
      descEn: 'Drivers, installers and others.',
      icon: Grid,
    },
  } as const

  return categories.value.map((c) => {
    const cfg = ui[c.key as keyof typeof ui]
    const title = localeIsZh ? cfg.titleZh : cfg.titleEn
    const desc = localeIsZh ? cfg.descZh : cfg.descEn
    return {
      key: c.key,
      icon: cfg.icon,
      title,
      desc,
      folder: c.folder,
    }
  })
})

const activeCategoryConfig = computed(() => {
  return categoryConfigs.value.find(c => c.key === activeCategory.value) || categoryConfigs.value[0]
})

// 当前分区 + 路径组合成实际后端路径
const fullPath = computed(() => {
  const cat = activeCategoryConfig.value
  const folder = cat?.folder || 'office'
  const base = `${rootPath.value}/${folder}`
  return currentPath.value ? `${base}/${currentPath.value}` : base
})

// 面包屑 & 是否在根目录
const pathSegments = computed(() => {
  if (!currentPath.value) return []
  return currentPath.value.split('/').filter(Boolean)
})

const isAtCategoryRoot = computed(() => pathSegments.value.length === 0)

const goBack = () => {
  if (!currentPath.value) return
  const segs = currentPath.value.split('/').filter(Boolean)
  segs.pop()
  currentPath.value = segs.join('/')
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

// 加载文件列表（不存在时自动创建根目录）
const loadFiles = async () => {
  if (!activeCategory.value) return
  loading.value = true
  try {
    const list = await getFileList(driveId.value, fullPath.value).catch(async (error: any) => {
      // 如果当前分类目录不存在，自动创建后再读取
      if (error?.response?.status === 404) {
        const cat = activeCategoryConfig.value
        if (cat?.folder) {
          await createFolder(driveId.value, rootPath.value, cat.folder)
          return await getFileList(driveId.value, fullPath.value)
        }
      }
      throw error
    })
    fileList.value = list || []
  } catch (error: any) {
    console.error('加载软件下载文件失败:', error)
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const handleCategoryClick = (key: string) => {
  if (activeCategory.value === key) return
  activeCategory.value = key
  currentPath.value = ''
  activeSeries.value = 'all'
  searchKeyword.value = ''
  loadFiles()
}

const navigateToPath = (path: string) => {
  currentPath.value = normalizeCategoryPath(path)
  loadFiles()
}

const handleOpen = (item: FileItem) => {
  if (item.isDirectory) {
    navigateToPath(item.path)
  } else {
    handleDownload(item)
  }
}

// 名称展示：去掉类型前缀
const getDisplayName = (item: FileItem): string => {
  const rawName: string = item.name || ''
  if (!rawName) return ''
  const m = rawName.match(/^\[[^\]]+\]\s*(.+)$/)
  return m && m[1] ? m[1] : rawName
}

// 从名称中提取类型前缀 [Type]
const extractTypeFromName = (name: string): string | null => {
  const m = name.match(/^\[(.+?)\]/)
  return m && m[1] ? m[1] : null
}

// 从当前路径中推断所属类型（例如根目录下的 [卡莱特] 文件夹内）
const getCurrentTypeFromPath = (): string | null => {
  if (!currentPath.value) return null
  const firstSeg = pathSegments.value[0]
  if (!firstSeg) return null
  const m = firstSeg.match(/^\[(.+?)\]/)
  return m && m[1] ? m[1] : null
}

// 为当前大类确保一个类型 Tab 存在，并返回用于前缀的 slug
const ensureTypeForCurrentCategory = (rawLabel: string): string => {
  const label = rawLabel.trim()
  const slug = label.replace(/[\\/]/g, '_') // 用于文件名前缀和筛选

  let tab = seriesTabs.value.find(
    (t) => t.slug === slug && t.categoryKey === activeCategory.value,
  )

  if (!tab) {
    tab = {
      key: slug,
      label,
      slug,
      categoryKey: activeCategory.value,
    }
    seriesTabs.value.push(tab)
  }

  activeSeries.value = tab.key
  return slug
}


// 创建文件夹
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
      // 根目录：根据选择的类型创建/更新 Tab
      if (selectedSeriesForFolder.value.trim()) {
        typeSlug = ensureTypeForCurrentCategory(selectedSeriesForFolder.value)
      }
    } else {
      // 子文件夹：从路径中继承类型
      typeSlug = getCurrentTypeFromPath() || ''
    }

    if (typeSlug) {
      folderName = `[${typeSlug}] ${folderName}`
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

// 删除 / 重命名 / 下载
const handleDelete = async (item: FileItem) => {
  try {
    await ElMessageBox.confirm(
      t('files.deleteConfirm', { name: getDisplayName(item) }),
      t('common.warning'),
      { type: 'warning' },
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
      t('files.renamePrompt', { name: getDisplayName(item) }),
      t('files.rename'),
      {
        inputValue: getDisplayName(item),
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
      },
    )
    if (!value || value === getDisplayName(item)) return
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
    a.download = getDisplayName(item)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
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
      if (selectedSeriesForUpload.value.trim()) {
        typeSlug = ensureTypeForCurrentCategory(selectedSeriesForUpload.value)
      }
    } else {
      typeSlug = getCurrentTypeFromPath() || ''
    }

    for (const f of uploadFileList.value) {
      if (!f.raw) continue
      let rawFile = f.raw as File

      if (typeSlug) {
        const originName = rawFile.name
        const dotIndex = originName.lastIndexOf('.')
        const ext = dotIndex > -1 ? originName.slice(dotIndex) : ''
        const base = dotIndex > -1 ? originName.slice(0, dotIndex) : originName
        const newName = `[${typeSlug}] ${base}${ext}`
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

// 筛选
const filteredFiles = computed(() => {
  let list = fileList.value

  // 类型筛选（Tab）
  if (activeSeries.value !== 'all') {
    const key = activeSeries.value
    list = list.filter((f) => extractTypeFromName(f.name) === key)
  }

  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(f => getDisplayName(f).toLowerCase().includes(kw))
  }

  return list
})

const handleMoreCommand = (command: 'rename' | 'delete', item: FileItem) => {
  if (command === 'rename') {
    handleRename(item)
  } else if (command === 'delete') {
    handleDelete(item)
  }
}

// 工具函数
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
    minute: '2-digit',
  })
}

onMounted(async () => {
  // 加载工作空间存储配置（如有），再加载文件
  try {
    const wsCfgs = await getWorkspaceStorageConfigs()
    const cfg = (wsCfgs as WorkspaceStorageConfig[]).find(c => c.moduleKey === 'software-downloads')
    if (cfg) {
      driveId.value = (cfg.driveId || DEFAULT_DRIVE_ID).toLowerCase()
      rootPath.value = cfg.rootPath || DEFAULT_ROOT_PATH
    }
  } catch (error: any) {
    console.error('加载软件存储配置失败:', error)
  }
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
      background: linear-gradient(135deg, #00b894 0%, #00a36c 100%);
      color: #ffffff;
      box-shadow: 0 15px 35px rgba(0, 184, 148, 0.3);
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
    background: #f9f9fb;
    border-radius: 20px;
    padding: 16px 16px 18px;
    border: 1px solid transparent;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.03);
    transition: all 0.25s;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    &:hover {
      transform: translateY(-4px);
      border-color: #00b894;
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.04);
    }
  }

  .software-cover {
    width: 72px;
    height: 72px;
    border-radius: 18px;
    background: linear-gradient(135deg, #00b894 0%, #00a36c 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .cover-icon {
    font-size: 32px;
  }

  .folder-cover {
    width: 72px;
    height: 72px;
    border-radius: 18px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #00a36c;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .folder-icon {
    font-size: 36px;
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
    background: #00b894;
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
}
</style>


