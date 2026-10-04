"""
VARUNETRA REST & WebSocket API Endpoints
Problem Statement SIH26085: Urban Flood Nowcasting System
"""

import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect, Depends
from pydantic import BaseModel

from app.core.config import settings, DataProvenance, RiskLevel, RoadStatus, SOSStatus, PumpStatus, UserRole
from app.core.auth import (
    AuthUser,
    LoginRequest,
    DemoLoginRequest,
    TokenResponse,
    create_access_token,
    verify_password,
    get_current_user,
    get_optional_user,
    require_roles,
    get_current_user_with_mode,
    require_roles_with_mode,
    DEMO_ROLE_PROFILES,
)
from app.db.storage import db_manager
from app.adapters.providers import (
    RainfallProvider,
    WeatherProvider,
    RadarProvider,
    SatelliteProvider,
    DEMProvider,
    DrainageProvider,
    RiverStageProvider,
    RoadNetworkProvider,
    HistoricalFloodProvider,
    get_all_provider_statuses,
    rain_provider,
    weather_provider,
    radar_provider,
    satellite_provider,
    dem_provider,
    drainage_provider,
    river_provider,
    road_provider,
    historical_provider,
)
from app.services.nowcast_service import nowcast_engine
from app.services.ml_service import ml_service
from app.services.routing_service import flood_routing_engine
from app.services.operations_service import ops_manager
from app.services.scenario_service import scenario_runner
from app.schemas.nowcast import NowcastSeriesResponse
from app.schemas.routing import RouteRequest, RouteResponse
from app.schemas.operations import (
    SOSCreateRequest,
    SOSIncidentSchema,
    IncidentCreateRequest,
    IncidentReportSchema,
    RescueTeamSchema,
    ShelterHospitalSchema,
    MunicipalPumpSchema,
    PumpActionRequest,
    ReliefCampSchema,
    DamageReportSchema,
    AlertSchema,
)
from app.schemas.ml import MLModelStatus, FeatureImportanceItem, ExplainabilityResponse, MLPredictionDetail
from app.schemas.terrain import (
    DEMMetadata,
    TerrainPointInspection,
    TerrainLayerCollection,
    TerrainValidationReport,
)
from app.services.terrain_engine import urban_terrain_engine
from app.adapters.terrain_providers import terrain_provider_registry

router = APIRouter()

# --- Authentication & RBAC Router ---
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    """
    Production authentication endpoint.
    Verifies credentials and issues an HMAC-SHA256 signed bearer token.
    """
    user_rec = db_manager.get_user_by_username(req.username)
    if user_rec and verify_password(req.password, user_rec["password_hash"]):
        user = AuthUser(
            user_id=user_rec["user_id"],
            username=user_rec["username"],
            role=UserRole(user_rec["role"]),
            full_name=user_rec["full_name"],
            email=user_rec.get("email")
        )
        token = create_access_token(user.user_id, user.username, user.role, user.full_name)
        db_manager.log_audit_event(
            actor_id=user.user_id,
            actor_role=user.role.value,
            action="USER_LOGIN_SUCCESS",
            resource_type="AUTH",
            resource_id=user.user_id,
            details={"auth_method": "PBKDF2_PASSWORD"}
        )
        return TokenResponse(
            access_token=token,
            expires_in_seconds=settings.AUTH_TOKEN_EXPIRE_MINUTES * 60,
            user=user
        )

    db_manager.log_audit_event(
        actor_id="ANONYMOUS",
        actor_role="UNKNOWN",
        action="USER_LOGIN_FAILED",
        resource_type="AUTH",
        resource_id=req.username,
        details={"reason": "INVALID_CREDENTIALS"}
    )
    raise HTTPException(status_code=401, detail="Invalid username or password.")


@auth_router.post("/demo-login", response_model=TokenResponse)
def demo_login(req: DemoLoginRequest):
    """
    Rapid demonstration role acquisition.
    STRICT SECURITY BOUNDARY: ONLY permitted when DATA_MODE == DEMO.
    """
    if settings.DATA_MODE != DataProvenance.DEMO:
        raise HTTPException(
            status_code=403,
            detail="Demo login is strictly disabled in production/non-DEMO mode. Authenticate via /api/auth/login."
        )

    profile = DEMO_ROLE_PROFILES.get(req.role, {"name": f"Operator ({req.role.value})", "username": req.role.value.lower()})
    user = AuthUser(
        user_id=f"DEMO-{req.role.value}",
        username=profile["username"],
        role=req.role,
        full_name=profile["name"],
        email=f"{profile['username']}@varunetra.demo"
    )
    token = create_access_token(user.user_id, user.username, user.role, user.full_name)
    db_manager.log_audit_event(
        actor_id=user.user_id,
        actor_role=user.role.value,
        action="DEMO_LOGIN",
        resource_type="AUTH",
        resource_id=user.user_id,
        details={"role": req.role.value}
    )
    return TokenResponse(
        access_token=token,
        expires_in_seconds=settings.AUTH_TOKEN_EXPIRE_MINUTES * 60,
        user=user
    )


