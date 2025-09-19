import type { Response } from 'express';
import { UserService } from '@services/userService';
import { ApiResponseUtil } from '@utils/apiResponse';
import { asyncHandler } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import type { PaginationQuery } from '@shared/types';
import type { AuthenticatedRequest } from '../types/index';

/**
 * 检查用户是否有权限操作目标用户
 */
const canAccessUser = (currentUser: any, targetUserId: string): boolean => {
  return currentUser?.id === targetUserId || currentUser?.role === 'admin';
};

/**
 * 检查管理员权限
 */
const isAdmin = (user: any): boolean => {
  return user?.role === 'admin';
};

export class UserController {
  /**
   * 用户注册
   */
  static register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await UserService.createUser(req.body);
    logger.info(`用户已注册: ${user.email}`);
    ApiResponseUtil.created(res, user, '用户注册成功');
  });

  /**
   * 用户登录
   */
  static login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const authResponse = await UserService.loginUser(req.body);
    logger.info(`用户已登录: ${authResponse.user.email}`);
    ApiResponseUtil.ok(res, authResponse, '登录成功');
  });

  /**
   * 刷新访问令牌
   */
  static refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tokenResponse = await UserService.refreshToken(req.body);
    ApiResponseUtil.ok(res, tokenResponse, '令牌刷新成功');
  });

  /**
   * 用户登出
   */
  static logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user } = req;
    await UserService.logout(user!.id);
    logger.info(`用户已登出: ${user!.email}`);
    ApiResponseUtil.ok(res, undefined, '登出成功');
  });

  /**
   * 获取当前用户信息
   */
  static getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await UserService.getUserById(req.user!.id);
    ApiResponseUtil.ok(res, user, '用户信息已获取');
  });

  /**
   * 获取用户列表
   */
  static getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as unknown as PaginationQuery;
    const { data, pagination } = await UserService.getUsers(query);
    ApiResponseUtil.paginated(res, data, pagination.page, pagination.limit, pagination.total, '用户列表获取成功');
  });

  /**
   * 根据ID获取用户
   */
  static getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
      ApiResponseUtil.validationError(res, '用户ID不能为空');
      return;
    }
    const user = await UserService.getUserById(id);
    ApiResponseUtil.ok(res, user, '用户获取成功');
  });

  /**
   * 更新用户信息
   */
  static updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
      ApiResponseUtil.validationError(res, '用户ID不能为空');
      return;
    }

    if (!canAccessUser(req.user, id)) {
      ApiResponseUtil.forbidden(res, '您只能更新自己的资料');
      return;
    }

    const user = await UserService.updateUser(id, req.body);
    logger.info(`用户已更新: ${user.email}`);
    ApiResponseUtil.ok(res, user, '用户更新成功');
  });

  /**
   * 删除用户
   */
  static deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
      ApiResponseUtil.validationError(res, '用户ID不能为空');
      return;
    }

    if (req.user!.id === id) {
      ApiResponseUtil.forbidden(res, '您不能删除自己的账户');
      return;
    }

    await UserService.deleteUser(id);
    logger.info(`用户被管理员删除: ${req.user!.email}`);
    ApiResponseUtil.ok(res, undefined, '用户删除成功');
  });

  /**
   * 更改密码
   */
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await UserService.changePassword(req.user!.id, currentPassword, newPassword);
    logger.info(`用户密码已更改: ${req.user!.email}`);
    ApiResponseUtil.ok(res, undefined, '密码修改成功');
  });

  /**
   * 切换用户状态（激活/停用）
   */
  static toggleUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
      ApiResponseUtil.validationError(res, '用户ID不能为空');
      return;
    }

    if (req.user!.id === id) {
      ApiResponseUtil.forbidden(res, '您不能修改自己的账户状态');
      return;
    }

    const user = await UserService.toggleUserStatus(id);
    logger.info(`用户状态被管理员切换: ${req.user!.email}`);
    ApiResponseUtil.ok(res, user, '用户状态更新成功');
  });

  /**
   * 获取用户统计信息
   */
  static getUserStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // TODO: 实现 UserService.getUserStats 方法
    const stats = {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
    };
    ApiResponseUtil.ok(res, stats, '用户统计信息已获取');
  });
}
