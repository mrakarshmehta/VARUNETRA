"""
Nowcast and Inundation Schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.core.config import RiskLevel, RoadStatus, DataProvenance
from app.schemas.common import ProvenanceMeta, GeoJSONFeatureCollection


class InundationPrediction(BaseModel):
    zone_id: str
    zone_name: str
    catchment_id: str
    current_depth_cm: float
    predicted_depth_cm: float
    depth_band_min_cm: float
    depth_band_max_cm: float
    flood_probability: float = Field(..., ge=0.0, le=1.0)
    risk_level: RiskLevel
    uncertainty: str  # "Low", "Moderate", "High"
    confidence: float
    time_to_peak_min: int
    drainage_surcharge_prob: float
    primary_contributors: List[str]
    # Urban Terrain Coupling
    terrain_elevation_m: Optional[float] = None
    terrain_slope_deg: Optional[float] = None
    flow_accumulation_level: Optional[str] = None
    is_depression: Optional[bool] = None
    depression_depth_cm: Optional[float] = None
    flood_accumulation_potential: Optional[str] = None
    drainage_proximity_m: Optional[float] = None


class RoadImpact(BaseModel):
    road_id: str
    name: str
    status: RoadStatus
    predicted_depth_cm: float
    passable_pedestrian: bool
    passable_light: bool
    passable_heavy: bool
    passable_emergency: bool
    risk_level: RiskLevel
    speed_factor: float  # 1.0 = normal, 0.2 = crawling, 0.0 = blocked
    # Urban Terrain Coupling
    terrain_elevation_m: Optional[float] = None
    is_depression: Optional[bool] = None
    local_relief_m: Optional[float] = None
    flood_accumulation_potential: Optional[str] = None


class DrainageStress(BaseModel):
    node_or_pipe_id: str
    name: str
    type: str  # "manhole", "pipe", "outfall", "pump"
    capacity_utilization_pct: float
    surcharged: bool
    backflow_risk: bool
    blockage_pct: float
    water_level_m: float
    max_capacity_m3s: float
    current_flow_m3s: float


class NowcastTimeStep(BaseModel):
    step_index: int
    offset_minutes: int
    label: str  # "NOW", "+15 MIN", "+30 MIN", "+45 MIN", "+60 MIN", "+90 MIN", "+120 MIN", "+150 MIN", "+180 MIN"
    rainfall_rate_mmh: float
    accumulated_rainfall_mm: float
    average_flood_depth_cm: float
    max_flood_depth_cm: float
    active_inundation_area_sqkm: float
    high_risk_roads_count: int
    surcharged_drain_count: int
    critical_zones_count: int
    inundations: List[InundationPrediction]
    affected_roads: List[RoadImpact]
    drainage_stress: List[DrainageStress]
    geojson_inundation: Optional[GeoJSONFeatureCollection] = None


class NowcastSeriesResponse(BaseModel):
    provenance: ProvenanceMeta
    city: str
    generated_at: str
    lead_time_minutes: int = 180
    time_steps: List[NowcastTimeStep]
    model_version: str
    hydrodynamic_engine: str  # "Coupled 1D-2D DEM Drainage Hydraulic Layer v1.0"
    # Terrain Provenance & Validation Notice
    terrain_source: Optional[str] = "SYNTHETIC PILOT • PATNA URBAN BASIN"
    terrain_resolution: Optional[str] = "30m (Synthetic Grid Fallback)"
    terrain_validation_disclaimer: Optional[str] = (
        "Hydraulically modeled on Patna Urban Basin topography for MoES SIH26085. "
        "ML features calibrated on pilot synthetic terrain. Re-calibration required if switching to real high-res DEM."
    )
