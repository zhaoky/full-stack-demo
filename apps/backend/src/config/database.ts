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
    paranoid: true, // 软删除
  },
});

// MongoDB 配置 (使用 Mongoose ODM)
export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mongodb_demo';
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接错误:', error);
    process.exit(1);
  }
};

// Redis 配置
export const redisClient: RedisClientType = createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('✅ Redis 连接成功');
  } catch (error) {
    console.error('❌ Redis 连接错误:', error);
    process.exit(1);
  }
};

// 测试所有数据库连接
export const testDatabaseConnections = async (): Promise<void> => {
  try {
    // 测试 MySQL 连接
    await sequelize.authenticate();
    console.log('✅ MySQL 连接已成功建立');

    // 测试 MongoDB 连接
    if (mongoose.connection.readyState !== 1) {
      await connectMongoDB();
    }

    // 测试 Redis 连接
    if (!redisClient.isOpen) {
      await connectRedis();
    }

    console.log('✅ 所有数据库连接已建立');
  } catch (error) {
    console.error('❌ 无法连接到数据库:', error);
    throw error;
  }
};

// 优雅关闭数据库连接
export const closeDatabaseConnections = async (): Promise<void> => {
  try {
    await sequelize.close();
    await mongoose.connection.close();
    await redisClient.quit();
    console.log('✅ 所有数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接时出错:', error);
  }
};
