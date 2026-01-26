<template>
  <div class="profile-container">
    <el-card>
      <template #header>
        <h2>{{ $t('profile.title') }}</h2>
      </template>

      <el-row :gutter="40">
        <!-- 左侧：头像和基本信息 -->
        <el-col :span="8">
          <div class="avatar-section">
            <el-upload
              class="avatar-uploader"
              :http-request="handleAvatarUpload"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
            >
              <el-avatar
                v-if="profile.avatar"
                :src="getAvatarUrl(profile.avatar)"
                :size="150"
                class="avatar"
              />
              <el-icon v-else class="avatar-icon"><Plus /></el-icon>
              <template #tip>
                <div class="el-upload__tip">
                  {{ $t('profile.avatarTip') }}
                </div>
              </template>
            </el-upload>
            <div class="user-info">
              <h3>{{ profile.nickname || profile.username }}</h3>
              <p class="username">{{ profile.username }}</p>
              <el-tag v-if="profile.role" size="small">{{ getRoleName(profile.role) }}</el-tag>
            </div>
          </div>
        </el-col>

        <!-- 右侧：工作状态和心情设置 -->
        <el-col :span="16">
          <el-form :model="formData" label-width="120px">
            <el-form-item :label="$t('profile.workStatusLabel')">
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <el-select 
                  v-model="selectedWorkStatus" 
                  style="flex: 1" 
                  @change="handleWorkStatusChange"
                >
                  <template #prefix>
                    <el-icon :style="{ color: getStatusColor(selectedWorkStatus) }" style="font-size: 18px;">
                      <component :is="getStatusIcon(selectedWorkStatus)" />
                    </el-icon>
                  </template>
                  <el-option
                    v-for="status in workStatuses"
                    :key="status.value"
                    :label="status.label"
                    :value="status.value"
                  >
                    <div style="display: flex; align-items: center;">
                      <el-icon :style="{ color: status.color, marginRight: '8px' }" style="font-size: 18px;">
                        <component :is="status.icon" />
                      </el-icon>
                      <span>{{ status.label }}</span>
                    </div>
                  </el-option>
                </el-select>
                <el-select
                  v-if="selectedWorkStatus === 'away' || selectedWorkStatus === 'overseas'"
                  v-model="awayDestination"
                  :placeholder="$t('profile.awayDestinationPlaceholder')"
                  style="width: 220px"
                >
                  <el-option
                    v-for="opt in destinationOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </div>
            </el-form-item>

            <el-form-item :label="$t('profile.chineseName')">
              <el-input
                v-model="formData.chineseName"
                :placeholder="$t('profile.chineseNamePlaceholder')"
              />
            </el-form-item>

            <el-form-item :label="$t('profile.englishName')">
              <el-input
                v-model="formData.englishName"
                :placeholder="$t('profile.englishNamePlaceholder')"
              />
            </el-form-item>

            <el-form-item :label="$t('profile.country')">
              <el-input
                v-model="formData.country"
                :placeholder="$t('profile.countryPlaceholder')"
              />
            </el-form-item>

            <el-form-item :label="$t('profile.city')">
              <el-input
                v-model="formData.city"
                :placeholder="$t('profile.cityPlaceholder')"
              />
            </el-form-item>

            <el-form-item :label="$t('profile.mood')">
              <el-input
                v-model="formData.mood"
                type="textarea"
                :rows="3"
                :placeholder="$t('profile.moodPlaceholder')"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSave" :loading="saving">
                {{ $t('common.save') }}
              </el-button>
            </el-form-item>

            <!-- 修改后台登录密码 -->
            <el-divider>{{ $t('profile.changePassword') }}</el-divider>
            <div style="position: relative; min-height: 200px;">
              <div v-if="!showPasswordForm" style="text-align: right;">
                <el-button type="primary" @click="showPasswordForm = true">
                  {{ $t('profile.changePassword') }}
                </el-button>
              </div>
              <el-form 
                v-else
                :model="passwordForm" 
                :rules="passwordRules" 
                ref="passwordFormRef" 
                label-width="120px"
              >
                <el-form-item :label="$t('profile.oldPassword')" prop="oldPassword">
                  <el-input
                    v-model="passwordForm.oldPassword"
                    type="password"
                    :placeholder="$t('profile.oldPasswordPlaceholder')"
                    show-password
                  />
                </el-form-item>
                <el-form-item :label="$t('profile.newPassword')" prop="newPassword">
                  <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    :placeholder="$t('profile.newPasswordPlaceholder')"
                    show-password
                  />
                </el-form-item>
                <el-form-item :label="$t('profile.confirmPassword')" prop="confirmPassword">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    :placeholder="$t('profile.confirmPasswordPlaceholder')"
                    show-password
                  />
                </el-form-item>
                <el-form-item>
                  <div style="text-align: right;">
                    <el-button @click="handleCancelPasswordChange" style="margin-right: 12px;">
                      {{ $t('common.cancel') }}
                    </el-button>
                    <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">
                      {{ $t('profile.changePassword') }}
                    </el-button>
                  </div>
                </el-form-item>
              </el-form>
            </div>

            <!-- 公司分配账号（只读） -->
            <el-divider>{{ $t('profile.companyAccountsTitle') }}</el-divider>

            <!-- VPN 账号 + 密码（同一行，只读） -->
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="$t('profile.companyAccounts.vpn')">
                  <el-input
                    :model-value="profile.vpnAccount || $t('profile.companyAccounts.none')"
                    readonly
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('profile.companyAccounts.passwordLabel')">
                  <el-input
                    :model-value="profile.vpnPassword || $t('profile.companyAccounts.none')"
                    readonly
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- Facebook 账号 + 密码（同一行，只读） -->
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="$t('profile.companyAccounts.facebook')">
                  <el-input
                    :model-value="profile.facebookAccount || $t('profile.companyAccounts.none')"
                    readonly
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('profile.companyAccounts.passwordLabel')">
                  <el-input
                    :model-value="profile.facebookPassword || $t('profile.companyAccounts.none')"
                    readonly
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- LinkedIn 账号 + 密码（同一行，只读） -->
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="$t('profile.companyAccounts.linkedin')">
                  <el-input
                    :model-value="profile.linkedinAccount || $t('profile.companyAccounts.none')"
                    readonly
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('profile.companyAccounts.passwordLabel')">
                  <el-input
                    :model-value="profile.linkedinPassword || $t('profile.companyAccounts.none')"
                    readonly
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- WhatsApp 账号 + 密码（同一行，只读） -->
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="$t('profile.companyAccounts.whatsapp')">
                  <el-input
                    :model-value="profile.whatsappAccount || $t('profile.companyAccounts.none')"
                    readonly
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('profile.companyAccounts.passwordLabel')">
                  <el-input
                    :model-value="profile.whatsappPassword || $t('profile.companyAccounts.none')"
                    readonly
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- Instagram 账号 + 密码（同一行，只读） -->
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="$t('profile.companyAccounts.instagram')">
                  <el-input
                    :model-value="profile.instagramAccount || $t('profile.companyAccounts.none')"
                    readonly
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('profile.companyAccounts.passwordLabel')">
                  <el-input
                    :model-value="profile.instagramPassword || $t('profile.companyAccounts.none')"
                    readonly
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Location, CircleCheck, CircleClose, VideoCamera, Promotion, Sunny, SwitchButton } from '@element-plus/icons-vue'
import { getProfile, updateProfile, uploadAvatar, getAvatarUrl, changePassword, type UserProfile } from '../api/users'

