<template>
  <div class="analytics-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><DataAnalysis /></el-icon>
            <span>{{ $t('crm.analytics.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button-group>
              <el-button :type="trendPeriod === 'day' ? 'primary' : ''" size="small" @click="setTrendPeriod('day')">
                {{ $t('crm.analytics.periodDay') }}
              </el-button>
              <el-button :type="trendPeriod === 'week' ? 'primary' : ''" size="small" @click="setTrendPeriod('week')">
                {{ $t('crm.analytics.periodWeek') }}
              </el-button>
              <el-button :type="trendPeriod === 'month' ? 'primary' : ''" size="small" @click="setTrendPeriod('month')">
                {{ $t('crm.analytics.periodMonth') }}
              </el-button>
            </el-button-group>
            <el-button :icon="Refresh" size="small" @click="loadAll">{{ $t('crm.actions.refresh') }}</el-button>
          </div>
        </div>
      </template>

      <!-- 渠道转化率 -->
      <el-row :gutter="16" class="section-row">
        <!-- 渠道对比（商机来源转化漏斗） -->
        <el-col :xs="24" :lg="12">
          <div class="chart-card">
            <div class="chart-title">{{ $t('crm.analytics.channelConversion') }}</div>
            <p class="chart-desc">{{ $t('crm.analytics.channelConversionDesc') }}</p>
            <div class="chart-container">
              <v-chart :key="`ch-${chartAnimKey}`" :option="channelChartOption" autoresize style="height: 320px;" />
            </div>
          </div>
        </el-col>

        <!-- 渠道转化详情表 -->
        <el-col :xs="24" :lg="12">
          <div class="chart-card">
            <div class="chart-title">{{ $t('crm.analytics.channelConversionTable') }}</div>
            <p class="chart-desc">{{ $t('crm.analytics.channelConversionTableDesc') }}</p>
            <el-table :data="channelData" stripe size="small" class="channel-table full-width-table" v-loading="loadingChannel">
              <el-table-column :label="$t('crm.analytics.channel')" min-width="100">
                <template #default="{ row }">
                  <div class="channel-cell">
                    <span class="channel-dot" :style="{ background: row.color }"></span>
                    <span>{{ row.channelName }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('crm.analytics.totalLeads')" width="90" align="right">
                <template #default="{ row }">
                  <span class="num-value">{{ row.totalLeads }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('crm.analytics.convertedCustomers')" width="100" align="right">
                <template #default="{ row }">
                  <span class="num-value success">{{ row.convertedCustomers }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('crm.analytics.conversionRate')" width="110" align="right">
                <template #default="{ row }">
                  <span class="num-value" :class="getRateClass(row.conversionRate)">{{ row.conversionRate }}%</span>
                  <el-progress
                    :percentage="row.conversionRate"
                    :show-text="false"
                    :stroke-width="4"
                    :color="getProgressColor(row.conversionRate)"
                    style="width: 60px; display: inline-block; vertical-align: middle; margin-left: 6px;"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>

      <!-- 趋势图 + 国家热度 -->
      <el-row :gutter="16" class="section-row">
        <!-- 日/周/月趋势图 -->
        <el-col :xs="24" :lg="14">
          <div class="chart-card">
            <div class="chart-title">{{ $t('crm.analytics.trendChart') }}</div>
            <p class="chart-desc">{{ $t('crm.analytics.trendChartDesc') }}</p>
            <div class="chart-container">
              <v-chart :key="`tr-${chartAnimKey}`" :option="trendChartOption" autoresize style="height: 340px;" v-loading="loadingTrend" />
            </div>
          </div>
        </el-col>

        <!-- 国家热度图（横向柱状） -->
        <el-col :xs="24" :lg="10">
          <div class="chart-card">
            <div class="chart-title">{{ $t('crm.analytics.countryHeatmap') }}</div>
            <p class="chart-desc">{{ $t('crm.analytics.countryHeatmapDesc') }}</p>
            <div class="chart-container">
              <v-chart :key="`co-${chartAnimKey}`" :option="countryChartOption" autoresize style="height: 340px;" v-loading="loadingCountry" />
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 渠道来源网站细分 -->
      <el-row :gutter="16" class="section-row">
        <el-col :span="24">
          <div class="chart-card">
            <div class="chart-title">{{ $t('crm.analytics.websiteDetail') }}</div>
            <p class="chart-desc">{{ $t('crm.analytics.websiteDetailDesc') }}</p>
            <el-table :data="websiteData" stripe size="small" class="channel-table full-width-table" v-loading="loadingWebsite">
              <el-table-column :label="$t('crm.analytics.website')" min-width="160">
                <template #default="{ row }">
                  <div class="channel-cell">
                    <span class="channel-dot" :style="{ background: getWebsiteColor(row.websiteType) }"></span>
                    <span>{{ row.websiteName }}</span>
                    <el-tag size="small" style="margin-left: 6px;">{{ row.channelName }}</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('crm.analytics.totalLeads')" width="90" align="right">
                <template #default="{ row }">
                  <span class="num-value">{{ row.totalLeads }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('crm.analytics.convertedCustomers')" width="110" align="right">
                <template #default="{ row }">
                  <span class="num-value success">{{ row.convertedCustomers }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('crm.analytics.conversionRate')" width="150" align="right">
                <template #default="{ row }">
                  <span class="num-value" :class="getRateClass(row.conversionRate)">{{ row.conversionRate }}%</span>
                  <el-progress
                    :percentage="row.conversionRate"
                    :show-text="false"
                    :stroke-width="6"
                    :color="getProgressColor(row.conversionRate)"
                    style="width: 60px; display: inline-block; vertical-align: middle; margin-left: 8px;"
                  />
                </template>
              </el-table-column>
              <el-table-column :label="$t('crm.analytics.distribution')" width="200">
                <template #default="{ row }">
                  <div class="mini-bar-wrap">
                    <div class="mini-bar" :style="{
                      width: (row.totalLeads / maxWebsiteLeads * 100) + '%',
                      background: getWebsiteColor(row.websiteType)
                    }"></div>
                    <span class="mini-bar-label">{{ Math.round(row.totalLeads / maxWebsiteLeads * 100) }}%</span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Refresh } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, DataZoomComponent
} from 'echarts/components'
import {
  getCrmChannelConversion, getCrmWebsiteConversion, getCrmTrends, getCrmCountryStats,
  type CrmChannelConversion, type CrmWebsiteConversion, type CrmTrendItem, type CrmCountryStat,
  type TrendPeriod,
} from '../../api/crm'

type ChannelTableRow = CrmChannelConversion & { color: string }

use([CanvasRenderer, BarChart, LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent])

const props = withDefaults(defineProps<{ active?: boolean }>(), { active: true })

const { t, locale } = useI18n()

/** 每次进入「数据分析」Tab 或刷新时递增，强制图表重挂载以播放入场动画 */
const chartAnimKey = ref(0)

const bumpChartAnim = () => {
  nextTick(() => { chartAnimKey.value += 1 })
}

watch(
  () => props.active,
  (v) => {
    if (v) bumpChartAnim()
  },
)

const ECHARTS_ANIM = {
  animation: true,
  animationDuration: 1100,
  animationEasing: 'cubicOut' as const,
  animationDurationUpdate: 720,
  animationEasingUpdate: 'cubicInOut' as const,
}

const loadingChannel = ref(false)
const loadingWebsite = ref(false)
const loadingTrend = ref(false)
const loadingCountry = ref(false)
const trendPeriod = ref<TrendPeriod>('month')

const channelData = ref<ChannelTableRow[]>([])
const websiteData = ref<CrmWebsiteConversion[]>([])
const trendData = ref<CrmTrendItem[]>([])
const countryData = ref<CrmCountryStat[]>([])

const CHANNEL_COLORS = ['#5C6BFF', '#40C9FF', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

const maxWebsiteLeads = computed(() => Math.max(...websiteData.value.map(w => w.totalLeads), 1))

const setTrendPeriod = (period: TrendPeriod) => {
  trendPeriod.value = period
  loadTrends()
}

// ============ 渠道漏斗图 ============
const channelChartOption = computed(() => {
  const sorted = [...channelData.value].sort((a, b) => b.totalLeads - a.totalLeads)
  const names = sorted.map(c => c.channelName)
  const leads = sorted.map(c => c.totalLeads)
  const converted = sorted.map(c => c.convertedCustomers)
  const colors = sorted.map((_, i) => CHANNEL_COLORS[i % CHANNEL_COLORS.length])

  return {
    ...ECHARTS_ANIM,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any[]) => {
        const p = params[0]
        const c = params[1]
        const rate = sorted[p.dataIndex]?.conversionRate || 0
        return `<b>${p.name}</b><br/>
          ${t('crm.analytics.totalLeads')}: <b>${p.value}</b><br/>
          ${t('crm.analytics.convertedCustomers')}: <b>${c?.value || 0}</b><br/>
          ${t('crm.analytics.conversionRate')}: <b>${rate}%</b>`
      }
    },
    legend: {
      data: [t('crm.analytics.totalLeads'), t('crm.analytics.convertedCustomers')],
      bottom: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { fontSize: 11, color: '#6b7280', rotate: locale.value === 'zh-CN' ? 0 : 0 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7280' },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [
      {
        name: t('crm.analytics.totalLeads'),
        type: 'bar',
        data: leads,
        itemStyle: { color: (p: any) => colors[p.dataIndex % colors.length], borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
        animationDelay: (idx: number) => idx * 70,
      },
      {
        name: t('crm.analytics.convertedCustomers'),
        type: 'bar',
        data: converted,
        itemStyle: { color: '#22c55e', opacity: 0.7, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
        animationDelay: (idx: number) => idx * 70 + 120,
      },
    ],
  }
})

// ============ 趋势图 ============
const trendChartOption = computed(() => {
  const periods = trendData.value.map(t => t.period)
  const leadSeries = trendData.value.map(t => t.leads)
  const customerSeries = trendData.value.map(t => t.customers)

  return {
    ...ECHARTS_ANIM,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: any[]) => {
        const date = params[0].name
        const lead = params.find((p: any) => p.seriesName === t('crm.analytics.newLeads'))?.value || 0
        const cust = params.find((p: any) => p.seriesName === t('crm.analytics.newCustomers'))?.value || 0
        return `<b>${date}</b><br/>
          ${t('crm.analytics.newLeads')}: <b>${lead}</b><br/>
          ${t('crm.analytics.newCustomers')}: <b>${cust}</b>`
      }
    },
    legend: {
      data: [t('crm.analytics.newLeads'), t('crm.analytics.newCustomers')],
      bottom: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: periods,
      boundaryGap: false,
      axisLabel: { fontSize: 11, color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: { color: '#6b7280' },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        minInterval: 1,
      }
    ],
    series: [
      {
        name: t('crm.analytics.newLeads'),
        type: 'line',
        data: leadSeries,
        smooth: 0.35,
        lineStyle: { width: 2.5, color: '#5C6BFF' },
        itemStyle: { color: '#5C6BFF' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(92,107,255,0.25)' }, { offset: 1, color: 'rgba(92,107,255,0.02)' }] } },
        symbol: 'circle',
        symbolSize: 5,
        animationDelay: (idx: number) => idx * 28,
      },
      {
        name: t('crm.analytics.newCustomers'),
        type: 'line',
        data: customerSeries,
        smooth: 0.35,
        lineStyle: { width: 2.5, color: '#22c55e' },
        itemStyle: { color: '#22c55e' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(34,197,94,0.2)' }, { offset: 1, color: 'rgba(34,197,94,0.02)' }] } },
        symbol: 'circle',
        symbolSize: 5,
        animationDelay: (idx: number) => idx * 28 + 80,
      },
    ],
    dataZoom: periods.length > 12 ? [{ type: 'inside', start: 0, end: 100 }] : undefined,
  }
})

// ============ 国家热度图（横向柱状） ============
const countryChartOption = computed(() => {
  const sorted = [...countryData.value].sort((a, b) => b.count - a.count).slice(0, 15)
  const countries = sorted.map(c => c.country)
  const counts = sorted.map(c => c.count)
  const maxCount = Math.max(...counts, 1)

  const colorList = [
    '#5C6BFF', '#6d80ff', '#8294ff', '#a0adff',
    '#40C9FF', '#36d4ff', '#2dd9ff', '#22d8ff',
    '#36d4b5', '#2ecfa8', '#22c55e', '#4ade80',
  ]

  return {
    ...ECHARTS_ANIM,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any[]) => {
        const p = params[0]
        const rank = sorted.findIndex(c => c.country === p.name) + 1
        return `<b>${p.name}</b> (${t('crm.analytics.rank')} #${rank})<br/>
          ${t('crm.analytics.customerCount')}: <b>${p.value}</b>`
      }
    },
    grid: { left: '3%', right: '12%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#6b7280' },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      max: Math.ceil(maxCount * 1.1),
    },
    yAxis: {
      type: 'category',
      data: [...countries].reverse(),
      axisLabel: { fontSize: 11, color: '#6b7280' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: [...counts].reverse(),
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: (p: any) => {
            const idx = p.dataIndex % colorList.length
            return {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: colorList[idx] },
                { offset: 1, color: `${colorList[idx]}55` },
              ]
            }
          }
        },
        barMaxWidth: 24,
        animationDelay: (idx: number) => idx * 45,
        label: {
          show: true,
          position: 'right',
          formatter: '{c}',
          fontSize: 11,
          color: '#6b7280',
        },
      },
    ],
  }
})

// ============ 工具函数 ============
const getRateClass = (rate: number) => rate >= 30 ? 'high' : rate >= 10 ? 'mid' : 'low'
const getProgressColor = (rate: number) => rate >= 30 ? '#22c55e' : rate >= 10 ? '#f59e0b' : '#ef4444'

const websiteTypeColors: Record<string, string> = {
  official: '#5C6BFF',
  b2b_portal: '#40C9FF',
  alibaba: '#f59e0b',
  made_in_china: '#fb923c',
  facebook: '#3b82f6',
  linkedin: '#0ea5e9',
  instagram: '#ec4899',
  other: '#8b5cf6',
}
const getWebsiteColor = (type: string) => websiteTypeColors[type] || '#8b5cf6'

// ============ 数据加载 ============
const loadChannels = async () => {
  loadingChannel.value = true
  try {
    const rows = await getCrmChannelConversion()
    channelData.value = rows.map((row, i) => ({
      ...row,
      color: CHANNEL_COLORS[i % CHANNEL_COLORS.length] ?? '#5C6BFF',
    }))
  } catch (e: any) { ElMessage.error(e?.message || t('common.error')) }
  finally { loadingChannel.value = false }
}

const loadWebsites = async () => {
  loadingWebsite.value = true
  try {
    websiteData.value = await getCrmWebsiteConversion()
  } catch (e: any) { ElMessage.error(e?.message || t('common.error')) }
  finally { loadingWebsite.value = false }
}

const loadTrends = async () => {
  loadingTrend.value = true
  try {
    const range = trendPeriod.value === 'day' ? 30 : trendPeriod.value === 'week' ? 12 : 12
    trendData.value = await getCrmTrends({ period: trendPeriod.value, range })
  } catch (e: any) { ElMessage.error(e?.message || t('common.error')) }
  finally { loadingTrend.value = false }
}

const loadCountries = async () => {
  loadingCountry.value = true
  try {
    countryData.value = await getCrmCountryStats()
  } catch (e: any) { ElMessage.error(e?.message || t('common.error')) }
  finally { loadingCountry.value = false }
}

const loadAll = async () => {
  await Promise.all([loadChannels(), loadWebsites(), loadTrends(), loadCountries()])
  if (props.active) bumpChartAnim()
}

onMounted(() => { loadAll() })
</script>

<style scoped lang="scss">
.analytics-module {
  .module-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    background: #fff;
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      color: #1d1d1f;
      .header-left { display: flex; align-items: center; gap: 8px; }
      .header-actions { display: flex; align-items: center; gap: 10px; }
    }
  }

  .section-row {
    margin-bottom: 20px;
    :deep(.el-col:nth-child(1)) .chart-card { animation-delay: 0.04s; }
    :deep(.el-col:nth-child(2)) .chart-card { animation-delay: 0.1s; }
  }

  .chart-card {
    animation: chartBlockIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    padding: 16px;
    border: 1px solid rgba(15, 23, 42, 0.06);
    border-radius: 14px;
    background: linear-gradient(180deg, #fafbff 0%, #f5f7fc 100%);
    height: 100%;
    .chart-title {
      font-size: 15px;
      font-weight: 600;
      color: #1f2329;
      margin-bottom: 4px;
    }
    .chart-desc {
      font-size: 12px;
      color: #9ca3af;
      margin: 0 0 12px;
    }
    .chart-container {
      background: #fff;
      border-radius: 8px;
      padding: 8px 4px 4px;
    }
  }

  .channel-table {
    &.full-width-table {
      width: 100% !important;
    }
    .channel-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      .channel-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
    }
    .num-value {
      font-weight: 600;
      font-size: 13px;
      &.success { color: #22c55e; }
      &.high { color: #22c55e; }
      &.mid { color: #f59e0b; }
      &.low { color: #ef4444; }
    }
  }

  .mini-bar-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    .mini-bar {
      height: 8px;
      border-radius: 4px;
      min-width: 4px;
      max-width: 100px;
      transition: width 0.3s;
    }
    .mini-bar-label {
      font-size: 11px;
      color: #9ca3af;
      white-space: nowrap;
    }
  }
}

@keyframes chartBlockIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
