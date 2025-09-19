import type { BaseNumericEntity } from './base';
import type { PaginationQuery } from './api';

/**
 * 分数等级
 */
export type ScoreGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * 排行榜记录接口
 */
export interface IRanking extends BaseNumericEntity {
  name: string;
  score: number;
  rankPosition?: number;
}

/**
 * 创建排行榜记录请求
 */
export interface CreateRankingRequest {
  name: string;
  score: number;
}

/**
 * 更新排行榜记录请求
 */
export interface UpdateRankingRequest {
  name?: string;
  score?: number;
}

/**
 * 排行榜查询参数
 */
export interface RankingQuery extends PaginationQuery {
  name?: string;
  minScore?: number;
  maxScore?: number;
  grade?: ScoreGrade;
}

/**
 * 排行榜统计信息
 */
export interface RankingStats {
  total: number;
  maxScore: number;
  minScore: number;
  avgScore: number;
  scoreDistribution: Array<{
    grade: string;
    count: number;
  }>;
}

/**
 * 分数等级配置
 */
export const SCORE_GRADES = {
  S: { min: 900, max: 1000, color: '#f56c6c', label: 'S级' },
  A: { min: 800, max: 899, color: '#e6a23c', label: 'A级' },
  B: { min: 700, max: 799, color: '#409eff', label: 'B级' },
  C: { min: 600, max: 699, color: '#67c23a', label: 'C级' },
  D: { min: 500, max: 599, color: '#909399', label: 'D级' },
  E: { min: 0, max: 499, color: '#606266', label: 'E级' },
} as const;
