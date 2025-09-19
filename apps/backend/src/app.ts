import 'dotenv/config';
import express, { type Application } from 'express';
import { setupMiddleware } from '@config/middleware';
import { setupRoutes } from '@config/routes';
import { ServerManager } from '@config/server';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';

/**
 * 创建应用实例
 */
const createApp = (): Application => {
  const app: Application = express();

  // 配置中间件
  setupMiddleware(app);

  // 配置路由
  setupRoutes(app);

  // 404 处理
  app.use(notFoundHandler);

  // 全局错误处理
  app.use(errorHandler);

  return app;
};

// 创建应用
const app = createApp();

/**
 * 启动服务器
 */
const startServer = async (): Promise<void> => {
  const serverManager = new ServerManager();
  await serverManager.start(app);
};

// 启动应用
if (require.main === module) {
  startServer();
}

export default app;