@auth_router.get("/me", response_model=AuthUser)
def get_current_user_profile(current_user: AuthUser = Depends(get_current_user_with_mode)):
    """Returns the authenticated profile of the current active session."""
    return current_user


router.include_router(auth_router)


# --- System Status & Explicit Provenance Declaration ---
@router.get("/status")
def get_system_status():
    return {
        "project": settings.PROJECT_NAME,
        "problem_id": settings.PROBLEM_STATEMENT_ID,
        "title": settings.PROBLEM_TITLE,
        "version": settings.VERSION,
        "data_mode": settings.DATA_MODE.value,
        "pilot_city": settings.PILOT_CITY,
        "pilot_geography_type": settings.PILOT_GEOGRAPHY_TYPE,
        "pilot_geography_disclaimer": settings.PILOT_GEOGRAPHY_DISCLAIMER,
        "center_coordinates": {"lat": settings.DEFAULT_LAT, "lng": settings.DEFAULT_LNG},
        "status": "OPERATIONAL",
        "hydrodynamic_coupling": "1D Stormwater Network + 2D Surface Inundation + ML Surrogate",
        "provenance_policy": "Explicit marking: REAL | SIMULATED | SYNTHETIC | DEMO | CACHED",
        "causality_pipeline": "RAINFALL -> RUNOFF -> DRAINAGE LOAD -> SURCHARGE / BACKFLOW -> STREET INUNDATION -> FLOOD DEPTH -> ROAD IMPACT -> FLOOD-AWARE ROUTING",
    }


# --- Live Providers Status ---
@router.get("/providers/status")
def get_providers_status():
    """
    Returns connection status for all 6 multi-source providers:
    IMD, DWR Radar, INSAT/MOSDAC, CWC, DEM, Drainage GIS.
    Values: CONNECTED | NOT CONFIGURED | CACHED | SIMULATED.
    """
    statuses = get_all_provider_statuses()
    return {
        "provenance": "SYSTEM AUDIT",
        "pilot_geography_type": settings.PILOT_GEOGRAPHY_TYPE,
        "pilot_geography_disclaimer": settings.PILOT_GEOGRAPHY_DISCLAIMER,
        "providers": statuses,
        "connected_count": sum(1 for p in statuses if p.get("connection_status") == "CONNECTED"),
        "simulated_count": sum(1 for p in statuses if p.get("connection_status") == "SIMULATED"),
        "synthetic_count": sum(1 for p in statuses if p.get("connection_status") == "SYNTHETIC"),
        "not_configured_count": sum(1 for p in statuses if p.get("connection_status") == "NOT CONFIGURED"),
        "total_providers": len(statuses),
        "live_credentials_verified": False,
        "notice": "Demonstrator running in simulation mode. No live government credentials are fabricated."
    }


