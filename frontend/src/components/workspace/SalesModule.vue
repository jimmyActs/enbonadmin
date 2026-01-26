<template>
  <div class="sales-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <el-icon><TrendCharts /></el-icon>
          <span>{{ $t('workspace.modules.sales') }}</span>
        </div>
      </template>
      <el-empty description="销售管理功能开发中..." />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { TrendCharts } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.sales-module {
  .module-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #1d1d1f;
    }
  }
}
</style>

