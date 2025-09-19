import type { Response, NextFunction } from 'express';
import { User } from '@models/User';
import { JWTUtil } from '@utils/jwt';
import { ApiResponseUtil } from '@utils/apiResponse';
import { logger } from '@utils/logger';
import type { AuthenticatedRequest, UserRole } from '../types/index';

const BEARER_PREFIX = 'Bearer ';

/**
 * 从请求头中提取 JWT token
 */
const extractToken = (authHeader?: string): string | null => {
  if (!authHeader?.startsWith(BEARER_PREFIX)) {
    return null;
  }
  return authHeader.substring(BEARER_PREFIX.length);
};

/**
 * 根据 token 获取用户信息
 */
const getUserFromToken = async (token: string) => {
  const payload = JWTUtil.verifyAccessToken(token);
  const user = await User.findByPk(payload.userId);

  if (!user?.get('isActive')) {
    return null;
  }

  return user.toJSON();
};

/**
 * 认证中间件 - 验证 JWT token
 */
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      ApiResponseUtil.unauthorized(res, '需要访问令牌');
      return;
    }

    const user = await getUserFromToken(token);

    if (!user) {
      ApiResponseUtil.unauthorized(res, '无效令牌或用户未找到');
      return;
    }

    req.user = user;
    logger.debug(`用户 ${user.email} 认证成功`);
    next();
  } catch (error) {
    logger.error('认证错误:', error);
    ApiResponseUtil.unauthorized(res, '无效或已过期的令牌');
  }
};

/**
 * 授权中间件 - 检查用户角色
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponseUtil.unauthorized(res, '需要认证');
      return;
    }

    if (!roles.includes(req.user.role)) {
      ApiResponseUtil.forbidden(res, '权限不足');
      return;
    }

    next();
  };
};

/**
 * 可选认证中间件 - token 存在时验证，不存在时继续
 */
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req.headers.authorization);

    if (token) {
      const user = await getUserFromToken(token);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    logger.debug('可选认证失败:', error);
    next();
  }
};
