import { authenticate, authorize } from '@middleware/auth';
import { rateLimiters } from '@middleware/rateLimiter';
import type { UserRole } from '../../types';

/**
 * 预定义的路由中间件组合
 * 提供不同权限级别和功能需求的中间件组合
 */
export const routeGroups = {
  /**
   * 公开路由组 - 无需认证
   */
  public: [],

  /**
   * 需要认证的路由组
   */
  authenticated: [authenticate],

  /**
   * 管理员路由组
   */
  admin: [authenticate, authorize('admin' as UserRole)],

  /**
   * 版主路由组（管理员或版主权限）
   */
  moderator: [authenticate, authorize('admin' as UserRole, 'moderator' as UserRole)],

  /**
   * 带限流的创建操作（版主权限 + 创建限流）
   */
  createWithAuth: [authenticate, authorize('admin' as UserRole, 'moderator' as UserRole), rateLimiters.create],

  /**
   * 带限流的敏感操作（管理员权限 + 严格限流）
   */
  sensitiveOperation: [authenticate, authorize('admin' as UserRole), rateLimiters.strict],

  /**
   * 认证相关操作（公开 + 认证限流）
   */
  authOperation: [rateLimiters.auth],

  /**
   * 一般操作（认证 + 一般限流）
   */
  generalOperation: [authenticate, rateLimiters.general],
};

/**
 * 路由组合工厂函数
 * 用于动态组合中间件
 */
export const createRouteGroup = (...middlewares: any[]) => {
  return middlewares.flat();
};
