<template>
  <div class="sales-container page-content-enter">
    <div class="page-header fade-in-up">
      <div class="title-block">
        <h1 class="page-title">{{ $t('sales.title') }}</h1>
        <p class="page-subtitle">{{ $t('sales.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" size="large" @click="loadAll">
          {{ $t('crm.actions.refresh') }}
        </el-button>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="sales-tabs fade-in-up">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane name="quotation">
          <template #label>
            <el-icon><Document /></el-icon>
            {{ $t('sales.modules.quotation') }}
          </template>
        </el-tab-pane>
        <el-tab-pane name="targets">
          <template #label>
            <el-icon><Aim /></el-icon>
            {{ $t('sales.modules.targets') }}
          </template>
        </el-tab-pane>
        <el-tab-pane name="customers">
          <template #label>
            <el-icon><User /></el-icon>
            {{ $t('sales.modules.customers') }}
          </template>
        </el-tab-pane>
        <el-tab-pane name="review">
          <template #label>
            <el-icon><DataLine /></el-icon>
            {{ $t('sales.modules.review') }}
          </template>
        </el-tab-pane>
        <el-tab-pane name="shipments">
          <template #label>
            <el-icon><Box /></el-icon>
            {{ $t('sales.modules.shipments') }}
          </template>
        </el-tab-pane>
        <el-tab-pane name="email">
          <template #label>
            <el-icon><Message /></el-icon>
            {{ $t('sales.modules.email') }}
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 报价单 -->
    <div v-show="activeTab === 'quotation'" class="tab-content fade-in-up">
      <QuotationModule ref="quotationRef" />
    </div>

    <!-- 销售目标 -->
    <div v-show="activeTab === 'targets'" class="tab-content fade-in-up">
      <TargetModule ref="targetsRef" />
    </div>

    <!-- 客户记录 -->
    <div v-show="activeTab === 'customers'" class="tab-content fade-in-up">
      <CustomerModule ref="customersRef" />
    </div>

    <!-- 复盘 -->
    <div v-show="activeTab === 'review'" class="tab-content fade-in-up">
      <ReviewModule ref="reviewRef" />
    </div>

    <!-- 出货文件 -->
    <div v-show="activeTab === 'shipments'" class="tab-content fade-in-up">
      <ShipmentModule ref="shipmentsRef" />
    </div>

    <!-- 邮件往来（销售日常工作台） -->
    <div v-show="activeTab === 'email'" class="tab-content fade-in-up">
      <EmailModule ref="emailRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Document, Aim, User, DataLine, Refresh, Box, Message } from '@element-plus/icons-vue'
import QuotationModule from '../components/sales/QuotationModule.vue'
import TargetModule from '../components/sales/TargetModule.vue'
import CustomerModule from '../components/sales/CustomerModule.vue'
import ReviewModule from '../components/sales/ReviewModule.vue'
import ShipmentModule from '../components/crm/ShipmentModule.vue'
import EmailModule from '../components/crm/EmailModule.vue'

const activeTab = ref('quotation')
const quotationRef = ref<InstanceType<typeof QuotationModule>>()
const targetsRef = ref<InstanceType<typeof TargetModule>>()
const customersRef = ref<InstanceType<typeof CustomerModule>>()
const reviewRef = ref<InstanceType<typeof ReviewModule>>()
const shipmentsRef = ref<InstanceType<typeof ShipmentModule>>()
const emailRef = ref<InstanceType<typeof EmailModule>>()

const onTabChange = (tab: string) => {
  activeTab.value = tab
}

const loadAll = () => {
  switch (activeTab.value) {
    case 'quotation': quotationRef.value?.reload(); break
    case 'targets': targetsRef.value?.reload(); break
    case 'customers': customersRef.value?.reload(); break
    case 'review': reviewRef.value?.reload(); break
    case 'shipments': shipmentsRef.value?.reload(); break
    case 'email': emailRef.value?.reload(); break
  }
}
</script>

<style scoped lang="scss">
.sales-container {
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
      .page-title {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
        color: #1f2329;
        letter-spacing: -0.02em;
      }
      .page-subtitle {
        margin-top: 8px;
        font-size: 14px;
        color: #64748b;
      }
    }
  }

  .sales-tabs {
    margin-bottom: 20px;
    background: #fff;
    border-radius: 16px;
    padding: 8px 16px;
    border: 1px solid rgba(15, 23, 42, 0.06);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }
    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }
    :deep(.el-tabs__item) {
      font-size: 15px;
      padding: 0 20px;
      height: 40px;
      line-height: 40px;
      display: flex;
      align-items: center;
      gap: 4px;
      border-radius: 10px;
      transition: all 0.2s ease;
      margin-right: 4px;

      &:hover {
        color: #5C6BFF;
        background: rgba(92, 107, 255, 0.06);
      }
      &.is-active {
        color: #5C6BFF;
        background: rgba(92, 107, 255, 0.1);
        font-weight: 600;
      }
    }
    :deep(.el-tabs__active-bar) {
      display: none;
    }
  }

  .tab-content {
    animation: fadeIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

