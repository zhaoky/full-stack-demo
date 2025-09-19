import rateLimit from 'express-rate-limit';
import { redisClient } from '@config/database';
import { logger } from '@utils/logger';

// 标记Redis是否已记录过连接状态
let redisConnectionLogged = false;

/**
 * Redis 存储器配置（如果 Redis 可用）
 */
const createRedisStore = () => {
  if (!redisClient.isOpen) {
    // 只在第一次检查时记录警告，避免重复日志
    if (!redisConnectionLogged) {
      logger.info('限流使用内存存储，将在Redis连接后自动切换');
      redisConnectionLogged = true;
    }
    return undefined;
  }

  // Redis连接成功后，记录切换信息
  if (!redisConnectionLogged) {
    logger.info('限流已切换到Redis存储');
    redisConnectionLogged = true;
  }

  return {
    async get(key: string) {
      try {
        if (!redisClient.isOpen) return null;
        const result = await redisClient.get(`rate_limit:${key}`);
        return result ? JSON.parse(result) : null;
      } catch (error) {
        logger.error('Redis 限流获取错误:', error);
        return null;
      }
    },

    async set(key: string, value: any, ttl: number) {
      try {
        if (!redisClient.isOpen) return;
        await redisClient.setEx(`rate_limit:${key}`, ttl, JSON.stringify(value));
      } catch (error) {
        logger.error('Redis 限流设置错误:', error);
      }
    },

    async increment(key: string, ttl: number) {
      try {
        if (!redisClient.isOpen) return 1;
        const fullKey = `rate_limit:${key}`;
        const current = await redisClient.incr(fullKey);
        if (current === 1) {
          await redisClient.expire(fullKey, ttl);
        }
        return current;
      } catch (error) {
        logger.error('Redis 限流递增错误:', error);
        return 1;
      }
    },

    async decrement(key: string) {
      try {
        if (!redisClient.isOpen) return;
        await redisClient.decr(`rate_limit:${key}`);
      } catch (error) {
        logger.error('Redis 限流递减错误:', error);
      }
    },

    async reset(key: string) {
      try {
        if (!redisClient.isOpen) return;
        await redisClient.del(`rate_limit:${key}`);
      } catch (error) {
        logger.error('Redis 限流重置错误:', error);
      }
    },
  };
};

/**
 * 通用限流器配置
 */
const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15分钟
  max: number = 100, // 最大请求数
  message: string = '此IP请求过多，请稍后再试',
  skipSuccessfulRequests: boolean = false,
  skipFailedRequests: boolean = false
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true, // 返回限流信息在 headers 中
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    // 使用Redis存储器（如果可用，否则回退到内存存储）
    store: createRedisStore(),
    keyGenerator: (req) => {
      // 可以根据用户ID或IP生成key
      return req.ip || 'unknown';
    },
    handler: (req, res) => {
      logger.warn(`IP: ${req.ip} 超出限流限制`);
      res.status(429).json({
        success: false,
        message,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

// 导出不同场景的限流中间件
export const rateLimiters = {
  // 通用API限流
  general: createRateLimiter(
    15 * 60 * 1000, // 15分钟
    100, // 100个请求
    '此IP请求过多，请15分钟后再试'
  ),

  // 认证相关限流（更严格）
  auth: createRateLimiter(
    15 * 60 * 1000, // 15分钟
    400, // 5次尝试
    '认证尝试次数过多，请15分钟后再试',
    true, // 跳过成功请求
    false
  ),

  // 创建资源限流
  create: createRateLimiter(
    60 * 1000, // 1分钟
    100, // 10个请求
    '创建请求过多，请放慢速度'
  ),

  // 严格限流（敏感操作）
  strict: createRateLimiter(
    60 * 60 * 1000, // 1小时
    50, // 5个请求
    '敏感操作超出限流限制'
  ),
};
