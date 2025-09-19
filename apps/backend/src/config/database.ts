import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

// MySQL 配置 (使用 Sequelize ORM)
export const sequelize = new Sequelize({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USERNAME || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'mysql_demo',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
});

// Redis 配置
export const redisClient: RedisClientType = createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
});

// 数据库连接器类型
interface DatabaseConnector {
  name: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: () => boolean;
}

// 数据库连接器定义
const databases: DatabaseConnector[] = [
  {
    name: 'MySQL',
    connect: async () => {
      await sequelize.authenticate();
    },
    disconnect: async () => {
      await sequelize.close();
    },
    isConnected: () => {
      try {
        return sequelize.connectionManager && (sequelize.connectionManager as any).pool !== null;
      } catch {
        return false;
      }
    },
  },
  {
    name: 'MongoDB',
    connect: async () => {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mongodb_demo';
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
    },
    disconnect: async () => {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    },
    isConnected: () => mongoose.connection.readyState === 1,
  },
  {
    name: 'Redis',
    connect: async () => {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
    },
    disconnect: async () => {
      if (redisClient.isOpen) {
        await redisClient.quit();
      }
    },
    isConnected: () => redisClient.isOpen,
  },
];

// 连接所有数据库
export const connectDatabases = async (): Promise<void> => {
  const results = await Promise.allSettled(
    databases.map(async (db) => {
      if (!db.isConnected()) {
        await db.connect();
      }
      console.log(`✅ ${db.name} 连接成功`);
      return db.name;
    })
  );

  const failed = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result, index) => {
      const dbName = databases[index]?.name || 'Unknown';
      console.error(`❌ ${dbName} 连接失败:`, result.reason);
      return dbName;
    });

  if (failed.length > 0) {
    throw new Error(`数据库连接失败: ${failed.join(', ')}`);
  }

  console.log('✅ 所有数据库连接已建立');
};

// 断开所有数据库连接
export const disconnectDatabases = async (): Promise<void> => {
  const results = await Promise.allSettled(
    databases.map(async (db) => {
      await db.disconnect();
      console.log(`✅ ${db.name} 连接已关闭`);
      return db.name;
    })
  );

  const failed = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result, index) => {
      const dbName = databases[index]?.name || 'Unknown';
      console.error(`❌ ${dbName} 关闭失败:`, result.reason);
      return dbName;
    });

  if (failed.length === 0) {
    console.log('✅ 所有数据库连接已成功关闭');
  } else {
    console.warn(`⚠️ 部分数据库连接关闭时出现问题: ${failed.join(', ')}`);
  }
};
