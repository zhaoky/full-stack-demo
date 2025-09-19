/**
 * 基础实体接口
 */
export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

/**
 * 基础数值实体接口（用于排行榜等）
 */
export interface BaseNumericEntity {
  id: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

/**
 * 环境变量类型
 */
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
