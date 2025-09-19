import type { Request, Response, NextFunction } from 'express';
import { ApiResponseUtil } from '@utils/apiResponse';
import { logger } from '@utils/logger';

/**
 * 异步路由处理器包装器
 * 自动捕获异步操作中的错误并传递给错误处理中间件
 */
export const withAsyncHandler = (fn: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      logger.error('路由处理器错误:', error);
      next(error);
    }
  };
};

/**
 * 标准化响应处理器
 * 统一处理成功响应的格式
 */
export const withStandardResponse = (fn: Function) => {
  return withAsyncHandler(async (req: Request, res: Response) => {
    const result = await fn(req, res);
    if (result && !res.headersSent) {
      const { message = '操作成功', data, status = 200 } = result;
      if (status >= 400) {
        ApiResponseUtil.error(res, message, status);
      } else {
        ApiResponseUtil.success(res, message, data);
      }
    }
  });
};

/**
 * 性能监控处理器
 * 记录请求处理时间
 */
export const withPerformanceMonitoring = (fn: Function) => {
  return withAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    await fn(req, res, next);

    const duration = Date.now() - startTime;
    logger.debug(`${req.method} ${req.path} - ${duration}ms`);

    // 设置响应头
    res.set('X-Response-Time', `${duration}ms`);
  });
};

/**
 * 请求日志处理器
 * 记录请求详细信息
 */
export const withRequestLogging = (fn: Function) => {
  return withAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: (req as any).user?.id || 'anonymous',
    });

    await fn(req, res, next);
  });
};

/**
 * 组合多个处理器
 */
export const combineHandlers = (...handlers: Function[]) => {
  return (fn: Function) => {
    return handlers.reduce((wrapped, handler) => handler(wrapped), fn);
  };
};
