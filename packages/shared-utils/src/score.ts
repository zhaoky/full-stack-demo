import type { ScoreGrade } from '../../shared-types/src';

/**
 * 获取分数等级
 */
export function getScoreGrade(score: number): ScoreGrade {
  if (score >= 900) return 'S';
  if (score >= 800) return 'A';
  if (score >= 700) return 'B';
  if (score >= 600) return 'C';
  if (score >= 500) return 'D';
  return 'E';
}

/**
 * 获取分数等级颜色
 */
export function getScoreColor(score: number): string {
  const grade = getScoreGrade(score);
  const colors = {
    S: '#f56c6c',
    A: '#e6a23c',
    B: '#409eff',
    C: '#67c23a',
    D: '#909399',
    E: '#606266',
  };
  return colors[grade];
}

/**
 * 获取分数等级标签
 */
export function getScoreLabel(score: number): string {
  const grade = getScoreGrade(score);
  const labels = {
    S: 'S级',
    A: 'A级',
    B: 'B级',
    C: 'C级',
    D: 'D级',
    E: 'E级',
  };
  return labels[grade];
}

/**
 * 验证分数范围
 */
export function isValidScore(score: number): boolean {
  return score >= 0 && score <= 1000;
}

/**
 * 格式化分数显示
 */
export function formatScore(score: number): string {
  if (!isValidScore(score)) {
    return 'Invalid';
  }
  return score.toFixed(0);
}
