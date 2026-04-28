import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 5173,
    strictPort: false, // 如果端口被占用，自动尝试下一个可用端口
    // 允许通过 Cloudflare Tunnel / 自定义域名访问开发服务
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.loca.lt', '.bore.pub', 'localhost', '127.0.0.1'],
    // 本地开发 & ngrok 访问时，将 /api 的请求代理到后端 http://localhost:3002
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('element-plus')) return 'ui-element-plus'
          if (id.includes('@element-plus/icons-vue')) return 'ui-icons'
          if (id.includes('vue-router')) return 'vendor-vue-router'
          if (id.includes('pinia')) return 'vendor-pinia'
          if (id.includes('vue')) return 'vendor-vue'
          if (id.includes('axios')) return 'vendor-axios'
          return 'vendor'
        },
      },
    },
  },
})
