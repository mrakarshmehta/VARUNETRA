"""
Routing Schemas for Flood-Aware Navigation
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.core.config import RoutingProfile, VehicleType, RiskLevel, RoadStatus
from app.schemas.common import ProvenanceMeta, GeoJSONGeometry


class RouteRequest(BaseModel):
    origin: List[float] = Field(..., description="[lat, lng] or [lng, lat]")
    destination: List[float] = Field(..., description="[lat, lng] or [lng, lat]")
    profile: RoutingProfile = RoutingProfile.SAFEST
    vehicle_type: VehicleType = VehicleType.LIGHT_VEHICLE
    departure_time_offset_min: int = 0
    allow_caution_roads: bool = True
    custom_thresholds: Optional[Dict[str, float]] = Field(
        None, description="Configurable operational threshold overrides {'caution': 0.12, 'restricted': 0.22, 'blocked': 0.35}"
    )


class HazardAvoided(BaseModel):
    segment_id: str
    road_name: str
    hazard_type: str  # "Deep Inundation", "Drainage Surcharge", "Manhole Overflow", "Structural Block"
    predicted_depth_cm: float
    reason: str


class RouteStep(BaseModel):
    instruction: str
    road_name: str
    distance_m: float
    duration_sec: float
    flood_depth_cm: float
    road_status: RoadStatus
    risk_level: RiskLevel
    operational_clearance_status: str = "Within configured operational clearance threshold"
    geometry_coords: List[List[float]]


class RouteAlternative(BaseModel):
    profile: RoutingProfile
    distance_km: float
    eta_minutes: float
    composite_risk: RiskLevel
    max_flood_depth_encountered_cm: float
    hazards_avoided_count: int
    geometry: GeoJSONGeometry
    summary: str


class RouteResponse(BaseModel):
    provenance: ProvenanceMeta
    profile_used: RoutingProfile
    vehicle_type: VehicleType
    distance_km: float
    eta_minutes: float
    composite_risk: RiskLevel
    max_flood_depth_encountered_cm: float
    is_fully_passable: bool
    policy_compliance_status: str = "Within configured operational clearance threshold"
    configured_safety_policy: Dict[str, float]
    avoided_hazards: List[HazardAvoided]
    flood_segments: List[Dict[str, Any]]
    decision_support_note: str  # Realistic guidance note without false absolute safety guarantees
    steps: List[RouteStep]
    geometry: GeoJSONGeometry
    alternatives: List[RouteAlternative] = []
