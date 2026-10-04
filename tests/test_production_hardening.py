"""
VARUNETRA — Production Hardening & Deployment Readiness Regression Tests
Problem Statement SIH26085: Urban Flood Nowcasting System

Validates:
1. Production authentication boundary and token signing
2. Unauthorized role escalation prevention (zero assertions)
3. Demo login isolation behind DATA_MODE=DEMO
4. Missing secret configuration validation
5. Multi-worker execution protection (WORKERS=1 enforced)
6. Production CORS allowlist enforcement
7. Database restart safety & idempotent reference data
8. REAL mode fail-closed terrain behavior
9. Synthetic provider switch rejection in REAL mode
10. Health/live and Health/ready separate semantics
11. Operational error handling (missing IDs, invalid transitions)
12. Audit logging for administrative actions
"""

import os
import sys
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
from app.core.auth import create_access_token, verify_token, DEMO_ROLE_PROFILES
from app.db.storage import DatabaseManager
from app.services.operations_service import OperationsManager
from app.adapters.terrain_providers import TerrainProviderRegistry, DEMStatus
from app.services.terrain_engine import UrbanTerrainEngine


client = TestClient(app)


def test_production_auth_missing_secret_failure():
    """Validates that non-DEMO mode refuses startup without a high-entropy AUTH_SECRET_KEY."""
    # 1. Missing secret in REAL mode
    with pytest.raises((ValueError, ValidationError), match="CRITICAL SECURITY CONFIGURATION ERROR"):
        Settings(
            DATA_MODE=DataProvenance.REAL,
            AUTH_SECRET_KEY=None,
        )

    # 2. Insecure / short secret in REAL mode
    with pytest.raises((ValueError, ValidationError), match="AUTH_SECRET_KEY must be set to a high-entropy string"):
        Settings(
            DATA_MODE=DataProvenance.REAL,
            AUTH_SECRET_KEY="dev",
        )


def test_multi_worker_protection():
    """Enforces WORKERS=1 requirement while runtime state is process-local."""
    with pytest.raises((ValueError, ValidationError), match="CRITICAL RUNTIME ERROR: WORKERS=2 is not supported"):
        Settings(
            WORKERS=2,
            DATA_MODE=DataProvenance.DEMO,
        )


def test_cors_wildcard_production_rejection():
    """Ensures wildcard '*' CORS is strictly rejected in non-DEMO environments."""
    with pytest.raises((ValueError, ValidationError), match="Wildcard '\\*' in BACKEND_CORS_ORIGINS is prohibited"):
        Settings(
            DATA_MODE=DataProvenance.REAL,
            AUTH_SECRET_KEY="A" * 32,
            BACKEND_CORS_ORIGINS=["*"],
        )


