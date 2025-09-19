import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@stores/user';
import router from '@/router';

/**
 * 创建 axios 实例
 */
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 用于防止多次刷新token的标记
let isRefreshing = false;
let failedRequestsQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

/**
 * 请求拦截器
 */
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();

    // 添加访问令牌到请求头
    const accessToken = userStore.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 */
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;

    // 如果响应成功，直接返回数据
    if (res.success) {
      return response;
    }

    // 处理业务错误
    ElMessage.error(res.message || '请求失败');
    return Promise.reject(new Error(res.message || '请求失败'));
  },
  async (error) => {
    console.error('响应错误:', error);

    let message = '网络错误';
    const originalRequest = error.config;

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // 如果是401错误且不是刷新token的请求，尝试刷新token
          if (!originalRequest._retry && !originalRequest.url?.includes('/refresh-token')) {
            originalRequest._retry = true;

            if (isRefreshing) {
              // 如果正在刷新，将请求加入队列
              return new Promise((resolve, reject) => {
                failedRequestsQueue.push({ resolve, reject });
              }).then(() => {
                originalRequest.headers.Authorization = `Bearer ${useUserStore().getAccessToken()}`;
                return service.request(originalRequest);
              });
            }

            try {
              isRefreshing = true;
              const userStore = useUserStore();
              const success = await userStore.refreshAccessToken();

              if (success) {
                // 处理队列中的请求
                failedRequestsQueue.forEach(({ resolve }) => {
                  resolve();
                });
                failedRequestsQueue = [];

                // 重新发送原始请求
                originalRequest.headers.Authorization = `Bearer ${userStore.getAccessToken()}`;
                return service.request(originalRequest);
              } else {
                throw new Error('刷新token失败');
              }
            } catch (refreshError) {
              // 刷新失败，清除队列并登出
              failedRequestsQueue.forEach(({ reject }) => {
                reject(refreshError);
              });
              failedRequestsQueue = [];

              const userStore = useUserStore();
              await userStore.logout();
              router.push('/login');
              message = '登录已过期，请重新登录';
            } finally {
              isRefreshing = false;
            }
          } else {
            message = '登录已过期，请重新登录';
            const userStore = useUserStore();
            await userStore.logout();
            router.push('/login');
          }
          break;
        case 403:
          message = '权限不足';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 422:
          message = data?.message || '数据验证失败';
          break;
        case 500:
          message = '服务器内部错误';
          break;
        default:
          message = data?.message || `请求失败 (${status})`;
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时';
    } else if (error.message?.includes('Network Error')) {
      message = '网络连接失败';
    }

    ElMessage.error(message);
    return Promise.reject(error);
  }
);

/**
 * 请求方法封装
 */
export const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.get(url, config).then((res) => res.data);
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.post(url, data, config).then((res) => res.data);
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.put(url, data, config).then((res) => res.data);
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.delete(url, config).then((res) => res.data);
  },

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.patch(url, data, config).then((res) => res.data);
  },
};

/**
 * 确认对话框
 */
export const confirmDialog = (message: string, title: string = '确认操作', type: 'warning' | 'error' | 'info' = 'warning') => {
  return ElMessageBox.confirm(message, title, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type,
    center: true,
  });
};

export default service;
