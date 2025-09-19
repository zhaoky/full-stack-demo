import type { Request, Response, NextFunction } from 'express';
import { ValidationError as SequelizeValidationError } from 'sequelize';
import { ApiResponseUtil } from '@utils/apiResponse';
import { logger } from '@utils/logger';
import type { ApiError, ValidationError } from '../types/index';

/**
 * 自定义错误类
 */
export class AppError extends Error implements ApiError {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: ValidationError[];

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, errors: ValidationError[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 错误处理映射表
 */
const errorHandlers: Record<string, (error: any) => AppError> = {
  SequelizeValidationError: (error: SequelizeValidationError): AppError => {
    const errors: ValidationError[] = error.errors.map((err) => ({
      field: err.path || 'unknown',
      message: err.message,
      value: err.value,
    }));
    return new AppError('验证失败', 422, true, errors);
  },

  SequelizeUniqueConstraintError: (error: any): AppError => {
    const field = error.errors?.[0]?.path || 'unknown';
    return new AppError(`${field} 已存在`, 409);
  },

  JsonWebTokenError: (): AppError => new AppError('无效令牌', 401),

  TokenExpiredError: (): AppError => new AppError('令牌已过期', 401),

  ValidationError: (error: any): AppError => new AppError(error.message, 422, true, error.errors),
};

/**
 * 错误处理中间件
 */
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  // 记录错误日志
  logger.error('发生错误:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // 如果已经是 AppError，直接使用
  if (error instanceof AppError) {
    return sendErrorResponse(res, error);
  }

  // 根据错误类型处理
  const handler = errorHandlers[error.name];
  const appError = handler ? handler(error) : new AppError(process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message, 500, false);

  sendErrorResponse(res, appError);
};

/**
 * 发送错误响应
 */
const sendErrorResponse = (res: Response, error: AppError): void => {
  if (error.errors?.length) {
    ApiResponseUtil.validationError(res, error.message, error.errors);
  } else {
    // 根据状态码选择合适的响应方法
    switch (error.statusCode) {
      case 400:
        ApiResponseUtil.badRequest(res, error.message);
        break;
      case 401:
        ApiResponseUtil.unauthorized(res, error.message);
        break;
      case 403:
        ApiResponseUtil.forbidden(res, error.message);
        break;
      case 404:
        ApiResponseUtil.notFound(res, error.message);
        break;
      case 409:
        ApiResponseUtil.conflict(res, error.message);
        break;
      default:
        ApiResponseUtil.serverError(res, error.message);
    }
  }
};

/**
 * 未找到路由处理中间件
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * 异步错误捕获包装器
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
