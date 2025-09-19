# 数据库迁移系统

这是一个现代化的数据库迁移工具，基于 2025 年业界最佳实践设计，支持 MySQL 数据库的迁移管理。

## 📁 目录结构

```
src/migrations/
├── core/
│   ├── MigrationRunner.ts     # 迁移执行器核心
│   └── MigrationGenerator.ts  # 迁移文件生成器
├── cli/
│   └── migrate.ts             # CLI 命令工具
├── files/                     # 迁移文件存放目录
│   └── .gitkeep
└── README.md                  # 文档
```

## 🚀 快速开始

### 1. 初始化迁移系统

```bash
npm run migrate:init
```

### 2. 查看迁移状态

```bash
npm run migrate:status
```

### 3. 执行迁移

```bash
npm run migrate:up
```

### 4. 回滚迁移

```bash
npm run migrate:down
```

## 📝 命令列表

### 迁移执行命令

- `npm run migrate:up` - 执行所有待执行的迁移
- `npm run migrate:down` - 回滚最后一个批次的迁移
- `npm run migrate:status` - 查看迁移状态
- `npm run migrate:init` - 初始化迁移系统
- `npm run migrate:reset --force` - 重置迁移系统（危险操作）

### 迁移文件生成命令

#### 创建表

```bash
npm run migrate:generate table users
npm run migrate:generate table users -- --columns '{"name":{"type":"STRING","allowNull":false},"email":{"type":"STRING","unique":true}}'
```

#### 添加列

```bash
npm run migrate:generate add-column users phone --type STRING --allow-null --comment "用户手机号"
```

#### 删除列

```bash
npm run migrate:generate drop-column users phone --type STRING --allow-null
```

#### 创建索引

```bash
npm run migrate:generate add-index users email --name idx_users_email --unique
npm run migrate:generate add-index users "name,email" --name idx_users_name_email
```

#### 通用迁移

```bash
npm run migrate:generate migration add_foreign_key_to_posts
```

## 🛠️ 迁移文件结构

迁移文件遵循以下命名规范：

```
YYYYMMDDHHMMSS_migration_name.ts
```

例如：

```
20250914133700_create_users_table.ts
```

### 迁移文件示例

```typescript
import type { MigrationContext } from '../core/MigrationRunner';

export async function up({ queryInterface, Sequelize }: MigrationContext): Promise<void> {
  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
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
  });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('users');
}
```

## 🔧 高级特性

### 1. 批次管理

- 迁移按批次执行，每次运行 `migrate:up` 创建一个新批次
- 回滚时只回滚最后一个批次的迁移
- 支持查看每个迁移属于哪个批次

### 2. 事务支持

- 每个迁移在独立的事务中执行
- 失败时自动回滚，保证数据一致性

### 3. 缓存清理

- 自动清理模块缓存，支持热重载

### 4. 详细日志

- 完整的执行日志记录
- 支持调试模式

### 5. 类型安全

- 完整的 TypeScript 类型支持
- 强类型的迁移上下文

## 📊 迁移状态表

系统自动创建 `schema_migrations` 表来跟踪迁移状态：

| 字段        | 类型     | 说明              |
| ----------- | -------- | ----------------- |
| id          | VARCHAR  | 迁移 ID（时间戳） |
| name        | VARCHAR  | 迁移名称          |
| batch       | INTEGER  | 批次号            |
| executed_at | DATETIME | 执行时间          |

## 🔍 最佳实践

### 1. 迁移文件命名

- 使用描述性的名称
- 遵循统一的命名规范
- 避免使用特殊字符

### 2. 迁移内容

- 每个迁移只做一件事
- 确保可以正确回滚
- 添加适当的注释

### 3. 数据迁移

- 大量数据迁移应分批执行
- 考虑性能影响
- 做好备份

### 4. 团队协作

- 合并代码前检查迁移冲突
- 不要修改已经执行的迁移
- 保持迁移文件的向前兼容性

## ⚠️ 注意事项

1. **不要修改已执行的迁移文件** - 创建新的迁移来修正问题
2. **生产环境谨慎操作** - 先在测试环境验证
3. **备份数据** - 重要操作前备份数据库
4. **检查依赖** - 确保 MySQL 服务正常运行

## 🐛 故障排除

### 常见问题

1. **迁移表不存在**

   ```bash
   npm run migrate:init
   ```

2. **迁移文件加载失败**

   - 检查文件语法
   - 确保导出 up 和 down 函数

3. **数据库连接失败**

   - 检查环境变量配置
   - 确保数据库服务运行

4. **权限不足**
   - 确保数据库用户有相应权限

### 日志查看

迁移过程中的详细日志会显示在控制台，包括：

- 执行步骤
- 成功/失败状态
- 错误详情
- 执行时间

## 🔄 集成现有项目

如果需要将现有的 Sequelize 模型迁移到这个系统：

1. 为现有表创建迁移文件
2. 运行 `migrate:init` 初始化系统
3. 手动将现有迁移记录插入到 `schema_migrations` 表
4. 后续使用新的迁移系统

## 📚 扩展阅读

- [Sequelize Migrations](https://sequelize.org/docs/v6/other-topics/migrations/)
- [Database Migration Best Practices](https://flywaydb.org/documentation/concepts/migrations)
- [TypeScript Migration Patterns](https://www.typescriptlang.org/docs/)
