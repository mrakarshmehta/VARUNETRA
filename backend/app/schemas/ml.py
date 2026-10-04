"""
Machine Learning Schemas: Model Metadata, Metrics, Explainability, and Provenance
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.core.config import DataProvenance, RiskLevel
from app.schemas.common import ProvenanceMeta


class FeatureImportanceItem(BaseModel):
    feature_name: str
    display_name: str
    importance: float
    category: str  # "Meteorological", "Drainage", "Terrain", "Topological"
    description: str


class LocalFeatureContribution(BaseModel):
    feature_name: str
    feature_value: float
    contribution_cm: float  # +ve increases predicted flood depth, -ve decreases
    display_text: str


class CausalFactor(BaseModel):
    factor_name: str
    display_name: Optional[str] = None
    factor_type: Optional[str] = None
    observed_value: Optional[str] = None
    value: Optional[str] = None
    impact_level: Optional[str] = None
    impact: Optional[str] = None
    contribution_pct: Optional[int] = 20
    description: str


class MLPredictionDetail(BaseModel):
    zone_id: str
    zone_name: str
    timestamp: str
    data_mode: DataProvenance
    predicted_depth_cm: float
    depth_band: str  # e.g. "12.0 - 28.5 cm"
    uncertainty: str  # "Low", "Moderate", "High"
    confidence_score: float  # 0.0 - 1.0
    risk_level: RiskLevel
    base_expected_depth_cm: float
    contributions: List[LocalFeatureContribution]
    causal_factors: List[CausalFactor] = []
    reasoning_summary: str
    explanation_disclaimer: str = "Surrogate Feature Attribution (Model Interpretation, Not Calibrated Hydraulic Ground Truth)"
    model_explanation_disclaimer: str = "Surrogate Feature Attribution (Model Interpretation, Not Physical Hydraulic Certainty)"
    uncertainty_disclaimer: str = "Model estimate with quantile prediction interval. Physical accuracy subject to DEM and sensor limits."


class MLModelStatus(BaseModel):
    model_name: str = "VARUNETRA Coupled Hydro-Surrogate v1.2"
    model_version: str = "1.2.0-rf-histgbm"
    dataset_version: str = "SYNTH-PATNA-HYDRO-2026-v1"
    training_mode: str = "PHYSICAL-SIMULATION-DERIVED-SURROGATE"
    data_provenance: DataProvenance = DataProvenance.SIMULATED
    dataset_provenance: str = "SYNTHETIC 1D-2D HYDRODYNAMIC SCENARIOS"
    training_timestamp: str
    validation_method: str = "Chronological Event Split (Leave-One-Hydro-Event-Out)"
    validation_split_description: str = "Chronological Event Split (Events 0-47 Train, Events 48-59 Holdout Evaluation)"
    performance_disclaimer: str = "SYNTHETIC / SIMULATION PERFORMANCE — NOT REAL-WORLD VALIDATION"
    is_real_world_calibrated: bool = False
    calibration_notice: str = "Trained on physically consistent 1D-2D drainage hydrodynamic simulation runs. Ready to integrate certified MoES rain-gauge & telemetry loggers."
    feature_count: int
    features: List[str]
    inference_latency_ms: float
    
    # Classification Metrics (Inundation Threshold > 10cm)
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    false_alarm_rate: float
    
    # Regression Metrics (Depth in cm)
    mae_cm: float
    rmse_cm: float
    r2_score: float
    
    # Spatial Metrics
    iou_spatial: float
    spatial_f1: float
    
    # Operational Metrics
    alert_lead_time_minutes: int = 180
    recalculation_latency_ms: float = 18.5


class ExplainabilityResponse(BaseModel):
    provenance: ProvenanceMeta
    model_version: str
    global_feature_importance: List[FeatureImportanceItem]
    sample_local_explanations: List[MLPredictionDetail]
