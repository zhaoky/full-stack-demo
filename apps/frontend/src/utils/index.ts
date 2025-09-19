import { ElMessage, ElNotification } from 'element-plus';
import type { NotificationConfig } from '@types/index';

/**
 * 格式化日期
 */
export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format.replace('YYYY', String(year)).replace('MM', month).replace('DD', day).replace('HH', hours).replace('mm', minutes).replace('ss', seconds);
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(func: T, limit: number): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 深拷贝
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * 获取文件扩展名
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 验证邮箱格式
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证密码强度
 */
export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) {
    return { valid: false, message: '密码至少需要6个字符' };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: '密码必须包含小写字母' };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: '密码必须包含大写字母' };
  }

  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }

  return { valid: true, message: '密码强度良好' };
};

/**
 * 成功提示
 */
export const showSuccess = (message: string) => {
  ElMessage.success(message);
};

/**
 * 错误提示
 */
export const showError = (message: string) => {
  ElMessage.error(message);
};

/**
 * 警告提示
 */
export const showWarning = (message: string) => {
  ElMessage.warning(message);
};

/**
 * 信息提示
 */
export const showInfo = (message: string) => {
  ElMessage.info(message);
};

/**
 * 通知
 */
export const showNotification = (config: NotificationConfig) => {
  ElNotification({
    title: config.title,
    message: config.message,
    type: config.type || 'info',
    duration: config.duration || 4500,
    position: config.position || 'top-right',
  });
};

/**
 * 复制到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('复制成功');
    return true;
  } catch (err) {
    console.error('复制失败:', err);
    showError('复制失败');
    return false;
  }
};

/**
 * 滚动到顶部
 */
export const scrollToTop = (smooth: boolean = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto',
  });
};

/**
 * 获取URL参数
 */
export const getUrlParams = (): Record<string, string> => {
  const params: Record<string, string> = {};
  const urlSearchParams = new URLSearchParams(window.location.search);

  for (const [key, value] of urlSearchParams.entries()) {
    params[key] = value;
  }

  return params;
};