# --- SIH26085 Physical Causality Chain ---
@router.get("/causality-chain")
def get_causality_chain():
    """
    Returns the real-time physical states across the 8-step SIH26085 pipeline:
    RAINFALL -> RUNOFF -> DRAINAGE LOAD -> SURCHARGE/BACKFLOW -> INUNDATION -> DEPTH -> ROAD IMPACT -> ROUTING
    """
    nowcast = nowcast_engine.compute_nowcast_series()
    step0 = nowcast.time_steps[0]
    drainage = nowcast_engine.hydro_engine

    total_runoff_rate = sum(c.compute_runoff_m3s(step0.rainfall_rate_mmh) for c in drainage.subcatchments.values())
    avg_load = sum(c.capacity_utilization_pct for c in step0.drainage_stress) / max(1, len(step0.drainage_stress))
    surcharged_count = sum(1 for c in step0.drainage_stress if c.surcharged)

    steps = [
        {
            "step_number": 1,
            "step_index": 1,
            "code": "RAINFALL",
            "name": "RAINFALL",
            "title": "Rainfall",
            "label": "Short-Burst Precipitation",
            "physical_dynamics": "Atmospheric precipitation hyetograph & convective cloudburst cells.",
            "surrogate_ml_proxy": "QPE radar reflectivity & temporal rainfall lags (15m, 30m, 60m).",
            "current_live_indicator": f"{step0.rainfall_rate_mmh} mm/h",
            "current_value": f"{step0.rainfall_rate_mmh} mm/h",
            "secondary_value": f"{step0.accumulated_rainfall_mm} mm 3h accum",
            "status": "ELEVATED" if step0.rainfall_rate_mmh > 40 else "NORMAL",
            "provenance": DataProvenance.SIMULATED.value,
            "description": "Precipitation forcing driving subcatchment surface accumulation.",
        },
        {
            "step_number": 2,
            "step_index": 2,
            "code": "RUNOFF",
            "name": "RUNOFF",
            "title": "Runoff",
            "label": "Subcatchment Inflow",
            "physical_dynamics": "Infiltration excess runoff computed via Rational method & impervious surface fractions.",
            "surrogate_ml_proxy": "Catchment area, imperviousness %, and slope factors.",
            "current_live_indicator": f"{round(total_runoff_rate, 2)} m³/s",
            "current_value": f"{round(total_runoff_rate, 2)} m³/s",
            "secondary_value": "Rational Model (C=0.85 avg)",
            "status": "SATURATED",
            "provenance": DataProvenance.SIMULATED.value,
            "description": "Urban impermeable surfaces generating high runoff fraction to storm inlets.",
        },
        {
            "step_number": 3,
            "step_index": 3,
            "code": "DRAINAGE_LOAD",
            "name": "DRAINAGE LOAD",
            "title": "Drainage Load",
            "label": "Stormwater Conduit Load",
            "physical_dynamics": "Subsurface conduit hydraulic gravity conveyance governed by Manning's equation.",
            "surrogate_ml_proxy": "Pipe capacity utilization %, diameter, and roughness coefficients.",
            "current_live_indicator": f"{round(avg_load, 1)}% Pipe Load",
            "current_value": f"{round(avg_load, 1)}%",
            "secondary_value": "Manning full-flow equation",
            "status": "CRITICAL" if avg_load > 90 else "HIGH",
            "provenance": DataProvenance.SIMULATED.value,
            "description": "Subsurface conduits conveying flow towards main canal trunks.",
        },
        {
            "step_number": 4,
            "step_index": 4,
            "code": "SURCHARGE_BACKFLOW",
            "name": "SURCHARGE / BACKFLOW",
            "title": "Surcharge / Backflow",
            "label": "Hydraulic Surcharge & Backwater",
            "physical_dynamics": "Piezometric head exceeds ground rim elevation and Ganga river stage impedes outfall.",
            "surrogate_ml_proxy": "Outfall stage, backpressure delta, and conduit silt blockage %.",
            "current_live_indicator": f"{surcharged_count} Nodes Surcharged",
            "current_value": f"{surcharged_count} nodes surcharging",
            "secondary_value": f"Ganga Stage {drainage.outfall_river_stage_m}m MSL",
            "status": "ACTIVE_BACKFLOW",
            "provenance": DataProvenance.SIMULATED.value,
            "description": "Downstream river head prevents gravity discharge; manholes overflow onto streets.",
        },
        {
            "step_number": 5,
            "step_index": 5,
            "code": "STREET_INUNDATION",
            "name": "STREET-LEVEL INUNDATION",
            "title": "Street Inundation",
            "label": "Street-Level Inundation",
            "physical_dynamics": "Excess stormwater fills 2D overland depressions and roadway corridors.",
            "surrogate_ml_proxy": "DEM elevation bowls, distance to outfall, and spatial topographic wetness.",
            "current_live_indicator": f"{step0.active_inundation_area_sqkm} km²",
            "current_value": f"{step0.active_inundation_area_sqkm} km²",
            "secondary_value": f"{step0.critical_zones_count} Critical Zones",
            "status": "EXPANDING",
            "provenance": DataProvenance.SIMULATED.value,
            "description": "Excess volume pools into low-lying topographic depressions.",
        },
        {
            "step_number": 6,
            "step_index": 6,
            "code": "FLOOD_DEPTH",
            "name": "FLOOD DEPTH",
            "title": "Flood Depth",
            "label": "Estimated Standing Depth",
            "physical_dynamics": "Ponded water depth distribution across road segments and residential parcels.",
            "surrogate_ml_proxy": "HistGradientBoosting regression depth with quantile uncertainty bounds.",
            "current_live_indicator": f"Max {step0.max_flood_depth_cm} cm",
            "current_value": f"Avg {step0.average_flood_depth_cm} cm",
            "secondary_value": f"Peak {step0.max_flood_depth_cm} cm (Uncertainty: Mod)",
            "status": "HAZARDOUS",
            "provenance": DataProvenance.SIMULATED.value,
            "description": "Continuous depth distribution with quantile prediction intervals (10-90%).",
        },
        {
            "step_number": 7,
            "step_index": 7,
            "code": "ROAD_IMPACT",
            "name": "ROAD IMPACT",
            "title": "Road Impact",
            "label": "Corridor Restriction",
            "physical_dynamics": "Submerged road segments evaluated against vehicle-specific operational passability thresholds.",
            "surrogate_ml_proxy": "Operational clearance policies: Pedestrian (15cm), Light (22cm), Heavy (45cm).",
            "current_live_indicator": f"{step0.high_risk_roads_count} Corridors Restricted",
            "current_value": f"{step0.high_risk_roads_count} Corridors Restricted",
            "secondary_value": "Evaluated vs Vehicle Clearance",
            "status": "RESTRICTED",
            "provenance": DataProvenance.SIMULATED.value,
            "description": "Passability policies filter light vehicles and pedestrians from deep water.",
        },
        {
            "step_number": 8,
            "step_index": 8,
            "code": "FLOOD_AWARE_ROUTING",
            "name": "FLOOD-AWARE ROUTING",
            "title": "Flood-Aware Routing",
            "label": "Dynamic Dijkstra Graph",
            "physical_dynamics": "Evacuation pathfinding dynamically recalculating road graph edge costs based on predicted depth.",
            "surrogate_ml_proxy": "Dynamic Dijkstra & multi-alternative routing bypassing restricted corridors.",
            "current_live_indicator": "Active Rerouting",
            "current_value": "Active Rerouting",
            "secondary_value": "Bypassing flooded hazards",
            "status": "OPTIMAL_CLEARANCE",
            "provenance": DataProvenance.SIMULATED.value,
            "description": "Real-time edge weight penalty steers evacuation along elevated ridge roads.",
        },
    ]

    return {
        "pipeline_name": "SIH26085 Physical Causality Pipeline",
        "sih_alignment": "RAINFALL -> RUNOFF -> DRAINAGE LOAD -> SURCHARGE / BACKFLOW -> STREET INUNDATION -> FLOOD DEPTH -> ROAD IMPACT -> FLOOD-AWARE ROUTING",
        "provenance": DataProvenance.SIMULATED.value,
        "steps": steps,
    }


