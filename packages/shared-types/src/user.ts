import type { BaseEntity } from './base';

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
export interface IUser extends BaseEntity {
  email: string;
  username: string;
  password?: string; // 可选，前端不需要
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date | string;
  role: UserRole;
}

/**
 * 公开用户信息（不包含敏感信息）
 */
export type PublicUser = Omit<IUser, 'password'>;

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
  email: string;
  password: string;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * 认证响应
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
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
 * 用户状态（前端使用）
 */
export interface UserState {
  userInfo: PublicUser | null;
  token: string | null;
  isLoggedIn: boolean;
}
