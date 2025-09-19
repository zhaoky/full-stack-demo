import type { Response, NextFunction } from 'express';
import { RankingService } from '@services/rankingService';
import { ApiResponseUtil } from '@utils/apiResponse';
import { asyncHandler } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import type { AuthenticatedRequest, RankingQuery } from '@types/index';

export class RankingController {
  /**
   * 创建排名记录
   */
  static createRanking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const rankingData = req.body;
    const ranking = await RankingService.createRanking(rankingData);

    logger.info(`排名记录已创建: ${ranking.name} - ${ranking.score}分`, { userId: req.user?.id });
    ApiResponseUtil.created(res, '排名记录创建成功', ranking);
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
  static getRankingById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const ranking = await RankingService.getRankingById(parseInt(id));

    ApiResponseUtil.success(res, '排名记录获取成功', ranking);
  });

  /**
   * 更新排名记录
   */
  static updateRanking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const ranking = await RankingService.updateRanking(parseInt(id), updateData);

    logger.info(`排名记录已更新: ${ranking.name} - ${ranking.score}分`, { userId: req.user?.id });
    ApiResponseUtil.success(res, '排名记录更新成功', ranking);
  });

  /**
   * 删除排名记录
   */
  static deleteRanking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    await RankingService.deleteRanking(parseInt(id));

    logger.info(`排名记录已删除, ID: ${id}`, { userId: req.user?.id });
    ApiResponseUtil.success(res, '排名记录删除成功');
  });

  /**
   * 批量删除排名记录
   */
  static batchDeleteRankings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { ids } = req.body;

    await RankingService.batchDeleteRankings(ids);

    logger.info(`批量删除排名记录: ${ids.join(', ')}`, { userId: req.user?.id });
    ApiResponseUtil.success(res, '批量删除成功');
  });

  /**
   * 获取排名统计信息
   */
  static getRankingStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await RankingService.getRankingStats();

    ApiResponseUtil.success(res, '排名统计信息获取成功', stats);
  });

  /**
   * 手动重新计算排名
   */
  static recalculateRankings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await RankingService.recalculateRankings();

    logger.info('管理员触发排名重新计算', { userId: req.user?.id });
    ApiResponseUtil.success(res, '排名重新计算完成');
  });

  /**
   * 获取前N名排行榜
   */
  static getTopRankings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    // 限制最大查询数量
    const maxLimit = Math.min(limit, 100);

    const rankings = await RankingService.getTopRankings(maxLimit);

    ApiResponseUtil.success(res, `前${maxLimit}名排行榜获取成功`, rankings);
  });

  /**
   * 根据姓名搜索排名记录
   */
  static searchByName = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name } = req.query;

    if (!name || typeof name !== 'string') {
      ApiResponseUtil.validationError(res, '请提供要搜索的姓名');
      return;
    }

    const rankings = await RankingService.searchByName(name);

    ApiResponseUtil.success(res, '搜索完成', {
      query: name,
      results: rankings,
      count: rankings.length,
    });
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
      percentage: ((item.count / stats.total) * 100).toFixed(2) + '%',
    }));

    ApiResponseUtil.success(res, '分数等级分布获取成功', {
      total: stats.total,
      distribution: gradeDistribution,
    });
  });

  /**
   * 获取排名变化趋势（如果需要历史数据功能）
   */
  static getRankingTrends = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // 这里可以实现排名变化趋势的逻辑
    // 目前返回一个占位响应
    ApiResponseUtil.success(res, '排名趋势功能暂未实现', {
      message: '该功能需要历史数据支持，可在后续版本中实现',
    });
  });

  /**
   * 导出排名数据（CSV格式）
   */
  static exportRankings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as unknown as RankingQuery;

    // 设置大的限制数来获取所有数据
    const exportQuery = {
      ...query,
      page: 1,
      limit: 10000, // 足够大的数字来获取所有记录
    };

    const rankings = await RankingService.getRankings(exportQuery);

    // 生成CSV数据
    const csvHeader = 'ID,姓名,分数,排名,等级,创建时间,更新时间\n';
    const csvData = rankings.data
      .map((ranking) => {
        const grade = ranking.score >= 900 ? 'S' : ranking.score >= 800 ? 'A' : ranking.score >= 700 ? 'B' : ranking.score >= 600 ? 'C' : ranking.score >= 500 ? 'D' : 'E';

        return [
          ranking.id,
          `"${ranking.name}"`, // 用引号包围姓名以防止CSV解析问题
          ranking.score,
          ranking.rankPosition || '',
          grade,
          new Date(ranking.createdAt).toLocaleString('zh-CN'),
          new Date(ranking.updatedAt).toLocaleString('zh-CN'),
        ].join(',');
      })
      .join('\n');

    const csv = csvHeader + csvData;

    // 设置响应头
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="rankings_${new Date().toISOString().split('T')[0]}.csv"`);

    // 添加BOM以支持Excel正确显示中文
    res.write('\uFEFF');
    res.end(csv);

    logger.info('排名数据导出', {
      userId: req.user?.id,
      recordCount: rankings.data.length,
    });
  });
}
