<template>
  <div class="permission-center-container page-content-enter">
    <h1 class="page-title fade-in-up">{{ $t('layout.menu.permissions') }}</h1>

    <el-row :gutter="20" class="content-row">
      <!-- 左侧：账号列表 -->
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ $t('employees.title') }}</span>
            </div>
          </template>
          <el-table
            :data="employeeList"
            height="480"
            highlight-current-row
            @current-change="handleUserSelect"
          >
            <el-table-column prop="employeeNumber" :label="$t('employees.employeeNumber')" width="90" />
            <el-table-column prop="nickname" :label="$t('employees.name')" min-width="120" />
            <el-table-column prop="username" :label="$t('employees.loginAccount')" min-width="120" />
            <el-table-column prop="department" :label="$t('employees.department')" width="120">
              <template #default="{ row }">
                {{ getDepartmentName(row.department) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：角色模板分配 + 权限清单 -->
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ $t('layout.menu.permissions') }}</span>
            </div>
          </template>

          <div v-if="!currentUser" class="empty-tip">
            <el-empty :description="$t('common.select') + $t('employees.title')" />
          </div>

          <div v-else>
            <div class="selected-user">
              <div class="user-name">{{ currentUser.nickname || currentUser.username }}</div>
              <div class="user-sub">
                <span>{{ currentUser.username }}</span>
                <span v-if="currentUser.department"> · {{ getDepartmentName(currentUser.department) }}</span>
              </div>
            </div>

            <el-form label-width="120px" class="permission-form">
              <el-form-item :label="$t('layout.menu.permissions')">
                <el-checkbox-group v-model="selectedRoleIds">
                  <el-checkbox
                    v-for="role in roleList"
                    :key="role.id"
                    :label="role.id"
                    class="role-item"
                  >
                    <span class="role-name">{{ role.name }}</span>
                    <span class="role-tag" v-if="role.isSuperAdmin">
                      (super admin)
                    </span>
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" :loading="saving" @click="handleSave">
                  {{ $t('common.save') }}
                </el-button>
              </el-form-item>
            </el-form>

            <!-- 权限清单：按模块分组展示当前用户最终拥有的权限点 -->
            <div class="permission-summary" v-if="userPermissionGroups.length">
              <div class="summary-title">{{ t('permissions.summaryTitle') || '当前权限清单' }}</div>
              <div
                class="permission-module"
                v-for="group in userPermissionGroups"
                :key="group.module"
              >
                <div class="module-header">
                  <span class="module-name">{{ group.moduleLabel }}</span>
                  <span class="module-count">({{ group.items.length }})</span>
                </div>
                <div class="module-tags">
                  <el-tag
                    v-for="item in group.items"
                    :key="item.code"
                    size="small"
                    class="perm-tag"
                    effect="plain"
                  >
                    {{ item.name || item.code }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 存储盘管理（仅超级管理员可见） -->
    <el-row :gutter="20" class="content-row" v-if="isSuperAdmin">
      <el-col :xs="24" :md="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ t('files.drives') }} - {{ t('layout.menu.permissions') }}</span>
            </div>
          </template>

          <div class="drive-admin">
            <el-table :data="driveConfigs" style="width: 100%" size="small">
              <el-table-column prop="id" label="盘符" width="80" />
              <el-table-column prop="name" label="系统名称" width="120" />
              <el-table-column prop="displayName" :label="t('files.driveName')" min-width="200">
                <template #default="{ row }">
                  <el-input v-model="row.displayName" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="enabled" label="启用" width="120" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.enabled" />
                </template>
              </el-table-column>
              <el-table-column prop="enableQuotaScan" label="开启容量扫描" width="140" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.enableQuotaScan" />
                </template>
              </el-table-column>
            </el-table>

            <div class="drive-admin-footer">
              <el-button type="primary" :loading="savingDrives" @click="handleSaveDrives">
                {{ t('common.save') }}
              </el-button>
              <span class="drive-admin-tip">
                启用的盘将在“文件管理”页面展示；开启容量扫描后，系统会对该盘进行递归统计，
                适合部署到共享盘电脑后再打开，本地开发可以保持关闭以避免卡顿。
              </span>
            </div>

            <!-- 工作空间模块存储配置 -->
            <div class="workspace-storage">
              <h4 class="section-title">工作空间存储配置</h4>
              <el-table :data="workspaceStorageRows" size="small" style="width: 100%">
                <el-table-column prop="moduleKey" label="模块" width="140">
                  <template #default="{ row }">
                    {{ row.label }}
                  </template>
                </el-table-column>
                <el-table-column prop="driveId" label="盘符" width="120">
                  <template #default="{ row }">
                    <el-select v-model="row.driveId" size="small" style="width: 100%">
                      <el-option
                        v-for="d in driveConfigs"
                        :key="d.id"
                        :label="d.name"
                        :value="d.id"
                      />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="rootPath" label="根目录（文件夹）" min-width="220">
                  <template #default="{ row }">
                    <el-input v-model="row.rootPath" size="small" placeholder="例如 company-files / software-downloads" />
                  </template>
                </el-table-column>
              </el-table>
              <p class="drive-admin-tip">
                这里决定“工作空间”里各大板块在服务器硬盘上的实际存储位置，修改后保存即可生效，无需改代码。
              </p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getEmployees, type Employee } from '../api/employees'
