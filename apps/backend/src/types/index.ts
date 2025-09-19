import type { Request, Response } from 'express';

// 基础接口
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// 用户相关类型
export interface IUser extends BaseEntity {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  role: UserRole;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive?: boolean;
  role?: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<IUser, 'password'>;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

// Express 扩展类型
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

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

// 错误类型
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: ValidationError[];
}

// 排行榜相关类型
export interface IRanking {
  id: number;
  name: string;
  score: number;
  rankPosition?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateRankingRequest {
  name: string;
  score: number;
}

export interface UpdateRankingRequest {
  name?: string;
  score?: number;
}

export interface RankingQuery extends PaginationQuery {
  name?: string;
  minScore?: number;
  maxScore?: number;
  grade?: 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
}

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

// 环境变量类型
export interface EnvironmentVariables {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  MYSQL_HOST: string;
  MYSQL_PORT: number;
  MYSQL_USERNAME: string;
  MYSQL_PASSWORD: string;
  MYSQL_DATABASE: string;
  MONGODB_URI: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_ROUNDS: number;
}
