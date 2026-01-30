<template>
  <div class="files-container page-content-enter">
    <el-card class="fade-in-up">
      <template #header>
        <div class="card-header">
          <h2>{{ $t('files.title') }}</h2>
        </div>
      </template>

      <div class="files-layout">
        <!-- 左侧：盘列表 -->
        <div class="drives-sidebar">
          <h3>{{ $t('files.drives') }}</h3>
          
          <!-- 部门列表：一行2个 -->
          <div class="departments-grid">
            <div
              v-for="drive in driveGroups?.departments || []"
              :key="drive.id"
              class="department-card"
              :class="{ active: currentDrive?.id === drive.id }"
              @click="selectDrive(drive)"
            >
              <el-icon class="department-card-icon">
                <Folder v-if="drive.type === 'public'" />
                <FolderOpened v-else />
              </el-icon>
              <div class="department-card-name">
                {{ getLocale() === 'en-US' ? drive.departmentNameEn : drive.departmentName || drive.name }}
              </div>
              
              <!-- 容量进度条：出于性能与简洁性考虑，暂时隐藏
                   如果未来需要展示真实容量，可在此处重新启用并配合后端优化扫描逻辑 -->
              
              <el-icon v-if="drive.requiresPassword && !drive.hasAccess" class="department-lock-icon">
                <Lock />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 右侧：文件浏览器 -->
        <div class="file-browser">
          <div v-if="!currentDrive" class="empty-state">
            <el-empty :description="$t('files.selectDrive')" />
          </div>

          <div v-else-if="!currentDrive.hasAccess && currentDrive.requiresPassword" class="password-prompt">
            <el-card>
              <el-form @submit.prevent="handlePasswordVerify">
                <el-form-item :label="$t('files.password')">
                  <el-input
                    v-model="passwordInput"
                    type="password"
                    :placeholder="$t('files.enterPassword')"
                    @keyup.enter="handlePasswordVerify"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handlePasswordVerify">
                    {{ $t('files.verify') }}
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>

          <div v-else class="file-content">
            <!-- 工具栏 -->
            <div class="toolbar">
              <div class="breadcrumb">
                <el-button
                  v-if="currentPath"
                  :icon="ArrowLeft"
                  circle
                  class="back-button"
                  @click="goBack"
                />
                <el-breadcrumb separator="/">
                  <el-breadcrumb-item>{{ currentDrive.nameFull || currentDrive.name }}</el-breadcrumb-item>
                  <el-breadcrumb-item
                    v-for="(segment, index) in pathSegments"
                    :key="index"
                    @click="navigateToPath(getPathUpToIndex(index))"
                  >
                    {{ segment }}
                  </el-breadcrumb-item>
                </el-breadcrumb>
              </div>
              <div class="toolbar-actions">
                <!-- 视图切换 -->
                <el-radio-group v-model="viewMode" size="small" style="margin-right: 12px;">
                  <el-radio-button value="table">
                    <el-icon><List /></el-icon>
                    <span style="margin-left: 4px;">{{ $t('files.listView') }}</span>
                  </el-radio-button>
                  <el-radio-button value="grid">
                    <el-icon><Grid /></el-icon>
                    <span style="margin-left: 4px;">{{ $t('files.gridView') }}</span>
                  </el-radio-button>
                </el-radio-group>
                <el-button :icon="Refresh" circle class="icon-circle-btn" @click="refreshFiles" />
                <el-button :icon="Upload" @click="showUploadDialog = true">
                  {{ $t('files.upload') }}
                </el-button>
                <el-button :icon="FolderAdd" @click="showCreateFolderDialog = true">
                  {{ $t('files.createFolder') }}
                </el-button>
                <el-button :icon="Link" @click="showShareDialog = true">
                  {{ $t('files.shareLink') }}
                </el-button>
              </div>
            </div>

            <!-- 文件列表 -->
            <div class="file-list">
              <!-- 表格视图 -->
              <el-table
                v-if="viewMode === 'table'"
                v-loading="loading"
                :data="fileList"
                style="width: 100%"
                @row-dblclick="handleRowDoubleClick"
              >
                <el-table-column :label="$t('files.thumbnail')" width="80" align="center">
                  <template #default="{ row }">
                    <div class="thumbnail-cell">
                      <img
                        v-if="row.isImage && currentDrive"
                        :src="getThumbnailSrc(row.path)"
                        :alt="row.name"
                        class="thumbnail-img"
                        @error="handleImageError"
                      />
                      <el-icon v-else-if="row.isDirectory" class="thumbnail-icon folder">
                        <Folder />
                      </el-icon>
                      <el-icon v-else class="thumbnail-icon file">
                        <Document />
                      </el-icon>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('files.fileName')" min-width="200">
                  <template #default="{ row }">
                    <div class="file-name-cell">
                      <el-icon class="file-icon">
                        <Folder v-if="row.isDirectory" />
                        <Document v-else />
                      </el-icon>
                      <span class="file-name-text">{{ row.name }}</span>
                      <el-icon v-if="row.isLocked" class="lock-icon-after" :title="$t('files.locked')">
                        <Lock />
                      </el-icon>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('files.fileSize')" width="120">
                  <template #default="{ row }">
                    {{ formatFileSize(row.size) }}
                  </template>
                </el-table-column>
                <el-table-column :label="$t('files.modifiedTime')" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.modified) }}
                  </template>
                </el-table-column>
                <el-table-column :label="$t('files.operations')" width="280" fixed="right" align="right">
                  <template #default="{ row }">
                    <div class="operations-cell">
                      <el-button
                        v-if="row.canPreview && !row.isDirectory"
                        :icon="View"
                        size="small"
                        @click="handlePreview(row)"
                      >
                        {{ $t('files.preview') }}
                      </el-button>
                      <el-button
                        v-if="row.isDirectory"
                        :icon="FolderOpened"
                        size="small"
                        @click="navigateToPath(row.path)"
                      >
                        {{ $t('common.open') }}
                      </el-button>
                      <el-button
                        v-else
                        :icon="Download"
                        size="small"
                        @click="handleDownload(row)"
                      >
                        {{ $t('files.download') }}
                      </el-button>
                      <el-button
                        v-if="row.isDirectory && row.isLocked && row.isOwner"
                        :icon="Unlock"
                        size="small"
                        type="warning"
                        @click="handleUnlockFolder(row)"
                      >
                        {{ $t('files.unlock') }}
                      </el-button>
                      <el-button
                        v-if="!row.isLocked || row.isOwner"
                        :icon="Edit"
                        size="small"
                        @click="handleRename(row)"
                      >
                        {{ $t('files.rename') }}
                      </el-button>
                      <el-button
                        v-if="!row.isLocked || row.isOwner"
                        :icon="Delete"
                        size="small"
                        type="danger"
                        @click="handleDelete(row)"
                      >
                        {{ $t('files.delete') }}
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 卡片视图（宫格排列） -->
              <div v-if="viewMode === 'grid'" v-loading="loading" class="file-grid-view">
                <div
                  v-for="item in fileList"
                  :key="item.path"
                  class="file-card"
                  @dblclick="handleItemDoubleClick(item)"
                >
                  <div class="file-card-thumbnail">
                    <img
                      v-if="item.isImage && currentDrive"
                      :src="getThumbnailSrc(item.path)"
                      :alt="item.name"
                      class="file-card-img"
                      @error="handleImageError"
                    />
                    <div v-else class="file-card-icon">
                      <el-icon class="icon-large">
                        <Folder v-if="item.isDirectory" />
                        <Document v-else />
                      </el-icon>
                    </div>
                    <el-icon v-if="item.isLocked" class="file-card-lock" :title="$t('files.locked')">
                      <Lock />
                    </el-icon>
                  </div>
                  <div class="file-card-info">
                    <div class="file-card-name" :title="item.name">{{ item.name }}</div>
                    <div class="file-card-meta">
                      <span v-if="!item.isDirectory">{{ formatFileSize(item.size) }}</span>
                      <span v-else>-</span>
                      <span class="file-card-time">{{ formatDate(item.modified) }}</span>
                    </div>
                  </div>
                  <div class="file-card-actions">
                    <el-dropdown trigger="click" @command="(command: string) => handleGridAction(command, item)">
                      <el-button circle size="small" :icon="More" />
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item
                            v-if="item.canPreview && !item.isDirectory"
                            command="preview"
                            :icon="View"
                          >
                            {{ $t('files.preview') }}
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-if="item.isDirectory"
                            command="open"
                            :icon="FolderOpened"
                          >
                            {{ $t('common.open') }}
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-else
                            command="download"
                            :icon="Download"
                          >
                            {{ $t('files.download') }}
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-if="item.isDirectory && item.isLocked && item.isOwner"
                            command="unlock"
                            :icon="Unlock"
                          >
                            {{ $t('files.unlock') }}
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-if="!item.isLocked || item.isOwner"
                            command="rename"
                            :icon="Edit"
                          >
                            {{ $t('files.rename') }}
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-if="!item.isLocked || item.isOwner"
                            command="delete"
                            :icon="Delete"
                            divided
                          >
                            {{ $t('files.delete') }}
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                  <!-- 手机端：把常用操作放在卡片下方 -->
                  <div class="file-card-actions-mobile">
                    <el-button
                      v-if="item.isDirectory"
                      size="small"
                      @click="navigateToPath(item.path)"
                    >
                      {{ $t('common.open') }}
                    </el-button>
                    <el-button
                      v-else
                      size="small"
                      @click="handleDownload(item)"
                    >
                      {{ $t('files.download') }}
                    </el-button>
                    <el-button
                      v-if="!item.isDirectory && item.canPreview"
                      size="small"
                      @click="handlePreview(item)"
                    >
                      {{ $t('files.preview') }}
                    </el-button>
                    <el-button
                      v-if="!item.isLocked || item.isOwner"
                      size="small"
                      @click="handleRename(item)"
                    >
                      {{ $t('files.rename') }}
                    </el-button>
                    <el-button
                      v-if="!item.isLocked || item.isOwner"
                      size="small"
                      type="danger"
                      @click="handleDelete(item)"
                    >
                      {{ $t('files.delete') }}
                    </el-button>
                  </div>
                </div>
              </div>

              <el-empty v-if="!loading && fileList.length === 0" :description="$t('files.emptyFolder')" />
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      :title="$t('files.upload')"
      width="500px"
    >
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="uploadFileList"
        drag
        multiple
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          {{ $t('files.dropFilesHere') || '将文件拖到此处，或点击上传' }}
        </div>
      </el-upload>
      <div v-if="uploadProgress > 0" class="upload-progress">
        <el-progress :percentage="uploadProgress" />
      </div>
      <template #footer>
        <el-button @click="showUploadDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">
          {{ $t('files.upload') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建文件夹对话框 -->
    <el-dialog
      v-model="showCreateFolderDialog"
      :title="$t('files.createFolder')"
      width="400px"
    >
      <el-form :model="folderForm" label-width="100px">
        <el-form-item :label="$t('files.newFolderName')">
          <el-input v-model="folderForm.name" :placeholder="$t('files.enterFolderName')" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="folderForm.isLocked">
            {{ $t('files.lockWhenCreate') }}
          </el-checkbox>
          <div class="form-tip">{{ $t('files.lockWhenCreateTip') }}</div>
        </el-form-item>
        <el-form-item v-if="folderForm.isLocked" :label="$t('files.password')">
          <el-input
            v-model="folderForm.password"
            type="password"
            :placeholder="$t('files.optionalPassword')"
            show-password
          />
          <div class="form-tip">{{ $t('files.lockPasswordTip') }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateFolderDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleCreateFolder">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 重命名文件对话框 -->
    <el-dialog
      v-model="showRenameDialog"
      :title="$t('files.renameFile')"
      width="400px"
    >
      <el-form :model="renameForm" label-width="100px">
        <el-form-item :label="$t('files.enterNewName')">
          <el-input v-model="renameForm.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRenameDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleRenameConfirm">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 重命名盘对话框 -->
    <el-dialog
      v-model="showRenameDriveDialog"
      :title="$t('files.renameDrive')"
      width="400px"
    >
      <el-form :model="renameDriveForm" label-width="100px">
        <el-form-item :label="$t('files.driveName')">
          <el-input v-model="renameDriveForm.name" :placeholder="$t('files.enterDriveName')" />
        </el-form-item>
        <div class="form-tip">{{ $t('files.renameDriveTip') }}</div>
      </el-form>
      <template #footer>
        <el-button @click="showRenameDriveDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleRenameDriveConfirm">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 解锁文件夹对话框 -->
    <el-dialog
      v-model="showUnlockDialog"
      :title="$t('files.unlockFolder')"
      width="400px"
    >
      <el-form :model="unlockForm" label-width="100px">
        <el-form-item :label="$t('files.folderName')">
          <el-input :value="unlockForm.folderName" readonly />
        </el-form-item>
        <el-form-item :label="$t('files.password')" v-if="unlockForm.requiresPassword">
          <el-input
            v-model="unlockForm.password"
            type="password"
            :placeholder="$t('files.enterPassword')"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUnlockDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleUnlockConfirm">{{ $t('files.unlock') }}</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="previewFile?.name"
      width="80%"
      top="5vh"
      destroy-on-close
    >
      <div class="preview-container">
        <img
          v-if="previewFile?.isImage && currentDrive"
          :src="previewImageUrl || getPreviewUrlLocal(previewFile.path)"
          class="preview-image"
          alt="Preview"
          @error="handlePreviewError"
        />
        <video
          v-else-if="previewFile?.isVideo && currentDrive"
          :src="getPreviewUrlLocal(previewFile.path)"
          controls
          class="preview-video"
        />
        <iframe
          v-else-if="previewFile?.isPdf && currentDrive"
          :src="getPreviewUrlLocal(previewFile.path)"
          class="preview-pdf"
          frameborder="0"
        />
        <div
          v-else-if="previewFile?.isText && currentDrive"
          class="preview-text"
        >
          <iframe
            :src="getPreviewUrlLocal(previewFile.path)"
            class="preview-text-iframe"
            frameborder="0"
          />
        </div>
        <div v-else class="preview-unsupported">
          {{ $t('files.previewUnsupported') }}
        </div>
      </div>
    </el-dialog>

    <!-- 共享链接对话框 -->
    <el-dialog
      v-model="showShareDialog"
      :title="$t('files.shareLink')"
      width="600px"
    >
      <div class="share-links">
        <el-button type="primary" :icon="Link" @click="handleGenerateLink">
          {{ $t('files.generateLink') }}
        </el-button>
        <el-table :data="shareLinks" style="margin-top: 20px">
          <el-table-column :label="$t('files.shareLink')" min-width="300">
            <template #default="{ row }">
              <el-input :value="row.link" readonly>
                <template #append>
                  <el-button @click="copyToClipboard(row.link)">
                    {{ $t('files.copyLink') }}
                  </el-button>
                </template>
              </el-input>
            </template>
          </el-table-column>
          <el-table-column :label="$t('files.expiresAt')" width="180">
            <template #default="{ row }">
              {{ row.expiresAt || $t('files.permanent') }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('files.operations')" width="100">
            <template #default="{ row }">
              <el-button
                :icon="Delete"
                size="small"
                type="danger"
                @click="handleDeleteLink(row.id)"
              >
                {{ $t('files.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Folder, FolderOpened, Document, Download, Delete, Edit,
  Upload, FolderAdd, Link, Refresh, Lock, UploadFilled, View, Unlock, ArrowLeft,
  List, Grid, More
} from '@element-plus/icons-vue'
import {
  getDrives, verifyDrivePassword, getFileList, createFolder,
  deleteFile, renameFile, uploadFile, downloadFile,
  generateShareLink, getShareLinks, deleteShareLink,
  unlockFolder, getPreviewUrl, getThumbnailUrl, renameDrive,
  type DriveInfo, type FileItem, type DriveGroups
} from '../api/files'
import { getApiBaseURL } from '../api/config'

const { t, locale } = useI18n()

// 计算属性
const pathHistory = ref<string[]>([]) // 路径历史记录

// 工具函数
const getLocale = () => {
  return locale.value
}

// 计算剩余空间百分比（保证结果在 0~100 之间，避免进度条告警）
const getRemainingPercent = (drive: DriveInfo): number => {
  let percent = 100

  if (drive.usedPercent !== undefined) {
    percent = 100 - drive.usedPercent
  } else if (drive.capacity && drive.used !== undefined) {
    // 如果没有 usedPercent，尝试从 used 和 capacity 计算
    percent = ((drive.capacity - drive.used) / drive.capacity) * 100
  }

  // 部分磁盘在扫描失败或权限异常时可能返回异常值，这里做一次安全夹紧
  if (Number.isNaN(percent)) {
    return 100
  }
  return Math.min(100, Math.max(0, percent))
}

// 状态管理
const drives = ref<DriveInfo[]>([])
const driveGroups = ref<DriveGroups | null>(null)
const currentDrive = ref<DriveInfo | null>(null)
const currentPath = ref('')
const fileList = ref<FileItem[]>([])
const loading = ref(false)
const passwordInput = ref('')
const viewMode = ref<'table' | 'grid'>('table') // 视图模式：table 表格视图，grid 卡片视图

// 对话框状态
const showUploadDialog = ref(false)
const showCreateFolderDialog = ref(false)
const showRenameDialog = ref(false)
const showRenameDriveDialog = ref(false)
const showShareDialog = ref(false)
const showUnlockDialog = ref(false)
const showPreviewDialog = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadFileList = ref<any[]>([])
const uploadRef = ref()
const previewFile = ref<FileItem | null>(null)
// 预览图片的 Blob URL（优先使用下载接口生成，避免依赖 /files/preview 出错）
const previewImageUrl = ref('')
// 图片缩略图缓存：key 为文件 path，value 为 Blob URL
const thumbnailMap = ref<Record<string, string>>({})
const thumbnailLoading = ref<Record<string, boolean>>({})

// 表单数据
const folderForm = ref({ name: '', isLocked: false, password: '' })
const renameForm = ref({ name: '', path: '' })
const renameDriveForm = ref({ id: '', name: '' })
const unlockForm = ref({ folderName: '', path: '', password: '', requiresPassword: false })
const shareLinks = ref<Array<{ id: string; link: string; expiresAt: string; path: string }>>([])

// 计算属性
const pathSegments = computed(() => {
  if (!currentPath.value) return []
  return currentPath.value.split('/').filter(Boolean)
})

// 方法
const loadDrives = async () => {
  try {
    const data = await getDrives()
    driveGroups.value = data
    
    // 新的结构：直接使用 departments 数组
    if (data.departments) {
      drives.value = data.departments
    } else {
      drives.value = []
    }
  } catch (error) {
    ElMessage.error(t('common.error') || '加载失败')
  }
}

const selectDrive = async (drive: DriveInfo) => {
  if (drive.requiresPassword && !drive.hasAccess) {
    currentDrive.value = drive
    passwordInput.value = ''
    return
  }
  currentDrive.value = drive
  currentPath.value = ''
  pathHistory.value = [] // 切换盘时清空历史
  await loadFiles()
}

const handlePasswordVerify = async () => {
  if (!currentDrive.value || !passwordInput.value) return

  try {
    const result = await verifyDrivePassword(currentDrive.value.id, passwordInput.value)
    if (result.success) {
      currentDrive.value.hasAccess = true
      ElMessage.success(t('files.accessGranted'))
      await loadFiles()
    } else {
      ElMessage.error(result.message || t('files.wrongPassword'))
    }
  } catch (error: any) {
    ElMessage.error(error.message || t('files.wrongPassword'))
  }
}

const loadFiles = async () => {
  if (!currentDrive.value || !currentDrive.value.hasAccess) return

  loading.value = true
  try {
    fileList.value = await getFileList(currentDrive.value.id, currentPath.value)
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const navigateToPath = (path: string) => {
  // 保存当前路径到历史记录
  if (currentPath.value) {
    pathHistory.value.push(currentPath.value)
  }
  currentPath.value = path
  loadFiles()
}

const goBack = () => {
  if (pathHistory.value.length > 0) {
    currentPath.value = pathHistory.value.pop() || ''
    loadFiles()
  } else {
    // 如果没有历史记录，返回根目录
    currentPath.value = ''
    loadFiles()
  }
}

const getPathUpToIndex = (index: number): string => {
  const segments = pathSegments.value.slice(0, index + 1)
  return segments.join('/')
}

const refreshFiles = () => {
  loadFiles()
}

// 卡片视图的双击处理
const handleItemDoubleClick = (item: FileItem) => {
  handleRowDoubleClick(item)
}

// 卡片视图的操作处理
const handleGridAction = (command: string, item: FileItem): void => {
  switch (command) {
    case 'preview':
      handlePreview(item)
      break
    case 'open':
      navigateToPath(item.path)
      break
    case 'download':
      handleDownload(item)
      break
    case 'unlock':
      handleUnlockFolder(item)
      break
    case 'rename':
      handleRename(item)
      break
    case 'delete':
      handleDelete(item)
      break
  }
}

const handleRowDoubleClick = (row: FileItem) => {
  if (row.isDirectory) {
    // 如果文件夹被锁定且用户不是所有者，不允许打开
    if (row.isLocked && !row.isOwner) {
      ElMessage.warning(t('files.folderLockedCannotOpen'))
      return
    }
    navigateToPath(row.path)
  } else {
    handleDownload(row)
  }
}

const handleDownload = async (file: FileItem) => {
  if (!currentDrive.value) return

  try {
    const blob = await downloadFile(currentDrive.value.id, file.path)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    ElMessage.success(t('common.success') || '下载成功')
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

const handleCreateFolder = async () => {
  if (!currentDrive.value || !folderForm.value.name) return

  try {
    await createFolder(
      currentDrive.value.id,
      currentPath.value,
      folderForm.value.name,
      folderForm.value.isLocked,
      folderForm.value.password || undefined
    )
    ElMessage.success(t('common.success'))
    showCreateFolderDialog.value = false
    folderForm.value = { name: '', isLocked: false, password: '' }
    await loadFiles()
  } catch (error: any) {
    console.error('创建文件夹错误:', error)
    // 如果是401错误，不显示错误消息（因为会跳转登录页）
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      return
    }
    ElMessage.error(error.message || error.response?.data?.message || t('common.error'))
  }
}

const handleRename = (file: FileItem) => {
  renameForm.value.name = file.name
  renameForm.value.path = file.path
  showRenameDialog.value = true
}

const handleRenameConfirm = async () => {
  if (!currentDrive.value || !renameForm.value.name) return

  try {
    await renameFile(currentDrive.value.id, renameForm.value.path, renameForm.value.name)
    ElMessage.success(t('common.success'))
    showRenameDialog.value = false
    await loadFiles()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

const handleDelete = async (file: FileItem) => {
  if (!currentDrive.value) return

  try {
    await ElMessageBox.confirm(
      t('files.deleteMessage'),
      t('files.confirmDelete'),
      { type: 'warning' }
    )
    
    await deleteFile(currentDrive.value.id, file.path)
    ElMessage.success(t('common.success'))
    await loadFiles()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

const handleFileChange = (_file: any, fileList: any[]) => {
  // Element Plus on-change 会携带当前文件和完整 fileList，这里直接同步内部列表
  uploadFileList.value = fileList
}

const handleUpload = async () => {
  if (!currentDrive.value || uploadFileList.value.length === 0) return

  uploading.value = true
  uploadProgress.value = 0

  try {
    for (const file of uploadFileList.value) {
      await uploadFile(
        currentDrive.value.id,
        currentPath.value,
        file.raw,
        (progress) => {
          uploadProgress.value = progress
        }
      )
    }
    ElMessage.success(t('common.success'))
    showUploadDialog.value = false
    uploadFileList.value = []
    uploadProgress.value = 0
    await loadFiles()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    uploading.value = false
  }
}

const handleGenerateLink = async () => {
  if (!currentDrive.value) return

  try {
    // 如果当前路径为空，使用空字符串表示根目录
    const path = currentPath.value || ''
    await generateShareLink(currentDrive.value.id, path)
    await loadShareLinks()
    ElMessage.success(t('files.linkGenerated') || '共享链接已生成')
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

const loadShareLinks = async () => {
  if (!currentDrive.value) return

  try {
    shareLinks.value = await getShareLinks(currentDrive.value.id, currentPath.value)
  } catch (error: any) {
    console.error('Failed to load share links:', error)
  }
}

const handleDeleteLink = async (linkId: string) => {
  try {
    await deleteShareLink(linkId)
    ElMessage.success(t('common.success'))
    await loadShareLinks()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success(t('files.linkCopied'))
  })
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString(getLocale())
}

// 获取预览URL（本地函数，调用API函数）
const getPreviewUrlLocal = (filePath: string): string => {
  if (!currentDrive.value) return ''
  const url = getPreviewUrl(currentDrive.value.id, filePath)
  console.log('预览URL:', url) // 调试用
  return url
}

// 懒加载缩略图：优先从缓存读取，没有则通过下载接口获取 Blob 并生成 URL
const getThumbnailSrc = (filePath: string): string => {
  if (!currentDrive.value) return ''
  const key = filePath

  if (!thumbnailMap.value[key] && !thumbnailLoading.value[key]) {
    loadThumbnail(key)
  }

  return thumbnailMap.value[key] || ''
}

const loadThumbnail = async (filePath: string) => {
  if (!currentDrive.value) return
  const key = filePath
  thumbnailLoading.value[key] = true
  try {
    const blob = await downloadFile(currentDrive.value.id, filePath)
    thumbnailMap.value[key] = URL.createObjectURL(blob)
  } catch (error) {
    console.error('缩略图加载失败:', filePath, error)
  } finally {
    thumbnailLoading.value[key] = false
  }
}

// 图片加载错误处理
// 预览大图加载失败（通常是 /files/preview 异常）
// 这里只弹提示，不做兜底跳转，避免出现重复下载行为
const handlePreviewError = (e: Event) => {
  console.error('预览加载失败:', e)
  ElMessage.error('预览加载失败')
}

// 图片缩略图加载失败时的简单兜底：直接隐藏该缩略图（不影响预览按钮）
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

// 预览文件
const handlePreview = async (file: FileItem) => {
  previewFile.value = file
  previewImageUrl.value = ''

  if (!currentDrive.value) {
    showPreviewDialog.value = true
    return
  }

  // 图片优先使用下载接口生成 Blob URL，稳定性更好
  if (file.isImage) {
    try {
      const blob = await downloadFile(currentDrive.value.id, file.path)
      previewImageUrl.value = URL.createObjectURL(blob)
    } catch (error: any) {
      console.error('图片预览下载失败:', error)
      ElMessage.error(error.message || t('common.error'))
    }
  }

  showPreviewDialog.value = true
}

// 解锁文件夹
const handleUnlockFolder = (file: FileItem) => {
  unlockForm.value = {
    folderName: file.name,
    path: file.path,
    password: '',
    requiresPassword: false // TODO: 从后端获取是否需要密码
  }
  showUnlockDialog.value = true
}

const handleUnlockConfirm = async () => {
  if (!currentDrive.value) return
  
  try {
    await unlockFolder(currentDrive.value.id, unlockForm.value.path, unlockForm.value.password || undefined)
    ElMessage.success(t('files.folderUnlocked'))
    showUnlockDialog.value = false
    await loadFiles()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

const handleRenameDriveConfirm = async () => {
  try {
    await renameDrive(renameDriveForm.value.id, renameDriveForm.value.name)
    ElMessage.success(t('common.success'))
    showRenameDriveDialog.value = false
    await loadDrives()
    // 如果当前选中的是被重命名的盘，更新显示
    if (currentDrive.value?.id === renameDriveForm.value.id) {
      const updatedDrive = drives.value.find(d => d.id === renameDriveForm.value.id)
      if (updatedDrive) {
        currentDrive.value = updatedDrive
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 生命周期
onMounted(() => {
  // 小屏设备默认使用卡片视图，避免表格在窄屏下挤掉文件名等信息
  if (window.innerWidth <= 768) {
    viewMode.value = 'grid'
  }
  loadDrives()
})

watch(showShareDialog, (val) => {
  if (val) {
    loadShareLinks()
  }
})
</script>

<style scoped lang="scss">
.files-container {
  .card-header {
    font-size: 18px;
    font-weight: bold;
  }

  .files-layout {
    display: flex;
    gap: 20px;
    min-height: 600px;

    .drives-sidebar {
      width: 320px;
      min-width: 280px;
      max-width: 100%;
      flex-shrink: 0;
      border-right: 1px solid #e5e5e7;
      padding-right: 24px;
      box-sizing: border-box;

      h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 500;
        color: #1d1d1f;
        letter-spacing: -0.02em;
      }

      // 部门网格：一行2个
      .departments-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 16px;
        width: 100%;
        box-sizing: border-box;

        .department-card {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 20px 14px;
          border: 1px solid #e5e5e7;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          min-width: 0; // 防止内容溢出
          max-width: 100%;

          &:hover {
            border-color: #d1d1d6;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transform: translateY(-1px);
          }

          &.active {
            border-color: #007aff;
            background: #f5f5f7;
            box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15);
            
            .department-card-icon {
              color: #007aff;
            }
            
            .department-card-name {
              color: #007aff;
            }
          }

          .department-card-icon {
            font-size: 40px;
            margin-bottom: 8px;
            color: #1d1d1f;
            transition: color 0.25s ease;
            flex-shrink: 0;
          }

          .department-card-name {
            font-size: 14px;
            font-weight: 500;
            text-align: center;
            margin-bottom: 12px;
            color: #1d1d1f;
            letter-spacing: -0.01em;
            line-height: 1.3;
            word-break: break-word;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            width: 100%;
            flex-shrink: 0;
          }

          .department-card-quota-section {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;

            .quota-progress {
              width: 100%;
              
              :deep(.el-progress-bar__outer) {
                background-color: #e5e5e7;
                border-radius: 3px;
              }
              
              :deep(.el-progress-bar__inner) {
                border-radius: 3px;
                transition: width 0.6s ease;
              }
            }

            .department-card-quota {
              font-size: 11px;
              color: #86868b;
              text-align: center;
              font-weight: 500;
              letter-spacing: -0.01em;

              &.quota-warning {
                color: #ff3b30;
                font-weight: 600;
              }
            }
          }

          .department-lock-icon {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 16px;
            color: #ff3b30;
            opacity: 0.8;
            transition: opacity 0.25s ease;
          }

          &:hover .department-lock-icon {
            opacity: 1;
          }
        }
      }

      .drives-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 12px 0;

        .drive-card {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          background: #fff;

          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
            transform: translateY(-2px);
          }

          &.active {
            border-color: #409eff;
            background-color: #ecf5ff;
            color: #409eff;
            box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
          }

          .drive-card-icon {
            font-size: 32px;
            margin-bottom: 8px;
          }

          .drive-card-name {
            font-size: 14px;
            font-weight: 500;
            text-align: center;
          }

          .lock-icon {
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 16px;
            color: #f56c6c;
          }
        }
      }

      .departments-list {
        .department-group {
          margin-bottom: 20px;

          .department-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
            color: #606266;
          }
        }
      }
    }

    .file-browser {
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      overflow: hidden;

      .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 400px;
      }

      .password-prompt {
        max-width: 400px;
        margin: 50px auto;
      }

      .file-content {
        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e4e7ed;

          .breadcrumb {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;

            .back-button {
              margin: 0;
              font-size: 18px;
              width: 40px;
              height: 40px;
              background-color: #409eff;
              color: #fff;
              border: none;
              box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
              transition: all 0.3s;

              &:hover {
                background-color: #66b1ff;
                box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
                transform: translateY(-2px);
              }

              &:active {
                transform: translateY(0);
              }
            }
          }

          .toolbar-actions {
            display: flex;
            gap: 8px;
          }
        }

        .file-list {
          .file-name-cell {
            display: flex;
            align-items: center;
            gap: 8px;

            .file-icon {
              font-size: 18px;
              color: #606266;
            }

            .file-name-text {
              flex: 1;
            }

            .lock-icon-after {
              font-size: 16px;
              color: #f56c6c;
              margin-left: 4px;
            }
          }

          // 卡片视图样式
          .file-grid-view {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            padding: 20px 0;

            .file-card {
              display: flex;
              flex-direction: column;
              border: 1px solid #e4e7ed;
              border-radius: 8px;
              overflow: hidden;
              background: #fff;
              transition: all 0.3s;
              cursor: pointer;
              position: relative;

              &:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
                border-color: #409eff;

                .file-card-actions {
                  opacity: 1;
                }
              }

              .file-card-thumbnail {
                width: 100%;
                height: 160px;
                background: #f5f7fa;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;

                .file-card-img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }

                .file-card-icon {
                  .icon-large {
                    font-size: 64px;
                    color: #909399;
                  }
                }

                .file-card-lock {
                  position: absolute;
                  top: 8px;
                  right: 8px;
                  font-size: 20px;
                  color: #f56c6c;
                  background: rgba(255, 255, 255, 0.9);
                  padding: 4px;
                  border-radius: 4px;
                }
              }

              .file-card-info {
                padding: 12px;
                flex: 1;

                .file-card-name {
                  font-size: 14px;
                  font-weight: 500;
                  color: #303133;
                  margin-bottom: 8px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .file-card-meta {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  font-size: 12px;
                  color: #909399;

                  .file-card-time {
                    margin-left: 8px;
                  }
                }
              }

              .file-card-actions {
                position: absolute;
                top: 8px;
                right: 8px;
                opacity: 0;
                transition: opacity 0.3s;
              }
            }
          }
        }
      }
    }
  }

  .upload-progress {
    margin-top: 16px;
  }

  .share-links {
    .el-input {
      width: 100%;
    }
  }

  .thumbnail-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60px;

    .thumbnail-img {
      max-width: 60px;
      max-height: 60px;
      object-fit: cover;
      border-radius: 4px;
    }

    .thumbnail-icon {
      font-size: 32px;
      color: #909399;

      &.folder {
        color: #409eff;
      }
    }
  }

  .file-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .lock-badge {
      color: #f56c6c;
      font-size: 14px;
      margin-left: 4px;
    }
  }

  .operations-cell {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    flex-wrap: wrap;
  }

  .icon-circle-btn {
    width: 40px;
    height: 40px;
    padding: 0;
  }

  .preview-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;

    .preview-image {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
    }

    .preview-video {
      max-width: 100%;
      max-height: 70vh;
    }

    .preview-pdf {
      width: 100%;
      height: 70vh;
      border: none;
    }

    .preview-text {
      width: 100%;
      height: 70vh;

      .preview-text-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    }

    .preview-unsupported {
      color: #909399;
      font-size: 16px;
    }
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  // 文件管理在平板和手机端的适配
  @media (max-width: 1024px) {
    .files-layout {
      flex-direction: column;
      min-height: auto;
    }

    .files-layout .drives-sidebar {
      width: 100%;
      min-width: 0;
      border-right: none;
      border-bottom: 1px solid #e5e5e7;
      padding-right: 0;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }

    .files-layout .file-browser .file-content .toolbar {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .toolbar-actions {
        flex-wrap: wrap;
        justify-content: flex-start;
      }
    }
  }

  @media (max-width: 768px) {
    .files-layout .file-browser .file-content .toolbar .breadcrumb {
      flex-direction: column;
      align-items: flex-start;
    }

    .files-layout .file-browser .file-content .file-list .file-grid-view {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }

    .files-layout .drives-sidebar .departments-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .operations-cell {
      justify-content: flex-start;
      align-items: flex-start;
      flex-direction: column;
    }

    // 手机端：卡片视图下方展示操作按钮
    .file-grid-view {
      .file-card {
        .file-card-actions {
          display: none;
        }

        .file-card-actions-mobile {
          display: flex;
          justify-content: flex-end;
          gap: 4px;
          padding: 0 8px 8px;
          flex-wrap: wrap;

          .el-button {
            padding: 4px 8px;
            font-size: 12px;
          }
        }
      }
    }
  }

  @media (max-width: 480px) {
    .files-layout .file-browser .file-content .toolbar-actions {
      width: 100%;
      justify-content: flex-start;
    }

    .files-layout .file-browser .file-content .toolbar-actions .el-button {
      flex: 1 1 auto;
    }
  }
}
</style>
