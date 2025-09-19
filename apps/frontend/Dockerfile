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

# Copy frontend app
COPY apps/frontend/ ./apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages
RUN pnpm --filter "@shared/*" build

# Development stage
FROM base AS development
ENV NODE_ENV=development
EXPOSE 5173
CMD ["pnpm", "--filter", "frontend", "dev", "--host", "0.0.0.0"]

# Build stage for production
FROM base AS build
ENV NODE_ENV=production

# Build the frontend
RUN pnpm --filter frontend build

# Production stage (using nginx)
FROM nginx:alpine AS production

# Copy custom nginx config
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built frontend
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-group
RUN adduser -S frontend -u 1001 -G nginx-group

# Change ownership
RUN chown -R frontend:nginx-group /usr/share/nginx/html
RUN chown -R frontend:nginx-group /var/cache/nginx
RUN chown -R frontend:nginx-group /var/log/nginx
RUN chown -R frontend:nginx-group /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R frontend:nginx-group /var/run/nginx.pid

USER frontend

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
