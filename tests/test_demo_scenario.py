"""
VARUNETRA / FloodSense — Automated End-to-End Operational Demo Scenario Tests
Verifies the complete deterministic workflow:
RAIN -> DETECT -> NOWCAST -> FLOOD RISK -> HOTSPOT -> ROAD IMPACT ->
SAFE ROUTE -> SOS -> RESCUE -> PUMP -> ALERT -> RECOVERY -> COMPLETE
"""

import os
import sys
import pytest
import asyncio

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
for p in [PROJECT_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings, DataProvenance, RiskLevel, UserRole
from app.core.auth import create_access_token
from app.services.scenario_service import (
    scenario_runner,
    SCENARIO_ID,
    SCENARIO_NAME,
    SCENARIO_MODE,
    SCENARIO_LABEL
)
from app.db.storage import db_manager

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_clean_demo_state():
    """Ensures each test begins with a clean baseline scenario state."""
    settings.DATA_MODE = DataProvenance.DEMO
    scenario_runner.reset(actor_id="TEST_FIXTURE", actor_role="ADMINISTRATOR", suppress_audit=True)
    yield
    scenario_runner.reset(actor_id="TEST_FIXTURE", actor_role="ADMINISTRATOR", suppress_audit=True)


def test_scenario_starts():
    """Verify scenario starts deterministically and advances to Stage 2 with convective forcing."""
    res = client.post("/api/demo/scenario/start")
    assert res.status_code == 200
    data = res.json()
    assert data["stage"] == 2
    assert data["scenario_id"] == SCENARIO_ID
    assert data["scenario_name"] == SCENARIO_NAME
    assert data["scenario_mode"] == SCENARIO_MODE
    assert data["scenario_label"] == SCENARIO_LABEL
    assert data["rainfall_rate_mmh"] > 0


def test_rainfall_updates():
    """Verify simulated rainfall progression across stages."""
    client.post("/api/demo/scenario/start")
    # Step into stage 3
    res_s3 = client.post("/api/demo/scenario/step")
    assert res_s3.status_code == 200
    data_s3 = res_s3.json()
    assert data_s3["stage"] == 3
    assert data_s3["rainfall_rate_mmh"] == 54.0
    assert data_s3["accumulated_rain_mm"] == 42.0


def test_nowcast_updates():
    """Verify nowcast updates: inundation expands and risk rises to CRITICAL."""
    # Jump to stage 6 (ML Surrogate alert & high probability)
    res = client.post("/api/demo/stage", json={"stage": 6})
    assert res.status_code == 200
    data = res.json()
    assert data["stage"] == 6
    assert data["max_depth_cm"] == 36.0
    assert data["flood_risk"] == "CRITICAL"
    assert data["inundation_area_km2"] > 5.0


def test_hotspot_generated():
    """Verify critical flood hotspot is detected in low-elevation depression zone."""
    res = client.post("/api/demo/stage", json={"stage": 7})
    assert res.status_code == 200
    data = res.json()
    assert data["stage"] == 7
    assert data["flood_risk"] == "CRITICAL"
    sit_board = client.get("/api/demo/scenario/situation-board").json()
    assert sit_board["hotspots_count"] >= 1


def test_road_hazard_generated():
    """Verify road segments are flagged UNSAFE / BLOCKED as water depth rises."""
    res = client.post("/api/demo/stage", json={"stage": 8})
    assert res.status_code == 200
    data = res.json()
    assert data["stage"] == 8
    assert data["active_road_status"] == "BLOCKED"
    sit_board = client.get("/api/demo/scenario/situation-board").json()
    assert sit_board["affected_roads_count"] >= 2


def test_safe_route_generated():
    """Verify dynamic route calculation adapts to flood conditions avoiding submerged links."""
    res = client.post("/api/demo/stage", json={"stage": 9})
    assert res.status_code == 200
    data = res.json()
    assert data["stage"] == 9
    assert "Dynamic Routes Recalculate" in data["title"]
    sit_board = client.get("/api/demo/scenario/situation-board").json()
    assert "ACTIVE" in sit_board["safe_route_status"]


def test_sos_created():
    """Verify simulated citizen SOS is generated and flagged in persistent operational storage."""
    res = client.post("/api/demo/stage", json={"stage": 10})
    assert res.status_code == 200
    data = res.json()
    assert data["stage"] == 10

    # Query SOS endpoint directly
    sos_res = client.get("/api/sos")
    assert sos_res.status_code == 200
    sos_items = sos_res.json()
    target_sos = next((s for s in sos_items if s["id"] == "SOS-PAT-901"), None)
    assert target_sos is not None
    assert target_sos["number_of_people"] == 12
    assert target_sos["severity"] == "CRITICAL"


def test_rescue_assignment():
    """Verify rescue team is dispatched to the simulated emergency incident."""
    res = client.post("/api/demo/stage", json={"stage": 11})
    assert res.status_code == 200
    data = res.json()
    assert data["stage"] == 11

    teams_res = client.get("/api/rescue-teams")
    assert teams_res.status_code == 200
    team_01 = next((t for t in teams_res.json() if t["id"] == "TEAM-01"), None)
    assert team_01 is not None
    assert team_01["status"] == "DISPATCHED"


def test_pump_dispatch():
    """Verify municipal dewatering pump is dispatched into active operation."""
    res = client.post("/api/demo/stage", json={"stage": 12})
    assert res.status_code == 200
    data = res.json()
    assert data["stage"] == 12

    pumps_res = client.get("/api/pumps")
    assert pumps_res.status_code == 200
    pump_01 = next((p for p in pumps_res.json() if p["id"] == "PUMP-01"), None)
    assert pump_01 is not None
    assert pump_01["status"] == "ACTIVE"


def test_alert_generated():
    """Verify coordinated emergency alert is issued and clearly labelled SIMULATION."""
    res = client.post("/api/demo/stage", json={"stage": 12})
    assert res.status_code == 200

    alerts_res = client.get("/api/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    sim_alert = next((a for a in alerts if "SIMULATION" in a["title"] or "ALT-SIM" in a["id"]), None)
    assert sim_alert is not None
    assert sim_alert["level"] == "CRITICAL"
    assert "SIMULATION" in sim_alert["message"]


def test_recovery_phase():
    """Verify floodwaters recede during response & recovery stage."""
    res = client.post("/api/demo/stage", json={"stage": 13})
    assert res.status_code == 200
    data = res.json()
    assert data["stage"] == 13
    assert data["rainfall_rate_mmh"] == 0.0
    assert data["max_depth_cm"] < 20.0
    assert data["flood_risk"] == "WATCH"


def test_scenario_completion():
    """Verify final outcome summary is compiled upon reaching stage 15."""
    res = client.post("/api/demo/stage", json={"stage": 15})
    assert res.status_code == 200

    summary_res = client.get("/api/demo/scenario/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["status"] == "INCIDENT RESOLVED — SIMULATED"
    assert summary["citizens_evacuated"] == 12
    assert summary["rescue_teams_dispatched"] == 1
    assert summary["pumps_dispatched"] == 1
    assert summary["safe_route_generated"] is True
    assert summary["emergency_alert_issued"] is True


def test_demo_reset():
    """Verify reset returns system to baseline System Normal without destroying tables."""
    client.post("/api/demo/scenario/start")
    client.post("/api/demo/stage", json={"stage": 12})

    # Reset
    res_reset = client.post("/api/demo/scenario/reset")
    assert res_reset.status_code == 200
    data = res_reset.json()
    assert data["stage"] == 1
    assert data["rainfall_rate_mmh"] == 0.0
    assert data["flood_risk"] == "LOW"

    # Verify tables still exist and pumps returned to STANDBY
    pumps_res = client.get("/api/pumps")
    assert pumps_res.status_code == 200
    pump_01 = next((p for p in pumps_res.json() if p["id"] == "PUMP-01"), None)
    assert pump_01["status"] in ["STANDBY", "AVAILABLE"]


def test_demo_cannot_run_in_real_mode():
    """Verify scenario start and step are strictly prohibited when DATA_MODE=REAL."""
    settings.DATA_MODE = DataProvenance.REAL
    token = create_access_token(user_id="admin", username="admin", role=UserRole.ADMINISTRATOR, full_name="Admin User")
    headers = {"Authorization": f"Bearer {token}"}

    res_start = client.post("/api/demo/scenario/start", headers=headers)
    assert res_start.status_code == 403
    assert "REAL provenance mode" in res_start.json()["detail"]

    res_step = client.post("/api/demo/scenario/step", headers=headers)
    assert res_step.status_code == 403

    res_reset = client.post("/api/demo/scenario/reset", headers=headers)
    assert res_reset.status_code == 403


def test_demo_does_not_bypass_rbac():
    """Verify citizen role cannot manipulate the scenario or dispatch resources."""
    citizen_token = create_access_token(user_id="cit-01", username="citizen_patna", role=UserRole.CITIZEN, full_name="Citizen")
    headers = {"Authorization": f"Bearer {citizen_token}"}

    res_start = client.post("/api/demo/scenario/start", headers=headers)
    assert res_start.status_code == 403

    res_step = client.post("/api/demo/scenario/step", headers=headers)
    assert res_step.status_code == 403

    res_reset = client.post("/api/demo/scenario/reset", headers=headers)
    assert res_reset.status_code == 403


def test_scenario_privileged_actions_are_audited():
    """Verify privileged scenario operations append immutable audit records."""
    client.post("/api/demo/scenario/start")
    client.post("/api/demo/stage", json={"stage": 12})

    with db_manager.get_connection() as conn:
        cur = conn.execute("SELECT * FROM audit_logs WHERE resource_id = ? OR resource_type = 'OPERATIONAL_SCENARIO'", (SCENARIO_ID,))
        records = cur.fetchall()
        assert len(records) > 0
        actions = [r["action"] for r in records]
        assert "SCENARIO_STARTED" in actions


def test_scenario_websocket_events():
    """Verify scenario controller broadcasts structured events to registered broadcaster."""
    captured_events = []

    async def mock_broadcaster(event: dict):
        captured_events.append(event)

    scenario_runner.set_broadcaster(mock_broadcaster)

    # Start scenario
    scenario_runner.start_scenario(actor_id="TEST_RUNNER", actor_role="ADMINISTRATOR")
    # Give event loop a cycle
    asyncio.run(asyncio.sleep(0.05))

    # Advance through stages
    scenario_runner.step_forward(actor_id="TEST_RUNNER", actor_role="ADMINISTRATOR")
    asyncio.run(asyncio.sleep(0.05))

    # Verify event types were emitted
    event_types = [e.get("type") for e in captured_events]
    assert "SCENARIO_STARTED" in event_types


def test_duplicate_start_is_safe():
    """Verify calling start multiple times is safe and maintains determinism."""
    res1 = client.post("/api/demo/scenario/start")
    assert res1.status_code == 200
    res2 = client.post("/api/demo/scenario/start")
    assert res2.status_code == 200
    assert res2.json()["stage"] == 2


def test_reset_stops_background_tasks():
    """Verify scenario reset terminates any running auto-timer tasks cleanly."""
    scenario_runner.toggle_auto_run()
    assert scenario_runner.is_auto_running is True

    scenario_runner.reset()
    assert scenario_runner.is_auto_running is False
    assert scenario_runner._auto_task is None


def test_stage_model_consistency():
    """Verify that all 15 internal stages map cleanly to 9 visible presentation phases."""
    from app.services.scenario_service import STAGES_DEFINITION

    assert len(STAGES_DEFINITION) == 15
    for i, s in enumerate(STAGES_DEFINITION):
        assert s["stage"] == i + 1
        assert "phase" in s
        assert 0 <= s["phase"] <= 8
        assert "PHASE" in s["operational_phase"]
        assert s["operational_phase"].startswith(f"PHASE {s['phase']}:")


def test_metric_provenance_and_sourcing():
    """Verify outcome metrics are explicitly sourced from system state and scenario configuration."""
    client.post("/api/demo/scenario/start")
    client.post("/api/demo/stage", json={"stage": 15})

    res = client.get("/api/demo/scenario/summary")
    assert res.status_code == 200
    summary = res.json()

    assert summary["source_provenance"] == "SCENARIO CONFIGURATION + OPERATIONAL API STATE"
    assert summary["peak_flood_risk"] == "CRITICAL"
    assert summary["peak_flood_depth_cm"] == 48.0
    assert summary["max_affected_area_km2"] == 8.6
    assert summary["unsafe_road_segments"] == 2
    assert summary["citizens_evacuated"] == 12
    assert summary["rescue_teams_dispatched"] == 1
    assert summary["pumps_dispatched"] == 1
    assert summary["terrain_provider"] == "COPERNICUS_GLO30"


def test_repeatability_deterministic_replay():
    """Verify that resetting and re-running produces the exact same deterministic values."""
    # Run 1
    client.post("/api/demo/scenario/start")
    r1_step = client.post("/api/demo/stage", json={"stage": 7}).json()
    r1_sum = client.get("/api/demo/scenario/situation-board").json()

    # Reset
    client.post("/api/demo/scenario/reset")

    # Run 2
    client.post("/api/demo/scenario/start")
    r2_step = client.post("/api/demo/stage", json={"stage": 7}).json()
    r2_sum = client.get("/api/demo/scenario/situation-board").json()

    assert r1_step["rainfall_rate_mmh"] == r2_step["rainfall_rate_mmh"] == 85.0
    assert r1_step["max_depth_cm"] == r2_step["max_depth_cm"] == 46.0
    assert r1_sum["risk"] == r2_sum["risk"] == "CRITICAL"
    assert r1_sum["hotspots_count"] == r2_sum["hotspots_count"] == 1


def test_double_start_is_strictly_idempotent():
    """Verify rapidly triggering start does not duplicate timeline events or corrupt state."""
    client.post("/api/demo/scenario/reset")
    res1 = client.post("/api/demo/scenario/start").json()
    res2 = client.post("/api/demo/scenario/start").json()
    res3 = client.post("/api/demo/scenario/start").json()

    assert res1["stage"] == res2["stage"] == res3["stage"] == 2
    # Verify timeline does not have duplicated SCENARIO_STARTED events
    timeline = client.get("/api/demo/scenario/timeline").json()
    start_events = [e for e in timeline if e["type"] == "SCENARIO_STARTED"]
    assert len(start_events) == 1

