import { Op } from 'sequelize';
import { Ranking } from '@models/Ranking';
import { redisClient } from '@config/database';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import type { IRanking, CreateRankingRequest, UpdateRankingRequest, RankingQuery, PaginatedResponse, RankingStats } from '../types';

export class RankingService {
  private static readonly CACHE_TTL = 300; // 5分钟缓存
  private static readonly STATS_CACHE_TTL = 600; // 统计信息缓存10分钟
  private static readonly CACHE_KEY_PREFIX = 'ranking:';
  private static readonly DEFAULT_SEARCH_LIMIT = 20;
  private static readonly DEFAULT_PAGE_LIMIT = 10;

  // 等级分数映射
  private static readonly GRADE_RANGES = {
    S: { [Op.gte]: 900 },
    A: { [Op.and]: [{ [Op.gte]: 800 }, { [Op.lt]: 900 }] },
    B: { [Op.and]: [{ [Op.gte]: 700 }, { [Op.lt]: 800 }] },
    C: { [Op.and]: [{ [Op.gte]: 600 }, { [Op.lt]: 700 }] },
    D: { [Op.and]: [{ [Op.gte]: 500 }, { [Op.lt]: 600 }] },
    E: { [Op.lt]: 500 },
  } as const;

  /**
   * 缓存助手方法
   */
  private static async getFromCache<T>(key: string): Promise<T | null> {
    if (!redisClient.isOpen) return null;

    try {
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.debug('缓存读取失败:', error);
      return null;
    }
  }

  private static async setCache(key: string, data: any, ttl: number = this.CACHE_TTL): Promise<void> {
    if (!redisClient.isOpen) return;

    try {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.debug('缓存写入失败:', error);
    }
  }

  /**
   * 构建查询条件
   */
  private static buildWhereClause(query: RankingQuery): any {
    const { search, name, minScore, maxScore, grade } = query;
    const whereClause: any = {};

    // 姓名搜索
    if (search || name) {
      const searchTerm = search || name;
      whereClause.name = { [Op.like]: `%${searchTerm}%` };
    }

    // 分数范围筛选
    if (minScore !== undefined || maxScore !== undefined) {
      whereClause.score = {};
      if (minScore !== undefined) whereClause.score[Op.gte] = minScore;
      if (maxScore !== undefined) whereClause.score[Op.lte] = maxScore;
    }

    // 等级筛选
    if (grade && this.GRADE_RANGES[grade]) {
      whereClause.score = this.GRADE_RANGES[grade];
    }

    return whereClause;
  }

  /**
   * 构建排序条件
   */
  private static buildOrderClause(sortBy: string = 'rankPosition', sortOrder: string = 'asc'): Array<[string, string]> {
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

    return orderClause;
  }

  /**
   * 执行带缓存的操作
   */
  private static async executeWithCache<T>(cacheKey: string, operation: () => Promise<T>, ttl: number = this.CACHE_TTL): Promise<T> {
    // 尝试从缓存获取
    const cached = await this.getFromCache<T>(cacheKey);
    if (cached) {
      logger.debug(`从缓存获取数据: ${cacheKey}`);
      return cached;
    }

    // 执行操作
    const result = await operation();

    // 缓存结果
    await this.setCache(cacheKey, result, ttl);

    return result;
  }

  /**
   * 检查姓名是否已存在
   */
  private static async checkNameExists(name: string, excludeId?: number): Promise<void> {
    const whereClause: any = { name };
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const existingRanking = await Ranking.findOne({ where: whereClause });
    if (existingRanking) {
      throw new AppError('该姓名已存在排行榜中', 409);
    }
  }

  /**
   * 创建新的排名记录
   */
  static async createRanking(data: CreateRankingRequest): Promise<IRanking> {
    await this.checkNameExists(data.name);

    const ranking = await Ranking.create(data);
    await this.clearCache();

    logger.info(`新排名记录已创建: ${ranking.name} - ${ranking.score}分`);
    return ranking.toJSON();
  }