# --- Configurable Operational Passability Policy ---
@router.get("/settings/passability")
def get_passability_policy():
    th = settings.PASSABILITY_THRESHOLDS
    return {
        "provenance": "CONFIGURED OPERATIONAL POLICY",
        "thresholds": th,
        "pedestrian_cm": round(th.get("PEDESTRIAN", {}).get("restricted", 0.15) * 100.0, 1),
        "light_vehicle_cm": round(th.get("LIGHT_VEHICLE", {}).get("restricted", 0.22) * 100.0, 1),
        "heavy_vehicle_cm": round(th.get("HEAVY_VEHICLE", {}).get("restricted", 0.45) * 100.0, 1),
        "emergency_vehicle_cm": round(th.get("EMERGENCY_RESCUE", {}).get("restricted", 0.75) * 100.0, 1),
        "disclaimer": "Thresholds represent operational heuristics for routing cost penalization, not an absolute guarantee."
    }


@router.post("/settings/passability")
def update_passability_policy(req: Dict[str, Any]):
    if "vehicle_type" in req:
        vt = req["vehicle_type"]
        if vt in settings.PASSABILITY_THRESHOLDS:
            settings.PASSABILITY_THRESHOLDS[vt] = {
                "caution": req.get("caution", 0.10),
                "restricted": req.get("restricted", 0.20),
                "blocked": req.get("blocked", 0.35),
            }
    if "pedestrian_cm" in req:
        settings.PASSABILITY_THRESHOLDS["PEDESTRIAN"]["restricted"] = req["pedestrian_cm"] / 100.0
    if "light_vehicle_cm" in req:
        settings.PASSABILITY_THRESHOLDS["LIGHT_VEHICLE"]["restricted"] = req["light_vehicle_cm"] / 100.0
    if "heavy_vehicle_cm" in req:
        settings.PASSABILITY_THRESHOLDS["HEAVY_VEHICLE"]["restricted"] = req["heavy_vehicle_cm"] / 100.0
    if "emergency_vehicle_cm" in req:
        settings.PASSABILITY_THRESHOLDS["EMERGENCY_RESCUE"]["restricted"] = req["emergency_vehicle_cm"] / 100.0

    return get_passability_policy()


# --- 0-3 Hour Nowcast ---
@router.get("/nowcast", response_model=NowcastSeriesResponse)
def get_nowcast_series(force_refresh: bool = False):
    return nowcast_engine.compute_nowcast_series(force_refresh=force_refresh)


# --- Rainfall & Hydro Telemetry ---
@router.get("/rainfall")
def get_rainfall_intelligence():
    return {
        "current_observation": rain_provider.get_current_rainfall(),
        "forecast_3h": rain_provider.get_rainfall_forecast_3h(),
        "weather_ambient": weather_provider.get_current_weather(),
        "radar_qpe": radar_provider.get_dwr_composite(),
        "satellite_qpe": satellite_provider.get_satellite_qpe(),
        "river_outfall_stage": river_provider.get_outfall_stage(),
    }


