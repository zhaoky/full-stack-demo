import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { logger } from '@utils/logger';

export interface MigrationTemplate {
  name: string;
  content: string;
}

export class MigrationGenerator {
  private readonly migrationsPath: string;

  constructor(migrationsPath: string = path.join(process.cwd(), 'src/migrations/files')) {
    this.migrationsPath = migrationsPath;
  }

  /**
   * 生成时间戳
   */
  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  /**
   * 格式化迁移名称
   */
  private formatMigrationName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * 创建表迁移模板
   */
  createTableTemplate(tableName: string, columns?: Record<string, any>): string {
    const columnsCode = columns
      ? this.generateColumnsCode(columns)
      : `
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },`;

    return `import type { MigrationContext } from '../core/MigrationRunner';

export async function up({ queryInterface, Sequelize }: MigrationContext): Promise<void> {
  await queryInterface.createTable('${tableName}', {${columnsCode}
  });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('${tableName}');
}
`;
  }

  /**
   * 添加列迁移模板
   */
  addColumnTemplate(tableName: string, columnName: string, columnDefinition: any): string {
    const columnCode = this.generateColumnCode(columnDefinition);

    return `import type { MigrationContext } from '../core/MigrationRunner';

export async function up({ queryInterface, Sequelize }: MigrationContext): Promise<void> {
  await queryInterface.addColumn('${tableName}', '${columnName}', ${columnCode});
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.removeColumn('${tableName}', '${columnName}');
}
`;
  }

  /**
   * 删除列迁移模板
   */
  dropColumnTemplate(tableName: string, columnName: string, columnDefinition?: any): string {
    const columnCode = columnDefinition
      ? this.generateColumnCode(columnDefinition)
      : `{
      type: Sequelize.STRING,
      allowNull: true,
    }`;

    return `import type { MigrationContext } from '../core/MigrationRunner';

export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.removeColumn('${tableName}', '${columnName}');
}

export async function down({ queryInterface, Sequelize }: MigrationContext): Promise<void> {
  await queryInterface.addColumn('${tableName}', '${columnName}', ${columnCode});
}
`;
  }

  /**
   * 修改列迁移模板
   */
  changeColumnTemplate(tableName: string, columnName: string, newDefinition: any, oldDefinition?: any): string {
    const newColumnCode = this.generateColumnCode(newDefinition);
    const oldColumnCode = oldDefinition
      ? this.generateColumnCode(oldDefinition)
      : `{
      type: Sequelize.STRING,
      allowNull: true,
    }`;

    return `import type { MigrationContext } from '../core/MigrationRunner';

export async function up({ queryInterface, Sequelize }: MigrationContext): Promise<void> {
  await queryInterface.changeColumn('${tableName}', '${columnName}', ${newColumnCode});
}

export async function down({ queryInterface, Sequelize }: MigrationContext): Promise<void> {
  await queryInterface.changeColumn('${tableName}', '${columnName}', ${oldColumnCode});
}
`;
  }

  /**
   * 创建索引迁移模板
   */
  addIndexTemplate(tableName: string, columns: string[], indexName?: string, options?: any): string {
    const indexNameCode = indexName ? `'${indexName}'` : 'undefined';
    const optionsCode = options ? JSON.stringify(options, null, 2) : '{}';

    return `import type { MigrationContext } from '../core/MigrationRunner';

export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.addIndex('${tableName}', ${JSON.stringify(columns)}, {
    name: ${indexNameCode},
    ...${optionsCode}
  });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.removeIndex('${tableName}', ${indexNameCode || JSON.stringify(columns)});
}
`;
  }

  /**
   * 通用迁移模板
   */
  genericTemplate(): string {
    return `import type { MigrationContext } from '../core/MigrationRunner';

export async function up({ queryInterface, Sequelize }: MigrationContext): Promise<void> {
  // TODO: 实现迁移逻辑
}

export async function down({ queryInterface, Sequelize }: MigrationContext): Promise<void> {
  // TODO: 实现回滚逻辑
}
`;
  }

