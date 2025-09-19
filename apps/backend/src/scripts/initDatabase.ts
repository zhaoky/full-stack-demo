import 'dotenv/config';
import { sequelize, connectDatabases } from '@config/database';
import { User } from '@models/User';
import { logger } from '@utils/logger';
import bcrypt from 'bcryptjs';

/**
 * 初始化数据库和创建默认管理员用户
 */
async function initDatabase(): Promise<void> {
  try {
    logger.info('🔄 Starting database initialization...');

    // 测试数据库连接
    await connectDatabases();

    // 同步数据库表结构
    await sequelize.sync({ force: false }); // 设置为 true 会删除现有表
    logger.info('✅ Database tables synchronized');

    // 检查是否已存在管理员用户
    const existingAdmin = await User.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!existingAdmin) {
      // 创建默认管理员用户
      const adminUser = await User.create({
        email: 'admin@example.com',
        username: 'admin',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
      });

      logger.info(`✅ Default admin user created: ${adminUser.email}`);
    } else {
      logger.info('ℹ️  Admin user already exists');
    }

    // 创建一些示例用户（可选）
    const testUsers = [
      {
        email: 'user1@example.com',
        username: 'user1',
        password: 'User123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as const,
      },
      {
        email: 'user2@example.com',
        username: 'user2',
        password: 'User123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'user' as const,
      },
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const user = await User.create(userData);
        logger.info(`✅ Test user created: ${user.email}`);
      }
    }

    logger.info('🎉 Database initialization completed successfully!');

    // 显示登录信息
    console.log('\n📋 默认登录凭据:');
    console.log('管理员用户:');
    console.log('  邮箱: admin@example.com');
    console.log('  密码: Admin123!');
    console.log('\n测试用户:');
    console.log('  邮箱: user1@example.com');
    console.log('  密码: User123!');
    console.log('  邮箱: user2@example.com');
    console.log('  密码: User123!');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase()
    .then(() => {
      logger.info('Database initialization script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database initialization script failed:', error);
      process.exit(1);
    });
}

export { initDatabase };