# --- Stormwater Drainage Network ---
@router.get("/drainage")
def get_drainage_network():
    engine = nowcast_engine.hydro_engine
    sim = engine.simulate_step(48.5, 48.5)
    
    nodes_out = []
    for nid, node in engine.nodes.items():
        st = sim["node_states"].get(nid, {})
        nodes_out.append({
            "node_id": node.node_id,
            "name": node.name,
            "node_type": node.node_type,
            "invert_elevation_m": node.invert_elevation_m,
            "rim_elevation_m": node.rim_elevation_m,
            "depth_m": round(node.rim_elevation_m - node.invert_elevation_m, 2),
            "water_elevation_m": st.get("water_elevation_m", node.invert_elevation_m),
            "surcharge_depth_m": st.get("surcharge_depth_m", 0.0),
            "is_surcharged": st.get("is_surcharged", False),
            "is_flooded": st.get("is_flooded", False),
            "ponding_depth_cm": st.get("ponding_depth_cm", 0.0),
            "lat": node.lat,
            "lng": node.lng,
        })

    conduits_out = []
    for cid, conduit in engine.conduits.items():
        c_st = sim["conduit_states"].get(cid, {})
        conduits_out.append({
            "conduit_id": conduit.conduit_id,
            "name": conduit.name,
            "conduit_type": conduit.conduit_type,
            "from_node": conduit.from_node,
            "to_node": conduit.to_node,
            "length_m": conduit.length_m,
            "diameter_or_width_m": conduit.diameter_or_width_m,
            "height_m": conduit.height_m,
            "slope_pct": round(conduit.slope * 100.0, 2),
            "manning_roughness": conduit.manning_n,
            "max_flow_m3s": c_st.get("capacity_m3s", 3.0),
            "current_flow_m3s": c_st.get("flow_m3s", 1.5),
            "capacity_utilization_pct": c_st.get("utilization_pct", 50.0),
            "flow_direction_reversed": c_st.get("backflow", False),
            "is_surcharged": c_st.get("surcharged", False),
            "blockage_pct": round(conduit.blockage_fraction * 100.0, 1),
            "coordinates": conduit.coordinates,
        })

    return {
        "provenance": drainage_provider.get_provenance("Coupled 1D Hydrodynamic Stormwater Model").dict(),
        "summary": {
            "total_nodes": len(nodes_out),
            "total_conduits": len(conduits_out),
            "total_network_length_km": round(sum(c["length_m"] for c in conduits_out) / 1000.0, 2),
            "average_utilization_pct": round(sum(c["capacity_utilization_pct"] for c in conduits_out) / max(1, len(conduits_out)), 1),
            "surcharged_nodes_count": sum(1 for n in nodes_out if n["is_surcharged"]),
            "backflow_conduits_count": sum(1 for c in conduits_out if c["flow_direction_reversed"]),
            "outfall_stage_m": engine.outfall_river_stage_m,
        },
        "nodes": nodes_out,
        "conduits": conduits_out,
    }


# --- Monitored Road Network ---
@router.get("/roads")
def get_monitored_roads():
    return {
        "provenance": road_provider.get_provenance("VARUNETRA Street-Level Inundation Assessment Layer").dict(),
        "roads": nowcast_engine.get_current_roads()
    }


# --- Routing API ---
@router.post("/route", response_model=RouteResponse)
def compute_flood_aware_route(req: RouteRequest):
    return flood_routing_engine.calculate_route(req)


@router.post("/evacuation-route", response_model=RouteResponse)
def compute_evacuation_route(req: RouteRequest):
    req.profile = "EVACUATION"
    return flood_routing_engine.calculate_route(req)


@router.post("/emergency-route", response_model=RouteResponse)
def compute_emergency_route(req: RouteRequest):
    req.profile = "EMERGENCY"
    return flood_routing_engine.calculate_route(req)


# --- Emergency Operations: SOS ---
@router.post("/sos", response_model=SOSIncidentSchema)
def submit_citizen_sos(
    req: SOSCreateRequest,
    current_user: Optional[AuthUser] = Depends(get_optional_user)
):
    if not (24.0 <= req.lat <= 27.0 and 84.0 <= req.lng <= 87.0):
        raise HTTPException(
            status_code=400,
            detail="SOS coordinates outside monitored regional boundary (24.0-27.0°N, 84.0-87.0°E)."
        )
    if req.number_of_people < 1:
        raise HTTPException(status_code=400, detail="Number of people must be at least 1.")

    incident = ops_manager.create_sos(req)
    actor_id = current_user.user_id if current_user else "CITIZEN_ANONYMOUS"
    actor_role = current_user.role.value if current_user else "CITIZEN"

    db_manager.log_audit_event(
        actor_id=actor_id,
        actor_role=actor_role,
        action="SOS_CREATED",
        resource_type="SOS_INCIDENT",
        resource_id=incident.id,
        details={"severity": req.severity.value, "people": req.number_of_people}
    )
    return incident


@router.get("/sos", response_model=List[SOSIncidentSchema])
def list_sos_incidents():
    return ops_manager.get_all_sos()


class SOSStatusUpdate(BaseModel):
    status: SOSStatus
    team_id: Optional[str] = None


@router.patch("/sos/{sos_id}", response_model=SOSIncidentSchema)
def update_sos(
    sos_id: str,
    payload: SOSStatusUpdate,
    current_user: AuthUser = Depends(require_roles_with_mode([
        UserRole.DISASTER_AUTHORITY,
        UserRole.RESCUE_TEAM,
        UserRole.ADMINISTRATOR
    ]))
):
    existing = ops_manager.get_sos_by_id(sos_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"SOS Incident '{sos_id}' not found.")

    if payload.team_id:
        teams = {t.id for t in ops_manager.get_all_rescue_teams()}
        if payload.team_id not in teams:
            raise HTTPException(status_code=404, detail=f"Rescue team '{payload.team_id}' not found.")

    inc = ops_manager.update_sos_status(sos_id, payload.status, payload.team_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"SOS Incident '{sos_id}' could not be updated.")

    db_manager.log_audit_event(
        actor_id=current_user.user_id,
        actor_role=current_user.role.value,
        action="SOS_STATUS_UPDATE",
        resource_type="SOS_INCIDENT",
        resource_id=sos_id,
        details={"status": payload.status.value, "assigned_team_id": payload.team_id}
    )
    return inc


