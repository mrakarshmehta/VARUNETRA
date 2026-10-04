"""
VARUNETRA / FloodSense — Production UX & Reliability Regression Tests
Verifies:
1. DEMO vs REAL mode visibility and safety gates
2. System status telemetry and health semantics
3. Double-start protection and idempotency
4. Clean scenario reset and state integrity
5. Operator action auditing and confirmation safety
6. Real-mode fail-closed terrain safety
7. Structured error handling for operational resources
"""

import os
import sys
import pytest

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
for p in [PROJECT_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings, DataProvenance, RiskLevel
from app.services.scenario_service import (
    scenario_runner,
    SCENARIO_ID,
    SCENARIO_NAME,
    SCENARIO_MODE,
    SCENARIO_LABEL,
)
from app.db.storage import db_manager

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_test_environment():
    """Ensure every test runs in a clean, baseline state."""
    settings.DATA_MODE = DataProvenance.DEMO
    scenario_runner.reset(actor_id="TEST_RUNNER", actor_role="ADMINISTRATOR", suppress_audit=True)
    yield
    settings.DATA_MODE = DataProvenance.DEMO
    scenario_runner.reset(actor_id="TEST_RUNNER", actor_role="ADMINISTRATOR", suppress_audit=True)


from app.core.auth import create_access_token, UserRole

def test_demo_vs_real_mode_visibility_and_safety():
    """Verify that in DEMO mode the simulation label is active and in REAL mode demo controls fail closed."""
    # In DEMO mode:
    res = client.get("/api/demo/scenario/status")
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_mode"] == SCENARIO_MODE
    assert data["scenario_label"] == "SIMULATION"
    assert data["data_mode"] == "DEMO"

    # In REAL mode:
    settings.DATA_MODE = DataProvenance.REAL
    try:
        start_res = client.post("/api/demo/scenario/start")
        # REAL mode rejects demo execution (401 without auth or 403/400 with auth)
        assert start_res.status_code in [400, 401, 403]
    finally:
        settings.DATA_MODE = DataProvenance.DEMO


def test_system_status_matrix_integrity():
    """Verify system health, live telemetry, and Copernicus GLO-30 DSM provenance fields."""
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    h_data = health_res.json()
    assert h_data["status"].upper() == "HEALTHY"
    assert "checks" in h_data
    assert h_data["checks"]["terrain_engine"] == "OPERATIONAL"
    assert h_data["checks"]["active_elevation_provider"] == "COPERNICUS_GLO30"

    status_res = client.get("/api/demo/scenario/status")
    assert status_res.status_code == 200
    s_data = status_res.json()
    assert s_data["terrain_provider"] == "COPERNICUS_GLO30"


def test_double_start_protection_and_idempotency():
    """Rapid repeated start requests should be safe and idempotent."""
    res1 = client.post("/api/demo/scenario/start")
    assert res1.status_code == 200
    assert res1.json()["stage"] == 2

    # Second concurrent or duplicate click:
    res2 = client.post("/api/demo/scenario/start")
    assert res2.status_code == 200
    assert res2.json()["stage"] == 2


def test_scenario_reset_state_integrity():
    """Traverse stages, then execute reset. Verify all operational parameters return to baseline."""
    client.post("/api/demo/scenario/start")
    for _ in range(5):
        client.post("/api/demo/scenario/step")

    mid_res = client.get("/api/demo/scenario/status")
    assert mid_res.json()["stage"] > 2

    reset_res = client.post("/api/demo/scenario/reset")
    assert reset_res.status_code == 200
    r_data = reset_res.json()
    assert r_data["stage"] == 1
    assert r_data["rainfall_rate_mmh"] == 0.0
    assert r_data["drainage_load_pct"] == 25.0
    assert r_data["flood_risk"] == "LOW"
    assert r_data["active_road_status"] == "OPEN"
    assert r_data["is_auto_running"] is False


def test_operator_action_feedback_and_audit():
    """Verify that operator actions generate structured confirmation responses and audit trails."""
    admin_token = create_access_token("ADM-01", "admin", UserRole.ADMINISTRATOR, "Admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create SOS
    sos_res = client.post(
        "/api/sos",
        json={
            "lat": 25.601,
            "lng": 85.153,
            "number_of_people": 4,
            "emergency_type": "Water Entering Ground Floor",
            "severity": "CRITICAL",
            "contact_phone": "+91 98765 00000",
            "address_hint": "Rajendra Nagar Road 2",
            "notes": "Medical evacuation needed",
        },
        headers=headers,
    )
    assert sos_res.status_code == 200
    sos_data = sos_res.json()
    assert "id" in sos_data

    # Audit log check
    with db_manager.get_connection() as conn:
        cur = conn.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 10")
        rows = cur.fetchall()
        assert len(rows) > 0


def test_critical_terrain_failure_safety_in_real_mode():
    """Verify that in REAL mode, attempting to force synthetic fallback terrain is rejected."""
    settings.DATA_MODE = DataProvenance.REAL
    try:
        admin_token = create_access_token("ADM-01", "admin", UserRole.ADMINISTRATOR, "Admin")
        headers = {"Authorization": f"Bearer {admin_token}"}
        switch_res = client.post(
            "/api/terrain/import",
            json={"provider_key": "SYNTHETIC_PATNA_PILOT"},
            headers=headers,
        )
        assert switch_res.status_code in [400, 403]
    finally:
        settings.DATA_MODE = DataProvenance.DEMO


def test_structured_error_responses_for_missing_resources():
    """Verify that non-existent pumps, incidents, or routes return clean HTTP 404 rather than unhandled 500."""
    admin_token = create_access_token("ADM-01", "admin", UserRole.ADMINISTRATOR, "Admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    res_pump = client.patch(
        "/api/pumps/PUMP-NONEXISTENT-999",
        json={"action": "ACTIVATE"},
        headers=headers,
    )
    assert res_pump.status_code == 404
    detail = res_pump.json().get("detail", "")
    assert "not found" in detail.lower()

    res_sos = client.patch(
        "/api/sos/SOS-NONEXISTENT-999",
        json={"status": "ON_SCENE"},
        headers=headers,
    )
    assert res_sos.status_code == 404

