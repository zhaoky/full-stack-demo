import { Sequelize, QueryInterface } from 'sequelize';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { logger } from '@utils/logger';
import { sequelize } from '@config/database';

export interface MigrationFile {
  id: string;
  name: string;
  timestamp: number;
  filename: string;
  filepath: string;
}

export interface MigrationRecord {
  id: string;
  name: string;
  batch: number;
  executed_at: Date;
}

export interface MigrationContext {
  queryInterface: QueryInterface;
  Sequelize: typeof Sequelize;
  sequelize: Sequelize;
}

export interface Migration {
  up: (context: MigrationContext) => Promise<void>;
  down: (context: MigrationContext) => Promise<void>;
}

export class MigrationRunner {
  private readonly migrationsPath: string;
  private readonly tableName = 'schema_migrations';

  constructor(migrationsPath: string = path.join(__dirname, '../files')) {
    this.migrationsPath = migrationsPath;
  }

  /**
   * 初始化迁移表
   */
  async initialize(): Promise<void> {
    try {
      const queryInterface = sequelize.getQueryInterface();

      // 检查迁移表是否存在
      const tables = await queryInterface.showAllTables();
      const migrationTableExists = tables.includes(this.tableName);

      if (!migrationTableExists) {
        await queryInterface.createTable(this.tableName, {
          id: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          batch: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
          },
          executed_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
        });

        logger.info('✅ 迁移表已创建');
      }
    } catch (error) {
      logger.error('❌ 初始化迁移表失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有迁移文件
   */
  async getMigrationFiles(): Promise<MigrationFile[]> {
    try {
      const files = await readdir(this.migrationsPath);
      const migrationFiles: MigrationFile[] = [];

      for (const filename of files) {
        if (!filename.endsWith('.ts') && !filename.endsWith('.js')) {
          continue;
        }

        // 解析文件名格式: YYYYMMDDHHMMSS_migration_name.ts
        const match = filename.match(/^(\d{14})_(.+)\.(ts|js)$/);
        if (!match) {
          logger.warn(`⚠️ 跳过无效的迁移文件名: ${filename}`);
          continue;
        }

        const [, timestampStr, name] = match;
        const timestamp = parseInt(timestampStr);
        const id = timestampStr;

        migrationFiles.push({
          id,
          name,
          timestamp,
          filename,
          filepath: path.join(this.migrationsPath, filename),
        });
      }

      // 按时间戳排序
      return migrationFiles.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      logger.error('❌ 读取迁移文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取已执行的迁移记录
   */
  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    try {
      const queryInterface = sequelize.getQueryInterface();
      const records = await queryInterface.select(null, this.tableName, {
        order: [
          ['batch', 'ASC'],
          ['executed_at', 'ASC'],
        ],
      });

      return records as MigrationRecord[];
    } catch (error) {
      logger.error('❌ 获取迁移记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取下一个批次号
   */
  async getNextBatch(): Promise<number> {
    try {
      const queryInterface = sequelize.getQueryInterface();
      const result = await queryInterface.select(null, this.tableName, {
        attributes: [[Sequelize.fn('MAX', Sequelize.col('batch')), 'maxBatch']],
      });

      const maxBatch = result[0]?.maxBatch || 0;
      return maxBatch + 1;
    } catch (error) {
      logger.error('❌ 获取批次号失败:', error);
      throw error;
    }
  }

  /**
   * 获取待执行的迁移
   */
  async getPendingMigrations(): Promise<MigrationFile[]> {
    const allMigrations = await this.getMigrationFiles();
    const executedMigrations = await this.getExecutedMigrations();
    const executedIds = new Set(executedMigrations.map((m) => m.id));

    return allMigrations.filter((migration) => !executedIds.has(migration.id));
  }

  /**
   * 加载迁移文件
   */
  async loadMigration(filepath: string): Promise<Migration> {
    try {
      // 清除模块缓存以支持热重载
      delete require.cache[require.resolve(filepath)];

      const migrationModule = await import(filepath);

      if (!migrationModule.up || !migrationModule.down) {
        throw new Error('迁移文件必须导出 up 和 down 函数');
      }

      return {
        up: migrationModule.up,
        down: migrationModule.down,
      };
    } catch (error) {
      logger.error(`❌ 加载迁移文件失败: ${filepath}`, error);
      throw error;
    }
  }

  /**
   * 执行单个迁移
   */
  async runMigration(migrationFile: MigrationFile, direction: 'up' | 'down', batch?: number): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      logger.info(`🔄 ${direction === 'up' ? '执行' : '回滚'}迁移: ${migrationFile.name}`);

      const migration = await this.loadMigration(migrationFile.filepath);
      const context: MigrationContext = {
        queryInterface: sequelize.getQueryInterface(),
        Sequelize,
        sequelize,
      };

      // 执行迁移
      if (direction === 'up') {
        await migration.up(context);

        // 记录到迁移表
        await sequelize.getQueryInterface().insert(
          null,
          this.tableName,
          {
            id: migrationFile.id,
            name: migrationFile.name,
            batch: batch || (await this.getNextBatch()),
            executed_at: new Date(),
          },
          { transaction }
        );
      } else {
        await migration.down(context);

        // 从迁移表删除记录
        await sequelize.getQueryInterface().delete(
          null,
          this.tableName,
          {
            id: migrationFile.id,
          },
          { transaction }
        );
      }

      await transaction.commit();

      logger.info(`✅ ${direction === 'up' ? '执行' : '回滚'}完成: ${migrationFile.name}`);
    } catch (error) {
      await transaction.rollback();
      logger.error(`❌ ${direction === 'up' ? '执行' : '回滚'}失败: ${migrationFile.name}`, error);
      throw error;
    }
  }

  /**
   * 运行所有待执行的迁移
   */
  async migrate(): Promise<void> {
    await this.initialize();

    const pendingMigrations = await this.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      logger.info('✅ 没有待执行的迁移');
      return;
    }

    const batch = await this.getNextBatch();

    logger.info(`📋 发现 ${pendingMigrations.length} 个待执行的迁移`);

    for (const migration of pendingMigrations) {
      await this.runMigration(migration, 'up', batch);
    }

    logger.info('🎉 所有迁移执行完成!');
  }

  /**
   * 回滚最后一个批次的迁移
   */
  async rollback(): Promise<void> {
    await this.initialize();

    const executedMigrations = await this.getExecutedMigrations();

    if (executedMigrations.length === 0) {
      logger.info('✅ 没有可回滚的迁移');
      return;
    }

    // 获取最新批次
    const lastBatch = Math.max(...executedMigrations.map((m) => m.batch));
    const migrationsToRollback = executedMigrations.filter((m) => m.batch === lastBatch).reverse(); // 逆序回滚

    logger.info(`📋 回滚批次 ${lastBatch} 的 ${migrationsToRollback.length} 个迁移`);

    const allMigrationFiles = await this.getMigrationFiles();

    for (const migrationRecord of migrationsToRollback) {
      const migrationFile = allMigrationFiles.find((f) => f.id === migrationRecord.id);
      if (migrationFile) {
        await this.runMigration(migrationFile, 'down');
      } else {
        logger.warn(`⚠️ 未找到迁移文件: ${migrationRecord.name}`);
      }
    }

    logger.info('🎉 回滚完成!');
  }

  /**
   * 获取迁移状态
   */
  async status(): Promise<{
    executed: MigrationRecord[];
    pending: MigrationFile[];
  }> {
    await this.initialize();

    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();

    return { executed, pending };
  }
}
