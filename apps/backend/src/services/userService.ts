import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { User } from '@models/User';
import { MongoDBUser } from '@models/User';
import { redisClient } from '@config/database';
import { JWTUtil } from '@utils/jwt';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import type { IUser, CreateUserRequest, UpdateUserRequest, LoginRequest, AuthResponse, RefreshTokenRequest, RefreshTokenResponse, PaginationQuery, PaginatedResponse } from '../types/index';

export class UserService {
  /**
   * 创建新用户
   */
  static async createUser(userData: CreateUserRequest): Promise<Omit<IUser, 'password'>> {
    try {
      // 检查邮箱是否已存在
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email: userData.email }, { username: userData.username }],
        },
      });

      if (existingUser) {
        throw new AppError(existingUser.email === userData.email ? '邮箱已存在' : '用户名已存在', 409);
      }

      // 创建用户
      const user = await User.create(userData);
      logger.info(`新用户已创建: ${user.email}`);

      return user.toJSON();
    } catch (error) {
      logger.error('创建用户时出错:', error);
      throw error;
    }
  }

  /**
   * 用户登录（无验证版本）
   */
  static async loginUser(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      // 查找用户（使用用户名登录，不验证密码）
      const user = await User.findOne({
        where: {
          username: loginData.username,
        },
      });

      if (!user || !user.get('isActive')) {
        throw new AppError('用户未找到或已禁用', 401);
      }

      // 直接跳过密码验证，更新最后登录时间
      await user.update({ lastLogin: new Date() });

      // 生成双token对
      const tokenPair = JWTUtil.generateTokenPair(user.toJSON() as IUser);

      // 缓存用户信息到 Redis（可选）
      if (redisClient.isOpen) {
        await redisClient.setEx(
          `user:${user.id}`,
          3600, // 1小时过期
          JSON.stringify(user.toJSON())
        );
        // 缓存refreshToken，用于验证刷新请求
        await redisClient.setEx(
          `refresh:${user.id}`,
          7 * 24 * 3600, // 7天过期
          tokenPair.refreshToken
        );
      }

      logger.info(`用户已登录（无验证）: ${user.username}`);

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        user: user.toJSON(),
        expiresIn: tokenPair.expiresIn,
        refreshExpiresIn: tokenPair.refreshExpiresIn,
      };
    } catch (error) {
      logger.error('登录时出错:', error);
      throw error;
    }
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(refreshTokenData: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      const { refreshToken } = refreshTokenData;

      // 验证刷新令牌
      const payload = JWTUtil.verifyRefreshToken(refreshToken);

      // 查找用户
      const user = await User.findByPk(payload.userId);
      if (!user || !user.get('isActive')) {
        throw new AppError('无效的刷新令牌或用户不存在', 401);
      }

      // 验证Redis中的refreshToken（如果使用Redis）
      if (redisClient.isOpen) {
        const cachedRefreshToken = await redisClient.get(`refresh:${user.id}`);
        if (cachedRefreshToken !== refreshToken) {
          throw new AppError('无效的刷新令牌', 401);
        }
      }

      // 生成新的双token对
      const tokenPair = JWTUtil.generateTokenPair(user.toJSON() as IUser);

      // 更新Redis中的refreshToken
      if (redisClient.isOpen) {
        await redisClient.setEx(
          `refresh:${user.id}`,
          7 * 24 * 3600, // 7天过期
          tokenPair.refreshToken
        );
        // 更新用户缓存
        await redisClient.setEx(
          `user:${user.id}`,
          3600, // 1小时过期
          JSON.stringify(user.toJSON())
        );
      }

      logger.info(`Token已刷新: ${user.email}`);

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        refreshExpiresIn: tokenPair.refreshExpiresIn,
      };
    } catch (error) {
      logger.error('刷新token时出错:', error);
      throw error;
    }
  }

  /**
   * 登出（废除刷新令牌）
   */
  static async logout(userId: string): Promise<void> {
    try {
      // 从Redis中删除刷新令牌
      if (redisClient.isOpen) {
        await redisClient.del(`refresh:${userId}`);
        await redisClient.del(`user:${userId}`);
      }

      logger.info(`用户已登出: ${userId}`);
    } catch (error) {
      logger.error('登出时出错:', error);
      throw error;
    }
  }

  /**
   * 获取用户列表（分页）
   */
  static async getUsers(query: PaginationQuery): Promise<PaginatedResponse<Omit<IUser, 'password'>>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = query;
      const offset = (page - 1) * limit;

      // 构建查询条件
      const whereClause: any = {};
      if (search) {
        whereClause[Op.or] = [{ email: { [Op.iLike]: `%${search}%` } }, { username: { [Op.iLike]: `%${search}%` } }, { firstName: { [Op.iLike]: `%${search}%` } }, { lastName: { [Op.iLike]: `%${search}%` } }];
      }

      // 查询用户
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
    } catch (error) {
      logger.error('获取用户列表时出错:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取用户
   */
  static async getUserById(userId: string): Promise<Omit<IUser, 'password'>> {
    try {
      // 先尝试从 Redis 缓存获取
      if (redisClient.isOpen) {
        const cached = await redisClient.get(`user:${userId}`);
        if (cached) {
          logger.debug(`用户 ${userId} 从缓存中获取`);
          return JSON.parse(cached);
        }
      }

      // 从数据库获取
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        throw new AppError('用户未找到', 404);
      }

      // 缓存到 Redis
      if (redisClient.isOpen) {
        await redisClient.setEx(
          `user:${userId}`,
          3600, // 1小时过期
          JSON.stringify(user.toJSON())
        );
      }

      return user.toJSON();
    } catch (error) {
      logger.error(`获取用户 ${userId} 时出错:`, error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUser(userId: string, updateData: UpdateUserRequest): Promise<Omit<IUser, 'password'>> {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new AppError('用户未找到', 404);
      }

      // 检查邮箱或用户名是否被其他用户使用
      if (updateData.email || updateData.username) {
        const whereClause: any = {
          id: { [Op.ne]: userId },
        };

        if (updateData.email) {
          whereClause.email = updateData.email;
        }
        if (updateData.username) {
          whereClause.username = updateData.username;
        }

        const existingUser = await User.findOne({ where: whereClause });
        if (existingUser) {
          throw new AppError(updateData.email && existingUser.email === updateData.email ? '邮箱已存在' : '用户名已存在', 409);
        }
      }

      // 更新用户
      await user.update(updateData);

      // 清除 Redis 缓存
      if (redisClient.isOpen) {
        await redisClient.del(`user:${userId}`);
      }

      logger.info(`用户已更新: ${user.email}`);

      return user.toJSON();
    } catch (error) {
      logger.error(`更新用户 ${userId} 时出错:`, error);
      throw error;
    }
  }

  /**
   * 删除用户（软删除）
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new AppError('用户未找到', 404);
      }

      // 软删除
      await user.destroy();

      // 清除 Redis 缓存
      if (redisClient.isOpen) {
        await redisClient.del(`user:${userId}`);
      }

      logger.info(`用户已删除: ${user.get('username')}`);
    } catch (error) {
      logger.error(`删除用户 ${userId} 时出错:`, error);
      throw error;
    }
  }

  /**
   * 更改用户密码
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await User.scope('withPassword').findByPk(userId);

      if (!user) {
        throw new AppError('用户未找到', 404);
      }

      // 验证当前密码
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AppError('当前密码不正确', 400);
      }

      // 更新密码
      await user.update({ password: newPassword });

      logger.info(`用户密码已更改: ${user.email}`);
    } catch (error) {
      logger.error(`为用户 ${userId} 更改密码时出错:`, error);
      throw error;
    }
  }

  /**
   * 激活/停用用户
   */
  static async toggleUserStatus(userId: string): Promise<Omit<IUser, 'password'>> {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new AppError('用户未找到', 404);
      }

      await user.update({ isActive: !user.get('isActive') });

      // 清除 Redis 缓存
      if (redisClient.isOpen) {
        await redisClient.del(`user:${userId}`);
      }

      logger.info(`用户状态已切换: ${user.email} - 活跃: ${user.get('isActive')}`);

      return user.toJSON();
    } catch (error) {
      logger.error(`切换用户 ${userId} 状态时出错:`, error);
      throw error;
    }
  }
}

// 为 Sequelize 模型添加 scope
User.addScope('withPassword', {
  attributes: { include: ['password'] },
});
