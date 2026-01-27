import axios from 'axios';

// 获取API基础URL
// 1. 优先使用环境变量
// 2. 如果没有，则根据当前访问地址自动推断
export function getApiBaseURL(): string {
  // 环境变量中的配置
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // 自动检测：根据当前访问的 host 判断
  const currentHost = window.location.hostname;
  
  // 开发机本地访问：使用后端 3002 端口
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:3002/api';
  }
  
  // 其它情况（例如通过 ngrok 访问）：统一走同源 /api，交给 Vite 或网关做反向代理
  return '/api';
}

// 创建axios实例
// 说明：容量扫描等操作在大盘符上可能比较慢，这里把全局超时时间调大一点，避免频繁 timeout
const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 60000, // 60 秒全局超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: any) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // 处理HTTP错误
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 未授权，清除token并跳转登录页
          // 但如果是创建文件夹等操作，先显示错误信息
          const errorMessage = data?.message || '未授权，请重新登录';
          console.error('401错误:', errorMessage);
          
          // 延迟跳转，让错误信息先显示
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }, 100);
          break;
        case 403:
          console.error('权限不足:', data?.message);
          break;
        case 500:
          console.error('服务器错误:', data?.message);
          break;
        default:
          console.error(data?.message || '请求失败');
      }
    } else {
      // 网络错误或其他错误
      console.error('请求错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

