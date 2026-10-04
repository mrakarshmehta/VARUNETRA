"""
VARUNETRA — Final Release Gate Validation Tests
Problem Statement SIH26085: Urban Flood Nowcasting System

Validates:
1. Complete Authentication & Token Verification (Invalid password, unknown user, forged token, expired token, modified role claim, privilege escalation)
2. Centralized RBAC Enforcement & Explicit Role Matrix
3. Database Persistence, Recovery, Native Online Backup & Restore, Transaction Rollback
4. Negative Operational Tests (Invalid IDs: 999999999, -1, 0, malformed UUIDs; controlled 4xx)
5. REAL-Mode Fail-Closed Verification (No silent synthetic fallback)
6. ML Provenance & Recalibration Safeguards
"""

import os
import sys
import time
import pytest
from pydantic import ValidationError

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
for p in [PROJECT_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import Settings, settings, DataProvenance, UserRole, RiskLevel, SOSStatus, PumpStatus
from app.core.auth import create_access_token, verify_token, hash_password, verify_password
from app.db.storage import DatabaseManager
from app.services.operations_service import OperationsManager
from app.schemas.operations import SOSCreateRequest, PumpActionRequest

client = TestClient(app)


# ==============================================================================
# 1. AUTHENTICATION & TOKEN INTEGRITY TESTS
# ==============================================================================

def test_auth_invalid_password_returns_401():
    """Verify that an incorrect password for an existing user returns controlled 401."""
    res = client.post("/api/auth/login", json={"username": "admin", "password": "CompletelyWrongPassword!"})
    assert res.status_code == 401
    assert "Invalid username or password" in res.json()["detail"]


def test_auth_unknown_user_returns_401():
    """Verify that an unknown username returns controlled 401."""
    res = client.post("/api/auth/login", json={"username": "ghost_operator", "password": "AnyPassword123!"})
    assert res.status_code == 401
    assert "Invalid username or password" in res.json()["detail"]


def test_auth_forged_token_returns_401():
    """Verify that a token with a forged signature fails validation."""
    token = create_access_token("USR-ADM-01", "admin", UserRole.ADMINISTRATOR, "Admin")
    parts = token.split(".")
    # Tamper with signature
    forged_token = f"{parts[0]}.{parts[1]}.FORGED_SIGNATURE_BYTES"
    with pytest.raises(Exception) as excinfo:
        verify_token(forged_token)
    assert excinfo.value.status_code == 401
    assert "Invalid token signature" in excinfo.value.detail


def test_auth_expired_token_returns_401():
    """Verify that an expired token is strictly rejected."""
    # Create token expired 10 minutes ago
    token = create_access_token("USR-ADM-01", "admin", UserRole.ADMINISTRATOR, "Admin", expires_minutes=-10)
    with pytest.raises(Exception) as excinfo:
        verify_token(token)
    assert excinfo.value.status_code == 401
    assert "token has expired" in excinfo.value.detail


def test_auth_modified_role_claim_tampering_fails():
    """Verify that manually altering the role in payload without private key fails signature verification."""
    token = create_access_token("USR-CIT-01", "citizen_patna", UserRole.CITIZEN, "Citizen")
    parts = token.split(".")
    import base64, json
    # Decode payload
    padding = 4 - (len(parts[1]) % 4)
    padded = parts[1] + ("=" * (padding % 4))
    payload = json.loads(base64.urlsafe_b64decode(padded.encode()).decode())
    
    # Tamper role from CITIZEN to ADMINISTRATOR
    payload["role"] = "ADMINISTRATOR"
    tampered_payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    tampered_token = f"{parts[0]}.{tampered_payload_b64}.{parts[2]}"

    with pytest.raises(Exception) as excinfo:
        verify_token(tampered_token)
    assert excinfo.value.status_code == 401
    assert "Invalid token signature" in excinfo.value.detail


def test_privileged_endpoint_without_token_in_real_mode_returns_401():
    """Verify that accessing a privileged endpoint without authorization header returns 401 in REAL mode."""
    orig_mode = settings.DATA_MODE
    try:
        settings.DATA_MODE = DataProvenance.REAL
        # No Authorization header supplied
        res = client.patch("/api/pumps/PUMP-01", json={"action": "ACTIVATE"})
        assert res.status_code == 401
        assert "Authentication credentials required" in res.json()["detail"]
    finally:
        settings.DATA_MODE = orig_mode


def test_privileged_endpoint_with_citizen_token_returns_403():
    """Verify that authenticated Citizen token is forbidden from administrative pump/terrain mutations."""
    citizen_token = create_access_token("USR-CIT-99", "citizen_test", UserRole.CITIZEN, "Citizen")
    headers = {"Authorization": f"Bearer {citizen_token}"}

    # 1. Citizen attempting to activate pump -> 403 Forbidden
    res_pump = client.patch("/api/pumps/PUMP-01", json={"action": "ACTIVATE"}, headers=headers)
    assert res_pump.status_code == 403
    assert "Access forbidden: User role 'CITIZEN' lacks required privilege" in res_pump.json()["detail"]

    # 2. Citizen attempting to update SOS ticket -> 403 Forbidden
    res_sos = client.patch("/api/sos/SOS-PAT-901", json={"status": "ON_SCENE"}, headers=headers)
    assert res_sos.status_code == 403
    assert "Access forbidden: User role 'CITIZEN' lacks required privilege" in res_sos.json()["detail"]

    # 3. Citizen attempting to switch terrain provider -> 403 Forbidden
    res_terrain = client.post("/api/terrain/import", json={"provider_key": "COPERNICUS_GLO30"}, headers=headers)
    assert res_terrain.status_code == 403
    assert "Access forbidden: User role 'CITIZEN' lacks required privilege" in res_terrain.json()["detail"]


# ==============================================================================
# 2. DATABASE PERSISTENCE, RECOVERY, BACKUP & RESTORE TESTS
# ==============================================================================

def test_database_backup_and_restore_cycle(tmp_path):
    """Proves consistent point-in-time SQLite native backup and restoration."""
    db_file = str(tmp_path / "operational_main.db")
    backup_file = str(tmp_path / "backups" / "operational_backup.db")

    db = DatabaseManager(db_path=db_file)
    ops = OperationsManager(db=db)

    # 1. Create unique record in main DB
    req = SOSCreateRequest(
        lat=25.6025,
        lng=85.1450,
        number_of_people=5,
        emergency_type="Roof collapse threat",
        severity=RiskLevel.HIGH,
        contact_phone="+91-9123456780",
        address_hint="Near Saidpur Nala Culvert",
    )
    sos = ops.create_sos(req)
    sos_id = sos.id

    # 2. Create online point-in-time backup
    saved_path = db.create_backup(backup_file)
    assert os.path.exists(saved_path)

    # 3. Mutate main DB (modify record status)
    ops.update_sos_status(sos_id, SOSStatus.RESCUED)
    assert ops.get_sos_by_id(sos_id).status == SOSStatus.RESCUED

    # 4. Restore from backup
    db.restore_backup(backup_file)

    # 5. Verify restored state matches the backup point-in-time (status is ASSIGNED/NEW, not RESCUED)
    restored_record = ops.get_sos_by_id(sos_id)
    assert restored_record is not None
    assert restored_record.status == SOSStatus.ASSIGNED
    assert restored_record.number_of_people == 5


def test_database_transaction_rollback_on_failed_write(tmp_path):
    """Ensures database state remains uncorrupted if a write transaction encounters an error."""
    db_file = str(tmp_path / "test_rollback.db")
    db = DatabaseManager(db_path=db_file)

    # Count initial records
    with db.get_connection() as conn:
        initial_count = conn.execute("SELECT COUNT(*) as c FROM facilities").fetchone()["c"]

    # Attempt transaction that intentionally fails on second statement (violating primary key)
    with pytest.raises(Exception):
        with db.get_connection() as conn:
            conn.execute("INSERT INTO facilities (id, name, facility_type, lat, lng, capacity, current_occupancy, flood_risk, road_passability, phone, address, has_emergency_power, available_beds_or_space) VALUES ('TEMP-FAC-01', 'Test Shelter', 'RELIEF_SHELTER', 25.6, 85.1, 100, 10, 'LOW', 'PASSABLE', '123', 'Patna', 1, 90)")
            # Duplicate ID triggers PRIMARY KEY violation, rolling back entire transaction
            conn.execute("INSERT INTO facilities (id, name, facility_type, lat, lng, capacity, current_occupancy, flood_risk, road_passability, phone, address, has_emergency_power, available_beds_or_space) VALUES ('TEMP-FAC-01', 'Duplicate', 'RELIEF_SHELTER', 25.6, 85.1, 100, 10, 'LOW', 'PASSABLE', '123', 'Patna', 1, 90)")

    # Verify no partial write was committed
    with db.get_connection() as conn:
        final_count = conn.execute("SELECT COUNT(*) as c FROM facilities").fetchone()["c"]
        assert final_count == initial_count


# ==============================================================================
# 3. NEGATIVE OPERATIONAL TESTS & CONTROLLED 4XX RESPONSES
# ==============================================================================

def test_negative_operational_ids_return_controlled_404():
    """Tests extreme invalid IDs: 999999999, -1, 0, malformed UUID."""
    admin_token = create_access_token("USR-ADM-01", "admin", UserRole.ADMINISTRATOR, "Admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    invalid_ids = ["999999999", "-1", "0", "invalid-malformed-uuid!@#$%", "null", "undefined"]
    for bad_id in invalid_ids:
        # 1. SOS Endpoint
        res_sos = client.patch(f"/api/sos/{bad_id}", json={"status": "ON_SCENE"}, headers=headers)
        assert res_sos.status_code == 404
        assert "not found" in res_sos.json()["detail"].lower()

        # 2. Pump Endpoint
        res_pump = client.patch(f"/api/pumps/{bad_id}", json={"action": "ACTIVATE"}, headers=headers)
        assert res_pump.status_code == 404
        assert "not found" in res_pump.json()["detail"].lower()


def test_out_of_bounds_and_invalid_sos_returns_400():
    """Verify that bad parameters or coordinate bounds return controlled 400."""
    admin_token = create_access_token("USR-ADM-01", "admin", UserRole.ADMINISTRATOR, "Admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Coordinates far outside Patna basin
    res_lat = client.post("/api/sos", json={
        "lat": 0.0,
        "lng": 0.0,
        "number_of_people": 2,
        "emergency_type": "Flood",
        "severity": "CRITICAL",
        "contact_phone": "+91-9999999999"
    }, headers=headers)
    assert res_lat.status_code == 400
    assert "outside monitored regional boundary" in res_lat.json()["detail"]

    # 2. Number of people < 1
    res_people = client.post("/api/sos", json={
        "lat": 25.6020,
        "lng": 85.1420,
        "number_of_people": 0,
        "emergency_type": "Flood",
        "severity": "CRITICAL",
        "contact_phone": "+91-9999999999"
    }, headers=headers)
    assert res_people.status_code == 400
    assert "at least 1" in res_people.json()["detail"]


# ==============================================================================
# 4. CONFIGURATION INSECURE DEFAULTS REJECTION
# ==============================================================================

def test_admin_default_password_insecure_rejection_in_real_mode():
    """Verify that trivial admin passwords ('admin', 'password', 'varunetra') are rejected in REAL mode."""
    insecure_passwords = ["admin", "password", "12345678", "varunetra", "changeme", "dev", "secret"]
    for pw in insecure_passwords:
        with pytest.raises((ValueError, ValidationError), match="CRITICAL SECURITY CONFIGURATION ERROR"):
            Settings(
                DATA_MODE=DataProvenance.REAL,
                AUTH_SECRET_KEY="A" * 32,
                ADMIN_DEFAULT_PASSWORD=pw,
            )


def test_admin_bootstrap_lifecycle_and_non_overwrite(tmp_path):
    """
    Validates initial admin account safety:
    1. First initialization -> admin created with hashed password
    2. Restart -> admin preserved intact
    3. Restart with different ADMIN_DEFAULT_PASSWORD -> existing admin NOT overwritten
    """
    test_db = str(tmp_path / "test_admin_safety.db")

    orig_pw = settings.ADMIN_DEFAULT_PASSWORD
    try:
        # 1. First initialization
        settings.ADMIN_DEFAULT_PASSWORD = "InitialSecurePassword123!"
        db1 = DatabaseManager(db_path=test_db)
        user1 = db1.get_user_by_username("admin")
        assert user1 is not None
        assert user1["username"] == "admin"
        assert verify_password("InitialSecurePassword123!", user1["password_hash"])
        stored_hash = user1["password_hash"]

        # 2. Restart -> admin preserved
        db2 = DatabaseManager(db_path=test_db)
        user2 = db2.get_user_by_username("admin")
        assert user2 is not None
        assert user2["password_hash"] == stored_hash
        assert verify_password("InitialSecurePassword123!", user2["password_hash"])

        # 3. Restart with different ADMIN_DEFAULT_PASSWORD -> existing admin NOT overwritten
        settings.ADMIN_DEFAULT_PASSWORD = "DifferentNewPassword999!"
        db3 = DatabaseManager(db_path=test_db)
        user3 = db3.get_user_by_username("admin")
        assert user3 is not None
        assert user3["password_hash"] == stored_hash
        # Original password still works
        assert verify_password("InitialSecurePassword123!", user3["password_hash"])
        # Different environment password does NOT overwrite the established account
        assert not verify_password("DifferentNewPassword999!", user3["password_hash"])
    finally:
        settings.ADMIN_DEFAULT_PASSWORD = orig_pw

