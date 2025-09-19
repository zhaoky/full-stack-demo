import { request } from '@utils/request';
import type { ApiResponse, PaginatedResponse, IUser, CreateUserRequest, UpdateUserRequest, LoginRequest, AuthResponse, RefreshTokenRequest, RefreshTokenResponse, PaginationQuery } from '@types/api';

/**
 * 用户登录
 */
export const login = (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
  return request.post('/users/login', data);
};

/**
 * 用户注册
 */
export const register = (data: CreateUserRequest): Promise<ApiResponse<IUser>> => {
  return request.post('/users/register', data);
};

/**
 * 刷新访问令牌
 */
export const refreshToken = (data: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> => {
  return request.post('/users/refresh-token', data);
};

/**
 * 用户登出
 */
export const logout = (): Promise<ApiResponse> => {
  return request.post('/users/logout');
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = (): Promise<ApiResponse<IUser>> => {
  return request.get('/users/me');
};

/**
 * 更新当前用户信息
 */
export const updateCurrentUser = (data: UpdateUserRequest): Promise<ApiResponse<IUser>> => {
  return request.put('/users/me', data);
};

/**
 * 修改密码
 */
export const changePassword = (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> => {
  return request.post('/users/change-password', data);
};

/**
 * 获取用户列表（管理员）
 */
export const getUserList = (params: PaginationQuery): Promise<ApiResponse<PaginatedResponse<IUser>>> => {
  return request.get('/users', { params });
};

/**
 * 获取用户统计信息（管理员）
 */
export const getUserStats = (): Promise<ApiResponse<any>> => {
  return request.get('/users/stats');
};

/**
 * 根据ID获取用户（管理员）
 */
export const getUserById = (id: string): Promise<ApiResponse<IUser>> => {
  return request.get(`/users/${id}`);
};

/**
 * 更新用户信息（管理员）
 */
export const updateUser = (id: string, data: UpdateUserRequest): Promise<ApiResponse<IUser>> => {
  return request.put(`/users/${id}`, data);
};

/**
 * 删除用户（管理员）
 */
export const deleteUser = (id: string): Promise<ApiResponse> => {
  return request.delete(`/users/${id}`);
};

/**
 * 切换用户状态（管理员）
 */
export const toggleUserStatus = (id: string): Promise<ApiResponse<IUser>> => {
  return request.patch(`/users/${id}/toggle-status`);
};
