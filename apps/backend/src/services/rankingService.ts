import { Op } from 'sequelize';
import { Ranking } from '@models/Ranking';
import { redisClient } from '@config/database';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import type { IRanking, CreateRankingRequest, UpdateRankingRequest, RankingQuery, PaginatedResponse, RankingStats } from '@types/index';

export class RankingService {
  private static readonly CACHE_TTL = 300; // 5分钟缓存
  private static readonly CACHE_KEY_PREFIX = 'ranking:';

  /**
   * 创建新的排名记录
   */
  static async createRanking(data: CreateRankingRequest): Promise<IRanking> {
    try {
      // 检查姓名是否已存在
      const existingRanking = await Ranking.findOne({
        where: { name: data.name },
      });

      if (existingRanking) {
        throw new AppError('该姓名已存在排行榜中', 409);
      }

      const ranking = await Ranking.create(data);

      // 清除相关缓存
      await this.clearCache();

      logger.info(`新排名记录已创建: ${ranking.name} - ${ranking.score}分`);
      return ranking.toJSON();
    } catch (error) {
      logger.error('创建排名记录时出错:', error);
      throw error;
    }
  }

  /**
   * 获取排名列表（支持分页和筛选）
   */
  static async getRankings(query: RankingQuery): Promise<PaginatedResponse<IRanking>> {
    try {
      const { page = 1, limit = 10, sortBy = 'rankPosition', sortOrder = 'asc', search, name, minScore, maxScore, grade } = query;

      const offset = (page - 1) * limit;

      // 构建查询条件
      const whereClause: any = {};

      // 姓名搜索
      if (search || name) {
        const searchTerm = search || name;
        whereClause.name = { [Op.like]: `%${searchTerm}%` };
      }

      // 分数范围筛选
      if (minScore !== undefined || maxScore !== undefined) {
        whereClause.score = {};
        if (minScore !== undefined) {
          whereClause.score[Op.gte] = minScore;
        }
        if (maxScore !== undefined) {
          whereClause.score[Op.lte] = maxScore;
        }
      }

      // 等级筛选
      if (grade) {
        const gradeRanges = {
          S: { [Op.gte]: 900 },
          A: { [Op.and]: [{ [Op.gte]: 800 }, { [Op.lt]: 900 }] },
          B: { [Op.and]: [{ [Op.gte]: 700 }, { [Op.lt]: 800 }] },
          C: { [Op.and]: [{ [Op.gte]: 600 }, { [Op.lt]: 700 }] },
          D: { [Op.and]: [{ [Op.gte]: 500 }, { [Op.lt]: 600 }] },
          E: { [Op.lt]: 500 },
        };
        whereClause.score = gradeRanges[grade];
      }

      // 缓存键
      const cacheKey = `${this.CACHE_KEY_PREFIX}list:${JSON.stringify(query)}`;

      // 尝试从缓存获取
      let cachedResult;
      if (redisClient.isOpen) {
        try {
          const cached = await redisClient.get(cacheKey);
          if (cached) {
            logger.debug('从缓存获取排名列表');
            return JSON.parse(cached);
          }
        } catch (error) {
          logger.debug('缓存读取失败:', error);
        }
      }

      // 构建排序条件
      const orderClause: Array<[string, string]> = [];
      if (sortBy === 'rankPosition') {
        orderClause.push(['rankPosition', sortOrder.toUpperCase()]);
        orderClause.push(['score', 'DESC']); // 排名相同时按分数降序
      } else if (sortBy === 'score') {
        orderClause.push(['score', sortOrder.toUpperCase()]);
        orderClause.push(['id', 'ASC']); // 分数相同时按ID升序
      } else {
        orderClause.push([sortBy, sortOrder.toUpperCase()]);
      }

      // 查询数据
      const { rows: rankings, count: total } = await Ranking.findAndCountAll({
        where: whereClause,
        order: orderClause,
        limit,
        offset,
      });

      const totalPages = Math.ceil(total / limit);

      const result = {
        data: rankings.map((ranking) => ranking.toJSON()),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      // 缓存结果
      if (redisClient.isOpen) {
        try {
          await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
        } catch (error) {
          logger.debug('缓存写入失败:', error);
        }
      }

      return result;
    } catch (error) {
      logger.error('获取排名列表时出错:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取排名记录
   */
  static async getRankingById(id: number): Promise<IRanking> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;

      // 尝试从缓存获取
      if (redisClient.isOpen) {
        try {
          const cached = await redisClient.get(cacheKey);
          if (cached) {
            logger.debug(`排名记录 ${id} 从缓存中获取`);
            return JSON.parse(cached);
          }
        } catch (error) {
          logger.debug('缓存读取失败:', error);
        }
      }

      const ranking = await Ranking.findByPk(id);

      if (!ranking) {
        throw new AppError('排名记录未找到', 404);
      }

      const result = ranking.toJSON();

      // 缓存结果
      if (redisClient.isOpen) {
        try {
          await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
        } catch (error) {
          logger.debug('缓存写入失败:', error);
        }
      }

      return result;
    } catch (error) {
      logger.error(`获取排名记录 ${id} 时出错:`, error);
      throw error;
    }
  }

  /**
   * 更新排名记录
   */
  static async updateRanking(id: number, updateData: UpdateRankingRequest): Promise<IRanking> {
    try {
      const ranking = await Ranking.findByPk(id);

      if (!ranking) {
        throw new AppError('排名记录未找到', 404);
      }

      // 如果更新姓名，检查是否重复
      if (updateData.name && updateData.name !== ranking.name) {
        const existingRanking = await Ranking.findOne({
          where: {
            name: updateData.name,
            id: { [Op.ne]: id },
          },
        });

        if (existingRanking) {
          throw new AppError('该姓名已存在排行榜中', 409);
        }
      }

      await ranking.update(updateData);

      // 清除相关缓存
      await this.clearCache();
      await this.clearCache(id.toString());

      logger.info(`排名记录已更新: ${ranking.name} - ${ranking.score}分`);
      return ranking.toJSON();
    } catch (error) {
      logger.error(`更新排名记录 ${id} 时出错:`, error);
      throw error;
    }
  }

  /**
   * 删除排名记录
   */
  static async deleteRanking(id: number): Promise<void> {
    try {
      const ranking = await Ranking.findByPk(id);

      if (!ranking) {
        throw new AppError('排名记录未找到', 404);
      }

      await ranking.destroy();

      // 清除相关缓存
      await this.clearCache();
      await this.clearCache(id.toString());

      logger.info(`排名记录已删除: ${ranking.name}`);
    } catch (error) {
      logger.error(`删除排名记录 ${id} 时出错:`, error);
      throw error;
    }
  }

  /**
   * 批量删除排名记录
   */
  static async batchDeleteRankings(ids: number[]): Promise<void> {
    try {
      const deleteCount = await Ranking.destroy({
        where: {
          id: { [Op.in]: ids },
        },
      });

      if (deleteCount === 0) {
        throw new AppError('没有找到要删除的记录', 404);
      }

      // 清除相关缓存
      await this.clearCache();

      logger.info(`批量删除了 ${deleteCount} 条排名记录`);
    } catch (error) {
      logger.error('批量删除排名记录时出错:', error);
      throw error;
    }
  }

  /**
   * 获取排名统计信息
   */
  static async getRankingStats(): Promise<RankingStats> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}stats`;

      // 尝试从缓存获取
      if (redisClient.isOpen) {
        try {
          const cached = await redisClient.get(cacheKey);
          if (cached) {
            logger.debug('从缓存获取排名统计信息');
            return JSON.parse(cached);
          }
        } catch (error) {
          logger.debug('缓存读取失败:', error);
        }
      }

      const stats = await Ranking.getStats();

      // 缓存结果（较长时间）
      if (redisClient.isOpen) {
        try {
          await redisClient.setEx(cacheKey, this.CACHE_TTL * 2, JSON.stringify(stats));
        } catch (error) {
          logger.debug('缓存写入失败:', error);
        }
      }

      return stats;
    } catch (error) {
      logger.error('获取排名统计信息时出错:', error);
      throw error;
    }
  }

  /**
   * 手动重新计算所有排名
   */
  static async recalculateRankings(): Promise<void> {
    try {
      await Ranking.recalculateRankings();

      // 清除所有相关缓存
      await this.clearCache();

      logger.info('排名重新计算完成');
    } catch (error) {
      logger.error('重新计算排名时出错:', error);
      throw error;
    }
  }

  /**
   * 获取前N名排行榜
   */
  static async getTopRankings(limit: number = 10): Promise<IRanking[]> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}top:${limit}`;

      // 尝试从缓存获取
      if (redisClient.isOpen) {
        try {
          const cached = await redisClient.get(cacheKey);
          if (cached) {
            logger.debug(`从缓存获取前${limit}名排行榜`);
            return JSON.parse(cached);
          }
        } catch (error) {
          logger.debug('缓存读取失败:', error);
        }
      }

      const rankings = await Ranking.findAll({
        where: {
          rankPosition: { [Op.ne]: null },
        },
        order: [['rankPosition', 'ASC']],
        limit,
      });

      const result = rankings.map((ranking) => ranking.toJSON());

      // 缓存结果
      if (redisClient.isOpen) {
        try {
          await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
        } catch (error) {
          logger.debug('缓存写入失败:', error);
        }
      }

      return result;
    } catch (error) {
      logger.error(`获取前${limit}名排行榜时出错:`, error);
      throw error;
    }
  }

  /**
   * 根据姓名搜索排名记录
   */
  static async searchByName(name: string): Promise<IRanking[]> {
    try {
      const rankings = await Ranking.findAll({
        where: {
          name: { [Op.like]: `%${name}%` },
        },
        order: [['rankPosition', 'ASC']],
        limit: 20, // 限制搜索结果数量
      });

      return rankings.map((ranking) => ranking.toJSON());
    } catch (error) {
      logger.error(`根据姓名搜索排名记录时出错:`, error);
      throw error;
    }
  }

  /**
   * 清除缓存
   */
  private static async clearCache(suffix?: string): Promise<void> {
    if (!redisClient.isOpen) return;

    try {
      if (suffix) {
        await redisClient.del(`${this.CACHE_KEY_PREFIX}${suffix}`);
      } else {
        // 清除所有相关缓存
        const keys = await redisClient.keys(`${this.CACHE_KEY_PREFIX}*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
    } catch (error) {
      logger.debug('清除缓存时出错:', error);
    }
  }
}