  /**
   * 生成列定义代码
   */
  private generateColumnCode(definition: any): string {
    const lines: string[] = [];
    lines.push('{');

    if (definition.type) {
      if (typeof definition.type === 'string') {
        lines.push(`    type: Sequelize.${definition.type.toUpperCase()},`);
      } else {
        lines.push(`    type: ${definition.type},`);
      }
    }

    if (definition.allowNull !== undefined) {
      lines.push(`    allowNull: ${definition.allowNull},`);
    }

    if (definition.defaultValue !== undefined) {
      if (typeof definition.defaultValue === 'string') {
        lines.push(`    defaultValue: '${definition.defaultValue}',`);
      } else {
        lines.push(`    defaultValue: ${definition.defaultValue},`);
      }
    }

    if (definition.primaryKey) {
      lines.push(`    primaryKey: true,`);
    }

    if (definition.autoIncrement) {
      lines.push(`    autoIncrement: true,`);
    }

    if (definition.unique) {
      lines.push(`    unique: true,`);
    }

    if (definition.validate) {
      lines.push(`    validate: ${JSON.stringify(definition.validate)},`);
    }

    if (definition.comment) {
      lines.push(`    comment: '${definition.comment}',`);
    }

    lines.push('  }');

    return lines.join('\n  ');
  }

  /**
   * 生成多列定义代码
   */
  private generateColumnsCode(columns: Record<string, any>): string {
    const lines: string[] = [];

    for (const [columnName, definition] of Object.entries(columns)) {
      lines.push(`    ${columnName}: ${this.generateColumnCode(definition)},`);
    }

    return '\n' + lines.join('\n') + '\n  ';
  }

  /**
   * 生成迁移文件
   */
  async generate(name: string, template: string): Promise<string> {
    try {
      // 确保迁移目录存在
      await mkdir(this.migrationsPath, { recursive: true });

      const timestamp = this.generateTimestamp();
      const formattedName = this.formatMigrationName(name);
      const filename = `${timestamp}_${formattedName}.ts`;
      const filepath = path.join(this.migrationsPath, filename);

      await writeFile(filepath, template, 'utf8');

      logger.info(`✅ 迁移文件已生成: ${filename}`);

      return filepath;
    } catch (error) {
      logger.error('❌ 生成迁移文件失败:', error);
      throw error;
    }
  }

  /**
   * 生成创建表迁移
   */
  async generateCreateTable(tableName: string, columns?: Record<string, any>): Promise<string> {
    const template = this.createTableTemplate(tableName, columns);
    return this.generate(`create_${tableName}_table`, template);
  }

  /**
   * 生成添加列迁移
   */
  async generateAddColumn(tableName: string, columnName: string, columnDefinition: any): Promise<string> {
    const template = this.addColumnTemplate(tableName, columnName, columnDefinition);
    return this.generate(`add_${columnName}_to_${tableName}`, template);
  }

  /**
   * 生成删除列迁移
   */
  async generateDropColumn(tableName: string, columnName: string, columnDefinition?: any): Promise<string> {
    const template = this.dropColumnTemplate(tableName, columnName, columnDefinition);
    return this.generate(`drop_${columnName}_from_${tableName}`, template);
  }

  /**
   * 生成修改列迁移
   */
  async generateChangeColumn(tableName: string, columnName: string, newDefinition: any, oldDefinition?: any): Promise<string> {
    const template = this.changeColumnTemplate(tableName, columnName, newDefinition, oldDefinition);
    return this.generate(`change_${columnName}_in_${tableName}`, template);
  }

  /**
   * 生成创建索引迁移
   */
  async generateAddIndex(tableName: string, columns: string[], indexName?: string, options?: any): Promise<string> {
    const template = this.addIndexTemplate(tableName, columns, indexName, options);
    const indexNamePart = indexName || columns.join('_');
    return this.generate(`add_index_${indexNamePart}_to_${tableName}`, template);
  }

  /**
   * 生成通用迁移
   */
  async generateGeneric(name: string): Promise<string> {
    const template = this.genericTemplate();
    return this.generate(name, template);
  }
}
