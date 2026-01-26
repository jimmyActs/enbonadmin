import { createI18n } from 'vue-i18n'
import zhCN from '../locales/zh-CN'
import enUS from '../locales/en-US'

// 从localStorage获取保存的语言设置，默认为中文
const savedLocale = localStorage.getItem('locale') || 'zh-CN'

const i18n = createI18n({
  legacy: false, // 使用Composition API模式
  locale: savedLocale,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export default i18n

// 语言切换函数
export const setLocale = (locale: 'zh-CN' | 'en-US') => {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
}

// 获取当前语言
export const getLocale = (): 'zh-CN' | 'en-US' => {
  return (i18n.global.locale.value as 'zh-CN' | 'en-US') || 'zh-CN'
}

