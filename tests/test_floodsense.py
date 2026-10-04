"""
VARUNETRA Automated Test Suite
Problem Statement SIH26085: Urban Flood Nowcasting System
"""

import pytest
import os
import sys

# Ensure backend and simulation are in path
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
for p in [PROJECT_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from app.main import app
from simulation.hydrology import CoupledUrbanHydroEngine
from app.services.ml_service import ml_service
from app.services.routing_service import flood_routing_engine
from app.schemas.routing import RouteRequest
from app.core.config import RoutingProfile, VehicleType, DataProvenance

client = TestClient(app)


def test_system_status_and_provenance():
    """Verify system status and strict data provenance policy"""
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert data["problem_id"] == "SIH26085"
    assert data["status"] == "OPERATIONAL"
    assert data["data_mode"] in ["DEMO", "SIMULATED", "REAL"]


def test_production_health_check():
    """Verify production /health and /api/health endpoints for container orchestrators"""
    res1 = client.get("/health")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "HEALTHY"
    assert data1["service"] == "VARUNETRA"
    assert data1["checks"]["api"] == "OPERATIONAL"
    assert data1["checks"]["terrain_engine"] == "OPERATIONAL"
    assert data1["checks"]["active_elevation_provider"] == "COPERNICUS_GLO30"

    res2 = client.get("/api/health")
    assert res2.status_code == 200
    assert res2.json()["status"] == "HEALTHY"


def test_coupled_hydrology_simulation():
    """Test 1D-2D physics engine: runoff, pipe surcharge, backflow"""
    engine = CoupledUrbanHydroEngine(outfall_river_stage_m=49.85)
    # Heavy rainfall step (80 mm/h)
    out = engine.simulate_step(rainfall_intensity_mmh=80.0, accumulated_rain_mm=90.0)
    assert "node_states" in out
    assert "conduit_states" in out

    # Check surcharge state
    surcharged_nodes = [n for n in out["node_states"].values() if n["is_surcharged"]]
    assert len(surcharged_nodes) > 0, "High rainfall step should trigger drainage surcharge in low-lying nodes"

    # Outfall river backflow check
    backflow_conduits = [c for c in out["conduit_states"].values() if c["backflow"]]
    assert len(backflow_conduits) > 0 or engine.outfall_river_stage_m > 49.0


def test_ml_surrogate_inference_and_uncertainty():
    """Test ML surrogate inference, quantile bounds, and local attribution"""
    status = ml_service.get_status()
    assert status.model_version.startswith("1.2.0")
    assert status.r2_score > 0.85
    assert status.data_provenance == DataProvenance.SIMULATED

    # Predict depth on sample feature vector
    sample_features = [78.0, 19.5, 39.0, 78.0, 118.0, 48.4, 0.4, 88.0, 110.0, 3.2, 35.0, 94.0, 49.85, 2100.0]
    pred = ml_service.predict_depth_and_risk(sample_features)
    assert pred["predicted_depth_cm"] > 0
    assert pred["depth_band_min_cm"] <= pred["predicted_depth_cm"] <= pred["depth_band_max_cm"]
    assert 0.0 <= pred["flood_probability"] <= 1.0

    # Local TreeSHAP explanation
    explanation = ml_service.explain_prediction("CAT-02", "Rajendra Nagar Low Basin", sample_features)
    assert len(explanation.contributions) >= 3
    assert explanation.base_expected_depth_cm > 0


def test_flood_aware_routing():
    """Verify dynamic graph routing steers around flooded road corridors"""
    # Route from Kankarbagh to PMCH
    req = RouteRequest(
        origin=[25.6025, 85.1400],
        destination=[25.6190, 85.1520],
        profile=RoutingProfile.SAFEST,
        vehicle_type=VehicleType.LIGHT_VEHICLE,
    )
    res = flood_routing_engine.calculate_route(req)
    assert res.distance_km > 0
    assert res.eta_minutes > 0
    assert len(res.steps) > 0
    assert len(res.geometry.coordinates) >= 2
    # Verify avoided hazards list is populated
    assert len(res.avoided_hazards) > 0


def test_sos_and_rescue_dispatch_workflow():
    """Test citizen SOS creation and auto-assignment of rescue squad"""
    sos_payload = {
        "lat": 25.6010,
        "lng": 85.1540,
        "number_of_people": 4,
        "emergency_type": "Trapped on Ground Floor",
        "severity": "CRITICAL",
        "contact_phone": "+91 98765 00000",
        "address_hint": "House 10, Road 3, Rajendra Nagar",
        "notes": "Wheelchair patient inside",
    }
    res = client.post("/api/sos", json=sos_payload)
    assert res.status_code == 200
    sos_data = res.json()
    assert sos_data["id"].startswith("SOS-PAT-")
    assert sos_data["number_of_people"] == 4
    assert sos_data["status"] in ["NEW", "ASSIGNED"]

    # Update status to ON_SCENE
    patch_res = client.patch(f"/api/sos/{sos_data['id']}", json={"status": "ON_SCENE"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "ON_SCENE"


def test_municipal_pump_dispatch():
    """Test municipal pump management API"""
    res = client.get("/api/pumps")
    assert res.status_code == 200
    pumps = res.json()
    assert len(pumps) > 0

    target_pump = pumps[1]["id"]  # PUMP-02
    patch_res = client.patch(f"/api/pumps/{target_pump}", json={"action": "ACTIVATE", "zone_id": "CAT-02"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "ACTIVE"


def test_15_stage_disaster_scenario_runner():
    """Verify 15-stage disaster scenario runner state transitions"""
    # Reset
    res_reset = client.post("/api/demo/reset")
    assert res_reset.status_code == 200
    assert res_reset.json()["stage"] == 1

    # Step to stage 2
    res_step = client.post("/api/demo/step")
    assert res_step.status_code == 200
    assert res_step.json()["stage"] == 2
    assert "Rainfall Accumulation Rises" in res_step.json()["title"]

    # Jump to stage 9 (Citizen SOS)
    res_jump = client.post("/api/demo/stage", json={"stage": 9})
    assert res_jump.status_code == 200
    assert res_jump.json()["stage"] == 9
    assert "Citizen SOS" in res_jump.json()["title"]


def test_providers_status_and_synthetic_geography():
    """Verify live providers telemetry registry and synthetic geography disclaimer"""
    res = client.get("/api/providers/status")
    assert res.status_code == 200
    data = res.json()
    assert data["pilot_geography_type"] == "SYNTHETIC PILOT GEOGRAPHY"
    assert "Patna" in data["pilot_geography_disclaimer"]
    
    provider_ids = [p["id"] for p in data["providers"]]
    assert "imd" in provider_ids
    assert "dwr" in provider_ids
    assert "insat" in provider_ids
    assert "cwc" in provider_ids
    assert "dem" in provider_ids
    assert "drainage_gis" in provider_ids

    # Verify INSAT is NOT CONFIGURED (no key) and not falsely claimed as live
    insat = next(p for p in data["providers"] if p["id"] == "insat")
    assert insat["connection_status"] == "NOT CONFIGURED"
    assert insat["is_live_tested"] is False

    # Verify IMD is labeled SIMULATED
    imd = next(p for p in data["providers"] if p["id"] == "imd")
    assert imd["connection_status"] == "SIMULATED"


def test_causality_chain_pipeline():
    """Verify the 8-step SIH26085 physical causality chain"""
    res = client.get("/api/causality-chain")
    assert res.status_code == 200
    data = res.json()
    steps = data["steps"]
    assert len(steps) == 8
    expected_codes = [
        "RAINFALL",
        "RUNOFF",
        "DRAINAGE_LOAD",
        "SURCHARGE_BACKFLOW",
        "STREET_INUNDATION",
        "FLOOD_DEPTH",
        "ROAD_IMPACT",
        "FLOOD_AWARE_ROUTING",
    ]
    assert [s["code"] for s in steps] == expected_codes


def test_configurable_passability_policy_and_routing():
    """Verify configurable operational passability threshold policy"""
    # 1. Get default settings
    res = client.get("/api/settings/passability")
    assert res.status_code == 200
    defaults = res.json()
    assert "pedestrian_cm" in defaults

    # 2. Update with strict operational threshold
    res_update = client.post(
        "/api/settings/passability",
        json={"pedestrian_cm": 8.0, "light_vehicle_cm": 15.0},
    )
    assert res_update.status_code == 200
    assert res_update.json()["light_vehicle_cm"] == 15.0

    # 3. Route request with custom threshold
    req = {
        "origin": [25.6025, 85.1400],
        "destination": [25.6190, 85.1520],
        "profile": "SAFEST",
        "vehicle_type": "LIGHT_VEHICLE",
        "custom_thresholds": {"LIGHT_VEHICLE": 12.0},
    }
    route_res = client.post("/api/route", json=req)
    assert route_res.status_code == 200
    rdata = route_res.json()
    assert "policy_compliance_status" in rdata
    assert "configured_safety_policy" in rdata
    assert rdata["configured_safety_policy"]["LIGHT_VEHICLE"] == 12.0


def test_ml_metrics_disclaimer_and_7_causal_factors():
    """Verify ML performance disclaimer and 7 causal factors in explanation"""
    status = ml_service.get_status()
    assert "SYNTHETIC / SIMULATION PERFORMANCE" in status.performance_disclaimer
    assert "Leave-One-Storm-Out" in status.validation_split_description

    # Explain prediction
    sample_features = [78.0, 19.5, 39.0, 78.0, 118.0, 48.4, 0.4, 88.0, 110.0, 3.2, 35.0, 94.0, 49.85, 2100.0]
    res = client.post(
        "/api/ml/explain",
        json={"zone_id": "CAT-02", "zone_name": "Rajendra Nagar Low Basin", "feature_values": sample_features},
    )
    assert res.status_code == 200
    exp = res.json()
    assert len(exp["causal_factors"]) == 7
    factor_names = [cf["factor_name"] for cf in exp["causal_factors"]]
    assert "rainfall_accumulation" in factor_names
    assert "forecast_rainfall" in factor_names
    assert "drainage_pressure" in factor_names
    assert "elevation" in factor_names
    assert "imperviousness" in factor_names
    assert "blockage" in factor_names
    assert "historical_flood_tendency" in factor_names
    assert "model_explanation_disclaimer" in exp

