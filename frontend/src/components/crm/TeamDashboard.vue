<template>
  <div class="team-dashboard">
    <!-- KPI 行 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="12" :sm="8" :md="4" v-for="(card, idx) in kpiCards" :key="card.key">
        <div class="kpi-card" :class="card.class" :style="{ '--enter-delay': `${idx * 60}ms` }">
          <div class="kpi-icon"><el-icon><component :is="card.icon" /></el-icon></div>
          <div class="kpi-content">
            <div class="kpi-value">{{ card.value }}</div>
            <div class="kpi-label">{{ card.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="main-row">
      <!-- 团队漏斗 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="surface-card funnel-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('crm.pipeline.title') }}</span>
            </div>
          </template>
          <div class="funnel-stages">
            <div
              v-for="(stage, idx) in funnelData"
              :key="stage.status"
              class="funnel-stage"
            >
              <div class="stage-bar-wrap">
                <div
                  class="stage-bar"
                  :style="{
                    width: funnelMax > 0 ? `${(stage.count / funnelMax) * 100}%` : '0%',
                    background: stageColors[idx % stageColors.length],
                  }"
                ></div>
              </div>
              <div class="stage-info">
                <span class="stage-label">{{ stage.label }}</span>
                <span class="stage-count">{{ stage.count }}</span>
              </div>
            </div>
          </div>
          <div v-if="funnelData.length === 0" class="empty-tip">
            {{ $t('crm.ownerStats.noTeamData') }}
          </div>
        </el-card>
      </el-col>

      <!-- 成员排名 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="surface-card ranking-card">
          <template #header>
            <div class="card-header">
              <span>{{ $t('crm.ownerStats.title') }}</span>
              <el-tag type="info" size="small">{{ $t('crm.ownerStats.desc') }}</el-tag>
            </div>
          </template>
          <el-table :data="memberRanking" stripe v-loading="loading" class="ranking-table">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="ownerName" :label="$t('sales.targets.salesName')" min-width="100">
              <template #default="{ row }">
                <span class="member-name">{{ row.ownerName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="totalCustomers" :label="$t('crm.ownerStats.customers')" width="90" align="center">
              <template #default="{ row }">
                <span class="stat-num">{{ row.totalCustomers }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="closedDeals" label="成交" width="70" align="center">
              <template #default="{ row }">
                <el-tag type="success" size="small">{{ row.closedDeals }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalRevenue" :label="$t('crm.ownerStats.revenue')" min-width="110" align="right">
              <template #default="{ row }">
                <span class="revenue-num">{{ formatRevenue(row.totalRevenue) }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="memberRanking.length === 0 && !loading" class="empty-tip">
            {{ $t('crm.ownerStats.noTeamData') }}
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { User, DataLine, Money, Trophy, TrendCharts } from '@element-plus/icons-vue'
import { getCrmTeamKpi, getCrmTeamMembers, getCrmTeamFunnel,
  type TeamKpi, type TeamMember, type TeamFunnelItem } from '../../api/crm'

const { t, locale } = useI18n()

// Props: 支持从父组件传入视角参数
const props = withDefaults(defineProps<{
  viewScope?: 'self' | 'department' | 'user'
  targetUserId?: number
}>(), {
  viewScope: 'department',
  targetUserId: undefined,
})

const loading = ref(false)
const kpi = ref<TeamKpi>({ totalCustomers: 0, totalLeads: 0, closedDeals: 0, totalRevenue: 0, newThisMonth: 0, memberCount: 0 })
const memberRanking = ref<TeamMember[]>([])
const funnelData = ref<TeamFunnelItem[]>([])

const stageColors = [
  '#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399',
]

const funnelMax = computed(() => Math.max(...funnelData.value.map(s => s.count), 1))

const kpiCards = computed(() => [
  {
    key: 'totalCustomers',
    label: t('crm.summary.customers'),
    value: kpi.value.totalCustomers,
    icon: User,
    class: 'kpi-blue',
  },
  {
    key: 'totalLeads',
    label: t('crm.leads.total'),
    value: kpi.value.totalLeads,
    icon: TrendCharts,
    class: 'kpi-purple',
  },
  {
    key: 'closedDeals',
    label: t('crm.summary.closedDeals'),
    value: kpi.value.closedDeals,
    icon: Trophy,
    class: 'kpi-green',
  },
  {
    key: 'totalRevenue',
    label: t('crm.summary.totalRevenue'),
    value: formatRevenue(kpi.value.totalRevenue),
    icon: Money,
    class: 'kpi-orange',
  },
  {
    key: 'newThisMonth',
    label: t('crm.summary.newCustomersThisMonth'),
    value: kpi.value.newThisMonth,
    icon: DataLine,
    class: 'kpi-cyan',
  },
  {
    key: 'memberCount',
    label: locale.value === 'zh-CN' ? '团队人数' : 'Team Size',
    value: kpi.value.memberCount,
    icon: User,
    class: 'kpi-gray',
  },
])

const formatRevenue = (val: number): string => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`
  return `$${val}`
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      viewScope: props.viewScope,
    }
    if (props.viewScope === 'user' && props.targetUserId) {
      params.targetUserId = props.targetUserId
    }
    const [kpiRes, membersRes, funnelRes] = await Promise.all([
      getCrmTeamKpi(params),
      getCrmTeamMembers(params),
      getCrmTeamFunnel(params),
    ])
    kpi.value = kpiRes
    memberRanking.value = membersRes
    funnelData.value = funnelRes
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

// 监听 props 变化，重新加载数据
watch(() => [props.viewScope, props.targetUserId], () => {
  loadData()
}, { deep: true })

onMounted(() => { loadData() })
</script>

<style scoped lang="scss">
.team-dashboard {
  .kpi-row {
    margin-bottom: 16px;
    .kpi-card {
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff;
      border: 1px solid #e5e5e7;
      animation: fadeInUp 0.4s ease-out var(--enter-delay, 0ms) both;
      &.kpi-blue { background: linear-gradient(135deg, #667eea, #764ba2); .kpi-icon, .kpi-value, .kpi-label { color: #fff; } }
      &.kpi-purple { background: linear-gradient(135deg, #f093fb, #f5576c); .kpi-icon, .kpi-value, .kpi-label { color: #fff; } }
      &.kpi-green { background: linear-gradient(135deg, #4ade80, #22c55e); .kpi-icon, .kpi-value, .kpi-label { color: #fff; } }
      &.kpi-orange { background: linear-gradient(135deg, #f59e0b, #d97706); .kpi-icon, .kpi-value, .kpi-label { color: #fff; } }
      &.kpi-cyan { background: linear-gradient(135deg, #06b6d4, #0891b2); .kpi-icon, .kpi-value, .kpi-label { color: #fff; } }
      &.kpi-gray { background: linear-gradient(135deg, #94a3b8, #64748b); .kpi-icon, .kpi-value, .kpi-label { color: #fff; } }
      .kpi-icon { font-size: 28px; opacity: 0.9; flex-shrink: 0; }
      .kpi-content { flex: 1; }
      .kpi-value { font-size: 22px; font-weight: 700; }
      .kpi-label { font-size: 12px; opacity: 0.85; margin-top: 2px; }
    }
  }
  .main-row { margin-bottom: 16px; }
  .surface-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    background: #fff;
    .card-header {
      display: flex; align-items: center; gap: 8px;
      font-weight: 600; color: #1d1d1f;
    }
  }
  .funnel-stages {
    .funnel-stage {
      margin-bottom: 12px;
      .stage-bar-wrap {
        background: #f5f5f5;
        border-radius: 6px;
        height: 28px;
        overflow: hidden;
        margin-bottom: 4px;
        .stage-bar {
          height: 100%;
          border-radius: 6px;
          transition: width 0.6s ease;
          min-width: 4px;
        }
      }
      .stage-info {
        display: flex; justify-content: space-between; align-items: center;
        .stage-label { font-size: 13px; color: #6b7280; }
        .stage-count { font-size: 13px; font-weight: 600; color: #1f2329; }
      }
    }
  }
  .ranking-table {
    .member-name { font-weight: 600; color: #1f2329; }
    .stat-num { font-weight: 600; color: #1f2329; }
    .revenue-num { font-weight: 600; color: #f59e0b; }
  }
  .empty-tip {
    text-align: center; padding: 32px; color: #9ca3af; font-size: 14px;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
</style>
