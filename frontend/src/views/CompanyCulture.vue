<template>
  <div class="culture-container page-content-enter">
    <!-- 顶部 Hero 区 -->
    <section class="hero-section fade-in-up">
      <div class="hero-left">
        <div class="hero-header">
          <h1>{{ hero.title }}</h1>
          <el-button
            v-if="canManageWorkspace"
            size="small"
            text
            type="primary"
            :icon="Edit"
            @click="showHeroDialog = true"
          >
            {{ $t('common.edit') }}
          </el-button>
        </div>
        <p class="hero-subtitle">
          {{ hero.subtitle }}
        </p>
        <div class="brand-pills">
          <div class="pill">
            <h4>Vision</h4>
            <p>{{ hero.vision }}</p>
          </div>
          <div class="pill">
            <h4>Values</h4>
            <p>{{ hero.values }}</p>
          </div>
          <div class="pill">
            <h4>Slogan</h4>
            <p>{{ hero.slogan }}</p>
          </div>
        </div>
      </div>
      <div class="hero-right">
        <div class="logo-box" :class="{ 'has-image': hero.logoImage }">
          <img
            v-if="hero.logoImage"
            :src="hero.logoImage"
            alt="Logo"
            class="logo-image"
          />
          <span v-else-if="hero.logoText">{{ hero.logoText }}</span>
          <span v-else>⌘</span>
        </div>
      </div>
    </section>

    <!-- 核心团队 -->
    <section class="section-block fade-in-delay-1">
      <div class="section-title-wrap">
        <div class="section-title-left">
          <span>Leadership &amp; Teams</span>
          <h2>{{ $t('workspace.companyCulturePage.coreTeamTitle') }}</h2>
        </div>
        <el-button
          v-if="canManageWorkspace"
          size="small"
          type="primary"
          :icon="Plus"
          @click="openMemberDialog()"
        >
          {{ $t('workspace.companyCulturePage.addMember') }}
        </el-button>
      </div>

      <div class="org-container">
        <div
          v-for="member in members"
          :key="member.id"
          class="staff-card"
        >
          <div class="avatar-wrap">
            <el-avatar
              v-if="member.avatar"
              :src="member.avatar"
              :size="90"
            />
            <div v-else class="avatar-placeholder">
              {{ member.name.slice(0, 1) }}
            </div>
            <div class="dept-tag">{{ member.tag }}</div>
          </div>
          <div class="staff-info">
            <h5>{{ member.name }}</h5>
            <p>{{ member.title }}</p>
          </div>
          <div class="staff-actions" v-if="canManageWorkspace">
            <el-button
              size="small"
              text
              :icon="Edit"
              @click="openMemberDialog(member)"
            >
              {{ $t('common.edit') }}
            </el-button>
            <el-button
              size="small"
              text
              type="danger"
              :icon="Delete"
              @click="handleDeleteMember(member)"
            >
              {{ $t('common.delete') }}
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <!-- 文化相册 -->
    <section class="section-block fade-in-delay-2">
      <div class="section-title-wrap">
        <div class="section-title-left">
          <span>Moments &amp; Gallery</span>
          <h2>{{ $t('workspace.companyCulturePage.albumTitle') }}</h2>
        </div>
        <el-button
          v-if="canManageWorkspace"
          size="small"
          type="primary"
          :icon="Plus"
          @click="openAlbumDialog()"
        >
          {{ $t('workspace.companyCulturePage.addAlbum') }}
        </el-button>
      </div>

      <div class="action-bar">
        <el-input
          v-model="searchKeyword"
          class="search-input"
          :placeholder="$t('workspace.companyCulturePage.searchPlaceholder')"
          clearable
        />
        <div class="filter-tags">
          <el-check-tag
            :checked="!activeCategory"
            @change="() => (activeCategory = '')"
          >
            {{ $t('common.all') }}
          </el-check-tag>
          <el-check-tag
            v-for="cat in categories"
            :key="cat.key"
            :checked="activeCategory === cat.key"
            @change="() => (activeCategory = cat.key)"
          >
            {{ cat.label }}
          </el-check-tag>
        </div>
      </div>

      <div class="bento-grid">
        <div
          v-for="album in filteredAlbums"
          :key="album.id"
          class="bento-item"
          :class="[album.sizeClass, { hidden: album.hidden }]"
          @click="openAlbumPreview(album)"
        >
          <div class="bento-label" :class="{ pinned: album.pinned }">
            {{ album.tag }}
          </div>
          <img :src="album.coverImage" :alt="album.title" />
          <div class="bento-content">
            <h3>{{ album.title }}</h3>
            <span>{{ album.subtitle }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 编辑公司文化（Hero）弹窗 -->
    <el-dialog
      v-model="showHeroDialog"
      :title="$t('workspace.companyCulturePage.editHeroTitle')"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form :model="heroForm" label-width="90px" class="hero-form">
        <el-form-item :label="$t('workspace.companyCulturePage.companyTitle')">
          <el-input v-model="heroForm.title" />
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.companySubtitle')">
          <el-input v-model="heroForm.subtitle" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Vision">
          <el-input v-model="heroForm.vision" />
        </el-form-item>
        <el-form-item label="Values">
          <el-input v-model="heroForm.values" />
        </el-form-item>
        <el-form-item label="Slogan">
          <el-input v-model="heroForm.slogan" />
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.logoText')">
          <el-input v-model="heroForm.logoText" class="logo-input" />
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.logoImage')">
          <div class="upload-row">
            <el-input
              v-model="heroForm.logoImage"
              :placeholder="$t('workspace.companyCulturePage.logoImagePlaceholder')"
            />
            <el-upload
              class="upload-btn"
              :action="cultureUploadAction"
              :headers="uploadHeaders"
              :before-upload="beforeImageUpload"
              :on-success="(res: any) => handleHeroLogoUploadSuccess(res)"
              :show-file-list="false"
              accept="image/*"
            >
              <el-button size="small" type="primary">
                {{ $t('common.upload') }}
              </el-button>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHeroDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveHero">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑成员弹窗 -->
    <el-dialog
      v-model="showMemberDialog"
      :title="currentMember ? $t('workspace.companyCulturePage.editMember') : $t('workspace.companyCulturePage.addMember')"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="memberForm" label-width="90px">
        <el-form-item :label="$t('workspace.companyCulturePage.memberName')">
          <el-input v-model="memberForm.name" />
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.memberTitle')">
          <el-input v-model="memberForm.title" />
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.memberTag')">
          <el-input v-model="memberForm.tag" />
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.memberAvatar')">
          <div class="upload-row">
            <el-input
              v-model="memberForm.avatar"
              :placeholder="$t('workspace.companyCulturePage.memberAvatarPlaceholder')"
            />
            <el-upload
              class="upload-btn"
              :action="cultureUploadAction"
              :headers="uploadHeaders"
              :before-upload="beforeImageUpload"
              :on-success="(res: any) => handleMemberAvatarUploadSuccess(res)"
              :show-file-list="false"
              accept="image/*"
            >
              <el-button size="small" type="primary">
                {{ $t('common.upload') }}
              </el-button>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMemberDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveMember">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑相册弹窗（先做基础字段，后续再接文件上传） -->
    <el-dialog
      v-model="showAlbumDialog"
      :title="currentAlbum ? $t('workspace.companyCulturePage.editAlbum') : $t('workspace.companyCulturePage.addAlbum')"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form :model="albumForm" label-width="90px">
        <el-form-item :label="$t('workspace.companyCulturePage.albumTitleLabel')">
          <el-input v-model="albumForm.title" />
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.albumSubtitleLabel')">
          <el-input v-model="albumForm.subtitle" />
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.albumCategory')">
          <el-select v-model="albumForm.category" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.key"
              :label="cat.label"
              :value="cat.key"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.albumTag')">
          <el-input v-model="albumForm.tag" />
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.albumLayout')">
          <el-radio-group v-model="albumForm.layout">
            <el-radio-button label="standard">{{ $t('workspace.companyCulturePage.layoutStandard') }}</el-radio-button>
            <el-radio-button label="large">{{ $t('workspace.companyCulturePage.layoutLarge') }}</el-radio-button>
            <el-radio-button label="wide">{{ $t('workspace.companyCulturePage.layoutWide') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.albumCover')">
          <div class="upload-row">
            <el-input v-model="albumForm.coverImage" />
            <el-upload
              class="upload-btn"
              :action="cultureUploadAction"
              :headers="uploadHeaders"
              :before-upload="beforeImageUpload"
              :on-success="(res: any) => handleAlbumCoverUploadSuccess(res)"
              :show-file-list="false"
              accept="image/*"
            >
              <el-button size="small" type="primary">
                {{ $t('common.upload') }}
              </el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.albumPhotos')">
          <el-upload
            drag
            multiple
            :action="cultureUploadAction"
            :headers="uploadHeaders"
            :before-upload="beforeImageUpload"
            :on-success="handleAlbumPhotoUploadSuccess"
            :show-file-list="false"
            accept="image/*"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              {{ $t('workspace.companyCulturePage.albumPhotosUploadText') }}
            </div>
          </el-upload>
          <div v-if="albumForm.photos.length" class="album-thumbs">
            <div
              v-for="(photo, index) in albumForm.photos"
              :key="index"
              class="album-thumb"
            >
              <img :src="photo.url" :alt="photo.caption || albumForm.title" />
              <button
                type="button"
                class="thumb-remove"
                @click.stop="removeAlbumPhoto(index)"
              >
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </div>
        </el-form-item>
        <el-form-item :label="$t('workspace.companyCulturePage.albumPinned')">
          <el-switch v-model="albumForm.pinned" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAlbumDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveAlbum">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 相册预览模态 + 轮播 -->
    <el-dialog
      v-model="showPreviewDialog"
      width="900px"
      top="5vh"
    >
      <template #header>
        <div class="preview-header" v-if="previewAlbum">
          <div class="preview-header-left">
            <h3 class="preview-title">{{ previewAlbum.title }}</h3>
            <p class="preview-subtitle">{{ previewAlbum.subtitle }}</p>
          </div>
          <div class="preview-actions" v-if="previewAlbum && canManageWorkspace">
            <el-button
              size="small"
              text
              @click="editCurrentAlbum"
            >
              {{ $t('workspace.companyCulturePage.actionEdit') }}
            </el-button>
            <el-button
              size="small"
              text
              @click="editCurrentAlbum"
            >
              {{ $t('workspace.companyCulturePage.actionAddPhotos') }}
            </el-button>
            <el-divider direction="vertical" />
            <el-button
              size="small"
              text
              type="primary"
              @click="togglePinCurrentAlbum"
            >
              {{ previewAlbum.pinned ? $t('workspace.companyCulturePage.actionUnpin') : $t('workspace.companyCulturePage.actionPin') }}
            </el-button>
            <el-button
              size="small"
              text
              @click="toggleHiddenCurrentAlbum"
            >
              {{ previewAlbum.hidden ? $t('workspace.companyCulturePage.actionShow') : $t('workspace.companyCulturePage.actionHide') }}
            </el-button>
            <el-button
              size="small"
              text
              type="danger"
              @click="deleteCurrentAlbum"
            >
              {{ $t('workspace.companyCulturePage.actionDelete') }}
            </el-button>
          </div>
        </div>
      </template>

      <el-carousel
        v-if="previewAlbum"
        height="480px"
        indicator-position="outside"
      >
        <el-carousel-item
          v-for="(photo, index) in previewAlbum.photos"
          :key="index"
        >
          <div class="preview-photo-wrap">
            <img
              :src="photo.url"
              :alt="photo.caption || previewAlbum?.title"
              title="双击查看原图（在新标签页打开）"
              @dblclick="openPhotoOriginal(photo)"
            />
            <div v-if="photo.caption" class="preview-caption">
              {{ photo.caption }}
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadProps } from 'element-plus'
import {
  Edit,
  Plus,
  Delete,
  UploadFilled,
  Close
} from '@element-plus/icons-vue'
import { getApiBaseURL } from '../api/config'
import { useUserStore } from '../store/user'

const { t } = useI18n()
const userStore = useUserStore()

// 是否具备“工作空间内容管理”权限：用于控制公司文化编辑按钮的显示
const canManageWorkspace = computed(() => {
  const role = userStore.userInfo?.role
  if (role === 'super_admin') return true
  // 使用后端的权限点 workspace.companyFiles.manage 作为“工作空间内容管理”的统一开关
  return userStore.hasPermission?.('workspace.companyFiles.manage') ?? false
})

// 如果是已登录状态但还没拉取权限点，这里懒加载一次（避免首屏空白时多请求）
onMounted(() => {
  if (userStore.isLoggedIn && !userStore.permissions.length) {
    userStore.loadPermissions()
  }
})

interface HeroInfo {
  title: string
  subtitle: string
  vision: string
  values: string
  slogan: string
  logoText: string
  logoImage?: string
}

interface Member {
  id: number
  name: string
  title: string
  tag: string
  avatar: string
}

type AlbumCategoryKey = 'annual' | 'tea' | 'team' | 'festival' | 'daily' | 'event'

interface AlbumPhoto {
  url: string
  caption?: string
}

interface Album {
  id: number
  title: string
  subtitle: string
  category: AlbumCategoryKey
  tag: string
  sizeClass?: 'item-lg' | 'item-tall' | 'item-wide' | ''
  pinned?: boolean
  hidden?: boolean
  layout?: 'standard' | 'large' | 'wide'
  coverImage: string
  photos: AlbumPhoto[]
}

// 顶部公司文化信息（先本地状态，后续可接后端）
const hero = ref<HeroInfo>({
  title: 'Our Culture',
  subtitle: '我们用更聪明的工具，帮助团队连接全球贸易。',
  vision: '连接全球贸易',
  values: '卓越、诚实、创新',
  slogan: 'Simple but powerful.',
  logoText: 'EB',
  logoImage: ''
})

const showHeroDialog = ref(false)
const heroForm = ref<HeroInfo>({ ...hero.value })

const saveHero = () => {
  hero.value = { ...heroForm.value }
  showHeroDialog.value = false
  ElMessage.success(t('common.saveSuccess'))
}

// 图片上传配置（公司文化 logo / 头像 / 相册共用）
const apiBaseURL = getApiBaseURL()
const apiBaseOrigin = apiBaseURL.replace(/\/api$/, '').replace(/\/$/, '')
const cultureUploadAction = `${apiBaseURL.replace(/\/$/, '')}/motivations/culture-images/upload`
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token') || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
})

