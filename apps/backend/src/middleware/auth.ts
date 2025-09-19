import type { Response, NextFunction } from 'express';
import { User } from '@models/User';
import { JWTUtil } from '@utils/jwt';
import { ApiResponseUtil } from '@utils/apiResponse';
import { logger } from '@utils/logger';
import type { AuthenticatedRequest, UserRole } from '../types/index';

/**
 * 认证中间件 - 验证 JWT token
 */
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      ApiResponseUtil.unauthorized(res, '需要访问令牌');
      return;
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证访问令牌
    const payload = JWTUtil.verifyAccessToken(token);

    // 查找用户
    const user = await User.findByPk(payload.userId);

    if (!user || !user.get('isActive')) {
      ApiResponseUtil.unauthorized(res, '无效令牌或用户未找到');
      return;
    }

    // 将用户信息添加到请求对象
    req.user = user.toJSON() as any;

    logger.debug(`用户 ${req.user?.email} 认证成功`);
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
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = JWTUtil.verifyAccessToken(token);
    const user = await User.findByPk(payload.userId);

    if (user && user.get('isActive')) {
      req.user = user.toJSON() as any;
    }

    next();
  } catch (error) {
    // 可选认证失败时不阻止请求，继续处理
    logger.debug('可选认证失败:', error);
    next();
  }
};
