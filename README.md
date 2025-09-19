# Full-Stack Demo - Monorepo

A modern full-stack TypeScript application built with Vue 3, Node.js, and pnpm workspace.

## 🚀 Tech Stack

### Frontend

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Element Plus** - Vue 3 UI library
- **Pinia** - State management
- **Vue Router** - Routing
- **Vite** - Fast build tool

### Backend

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MySQL** - Relational database
- **MongoDB** - Document database
- **Redis** - In-memory database
- **JWT** - Authentication

### DevOps

- **pnpm** - Fast package manager
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📁 Project Structure

```
full-stack-demo/
├── apps/                    # Applications
│   ├── backend/            # Node.js API server
│   └── frontend/           # Vue 3 web app
├── packages/               # Shared packages
│   ├── shared-types/       # TypeScript type definitions
│   ├── shared-utils/       # Utility functions
│   └── shared-config/      # Configuration constants
├── docker/                 # Docker configuration files
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
└── package.json           # Root package configuration
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (optional)

### Quick Start

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start development servers**

   ```bash
   pnpm dev
   ```

   This will start both frontend (http://localhost:5173) and backend (http://localhost:3000)

3. **Build for production**
   ```bash
   pnpm build
   ```

### Available Scripts

- `pnpm dev` - Start development servers for both apps
- `pnpm build` - Build all apps and packages
- `pnpm test` - Run tests for all packages
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm clean` - Clean all build outputs and node_modules
- `pnpm fresh` - Clean and reinstall dependencies

### Database Scripts

- `pnpm db:init` - Initialize database schema
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:seed:clear` - Clear seeded data

## 🐳 Docker

### Development with Docker

```bash
# Start development environment
pnpm docker:dev
```

### Production with Docker

```bash
# Build and start production environment
pnpm docker:build
pnpm docker:up

# Stop services
pnpm docker:down
```

## 🏗️ Architecture

### Monorepo Structure

- Uses pnpm workspaces for efficient dependency management
- Shared packages for types, utilities, and configuration
- Independent apps that can be deployed separately

### Shared Packages

- `@shared/types` - Common TypeScript interfaces and types
- `@shared/utils` - Utility functions (validation, formatting, etc.)
- `@shared/config` - Configuration constants and API settings

### Development Workflow

- Hot reload for both frontend and backend
- Shared types ensure type safety across the stack
- Linting and type checking across all packages

## 🔧 Configuration

### Environment Variables

Create `.env` files in the respective app directories:

**Backend (.env)**

```env
NODE_ENV=development
PORT=3000
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=fullstack_db
MONGODB_URI=mongodb://localhost:27017/fullstack_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
```

**Frontend (.env)**

```env
VITE_API_BASE_URL=http://localhost:3000
```

## 📝 API Documentation

The backend provides a RESTful API with the following endpoints:

- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users` - Get users (paginated)
- `GET /api/rankings` - Get rankings (paginated)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter backend test
pnpm --filter frontend test
```

## 🚀 Deployment

### Docker Deployment

1. Build images:

   ```bash
   docker-compose build
   ```

2. Start services:
   ```bash
   docker-compose up -d
   ```

### Manual Deployment

1. Build all packages:

   ```bash
   pnpm build
   ```

2. Deploy backend:

   ```bash
   cd apps/backend
   pnpm start
   ```

3. Serve frontend:
   ```bash
   cd apps/frontend
   pnpm preview
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and type checking
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
