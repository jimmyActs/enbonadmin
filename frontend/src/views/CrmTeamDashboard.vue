<template>
  <div class="team-dashboard-page">
    <div class="page-header">
      <div class="title-block">
        <h1 class="page-title">{{ locale === 'zh-CN' ? '团队看板' : 'Team Dashboard' }}</h1>
        <p class="page-subtitle">{{ locale === 'zh-CN' ? '团队业绩一览' : 'Team Performance Overview' }}</p>
      </div>
      <div class="header-actions">
        <!-- 视角切换器 -->
        <el-radio-group v-model="viewScope" size="default" style="margin-right: 12px;">
          <el-radio-button value="self">{{ locale === 'zh-CN' ? '我自己' : 'Myself' }}</el-radio-button>
          <el-radio-button value="department">{{ locale === 'zh-CN' ? '我的部门' : 'My Department' }}</el-radio-button>
          <el-radio-button value="user">{{ locale === 'zh-CN' ? '团队成员' : 'Team Member' }}</el-radio-button>
        </el-radio-group>

        <!-- 成员选择器（仅在"团队成员"视角下显示） -->
        <el-select
          v-if="viewScope === 'user'"
          v-model="targetUserId"
          :placeholder="locale === 'zh-CN' ? '选择成员' : 'Select Member'"
          clearable
          filterable
          style="width: 180px; margin-right: 12px;"
        >
          <el-option
            v-for="member in teamMembers"
            :key="member.id"
            :label="member.nickname || member.username"
            :value="member.id"
          />
        </el-select>

        <el-button :icon="Refresh" @click="refreshKey++">{{ locale === 'zh-CN' ? '刷新' : 'Refresh' }}</el-button>
      </div>
    </div>
    <TeamDashboard :key="refreshKey" :view-scope="viewScope" :target-user-id="targetUserId" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import TeamDashboard from '../components/crm/TeamDashboard.vue'
import { getCrmSelectableMembers } from '../api/crm'

const { locale } = useI18n()

// 视角切换
const viewScope = ref<'self' | 'department' | 'user'>('department')
const targetUserId = ref<number | undefined>(undefined)
const teamMembers = ref<Array<{ id: number; nickname?: string; username: string }>>([])
const refreshKey = ref(0)

const loadTeamMembers = async () => {
  try {
    const res = await getCrmSelectableMembers()
    teamMembers.value = res
  } catch (error) {
    console.error('加载团队成员失败', error)
  }
}

// 监听参数变化，通过改变 key 强制 TeamDashboard 重新渲染以触发数据重新加载
watch([viewScope, targetUserId], () => {
  refreshKey.value++
})

onMounted(() => {
  loadTeamMembers()
})
</script>

<style scoped lang="scss">
.team-dashboard-page {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 0 4px;

    .title-block {
      .page-title {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #1d1d1f;
      }
      .page-subtitle {
        margin: 4px 0 0;
        font-size: 14px;
        color: #86868a;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
    }
  }
}
</style>
