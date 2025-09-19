import type { Application } from 'express';
import userRoutes from '@routes/userRoutes';
import rankingRoutes from '@routes/rankingRoutes';
import v1Router from '@routes/versions/v1';
import { appConfig } from './app';

/**
 * 健康检查路由
 */
const setupHealthRoutes = (app: Application): void => {
  // 健康检查
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: '服务器运行正常',
      timestamp: new Date().toISOString(),
      environment: appConfig.environment,
      version: appConfig.version,
    });
  });

  // 处理 favicon.ico 请求
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });

  // API 根路径
  app.get(appConfig.api.prefix, (req, res) => {
    res.status(200).json({
      success: true,
      message: '欢迎使用后端 API',
      version: appConfig.version,
      documentation: appConfig.api.docsPath,
      timestamp: new Date().toISOString(),
    });
  });
};

/**
 * 配置所有路由
 */
export const setupRoutes = (app: Application): void => {
  // 健康检查和基础路由
  setupHealthRoutes(app);

  // API v1 路由（推荐使用版本化路由）
  app.use(`${appConfig.api.prefix}/v1`, v1Router);

  // 向后兼容的路由（保持原有路由可访问）
  app.use(`${appConfig.api.prefix}/users`, userRoutes);
  app.use(`${appConfig.api.prefix}/rankings`, rankingRoutes);
};
