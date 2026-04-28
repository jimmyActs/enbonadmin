<template>
  <el-dropdown @command="handleLanguageChange" trigger="click">
    <span class="language-switcher">
      <el-icon><Operation /></el-icon>
      <span>{{ currentLanguageLabel }}</span>
      <el-icon><ArrowDown /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          command="zh-CN"
          :class="{ 'is-active': currentLocale === 'zh-CN' }"
        >
          <span>🇨🇳</span>
          <span style="margin-left: 8px">中文</span>
        </el-dropdown-item>
        <el-dropdown-item
          command="en-US"
          :class="{ 'is-active': currentLocale === 'en-US' }"
        >
          <span>🇺🇸</span>
          <span style="margin-left: 8px">English</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Operation, ArrowDown } from '@element-plus/icons-vue'
import { setLocale, getLocale } from '../i18n'
import { ElMessage } from 'element-plus'

const { locale } = useI18n()

const currentLocale = computed(() => getLocale())

const currentLanguageLabel = computed(() => {
  // 显示可以切换到的语言（与当前语言相反）
  return currentLocale.value === 'zh-CN' ? 'English' : '中文'
})

const handleLanguageChange = (lang: 'zh-CN' | 'en-US') => {
  if (lang === currentLocale.value) return

  setLocale(lang)
  locale.value = lang

  ElMessage.success(lang === 'zh-CN' ? '已切换到中文' : 'Switched to English')
}
</script>

<style scoped lang="scss">
.language-switcher {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #666;
  padding: 0 12px;
  height: 100%;
  transition: color 0.3s;

  .el-icon {
    margin: 0 4px;
    font-size: 16px;
  }

  &:hover {
    color: #409eff;
  }
}

:deep(.el-dropdown-menu__item.is-active) {
  color: #409eff;
  font-weight: 500;
}
</style>

