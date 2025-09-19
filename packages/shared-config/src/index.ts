import type { HTTP_STATUS, API_ERROR_CODES } from '../../shared-types/src';

/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
  JWT: {
    DEFAULT_EXPIRES_IN: '7d',
    REFRESH_EXPIRES_IN: '30d',
  },
  BCRYPT: {
    DEFAULT_ROUNDS: 10,
  },
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15分钟
    MAX_REQUESTS: 100,
  },
} as const;

/**
 * API 配置
 */
export const API_CONFIG = {
  BASE_URL: (typeof process !== 'undefined' && process.env?.NODE_ENV) === 'production' ? 'https://api.yourdomain.com' : 'http://localhost:3000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

/**
 * 数据库配置
 */
export const DB_CONFIG = {
  MYSQL: {
    MAX_CONNECTIONS: 20,
    IDLE_TIMEOUT: 30000,
    CONNECTION_TIMEOUT: 60000,
  },
  REDIS: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  },
} as const;

// 重新导出类型常量
export { HTTP_STATUS, API_ERROR_CODES };
