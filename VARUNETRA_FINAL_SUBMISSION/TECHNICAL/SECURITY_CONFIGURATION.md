# VARUNETRA / FloodSense — Security Configuration Specification
**Problem Statement SIH26085: Urban Flood Nowcasting System**  
**Security Boundary:** Production Release Candidate 1.0

---

## 1. Authentication & Identity Boundary

VARUNETRA implements a centralized authentication and token issuance service:

* **Token Architecture:** Stateless, signed JSON Web Tokens using **HMAC-SHA256 (HS256)**.
* **Credential Storage:** User account credentials reside in the persistent SQLite `users` table. Passwords are never stored in plain text.
* **Password Hashing Standard:** Passwords are encrypted using **PBKDF2-HMAC-SHA256** with:
  * 100,000 hash iterations
  * 16-byte cryptographically random salt per user (`secrets.token_hex(16)`)
  * Storage format: `pbkdf2_sha256$100000$<salt>$<hash>`
* **Constant-Time Verification:** Verification uses `hmac.compare_digest` to prevent timing attacks.
* **Token Integrity:** Signature validation, structure parsing, and expiration checks (`exp < now`) are strictly enforced. All validation failures return controlled `HTTP 401 Unauthorized`.
* **Zero Client-Controlled Roles:** The client cannot supply or elevate its role in production. The user's role is extracted exclusively from the authenticated database user record.
* **Scope Disclaimer:** **The local HMAC-SHA256 bearer token represents an application-level identity boundary. It is NOT equivalent to certified state or national government single sign-on (such as Parichay, e-Pramaan, or Jan Parichay).** For multi-agency state deployments, government SSO should be integrated as an external identity provider into this boundary.

---

## 2. Role-Based Access Control (RBAC) Matrix

VARUNETRA defines six distinct operational user roles:

1. **`CITIZEN`:** Registered members of the public. Can submit emergency SOS requests, report local field flooding, query flood-safe evacuation routes, and inspect public flood intelligence.
2. **`FIELD_OFFICER`:** Ground personnel conducting physical water depth verification and infrastructure damage reporting.
3. **`RESCUE_TEAM`:** Specialized emergency units (SDRF / NDRF / Civil Defense). Can view dispatched incidents, update rescue mission progress (`ASSIGNED`, `ON_SCENE`, `RESCUED`), and coordinate equipment telemetry.
4. **`MUNICIPAL_OFFICER`:** Municipal Corporation engineers (Patna Municipal Corporation / PMC). Authorized to dispatch and manage municipal dewatering pumps and oversee conduit stress.
5. **`DISASTER_AUTHORITY`:** State Disaster Management Authority (SDMA) leadership. Has full operational authority to direct rescue operations, trigger emergency alerts, and switch terrain models.
6. **`ADMINISTRATOR`:** System operations and IT management. Full control over system configuration, user provisioning, and operational state.

### Explicit Permission Matrix

| Protected Operation | HTTP Method & Route | Permitted Roles | Unauthorized Status |
| :--- | :--- | :--- | :---: |
| **Submit Citizen SOS** | `POST /api/sos` | All Roles (or Anonymous) | N/A |
| **Report Field Incident** | `POST /api/incidents` | All Roles (or Anonymous) | N/A |
| **Update SOS Incident** | `PATCH /api/sos/{id}` | `ADMINISTRATOR`, `DISASTER_AUTHORITY`, `RESCUE_TEAM` | `HTTP 403` |
| **Manage Municipal Pump** | `PATCH /api/pumps/{id}` | `ADMINISTRATOR`, `DISASTER_AUTHORITY`, `MUNICIPAL_OFFICER` | `HTTP 403` |
| **Import / Switch Terrain**| `POST /api/terrain/import` | `ADMINISTRATOR`, `DISASTER_AUTHORITY` | `HTTP 403` |
| **Disaster Scenario Controls**| `POST /api/demo/*` | `ADMINISTRATOR`, `DISASTER_AUTHORITY` (DEMO only) | `HTTP 403` |

---

## 3. Network & CORS Policy

* **No Wildcards in Production:** The backend strictly forbids `*` in `BACKEND_CORS_ORIGINS` when `DATA_MODE != DEMO`. Startup aborts immediately if a wildcard is detected.
* **Origin Allowlist:** Production deployments must specify an explicit array of permitted fully-qualified domain names in `.env`:
  ```json
  BACKEND_CORS_ORIGINS=["https://varunetra.gov.in", "https://flood.patnamunicipal.org"]
  ```
* **Allowed HTTP Methods:** Strictly limited to `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]`.
* **Allowed Headers:** Restricted to `["Authorization", "Content-Type", "Accept", "X-Requested-With"]`.

---

## 4. Container Hardening & Process Isolation

* **Unprivileged User Execution:** The backend container runs as a dedicated system user `varunetra` (`uid 1001`, `gid 1001`), never as `root`.
* **Privilege Escalation Prevention:** Enforced via `security_opt: ["no-new-privileges:true"]`.
* **Linux Capabilities Dropped:** All Linux capabilities are stripped via `cap_drop: ["ALL"]`.
* **Read-Only Dataset Mount:** Authoritative Copernicus GLO-30 DSM rasters are mounted read-only (`./data/dem:/app/data/dem:ro`) to prevent accidental modification or corruption.
* **Persistent Storage Mount:** Only `./data/db` is mounted read-write for operational SQLite storage.
* **Resource Limits:** Docker Compose enforces strict CPU and memory quotas:
  * Backend: Max 2.0 CPUs, 2048 MB RAM
  * Frontend: Max 1.0 CPU, 512 MB RAM
* **Image Minimalization:** `.dockerignore` excludes all test suites, `.env` files, git histories, temporary Python bytecode, and uncompiled raw rasters from container layers.

---

## 5. Audited Privileged Actions

Every administrative or operational mutation emits a persistent audit log record to the SQLite `audit_logs` table:

```sql
INSERT INTO audit_logs (timestamp, actor_id, actor_role, action, resource_type, resource_id, details_json, ip_address)
```

Audited events include:
* `USER_LOGIN_SUCCESS` / `USER_LOGIN_FAILED`
* `SOS_CREATED` / `SOS_STATUS_UPDATE`
* `PUMP_MANAGEMENT_ACTION`
* `TERRAIN_PROVIDER_SWITCH`
* `INCIDENT_REPORTED`
