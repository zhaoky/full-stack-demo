import { request } from '@utils/request';
import type { ApiResponse, PaginatedResponse, IRanking, CreateRankingRequest, UpdateRankingRequest, RankingQuery, RankingStats } from '@types/api';

/**
 * 获取排行榜列表
 */
export const getRankingList = (params: RankingQuery): Promise<ApiResponse<PaginatedResponse<IRanking>>> => {
  return request.get('/rankings', { params });
};

/**
 * 获取前N名排行榜
 */
export const getTopRankings = (limit: number = 10): Promise<ApiResponse<IRanking[]>> => {
  return request.get('/rankings/top', { params: { limit } });
};

/**
 * 根据姓名搜索排行榜
 */
export const searchRankingsByName = (
  name: string
): Promise<
  ApiResponse<{
    query: string;
    results: IRanking[];
    count: number;
  }>
> => {
  return request.get('/rankings/search', { params: { name } });
};

/**
 * 获取排行榜统计信息
 */
export const getRankingStats = (): Promise<ApiResponse<RankingStats>> => {
  return request.get('/rankings/stats');
};

/**
 * 获取分数等级分布
 */
export const getScoreGradeDistribution = (): Promise<
  ApiResponse<{
    total: number;
    distribution: Array<{
      grade: string;
      count: number;
      percentage: string;
    }>;
  }>
> => {
  return request.get('/rankings/grade-distribution');
};

/**
 * 根据ID获取排行榜记录
 */
export const getRankingById = (id: number): Promise<ApiResponse<IRanking>> => {
  return request.get(`/rankings/${id}`);
};

/**
 * 导出排行榜数据（需要认证）
 */
export const exportRankings = (params: RankingQuery): Promise<Blob> => {
  return request.get('/rankings/export/csv', {
    params,
    responseType: 'blob',
  }) as any;
};

/**
 * 获取排行榜趋势（需要认证）
 */
export const getRankingTrends = (): Promise<ApiResponse<any>> => {
  return request.get('/rankings/trends/history');
};

/**
 * 创建排行榜记录（需要管理员权限）
 */
export const createRanking = (data: CreateRankingRequest): Promise<ApiResponse<IRanking>> => {
  return request.post('/rankings', data);
};

/**
 * 更新排行榜记录（需要管理员权限）
 */
export const updateRanking = (id: number, data: UpdateRankingRequest): Promise<ApiResponse<IRanking>> => {
  return request.put(`/rankings/${id}`, data);
};

/**
 * 删除排行榜记录（需要管理员权限）
 */
export const deleteRanking = (id: number): Promise<ApiResponse> => {
  return request.delete(`/rankings/${id}`);
};

/**
 * 批量删除排行榜记录（需要管理员权限）
 */
export const batchDeleteRankings = (ids: number[]): Promise<ApiResponse> => {
  return request.post('/rankings/batch/delete', { ids });
};

/**
 * 手动重新计算排名（需要管理员权限）
 */
export const recalculateRankings = (): Promise<ApiResponse> => {
  return request.post('/rankings/recalculate');
};
