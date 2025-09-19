export * from './api';

/**
 * 路由元信息
 */
export interface RouteMeta {
  title?: string;
  icon?: string;
  requiresAuth?: boolean;
  roles?: string[];
  keepAlive?: boolean;
}

/**
 * 菜单项
 */
export interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  meta?: RouteMeta;
}

/**
 * 表格列配置
 */
export interface TableColumn {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  formatter?: (row: any, column: any, cellValue: any) => string;
}

/**
 * 弹窗配置
 */
export interface DialogConfig {
  title: string;
  width?: string | number;
  fullscreen?: boolean;
  destroyOnClose?: boolean;
  closeOnClickModal?: boolean;
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  title?: string;
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * 用户状态
 */
export interface UserState {
  userInfo: IUser | null;
  isLoggedIn: boolean;
}

/**
 * 应用状态
 */
export interface AppState {
  title: string;
  language: string;
  theme: 'light' | 'dark';
  collapsed: boolean;
  device: 'desktop' | 'mobile';
}

/**
 * 分数等级映射
 */
export const SCORE_GRADES = {
  S: { min: 900, max: 1000, color: '#f56c6c', label: 'S级' },
  A: { min: 800, max: 899, color: '#e6a23c', label: 'A级' },
  B: { min: 700, max: 799, color: '#409eff', label: 'B级' },
  C: { min: 600, max: 699, color: '#67c23a', label: 'C级' },
  D: { min: 500, max: 599, color: '#909399', label: 'D级' },
  E: { min: 0, max: 499, color: '#606266', label: 'E级' },
} as const;

/**
 * 获取分数等级
 */
export function getScoreGrade(score: number): keyof typeof SCORE_GRADES {
  if (score >= 900) return 'S';
  if (score >= 800) return 'A';
  if (score >= 700) return 'B';
  if (score >= 600) return 'C';
  if (score >= 500) return 'D';
  return 'E';
}
