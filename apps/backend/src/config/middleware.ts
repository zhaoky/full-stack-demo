import type { Application } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimiters } from '@middleware/rateLimiter';
import { morganStream } from '@utils/logger';
import { appConfig } from './app';

/**
 * 配置所有中间件
 */
export const setupMiddleware = (app: Application): void => {
  // 信任代理
  app.set('trust proxy', appConfig.security.trustProxy ? 1 : 0);

  // 安全中间件
  app.use(helmet(appConfig.security.helmet));

  // CORS 配置
  app.use(cors(appConfig.cors));

  // 压缩响应
  app.use(compression());

  // 请求日志
  app.use(morgan(appConfig.environment === 'production' ? 'combined' : 'dev', { stream: morganStream }));

  // 解析请求体
  app.use(express.json(appConfig.bodyParser.json));
  app.use(express.urlencoded(appConfig.bodyParser.urlencoded));

  // 全局限流
  app.use(rateLimiters.general);
};