const beforeImageUpload: UploadProps['beforeUpload'] = (file) => {
  const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isValidType) {
    ElMessage.error(t('common.imageTypeLimit') || '只能上传 JPG/PNG/GIF/WEBP 图片')
    return false
  }
  if (!isLt10M) {
    ElMessage.error(t('common.imageSizeLimit') || '图片大小不能超过 10MB')
    return false
  }
  return true
}

// 核心团队成员（示例数据）
const members = ref<Member[]>([
  {
    id: 1,
    name: 'David Zhang',
    title: '创始人 / 首席执行官',
    tag: 'CEO',
    avatar: 'https://i.pravatar.cc/150?u=a1'
  },
  {
    id: 2,
    name: 'Marcus He',
    title: '首席技术官',
    tag: 'TECH',
    avatar: 'https://i.pravatar.cc/150?u=a2'
  },
  {
    id: 3,
    name: 'Elena Sun',
    title: '首席运营官',
    tag: 'OPS',
    avatar: 'https://i.pravatar.cc/150?u=a3'
  }
])

const showMemberDialog = ref(false)
const currentMember = ref<Member | null>(null)
const memberForm = ref<Member>({
  id: 0,
  name: '',
  title: '',
  tag: '',
  avatar: ''
})

const openMemberDialog = (member?: Member) => {
  if (member) {
    currentMember.value = member
    memberForm.value = { ...member }
  } else {
    currentMember.value = null
    memberForm.value = {
      id: 0,
      name: '',
      title: '',
      tag: '',
      avatar: ''
    }
  }
  showMemberDialog.value = true
}

