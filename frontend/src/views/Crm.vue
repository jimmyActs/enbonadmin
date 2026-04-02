<template>
  <div class="crm-container page-content-enter">
    <div class="page-header fade-in-up">
      <div class="title-block">
        <h1 class="page-title">{{ t('crm.title') }}</h1>
        <p class="page-subtitle">{{ t('crm.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <!-- 新建商机按钮：需要 crm.lead.create 权限 -->
        <el-button
          v-if="userStore.hasPermission('crm.lead.create')"
          type="primary"
          :icon="Plus"
          size="large"
          @click="quickAddLead"
        >
          {{ t('crm.actions.newLead') }}
        </el-button>
        <el-button :icon="Refresh" size="large" @click="loadAll">
          {{ t('crm.actions.refresh') }}
        </el-button>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="crm-tabs fade-in-up">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane name="overview">
          <template #label>
            <el-icon><Odometer /></el-icon>
            {{ t('crm.tabs.overview') }}
          </template>
          <div class="tab-content tab-content-overview">
      <!-- KPI：统一 5 列栅格，大屏一行排齐，避免「孤卡」留白 -->
      <div class="summary-kpi-grid">
        <div
          v-for="(card, index) in summaryCards"
          :key="card.key"
          class="summary-kpi-card"
          :style="{ '--enter-delay': `${index * 45}ms` }"
        >
          <div class="summary-kpi-inner">
            <div class="card-icon" :style="{ background: card.gradient }">
              <el-icon><component :is="card.icon" /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-label">{{ t(card.labelKey) }}</div>
              <div class="card-value">{{ card.value }}</div>
              <div class="card-trend" :class="card.trendType" v-if="card.trend">
                <el-icon><TrendCharts /></el-icon>
                <span>{{ card.trend }}</span>
                <span class="trend-text">{{ t('crm.summary.comparedToLastWeek') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-row :gutter="20" class="content-row">
        <!-- Pipeline 概览 -->
        <el-col :xs="24" :lg="16">
          <el-card shadow="never" class="surface-card pipeline-card">
            <template #header>
              <div class="card-header">
                <div>
                  <h3>{{ t('crm.pipeline.title') }}</h3>
                  <p>{{ t('crm.pipeline.desc') }}</p>
                </div>
                <el-button type="primary" text @click="activeTab = 'customers'">{{ t('crm.pipeline.viewDetail') }}</el-button>
              </div>
            </template>
            <div class="pipeline-stages">
              <div v-for="stage in pipelineStages" :key="stage.key" class="stage-item">
                <div class="stage-header">
                  <div class="stage-name">{{ t(stage.nameKey) }}</div>
                  <el-tag size="small" :type="stage.tagType">{{ t(stage.statusKey) }}</el-tag>
                </div>
                <div class="stage-value">{{ stage.dealCount }} {{ t('crm.pipeline.deals') }}</div>
                <div class="stage-amount" v-if="stage.amount !== '-'">{{ stage.amount }}</div>
                <div class="stage-amount" v-else>-</div>
                <div class="stage-meta">
                  <span>{{ t('crm.pipeline.conversion') }} {{ stage.conversion }}</span>
                </div>
                <el-progress :percentage="stage.progress" :show-text="false" />
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：待跟进 + 负责人统计 -->
        <el-col :xs="24" :lg="8">
          <el-card shadow="never" class="surface-card followup-card" style="margin-bottom: 20px;">
            <template #header>
              <div class="card-header">
                <div>
                  <h3>{{ t('crm.followUp.title') }}</h3>
                  <p>{{ t('crm.followUp.desc') }}</p>
                </div>
                <el-button text @click="activeTab = 'customers'">{{ t('crm.followUp.viewAll') }}</el-button>
              </div>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="item in followUps"
                :key="item.id"
                :type="item.type"
                :timestamp="item.time"
              >
                <div class="followup-item">
                  <div class="followup-customer">{{ item.customer }}</div>
                  <div class="followup-info">
                    <span>{{ t(item.actionKey) }}</span>
                    <span>·</span>
                    <span>{{ item.owner }}</span>
                  </div>
                  <el-tag size="small" :type="item.tagType">{{ t(item.statusKey) }}</el-tag>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>

          <!-- 负责人统计（管理员/部门负责人可见） -->
          <el-card shadow="never" class="surface-card owner-stats-card" v-if="ownerStats.length > 0 || isDeptHead">
            <template #header>
              <div class="card-header">
                <div>
                  <h3>{{ t('crm.ownerStats.title') }}</h3>
                  <p>{{ t('crm.ownerStats.desc') }}</p>
                </div>
              </div>
            </template>
            <div v-if="ownerStats.length === 0" class="owner-stats-empty">
              <span>{{ $t('crm.ownerStats.noTeamData') }}</span>
            </div>
            <div v-else class="owner-stats-list">
              <div v-for="s in ownerStats.slice(0, 5)" :key="s.ownerId ?? s.ownerName" class="owner-stat-item">
                <div class="owner-name">{{ s.ownerName }}</div>
                <div class="owner-counts">
                  <span>{{ s.totalCount }} {{ t('crm.ownerStats.customers') }}</span>
                  <span>·</span>
                  <span class="revenue">{{ t('crm.ownerStats.revenue') }}: ¥{{ Number(s.totalRevenue || 0).toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 客户列表预览 -->
      <el-row :gutter="20" class="content-row">
        <el-col :span="24">
          <el-card shadow="never" class="surface-card">
            <template #header>
              <div class="card-header">
                <div>
                  <h3>{{ t('crm.customers.title') }}</h3>
                  <p>{{ t('crm.customers.desc') }}</p>
                </div>
                <el-button type="primary" text @click="activeTab = 'customers'">
                  {{ t('crm.customers.viewAll') }}
                </el-button>
              </div>
            </template>
            <el-table :data="recentCustomers" stripe size="small" class="customer-table">
              <el-table-column prop="customerCode" :label="$t('crm.customers.customerCode')" width="170">
                <template #default="{ row }">
                  <span class="customer-code">{{ row.customerCode }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="customerName" :label="$t('sales.customers.customerName')" min-width="140">
                <template #default="{ row }">
                  <div class="customer-name-cell">
                    <span class="name">{{ row.customerName }}</span>
                    <span class="star-rating" v-if="row.starRating">{{ renderStars(row.starRating) }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="country" :label="$t('sales.customers.country')" width="100" />
              <el-table-column prop="status" :label="$t('sales.customers.status')" width="120">
                <template #default="{ row }">
                  <el-tag size="small" :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastContact" :label="$t('sales.customers.lastContact')" width="160">
                <template #default="{ row }">{{ formatDate(row.lastContact) }}</template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane name="customers" v-if="canViewCustomers" lazy>
          <template #label>
            <el-icon><User /></el-icon>
            {{ t('crm.tabs.customers') }}
          </template>
          <div class="tab-content">
            <CustomerModule />
          </div>
        </el-tab-pane>

        <el-tab-pane name="leads" v-if="canViewLeads" lazy>
          <template #label>
            <el-icon><TrendCharts /></el-icon>
            {{ t('crm.tabs.leads') }}
            <el-badge :value="stats.newLeads" class="tab-badge" v-if="stats.newLeads > 0" />
          </template>
          <div class="tab-content">
            <LeadModule />
          </div>
        </el-tab-pane>

        <el-tab-pane name="pool" v-if="canViewCustomers" lazy>
          <template #label>
            <el-icon><Grid /></el-icon>
            {{ t('crm.tabs.pool') }}
            <el-badge :value="summary.poolCustomers" class="tab-badge" type="warning" v-if="summary.poolCustomers > 0" />
          </template>
          <div class="tab-content">
            <PoolModule />
          </div>
        </el-tab-pane>

        <el-tab-pane name="targets" v-if="canViewTargets" lazy>
          <template #label>
            <el-icon><DataLine /></el-icon>
            {{ t('crm.tabs.targets') }}
          </template>
          <div class="tab-content">
            <TargetModule />
          </div>
        </el-tab-pane>

        <el-tab-pane name="emails" v-if="canViewEmails" lazy>
          <template #label>
            <el-icon><Message /></el-icon>
            {{ t('crm.tabs.emails') }}
          </template>
          <div class="tab-content">
            <EmailModule />
          </div>
        </el-tab-pane>

        <el-tab-pane name="imports" lazy>
          <template #label>
            <el-icon><Upload /></el-icon>
            {{ t('crm.tabs.imports') }}
          </template>
          <div class="tab-content">
            <ImportModule />
          </div>
        </el-tab-pane>

        <el-tab-pane name="analytics" lazy>
          <template #label>
            <el-icon><DataAnalysis /></el-icon>
            {{ t('crm.tabs.analytics') }}
          </template>
          <div class="tab-content tab-content-analytics">
            <AnalyticsModule :active="activeTab === 'analytics'" />
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="canManageInquirySources" name="inquirySources" lazy>
          <template #label>
            <el-icon><Connection /></el-icon>
            {{ t('crm.tabs.inquirySources') }}
          </template>
          <div class="tab-content">
            <InquirySourceModule />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  Plus, Refresh, TrendCharts, User, ChatLineRound,
  Briefcase, Odometer, Grid, DataLine, Message, DataAnalysis, Upload
} from '@element-plus/icons-vue'
import { getCrmSummary, getCrmPipeline, getCrmCustomers, getCrmOwnerStats, getCrmLeadStats,
  type CrmCustomer, type CrmSummaryStats, type CrmOwnerStat, type CrmLeadStat } from '../api/crm'
import CustomerModule from '../components/sales/CustomerModule.vue'
import LeadModule from '../components/crm/LeadModule.vue'
import PoolModule from '../components/crm/PoolModule.vue'
import TargetModule from '../components/crm/TargetModule.vue'
import EmailModule from '../components/crm/EmailModule.vue'
import AnalyticsModule from '../components/crm/AnalyticsModule.vue'
import ImportModule from '../components/shared/ImportModule.vue'
import InquirySourceModule from '../components/shared/InquirySourceModule.vue'
import { Connection } from '@element-plus/icons-vue'
import { useUserStore } from '../store/user'

const { t, locale } = useI18n()
const userStore = useUserStore()

const isDeptHead = computed(() => {
  // 有团队统计权限的就是"部门负责人"
  return userStore.hasPermission('crm.stats.team')
})

const canViewCustomers = computed(() => userStore.hasPermission('crm.customer.view'))
const canViewLeads = computed(() => userStore.hasPermission('crm.lead.view'))
const canViewEmails = computed(() => userStore.hasPermission('crm.email.view'))
const canViewTargets = computed(() => userStore.hasPermission('crm.target.view'))
const canManageInquirySources = computed(() => userStore.hasPermission('crm.inquirySource.manage'))

const activeTab = ref('overview')
const summary = ref<CrmSummaryStats>({
  totalCustomers: 0, privateCustomers: 0, poolCustomers: 0, activeCustomers: 0,
  newCustomersThisMonth: 0, overdueNoContact: 0, closedDeals: 0, totalRevenue: 0,
})
const ownerStats = ref<CrmOwnerStat[]>([])
const stats = ref<CrmLeadStat>({ total: 0, newLeads: 0, qualified: 0, won: 0 })
const recentCustomers = ref<CrmCustomer[]>([])

const summaryCards = computed(() => [
  {
    key: 'customers',
    labelKey: 'crm.summary.customers',
    value: summary.value.privateCustomers || summary.value.totalCustomers,
    trend: `+${summary.value.newCustomersThisMonth}`,
    trendType: 'up',
    icon: User,
    gradient: 'linear-gradient(135deg, #5C6BFF 0%, #8296FF 100%)',
  },
  {
    key: 'active',
    labelKey: 'crm.summary.activeCustomers',
    value: summary.value.activeCustomers,
    trend: '',
    trendType: 'up',
    icon: ChatLineRound,
    gradient: 'linear-gradient(135deg, #40C9FF 0%, #6A49FF 100%)',
  },
  {
    key: 'pool',
    labelKey: 'crm.summary.poolCustomers',
    value: summary.value.poolCustomers,
    trend: '',
    trendType: 'down',
    icon: Grid,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  },
  {
    key: 'overdue',
    labelKey: 'crm.summary.overdueNoContact',
    value: summary.value.overdueNoContact,
    trend: '',
    trendType: 'danger',
    icon: Briefcase,
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  },
  {
    key: 'deals',
    labelKey: 'crm.summary.closedDeals',
    value: summary.value.closedDeals,
    trend: `¥${Number(summary.value.totalRevenue || 0).toLocaleString()}`,
    trendType: 'up',
    icon: TrendCharts,
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  },
])

const pipelineStages = ref([
  { key: 'new', nameKey: 'crm.pipeline.stages.new', statusKey: 'crm.pipeline.status.active', dealCount: 0, amount: '-', conversion: '-', progress: 0, tagType: 'success' },
  { key: 'contacting', nameKey: 'crm.pipeline.stages.contacting', statusKey: 'crm.pipeline.status.active', dealCount: 0, amount: '-', conversion: '-', progress: 0, tagType: 'success' },
  { key: 'negotiating', nameKey: 'crm.pipeline.stages.negotiating', statusKey: 'crm.pipeline.status.warning', dealCount: 0, amount: '-', conversion: '-', progress: 0, tagType: 'warning' },
  { key: 'closed', nameKey: 'crm.pipeline.stages.closed', statusKey: 'crm.pipeline.status.focus', dealCount: 0, amount: '-', conversion: '-', progress: 0, tagType: 'danger' },
])

const followUps = [
  { id: 1, time: t('crm.followUp.today') + ' 15:00', customer: '-', actionKey: 'crm.followUp.actions.phoneCall', owner: '-', statusKey: 'crm.followUp.status.pending', tagType: 'warning', type: 'warning' },
]

const onTabChange = (tab: string) => {
  if (tab === 'overview') loadAll()
}

const loadSummary = async () => {
  try { summary.value = await getCrmSummary() } catch (e: any) { ElMessage.error(e?.message || t('common.error')) }
}

const loadOwnerStats = async () => {
  try {
    const params: any = {}
    if (isDeptHead.value && userStore.userInfo?.department) {
      params.department = userStore.userInfo.department
    }
    ownerStats.value = await getCrmOwnerStats(params)
  } catch (e: any) {
    ownerStats.value = []
  }
}

const loadLeadStats = async () => {
  try { stats.value = await getCrmLeadStats() } catch (e: any) { ElMessage.error(e?.message || t('common.error')) }
}

const loadPipeline = async () => {
  try {
    const rows = await getCrmPipeline()
    const map: Record<string, number> = {}
    rows.forEach((r) => { map[r.status] = r.count })
    const stages = pipelineStages.value
    const newStage = stages.find((s) => s.key === 'new')
    const contactingStage = stages.find((s) => s.key === 'contacting')
    const negotiatingStage = stages.find((s) => s.key === 'negotiating')
    const closedStage = stages.find((s) => s.key === 'closed')
    if (newStage) newStage.dealCount = map.new || 0
    if (contactingStage) contactingStage.dealCount = map.contacting || 0
    if (negotiatingStage) negotiatingStage.dealCount = map.negotiating || 0
    if (closedStage) closedStage.dealCount = map.closed || 0
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1
    stages.forEach((s) => {
      if (s.dealCount > 0) {
        s.progress = Math.round((s.dealCount / total) * 100)
        s.conversion = Math.round((s.dealCount / total) * 100) + '%'
      }
    })
  } catch (e: any) { ElMessage.error(e?.message || t('common.error')) }
}

const loadRecentCustomers = async () => {
  try {
    const res = await getCrmCustomers({ page: 1, pageSize: 10 })
    recentCustomers.value = res.data
  } catch (e: any) { ElMessage.error(e?.message || t('common.error')) }
}

const loadAll = async () => {
  await Promise.all([loadSummary(), loadPipeline(), loadRecentCustomers(), loadOwnerStats(), loadLeadStats()])
}

const quickAddLead = () => {
  activeTab.value = 'leads'
}

const renderStars = (rating: number) => '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0))
const getStatusTagType = (s: string): string => ({ new: 'info', contacting: 'primary', negotiating: 'warning', closed: 'success', lost: 'danger' }[s] || 'info')
const getStatusLabel = (s: string): string => ({ new: t('sales.customers.statuses.new'), contacting: t('sales.customers.statuses.contacting'), negotiating: t('sales.customers.statuses.negotiating'), closed: t('sales.customers.statuses.closed'), lost: t('sales.customers.statuses.lost') }[s] || s)
const formatDate = (d: string | null | undefined) => d ? new Date(d).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US') : '-'

onMounted(() => { loadAll() })
</script>

<style scoped lang="scss">
.crm-container {
  padding: 24px;
  background: #f5f5f7;
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;

    .title-block {
      .page-title { margin: 0; font-size: 28px; font-weight: 600; color: #1f2329; }
      .page-subtitle { margin-top: 8px; font-size: 14px; color: #6b7280; }
    }
    .header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
  }

  .crm-tabs {
    margin-bottom: 20px;
    background: #fff;
    border-radius: 16px;
    padding: 8px 16px;
    border: 1px solid rgba(15, 23, 42, 0.06);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    :deep(.el-tabs__header) { margin-bottom: 0; }
    :deep(.el-tabs__nav-wrap::after) { display: none; }
    :deep(.el-tabs__item) {
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .tab-badge { margin-left: 4px; }
    :deep(.el-tabs__content) {
      padding-top: 8px;
    }
  }

  .surface-card {
    border-radius: 16px;
    border: 1px solid rgba(15, 23, 42, 0.06);
    background: #fff;
    box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.04),
      0 8px 28px rgba(15, 23, 42, 0.06);
    :deep(.el-card__header) {
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
      padding: 18px 22px;
    }
    :deep(.el-card__body) {
      padding: 20px 22px;
    }
  }

  .summary-kpi-grid {
    display: grid;
    gap: 16px;
    margin-bottom: 24px;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    @media (max-width: 1400px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    @media (max-width: 900px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (max-width: 520px) {
      grid-template-columns: 1fr;
    }
  }

  .summary-kpi-card {
    animation: kpiEnter 0.52s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    animation-delay: var(--enter-delay, 0ms);
    .summary-kpi-inner {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 18px;
      border-radius: 14px;
      border: 1px solid rgba(15, 23, 42, 0.06);
      background: #fff;
      box-shadow:
        0 1px 2px rgba(15, 23, 42, 0.04),
        0 4px 18px rgba(15, 23, 42, 0.05);
      min-height: 100%;
      transition: box-shadow 0.22s ease, border-color 0.22s ease;
      &:hover {
        border-color: rgba(92, 107, 255, 0.18);
        box-shadow:
          0 1px 2px rgba(15, 23, 42, 0.05),
          0 12px 32px rgba(92, 107, 255, 0.09);
      }
    }
    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
      .el-icon { font-size: 22px; }
    }
    .card-content {
      flex: 1;
      min-width: 0;
      .card-label { font-size: 13px; color: #64748b; margin-bottom: 4px; font-weight: 500; }
      .card-value { font-size: 24px; font-weight: 600; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 2px; }
      .card-trend {
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        &.up { color: #16a34a; }
        &.down { color: #ef4444; }
        &.danger { color: #dc2626; }
        .trend-text { color: #94a3b8; font-weight: 400; }
      }
    }
  }

  .content-row { margin-bottom: 24px; }

  .card-header {
    display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
    h3 { margin: 0; font-size: 18px; font-weight: 600; }
    p { margin: 6px 0 0; font-size: 13px; color: #6b7280; }
  }

  .pipeline-card {
    .pipeline-stages {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;
      .stage-item {
        padding: 16px; border: 1px solid rgba(15, 23, 42, 0.06); border-radius: 12px; background: linear-gradient(180deg, #fafbff 0%, #f4f7ff 100%);
        .stage-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .stage-name { font-weight: 600; color: #1f2329; }
        .stage-value { font-size: 20px; font-weight: 600; color: #1f2329; }
        .stage-amount { margin: 4px 0; color: #6b7280; font-size: 13px; }
        .stage-meta { display: flex; gap: 6px; color: #9ca3af; font-size: 13px; margin-bottom: 10px; }
      }
    }
  }

  .followup-card {
    .followup-item {
      display: flex; flex-direction: column; gap: 6px;
      .followup-customer { font-weight: 600; color: #1f2329; }
      .followup-info { font-size: 13px; color: #6b7280; display: flex; gap: 6px; }
    }
  }

  .owner-stats-card {
    .owner-stats-list { display: flex; flex-direction: column; gap: 12px; }
    .owner-stats-empty {
      text-align: center; padding: 24px 0; color: #9ca3af; font-size: 14px;
    }
    .owner-stat-item {
      padding: 10px; border-radius: 10px; background: #f9fbff; border: 1px solid #edf0f7;
      .owner-name { font-weight: 600; color: #1f2329; }
      .owner-counts { font-size: 12px; color: #6b7280; display: flex; gap: 4px; margin-top: 4px; }
      .revenue { color: #22c55e; font-weight: 600; }
    }
  }

  .customer-table {
    .customer-code { font-family: 'Courier New', monospace; font-size: 12px; color: #64748b; }
    .customer-name-cell {
      display: flex; align-items: center; gap: 6px;
      .name { font-weight: 600; color: #1f2329; }
      .star-rating { color: #f59e0b; font-size: 12px; }
    }
  }

  .tab-content-overview { animation: fadeIn 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
  .tab-content-analytics { animation: fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes kpiEnter { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>
