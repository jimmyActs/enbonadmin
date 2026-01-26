<script setup lang="ts">
import { onMounted } from 'vue'

// 确保动画元素在合理时间内可见（回退机制）
onMounted(() => {
  // 如果动画在 2 秒后仍未完成，强制显示所有内容
  setTimeout(() => {
    const animatedElements = document.querySelectorAll(
      '.fade-in-up, .fade-in-card, .fade-in-delay-1, .fade-in-delay-2, .fade-in-delay-3, .fade-in-delay-4, .fade-in-delay-5, .fade-in-delay-6, .fade-in-delay-7, .fade-in-delay-8, .page-content-enter'
    )
    animatedElements.forEach((el) => {
      const element = el as HTMLElement
      // 检查元素是否仍然不可见
      if (element.style.opacity === '0' || window.getComputedStyle(element).opacity === '0') {
        // 强制显示
        element.style.opacity = '1'
        element.style.transform = 'none'
      }
    })
  }, 2000) // 2秒后检查
})
</script>

<template>
  <router-view />
</template>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
