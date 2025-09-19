/**
 * API 响应基础类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * 分页查询参数
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * 分页响应数据
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

/**
 * 用户接口
 */
export interface IUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date | string;
  role: UserRole;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

/**
 * 创建用户请求
 */
export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

/**
 * 更新用户请求
 */
export interface UpdateUserRequest {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive?: boolean;
  role?: UserRole;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录响应
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
  expiresIn: string;
  refreshExpiresIn: string;
}

/**
 * 刷新令牌请求
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * 刷新令牌响应
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

/**
 * 排行榜记录接口
 */
export interface IRanking {
  id: number;
  name: string;
  score: number;
  rankPosition?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
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
  grade?: 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
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
 * 表单验证错误
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
