#!/usr/bin/env tsx
import 'dotenv/config';
import { Command } from 'commander';
import { MigrationRunner } from '../core/MigrationRunner';
import { MigrationGenerator } from '../core/MigrationGenerator';
import { logger } from '@utils/logger';
import { testDatabaseConnections, closeDatabaseConnections } from '@config/database';
import path from 'path';

const program = new Command();

// 设置迁移路径
const migrationsPath = path.join(__dirname, '../files');
const runner = new MigrationRunner(migrationsPath);
const generator = new MigrationGenerator(migrationsPath);

program.name('migrate').description('数据库迁移工具').version('1.0.0');

// 运行迁移命令
program
  .command('up')
  .description('执行所有待执行的迁移')
  .action(async () => {
    try {
      logger.info('🚀 开始执行迁移...');
      await testDatabaseConnections();
      await runner.migrate();
    } catch (error) {
      logger.error('❌ 迁移执行失败:', error);
      process.exit(1);
    } finally {
      await closeDatabaseConnections();
    }
  });

// 回滚迁移命令
program
  .command('down')
  .description('回滚最后一个批次的迁移')
  .action(async () => {
    try {
      logger.info('🔄 开始回滚迁移...');
      await testDatabaseConnections();
      await runner.rollback();
    } catch (error) {
      logger.error('❌ 迁移回滚失败:', error);
      process.exit(1);
    } finally {
      await closeDatabaseConnections();
    }
  });

// 查看迁移状态命令
program
  .command('status')
  .description('查看迁移状态')
  .action(async () => {
    try {
      await testDatabaseConnections();
      const status = await runner.status();

      console.log('\n📊 迁移状态:');
      console.log(`已执行的迁移: ${status.executed.length}`);
      console.log(`待执行的迁移: ${status.pending.length}`);

      if (status.executed.length > 0) {
        console.log('\n✅ 已执行的迁移:');
        status.executed.forEach((migration) => {
          console.log(`  - ${migration.name} (批次: ${migration.batch})`);
        });
      }

      if (status.pending.length > 0) {
        console.log('\n⏳ 待执行的迁移:');
        status.pending.forEach((migration) => {
          console.log(`  - ${migration.name}`);
        });
      }

      if (status.executed.length === 0 && status.pending.length === 0) {
        console.log('\n✨ 没有迁移文件');
      }
    } catch (error) {
      logger.error('❌ 获取迁移状态失败:', error);
      process.exit(1);
    } finally {
      await closeDatabaseConnections();
    }
  });

// 生成迁移文件命令
const generateCommand = program.command('generate').alias('g').description('生成迁移文件');

// 生成创建表迁移
generateCommand
  .command('table <name>')
  .description('生成创建表的迁移')
  .option('--columns <columns>', '表列定义 (JSON格式)')
  .action(async (name: string, options: any) => {
    try {
      let columns;
      if (options.columns) {
        try {
          columns = JSON.parse(options.columns);
        } catch (error) {
          logger.error('❌ 列定义JSON格式错误:', error);
          process.exit(1);
        }
      }

      const filepath = await generator.generateCreateTable(name, columns);
      console.log(`✅ 创建表迁移已生成: ${path.basename(filepath)}`);
    } catch (error) {
      logger.error('❌ 生成迁移失败:', error);
      process.exit(1);
    }
  });

// 生成添加列迁移
generateCommand
  .command('add-column <table> <column>')
  .description('生成添加列的迁移')
  .requiredOption('--type <type>', '列类型')
  .option('--allow-null', '允许NULL值')
  .option('--default <value>', '默认值')
  .option('--unique', '唯一约束')
  .option('--comment <comment>', '列注释')
  .action(async (table: string, column: string, options: any) => {
    try {
      const columnDefinition: any = {
        type: options.type.toUpperCase(),
        allowNull: options.allowNull || false,
      };

      if (options.default !== undefined) {
        columnDefinition.defaultValue = options.default;
      }

      if (options.unique) {
        columnDefinition.unique = true;
      }

      if (options.comment) {
        columnDefinition.comment = options.comment;
      }

      const filepath = await generator.generateAddColumn(table, column, columnDefinition);
      console.log(`✅ 添加列迁移已生成: ${path.basename(filepath)}`);
    } catch (error) {
      logger.error('❌ 生成迁移失败:', error);
      process.exit(1);
    }
  });

