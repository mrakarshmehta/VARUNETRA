"""
VARUNETRA Persistent Operational Database & Audit Storage
Problem Statement SIH26085: Urban Flood Nowcasting System

ACID-compliant, restart-safe SQLite storage for:
- SOS incidents
- Field incident reports
- Rescue team telemetry & assignments
- Municipal pumps & dewatering dispatches
- Shelters and hospitals
- Relief camps
- Post-flood damage reports
- Official alerts & advisories
- Immutable administrative audit logs

Safety guarantees:
- Zero drop_all / recreate on startup
- Idempotent schema bootstrapping (CREATE TABLE IF NOT EXISTS)
- Non-destructive reference seeding (only seeds if tables are empty)
- Thread-safe connection context with WAL mode
"""

import os
import sqlite3
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.core.config import settings, DataProvenance, RiskLevel, SOSStatus, PumpStatus

logger = logging.getLogger("varunetra.storage")


class DatabaseManager:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.OPERATIONS_DB_PATH
        self._ensure_db_dir()
        self._init_schema()
        self._seed_reference_data_if_empty()

    def _ensure_db_dir(self):
        directory = os.path.dirname(self.db_path)
        if directory:
            os.makedirs(directory, exist_ok=True)

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False, timeout=30.0)
        conn.row_factory = sqlite3.Row
        # WAL mode provides concurrent reads without blocking writes
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        return conn

    def _init_schema(self):
        """Creates operational tables idempotently without destroying existing data."""
        with self.get_connection() as conn:
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS sos_incidents (
                id TEXT PRIMARY KEY,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                number_of_people INTEGER NOT NULL,
                emergency_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                contact_phone TEXT NOT NULL,
                address_hint TEXT,
                notes TEXT,
                status TEXT NOT NULL,
                assigned_team_id TEXT,
                assigned_team_name TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS incident_reports (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                severity TEXT NOT NULL,
                description TEXT NOT NULL,
                reporter_role TEXT NOT NULL,
                contact_info TEXT,
                address TEXT,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS rescue_teams (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                team_type TEXT NOT NULL,
                capacity_people INTEGER NOT NULL,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                status TEXT NOT NULL,
                assigned_incident_id TEXT,
                equipment_json TEXT,
                eta_minutes REAL
            );

            CREATE TABLE IF NOT EXISTS facilities (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                facility_type TEXT NOT NULL,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                capacity INTEGER NOT NULL,
                current_occupancy INTEGER NOT NULL,
                flood_risk TEXT NOT NULL,
                road_passability TEXT NOT NULL,
                phone TEXT NOT NULL,
                address TEXT NOT NULL,
                has_emergency_power INTEGER NOT NULL,
                available_beds_or_space INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS municipal_pumps (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                pump_type TEXT NOT NULL,
                discharge_capacity_m3h REAL NOT NULL,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                status TEXT NOT NULL,
                assigned_zone_id TEXT,
                assigned_zone_name TEXT,
                fuel_level_pct REAL NOT NULL,
                operating_hours_today REAL NOT NULL,
                recommended_for_severity TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS relief_camps (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                occupancy INTEGER NOT NULL,
                capacity INTEGER NOT NULL,
                food_supply_days REAL NOT NULL,
                potable_water_liters REAL NOT NULL,
                medicine_kits INTEGER NOT NULL,
                has_critical_shortage INTEGER NOT NULL,
                shortage_items_json TEXT
            );

            CREATE TABLE IF NOT EXISTS damage_reports (
                id TEXT PRIMARY KEY,
                zone_id TEXT NOT NULL,
                zone_name TEXT NOT NULL,
                asset_type TEXT NOT NULL,
                damage_severity TEXT NOT NULL,
                estimated_repair_cost_inr REAL NOT NULL,
                field_verified INTEGER NOT NULL,
                reported_by TEXT NOT NULL,
                before_flood_status TEXT NOT NULL,
                observed_damage_notes TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                level TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                zone_name TEXT NOT NULL,
                lead_time_min INTEGER NOT NULL,
                action_advised TEXT NOT NULL,
                issued_by TEXT NOT NULL,
                is_draft INTEGER NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                actor_id TEXT NOT NULL,
                actor_role TEXT NOT NULL,
                action TEXT NOT NULL,
                resource_type TEXT NOT NULL,
                resource_id TEXT NOT NULL,
                details_json TEXT,
                ip_address TEXT
            );

            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                full_name TEXT NOT NULL,
                email TEXT,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_sos_status ON sos_incidents(status);
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            """)

    def _seed_reference_data_if_empty(self):
        """Idempotently seeds baseline operational reference data only if tables are empty."""
        now = datetime.now(timezone.utc).isoformat()
        with self.get_connection() as conn:
            # 1. Rescue Teams
            cur = conn.execute("SELECT COUNT(*) as count FROM rescue_teams")
            if cur.fetchone()["count"] == 0:
                teams = [
                    ("TEAM-01", "SDRF Tactical Water Rescue 01", "Inflatable Boat Team", 12, 25.6150, 85.1480, "AVAILABLE", None, json.dumps(["2x Zodiac Inflatable Boats", "Lifejackets", "Satellite Comms", "First Aid"]), 12.0),
                    ("TEAM-02", "NDRF Amphibious Unit 04", "Amphibious Vehicle Unit", 24, 25.6050, 85.1320, "AVAILABLE", None, json.dumps(["High-Clearance Tatra Truck", "Rescue Stretchers", "Submersible Dewatering Kit"]), 15.0),
                    ("TEAM-03", "Civil Defense Medical Evac Squad", "Medical Evac Squad", 6, 25.6200, 85.1600, "AVAILABLE", None, json.dumps(["Paramedic Trauma Kit", "Portable Oxygen", "High-Water Stretcher"]), 10.0),
                ]
                conn.executemany(
                    "INSERT INTO rescue_teams VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", teams
                )

            # 2. Facilities
            cur = conn.execute("SELECT COUNT(*) as count FROM facilities")
            if cur.fetchone()["count"] == 0:
                facs = [
                    ("FAC-01", "Patna Medical College Hospital (PMCH)", "HOSPITAL", 25.6210, 85.1580, 800, 620, "SAFE", "PASSABLE", "+91-612-2300080", "Ashok Rajpath, Patna", 1, 180),
                    ("FAC-02", "Nalanda Medical College Hospital (NMCH)", "HOSPITAL", 25.6020, 85.1850, 650, 540, "WARNING", "CAUTION", "+91-612-2354890", "Kankarbagh Main Rd, Patna", 1, 110),
                    ("FAC-03", "Rajendra Nagar Community Relief Shelter", "RELIEF_SHELTER", 25.6040, 85.1520, 350, 180, "HIGH", "CAUTION", "+91-612-2589012", "Road No. 4, Rajendra Nagar", 1, 170),
                    ("FAC-04", "Gandhi Maidan Multi-Purpose Indoor Stadium", "RELIEF_SHELTER", 25.6180, 85.1440, 1200, 410, "SAFE", "PASSABLE", "+91-612-2200115", "Gandhi Maidan North, Patna", 1, 790),
                    ("FAC-05", "Patliputra Sports Complex Safe Camp", "RELIEF_SHELTER", 25.6030, 85.1380, 500, 220, "WARNING", "CAUTION", "+91-612-2678901", "Kankarbagh Colony, Patna", 1, 280),
                ]
                conn.executemany(
                    "INSERT INTO facilities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", facs
                )

            # 3. Municipal Pumps
            cur = conn.execute("SELECT COUNT(*) as count FROM municipal_pumps")
            if cur.fetchone()["count"] == 0:
                pumps = [
                    ("PUMP-01", "Bargawan High-Discharge Pump Station", "High-Flow Diesel De-watering Unit", 1800.0, 25.5920, 85.1380, "ACTIVE", "CAT-04", "Bargawan Railway Colony Basin", 78.0, 4.5, "CRITICAL"),
                    ("PUMP-02", "Saidpur Canal Mobile Trailer Pump 02", "High-Flow Diesel De-watering Unit", 1200.0, 25.6080, 85.1620, "AVAILABLE", None, None, 92.0, 1.2, "HIGH"),
                    ("PUMP-03", "Rajendra Nagar Underpass Submersible", "Submersible Electric Pump", 950.0, 25.6005, 85.1550, "AVAILABLE", None, None, 100.0, 0.0, "HIGH"),
                    ("PUMP-04", "Gandhi Maidan Sump Axial Flow Unit", "High-Flow Diesel De-watering Unit", 1500.0, 25.6180, 85.1420, "AVAILABLE", None, None, 85.0, 2.0, "WARNING"),
                ]
                conn.executemany(
                    "INSERT INTO municipal_pumps VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", pumps
                )

            # 4. Relief Camps
            cur = conn.execute("SELECT COUNT(*) as count FROM relief_camps")
            if cur.fetchone()["count"] == 0:
                camps = [
                    ("CAMP-01", "Gandhi Maidan Central Relief Hub", 25.6180, 85.1440, 410, 1200, 5.5, 14000.0, 320, 0, json.dumps([])),
                    ("CAMP-02", "Kankarbagh Community Centre Camp", 25.6030, 85.1380, 220, 350, 1.5, 2200.0, 45, 1, json.dumps(["Infant Formula", "Potable Water Refill"])),
                    ("CAMP-03", "Rajendra Nagar High School Relief Point", 25.6040, 85.1520, 180, 200, 2.0, 1800.0, 30, 1, json.dumps(["Dry Food Packets", "Chlorine Tablets"])),
                ]
                conn.executemany(
                    "INSERT INTO relief_camps VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", camps
                )

            # 5. Baseline Damage Reports
            cur = conn.execute("SELECT COUNT(*) as count FROM damage_reports")
            if cur.fetchone()["count"] == 0:
                reports = [
                    ("DAM-01", "CAT-02", "Rajendra Nagar Overbridge Embankment", "Road Subbase", "HIGH", 450000.0, 1, "Er. Rajesh Verma (Field Officer)", "Intact asphalt roadway", "Severe scour of granular sub-base due to prolonged 38cm inundation", now),
                    ("DAM-02", "CAT-03", "Saidpur Canal Retaining Wall", "Drainage Culvert", "CRITICAL", 850000.0, 1, "Er. Priya Singh (Municipal Engineer)", "Concrete masonry retaining channel", "25-meter collapse of masonry wall under hydraulic backpressure", now),
                    ("DAM-03", "CAT-04", "Bargawan Distribution Transformer 03", "Electrical Transformer", "HIGH", 320000.0, 0, "Citizen Field Verification", "Operational elevated pad", "Transformer base submerged in 45cm standing water, isolated for safety", now),
                ]
                conn.executemany(
                    "INSERT INTO damage_reports VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", reports
                )

            # 6. Baseline Alerts
            cur = conn.execute("SELECT COUNT(*) as count FROM alerts")
            if cur.fetchone()["count"] == 0:
                alerts = [
                    ("ALT-01", "CRITICAL", "FLASH INUNDATION WARNING: Rajendra Nagar - Saidpur Corridor",
                     "Rapid waterlogging expected to reach 35-50 cm within 45 minutes due to conduit surcharge and outfall backflow.",
                     "Rajendra Nagar & Saidpur Canal Basin", 45,
                     "Avoid low-lying underpasses. Heavy vehicles and emergency services only along elevated corridors.",
                     "Municipal Disaster Management Authority (MDMA) [Draft Advisory Engine]", 1, now),
                    ("ALT-02", "WARNING", "DRAINAGE SURCHARGE WATCH: Kankarbagh South",
                     "Trunk conduit utilization exceeds 85%. Ground floor dwellings advised to secure electrical equipment.",
                     "Kankarbagh Colony", 60,
                     "Relocate fragile property and elderly residents to upper floor levels if rainfall continues.",
                     "State Disaster Management Authority (SDMA) [Draft Advisory Engine]", 1, now),
                ]
                conn.executemany(
                    "INSERT INTO alerts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", alerts
                )

            # 7. Initial Demo SOS (only seeded if in DEMO mode and SOS table is completely empty)
            if settings.DATA_MODE == DataProvenance.DEMO:
                cur = conn.execute("SELECT COUNT(*) as count FROM sos_incidents")
                if cur.fetchone()["count"] == 0:
                    conn.execute("""
                        INSERT INTO sos_incidents VALUES (
                            'SOS-PAT-901', 25.6010, 85.1540, 4,
                            'Family Trapped in Inundated Ground Floor', 'CRITICAL',
                            '+91-9876543210', 'House 42, Road 5, Rajendra Nagar',
                            'Water depth 42 cm and rising; elderly person on wheelchair',
                            'ASSIGNED', 'TEAM-01', 'SDRF Tactical Water Rescue 01',
                            ?, ?
                        )
                    """, (now, now))
                    conn.execute("""
                        UPDATE rescue_teams SET status = 'DISPATCHED', assigned_incident_id = 'SOS-PAT-901'
                        WHERE id = 'TEAM-01'
                    """)

            # 8. Baseline Operator Accounts (Idempotent seed with PBKDF2 hashed passwords)
            cur = conn.execute("SELECT COUNT(*) as count FROM users")
            if cur.fetchone()["count"] == 0:
                from app.core.auth import hash_password
                admin_pw = settings.ADMIN_DEFAULT_PASSWORD or ("Varunetra@MoES2026!" if settings.DATA_MODE == DataProvenance.DEMO else "")
                users_to_seed = []
                if admin_pw:
                    users_to_seed.append((
                        "USR-ADMIN-01", "admin", hash_password(admin_pw),
                        "ADMINISTRATOR", "MoES System Administrator", "admin@varunetra.gov.in", now
                    ))
                if settings.DATA_MODE == DataProvenance.DEMO:
                    demo_pw = hash_password("DemoPass@2026!")
                    users_to_seed.extend([
                        ("USR-DMA-01", "dma_officer", demo_pw, "DISASTER_AUTHORITY", "SDMA Disaster Response Lead", "dma@varunetra.demo", now),
                        ("USR-MUN-01", "municipal_eng", demo_pw, "MUNICIPAL_OFFICER", "Patna Municipal Drainage Engineer", "municipal@varunetra.demo", now),
                        ("USR-SDRF-01", "sdrf_lead", demo_pw, "RESCUE_TEAM", "SDRF Tactical Squad Leader", "sdrf@varunetra.demo", now),
                        ("USR-FLD-01", "field_officer", demo_pw, "FIELD_OFFICER", "Urban Inundation Ground Verifier", "field@varunetra.demo", now),
                        ("USR-CIT-01", "citizen_patna", demo_pw, "CITIZEN", "Registered Citizen (Patna)", "citizen@varunetra.demo", now),
                    ])
                if users_to_seed:
                    conn.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", users_to_seed)

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Retrieves an operator account by unique username."""
        with self.get_connection() as conn:
            cur = conn.execute("SELECT * FROM users WHERE username = ?", (username,))
            row = cur.fetchone()
            if row:
                return dict(row)
            return None

    def create_user(
        self,
        user_id: str,
        username: str,
        password_hash: str,
        role: str,
        full_name: str,
        email: Optional[str] = None
    ) -> bool:
        """Registers a persistent operator account with pre-hashed credentials."""
        now = datetime.now(timezone.utc).isoformat()
        with self.get_connection() as conn:
            conn.execute(
                "INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)",
                (user_id, username, password_hash, role, full_name, email, now)
            )
            conn.commit()
            return True

    def create_backup(self, backup_filepath: str) -> str:
        """
        Creates a consistent, online point-in-time SQLite backup using sqlite3's native backup API.
        Safe during live concurrent WAL reads/writes.
        """
        target_dir = os.path.dirname(backup_filepath)
        if target_dir:
            os.makedirs(target_dir, exist_ok=True)
        with self.get_connection() as src_conn:
            target_conn = sqlite3.connect(backup_filepath)
            with target_conn:
                src_conn.backup(target_conn)
            target_conn.close()
        return backup_filepath

    def restore_backup(self, backup_filepath: str) -> bool:
        """Restores database state from a validated backup file after integrity checking."""
        if not os.path.exists(backup_filepath):
            raise FileNotFoundError(f"Backup file not found at {backup_filepath}")

        test_conn = sqlite3.connect(backup_filepath)
        try:
            cur = test_conn.execute("PRAGMA integrity_check;")
            res = cur.fetchone()
            if not res or res[0] != "ok":
                raise ValueError("Corrupt backup file: integrity_check failed")
        finally:
            test_conn.close()

        src_conn = sqlite3.connect(backup_filepath)
        with self.get_connection() as dst_conn:
            with dst_conn:
                src_conn.backup(dst_conn)
        src_conn.close()
        return True

    def log_audit_event(
        self,
        actor_id: str,
        actor_role: str,
        action: str,
        resource_type: str,
        resource_id: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> int:
        """Appends an immutable audit log entry."""
        now = datetime.now(timezone.utc).isoformat()
        details_str = json.dumps(details or {})
        with self.get_connection() as conn:
            cur = conn.execute("""
                INSERT INTO audit_logs (timestamp, actor_id, actor_role, action, resource_type, resource_id, details_json, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (now, actor_id, actor_role, action, resource_type, resource_id, details_str, ip_address))
            conn.commit()
            return cur.lastrowid

    def check_health(self) -> Dict[str, Any]:
        """Validates database connectivity and schema readiness."""
        try:
            with self.get_connection() as conn:
                cur = conn.execute("SELECT COUNT(*) as c FROM sos_incidents")
                sos_count = cur.fetchone()["c"]
                cur2 = conn.execute("SELECT COUNT(*) as c FROM municipal_pumps")
                pump_count = cur2.fetchone()["c"]
                cur3 = conn.execute("SELECT COUNT(*) as c FROM users")
                user_count = cur3.fetchone()["c"]
                return {
                    "status": "OPERATIONAL",
                    "storage_engine": "SQLite WAL",
                    "db_path": self.db_path,
                    "records": {"sos_incidents": sos_count, "pumps": pump_count, "users": user_count},
                }
        except Exception as e:
            return {
                "status": "DEGRADED",
                "error": str(e),
                "db_path": self.db_path,
            }


# Singleton database instance
db_manager = DatabaseManager()
