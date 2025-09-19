# 🚀 快速开始指南

这个指南将帮助您快速启动和运行后端 API。

## 📋 前置要求

确保您的系统已安装以下软件：

- **Node.js** (v18.0.0 或更高版本)
- **npm** 或 **yarn**
- **MySQL** (v8.0 或更高版本)
- **MongoDB** (v5.0 或更高版本)
- **Redis** (v6.0 或更高版本)

## 🔧 安装步骤

### 1. 克隆项目并安装依赖

```bash
cd backend
npm install
```

### 2. 环境配置

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置您的数据库连接信息：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# MySQL 数据库
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=backend_db

# MongoDB
MONGODB_URI=mongodb://localhost:27017/backend_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 配置
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# 其他配置
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. 数据库准备

#### MySQL

确保 MySQL 服务正在运行，并创建数据库：

```sql
CREATE DATABASE backend_db;
```

#### MongoDB

确保 MongoDB 服务正在运行。数据库会自动创建。

#### Redis

确保 Redis 服务正在运行。

### 4. 初始化数据库

运行数据库初始化脚本：

```bash
npm run db:init
```

这将：

- 同步数据库表结构
- 创建默认管理员用户
- 创建一些测试用户

### 5. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

## 🧪 验证安装

### 1. 健康检查

访问：`http://localhost:3000/health`

应该返回：

```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-09-14T12:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### 2. API 根端点

访问：`http://localhost:3000/api`

应该返回 API 欢迎信息。

### 3. 用户登录测试

使用 Postman 或 curl 测试登录：

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

成功响应应该包含 JWT token。

## 🔑 默认账户

初始化后，系统会创建以下默认账户：

### 管理员账户

- **邮箱**: admin@example.com
- **密码**: Admin123!
- **角色**: admin

### 测试用户账户

- **邮箱**: user1@example.com
- **密码**: User123!
- **角色**: user

- **邮箱**: user2@example.com
- **密码**: User123!
- **角色**: user

## 📖 API 使用示例

### 1. 用户注册

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "Password123!",
    "firstName": "New",
    "lastName": "User"
  }'
```

### 2. 用户登录

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Password123!"
  }'
```

### 3. 获取当前用户信息

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. 获取用户列表（管理员）

```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## 🛠️ 开发工具

### TypeScript 类型检查

```bash
npm run typecheck
```

### 代码检查和修复

```bash
npm run lint
npm run lint:fix
```

### 运行测试

```bash
npm test
npm run test:watch
```

### 数据库操作

```bash
# 初始化数据库
npm run db:init

# 填充种子数据
npm run db:seed

# 清空并重新填充数据
npm run db:seed:clear
```

## 🔧 生产环境部署

### 1. 构建应用

```bash
npm run build
```

### 2. 设置生产环境变量

```env
NODE_ENV=production
JWT_SECRET=your_production_jwt_secret
# 配置生产数据库连接
```

### 3. 启动生产服务器

```bash
npm start
```

## 🐛 常见问题

### 数据库连接失败

1. 检查数据库服务是否运行
2. 验证 `.env` 文件中的连接配置
3. 确保数据库用户有适当的权限

### JWT Token 错误

1. 确保 `JWT_SECRET` 已设置
2. 检查 token 是否在请求头中正确传递
3. 验证 token 是否未过期

### 端口冲突

如果端口 3000 被占用，修改 `.env` 文件中的 `PORT` 变量。

### Redis 连接问题

如果 Redis 服务未启动，应用仍可运行，但会失去缓存功能。

## 📞 获得帮助

如果遇到问题：

1. 检查服务器日志输出
2. 查看 `logs/` 目录中的日志文件
3. 确保所有服务（MySQL、MongoDB、Redis）正在运行
4. 验证环境变量配置

## 🎉 下一步

现在您的后端 API 已经运行起来了！您可以：

1. 探索 API 端点
2. 集成前端应用
3. 添加自定义业务逻辑
4. 扩展数据模型
5. 添加更多中间件

祝您开发愉快！ 🚀