# --- Incidents & Field Reports ---
@router.post("/incidents", response_model=IncidentReportSchema)
def report_field_incident(
    req: IncidentCreateRequest,
    current_user: Optional[AuthUser] = Depends(get_optional_user)
):
    if not (24.0 <= req.lat <= 27.0 and 84.0 <= req.lng <= 87.0):
        raise HTTPException(
            status_code=400,
            detail="Incident coordinates outside regional boundary."
        )

    inc = ops_manager.create_incident(req)
    actor_id = current_user.user_id if current_user else "FIELD_CITIZEN"
    actor_role = current_user.role.value if current_user else req.reported_by_role.value

    db_manager.log_audit_event(
        actor_id=actor_id,
        actor_role=actor_role,
        action="INCIDENT_REPORTED",
        resource_type="INCIDENT_REPORT",
        resource_id=inc.id,
        details={"category": req.category.value, "severity": req.severity.value}
    )
    return inc


@router.get("/incidents", response_model=List[IncidentReportSchema])
def list_field_incidents():
    return ops_manager.get_all_incidents()


# --- Rescue Teams ---
@router.get("/rescue-teams", response_model=List[RescueTeamSchema])
def list_rescue_teams():
    return ops_manager.get_all_rescue_teams()


# --- Shelters & Hospitals ---
@router.get("/facilities", response_model=List[ShelterHospitalSchema])
def list_shelters_and_hospitals():
    return ops_manager.get_all_facilities()


# --- Municipal Pumps & Dewatering ---
@router.get("/pumps", response_model=List[MunicipalPumpSchema])
def list_municipal_pumps():
    return ops_manager.get_all_pumps()


@router.patch("/pumps/{pump_id}", response_model=MunicipalPumpSchema)
def manage_pump(
    pump_id: str,
    req: PumpActionRequest,
    current_user: AuthUser = Depends(require_roles_with_mode([
        UserRole.MUNICIPAL_OFFICER,
        UserRole.DISASTER_AUTHORITY,
        UserRole.ADMINISTRATOR
    ]))
):
    pump = ops_manager.get_pump_by_id(pump_id)
    if not pump:
        raise HTTPException(status_code=404, detail=f"Municipal pump '{pump_id}' not found.")

    if pump.status == PumpStatus.UNAVAILABLE and req.action in ["ACTIVATE", "DISPATCH"]:
        raise HTTPException(
            status_code=400,
            detail=f"Pump '{pump_id}' is marked UNAVAILABLE for maintenance."
        )

    updated_pump = ops_manager.update_pump(pump_id, req)
    db_manager.log_audit_event(
        actor_id=current_user.user_id,
        actor_role=current_user.role.value,
        action="PUMP_MANAGEMENT_ACTION",
        resource_type="MUNICIPAL_PUMP",
        resource_id=pump_id,
        details={"action": req.action, "new_status": updated_pump.status.value if updated_pump else None}
    )
    return updated_pump


# --- Relief Camps ---
@router.get("/relief", response_model=List[ReliefCampSchema])
def list_relief_camps():
    return ops_manager.get_all_relief_camps()


# --- Post-Flood Damage Assessment ---
@router.get("/damage", response_model=List[DamageReportSchema])
def list_damage_reports():
    return ops_manager.get_all_damage_reports()


# --- Official Alerts & Advisories ---
@router.get("/alerts", response_model=List[AlertSchema])
def list_alerts():
    return ops_manager.get_all_alerts()


# --- Machine Learning Center ---
@router.get("/ml/status", response_model=MLModelStatus)
def get_ml_status():
    return ml_service.get_status()


@router.get("/ml/feature-importance")
def get_feature_importance():
    status = ml_service.get_status()
    meta = ml_service.metadata or {}
    return {
        "model_version": status.model_version,
        "provenance": DataProvenance.SIMULATED.value,
        "features": meta.get("global_feature_importance", [])
    }


class ExplainRequest(BaseModel):
    zone_id: str = "CAT-02"
    zone_name: str = "Rajendra Nagar Low Basin"
    feature_values: Optional[List[float]] = None


@router.post("/ml/explain", response_model=MLPredictionDetail)
def explain_ml_prediction(req: ExplainRequest):
    f_vals = req.feature_values or [
        78.0, 19.5, 39.0, 78.0, 118.0, 48.4, 0.4, 88.0, 110.0, 3.2, 35.0, 96.0, 49.85, 2100.0
    ]
    return ml_service.explain_prediction(req.zone_id, req.zone_name, f_vals)


# --- 15-Stage Disaster Scenario Runner ---
@router.get("/demo/stage")
def get_scenario_stage():
    return scenario_runner.get_current_stage()


@router.get("/demo/scenario/status")
def get_scenario_status():
    """Returns the complete scenario status including timeline, situation board, and active stage."""
    return scenario_runner.get_current_stage()


@router.get("/demo/scenario/situation-board")
def get_scenario_situation_board():
    """Returns the live unified operational situation board."""
    return scenario_runner.get_situation_board()


