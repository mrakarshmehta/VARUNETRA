# VARUNETRA / FloodSense — Production Deployment Guide
**Problem Statement SIH26085: Urban Flood Nowcasting System (Drainage and Rainfall Coupling)**  
**Target Basin:** Patna Urban Basin, Bihar  
**Version:** Release Candidate 1.0 (Production Hardened)

---

## 1. System Architecture Overview

VARUNETRA is architected as a lightweight, containerized micro-stack designed for self-hosted deployment on dedicated on-premise infrastructure or standard cloud virtual machines:

```
[ Internet / Intranet Client Traffic ]
                 │
                 ▼
  [ Nginx Reverse-Proxy & Static Ingress (Port 80/443) ]
  ├── Static SPA Assets: / (React 19 + TypeScript + Vite)
  ├── API Proxy: /api/* -> backend:8000
  ├── Health Probes: /health, /health/live, /health/ready -> backend:8000
  └── WebSocket Stream: /api/ws (HTTP/1.1 Upgrade, Buffering Off)
                 │
                 ▼
  [ FastAPI Application Server (Uvicorn, WORKERS=1) ]
  ├── Non-root user: varunetra (uid 1001, gid 1001)
  ├── Read-Only Terrain Mount: /app/data/dem (Copernicus GLO-30 DSM)
  └── Read-Write Database Mount: /app/data/db (SQLite WAL Mode)
```

### Key Architectural Safeguards
1. **Single-Worker Enforcement:** `WORKERS=1` is strictly enforced at runtime. WebSocket subscriber pools and in-flight nowcast tick intervals operate process-locally. Scaling horizontally across multiple workers requires an external broker (e.g., Redis/Postgres PubSub) and is disabled by default.
2. **Authoritative Real-Mode Fail-Closed:** When configured in `DATA_MODE=REAL`, missing or unverified terrain datasets cause the system to fail closed (`UNAVAILABLE`), returning `HTTP 503` on `/health/ready`. The system will **never** silently substitute synthetic pilot terrain.
3. **Single-Node Persistent Database:** Uses ACID-compliant SQLite with Write-Ahead Logging (`PRAGMA journal_mode=WAL;`). All operations, citizen SOS requests, municipal pump states, and audit logs persist across container restarts.

---

## 2. Host Prerequisites & Resource Sizing

* **Host OS:** Linux (Ubuntu 22.04 LTS / 24.04 LTS or Debian 12 recommended).
* **Container Runtime:** Docker Engine 24.0+ and Docker Compose v2.20+.
* **Compute:** Minimum 2 dedicated vCPUs; 4 vCPUs recommended.
* **Memory:** Minimum 4 GB RAM; 8 GB RAM recommended.
* **Persistent Disk:** Minimum 20 GB SSD/NVMe allocated for operational database and terrain rasters.
* **Network:** Open inbound HTTP (80) and HTTPS (443) ports.

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Clone Repository & Populate Environment
```bash
git clone https://github.com/MoES-SIH26085/VARUNETRA.git /opt/varunetra
cd /opt/varunetra

# Copy production environment template
cp .env.production.example .env

# Restrict permissions
chmod 600 .env
```

Edit `.env` using your preferred editor:
* Set `DATA_MODE=REAL`
* Generate a random 32-character secret: `openssl rand -hex 32` and set `AUTH_SECRET_KEY`
* Set a strong bootstrap password: `ADMIN_DEFAULT_PASSWORD="YourStrongAdminPassword2026!"`
* Specify your official domain: `BACKEND_CORS_ORIGINS=["https://your-domain.gov.in"]`

### Step 2: Verify Copernicus GLO-30 DSM Datasets
Ensure the preprocessed Copernicus GLO-30 DSM pilot rasters exist:
```bash
ls -la data/dem/copernicus/pilot/
# Must contain:
# - copernicus_patna_pilot_dem.npy
# - copernicus_patna_pilot_metadata.json
```

### Step 3: Validate Compose Specification
```bash
docker compose config
```

### Step 4: Build Production Containers
```bash
docker compose build
```

### Step 5: Start Services in Detached Mode
```bash
docker compose up -d
```

### Step 6: Verify Service Status
```bash
docker compose ps
```
Both `backend` and `frontend` (Nginx) must report `Up (healthy)`.

---

## 4. Health & Ingress Probes

VARUNETRA provides two dedicated health probe endpoints:

1. **Liveness Probe (`GET /health/live`):**
   * Verifies the process is alive and responding.
   * Returns: `HTTP 200` with `{"status":"ALIVE", "service":"VARUNETRA", ...}`
   * Used by orchestrators for process restart triggers.

2. **Readiness Probe (`GET /health/ready`):**
   * Validates database connectivity, terrain provider availability, ML surrogate readiness, and single-worker constraints.
   * Returns: `HTTP 200` with `{"status":"READY", ...}` when all dependencies are satisfied.
   * Returns: `HTTP 503` with `{"status":"NOT_READY", ...}` if authoritative terrain is unconfigured or corrupted in REAL mode.
   * Used by reverse proxies and load balancers before routing operational citizen/emergency traffic.

---

## 5. Maintenance & Operational Lifecycle

### Viewing Application Logs
```bash
docker compose logs -f --tail=100 backend
docker compose logs -f --tail=100 frontend
```

### Graceful Restart
```bash
# Restart backend without losing operational state:
docker compose restart backend

# Verify health after restart:
curl -f http://localhost/health/ready
```

### Stopping Services
```bash
docker compose down
# Note: Persistent database data remains intact on host disk in ./data/db
```

---

## 6. Smoke Testing & Verification Scripts

To avoid ambiguous infrastructure claims, testing scripts are explicitly partitioned:

### A. Direct Backend Verification (Ingress BYPASSED)
Verifies FastAPI health, authentication, RBAC, terrain engine, and core API directly on port 8000:
```bash
# Linux / macOS
bash scripts/backend-smoke-test.sh http://127.0.0.1:8000

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/backend-smoke-test.ps1 -TargetUrl http://127.0.0.1:8000
```

### B. Production Ingress Verification (Ingress TESTED)
Must target the live Nginx reverse proxy (port 80/443). Validates SPA HTML index, API routing, health routing, authentication, RBAC, and WebSocket upgrade. Rejects direct backend targets and fails immediately if Nginx is unreachable:
```bash
# Linux / macOS
bash scripts/production-smoke-test.sh http://127.0.0.1

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/production-smoke-test.ps1 -TargetUrl http://127.0.0.1
```

### C. WebSocket Protocol & Reconnect Verification
```bash
# 1. WebSocket protocol + client reconnect test
python scripts/websocket-smoke-test.py --test-reconnect

# 2. Real backend process restart lifecycle test (spawns, connects, terminates, verifies drop, restarts, reconnects)
python scripts/websocket-restart-smoke-test.py
```