const saveMember = () => {
  if (!memberForm.value.name.trim()) {
    ElMessage.warning(t('workspace.companyCulturePage.memberNameRequired'))
    return
  }
  if (currentMember.value) {
    const idx = members.value.findIndex(m => m.id === currentMember.value?.id)
    if (idx !== -1) {
      members.value[idx] = { ...memberForm.value }
    }
  } else {
    const newId = Date.now()
    members.value.push({ ...memberForm.value, id: newId })
  }
  showMemberDialog.value = false
  ElMessage.success(t('common.saveSuccess'))
}

const handleDeleteMember = async (member: Member) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.companyCulturePage.deleteMemberConfirm', { name: member.name }),
      t('common.warning'),
      { type: 'warning' }
    )
    members.value = members.value.filter(m => m.id !== member.id)
    ElMessage.success(t('common.deleteSuccess'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || t('common.error'))
    }
  }
}

// 相册分类
const categories = [
  { key: 'annual' as AlbumCategoryKey, label: '年会' },
  { key: 'tea' as AlbumCategoryKey, label: '下午茶' },
  { key: 'team' as AlbumCategoryKey, label: '团建' },
  { key: 'festival' as AlbumCategoryKey, label: '节日活动' },
  { key: 'daily' as AlbumCategoryKey, label: '日常' },
  { key: 'event' as AlbumCategoryKey, label: '活动' }
]

