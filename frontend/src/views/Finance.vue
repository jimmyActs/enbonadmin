<template>
  <div class="finance-container page-content-enter">
    <el-card class="fade-in-up">
      <template #header>
        <div class="card-header">
          <h2>{{ $t('finance.title') }}</h2>
        </div>
      </template>
      <el-empty :description="$t('finance.inDevelopment')" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.finance-container {
  .card-header {
    font-size: 18px;
    font-weight: bold;
  }
}
</style>

