"""
VARUNETRA — Terrain Intelligence Schemas
Pydantic data models for DEM ingestion, topographic indices, terrain inspection, and quality validation.
Problem Statement SIH26085: Urban Flood Nowcasting System
"""

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from .common import DataProvenance


class DEMSourceType(str, Enum):
    INDIAN_HIGH_RES = "INDIAN_HIGH_RES"      # Survey of India NHP / NMCG / LiDAR
    COPERNICUS_GLO30 = "COPERNICUS_GLO30"    # ESA Copernicus GLO-30 (30m)
    ALOS_AW3D30 = "ALOS_AW3D30"              # JAXA PRISM AW3D30 (30m)
    BHUVAN_CARTODEM = "BHUVAN_CARTODEM"      # ISRO CartoDEM (30m/10m)
    SYNTHETIC_PILOT = "SYNTHETIC_PILOT"      # Synthetic hydro-enforced Patna urban bowl


class DEMStatus(str, Enum):
    ACTIVE = "ACTIVE"
    AVAILABLE_UNVERIFIED = "AVAILABLE_UNVERIFIED"
    NOT_CONFIGURED = "NOT_CONFIGURED"
    FALLBACK_ACTIVE = "FALLBACK_ACTIVE"


class FlowAccumulationLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EXTREME = "EXTREME"


class FloodPotentialLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class DEMMetadata(BaseModel):
    provider_key: str
    source_name: str
    source_type: DEMSourceType
    horizontal_resolution_m: float
    vertical_accuracy_m: Optional[float] = None
    vertical_accuracy_description: str
    crs: str
    vertical_datum: str
    provenance: DataProvenance
    status: DEMStatus
    acquisition_date: Optional[str] = None
    production_date: Optional[str] = None
    licensing: str
    patna_coverage_verified: bool
    coverage_disclaimer: str
    min_elevation_m: float
    max_elevation_m: float
    mean_elevation_m: float
    nodata_value: Optional[float] = None
    is_hydro_conditioned: bool
    processing_pipeline: List[str]
    limitations_and_disclaimer: Optional[str] = None


class TerrainPointInspection(BaseModel):
    lat: float
    lon: float
    ground_elevation_m: float  # Maintained for backward compatibility
    surface_elevation_m: Optional[float] = None  # Explicit DSM surface elevation
    dataset_classification: str = "DSM (Digital Surface Model)"
    elevation_provenance: str = "REAL (Copernicus GLO-30)"
    local_relief_m: float
    slope_degrees: float
    aspect_degrees: float
    aspect_cardinal: str
    flow_direction_code: int
    flow_direction_cardinal: str
    flow_accumulation_cells: int
    flow_accumulation_level: FlowAccumulationLevel
    is_depression: bool
    is_low_point: bool = False
    depression_depth_cm: float
    drainage_distance_m: float
    nearest_drain_id: Optional[str] = None
    nearest_drain_name: Optional[str] = None
    nearest_drain_invert_m: Optional[float] = None
    nearest_drain_invert_provenance: str = "SIMULATED / ESTIMATED"
    nearest_drain_capacity_pct: Optional[float] = None
    hand_relative_m: float
    flood_accumulation_potential: FloodPotentialLevel
    source: DataProvenance
    provider_name: str
    resolution_m: float
    vertical_accuracy: str
    quality_notes: str
    limitations: str
    provenance_classification: Dict[str, str] = Field(default_factory=lambda: {
        "surface_elevation": "REAL (Copernicus GLO-30 DSM)",
        "slope": "DERIVED (Finite Differences)",
        "flow_direction": "DERIVED (D8 Steepest Descent)",
        "flow_accumulation": "DERIVED (Topological Accumulation)",
        "depression_depth": "DERIVED (Sink / Pit Detection)",
        "hand": "DERIVED (Height Above Nearest Drainage)",
        "drainage_proximity": "DERIVED (Spatial Euclidean)",
        "drainage_invert": "SIMULATED / ESTIMATED (Hydraulic Parameter)",
        "flood_accumulation_potential": "MODELLED / SIMULATED",
        "predicted_flood_depth": "SIMULATED (Nowcast Model)",
    })
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TerrainProviderInfo(BaseModel):
    provider_key: str
    display_name: str
    source_type: DEMSourceType
    priority: int
    status: DEMStatus
    provenance: DataProvenance
    resolution_m: float
    vertical_accuracy: str
    license_status: str
    patna_verified: bool
    is_active: bool
    description: str


class TerrainValidationReport(BaseModel):
    crs_valid: bool
    crs: str
    vertical_datum_check: bool
    vertical_datum: str
    nodata_count: int
    elevation_range_valid: bool
    min_elev_m: float
    max_elev_m: float
    spikes_outliers_detected: int
    hydro_conditioning_applied: bool
    is_hydro_conditioned: bool = True
    validation_passed: bool = True
    outliers_detected: int = 0
    culverts_burned_count: int
    pits_filled_count: int
    derived_alignment_valid: bool
    validation_status: str
    validation_summary: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TerrainLayerFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]


class TerrainLayerCollection(BaseModel):
    elevation_bands: List[TerrainLayerFeature]
    low_points: List[TerrainLayerFeature]
    depressions: List[TerrainLayerFeature]
    flow_paths: List[TerrainLayerFeature]
    contours: List[TerrainLayerFeature]
    contour_interval_m: float
    contour_resolution_warning: Optional[str] = None
    catchment_boundaries: List[TerrainLayerFeature]
    drainage_proximity_rings: List[TerrainLayerFeature]
    provenance: DataProvenance
    resolution_m: float
    source_name: str