// 示例相册
// 相册列表（初始为空，由用户创建）
const albums = ref<Album[]>([])

const searchKeyword = ref('')
const activeCategory = ref<AlbumCategoryKey | ''>('')

const filteredAlbums = computed(() => {
  let list = [...albums.value]

  // 置顶的排在前面
  list.sort((a, b) => {
    const pinDiff = Number(!!b.pinned) - Number(!!a.pinned)
    if (pinDiff !== 0) return pinDiff
    return (b.id || 0) - (a.id || 0)
  })

  if (activeCategory.value) {
    list = list.filter(a => a.category === activeCategory.value)
  }
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(
      a =>
        a.title.toLowerCase().includes(kw) ||
        a.subtitle.toLowerCase().includes(kw) ||
        a.tag.toLowerCase().includes(kw)
    )
  }
  return list
})

// 编辑相册
const showAlbumDialog = ref(false)
const currentAlbum = ref<Album | null>(null)

const albumForm = ref<Album>({
  id: 0,
  title: '',
  subtitle: '',
  category: 'event',
  tag: '',
  pinned: false,
  hidden: false,
  layout: 'standard',
  sizeClass: '',
  coverImage: '',
  photos: []
})

const openAlbumDialog = (album?: Album) => {
  if (album) {
    currentAlbum.value = album
    albumForm.value = {
      ...album,
      layout: album.layout || (album.sizeClass === 'item-lg' ? 'large' : album.sizeClass === 'item-wide' ? 'wide' : 'standard')
    }
  } else {
    currentAlbum.value = null
    albumForm.value = {
      id: 0,
      title: '',
      subtitle: '',
      category: 'event',
      tag: '',
      pinned: false,
      sizeClass: '',
      coverImage: '',
      photos: []
    }
  }
  showAlbumDialog.value = true
}