  /**
   * 获取排名列表（支持分页和筛选）
   */
  static async getRankings(query: RankingQuery): Promise<PaginatedResponse<IRanking>> {
    const { page = 1, limit = this.DEFAULT_PAGE_LIMIT, sortBy = 'rankPosition', sortOrder = 'asc' } = query;
    const offset = (page - 1) * limit;
    const cacheKey = `${this.CACHE_KEY_PREFIX}list:${JSON.stringify(query)}`;

    return this.executeWithCache(cacheKey, async () => {
      const whereClause = this.buildWhereClause(query);
      const orderClause = this.buildOrderClause(sortBy, sortOrder);

      const { rows: rankings, count: total } = await Ranking.findAndCountAll({
        where: whereClause,
        order: orderClause,
        limit,
        offset,
      });

      const totalPages = Math.ceil(total / limit);

      return {
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
    });
  }

  /**
   * 根据ID获取排名记录
   */
  static async getRankingById(id: number): Promise<IRanking> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;

    return this.executeWithCache(cacheKey, async () => {
      const ranking = await Ranking.findByPk(id);

      if (!ranking) {
        throw new AppError('排名记录未找到', 404);
      }

      return ranking.toJSON();
    });
  }

  /**
   * 更新排名记录
   */
  static async updateRanking(id: number, updateData: UpdateRankingRequest): Promise<IRanking> {
    const ranking = await Ranking.findByPk(id);

    if (!ranking) {
      throw new AppError('排名记录未找到', 404);
    }

    // 如果更新姓名，检查是否重复
    if (updateData.name && updateData.name !== ranking.name) {
      await this.checkNameExists(updateData.name, id);
    }

    await ranking.update(updateData);
    await Promise.all([this.clearCache(), this.clearCache(id.toString())]);

    logger.info(`排名记录已更新: ${ranking.name} - ${ranking.score}分`);
    return ranking.toJSON();
  }

  /**
   * 删除排名记录
   */
  static async deleteRanking(id: number): Promise<void> {
    const ranking = await Ranking.findByPk(id);

    if (!ranking) {
      throw new AppError('排名记录未找到', 404);
    }

    await ranking.destroy();
    await Promise.all([this.clearCache(), this.clearCache(id.toString())]);

    logger.info(`排名记录已删除: ${ranking.name}`);
  }

  /**
   * 批量删除排名记录
   */
  static async batchDeleteRankings(ids: number[]): Promise<void> {
    const deleteCount = await Ranking.destroy({
      where: { id: { [Op.in]: ids } },
    });

    if (deleteCount === 0) {
      throw new AppError('没有找到要删除的记录', 404);
    }

    await this.clearCache();
    logger.info(`批量删除了 ${deleteCount} 条排名记录`);
  }

  /**
   * 获取排名统计信息
   */
  static async getRankingStats(): Promise<RankingStats> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}stats`;

    return this.executeWithCache(
      cacheKey,
      async () => {
        return await Ranking.getStats();
      },
      this.STATS_CACHE_TTL
    );
  }

  /**
   * 手动重新计算所有排名
   */
  static async recalculateRankings(): Promise<void> {
    await Ranking.recalculateRankings();
    await this.clearCache();
    logger.info('排名重新计算完成');
  }

  /**
   * 获取前N名排行榜
   */
  static async getTopRankings(limit: number = this.DEFAULT_PAGE_LIMIT): Promise<IRanking[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}top:${limit}`;

    return this.executeWithCache(cacheKey, async () => {
      const rankings = await Ranking.findAll({
        where: {
          rankPosition: { [Op.ne]: null as any },
        } as any,
        order: [['rankPosition', 'ASC']],
        limit,
      });

      return rankings.map((ranking) => ranking.toJSON());
    });
  }

  /**
   * 根据姓名搜索排名记录
   */
  static async searchByName(name: string): Promise<IRanking[]> {
    const rankings = await Ranking.findAll({
      where: { name: { [Op.like]: `%${name}%` } },
      order: [['rankPosition', 'ASC']],
      limit: this.DEFAULT_SEARCH_LIMIT,
    });

    return rankings.map((ranking) => ranking.toJSON());
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
