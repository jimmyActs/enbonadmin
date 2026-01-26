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
  
  // 自动检测：如果当前访问的不是localhost，则使用当前host
  const currentHost = window.location.hostname;
  
  // 如果是localhost或127.0.0.1，使用默认后端地址
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:3002/api';
  }
  
  // 否则使用当前host，后端端口3002
  // 如需其它端口/域名，请通过 VITE_API_BASE_URL 覆盖
  return `http://${currentHost}:3002/api`;
}

// 创建axios实例
const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
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

