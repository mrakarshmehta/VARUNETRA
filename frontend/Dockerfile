# ==============================================================================
# VARUNETRA Frontend Production Dockerfile (Multi-Stage Build)
# Problem Statement SIH26085: Urban Flood Nowcasting System
# ==============================================================================

# --- Stage 1: Build Static Assets ---
FROM node:22-alpine as builder

WORKDIR /app

# Install build dependencies
COPY frontend/package.json frontend/package-lock.json* /app/
RUN npm ci

# Copy frontend source code and public assets
COPY frontend /app

# Build optimized production bundle with CesiumJS workers
RUN npm run build

# --- Stage 2: Serve via Nginx Reverse-Proxy ---
FROM nginx:alpine

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy production Nginx configuration with Cesium MIME handling and proxy routes
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Install curl for container health checks
RUN apk add --no-cache curl

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
