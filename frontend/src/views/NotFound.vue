<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1 class="error-title">{{ $t('common.notFound') }}</h1>
      <p class="error-description">
        {{ $t('common.notFoundDesc') }}
      </p>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          {{ $t('common.backToHome') }}
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          {{ $t('common.goBack') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { HomeFilled, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/index')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped lang="scss">
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 600px;
  padding: 40px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);

  .error-code {
    font-size: 120px;
    font-weight: 700;
    color: #409eff;
    line-height: 1;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(64, 158, 255, 0.2);
  }

  .error-title {
    font-size: 32px;
    font-weight: 600;
    color: #1d1d1f;
    margin: 0 0 16px 0;
    letter-spacing: -0.02em;
  }

  .error-description {
    font-size: 16px;
    color: #86868b;
    margin: 0 0 32px 0;
    line-height: 1.6;
  }

  .error-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;

    .el-button {
      border-radius: 10px;
      padding: 12px 24px;
      font-weight: 500;
      letter-spacing: -0.01em;

      .el-icon {
        margin-right: 8px;
      }
    }
  }
}

@media (max-width: 768px) {
  .not-found-content {
    padding: 30px 20px;

    .error-code {
      font-size: 80px;
    }

    .error-title {
      font-size: 24px;
    }

    .error-description {
      font-size: 14px;
    }
  }
}
</style>