@router.get("/demo/scenario/summary")
def get_scenario_outcome_summary():
    """Returns the outcome metrics demonstrating the complete decision-support loop."""
    return scenario_runner.get_outcome_summary()


@router.get("/demo/scenario/timeline")
def get_scenario_timeline():
    """Returns the live event timeline with demo clock timestamps."""
    return scenario_runner.get_timeline()


class SetStageRequest(BaseModel):
    stage: int


@router.post("/demo/stage")
def set_scenario_stage(
    req: SetStageRequest,
    current_user: AuthUser = Depends(require_roles_with_mode([
        UserRole.ADMINISTRATOR,
        UserRole.DISASTER_AUTHORITY
    ]))
):
    if settings.DATA_MODE == DataProvenance.REAL:
        raise HTTPException(
            status_code=403,
            detail="Scenario manipulation is strictly prohibited in REAL provenance mode."
        )
    return scenario_runner.set_stage(req.stage, actor_id=current_user.user_id, actor_role=current_user.role.value)


@router.post("/demo/scenario/start")
def start_emergency_scenario(
    current_user: AuthUser = Depends(require_roles_with_mode([
        UserRole.ADMINISTRATOR,
        UserRole.DISASTER_AUTHORITY
    ]))
):
    """Starts the named operational demo scenario (Patna Urban Basin — Extreme Rainfall Emergency)."""
    if settings.DATA_MODE == DataProvenance.REAL:
        raise HTTPException(
            status_code=403,
            detail="Scenario manipulation is strictly prohibited in REAL provenance mode."
        )
    return scenario_runner.start_scenario(actor_id=current_user.user_id, actor_role=current_user.role.value)


@router.post("/demo/step")
def step_scenario_stage(
    current_user: AuthUser = Depends(require_roles_with_mode([
        UserRole.ADMINISTRATOR,
        UserRole.DISASTER_AUTHORITY
    ]))
):
    if settings.DATA_MODE == DataProvenance.REAL:
        raise HTTPException(
            status_code=403,
            detail="Scenario manipulation is strictly prohibited in REAL provenance mode."
        )
    return scenario_runner.step_forward(actor_id=current_user.user_id, actor_role=current_user.role.value)


@router.post("/demo/scenario/step")
def step_scenario_named(
    current_user: AuthUser = Depends(require_roles_with_mode([
        UserRole.ADMINISTRATOR,
        UserRole.DISASTER_AUTHORITY
    ]))
):
    if settings.DATA_MODE == DataProvenance.REAL:
        raise HTTPException(
            status_code=403,
            detail="Scenario manipulation is strictly prohibited in REAL provenance mode."
        )
    return scenario_runner.step_forward(actor_id=current_user.user_id, actor_role=current_user.role.value)


@router.post("/demo/reset")
def reset_scenario(
    current_user: AuthUser = Depends(require_roles_with_mode([
        UserRole.ADMINISTRATOR,
        UserRole.DISASTER_AUTHORITY
    ]))
):
    if settings.DATA_MODE == DataProvenance.REAL:
        raise HTTPException(
            status_code=403,
            detail="Scenario manipulation is strictly prohibited in REAL provenance mode."
        )
    return scenario_runner.reset(actor_id=current_user.user_id, actor_role=current_user.role.value)


@router.post("/demo/scenario/reset")
def reset_scenario_named(
    current_user: AuthUser = Depends(require_roles_with_mode([
        UserRole.ADMINISTRATOR,
        UserRole.DISASTER_AUTHORITY
    ]))
):
    if settings.DATA_MODE == DataProvenance.REAL:
        raise HTTPException(
            status_code=403,
            detail="Scenario manipulation is strictly prohibited in REAL provenance mode."
        )
    return scenario_runner.reset(actor_id=current_user.user_id, actor_role=current_user.role.value)


@router.post("/demo/toggle-auto")
def toggle_scenario_auto(
    current_user: AuthUser = Depends(require_roles_with_mode([
        UserRole.ADMINISTRATOR,
        UserRole.DISASTER_AUTHORITY
    ]))
):
    if settings.DATA_MODE == DataProvenance.REAL:
        raise HTTPException(
            status_code=403,
            detail="Scenario manipulation is strictly prohibited in REAL provenance mode."
        )
    return scenario_runner.toggle_auto_run()


@router.post("/demo/scenario/toggle-auto")
def toggle_scenario_auto_named(
    current_user: AuthUser = Depends(require_roles_with_mode([
        UserRole.ADMINISTRATOR,
        UserRole.DISASTER_AUTHORITY
    ]))
):
    if settings.DATA_MODE == DataProvenance.REAL:
        raise HTTPException(
            status_code=403,
            detail="Scenario manipulation is strictly prohibited in REAL provenance mode."
        )
    return scenario_runner.toggle_auto_run()


# --- Urban Terrain Intelligence Engine Endpoints ---
terrain_router = APIRouter(tags=["terrain"])


@terrain_router.get("/status")
def get_terrain_status():
    """Returns terrain provider status matrix, active source, resolution, and accuracy."""
    return urban_terrain_engine.get_status()


