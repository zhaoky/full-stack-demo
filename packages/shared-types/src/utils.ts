import type { ScoreGrade } from './ranking';

/**
 * 深度部分类型（递归可选）
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 去除只读属性
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * 键值对类型
 */
export type KeyValuePair<K = string, V = any> = {
  key: K;
  value: V;
};

/**
 * 函数类型工具
 */
export type AnyFunction = (...args: any[]) => any;
export type VoidFunction = () => void;
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

/**
 * 数组元素类型提取
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * 对象值类型提取
 */
export type ValueOf<T> = T[keyof T];

/**
 * 获取分数等级的工具函数类型
 */
export type GetScoreGradeFn = (score: number) => ScoreGrade;

/**
 * 时间格式选项
 */
export type DateFormat = 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm:ss' | 'MM-DD HH:mm' | 'HH:mm:ss' | 'relative';

/**
 * 排序方向
 */
export type SortOrder = 'asc' | 'desc';

/**
 * 通用筛选器类型
 */
export interface Filter<T = any> {
  field: keyof T;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'nin';
  value: any;
}

/**
 * 通用排序器类型
 */
export interface Sorter<T = any> {
  field: keyof T;
  order: SortOrder;
}

/**
 * 文件上传相关类型
 */
export interface FileUpload {
  file: File | Blob | Buffer;
  url?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

/**
 * 浏览器File类型兼容性声明
 */
declare global {
  interface File extends Blob {
    readonly name: string;
    readonly lastModified: number;
  }
}
