import { Router } from 'express';
import userRoutes from '../../userRoutes';
import rankingRoutes from '../../rankingRoutes';

/**
 * API v1 路由版本
 * 组织和管理所有v1版本的API路由
 */
const v1Router = Router();

// 挂载各模块路由
v1Router.use('/users', userRoutes);
v1Router.use('/rankings', rankingRoutes);

// API版本信息
v1Router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '欢迎使用后端 API v1',
    version: '1.0.0',
    endpoints: {
      users: '/api/v1/users',
      rankings: '/api/v1/rankings',
    },
    documentation: '/api/v1/docs',
    timestamp: new Date().toISOString(),
  });
});

export default v1Router;
