# ==============================================================================
# VARUNETRA Backend Production Dockerfile (Hardened Non-Root Container)
# Problem Statement SIH26085: Urban Flood Nowcasting System
# ==============================================================================

FROM python:3.11-slim as builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --prefix=/install -r /app/requirements.txt

# --- Final Hardened Production Runtime Stage ---
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    HOST=0.0.0.0 \
    PORT=8000 \
    WORKERS=1 \
    LOG_LEVEL=info \
    OPERATIONS_DB_PATH=/app/data/db/varunetra_operations.db \
    COPERNICUS_PILOT_DIR=/app/data/dem/copernicus/pilot \
    COPERNICUS_RAW_DIR=/app/data/dem/copernicus/raw

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged application user
RUN groupadd -g 1001 varunetra && \
    useradd -u 1001 -g varunetra -s /bin/bash -m varunetra

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy backend source code, models, and pilot datasets
COPY backend /app/backend
COPY simulation /app/simulation
COPY ml /app/ml
COPY data /app/data

# Ensure operational directory permissions for unprivileged user
RUN mkdir -p /app/data/db && \
    chown -R varunetra:varunetra /app

USER varunetra

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health/live || exit 1

ENTRYPOINT ["python", "backend/run.py"]