const saveAlbum = () => {
  if (!albumForm.value.title.trim()) {
    ElMessage.warning(t('workspace.companyCulturePage.albumTitleRequired'))
    return
  }
  if (currentAlbum.value) {
    const idx = albums.value.findIndex(a => a.id === currentAlbum.value?.id)
    if (idx !== -1) {
      albums.value[idx] = normalizeAlbumBeforeSave({ ...albumForm.value })
    }
  } else {
    const newId = Date.now()
    albums.value.push(normalizeAlbumBeforeSave({ ...albumForm.value, id: newId }))
  }
  showAlbumDialog.value = false
  ElMessage.success(t('common.saveSuccess'))
}

// 根据布局选项规范 sizeClass 等字段
const normalizeAlbumBeforeSave = (album: Album): Album => {
  let sizeClass: Album['sizeClass'] = ''
  if (album.layout === 'large') sizeClass = 'item-lg'
  else if (album.layout === 'wide') sizeClass = 'item-wide'
  else sizeClass = ''
  return { ...album, sizeClass }
}

// 预览相册
const showPreviewDialog = ref(false)
const previewAlbum = ref<Album | null>(null)

const openAlbumPreview = (album: Album) => {
  previewAlbum.value = album
  showPreviewDialog.value = true
}

// 预览里的一组操作
const editCurrentAlbum = () => {
  if (!previewAlbum.value) return
  openAlbumDialog(previewAlbum.value)
}

