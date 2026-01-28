<template>
  <div class="login-container" :style="loginBgStyle">
    <div class="login-box">
      <div class="login-header">
        <img src="/logo.png" alt="logo" class="logo" />
        <h1>{{ $t('login.title') }}</h1>
        <p class="subtitle">{{ $t('login.subtitle') }}</p>
      </div>

      <el-form
        :model="loginForm"
        :rules="loginRules"
        ref="loginFormRef"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            :placeholder="$t('login.usernamePlaceholder')"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            :placeholder="$t('login.passwordPlaceholder')"
            size="large"
            :prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="loginForm.remember">{{ $t('login.rememberMe') }}</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
          >
            {{ loading ? $t('login.logging') : $t('login.login') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElForm } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '../store/user'
import loginBg from '../../loginbg.webp'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()
const loginFormRef = ref<InstanceType<typeof ElForm>>()
const loading = ref(false)

const STORAGE_KEY = 'enbon_login_info'

const loginForm = reactive({
  username: '',
  password: '',
  remember: false,
})

const loginRules = computed(() => ({
  username: [{ required: true, message: t('login.usernameRequired'), trigger: 'blur' }],
  password: [{ required: true, message: t('login.passwordRequired'), trigger: 'blur' }]
}))

// 登录页背景图样式
const loginBgStyle = computed(() => ({
  backgroundImage: `url(${loginBg})`,
}))

// 从本地读取上次登录信息（记住我）
const loadRememberedLogin = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as { username?: string; password?: string; remember?: boolean }
    loginForm.username = saved.username || ''
    loginForm.password = saved.password || ''
    loginForm.remember = !!saved.remember
  } catch (e) {
    console.warn('读取本地登录信息失败，已忽略:', e)
  }
}

// 保存当前登录信息到本地
const saveRememberedLogin = () => {
  if (loginForm.remember) {
    const payload = {
      username: loginForm.username,
      password: loginForm.password,
      remember: true,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// 初始化时尝试加载记住的账号信息
loadRememberedLogin()

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true

    try {
      await userStore.login({
        username: loginForm.username,
        password: loginForm.password,
        remember: loginForm.remember ? 'true' : 'false',
      })

      // 根据“记住我”选项保存或清除本地账号信息
      saveRememberedLogin()

      ElMessage.success(t('login.loginSuccess'))
      router.push('/')
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || t('login.loginFailed'))
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  background-color: #4f46e5;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  box-sizing: border-box;
}

.login-box {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);

  .login-header {
    text-align: center;
    margin-bottom: 40px;

    .logo {
      height: 64px;
      width: auto;
      margin-bottom: 16px;
    }

    h1 {
      font-size: 24px;
      color: #333;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 14px;
      color: #999;
      margin: 0;
    }
  }

  .login-form {
    .login-button {
      width: 100%;
      margin-top: 10px;
    }
  }
}

@media (max-width: 768px) {
  .login-container {
    padding: 24px 16px;
    align-items: flex-start;
  }

  .login-box {
    padding: 24px 18px 28px;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

    .login-header {
      margin-bottom: 24px;

      .logo {
        height: 52px;
        margin-bottom: 12px;
      }

      h1 {
        font-size: 20px;
      }

      .subtitle {
        font-size: 13px;
      }
    }
  }
}
</style>