const { t } = useI18n()

const profile = ref<UserProfile>({
  id: 0,
  username: '',
  nickname: '',
  role: '',
})
const formData = ref({
  workStatus: 'available' as string,
  mood: '',
  chineseName: '',
  englishName: '',
  country: '',
  city: '',
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: t('profile.oldPasswordRequired'), trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: t('profile.newPasswordRequired'), trigger: 'blur' },
    { min: 6, message: t('profile.passwordMinLength'), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: t('profile.confirmPasswordRequired'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error(t('profile.passwordMismatch')))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

const saving = ref(false)
const changingPassword = ref(false)
const passwordFormRef = ref<FormInstance>()
const showPasswordForm = ref(false)

// 工作状态选择（基础状态，不含目的地）
const selectedWorkStatus = ref<string>('available')
// 出差/驻外目的地（使用国家+城市编码）
const awayDestination = ref<string>('')

// 解析工作状态（从 'away' 或 'away:目的地' 格式中提取）
const parseWorkStatus = (status: string | undefined): { baseStatus: string; destination: string } => {
  if (!status) return { baseStatus: 'available', destination: '' }
  
  if (status.startsWith('away')) {
    const parts = status.split(':')
    return {
      baseStatus: 'away',
      destination: (parts.length > 1 && parts[1]) ? parts[1].trim() : ''
    }
  }

  if (status.startsWith('overseas')) {
    const parts = status.split(':')
    return {
      baseStatus: 'overseas',
      destination: (parts.length > 1 && parts[1]) ? parts[1].trim() : ''
    }
  }
  
  return { baseStatus: status, destination: '' }
}

// 组合工作状态（将基础状态和目的地组合）
const combineWorkStatus = (baseStatus: string, destination: string): string => {
  const dest = destination.trim()
  if ((baseStatus === 'away' || baseStatus === 'overseas') && dest) {
    return `${baseStatus}:${dest}`
  }
  return baseStatus
}

// 自定义上传方法
const handleAvatarUpload = async (options: any) => {
  const { file } = options
  try {
    const result = await uploadAvatar(file)
    if (result.avatarUrl) {
      profile.value.avatar = result.avatarUrl
      ElMessage.success(t('profile.avatarSuccess'))
      // 重新加载用户信息
      await loadProfile()
    }
  } catch (error: any) {
    ElMessage.error(error.message || t('profile.avatarError.upload'))
  }
}

const workStatuses = [
  { label: t('profile.workStatusOptions.available'), value: 'available', icon: CircleCheck, color: '#67c23a' },
  { label: t('profile.workStatusOptions.busy'), value: 'busy', icon: CircleClose, color: '#f56c6c' },
  { label: t('profile.workStatusOptions.away'), value: 'away', icon: Promotion, color: '#409eff' },
  { label: t('profile.workStatusOptions.overseas'), value: 'overseas', icon: Location, color: '#409eff' },
  { label: t('profile.workStatusOptions.leave'), value: 'leave', icon: Sunny, color: '#e6a23c' },
  { label: t('profile.workStatusOptions.meeting'), value: 'meeting', icon: VideoCamera, color: '#909399' },
  { label: t('profile.workStatusOptions.offline'), value: 'offline', icon: SwitchButton, color: '#606266' },
] as const

// 获取状态图标
const getStatusIcon = (status: string) => {
  const statusItem = workStatuses.find(s => s.value === status)
  return statusItem ? statusItem.icon : CircleCheck
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  const statusItem = workStatuses.find(s => s.value === status)
  return statusItem ? statusItem.color : '#67c23a'
}

// 固定的出差/驻外目的地选项（主要国家和地区，代码 + 中英双语写死）
const destinationOptions = [
  // 亚洲
  { value: 'china', label: '中国 / China' },
  { value: 'japan', label: '日本 / Japan' },
  { value: 'korea', label: '韩国 / Korea' },
  { value: 'india', label: '印度 / India' },
  { value: 'bangladesh', label: '孟加拉国 / Bangladesh' },
  // 中东细分
  { value: 'turkey', label: '土耳其 / Turkey' },
  { value: 'saudi-arabia', label: '沙特阿拉伯 / Saudi Arabia' },
  { value: 'uae', label: '阿联酋 / United Arab Emirates' },
  { value: 'iran', label: '伊朗 / Iran' },
  // 东南亚细分
  { value: 'indonesia', label: '印尼 / Indonesia' },
  { value: 'philippines', label: '菲律宾 / Philippines' },
  { value: 'malaysia', label: '马来西亚 / Malaysia' },
  { value: 'vietnam', label: '越南 / Vietnam' },
  { value: 'thailand', label: '泰国 / Thailand' },
  // 欧洲 & 美洲 & 其他
  { value: 'usa', label: '美国 / United States' },
  { value: 'uk', label: '英国 / United Kingdom' },
  { value: 'germany', label: '德国 / Germany' },
  { value: 'france', label: '法国 / France' },
  { value: 'spain', label: '西班牙 / Spain' },
  { value: 'italy', label: '意大利 / Italy' },
  { value: 'russia', label: '俄罗斯 / Russia' },
  { value: 'australia', label: '澳大利亚 / Australia' },
  { value: 'canada', label: '加拿大 / Canada' },
] as const

const getRoleName = (role: string): string => {
  const roleMap: Record<string, string> = {
    super_admin: t('profile.roles.superAdmin'),
    department_head: t('profile.roles.departmentHead'),
    employee: t('profile.roles.employee'),
    hr_director: t('profile.roles.hrDirector'),
    hr_reception: t('profile.roles.hrReception'),
    finance: t('profile.roles.finance'),
    guest: t('profile.roles.guest'),
    hr: t('profile.roles.hr'), // 兼容旧数据
  }
  return roleMap[role] || role
}

const loadProfile = async () => {
  try {
    const data = await getProfile()
    profile.value = data
    
    // 解析工作状态
    const { baseStatus, destination } = parseWorkStatus(data.workStatus)
    selectedWorkStatus.value = baseStatus
    awayDestination.value = destination
    
    formData.value = {
      workStatus: data.workStatus || 'available',
      mood: data.mood || '',
      chineseName: data.chineseName || '',
      englishName: data.englishName || '',
      country: data.country || '',
      city: data.city || '',
    }
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 处理工作状态变化（只更新本地表单，不立即提交后端）
const handleWorkStatusChange = () => {
  // 如果切换到非出差/驻外状态，清空目的地
  if (selectedWorkStatus.value !== 'away' && selectedWorkStatus.value !== 'overseas') {
    awayDestination.value = ''
  }
  // 同步本地表单中的 workStatus 字段，真正提交由“保存”按钮统一触发
  formData.value.workStatus = combineWorkStatus(selectedWorkStatus.value, awayDestination.value)
}

const handleSave = async () => {
  saving.value = true
  try {
    // 组合工作状态（如果出差且有目的地）
    const workStatusToSave = combineWorkStatus(selectedWorkStatus.value, awayDestination.value)
    const updateData = {
      workStatus: workStatusToSave,
      mood: formData.value.mood,
      chineseName: formData.value.chineseName,
      englishName: formData.value.englishName,
      country: formData.value.country,
      city: formData.value.city,
    }
    
    const updated = await updateProfile(updateData)
    profile.value = { ...profile.value, ...updated }
    
    // 更新本地状态
    formData.value.workStatus = workStatusToSave
    
    // 触发全局事件，通知其他页面（如首页、工作群组）更新用户信息
    window.dispatchEvent(new CustomEvent('profile-updated', { 
      detail: updated 
    }))
    
    ElMessage.success(t('common.updateSuccess'))
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

const beforeAvatarUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error(t('profile.avatarError.format'))
    return false
  }
  if (!isLt5M) {
    ElMessage.error(t('profile.avatarError.size'))
    return false
  }
  return true
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true
    
    await changePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    })
    
    ElMessage.success(t('profile.passwordChangeSuccess'))
    // 清空表单并隐藏
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
    passwordFormRef.value.resetFields()
    showPasswordForm.value = false
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('profile.passwordChangeError'))
    }
  } finally {
    changingPassword.value = false
  }
}

