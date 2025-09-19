/**
 * 路由信息接口
 * 用于描述每个路由的元数据
 */
export interface RouteInfo {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: 'public' | 'user' | 'admin' | 'moderator';
  rateLimit?: 'none' | 'auth' | 'general' | 'create' | 'strict';
  deprecated?: boolean;
  version?: string;
  tags?: string[];
  summary?: string;
}

/**
 * 路由注册表
 * 记录所有API端点的信息，用于文档生成和API治理
 */
export const routeRegistry: RouteInfo[] = [
  // 用户相关路由
  {
    method: 'POST',
    path: '/api/v1/users/register',
    description: '用户注册',
    auth: 'public',
    rateLimit: 'auth',
    tags: ['用户管理', '认证'],
    summary: '创建新用户账户',
  },
  {
    method: 'POST',
    path: '/api/v1/users/login',
    description: '用户登录',
    auth: 'public',
    rateLimit: 'auth',
    tags: ['用户管理', '认证'],
    summary: '用户身份验证',
  },
  {
    method: 'POST',
    path: '/api/v1/users/refresh-token',
    description: '刷新访问令牌',
    auth: 'public',
    rateLimit: 'auth',
    tags: ['用户管理', '认证'],
    summary: '使用刷新令牌获取新的访问令牌',
  },
  {
    method: 'GET',
    path: '/api/v1/users/me',
    description: '获取当前用户信息',
    auth: 'user',
    tags: ['用户管理'],
    summary: '获取当前登录用户的详细信息',
  },
  {
    method: 'PUT',
    path: '/api/v1/users/me',
    description: '更新当前用户信息',
    auth: 'user',
    rateLimit: 'general',
    tags: ['用户管理'],
    summary: '更新当前登录用户的个人信息',
  },
  {
    method: 'POST',
    path: '/api/v1/users/logout',
    description: '用户登出',
    auth: 'user',
    tags: ['用户管理', '认证'],
    summary: '注销当前用户会话',
  },
  {
    method: 'POST',
    path: '/api/v1/users/change-password',
    description: '修改密码',
    auth: 'user',
    rateLimit: 'auth',
    tags: ['用户管理', '安全'],
    summary: '修改当前用户的登录密码',
  },

  // 排名相关路由
  {
    method: 'GET',
    path: '/api/v1/rankings',
    description: '获取排名列表',
    auth: 'public',
    tags: ['排名管理'],
    summary: '获取排名列表，支持分页、搜索、筛选、排序',
  },
  {
    method: 'GET',
    path: '/api/v1/rankings/top',
    description: '获取前N名排行榜',
    auth: 'public',
    tags: ['排名管理'],
    summary: '获取指定数量的顶级排名',
  },
  {
    method: 'GET',
    path: '/api/v1/rankings/search',
    description: '根据姓名搜索排名',
    auth: 'public',
    tags: ['排名管理', '搜索'],
    summary: '按姓名搜索排名记录',
  },
  {
    method: 'GET',
    path: '/api/v1/rankings/stats',
    description: '获取排名统计信息',
    auth: 'public',
    tags: ['排名管理', '统计'],
    summary: '获取排名系统的统计数据',
  },
  {
    method: 'GET',
    path: '/api/v1/rankings/grade-distribution',
    description: '获取分数等级分布',
    auth: 'public',
    tags: ['排名管理', '统计'],
    summary: '获取分数等级的分布情况',
  },
  {
    method: 'GET',
    path: '/api/v1/rankings/:id',
    description: '获取指定ID的排名记录',
    auth: 'public',
    tags: ['排名管理'],
    summary: '根据ID获取单个排名记录',
  },

  // 管理员路由
  {
    method: 'GET',
    path: '/api/v1/users',
    description: '获取用户列表（管理员）',
    auth: 'admin',
    tags: ['用户管理', '管理员'],
    summary: '管理员获取所有用户列表',
  },
  {
    method: 'GET',
    path: '/api/v1/users/stats',
    description: '获取用户统计信息（管理员）',
    auth: 'admin',
    tags: ['用户管理', '管理员', '统计'],
    summary: '管理员获取用户统计数据',
  },
  {
    method: 'POST',
    path: '/api/v1/rankings',
    description: '创建排名记录（版主）',
    auth: 'moderator',
    rateLimit: 'create',
    tags: ['排名管理', '版主'],
    summary: '版主创建新的排名记录',
  },
  {
    method: 'PUT',
    path: '/api/v1/rankings/:id',
    description: '更新排名记录（版主）',
    auth: 'moderator',
    rateLimit: 'general',
    tags: ['排名管理', '版主'],
    summary: '版主更新排名记录',
  },
  {
    method: 'DELETE',
    path: '/api/v1/rankings/:id',
    description: '删除排名记录（版主）',
    auth: 'moderator',
    rateLimit: 'strict',
    tags: ['排名管理', '版主'],
    summary: '版主删除排名记录',
  },
  {
    method: 'POST',
    path: '/api/v1/rankings/recalculate',
    description: '重新计算排名（管理员）',
    auth: 'admin',
    rateLimit: 'strict',
    tags: ['排名管理', '管理员'],
    summary: '管理员手动重新计算所有排名',
  },
];

/**
 * 根据路径和方法查找路由信息
 */
export const findRouteInfo = (method: string, path: string): RouteInfo | undefined => {
  return routeRegistry.find((route) => route.method === method.toUpperCase() && route.path === path);
};

/**
 * 根据标签获取路由列表
 */
export const getRoutesByTag = (tag: string): RouteInfo[] => {
  return routeRegistry.filter((route) => route.tags?.includes(tag));
};

/**
 * 获取所有公开路由
 */
export const getPublicRoutes = (): RouteInfo[] => {
  return routeRegistry.filter((route) => route.auth === 'public');
};

/**
 * 获取所有需要认证的路由
 */
export const getAuthenticatedRoutes = (): RouteInfo[] => {
  return routeRegistry.filter((route) => route.auth !== 'public');
};
