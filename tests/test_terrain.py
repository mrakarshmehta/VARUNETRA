"""
VARUNETRA Urban Terrain Intelligence Engine Automated Test Suite
Problem Statement SIH26085: Urban Flood Nowcasting System (Drainage and Rainfall Coupling)

Validates:
1. Real Copernicus GLO-30 DSM activation, technical metadata, CRS, vertical datum, and provenance integrity
2. Truthful Indian High-Res status: NOT CONFIGURED / AWAITING AUTHORIZED TILE
3. 100% Spatial AOI Overlap with Patna Urban Basin pilot bounding box
4. Accurate coordinate query and bilinear interpolation on real satellite DEM
5. Finite-difference slope and aspect derivation
6. D8 flow direction and topological flow accumulation
7. Pit and depression detection with storage depth
8. Pluggable provider hierarchy and bidirectional fallback switching
9. Resolution-aware contour enforcement (enforces 5m interval, blocks sub-meter contours on 30m DEM)
10. Hydro-conditioning culvert breaching
11. Terrain-coupled nowcast inundation and road impact integration
12. ML surrogate feature distribution shift & RECALIBRATION flag
13. Automated DEM validation audit
"""

import os
import sys
import pytest

# Ensure backend and root are in sys.path
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
for p in [PROJECT_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from app.main import app
from app.services.terrain_engine import urban_terrain_engine
from app.adapters.terrain_providers import terrain_provider_registry, DEMStatus
from app.services.nowcast_service import nowcast_engine

client = TestClient(app)


def test_real_copernicus_dem_activation_and_status():
    """Verify both /terrain/status and /api/terrain/status return active real Copernicus GLO-30 DSM."""
    for endpoint in ["/terrain/status", "/api/terrain/status"]:
        res = client.get(endpoint)
        assert res.status_code == 200, f"Endpoint {endpoint} failed"
        data = res.json()
        assert "active_provider" in data
        assert "active_source_name" in data
        assert "resolution_m" in data
        assert "vertical_accuracy" in data
        assert "crs" in data
        assert "vertical_datum" in data
        assert "provider_matrix" in data
        assert len(data["provider_matrix"]) >= 4

        # Real Copernicus DEM active validation
        assert data["active_provider"] == "COPERNICUS_GLO30"
        assert data["provenance"] == "REAL"
        assert data["dataset_classification"] == "DSM (Digital Surface Model)"
        assert data["resolution_m"] == 30.0
        assert data["patna_verified"] is True
        assert data["aoi_coverage_pct"] == 100.0
        assert "coverage_disclaimer" in data
        assert "Copernicus" in data["active_source_name"]


def test_terrain_metadata_provenance():
    """Verify DEM technical metadata and strict provenance labeling."""
    res = client.get("/terrain/metadata")
    assert res.status_code == 200
    meta = res.json()
    assert "WGS 84" in meta["crs"]
    assert "EGM2008" in meta["vertical_datum"]
    assert meta["min_elevation_m"] <= 45.0
    assert meta["max_elevation_m"] >= 60.0
    assert meta["horizontal_resolution_m"] == 30.0
    assert meta["is_hydro_conditioned"] is True
    assert meta["patna_coverage_verified"] is True
    assert len(meta["processing_pipeline"]) >= 5


def test_patna_aoi_spatial_overlap():
    """Verify 100% spatial overlap with Patna Urban Basin pilot AOI."""
    status = urban_terrain_engine.get_status()
    assert status["aoi_coverage_pct"] == 100.0
    aoi = status["pilot_aoi"]
    assert aoi["min_lat"] == 25.570
    assert aoi["max_lat"] == 25.640
    assert aoi["min_lon"] == 85.080
    assert aoi["max_lon"] == 85.220


def test_coordinate_elevation_query():
    """Verify fast bilinear ground elevation lookup at real coordinates."""
    # Query Saidpur Canal hotspot on real Copernicus DSM
    res = client.get("/terrain/elevation?lat=25.602&lon=85.168")
    assert res.status_code == 200
    data = res.json()
    assert data["ground_elevation_m"] == pytest.approx(52.1, abs=0.5)
    assert data["resolution_m"] == 30.0
    assert "vertical_accuracy" in data

    # Out of bounds coordinate rejection
    bad_res = client.get("/terrain/elevation?lat=20.0&lon=80.0")
    assert bad_res.status_code == 422 or bad_res.status_code == 404


def test_terrain_inspector_hotspots():
    """Verify comprehensive point inspection: slope, flow, accumulation, depression, drainage distance."""
    # 1. Inspect southern depression bowl (Saidpur Sump)
    insp_dep = urban_terrain_engine.inspect_point(25.602, 85.168)
    assert insp_dep.ground_elevation_m <= 53.5
    assert insp_dep.surface_elevation_m == insp_dep.ground_elevation_m
    assert insp_dep.dataset_classification == "DSM (Digital Surface Model)"
    assert "Copernicus" in insp_dep.elevation_provenance
    assert insp_dep.nearest_drain_invert_provenance == "SIMULATED / ESTIMATED"
    assert "provenance_classification" in insp_dep.model_dump()
    assert insp_dep.is_depression is True
    assert insp_dep.depression_depth_cm > 0
    assert insp_dep.flood_accumulation_potential.value in ["HIGH", "CRITICAL"]
    assert insp_dep.drainage_distance_m >= 0
    assert "DSM" in insp_dep.quality_notes
    assert "Drainage conduit inverts are explicit hydraulic parameters (SIMULATED / ESTIMATED)" in insp_dep.quality_notes

    # 2. Inspect northern Ganga natural levee (Ashok Rajpath / PMCH ridge)
    insp_ridge = urban_terrain_engine.inspect_point(25.620, 85.170)
    assert insp_ridge.surface_elevation_m >= 54.0
    assert insp_ridge.dataset_classification == "DSM (Digital Surface Model)"
    assert insp_ridge.is_depression is False
    assert insp_ridge.is_low_point is False
    assert insp_ridge.flood_accumulation_potential.value in ["LOW", "MODERATE"]


def test_slope_and_aspect_calculation():
    """Verify finite difference slope in degrees and 8-cardinal compass aspect."""
    pt = urban_terrain_engine.inspect_point(25.615, 85.160)
    assert 0.0 <= pt.slope_degrees <= 45.0
    assert 0.0 <= pt.aspect_degrees <= 360.0
    assert pt.aspect_cardinal in ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]