const deleteCurrentAlbum = async () => {
  if (!previewAlbum.value) return
  try {
    await ElMessageBox.confirm(
      t('workspace.companyCulturePage.deleteAlbumConfirm', { title: previewAlbum.value.title }),
      t('common.warning'),
      { type: 'warning' }
    )
    albums.value = albums.value.filter(a => a.id !== previewAlbum.value?.id)
    showPreviewDialog.value = false
    ElMessage.success(t('common.deleteSuccess'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || t('common.error'))
    }
  }
}

const togglePinCurrentAlbum = () => {
  if (!previewAlbum.value) return
  previewAlbum.value.pinned = !previewAlbum.value.pinned
}

const toggleHiddenCurrentAlbum = () => {
  if (!previewAlbum.value) return
  previewAlbum.value.hidden = !previewAlbum.value.hidden
}

// 双击查看原图：在新标签页打开当前图片
const openPhotoOriginal = (photo: AlbumPhoto) => {
  if (!photo.url) return
  window.open(photo.url, '_blank')
}

// 上传回调：logo / 头像 / 相册
const extractImageUrl = (response: any): string | null => {
  let url = response?.url || response?.data?.url
  if (!url) return null
  // 如果是后端返回的相对路径（/api/...），补全为完整地址
  if (typeof url === 'string' && url.startsWith('/api/')) {
    url = `${apiBaseOrigin}${url}`
  }
  return url
}

const handleHeroLogoUploadSuccess = (response: any) => {
  const url = extractImageUrl(response)
  if (url) {
    heroForm.value.logoImage = url
    ElMessage.success(t('common.uploadSuccess'))
  } else {
    ElMessage.warning(t('common.uploadSuccessButNoUrl') || '上传成功，但未获取到图片地址')
  }
}

const handleMemberAvatarUploadSuccess = (response: any) => {
  const url = extractImageUrl(response)
  if (url) {
    memberForm.value.avatar = url
    ElMessage.success(t('common.uploadSuccess'))
  } else {
    ElMessage.warning(t('common.uploadSuccessButNoUrl') || '上传成功，但未获取到图片地址')
  }
}

const handleAlbumCoverUploadSuccess = (response: any) => {
  const url = extractImageUrl(response)
  if (url) {
    albumForm.value.coverImage = url
    ElMessage.success(t('common.uploadSuccess'))
  } else {
    ElMessage.warning(t('common.uploadSuccessButNoUrl') || '上传成功，但未获取到图片地址')
  }
}

const handleAlbumPhotoUploadSuccess = (response: any) => {
  const url = extractImageUrl(response)
  if (url) {
    albumForm.value.photos.push({ url })
    ElMessage.success(t('common.uploadSuccess'))
  } else {
    ElMessage.warning(t('common.uploadSuccessButNoUrl') || '上传成功，但未获取到图片地址')
  }
}

const removeAlbumPhoto = (index: number) => {
  albumForm.value.photos.splice(index, 1)
}
</script>

<style scoped lang="scss">
.culture-container {
  padding: 24px 24px 40px;
  min-height: 100vh;
}