import { 
  getAllRoles, 
  getUserRoles, 
  assignRolesToUser, 
  getUserPermissions,
  getAllPermissions,
  type PermissionRole,
  type PermissionItem,
} from '../api/permissions'
import { getAdminDrives, updateAdminDrives, type DriveConfig } from '../api/files'
import { getWorkspaceStorageConfigs, updateWorkspaceStorageConfigs, type WorkspaceStorageConfig } from '../api/workspace-storage'
import { useUserStore } from '../store/user'

const { t } = useI18n()
const userStore = useUserStore()

// 员工列表
const employeeList = ref<Employee[]>([])
// 角色模板列表
const roleList = ref<PermissionRole[]>([])
// 权限点列表
const allPermissions = ref<PermissionItem[]>([])
// 当前选中的用户
const currentUser = ref<Employee | null>(null)
// 当前用户已分配的角色ID集合
const selectedRoleIds = ref<number[]>([])
// 保存中标记
const saving = ref(false)
// 当前用户拥有的权限编码
const userPermissionCodes = ref<string[]>([])
// 存储盘配置
const driveConfigs = ref<DriveConfig[]>([])
const savingDrives = ref(false)
// 工作空间存储配置
const workspaceConfigs = ref<WorkspaceStorageConfig[]>([])

// 将后端存的 workspaceConfigs 和表格行做一个映射，保证即使后端还没配置也有默认值
const workspaceStorageRows = computed({
  get: () => {
    const byKey: Record<string, WorkspaceStorageConfig> = {}
    workspaceConfigs.value.forEach(c => {
      byKey[c.moduleKey] = c
    })
    const ensure = (moduleKey: string, defaultRoot: string, label: string): WorkspaceStorageConfig & { label: string } => {
      const exist = byKey[moduleKey]
      return {
        moduleKey,
        driveId: exist?.driveId || (driveConfigs.value[0]?.id || 'd'),
        rootPath: exist?.rootPath || defaultRoot,
        label,
      }
    }
    return [
      ensure('company-files', 'company-files', '公司文件'),
      ensure('software-downloads', 'software-downloads', '软件下载'),
      ensure('company-culture', 'company-culture', '公司文化'),
    ]
  },
  set: (rows) => {
    workspaceConfigs.value = rows.map((r: any) => ({
      moduleKey: r.moduleKey,
      driveId: r.driveId,
      rootPath: r.rootPath,
    }))
  },
})

const isSuperAdmin = computed(() => userStore.userInfo?.role === 'super_admin')

// 部门名称映射
const departmentsMap = computed(() => ({
  planning: t('employees.departments.planning'),
  sales: t('employees.departments.sales'),
  tech: t('employees.departments.tech'),
  finance: t('employees.departments.finance'),
  hr: t('employees.departments.hr'),
  domestic: t('employees.departments.domestic'),
  management: t('employees.departments.management'),
}))

// 获取部门显示名称
const getDepartmentName = (dept?: string): string => {
  if (!dept) return '-'
  return (departmentsMap.value as any)[dept] || dept
}

