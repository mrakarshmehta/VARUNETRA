# VARUNETRA Operations Database — Backup, Restore & Recovery Runbook
**Problem Statement SIH26085: Urban Flood Nowcasting System**  
**Storage Engine:** SQLite 3 with Write-Ahead Logging (`PRAGMA journal_mode=WAL;`)  
**Active Production Path:** `./data/db/varunetra_operations.db`  
**Container Mount Point:** `/app/data/db` (read-write persistent volume)

---

## 1. Storage Architecture & Durability

VARUNETRA stores operational disaster records—including citizen SOS dispatches, municipal dewatering pump commands, rescue unit telemetry, and audited privileged action logs—in an ACID-compliant SQLite relational database.

* **WAL Mode (`journal_mode=WAL`):** Readers never block writers, and writers never block readers. All transactions write sequentially to `varunetra_operations.db-wal` before atomic checkpointing into the primary DB file.
* **Durability Guarantee:** `PRAGMA synchronous=NORMAL;` ensures data is committed to disk before returning success, preventing corruption across unexpected host power loss or backend crashes.
* **Reference Data Safety:** Startup initialization strictly executes `CREATE TABLE IF NOT EXISTS` and reference seeding is idempotent (runs only if record count is 0). Process restarts **never** call `drop_all` or overwrite existing operational records.

---

## 2. Online Backup Procedure (Zero Downtime)

Because SQLite is running in WAL mode, taking a simple file-copy of `varunetra_operations.db` while transactions are in-flight can result in an inconsistent snapshot. 

Use one of the two certified methods below:

### Method A: Automated CLI Point-in-Time Backup (Recommended)
Execute SQLite's atomic online backup command directly through the SQLite3 CLI or within the container:

```bash
# On the host or inside backend container:
sqlite3 data/db/varunetra_operations.db ".backup 'data/db/backups/varunetra_backup_$(date +%Y%m%d_%H%M%S).db'"
```

### Method B: Native Python Point-in-Time Backup
VARUNETRA provides a built-in programmatic backup API utilizing SQLite's native `sqlite3.Connection.backup()` protocol:

```python
from app.db.storage import db_manager

# Creates a 100% consistent live point-in-time snapshot during concurrent WAL traffic
backup_path = db_manager.create_backup("data/db/backups/scheduled_backup.db")
print(f"Consistent backup generated at: {backup_path}")
```

---

## 3. Restoration & Disaster Recovery Procedure

To restore from a backup snapshot (e.g., following human error or hardware migration):

### Step 1: Pre-flight Integrity Verification
Always verify the cryptographic and structural integrity of the backup file before applying it:

```bash
sqlite3 data/db/backups/varunetra_backup_target.db "PRAGMA integrity_check;"
# Output MUST be: ok
```

### Step 2: Restore via Python Management API
Execute atomic restore with automatic integrity validation:

```python
from app.db.storage import db_manager

# Verifies PRAGMA integrity_check and atomically restores the main database
db_manager.restore_backup("data/db/backups/varunetra_backup_target.db")
print("Database restoration verified and completed successfully.")
```

### Step 3: Manual Cold Restore (Fallback)
If recovering while the application is completely stopped:
1. Stop the application: `docker compose down` (or terminate backend process).
2. Archive the current corrupted state:
   ```bash
   mv data/db/varunetra_operations.db data/db/varunetra_corrupt.bak
   rm -f data/db/varunetra_operations.db-wal data/db/varunetra_operations.db-shm
   ```
3. Copy the verified backup into place:
   ```bash
   cp data/db/backups/varunetra_backup_target.db data/db/varunetra_operations.db
   ```
4. Restart the service:
   ```bash
   docker compose up -d
   ```
5. Confirm operational readiness:
   ```bash
   curl -f http://localhost:8000/health/ready
   ```
