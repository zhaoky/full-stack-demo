import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { redisClient } from '@config/database';
import { logger } from '@utils/logger';

/**
 * Redis 存储器配置（如果 Redis 可用则使用，否则回退到内存存储）
 */
const createRedisStore = () => {
  if (!redisClient.isOpen) {
    return undefined; // 回退到内存存储
  }

  const withRedisErrorHandling = async <T>(operation: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      if (!redisClient.isOpen) return fallback;
      return await operation();
    } catch (error) {
      logger.error('Redis 限流操作错误:', error);
      return fallback;
    }
  };

  return {
    async increment(key: string) {
      return withRedisErrorHandling(
        async () => {
          const fullKey = `rate_limit:${key}`;
          const current = await redisClient.incr(fullKey);
          if (current === 1) {
            await redisClient.expire(fullKey, 900); // 15分钟默认过期时间
          }
          return { totalHits: current, resetTime: new Date(Date.now() + 900000) };
        },
        { totalHits: 1, resetTime: new Date(Date.now() + 900000) }
      );
    },

    async decrement(key: string) {
      return withRedisErrorHandling(async () => {
        await redisClient.decr(`rate_limit:${key}`);
      }, undefined);
    },

    async resetKey(key: string) {
      return withRedisErrorHandling(async () => {
        await redisClient.del(`rate_limit:${key}`);
      }, undefined);
    },
  };
};

/**
 * 限流器配置接口
 */
interface RateLimiterConfig {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * 创建限流器的基础配置
 */
const createRateLimiter = (config: RateLimiterConfig = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15分钟
    max = 100,
    message = '此IP请求过多，请稍后再试',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  const rateLimitConfig: any = {
    windowMs,
    max,
    message: { success: false, message, timestamp: new Date().toISOString() },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator: (req: Request) => req.ip || 'unknown',
    handler: (req: Request, res: Response) => {
      logger.warn(`IP: ${req.ip} 超出限流限制 - ${message}`);
      res.status(429).json({
        success: false,
        message,
        timestamp: new Date().toISOString(),
      });
    },
  };

  const store = createRedisStore();
  if (store) {
    rateLimitConfig.store = store;
  }

  return rateLimit(rateLimitConfig);
};

/**
 * 预定义的限流器配置
 */
const RATE_LIMIT_CONFIGS = {
  general: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100,
    message: '此IP请求过多，请15分钟后再试',
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 5次尝试
    message: '认证尝试次数过多，请15分钟后再试',
    skipSuccessfulRequests: true,
  },
  create: {
    windowMs: 60 * 1000, // 1分钟
    max: 10,
    message: '创建请求过多，请放慢速度',
  },
  strict: {
    windowMs: 60 * 60 * 1000, // 1小时
    max: 5,
    message: '敏感操作超出限流限制',
  },
} as const;

/**
 * 导出不同场景的限流中间件
 */
export const rateLimiters = {
  general: createRateLimiter(RATE_LIMIT_CONFIGS.general),
  auth: createRateLimiter(RATE_LIMIT_CONFIGS.auth),
  create: createRateLimiter(RATE_LIMIT_CONFIGS.create),
  strict: createRateLimiter(RATE_LIMIT_CONFIGS.strict),
};
