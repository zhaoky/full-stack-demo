import { Router } from 'express';
import { RankingController } from '@controllers/rankingController';
import { routeGroups } from './middleware/routeGroups';
import { validators } from './validators';
import { withAsyncHandler } from './handlers/responseHandlers';

const router: Router = Router();

/**
 * 公开路由组
 * 无需认证的路由
 */
const publicRoutes = Router();

// 获取排名列表（支持分页、搜索、筛选、排序）
publicRoutes.get('/', validators.ranking.query, withAsyncHandler(RankingController.getRankings));

// 获取前N名排行榜
publicRoutes.get('/top', validators.ranking.topQuery, withAsyncHandler(RankingController.getTopRankings));

// 根据姓名搜索
publicRoutes.get('/search', validators.ranking.searchQuery, withAsyncHandler(RankingController.searchByName));

// 获取统计信息
publicRoutes.get('/stats', withAsyncHandler(RankingController.getRankingStats));

// 获取分数等级分布
publicRoutes.get('/grade-distribution', withAsyncHandler(RankingController.getScoreGradeDistribution));

// 获取指定ID的排名记录
publicRoutes.get('/:id', validators.ranking.params, withAsyncHandler(RankingController.getRankingById));

/**
 * 认证路由组
 * 需要用户认证的路由
 */
const authRoutes = Router();

// 导出排名数据
authRoutes.get('/export/csv', ...routeGroups.sensitiveOperation, validators.ranking.query, withAsyncHandler(RankingController.exportRankings));

// 获取排名趋势
authRoutes.get('/trends/history', withAsyncHandler(RankingController.getRankingTrends));

/**
 * 版主路由组
 * 需要版主或管理员权限的路由
 */
const moderatorRoutes = Router();

// 创建排名记录
moderatorRoutes.post('/', ...routeGroups.createWithAuth, validators.ranking.create, withAsyncHandler(RankingController.createRanking));

// 更新排名记录
moderatorRoutes.put('/:id', ...routeGroups.generalOperation, validators.ranking.params, validators.ranking.update, withAsyncHandler(RankingController.updateRanking));

// 删除排名记录
moderatorRoutes.delete('/:id', ...routeGroups.sensitiveOperation, validators.ranking.params, withAsyncHandler(RankingController.deleteRanking));

// 批量删除排名记录
moderatorRoutes.post('/batch/delete', ...routeGroups.sensitiveOperation, validators.ranking.batchDelete, withAsyncHandler(RankingController.batchDeleteRankings));

/**
 * 管理员路由组
 * 仅管理员可访问的路由
 */
const adminRoutes = Router();

// 手动重新计算排名
adminRoutes.post('/recalculate', ...routeGroups.sensitiveOperation, withAsyncHandler(RankingController.recalculateRankings));

/**
 * 组合所有路由
 */
// 挂载公开路由
router.use('/', publicRoutes);

// 挂载认证路由
router.use('/', ...routeGroups.authenticated, authRoutes);

// 挂载版主路由
router.use('/', ...routeGroups.moderator, moderatorRoutes);

// 挂载管理员路由
router.use('/', ...routeGroups.admin, adminRoutes);

export default router;
