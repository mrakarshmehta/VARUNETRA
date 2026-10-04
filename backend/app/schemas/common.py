"""
Common schemas and GeoJSON models for VARUNETRA
"""

from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field
from app.core.config import DataProvenance, RiskLevel


class ProvenanceMeta(BaseModel):
    data_mode: DataProvenance = Field(..., description="Data provenance mode: REAL, SIMULATED, SYNTHETIC, DEMO")
    source: str = Field(..., description="Adapter or source name")
    freshness_seconds: int = Field(0, description="Age of data in seconds")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    is_real_world_verified: bool = Field(False, description="Explicit flag: never fake real-world verification")
    notes: Optional[str] = None


class GeoJSONGeometry(BaseModel):
    type: str  # Point, LineString, Polygon, MultiPolygon
    coordinates: Any


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: Optional[Union[str, int]] = None
    geometry: GeoJSONGeometry
    properties: Dict[str, Any] = {}


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
    metadata: Optional[Dict[str, Any]] = None
