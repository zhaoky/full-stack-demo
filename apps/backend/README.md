# Backend API

现代化的 TypeScript Node.js 后端 API，使用 Express、MySQL、MongoDB、Redis 构建。

## 🚀 技术栈

- **运行时**: Node.js 18+
- **语言**: TypeScript
- **框架**: Express.js
- **数据库**:
  - MySQL (使用 Sequelize ORM)
  - MongoDB (使用 Mongoose ODM)
  - Redis (缓存)
- **认证**: JWT
- **验证**: Joi
- **日志**: Winston
- **安全**: Helmet, CORS, Rate Limiting

## 📁 项目结构

```
src/
├── config/          # 数据库配置
├── controllers/     # 控制器层
├── middleware/      # 中间件
├── models/          # 数据模型
├── routes/          # 路由定义
├── services/        # 业务逻辑层
├── types/           # TypeScript 类型定义
├── utils/           # 工具函数
└── app.ts           # 应用入口文件
```

## 🛠️ 安装和运行

1. **安装依赖**

   ```bash
   npm install
   ```

2. **环境配置**

   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置数据库连接等信息
   ```

3. **开发模式运行**

   ```bash
   npm run dev
   ```

4. **构建生产版本**
   ```bash
   npm run build
   npm start
   ```

## 🔧 可用脚本

- `npm run dev` - 开发模式（使用 tsx watch）
- `npm run build` - 构建 TypeScript
- `npm start` - 运行生产版本
- `npm run lint` - ESLint 检查
- `npm run lint:fix` - 自动修复 ESLint 错误
- `npm run typecheck` - TypeScript 类型检查
- `npm test` - 运行测试

## 🌐 API 端点

### 认证相关

- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录

### 用户管理（需要认证）

- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新当前用户信息
- `POST /api/users/change-password` - 修改密码

### 管理员功能（需要管理员权限）

- `GET /api/users` - 获取用户列表（分页）
- `GET /api/users/:id` - 获取指定用户信息
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户
- `PATCH /api/users/:id/toggle-status` - 切换用户状态
- `GET /api/users/stats` - 获取用户统计信息

### 系统端点

- `GET /health` - 健康检查
- `GET /api` - API 信息

## 🔐 环境变量

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# MySQL 数据库
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=backend_db

# MongoDB
MONGODB_URI=mongodb://localhost:27017/backend_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 配置
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# 其他配置
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛡️ 安全特性

- **Helmet**: 设置各种 HTTP 头部以增强安全性
- **CORS**: 跨域资源共享配置
- **Rate Limiting**: API 限流保护
- **JWT Authentication**: 基于令牌的身份认证
- **Input Validation**: 使用 Joi 进行输入验证
- **Password Hashing**: 使用 bcrypt 加密密码
- **SQL Injection Protection**: Sequelize ORM 保护
- **NoSQL Injection Protection**: Mongoose ODM 保护

## 📊 日志系统

- **开发环境**: 彩色控制台输出
- **生产环境**: JSON 格式日志文件
- **HTTP 请求日志**: 使用 Morgan
- **错误日志**: 自动记录错误和堆栈信息

## 🗄️ 数据库

### MySQL (Sequelize)

- 用户主要数据存储
- 支持事务和复杂查询
- 自动迁移和种子数据

### MongoDB (Mongoose)

- 灵活的文档存储
- 支持复杂的嵌套数据结构
- 索引优化

### Redis

- 会话缓存
- 用户数据缓存
- 限流计数器

## 🚨 错误处理

- 全局错误处理中间件
- 自定义错误类
- 详细的错误日志
- 用户友好的错误响应

## 📝 API 响应格式

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2025-09-14T12:00:00.000Z"
}
```

## 📋 开发规范

- **TypeScript**: 严格模式，完整类型注解
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Git Hooks**: 提交前检查
- **分层架构**: 控制器 → 服务 → 数据访问

## 🧪 测试

```bash
npm test           # 运行所有测试
npm run test:watch # 监视模式运行测试
```

## 📦 部署

1. 设置生产环境变量
2. 构建应用: `npm run build`
3. 启动: `npm start`
4. 使用 PM2 或 Docker 进行进程管理

## 🤝 贡献

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License
