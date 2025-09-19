# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy packages first for better caching
COPY packages/ ./packages/

# Copy backend app
COPY apps/backend/ ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages
RUN pnpm --filter "@shared/*" build

# Development stage
FROM base AS development
ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "--filter", "backend", "dev"]

# Build stage for production
FROM base AS build
ENV NODE_ENV=production

# Build the backend
RUN pnpm --filter backend build

# Production stage
FROM node:18-alpine AS production
ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/
COPY apps/backend/package.json ./apps/backend/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built shared packages
COPY --from=build /app/packages/*/dist ./packages/*/dist

# Copy built backend
COPY --from=build /app/apps/backend/dist ./apps/backend/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Change ownership to non-root user
RUN chown -R backend:nodejs /app
USER backend

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --version || exit 1

CMD ["pnpm", "--filter", "backend", "start"]
