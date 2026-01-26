import { createApp } from 'vue'
import './style.css'
import './styles/theme.scss'
import './styles/animations.scss'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import { createPinia } from 'pinia'
import router from './router'
import i18n, { getLocale } from './i18n'

const app = createApp(App)
const pinia = createPinia()

// 根据当前语言设置Element Plus的locale
const currentLocale = getLocale()
const elementLocale = currentLocale === 'zh-CN' ? zhCn : en

app.use(ElementPlus, { locale: elementLocale })
app.use(pinia)
app.use(router)
app.use(i18n)
app.mount('#app')
