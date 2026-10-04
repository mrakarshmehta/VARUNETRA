"""
Drainage Network Schemas: Nodes, Conduits, Surcharges, and Hydraulics
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.schemas.common import ProvenanceMeta, GeoJSONFeatureCollection


class DrainageNodeSchema(BaseModel):
    node_id: str
    name: str
    node_type: str  # "manhole", "inlet", "junction", "pump_sump", "outfall"
    invert_elevation_m: float
    rim_elevation_m: float
    depth_m: float
    water_elevation_m: float
    surcharge_depth_m: float
    is_surcharged: bool
    is_flooded: bool
    ponding_volume_m3: float
    blockage_factor: float = Field(0.0, ge=0.0, le=1.0)
    lat: float
    lng: float


class DrainageConduitSchema(BaseModel):
    conduit_id: str
    name: str
    conduit_type: str  # "circular_pipe", "box_culvert", "open_channel", "trunk_drain"
    from_node: str
    to_node: str
    length_m: float
    diameter_or_width_m: float
    height_m: Optional[float] = None
    slope_pct: float
    manning_roughness: float
    max_flow_m3s: float
    current_flow_m3s: float
    capacity_utilization_pct: float
    flow_direction_reversed: bool = False  # Backflow indicator
    is_choked_or_blocked: bool = False
    blockage_pct: float = 0.0
    coordinates: List[List[float]]  # [[lng, lat], [lng, lat], ...]


class DrainageNetworkSummary(BaseModel):
    total_nodes: int
    total_conduits: int
    total_network_length_km: float
    average_utilization_pct: float
    surcharged_nodes_count: int
    backflow_conduits_count: int
    choked_conduits_count: int
    critical_outfall_stage_m: float
    outfall_backpressure_status: str  # "Normal", "Tide/River High", "Severe Backflow"


class DrainageNetworkResponse(BaseModel):
    provenance: ProvenanceMeta
    summary: DrainageNetworkSummary
    nodes: List[DrainageNodeSchema]
    conduits: List[DrainageConduitSchema]
    geojson_network: Optional[GeoJSONFeatureCollection] = None
