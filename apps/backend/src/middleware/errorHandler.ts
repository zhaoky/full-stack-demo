import type { Request, Response, NextFunction } from 'express';
import { ValidationError as SequelizeValidationError } from 'sequelize';
import { MongoError } from 'mongodb';
import { ApiResponseUtil } from '@utils/apiResponse';
import { logger } from '@utils/logger';
import type { ApiError, ValidationError } from '@types/index';

/**
 * 自定义错误类
 */
export class AppError extends Error implements ApiError {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: ValidationError[];

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, errors?: ValidationError[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 处理 Sequelize 验证错误
 */
const handleSequelizeValidationError = (error: SequelizeValidationError): AppError => {
  const errors: ValidationError[] = error.errors.map((err) => ({
    field: err.path || 'unknown',
    message: err.message,
    value: err.value,
  }));

  return new AppError('验证失败', 422, true, errors);
};

/**
 * 处理 Sequelize 唯一约束错误
 */
const handleSequelizeUniqueConstraintError = (error: any): AppError => {
  const field = error.errors?.[0]?.path || 'unknown';
  const message = `${field} already exists`;

  return new AppError(message, 409);
};

/**
 * 处理 MongoDB 验证错误
 */
const handleMongoValidationError = (error: any): AppError => {
  const errors: ValidationError[] = Object.values(error.errors).map((err: any) => ({
    field: err.path,
    message: err.message,
    value: err.value,
  }));

  return new AppError('验证失败', 422, true, errors);
};

/**
 * 处理 MongoDB 重复键错误
 */
const handleMongoDuplicateKeyError = (error: MongoError): AppError => {
  const field = Object.keys((error as any).keyValue)?.[0] || 'unknown';
  const message = `${field} already exists`;

  return new AppError(message, 409);
};

/**
 * 处理 JWT 错误
 */
const handleJWTError = (): AppError => {
  return new AppError('无效令牌', 401);
};

/**
 * 处理 JWT 过期错误
 */
const handleJWTExpiredError = (): AppError => {
  return new AppError('令牌已过期', 401);
};

/**
 * 处理 Joi 验证错误
 */
const handleJoiValidationError = (error: any): AppError => {
  return new AppError(error.message, 422, true, error.errors);
};

/**
 * 错误处理中间件
 */
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  let appError = error as AppError;

  // 记录错误日志
  logger.error('发生错误:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // 处理不同类型的错误
  if (error.name === 'SequelizeValidationError') {
    appError = handleSequelizeValidationError(error as SequelizeValidationError);
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    appError = handleSequelizeUniqueConstraintError(error);
  } else if (error.name === 'ValidationError' && (error as any).errors) {
    // Mongoose 验证错误或自定义验证错误
    if ((error as any).errors && typeof (error as any).errors === 'object') {
      appError = handleMongoValidationError(error);
    } else {
      appError = handleJoiValidationError(error);
    }
  } else if ((error as MongoError).code === 11000) {
    appError = handleMongoDuplicateKeyError(error as MongoError);
  } else if (error.name === 'JsonWebTokenError') {
    appError = handleJWTError();
  } else if (error.name === 'TokenExpiredError') {
    appError = handleJWTExpiredError();
  } else if (!(error instanceof AppError)) {
    // 未知错误
    appError = new AppError(process.env.NODE_ENV === 'production' ? '发生了错误' : error.message, 500, false);
  }

  // 发送错误响应
  if (appError.errors) {
    ApiResponseUtil.validationError(res, appError.message, appError.errors);
  } else {
    ApiResponseUtil.error(res, appError.message, undefined, appError.statusCode);
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