@terrain_router.get("/metadata", response_model=DEMMetadata)
def get_terrain_metadata():
    """Returns technical metadata for the active DEM dataset."""
    return urban_terrain_engine.get_metadata()


@terrain_router.get("/elevation")
def get_terrain_elevation(
    lat: float = Query(..., ge=24.0, le=27.0, description="Latitude in decimal degrees"),
    lon: float = Query(..., ge=84.0, le=87.0, description="Longitude in decimal degrees")
):
    """Fast ground elevation lookup (meters MSL) via bilinear interpolation."""
    ready, msg = urban_terrain_engine.is_ready()
    if not ready and settings.DATA_MODE == DataProvenance.REAL:
        raise HTTPException(
            status_code=503,
            detail=f"Terrain service fail-closed in REAL mode: {msg}"
        )

    prov = terrain_provider_registry.get_active_provider()
    if not prov:
        raise HTTPException(status_code=503, detail="No active terrain provider configured.")

    elev = prov.get_elevation_at_point(lat, lon)
    if elev is None:
        raise HTTPException(status_code=404, detail="Coordinate is outside active DEM bounds.")
    meta = prov.get_metadata()
    return {
        "lat": round(lat, 5),
        "lon": round(lon, 5),
        "ground_elevation_m": elev,
        "source": meta.source_name,
        "provenance": meta.provenance.value,
        "resolution_m": meta.horizontal_resolution_m,
        "vertical_accuracy": meta.vertical_accuracy_description,
    }


@terrain_router.get("/derived")
def get_terrain_derived(
    lat: float = Query(..., ge=24.0, le=27.0),
    lon: float = Query(..., ge=84.0, le=87.0)
):
    """Returns derived topographic indices: slope, aspect, D8 flow, accumulation, depressions."""
    inspection = urban_terrain_engine.inspect_point(lat, lon)
    return {
        "lat": inspection.lat,
        "lon": inspection.lon,
        "ground_elevation_m": inspection.ground_elevation_m,
        "slope_degrees": inspection.slope_degrees,
        "aspect_degrees": inspection.aspect_degrees,
        "aspect_cardinal": inspection.aspect_cardinal,
        "flow_direction": inspection.flow_direction_cardinal,
        "flow_accumulation_cells": inspection.flow_accumulation_cells,
        "flow_accumulation_level": inspection.flow_accumulation_level.value,
        "is_depression": inspection.is_depression,
        "depression_depth_cm": inspection.depression_depth_cm,
        "hand_relative_m": inspection.hand_relative_m,
        "flood_accumulation_potential": inspection.flood_accumulation_potential.value,
    }


@terrain_router.get("/inspector", response_model=TerrainPointInspection)
def inspect_terrain_point(
    lat: float = Query(..., ge=24.0, le=27.0),
    lon: float = Query(..., ge=84.0, le=87.0)
):
    """Comprehensive point inspection with zero fake precision and transparent limitations."""
    ready, msg = urban_terrain_engine.is_ready()
    if not ready and settings.DATA_MODE == DataProvenance.REAL:
        raise HTTPException(
            status_code=503,
            detail=f"Terrain inspection fail-closed in REAL mode: {msg}"
        )
    return urban_terrain_engine.inspect_point(lat, lon)


@terrain_router.get("/layers", response_model=TerrainLayerCollection)
def get_terrain_layers():
    """Returns GeoJSON terrain layers (elevation bands, low points, depressions, flow paths, contours)."""
    return urban_terrain_engine.get_layer_collection()


@terrain_router.get("/validation", response_model=TerrainValidationReport)
def get_terrain_validation():
    """Runs automated DEM preprocessing validation and outlier check."""
    return urban_terrain_engine.validate_dem()


class TerrainImportRequest(BaseModel):
    provider_key: str


@terrain_router.post("/import")
def set_active_terrain_provider(
    req: TerrainImportRequest,
    current_user: AuthUser = Depends(require_roles_with_mode([
        UserRole.ADMINISTRATOR,
        UserRole.DISASTER_AUTHORITY
    ]))
):
    """Configures or switches the active terrain provider in the registry (restricted to Admin/DMA)."""
    if settings.DATA_MODE == DataProvenance.REAL and req.provider_key == "SYNTHETIC_PATNA_PILOT":
        raise HTTPException(
            status_code=403,
            detail="Prohibited action: Cannot switch to synthetic terrain provider when DATA_MODE is REAL."
        )

    success = terrain_provider_registry.set_active_provider(req.provider_key)
    if not success:
        raise HTTPException(
            status_code=400,
            detail=f"Provider '{req.provider_key}' could not be activated or is not configured."
        )

    db_manager.log_audit_event(
        actor_id=current_user.user_id,
        actor_role=current_user.role.value,
        action="TERRAIN_PROVIDER_SWITCH",
        resource_type="TERRAIN_PROVIDER",
        resource_id=req.provider_key,
        details={"status": "ACTIVATED"}
    )
    return urban_terrain_engine.get_status()


# Mount terrain_router inside api_router under /terrain
router.include_router(terrain_router, prefix="/terrain")

