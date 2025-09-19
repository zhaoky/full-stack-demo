import 'dotenv/config';
import { User } from '@models/User';
import { logger } from '@utils/logger';
import { connectDatabases } from '@config/database';

/**
 * 数据库种子数据脚本
 */
async function seedDatabase(): Promise<void> {
  try {
    logger.info('🌱 Starting database seeding...');

    await connectDatabases();

    // 清空现有数据（谨慎使用！）
    const clearData = process.argv.includes('--clear');
    if (clearData) {
      logger.warn('⚠️  Clearing existing data...');
      await User.destroy({ where: {}, force: true });
      logger.info('🗑️  Existing data cleared');
    }

    // 种子用户数据
    const seedUsers = [
      {
        email: 'admin@company.com',
        username: 'admin',
        password: 'SecurePassword123!',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin' as const,
        isActive: true,
      },
      {
        email: 'moderator@company.com',
        username: 'moderator',
        password: 'ModeratorPass123!',
        firstName: 'Content',
        lastName: 'Moderator',
        role: 'moderator' as const,
        isActive: true,
      },
      {
        email: 'alice.johnson@email.com',
        username: 'alicejohnson',
        password: 'AlicePass123!',
        firstName: 'Alice',
        lastName: 'Johnson',
        role: 'user' as const,
        isActive: true,
      },
      {
        email: 'bob.smith@email.com',
        username: 'bobsmith',
        password: 'BobSecure123!',
        firstName: 'Bob',
        lastName: 'Smith',
        role: 'user' as const,
        isActive: true,
      },
      {
        email: 'carol.white@email.com',
        username: 'carolwhite',
        password: 'CarolPass123!',
        firstName: 'Carol',
        lastName: 'White',
        role: 'user' as const,
        isActive: false, // 非活跃用户示例
      },
    ];

    // 批量创建用户
    for (const userData of seedUsers) {
      try {
        const existingUser = await User.findOne({
          where: { email: userData.email },
        });

        if (!existingUser) {
          const user = await User.create(userData);
          logger.info(`✅ User created: ${user.email} (${user.role})`);
        } else {
          logger.info(`⏭️  User already exists: ${userData.email}`);
        }
      } catch (error) {
        logger.error(`❌ Failed to create user ${userData.email}:`, error);
      }
    }

    logger.info('🎉 Database seeding completed!');

    // 显示统计信息
    const stats = {
      totalUsers: await User.count(),
      activeUsers: await User.count({ where: { isActive: true } }),
      adminUsers: await User.count({ where: { role: 'admin' } }),
      moderatorUsers: await User.count({ where: { role: 'moderator' } }),
      regularUsers: await User.count({ where: { role: 'user' } }),
    };

    console.log('\n📊 数据库统计信息:');
    console.log(`总用户数: ${stats.totalUsers}`);
    console.log(`活跃用户数: ${stats.activeUsers}`);
    console.log(`管理员用户数: ${stats.adminUsers}`);
    console.log(`版主用户数: ${stats.moderatorUsers}`);
    console.log(`普通用户数: ${stats.regularUsers}`);
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Database seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database seeding script failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
