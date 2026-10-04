# VARUNETRA / FloodSense — Production Pre-Flight Checklist
**Problem Statement SIH26085: Urban Flood Nowcasting System**  
**Target Release Candidate:** RC-1.0 (Hardened)

Before launching VARUNETRA into production, execute this pre-flight verification on the target host.

---

## 1. Target Host Hardware & OS Prerequisites

| Requirement | Minimum Specification | Recommended Specification | Verified [X] |
| :--- | :--- | :--- | :---: |
| **Operating System** | Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL 9) | Ubuntu 24.04 LTS / Debian 12 | [ ] |
| **Architecture** | x86_64 / amd64 | x86_64 / amd64 | [ ] |
| **CPU** | 2 Dedicated vCPUs | 4 vCPUs | [ ] |
| **Memory (RAM)** | 4 GB | 8 GB | [ ] |
| **Storage Disk** | 20 GB SSD/NVMe (Persistent) | 40 GB SSD/NVMe | [ ] |
| **Container Engine** | Docker Engine 24.0+ & Compose v2.20+ | Docker Engine 26.0+ & Compose v2.27+ | [ ] |
| **Inbound Ports** | Port 80 (HTTP) & Port 443 (HTTPS) | Port 80 & Port 443 behind perimeter firewall | [ ] |
| **DNS Resolution** | Qualified A/AAAA record pointing to host | Qualified domain (e.g. `varunetra.patna.gov.in`) | [ ] |
| **TLS Certificate** | Valid x509 cert (Let's Encrypt / Certbot / Gov CA) | Automated renewal via Certbot / reverse proxy | [ ] |

---

## 2. Pre-Deployment Configuration Audit

Before running `docker compose up -d`, confirm:

- [ ] **`.env` File Created:** Created via `cp .env.production.example .env` and permissions set to `chmod 600 .env`.
- [ ] **Operational Mode:** `DATA_MODE=REAL` is set for authoritative production use.
- [ ] **Cryptographic Secret:** `AUTH_SECRET_KEY` is populated with a randomly generated string of at least 32 characters (`openssl rand -hex 32`). Not using `"dev"`, `"secret"`, or `"changeme"`.
- [ ] **Bootstrap Password:** `ADMIN_DEFAULT_PASSWORD` is configured with a high-entropy passphrase (minimum 12 characters).
- [ ] **CORS Allowlist:** `BACKEND_CORS_ORIGINS` contains explicit production domain names (e.g. `["https://varunetra.gov.in"]`). Wildcard `'*'` is NOT used.
- [ ] **Single Worker Enforcement:** `WORKERS=1` is configured. (Multi-worker mode is unsupported due to process-local WebSocket and nowcast simulation state).
- [ ] **Authoritative Terrain Mounted:** The Copernicus GLO-30 DSM pilot dataset is verified at `./data/dem/copernicus/pilot/copernicus_patna_pilot_dem.npy` and `copernicus_patna_pilot_metadata.json`.

---

## 3. Deployment Execution Steps

Execute the sequence on the target host:

```bash
# 1. Validate Docker Compose syntax
docker compose config

# 2. Build minimal production container images
docker compose build

# 3. Launch stack in background
docker compose up -d

# 4. Verify container states
docker compose ps
```

---

## 4. Post-Deployment Ingress & Service Health Verification

Execute the automated verification script:

```bash
bash scripts/production-smoke-test.sh http://localhost
```

Or verify individual endpoints manually:

- [ ] **Nginx Reverse Proxy:** `curl -I http://localhost/` returns `HTTP 200 OK` (serves SPA HTML).
- [ ] **Process Liveness:** `curl -f http://localhost/health/live` returns `{"status":"ALIVE", ...}`.
- [ ] **System Readiness:** `curl -f http://localhost/health/ready` returns `HTTP 200` with `{"status":"READY", ...}`.
  * *Database:* `OPERATIONAL`
  * *Terrain Engine:* `ready: true`, active provider `COPERNICUS_GLO30`
  * *Worker Safety:* `supported: true` (workers: 1)
- [ ] **Terrain Telemetry:** `curl -f http://localhost/api/terrain/status` confirms active provider is `COPERNICUS_GLO30` and `fail_closed: true`.
- [ ] **Authentication Boundary:**
  * Login with valid credentials (`POST /api/auth/login`) returns JWT access token.
  * Login with invalid credentials returns `HTTP 401 Unauthorized`.
  * Demo login (`POST /api/auth/demo-login`) returns `HTTP 403 Forbidden` in REAL mode.
- [ ] **WebSocket Telemetry:** Connect to `ws://localhost/api/ws` with `Upgrade: websocket`. Confirm connection accepted and live events received.
- [ ] **Persistence Restart Check:**
  * Submit test SOS ticket: `POST /api/sos`
  * Restart backend container: `docker compose restart backend`
  * Query SOS ticket: `GET /api/sos/{id}` — confirm record persists intact.
