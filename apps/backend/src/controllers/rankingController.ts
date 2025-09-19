import type { Response } from 'express';
import { RankingService } from '@services/rankingService';
import { ApiResponseUtil } from '@utils/apiResponse';
import { asyncHandler } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import type { AuthenticatedRequest, RankingQuery } from '../types/index';

export class RankingController {
  // 通用的参数解析方法
  private static parseIdParam(id: string): number {
    const parsedId = parseInt(id);
    if (isNaN(parsedId) || parsedId <= 0) {
      throw new Error('无效的ID参数');
    }
    return parsedId;
  }

  // 通用的限制解析方法
  private static parseLimit(limit?: string, defaultLimit = 10, maxLimit = 100): number {
    const parsedLimit = parseInt(limit || defaultLimit.toString()) || defaultLimit;
    return Math.min(parsedLimit, maxLimit);
  }

  // 分数等级计算
  private static getScoreGrade(score: number): string {
    if (score >= 900) return 'S';
    if (score >= 800) return 'A';
    if (score >= 700) return 'B';
    if (score >= 600) return 'C';
    if (score >= 500) return 'D';
    return 'E';
  }

  // CSV数据格式化
  private static formatRankingForCSV(ranking: any): string {
    const grade = this.getScoreGrade(ranking.score);
    return [ranking.id, `"${ranking.name}"`, ranking.score, ranking.rankPosition || '', grade, new Date(ranking.createdAt).toLocaleString('zh-CN'), new Date(ranking.updatedAt).toLocaleString('zh-CN')].join(',');
  }
  /**
   * 创建排名记录
   */
  static createRanking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const rankingData = req.body;
    const ranking = await RankingService.createRanking(rankingData);

    logger.info(`排名记录已创建: ${ranking.name} - ${ranking.score}分`, { userId: req.user?.id });
    ApiResponseUtil.created(res, ranking, '排名记录创建成功');
  });

  /**
   * 获取排名列表（支持分页、搜索、筛选和排序）
   */
  static getRankings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as unknown as RankingQuery;
    const rankings = await RankingService.getRankings(query);

    ApiResponseUtil.paginated(res, rankings.data, rankings.pagination.page, rankings.pagination.limit, rankings.pagination.total, '排名列表获取成功');
  });

  /**
   * 根据ID获取排名记录
   */
  static getRankingById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      ApiResponseUtil.validationError(res, 'ID参数是必需的');
      return;
    }
    const parsedId = RankingController.parseIdParam(id);
    const ranking = await RankingService.getRankingById(parsedId);

    ApiResponseUtil.ok(res, ranking, '排名记录获取成功');
  });

  /**
   * 更新排名记录
   */
  static updateRanking = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      ApiResponseUtil.validationError(res, 'ID参数是必需的');
      return;
    }
    const parsedId = RankingController.parseIdParam(id);
    const ranking = await RankingService.updateRanking(parsedId, req.body);

    logger.info(`排名记录已更新: ${ranking.name} - ${ranking.score}分`, { userId: req.user?.id });
    ApiResponseUtil.ok(res, ranking, '排名记录更新成功');
  });

  /**
   * 删除排名记录
   */
  static deleteRanking = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      ApiResponseUtil.validationError(res, 'ID参数是必需的');
      return;
    }
    const parsedId = RankingController.parseIdParam(id);
    await RankingService.deleteRanking(parsedId);

    logger.info(`排名记录已删除, ID: ${parsedId}`, { userId: req.user?.id });
    ApiResponseUtil.ok(res, undefined, '排名记录删除成功');
  });

  /**
   * 批量删除排名记录
   */
  static batchDeleteRankings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { ids } = req.body;

    await RankingService.batchDeleteRankings(ids);

    logger.info(`批量删除排名记录: ${ids.join(', ')}`, { userId: req.user?.id });
    ApiResponseUtil.ok(res, undefined, '批量删除成功');
  });

  /**
   * 获取排名统计信息
   */
  static getRankingStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await RankingService.getRankingStats();

    ApiResponseUtil.ok(res, stats, '排名统计信息获取成功');
  });

  /**
   * 手动重新计算排名
   */
  static recalculateRankings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await RankingService.recalculateRankings();

    logger.info('管理员触发排名重新计算', { userId: req.user?.id });
    ApiResponseUtil.ok(res, undefined, '排名重新计算完成');
  });

  /**
   * 获取前N名排行榜
   */
  static getTopRankings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const limit = RankingController.parseLimit(req.query.limit as string);
    const rankings = await RankingService.getTopRankings(limit);

    ApiResponseUtil.ok(res, rankings, `前${limit}名排行榜获取成功`);
  });

  /**
   * 根据姓名搜索排名记录
   */
  static searchByName = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { name } = req.query;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      ApiResponseUtil.validationError(res, '请提供要搜索的姓名');
      return;
    }

    const rankings = await RankingService.searchByName(name.trim());

    ApiResponseUtil.ok(
      res,
      {
        query: name,
        results: rankings,
        count: rankings.length,
      },
      '搜索完成'
    );
  });

  /**
   * 获取分数等级分布
   */
  static getScoreGradeDistribution = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await RankingService.getRankingStats();

    // 格式化等级分布数据
    const gradeDistribution = stats.scoreDistribution.map((item) => ({
      grade: item.grade,
      count: item.count,
      percentage: `${((item.count / stats.total) * 100).toFixed(2)}%`,
    }));

    ApiResponseUtil.ok(
      res,
      {
        total: stats.total,
        distribution: gradeDistribution,
      },
      '分数等级分布获取成功'
    );
  });

  /**
   * 获取排名变化趋势（如果需要历史数据功能）
   */
  static getRankingTrends = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // 这里可以实现排名变化趋势的逻辑
    // 目前返回一个占位响应
    ApiResponseUtil.ok(
      res,
      {
        message: '该功能需要历史数据支持，可在后续版本中实现',
      },
      '排名趋势功能暂未实现'
    );
  });

  /**
   * 导出排名数据（CSV格式）
   */
  static exportRankings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as unknown as RankingQuery;

    // 获取所有数据用于导出
    const exportQuery = { ...query, page: 1, limit: 10000 };
    const rankings = await RankingService.getRankings(exportQuery);

    // 生成CSV数据
    const csvHeader = 'ID,姓名,分数,排名,等级,创建时间,更新时间\n';
    const csvData = rankings.data.map(RankingController.formatRankingForCSV).join('\n');

    // 设置响应头并发送数据
    const filename = `rankings_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // 添加BOM以支持Excel正确显示中文
    res.write('\uFEFF');
    res.end(csvHeader + csvData);

    logger.info('排名数据导出', {
      userId: req.user?.id,
      recordCount: rankings.data.length,
    });
  });
}