// 取消修改密码
const handleCancelPasswordChange = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  passwordFormRef.value?.resetFields()
  showPasswordForm.value = false
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped lang="scss">
.profile-container {
  padding: 20px;

  .avatar-section {
    text-align: center;

    .avatar-uploader {
      margin-bottom: 20px;

      :deep(.el-upload) {
        border: 1px dashed var(--el-border-color);
        border-radius: 50%;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: var(--el-transition-duration-fast);

        &:hover {
          border-color: var(--el-color-primary);
        }
      }

      .avatar {
        width: 150px;
        height: 150px;
        display: block;
      }

      .avatar-icon {
        font-size: 60px;
        color: #8c939d;
        width: 150px;
        height: 150px;
        line-height: 150px;
        text-align: center;
      }
    }

    .user-info {
      h3 {
        margin: 10px 0 5px;
        font-size: 20px;
      }

      .username {
        color: #909399;
        margin-bottom: 10px;
      }
    }
  }

  // 工作状态选择器图标样式
  :deep(.el-select) {
    .el-input__wrapper {
      .el-input__prefix {
        display: flex;
        align-items: center;
        padding-left: 12px;
        padding-right: 8px;
        
        .el-icon {
          font-size: 18px;
          transition: color 0.3s;
        }
      }
      
      .el-input__inner {
        padding-left: 40px !important;
      }
    }
  }

  // 下拉选项图标样式
  :deep(.el-select-dropdown) {
    .el-select-dropdown__item {
      display: flex;
      align-items: center;
      
      .el-icon {
        font-size: 18px;
        margin-right: 8px;
        flex-shrink: 0;
      }
    }
  }
}
</style>

