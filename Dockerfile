# Multi-stage lightweight Dockerfile for LogForensic AI
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json tsconfig.json vite.config.ts ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy source code and config
COPY index.html ./
COPY src/ ./src/
COPY server.ts ./

# Build production frontend assets
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/src/utils ./src/utils

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.ts"]
