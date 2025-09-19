/**
 * 应用配置
 */
export const appConfig = {
  // 应用基本信息
  name: 'Backend API',
  version: '1.0.0',
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',

  // API 配置
  api: {
    prefix: '/api',
    docsPath: '/api/docs',
  },

  // 安全配置
  security: {
    trustProxy: true,
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    },
  },

  // CORS 配置
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com'] // 生产环境域名
        : ['http://localhost:3000', 'http://localhost:5173'], // 开发环境
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] as string[],
    allowedHeaders: ['Content-Type', 'Authorization'] as string[],
  },

  // 请求体配置
  bodyParser: {
    json: { limit: '10mb' },
    urlencoded: { extended: true, limit: '10mb' },
  },

  // 优雅关闭配置
  gracefulShutdown: {
    timeout: 10000, // 10秒超时
  },
} as const;
