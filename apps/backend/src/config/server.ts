import type { Application } from 'express';
import type { Server } from 'http';
import { connectDatabases, disconnectDatabases } from './database';
import { logger } from '@utils/logger';
import { appConfig } from './app';

/**
 * 服务器管理类
 */
export class ServerManager {
  private server?: Server;

  /**
   * 启动服务器
   */
  async start(app: Application): Promise<void> {
    try {
      // 测试数据库连接
      await connectDatabases();

      // 启动服务器
      this.server = app.listen(appConfig.port, () => {
        logger.info(`🚀 Server is running on port ${appConfig.port}`);
        logger.info(`📝 Environment: ${appConfig.environment}`);
        logger.info(`🔗 Health check: http://localhost:${appConfig.port}/health`);
        logger.info(`📋 API root: http://localhost:${appConfig.port}${appConfig.api.prefix}`);
      });

      // 设置优雅关闭
      this.setupGracefulShutdown();

      // 设置未捕获异常处理
      this.setupErrorHandlers();
    } catch (error) {
      logger.error('启动服务器失败:', error);
      process.exit(1);
    }
  }

  /**
   * 设置优雅关闭
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      if (!this.server) {
        process.exit(0);
      }

      this.server.close(async () => {
        logger.info('HTTP 服务器已关闭');

        try {
          await disconnectDatabases();
          logger.info('数据库连接已关闭');
          process.exit(0);
        } catch (error) {
          logger.error('关闭过程中出错:', error);
          process.exit(1);
        }
      });

      // 强制关闭超时
      setTimeout(() => {
        logger.error('无法及时关闭连接，强制关闭');
        process.exit(1);
      }, appConfig.gracefulShutdown.timeout);
    };

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandlers(): void {
    // 未捕获的异常处理
    process.on('uncaughtException', (error) => {
      logger.error('未捕获异常:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的拒绝:', promise, '原因:', reason);
      process.exit(1);
    });
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
    await disconnectDatabases();
  }
}
