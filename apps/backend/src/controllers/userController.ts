import type { Response, NextFunction } from 'express';
import { UserService } from '@services/userService';
import { ApiResponseUtil } from '@utils/apiResponse';
import { asyncHandler } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import type { PaginationQuery } from '@shared/types';
import type { Request } from 'express';

// 扩展Request接口以包含认证用户信息
interface AuthenticatedRequest extends Request {
  user?: any;
}

export class UserController {
  /**
   * 用户注册
   */
  static register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userData = req.body;
    const user = await UserService.createUser(userData);

    logger.info(`用户已注册: ${user.email}`);
    ApiResponseUtil.created(res, '用户注册成功', user);
  });

  /**
   * 用户登录
   */
  static login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const loginData = req.body;
    const authResponse = await UserService.loginUser(loginData);

    logger.info(`用户已登录: ${authResponse.user.email}`);
    ApiResponseUtil.success(res, '登录成功', authResponse);
  });

  /**
   * 刷新访问令牌
   */
  static refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const refreshTokenData = req.body;
    const tokenResponse = await UserService.refreshToken(refreshTokenData);

    logger.info('令牌已刷新');
    ApiResponseUtil.success(res, '令牌刷新成功', tokenResponse);
  });

  /**
   * 用户登出
   */
  static logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      ApiResponseUtil.unauthorized(res, '用户未认证');
      return;
    }

    await UserService.logout(req.user.id);

    logger.info(`用户已登出: ${req.user.email}`);
    ApiResponseUtil.success(res, '登出成功');
  });

  /**
   * 获取当前用户信息
   */
  static getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      ApiResponseUtil.unauthorized(res, '用户未认证');
      return;
    }

    const user = await UserService.getUserById(req.user.id);
    ApiResponseUtil.success(res, '用户信息已获取', user);
  });

  /**
   * 获取用户列表
   */
  static getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as unknown as PaginationQuery;
    const users = await UserService.getUsers(query);

    ApiResponseUtil.paginated(res, users.data, users.pagination.page, users.pagination.limit, users.pagination.total, '用户列表获取成功');
  });

  /**
   * 根据ID获取用户
   */
  static getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = await UserService.getUserById(id);

    ApiResponseUtil.success(res, '用户获取成功', user);
  });

  /**
   * 更新用户信息
   */
  static updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // 用户只能更新自己的信息（除非是管理员）
    if (req.user?.id !== id && req.user?.role !== 'admin') {
      ApiResponseUtil.forbidden(res, '您只能更新自己的资料');
      return;
    }

    const user = await UserService.updateUser(id, updateData);

    logger.info(`用户已更新: ${user.email}`);
    ApiResponseUtil.success(res, '用户更新成功', user);
  });

  /**
   * 删除用户
   */
  static deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // 用户不能删除自己
    if (req.user?.id === id) {
      ApiResponseUtil.forbidden(res, '您不能删除自己的账户');
      return;
    }

    await UserService.deleteUser(id);

    logger.info(`用户被管理员删除: ${req.user?.email}`);
    ApiResponseUtil.success(res, '用户删除成功');
  });

  /**
   * 更改密码
   */
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      ApiResponseUtil.unauthorized(res, '用户未认证');
      return;
    }

    const { currentPassword, newPassword } = req.body;

    await UserService.changePassword(req.user.id, currentPassword, newPassword);

    logger.info(`用户密码已更改: ${req.user.email}`);
    ApiResponseUtil.success(res, '密码修改成功');
  });

  /**
   * 切换用户状态（激活/停用）
   */
  static toggleUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // 用户不能停用自己
    if (req.user?.id === id) {
      ApiResponseUtil.forbidden(res, '您不能修改自己的账户状态');
      return;
    }

    const user = await UserService.toggleUserStatus(id);

    logger.info(`用户状态被管理员切换: ${req.user?.email}`);
    ApiResponseUtil.success(res, '用户状态更新成功', user);
  });

  /**
   * 获取用户统计信息
   */
  static getUserStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // 这里可以添加获取用户统计信息的逻辑
    // 例如：总用户数、活跃用户数、新注册用户数等
    const stats = {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      // 可以从 UserService 中添加相应的方法来获取这些统计信息
    };

    ApiResponseUtil.success(res, '用户统计信息已获取', stats);
  });
}