def test_auth_login_and_token_generation():
    """Tests production login endpoint and JWT token generation."""
    # Valid admin credentials
    res = client.post("/api/auth/login", json={"username": "admin", "password": "Varunetra@MoES2026!"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMINISTRATOR"

    # Verify token payload
    payload = verify_token(data["access_token"])
    assert payload.role == UserRole.ADMINISTRATOR
    assert payload.username == "admin"

    # Invalid credentials
    res_bad = client.post("/api/auth/login", json={"username": "admin", "password": "wrong_password"})
    assert res_bad.status_code == 401
    assert "Invalid username" in res_bad.json()["detail"]


def test_demo_login_isolated_to_demo_mode():
    """Validates that demo login is only available in DEMO mode and rejected in REAL mode."""
    orig_mode = settings.DATA_MODE
    try:
        # 1. Allowed in DEMO mode
        settings.DATA_MODE = DataProvenance.DEMO
        res_demo = client.post("/api/auth/demo-login", json={"role": "DISASTER_AUTHORITY"})
        assert res_demo.status_code == 200
        assert res_demo.json()["user"]["role"] == "DISASTER_AUTHORITY"

        # 2. Strictly forbidden in REAL mode
        settings.DATA_MODE = DataProvenance.REAL
        res_real = client.post("/api/auth/demo-login", json={"role": "DISASTER_AUTHORITY"})
        assert res_real.status_code == 403
        assert "Demo login is strictly disabled in production" in res_real.json()["detail"]
    finally:
        settings.DATA_MODE = orig_mode


def test_unauthorized_role_escalation_prevented():
    """Validates that a low-privilege token cannot execute administrative operations."""
    # Citizen token
    citizen_token = create_access_token(
        user_id="CITIZEN-001",
        username="citizen_test",
        role=UserRole.CITIZEN,
        full_name="Test Citizen"
    )

    # Attempt to switch terrain provider using Citizen token
    headers = {"Authorization": f"Bearer {citizen_token}"}
    res = client.post("/api/terrain/import", json={"provider_key": "COPERNICUS_GLO30"}, headers=headers)
    assert res.status_code == 403
    assert "Access forbidden: User role 'CITIZEN' lacks required privilege" in res.json()["detail"]


def test_restart_safe_database_preserves_records(tmp_path):
    """Proves application restart preserves SOS incidents and operational state without reset."""
    test_db = str(tmp_path / "test_restart_safety.db")
    db1 = DatabaseManager(db_path=test_db)
    ops1 = OperationsManager(db=db1)

    # Create an SOS ticket in instance 1
    from app.schemas.operations import SOSCreateRequest
    req = SOSCreateRequest(
        lat=25.6050,
        lng=85.1420,
        number_of_people=3,
        emergency_type="Elderly medical evacuation",
        severity=RiskLevel.HIGH,
        contact_phone="+91-9988776655",
        address_hint="Gandhi Maidan Gate 4",
        notes="Requires oxygen concentrator support",
    )
    created = ops1.create_sos(req)
    created_id = created.id

    # Simulate restart by creating instance 2 on the exact same database
    db2 = DatabaseManager(db_path=test_db)
    ops2 = OperationsManager(db=db2)

    # Verify created record survived restart with full data integrity
    survived = ops2.get_sos_by_id(created_id)
    assert survived is not None
    assert survived.id == created_id
    assert survived.number_of_people == 3
    assert survived.contact_phone == "+91-9988776655"
    assert survived.address_hint == "Gandhi Maidan Gate 4"


def test_reference_entities_idempotent_seeding(tmp_path):
    """Verifies that database startup does not duplicate pumps or facilities."""
    test_db = str(tmp_path / "test_idempotent_seeding.db")
    db1 = DatabaseManager(db_path=test_db)
    ops1 = OperationsManager(db=db1)

    initial_pumps = len(ops1.get_all_pumps())
    initial_facs = len(ops1.get_all_facilities())
    initial_teams = len(ops1.get_all_rescue_teams())

    # Simulate 3 restarts
    for _ in range(3):
        db_restart = DatabaseManager(db_path=test_db)
        ops_restart = OperationsManager(db=db_restart)
        assert len(ops_restart.get_all_pumps()) == initial_pumps
        assert len(ops_restart.get_all_facilities()) == initial_facs
        assert len(ops_restart.get_all_rescue_teams()) == initial_teams


def test_real_mode_fail_closed_terrain():
    """Verifies that in REAL mode, missing authoritative DEM fails closed without synthetic fallback."""
    orig_mode = settings.DATA_MODE
    try:
        settings.DATA_MODE = DataProvenance.REAL
        reg = TerrainProviderRegistry()

        # In REAL mode, if no real DEM is present, provider is UNAVAILABLE
        # Simulate unconfigured real providers
        for p in reg.providers.values():
            if p.provider_key != "SYNTHETIC_PATNA_PILOT":
                p._tile_loaded = False

        active_key = reg._resolve_active_provider()
        assert active_key == "UNAVAILABLE"
        assert active_key != "SYNTHETIC_PATNA_PILOT"

        # Switching to synthetic pilot in REAL mode must be rejected
        switch_res = reg.set_active_provider("SYNTHETIC_PATNA_PILOT")
        assert switch_res is False
    finally:
        settings.DATA_MODE = orig_mode


def test_synthetic_provider_switch_rejected_in_real_mode():
    """Tests that API endpoint /api/terrain/import rejects synthetic pilot in REAL mode."""
    orig_mode = settings.DATA_MODE
    try:
        settings.DATA_MODE = DataProvenance.REAL
        admin_token = create_access_token(
            user_id="ADMIN-01",
            username="admin",
            role=UserRole.ADMINISTRATOR,
            full_name="Admin"
        )
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = client.post(
            "/api/terrain/import",
            json={"provider_key": "SYNTHETIC_PATNA_PILOT"},
            headers=headers
        )
        assert res.status_code == 403
        assert "Cannot switch to synthetic terrain provider when DATA_MODE is REAL" in res.json()["detail"]
    finally:
        settings.DATA_MODE = orig_mode


def test_health_live_and_ready_semantics():
    """Tests separate liveness and readiness probe semantics."""
    # 1. Liveness
    res_live = client.get("/health/live")
    assert res_live.status_code == 200
    data_live = res_live.json()
    assert data_live["status"] == "ALIVE"
    assert data_live["service"] == "VARUNETRA"

    # 2. Readiness
    res_ready = client.get("/health/ready")
    assert res_ready.status_code == 200
    data_ready = res_ready.json()
    assert data_ready["status"] == "READY"
    assert data_ready["dependencies"]["database"]["status"] == "OPERATIONAL"
    assert data_ready["dependencies"]["terrain_engine"]["ready"] is True
    assert data_ready["dependencies"]["worker_runtime_safety"]["supported"] is True


def test_operational_error_handling_and_invalid_ids():
    """Verifies that invalid operational inputs return controlled 4xx errors instead of 500s."""
    admin_token = create_access_token("ADM-01", "admin", UserRole.ADMINISTRATOR, "Admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Non-existent SOS ID
    res_sos = client.patch(
        "/api/sos/SOS-NONEXISTENT-999",
        json={"status": "ON_SCENE"},
        headers=headers
    )
    assert res_sos.status_code == 404
    assert "not found" in res_sos.json()["detail"]

    # 2. Assigning non-existent rescue team
    sos_list = client.get("/api/sos").json()
    target_sos = sos_list[0]["id"]
    res_team = client.patch(
        f"/api/sos/{target_sos}",
        json={"status": "ASSIGNED", "team_id": "TEAM-DOES-NOT-EXIST"},
        headers=headers
    )
    assert res_team.status_code == 404
    assert "Rescue team 'TEAM-DOES-NOT-EXIST' not found" in res_team.json()["detail"]

    # 3. Non-existent pump ID
    res_pump = client.patch(
        "/api/pumps/PUMP-NONEXISTENT-999",
        json={"action": "ACTIVATE"},
        headers=headers
    )
    assert res_pump.status_code == 404
    assert "not found" in res_pump.json()["detail"]

    # 4. Out of bounds SOS coordinates
    res_coord = client.post(
        "/api/sos",
        json={
            "lat": 10.0,
            "lng": 10.0,
            "number_of_people": 2,
            "emergency_type": "Flood",
            "severity": "CRITICAL",
            "contact_phone": "+91-9999999999",
        },
        headers=headers
    )
    assert res_coord.status_code == 400
    assert "outside monitored regional boundary" in res_coord.json()["detail"]


def test_audit_logging_on_sensitive_actions():
    """Validates that sensitive administrative and operational updates record audit logs."""
    from app.db.storage import db_manager

    admin_token = create_access_token("ADM-01", "admin", UserRole.ADMINISTRATOR, "Admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Execute an operational update
    client.post(
        "/api/terrain/import",
        json={"provider_key": "COPERNICUS_GLO30"},
        headers=headers
    )

    # Verify entry in audit_logs table
    with db_manager.get_connection() as conn:
        cur = conn.execute("SELECT * FROM audit_logs WHERE action = 'TERRAIN_PROVIDER_SWITCH' ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        assert row is not None
        assert row["actor_id"] == "ADM-01"
        assert row["actor_role"] == "ADMINISTRATOR"
        assert row["resource_id"] == "COPERNICUS_GLO30"
