<template>
  <div class="crm-container page-content-enter">
    <div class="page-header fade-in-up">
      <div class="title-block">
        <h1 class="page-title">{{ t('crm.title') }}</h1>
        <p class="page-subtitle">{{ t('crm.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" size="large">{{ t('crm.actions.newLead') }}</el-button>
        <el-button :icon="UserFilled" size="large">{{ t('crm.actions.newCustomer') }}</el-button>
        <el-button :icon="Refresh" size="large">{{ t('crm.actions.refresh') }}</el-button>
      </div>
    </div>

    <div class="integration-alert" v-if="!hasIntegration">
      <el-alert
        :title="t('crm.integration.pendingTitle')"
        :description="t('crm.integration.pendingDesc')"
        type="warning"
        show-icon
      >
        <template #icon>
          <el-icon><Connection /></el-icon>
        </template>
      </el-alert>
    </div>

    <el-row :gutter="16" class="summary-row">
      <el-col v-for="(card, index) in summaryCards" :key="card.key" :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="never" class="summary-card" :class="`fade-in-delay-${index + 1}`">
          <div class="card-icon" :style="{ background: card.gradient }">
            <el-icon><component :is="card.icon" /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-label">{{ t(card.labelKey) }}</div>
            <div class="card-value">{{ card.value }}</div>
            <div class="card-trend" :class="card.trendType">
              <el-icon><TrendCharts /></el-icon>
              <span>{{ card.trend }}</span>
              <span class="trend-text">{{ t('crm.summary.comparedToLastWeek') }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="content-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="never" class="pipeline-card">
          <template #header>
            <div class="card-header">
              <div>
                <h3>{{ t('crm.pipeline.title') }}</h3>
                <p>{{ t('crm.pipeline.desc') }}</p>
              </div>
              <div>
                <el-button type="primary" text>{{ t('crm.pipeline.viewDetail') }}</el-button>
              </div>
            </div>
          </template>

          <div class="pipeline-stages">
            <div v-for="stage in pipelineStages" :key="stage.key" class="stage-item">
              <div class="stage-header">
                <div class="stage-name">{{ t(stage.nameKey) }}</div>
                <el-tag size="small" :type="stage.tagType">{{ t(stage.statusKey) }}</el-tag>
              </div>
              <div class="stage-value">{{ stage.dealCount }} {{ t('crm.pipeline.deals') }}</div>
              <div class="stage-amount">{{ stage.amount }}</div>
              <div class="stage-meta">
                <span>{{ t('crm.pipeline.conversion') }} {{ stage.conversion }}</span>
                <span>·</span>
                <span>{{ stage.avgDays }} {{ t('crm.pipeline.days') }}</span>
              </div>
              <el-progress :percentage="stage.progress" :show-text="false" />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="followup-card">
          <template #header>
            <div class="card-header">
              <div>
                <h3>{{ t('crm.followUp.title') }}</h3>
                <p>{{ t('crm.followUp.desc') }}</p>
              </div>
              <el-button text>{{ t('crm.followUp.viewAll') }}</el-button>
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
      </el-col>
    </el-row>

    <el-row :gutter="16" class="content-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <div>
                <h3>{{ t('crm.customers.title') }}</h3>
                <p>{{ t('crm.customers.desc') }}</p>
              </div>
              <div class="table-actions">
                <el-select v-model="filters.owner" size="small" class="filter-select">
                  <el-option
                    v-for="owner in ownerOptions"
                    :key="owner.value"
                    :label="owner.label"
                    :value="owner.value"
                  />
                </el-select>
                <el-input
                  v-model="filters.keyword"
                  size="small"
                  :placeholder="t('crm.customers.searchPlaceholder')"
                  prefix-icon="Search"
                  clearable
                />
              </div>
            </div>
          </template>

          <el-table :data="customerList" row-key="id" stripe class="customer-table">
            <el-table-column prop="name" :label="t('crm.customers.columns.name')" min-width="160">
              <template #default="{ row }">
                <div class="customer-name-cell">
                  <el-avatar :size="32">{{ row.name.charAt(0) }}</el-avatar>
                  <div>
                    <div class="customer-name">{{ row.name }}</div>
                    <div class="customer-tags">
                      <el-tag v-for="tag in row.tags" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" :label="t('crm.customers.columns.stage')" width="140">
              <template #default="{ row }">
                <el-tag :type="row.stageTag">{{ t(row.stageKey) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="latestFollowUp" :label="t('crm.customers.columns.lastFollowUp')" width="160" />
            <el-table-column prop="owner" :label="t('crm.customers.columns.owner')" width="120" />
            <el-table-column prop="nextAction" :label="t('crm.customers.columns.nextAction')" min-width="180" />
            <el-table-column fixed="right" width="140">
              <template #header>
                <span>{{ t('crm.customers.columns.operations') }}</span>
              </template>
              <template #default>
                <el-button link type="primary" size="small">{{ t('crm.common.viewDetail') }}</el-button>
                <el-button link size="small">{{ t('crm.common.followUp') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="insight-card">
          <template #header>
            <div class="card-header">
              <div>
                <h3>{{ t('crm.ai.title') }}</h3>
                <p>{{ t('crm.ai.desc') }}</p>
              </div>
              <el-button text>{{ t('crm.ai.refresh') }}</el-button>
            </div>
          </template>

          <div class="ai-suggestions">
            <div v-for="item in aiSuggestions" :key="item.id" class="ai-item">
              <div class="ai-tag">
                <el-tag size="small" type="warning">{{ t(item.tagKey) }}</el-tag>
              </div>
              <div class="ai-content">
                <p>{{ item.content }}</p>
                <div class="ai-meta">
                  <span>{{ item.related }}</span>
                  <el-button text size="small">{{ t('crm.common.viewDetail') }}</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="activity-card">
          <template #header>
            <div class="card-header">
              <div>
                <h3>{{ t('crm.activities.title') }}</h3>
                <p>{{ t('crm.activities.desc') }}</p>
              </div>
            </div>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :type="activity.type"
              :timestamp="activity.time"
            >
              <div class="activity-item">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-desc">{{ activity.description }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus,
  UserFilled,
  Refresh,
  Connection,
  TrendCharts,
  User,
  ChatLineRound,
  Briefcase,
  Notebook
} from '@element-plus/icons-vue'

const { t } = useI18n()

const hasIntegration = ref(false)

const summaryCards = [
  {
    key: 'customers',
    labelKey: 'crm.summary.customers',
    value: '128',
    trend: '+12%',
    trendType: 'up',
    icon: User,
    gradient: 'linear-gradient(135deg, #5C6BFF 0%, #8296FF 100%)'
  },
  {
    key: 'leads',
    labelKey: 'crm.summary.leads',
    value: '56',
    trend: '+8%',
    trendType: 'up',
    icon: ChatLineRound,
    gradient: 'linear-gradient(135deg, #40C9FF 0%, #6A49FF 100%)'
  },
  {
    key: 'deals',
    labelKey: 'crm.summary.deals',
    value: '18',
    trend: '-5%',
    trendType: 'down',
    icon: Briefcase,
    gradient: 'linear-gradient(135deg, #FFA84C 0%, #FF6871 100%)'
  },
  {
    key: 'followUps',
    labelKey: 'crm.summary.followUps',
    value: '9',
    trend: '+3%',
    trendType: 'up',
    icon: Notebook,
    gradient: 'linear-gradient(135deg, #32C5FF 0%, #6C63FF 100%)'
  }
]

const pipelineStages = [
  {
    key: 'lead',
    nameKey: 'crm.pipeline.stages.lead',
    statusKey: 'crm.pipeline.status.active',
    dealCount: 32,
    amount: '¥120,000',
    conversion: '35%',
    avgDays: 4.2,
    progress: 45,
    tagType: 'success'
  },
  {
    key: 'negotiation',
    nameKey: 'crm.pipeline.stages.negotiation',
    statusKey: 'crm.pipeline.status.warning',
    dealCount: 18,
    amount: '¥86,400',
    conversion: '22%',
    avgDays: 6.1,
    progress: 60,
    tagType: 'warning'
  },
  {
    key: 'proposal',
    nameKey: 'crm.pipeline.stages.proposal',
    statusKey: 'crm.pipeline.status.active',
    dealCount: 12,
    amount: '¥72,500',
    conversion: '18%',
    avgDays: 8.4,
    progress: 75,
    tagType: 'success'
  },
  {
    key: 'contract',
    nameKey: 'crm.pipeline.stages.contract',
    statusKey: 'crm.pipeline.status.focus',
    dealCount: 6,
    amount: '¥53,200',
    conversion: '42%',
    avgDays: 3.8,
    progress: 90,
    tagType: 'danger'
  }
]

const followUps = [
  {
    id: 1,
    time: t('crm.followUp.today') + ' 15:00',
    customer: '深圳市邦德电子',
    actionKey: 'crm.followUp.actions.phoneCall',
    owner: 'test测试',
    statusKey: 'crm.followUp.status.pending',
    tagType: 'warning',
    type: 'warning'
  },
  {
    id: 2,
    time: t('crm.followUp.today') + ' 16:30',
    customer: '广州微梦科技',
    actionKey: 'crm.followUp.actions.sendProposal',
    owner: 'jimmy',
    statusKey: 'crm.followUp.status.inProgress',
    tagType: 'success',
    type: 'success'
  },
  {
    id: 3,
    time: t('crm.followUp.tomorrow') + ' 10:00',
    customer: '上海科讯信息',
    actionKey: 'crm.followUp.actions.visit',
    owner: '张敏',
    statusKey: 'crm.followUp.status.pending',
    tagType: 'warning',
    type: 'warning'
  }
]

const customerList = ref([
  {
    id: 1,
    name: '深圳市邦德电子科技有限公司',
    stageKey: 'crm.customerStage.negotiation',
    stageTag: 'warning',
    latestFollowUp: t('crm.followUp.today') + ' 11:30',
    owner: 'test测试',
    nextAction: t('crm.customers.nextActions.sendQuotation'),
    tags: ['制造业', '重点客户']
  },
  {
    id: 2,
    name: '广州微梦科技发展有限公司',
    stageKey: 'crm.customerStage.proposal',
    stageTag: 'success',
    latestFollowUp: t('crm.followUp.yesterday') + ' 16:10',
    owner: 'jimmy',
    nextAction: t('crm.customers.nextActions.scheduleDemo'),
    tags: ['SaaS', '高潜']
  },
  {
    id: 3,
    name: '上海科讯信息有限公司',
    stageKey: 'crm.customerStage.lead',
    stageTag: 'info',
    latestFollowUp: t('crm.followUp.yesterday') + ' 09:20',
    owner: '张敏',
    nextAction: t('crm.customers.nextActions.firstMeeting'),
    tags: ['渠道', '跟进中']
  }
])

const aiSuggestions = [
  {
    id: 1,
    tagKey: 'crm.ai.tags.followUp',
    content: t('crm.ai.suggestions.followUp'),
    related: '深圳市邦德电子科技有限公司 · test测试'
  },
  {
    id: 2,
    tagKey: 'crm.ai.tags.risk',
    content: t('crm.ai.suggestions.risk'),
    related: '广州微梦科技 · jimmy'
  },
  {
    id: 3,
    tagKey: 'crm.ai.tags.opportunity',
    content: t('crm.ai.suggestions.opportunity'),
    related: '上海科讯信息 · 张敏'
  }
]

const recentActivities = [
  {
    id: 1,
    time: t('crm.followUp.today') + ' 11:15',
    type: 'primary',
    title: t('crm.activities.items.callTitle'),
    description: t('crm.activities.items.callDesc')
  },
  {
    id: 2,
    time: t('crm.followUp.today') + ' 09:30',
    type: 'success',
    title: t('crm.activities.items.contractTitle'),
    description: t('crm.activities.items.contractDesc')
  },
  {
    id: 3,
    time: t('crm.followUp.yesterday') + ' 17:40',
    type: 'info',
    title: t('crm.activities.items.noteTitle'),
    description: t('crm.activities.items.noteDesc')
  }
]

const ownerOptions = [
  { label: '全部负责人', value: 'all' },
  { label: 'test测试', value: 'test' },
  { label: 'jimmy', value: 'jimmy' },
  { label: '张敏', value: 'zhangmin' }
]

const filters = reactive({
  owner: 'all',
  keyword: ''
})
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
    margin-bottom: 24px;

    .title-block {
      .page-title {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
        color: #1f2329;
      }

      .page-subtitle {
        margin-top: 8px;
        font-size: 14px;
        color: #6b7280;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
  }

  .integration-alert {
    margin-bottom: 20px;
  }

  .summary-row {
    margin-bottom: 24px;

    .summary-card {
      display: flex;
      align-items: center;
      gap: 16px;
      border-radius: 16px;

      .card-icon {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        flex-shrink: 0;

        .el-icon {
          font-size: 26px;
        }
      }

      .card-content {
        flex: 1;

        .card-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 6px;
        }

        .card-value {
          font-size: 26px;
          font-weight: 600;
          color: #1f2329;
          margin-bottom: 4px;
        }

        .card-trend {
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 4px;

          &.up {
            color: #2ecc71;
          }

          &.down {
            color: #ff6b6b;
          }

          .trend-text {
            color: #9ca3af;
          }
        }
      }
    }
  }

  .content-row {
    margin-bottom: 24px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    p {
      margin: 6px 0 0;
      font-size: 13px;
      color: #6b7280;
    }
  }

  .pipeline-card {
    .pipeline-stages {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;

      .stage-item {
        padding: 16px;
        border: 1px solid #edf0f7;
        border-radius: 12px;
        background: #f9fbff;

        .stage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .stage-name {
            font-weight: 600;
            color: #1f2329;
          }
        }

        .stage-value {
          font-size: 20px;
          font-weight: 600;
          color: #1f2329;
        }

        .stage-amount {
          margin: 4px 0;
          color: #6b7280;
        }

        .stage-meta {
          display: flex;
          gap: 6px;
          color: #9ca3af;
          font-size: 13px;
          margin-bottom: 10px;
        }
      }
    }
  }

  .followup-card {
    .followup-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .followup-customer {
        font-weight: 600;
        color: #1f2329;
      }

      .followup-info {
        font-size: 13px;
        color: #6b7280;
        display: flex;
        gap: 6px;
      }
    }
  }

  .customer-table {
    .customer-name-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      .customer-name {
        font-weight: 600;
        color: #1f2329;
      }

      .customer-tags {
        display: flex;
        gap: 6px;
        margin-top: 4px;
      }
    }
  }

  .table-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .filter-select {
    width: 160px;
  }

  .insight-card {
    margin-bottom: 16px;

    .ai-suggestions {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .ai-item {
        padding: 12px;
        border-radius: 12px;
        background: #f9fbff;
        border: 1px solid #edf0f7;

        .ai-content {
          margin-top: 8px;
          color: #1f2329;
          line-height: 1.5;

          .ai-meta {
            margin-top: 12px;
            font-size: 13px;
            color: #6b7280;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
        }
      }
    }
  }

  .activity-card {
    .activity-item {
      .activity-title {
        font-weight: 600;
        color: #1f2329;
      }

      .activity-desc {
        font-size: 13px;
        color: #6b7280;
      }
    }
  }
}
</style>