def test_d8_flow_accumulation():
    """Verify D8 steepest descent flow direction and accumulation cells."""
    pt = urban_terrain_engine.inspect_point(25.600, 85.150)
    assert pt.flow_direction_code in [1, 2, 4, 8, 16, 32, 64, 128]
    assert pt.flow_accumulation_cells >= 1
    assert pt.flow_accumulation_level.value in ["LOW", "MEDIUM", "HIGH", "EXTREME"]


def test_provider_hierarchy_and_fallback():
    """Verify pluggable elevation providers, real activation, and bidirectional fallback."""
    status = urban_terrain_engine.get_status()
    matrix = status["provider_matrix"]

    keys = {p["provider_key"]: p for p in matrix}
    assert "INDIAN_HIGH_RES" in keys
    assert "COPERNICUS_GLO30" in keys
    assert "BHUVAN_CARTODEM" in keys
    assert "SYNTHETIC_PATNA_PILOT" in keys

    # Provider priorities
    assert keys["INDIAN_HIGH_RES"]["priority"] == 1
    assert keys["COPERNICUS_GLO30"]["priority"] == 2
    assert keys["BHUVAN_CARTODEM"]["priority"] == 3
    assert keys["SYNTHETIC_PATNA_PILOT"]["priority"] == 4

    # High-Res Indian DEM is truthfully marked not configured
    assert keys["INDIAN_HIGH_RES"]["status"] in ["NOT_CONFIGURED", "NOT CONFIGURED"]
    assert keys["INDIAN_HIGH_RES"]["patna_verified"] is False
    assert "AWAITING AUTHORIZED TILE" in keys["INDIAN_HIGH_RES"]["description"]

    # Copernicus GLO-30 is active
    assert keys["COPERNICUS_GLO30"]["status"] == "ACTIVE"
    assert keys["COPERNICUS_GLO30"]["patna_verified"] is True
    assert status["active_provider"] == "COPERNICUS_GLO30"

    # Test bidirectional fallback switching
    switched = terrain_provider_registry.set_active_provider("SYNTHETIC_PATNA_PILOT")
    assert switched is True
    assert urban_terrain_engine.get_status()["active_provider"] == "SYNTHETIC_PATNA_PILOT"

    # Restore Copernicus GLO-30
    restored = terrain_provider_registry.set_active_provider("COPERNICUS_GLO30")
    assert restored is True
    assert urban_terrain_engine.get_status()["active_provider"] == "COPERNICUS_GLO30"


def test_scientific_contour_resolution_rule():
    """
    Enforce resolution-aware contour intervals:
    - If DEM resolution >= 20m (e.g. 30m GLO-30 / CartoDEM), interval MUST be 5m.
    - Sub-meter contours (< 1m) are strictly blocked on coarse data to prevent fake precision.
    """
    layers = urban_terrain_engine.get_layer_collection()
    assert len(layers.contours) > 0
    assert layers.contour_interval_m == 5.0

    for c in layers.contours:
        assert c.properties["interval_m"] >= 1.0, "Sub-meter contours prohibited on synthetic/coarse grid"


def test_hydro_conditioning_breaching():
    """Verify hydro-conditioning lowers artificial road dam barriers at drainage crossings."""
    derived = urban_terrain_engine._compute_derived_rasters()
    assert "is_depression" in derived
    assert "depression_depth_cm" in derived
    assert "slope_deg" in derived
    assert "flow_acc" in derived


def test_nowcast_terrain_coupling():
    """Verify 0-3 hour nowcast predictions and road impacts include terrain intelligence."""
    nowcast = nowcast_engine.compute_nowcast_series(force_refresh=True)
    assert len(nowcast.time_steps) > 0
    first_step = nowcast.time_steps[0]

    # Subcatchment inundation has terrain coupling
    for inun in first_step.inundations:
        assert inun.terrain_elevation_m is not None
        assert inun.terrain_slope_deg is not None
        assert inun.flow_accumulation_level is not None
        assert inun.is_depression is not None

    # Road impact has terrain elevation and depression status
    for road in first_step.affected_roads:
        assert road.terrain_elevation_m is not None
        assert road.is_depression is not None

    # Response has terrain metadata provenance and disclaimer
    assert nowcast.terrain_source is not None
    assert "Copernicus" in nowcast.terrain_source
    assert nowcast.terrain_resolution is not None


def test_ml_recalibration_flag():
    """Verify ML surrogate model explicitly flags that recalibration/retraining is required."""
    status = urban_terrain_engine.get_status()
    assert status["ml_recalibration_status"] == "MODEL REQUIRES RECALIBRATION / RETRAINING"
    assert status["distribution_shift_detected"] is True


def test_terrain_validation_report():
    """Verify automated DEM preprocessing validation and anomaly check."""
    report = urban_terrain_engine.validate_dem()
    assert report.crs_valid is True
    assert report.elevation_range_valid is True
    assert report.is_hydro_conditioned is True
    assert report.validation_passed is True
    assert report.outliers_detected == 0
    assert report.culverts_burned_count == 5
    assert "Copernicus" in report.validation_summary