.hero-section {
  padding: 32px 0 36px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 32px;

  .hero-left {
    max-width: 720px;

    .hero-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    h1 {
      font-size: 40px;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin: 0;
      color: #1d1d1f;
    }

    .hero-subtitle {
      font-size: 15px;
      color: #6b7280;
      margin-top: 8px;
    }

    .brand-pills {
      display: flex;
      gap: 32px;
      margin-top: 24px;

      .pill {
        h4 {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #9ca3af;
          margin-bottom: 6px;
        }

        p {
          font-size: 15px;
          font-weight: 500;
          margin: 0;
        }
      }
    }
  }

  .hero-right {
    flex-shrink: 0;

    .logo-box {
      width: 300px;
      height: 160px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 56px;
      color: rgba(0, 0, 0, 0.12);
      overflow: hidden;

      .logo-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      &.has-image {
        border: none;
        background: transparent;
        color: inherit;
      }
    }
  }
}

.section-block {
  margin-bottom: 40px;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 32px 0 16px;

  span {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    color: #9ca3af;
    letter-spacing: 0.16em;
  }

  h2 {
    font-size: 24px;
    margin: 8px 0 0;
  }
}

.org-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
  padding: 8px 0 12px;
}

.staff-card {
  background: #fbfbfd;
  border-radius: 20px;
  padding: 24px 18px 18px;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.2, 1, 0.3, 1);
  border: 1px solid transparent;

  &:hover {
    background: #ffffff;
    border-color: rgba(0, 0, 0, 0.06);
    transform: translateY(-6px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  }

  .avatar-wrap {
    position: relative;
    width: 90px;
    height: 90px;
    margin: 0 auto 12px;

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: #6b7280;
    }

    .dept-tag {
      position: absolute;
      bottom: -4px;
      right: -4px;
      background: #000000;
      color: #ffffff;
      font-size: 10px;
      padding: 4px 8px;
      border-radius: 999px;
      font-weight: 600;
    }
  }

  .staff-info {
    h5 {
      font-size: 16px;
      margin: 6px 0 4px;
      font-weight: 600;
    }

    p {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
  }

  .staff-actions {
    margin-top: 8px;
    display: flex;
    justify-content: center;
    gap: 6px;
  }
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0 20px;
  flex-wrap: wrap;
  gap: 12px;

  .search-input {
    width: 300px;

    :deep(.el-input__wrapper) {
      background: #f3f4f6;
      box-shadow: none;
      border-radius: 999px;
    }
  }

  .filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 220px;
  gap: 20px;

  .bento-item {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    background: #f5f5f7;
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.8s cubic-bezier(0.2, 1, 0.3, 1);
    }

    &:hover img {
      transform: scale(1.06);
    }

    .bento-content {
      position: absolute;
      inset: 0;
      padding: 24px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, transparent 60%);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      color: #ffffff;
      opacity: 0;
      transition: opacity 0.35s;
    }

    &:hover .bento-content {
      opacity: 1;
    }

    .bento-label {
      position: absolute;
      top: 16px;
      left: 16px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(10px);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      color: #000000;

      &.pinned {
        background: #000000;
        color: #ffffff;
      }
    }

    &.hidden {
      opacity: 0.35;
      filter: grayscale(1);
    }
  }

  .item-lg {
    grid-column: span 2;
    grid-row: span 2;
  }

  .item-tall {
    grid-row: span 2;
  }

  .item-wide {
    grid-column: span 2;
  }
}

.preview-subtitle {
  margin-bottom: 12px;
  color: #6b7280;
}

.preview-photo-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;

  img {
    max-width: 100%;
    max-height: 420px;
    border-radius: 16px;
    object-fit: contain;
  }

  .preview-caption {
    font-size: 13px;
    color: #4b5563;
  }
}

.hero-form {
  .upload-row {
    display: flex;
    align-items: center;
    gap: 8px;

    .upload-btn {
      flex-shrink: 0;
    }
  }
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 8px;

  .upload-btn {
    flex-shrink: 0;
  }
}

.album-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;

  .album-thumb {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.06);
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-remove {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      border: none;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s ease;

      .el-icon {
        font-size: 12px;
        color: #ffffff;
      }
    }

    &:hover .thumb-remove {
      opacity: 1;
    }
  }
}

@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .hero-section {
    flex-direction: column;
    gap: 16px;

    .hero-right {
      align-self: flex-start;
    }
  }

  .bento-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>

