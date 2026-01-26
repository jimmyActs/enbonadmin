<template>
  <div class="sales-container page-content-enter">
    <h1 class="page-title fade-in-up">{{ $t('sales.title') }}</h1>

    <!-- 功能模块标签页 -->
    <el-tabs v-model="activeModule" class="sales-tabs fade-in-delay-2" @tab-change="handleModuleChange">
      <!-- 客户记录 -->
      <el-tab-pane
        :label="$t('sales.modules.customers')"
        name="customers"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><User /></el-icon>
            <span>{{ $t('sales.modules.customers') }}</span>
          </span>
        </template>
        <CustomerModule />
      </el-tab-pane>

      <!-- 目标制定 -->
      <el-tab-pane
        :label="$t('sales.modules.targets')"
        name="targets"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><Aim /></el-icon>
            <span>{{ $t('sales.modules.targets') }}</span>
          </span>
        </template>
        <TargetModule />
      </el-tab-pane>

      <!-- 复盘 -->
      <el-tab-pane
        :label="$t('sales.modules.review')"
        name="review"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><DataAnalysis /></el-icon>
            <span>{{ $t('sales.modules.review') }}</span>
          </span>
        </template>
        <ReviewModule />
      </el-tab-pane>

      <!-- 报价单 -->
      <el-tab-pane
        :label="$t('sales.modules.quotation')"
        name="quotation"
      >
        <template #label>
          <span class="tab-label">
            <el-icon><Document /></el-icon>
            <span>{{ $t('sales.modules.quotation') }}</span>
          </span>
        </template>
        <QuotationModule />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { User, Aim, DataAnalysis, Document } from '@element-plus/icons-vue'

// 导入模块组件
import CustomerModule from '../components/sales/CustomerModule.vue'
import TargetModule from '../components/sales/TargetModule.vue'
import ReviewModule from '../components/sales/ReviewModule.vue'
import QuotationModule from '../components/sales/QuotationModule.vue'

// 当前激活的模块
const activeModule = ref<string>('customers')

// 初始化：设置第一个模块为激活状态
onMounted(() => {
  activeModule.value = 'customers'
})

// 处理模块切换
const handleModuleChange = (moduleKey: string) => {
  activeModule.value = moduleKey
}
</script>

<style scoped lang="scss">
.sales-container {
  padding: 24px;
  background: #f5f5f7;
  min-height: 100vh;

  .page-title {
    margin: 0 0 24px 0;
    font-size: 28px;
    font-weight: 600;
    color: #1d1d1f;
    letter-spacing: -0.02em;
  }

  .sales-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 24px;
      background: #ffffff;
      border-radius: 16px;
      padding: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    :deep(.el-tabs__nav-wrap) {
      &::after {
        display: none;
      }
    }

    :deep(.el-tabs__item) {
      border-radius: 12px;
      padding: 12px 20px;
      margin-right: 8px;
      font-weight: 500;
      color: #86868b;
      transition: all 0.2s ease;

      &:hover {
        color: #007aff;
        background: #f5f5f7;
      }

      &.is-active {
        color: #007aff;
        background: #e8f4ff;
      }
    }

    .tab-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}
</style>