// 生成删除列迁移
generateCommand
  .command('drop-column <table> <column>')
  .description('生成删除列的迁移')
  .option('--type <type>', '列类型 (用于回滚)')
  .option('--allow-null', '允许NULL值 (用于回滚)')
  .option('--default <value>', '默认值 (用于回滚)')
  .action(async (table: string, column: string, options: any) => {
    try {
      let columnDefinition;
      if (options.type) {
        columnDefinition = {
          type: options.type.toUpperCase(),
          allowNull: options.allowNull || false,
        };

        if (options.default !== undefined) {
          columnDefinition.defaultValue = options.default;
        }
      }

      const filepath = await generator.generateDropColumn(table, column, columnDefinition);
      console.log(`✅ 删除列迁移已生成: ${path.basename(filepath)}`);
    } catch (error) {
      logger.error('❌ 生成迁移失败:', error);
      process.exit(1);
    }
  });

// 生成创建索引迁移
generateCommand
  .command('add-index <table> <columns>')
  .description('生成创建索引的迁移')
  .option('--name <name>', '索引名称')
  .option('--unique', '唯一索引')
  .action(async (table: string, columns: string, options: any) => {
    try {
      const columnArray = columns.split(',').map((col) => col.trim());
      const indexOptions = options.unique ? { unique: true } : {};

      const filepath = await generator.generateAddIndex(table, columnArray, options.name, indexOptions);
      console.log(`✅ 创建索引迁移已生成: ${path.basename(filepath)}`);
    } catch (error) {
      logger.error('❌ 生成迁移失败:', error);
      process.exit(1);
    }
  });

// 生成通用迁移
generateCommand
  .command('migration <name>')
  .description('生成通用迁移文件')
  .action(async (name: string) => {
    try {
      const filepath = await generator.generateGeneric(name);
      console.log(`✅ 迁移文件已生成: ${path.basename(filepath)}`);
    } catch (error) {
      logger.error('❌ 生成迁移失败:', error);
      process.exit(1);
    }
  });

// 初始化迁移系统
program
  .command('init')
  .description('初始化迁移系统')
  .action(async () => {
    try {
      logger.info('🔧 初始化迁移系统...');
      await testDatabaseConnections();
      await runner.initialize();
      logger.info('✅ 迁移系统初始化完成');
    } catch (error) {
      logger.error('❌ 初始化失败:', error);
      process.exit(1);
    } finally {
      await closeDatabaseConnections();
    }
  });

// 重置迁移系统（危险操作）
program
  .command('reset')
  .description('重置迁移系统 (危险操作)')
  .option('--force', '强制执行')
  .action(async (options) => {
    if (!options.force) {
      console.log('⚠️  这是一个危险操作，将删除所有迁移记录。');
      console.log('如果确定要继续，请使用 --force 选项。');
      return;
    }

    try {
      logger.warn('🔄 重置迁移系统...');
      await testDatabaseConnections();

      const queryInterface = (await import('@config/database')).sequelize.getQueryInterface();
      await queryInterface.dropTable('schema_migrations');

      await runner.initialize();
      logger.info('✅ 迁移系统已重置');
    } catch (error) {
      logger.error('❌ 重置失败:', error);
      process.exit(1);
    } finally {
      await closeDatabaseConnections();
    }
  });

// 错误处理
program.on('command:*', () => {
  console.error('❌ 未知命令: %s', program.args.join(' '));
  console.log('使用 --help 查看可用命令');
  process.exit(1);
});

// 解析命令行参数
if (require.main === module) {
  program.parse();
}

export { program };