// 根据权限编码列表，按模块分组
const userPermissionGroups = computed(() => {
  if (!userPermissionCodes.value.length || !allPermissions.value.length) return []

  const byCode: Record<string, PermissionItem> = {}
  allPermissions.value.forEach(p => {
    byCode[p.code] = p
  })

  const groups: Record<string, PermissionItem[]> = {}
  userPermissionCodes.value.forEach(code => {
    const item = byCode[code]
    if (!item) return
    if (!groups[item.module]) {
      groups[item.module] = []
    }
    groups[item.module].push(item)
  })

  const moduleLabelMap: Record<string, string> = {
    system: t('layout.menu.permissions'),
    employee: t('layout.menu.employees'),
    hr: t('layout.menu.hr'),
    request: t('workspace.modules.request_help') || '申请',
    report: t('workspace.modules.daily_work') || '工作汇报',
    files: t('layout.menu.files'),
    workspace: t('layout.menu.workspace'),
    workgroup: t('layout.menu.workGroup'),
    finance: t('layout.menu.finance'),
  }

  return Object.entries(groups).map(([module, items]) => ({
    module,
    moduleLabel: moduleLabelMap[module] || module,
    items,
  }))
})

// 选中某个用户
const handleUserSelect = async (row: Employee | null) => {
  currentUser.value = row
  selectedRoleIds.value = []
  userPermissionCodes.value = []

  if (!row) return

  try {
    const [roleRes, permRes] = await Promise.all([
      getUserRoles(row.id),
      getUserPermissions(row.id),
    ])
    selectedRoleIds.value = roleRes.roleIds || []
    userPermissionCodes.value = permRes.permissions || []
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 保存角色分配
const handleSave = async () => {
  if (!currentUser.value) {
    ElMessage.warning(t('common.select') + t('employees.title'))
    return
  }

  try {
    saving.value = true
    await assignRolesToUser(currentUser.value.id, selectedRoleIds.value)
    ElMessage.success(t('common.updateSuccess'))

    // 角色变更后刷新权限清单
    const permRes = await getUserPermissions(currentUser.value.id)
    userPermissionCodes.value = permRes.permissions || []
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

// 初始化数据
const loadData = async () => {
  try {
    const [emps, roles, perms, drives, wsCfgs] = await Promise.all([
      getEmployees(), 
      getAllRoles(),
      getAllPermissions(),
      isSuperAdmin.value ? getAdminDrives() : Promise.resolve([]),
      isSuperAdmin.value ? getWorkspaceStorageConfigs() : Promise.resolve([]),
    ])
    employeeList.value = emps
    roleList.value = roles
    allPermissions.value = perms.permissions || []
    driveConfigs.value = (drives as DriveConfig[]) || []
    workspaceConfigs.value = (wsCfgs as WorkspaceStorageConfig[]) || []
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

onMounted(() => {
  loadData()
})

// 保存存储盘配置
const handleSaveDrives = async () => {
  try {
    savingDrives.value = true
    await updateAdminDrives(driveConfigs.value)
    if (workspaceConfigs.value.length) {
      await updateWorkspaceStorageConfigs(workspaceConfigs.value)
    }
    ElMessage.success(t('common.updateSuccess'))
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    savingDrives.value = false
  }
}
</script>

<style scoped lang="scss">
.permission-center-container {
  padding: 24px;

  .page-title {
    margin-bottom: 24px;
  }

  .content-row {
    align-items: stretch;
  }

  .card-header {
    font-weight: 600;
  }

  .empty-tip {
    padding: 40px 0;
  }

  .selected-user {
    margin-bottom: 16px;

    .user-name {
      font-size: 18px;
      font-weight: 600;
    }

    .user-sub {
      font-size: 13px;
      color: #909399;
    }
  }

  .role-item {
    display: block;
    margin-bottom: 8px;

    .role-name {
      margin-left: 4px;
    }

    .role-tag {
      margin-left: 4px;
      font-size: 12px;
      color: #f56c6c;
    }
  }

  .drive-admin {
    margin-top: 24px;

    .drive-admin-footer {
      margin-top: 16px;
      display: flex;
      align-items: center;
      gap: 12px;

      .drive-admin-tip {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style>


