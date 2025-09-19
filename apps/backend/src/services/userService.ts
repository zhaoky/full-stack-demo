import { Op } from 'sequelize';
import { User } from '@models/User';
import { redisClient } from '@config/database';
import { JWTUtil } from '@utils/jwt';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import type { IUser, CreateUserRequest, UpdateUserRequest, LoginRequest, AuthResponse, RefreshTokenRequest, RefreshTokenResponse, PaginationQuery, PaginatedResponse } from '../types/index';

// 缓存配置常量
const CACHE_TTL = {
  USER: 3600, // 1小时
  REFRESH_TOKEN: 7 * 24 * 3600, // 7天
} as const;

export class UserService {
  // Redis 缓存辅助方法
  private static async cacheUser(userId: string, userData: any): Promise<void> {
    if (!redisClient.isOpen) return;
    await redisClient.setEx(`user:${userId}`, CACHE_TTL.USER, JSON.stringify(userData));
  }

  private static async getCachedUser(userId: string): Promise<any | null> {
    if (!redisClient.isOpen) return null;
    const cached = await redisClient.get(`user:${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  private static async clearUserCache(userId: string): Promise<void> {
    if (!redisClient.isOpen) return;
    await redisClient.del(`user:${userId}`);
  }

  private static async cacheRefreshToken(userId: string, token: string): Promise<void> {
    if (!redisClient.isOpen) return;
    await redisClient.setEx(`refresh:${userId}`, CACHE_TTL.REFRESH_TOKEN, token);
  }

  private static async getCachedRefreshToken(userId: string): Promise<string | null> {
    if (!redisClient.isOpen) return null;
    return await redisClient.get(`refresh:${userId}`);
  }

  private static async clearRefreshToken(userId: string): Promise<void> {
    if (!redisClient.isOpen) return;
    await redisClient.del(`refresh:${userId}`);
  }

  // 通用错误处理包装器
  private static async executeWithLogging<T>(operation: () => Promise<T>, operationName: string, context?: string): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      logger.error(`${operationName}时出错${context ? `: ${context}` : ''}:`, error);
      throw error;
    }
  }

  // 查找并验证用户
  private static async findUserById(userId: string, includePassword = false): Promise<any> {
    const options = includePassword ? { scope: 'withPassword' } : { attributes: { exclude: ['password'] } };

    const user = includePassword ? await User.scope('withPassword').findByPk(userId) : await User.findByPk(userId, options);

    if (!user) {
      throw new AppError('用户未找到', 404);
    }
    return user;
  }

  // 检查用户是否存在（根据邮箱或用户名）
  private static async checkUserExists(email?: string, username?: string, excludeId?: string): Promise<void> {
    const whereClause: any = {};
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const orConditions: any[] = [];
    if (email) orConditions.push({ email });
    if (username) orConditions.push({ username });

    if (orConditions.length > 0) {
      whereClause[Op.or] = orConditions;
    }

    const existingUser = await User.findOne({ where: whereClause });
    if (existingUser) {
      const message = email && existingUser.email === email ? '邮箱已存在' : '用户名已存在';
      throw new AppError(message, 409);
    }
  }
  /**
   * 创建新用户
   */
  static async createUser(userData: CreateUserRequest): Promise<Omit<IUser, 'password'>> {
    return this.executeWithLogging(async () => {
      await this.checkUserExists(userData.email, userData.username);

      const user = await User.create(userData);
      logger.info(`新用户已创建: ${user.email}`);

      return user.toJSON();
    }, '创建用户');
  }

  /**
   * 用户登录（无验证版本）
   */
  static async loginUser(loginData: LoginRequest): Promise<AuthResponse> {
    return this.executeWithLogging(async () => {
      const user = await User.findOne({
        where: { username: loginData.username },
      });

      if (!user || !user.get('isActive')) {
        throw new AppError('用户未找到或已禁用', 401);
      }

      await user.update({ lastLogin: new Date() });

      const tokenPair = JWTUtil.generateTokenPair(user.toJSON() as IUser);
      const userData = user.toJSON();

      // 缓存用户信息和刷新令牌
      await Promise.all([this.cacheUser(user.id, userData), this.cacheRefreshToken(user.id, tokenPair.refreshToken)]);

      logger.info(`用户已登录（无验证）: ${user.username}`);

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        user: userData,
        expiresIn: tokenPair.expiresIn,
        refreshExpiresIn: tokenPair.refreshExpiresIn,
      };
    }, '登录');
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(refreshTokenData: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.executeWithLogging(async () => {
      const { refreshToken } = refreshTokenData;
      const payload = JWTUtil.verifyRefreshToken(refreshToken);

      const user = await User.findByPk(payload.userId);
      if (!user || !user.get('isActive')) {
        throw new AppError('无效的刷新令牌或用户不存在', 401);
      }

      // 验证缓存中的refreshToken
      const cachedRefreshToken = await this.getCachedRefreshToken(user.id);
      if (cachedRefreshToken && cachedRefreshToken !== refreshToken) {
        throw new AppError('无效的刷新令牌', 401);
      }

      const tokenPair = JWTUtil.generateTokenPair(user.toJSON() as IUser);
      const userData = user.toJSON();

      // 更新缓存
      await Promise.all([this.cacheRefreshToken(user.id, tokenPair.refreshToken), this.cacheUser(user.id, userData)]);

      logger.info(`Token已刷新: ${user.email}`);

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        refreshExpiresIn: tokenPair.refreshExpiresIn,
      };
    }, '刷新token');
  }

  /**
   * 登出（废除刷新令牌）
   */
  static async logout(userId: string): Promise<void> {
    return this.executeWithLogging(async () => {
      await Promise.all([this.clearRefreshToken(userId), this.clearUserCache(userId)]);

      logger.info(`用户已登出: ${userId}`);
    }, '登出');
  }

  /**
   * 获取用户列表（分页）
   */
  static async getUsers(query: PaginationQuery): Promise<PaginatedResponse<Omit<IUser, 'password'>>> {
    return this.executeWithLogging(async () => {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = query;
      const offset = (page - 1) * limit;

      const whereClause: any = {};
      if (search) {
        whereClause[Op.or] = [{ email: { [Op.iLike]: `%${search}%` } }, { username: { [Op.iLike]: `%${search}%` } }, { firstName: { [Op.iLike]: `%${search}%` } }, { lastName: { [Op.iLike]: `%${search}%` } }];
      }

      const { rows: users, count: total } = await User.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit,
        offset,
        attributes: { exclude: ['password'] },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: users.map((user) => user.toJSON()),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    }, '获取用户列表');
  }

  /**
   * 根据ID获取用户
   */
  static async getUserById(userId: string): Promise<Omit<IUser, 'password'>> {
    return this.executeWithLogging(
      async () => {
        // 先尝试从缓存获取
        const cached = await this.getCachedUser(userId);
        if (cached) {
          logger.debug(`用户 ${userId} 从缓存中获取`);
          return cached;
        }

        // 从数据库获取
        const user = await this.findUserById(userId);
        const userData = user.toJSON();

        // 缓存用户数据
        await this.cacheUser(userId, userData);

        return userData;
      },
      '获取用户',
      userId
    );
  }

  /**
   * 更新用户信息
   */
  static async updateUser(userId: string, updateData: UpdateUserRequest): Promise<Omit<IUser, 'password'>> {
    return this.executeWithLogging(
      async () => {
        const user = await this.findUserById(userId);

        // 检查邮箱或用户名冲突
        await this.checkUserExists(updateData.email, updateData.username, userId);

        await user.update(updateData);
        await this.clearUserCache(userId);

        logger.info(`用户已更新: ${user.email}`);
        return user.toJSON();
      },
      '更新用户',
      userId
    );
  }

  /**
   * 删除用户（软删除）
   */
  static async deleteUser(userId: string): Promise<void> {
    return this.executeWithLogging(
      async () => {
        const user = await this.findUserById(userId);

        await user.destroy();
        await this.clearUserCache(userId);

        logger.info(`用户已删除: ${user.get('username')}`);
      },
      '删除用户',
      userId
    );
  }

  /**
   * 更改用户密码
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    return this.executeWithLogging(
      async () => {
        const user = await this.findUserById(userId, true);

        // 验证当前密码
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
          throw new AppError('当前密码不正确', 400);
        }

        await user.update({ password: newPassword });
        logger.info(`用户密码已更改: ${user.email}`);
      },
      '更改密码',
      userId
    );
  }

  /**
   * 激活/停用用户
   */
  static async toggleUserStatus(userId: string): Promise<Omit<IUser, 'password'>> {
    return this.executeWithLogging(
      async () => {
        const user = await this.findUserById(userId);

        await user.update({ isActive: !user.get('isActive') });
        await this.clearUserCache(userId);

        logger.info(`用户状态已切换: ${user.email} - 活跃: ${user.get('isActive')}`);
        return user.toJSON();
      },
      '切换用户状态',
      userId
    );
  }
}

// 为 Sequelize 模型添加 scope
User.addScope('withPassword', {
  attributes: { include: ['password'] },
});
