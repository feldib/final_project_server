# Multi-stage build for smaller production image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev dependencies for building)
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Production stage - smaller final image
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

EXPOSE 5000

# Run the compiled JavaScript
ENTRYPOINT ["sh", "-c", "echo 'Server container is ready!'; npm start"]