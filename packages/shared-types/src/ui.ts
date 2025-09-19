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
 * 应用状态（前端使用）
 */
export interface AppState {
  title: string;
  language: string;
  theme: 'light' | 'dark';
  collapsed: boolean;
  device: 'desktop' | 'mobile';
}

/**
 * 主题颜色配置
 */
export interface ThemeColors {
  primary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

/**
 * 设备类型
 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

/**
 * 语言选项
 */
export interface LanguageOption {
  value: string;
  label: string;
  flag?: string;
}
