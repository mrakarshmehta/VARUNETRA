export type DataProvenance = "REAL" | "SIMULATED" | "SYNTHETIC" | "DEMO" | "CACHED";
export type RiskLevel = "SAFE" | "WARNING" | "HIGH" | "CRITICAL";
export type RoadStatus = "OPEN" | "CAUTION" | "RESTRICTED" | "BLOCKED";
export type RoutingProfile = "FASTEST" | "SAFEST" | "EMERGENCY" | "EVACUATION";
export type VehicleType = "PEDESTRIAN" | "LIGHT_VEHICLE" | "HEAVY_VEHICLE" | "EMERGENCY_RESCUE";
export type SOSStatus = "NEW" | "ACKNOWLEDGED" | "ASSIGNED" | "EN_ROUTE" | "ON_SCENE" | "RESCUED" | "CLOSED" | "RECEIVED" | "VERIFIED" | "DISPATCHED" | "IN_TRANSIT" | "RESOLVED";
export type PumpStatus = "AVAILABLE" | "RESERVED" | "DISPATCHED" | "EN_ROUTE" | "ACTIVE" | "PUMPING" | "UNAVAILABLE";

export type ProviderConnectionStatus = "CONNECTED" | "NOT CONFIGURED" | "CACHED" | "SIMULATED";

export interface ProviderStatus {
  id: string;
  name: string;
  category: string;
  connection_status: ProviderConnectionStatus;
  provenance: DataProvenance;
  last_sync: string;
  endpoint_or_source: string;
  is_live_tested: boolean;
  notes: string;
}

export interface ProviderStatusSummary {
  pilot_geography_type: string;
  pilot_geography_disclaimer: string;
  connected_count: number;
  simulated_count: number;
  synthetic_count: number;
  not_configured_count: number;
  total_providers: number;
  providers: ProviderStatus[];
}

export interface CausalityStep {
  step_number: number;
  code: string;
  title: string;
  physical_dynamics: string;
  surrogate_ml_proxy: string;
  current_live_indicator: string;
  status: "NORMAL" | "WARNING" | "CRITICAL";
  provenance: DataProvenance;
}

export interface CausalityChainResponse {
  pipeline_name: string;
  sih_alignment: string;
  provenance: DataProvenance;
  steps: CausalityStep[];
}

export interface PassabilityPolicy {
  pedestrian_cm: number;
  light_vehicle_cm: number;
  heavy_vehicle_cm: number;
  emergency_vehicle_cm: number;
  disclaimer: string;
}

export type UserRole = 
  | "CITIZEN"
  | "DISASTER_AUTHORITY"
  | "MUNICIPAL_OFFICER"
  | "RESCUE_TEAM"
  | "FIELD_OFFICER"
  | "ADMINISTRATOR";

export interface ProvenanceMeta {
  data_mode: DataProvenance;
  source: string;
  freshness_seconds: number;
  timestamp: string;
  is_real_world_verified: boolean;
  notes?: string;
}

export interface InundationPrediction {
  zone_id: string;
  zone_name: string;
  catchment_id: string;
  current_depth_cm: number;
  predicted_depth_cm: number;
  depth_band_min_cm: number;
  depth_band_max_cm: number;
  flood_probability: number;
  risk_level: RiskLevel;
  uncertainty: string;
  confidence: number;
  time_to_peak_min: number;
  drainage_surcharge_prob: number;
  primary_contributors: string[];
}

export interface RoadImpact {
  road_id: string;
  name: string;
  status: RoadStatus;
  predicted_depth_cm: number;
  passable_pedestrian: boolean;
  passable_light: boolean;
  passable_heavy: boolean;
  passable_emergency: boolean;
  risk_level: RiskLevel;
  speed_factor: number;
}

export interface DrainageStress {
  node_or_pipe_id: string;
  name: string;
  type: string;
  capacity_utilization_pct: number;
  surcharged: boolean;
  backflow_risk: boolean;
  blockage_pct: number;
  water_level_m: number;
  max_capacity_m3s: number;
  current_flow_m3s: number;
}

export interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

export interface GeoJSONFeature {
  type: string;
  id?: string | number;
  geometry: GeoJSONGeometry;
  properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: string;
  features: GeoJSONFeature[];
}

export interface NowcastTimeStep {
  step_index: number;
  offset_minutes: number;
  label: string;
  rainfall_rate_mmh: number;
  accumulated_rainfall_mm: number;
  average_flood_depth_cm: number;
  max_flood_depth_cm: number;
  active_inundation_area_sqkm: number;
  high_risk_roads_count: number;
  surcharged_drain_count: number;
  critical_zones_count: number;
  inundations: InundationPrediction[];
  affected_roads: RoadImpact[];
  drainage_stress: DrainageStress[];
  geojson_inundation?: GeoJSONFeatureCollection;
}

export interface NowcastSeriesResponse {
  provenance: ProvenanceMeta;
  city: string;
  generated_at: string;
  lead_time_minutes: number;
  time_steps: NowcastTimeStep[];
  model_version: string;
  hydrodynamic_engine: string;
}

export interface RouteRequest {
  origin: number[];
  destination: number[];
  profile: RoutingProfile;
  vehicle_type: VehicleType;
  departure_time_offset_min?: number;
  allow_caution_roads?: boolean;
  custom_thresholds?: Record<string, number>;
}

export interface HazardAvoided {
  segment_id: string;
  road_name: string;
  hazard_type: string;
  predicted_depth_cm: number;
  reason: string;
}

export interface RouteStep {
  instruction: string;
  road_name: string;
  distance_m: number;
  duration_sec: number;
  flood_depth_cm: number;
  road_status: RoadStatus;
  risk_level: RiskLevel;
  geometry_coords: number[][];
}

export interface RouteAlternative {
  profile: RoutingProfile;
  distance_km: number;
  eta_minutes: number;
  composite_risk: RiskLevel;
  max_flood_depth_encountered_cm: number;
  hazards_avoided_count: number;
  geometry: GeoJSONGeometry;
  summary: string;
}

export interface RouteResponse {
  provenance: ProvenanceMeta;
  profile_used: RoutingProfile;
  vehicle_type: VehicleType;
  distance_km: number;
  eta_minutes: number;
  composite_risk: RiskLevel;
  max_flood_depth_encountered_cm: number;
  is_fully_passable: boolean;
  policy_compliance_status?: string;
  configured_safety_policy?: Record<string, number>;
  avoided_hazards: HazardAvoided[];
  flood_segments: { name: string; depth_cm: number }[];
  decision_support_note: string;
  steps: RouteStep[];
  geometry: GeoJSONGeometry;
  alternatives: RouteAlternative[];
}

export interface SOSIncident {
  id: string;
  lat: number;
  lng: number;
  number_of_people: number;
  emergency_type: string;
  severity: RiskLevel;
  contact_phone: string;
  address_hint: string;
  notes?: string;
  status: SOSStatus;
  reported_depth_cm?: number;
  assigned_team_id?: string;
  assigned_team_name?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentReport {
  id: string;
  category: string;
  severity: RiskLevel;
  lat: number;
  lng: number;
  location_name: string;
  notes: string;
  media_url?: string;
  reported_by_role: UserRole;
  verified_by_field_officer: boolean;
  status: string;
  created_at: string;
}

export interface RescueTeam {
  id: string;
  name: string;
  team_type: string;
  capacity_people: number;
  lat: number;
  lng: number;
  status: string;
  assigned_incident_id?: string;
  equipment: string[];
  eta_minutes?: number;
}

export interface ShelterHospital {
  id: string;
  name: string;
  facility_type: "HOSPITAL" | "RELIEF_SHELTER" | "COMMUNITY_HALL" | "FIRE_STATION";
  lat: number;
  lng: number;
  capacity: number;
  current_occupancy: number;
  flood_risk: RiskLevel;
  road_passability: string;
  phone: string;
  address: string;
  has_emergency_power: boolean;
  available_beds_or_space: number;
}

export interface MunicipalPump {
  id: string;
  name: string;
  pump_type: string;
  discharge_capacity_m3h: number;
  location_name?: string;
  lat: number;
  lng: number;
  status: PumpStatus;
  assigned_zone_id?: string;
  assigned_zone_name?: string;
  fuel_level_pct: number;
  operating_hours_today: number;
  recommended_for_severity?: string;
}

export interface ReliefCamp {
  id: string;
  name: string;
  lat: number;
  lng: number;
  occupancy: number;
  capacity: number;
  food_supply_days: number;
  potable_water_liters: number;
  medicine_kits: number;
  has_critical_shortage: boolean;
  shortage_items: string[];
}

export interface DamageReport {
  id: string;
  zone_id: string;
  zone_name: string;
  asset_type: string;
  damage_severity: RiskLevel;
  estimated_repair_cost_inr: number;
  field_verified: boolean;
  reported_by: string;
  before_flood_status: string;
  observed_damage_notes: string;
  created_at: string;
}

export interface Alert {
  id: string;
  level: RiskLevel;
  title: string;
  message: string;
  zone_name: string;
  lead_time_min: number;
  action_advised: string;
  issued_by: string;
  is_draft: boolean;
  created_at: string;
}

export interface CausalFactor {
  factor_name: string;
  display_name: string;
  value: string;
  impact: string;
  contribution_pct: number;
  description: string;
}

export interface MLModelStatus {
  model_name: string;
  model_version: string;
  dataset_version: string;
  dataset_provenance?: string;
  training_mode: string;
  data_provenance: DataProvenance;
  training_timestamp: string;
  validation_method: string;
  validation_split_description?: string;
  is_real_world_calibrated: boolean;
  calibration_notice: string;
  performance_disclaimer?: string;
  feature_count: number;
  features: string[];
  inference_latency_ms: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  false_alarm_rate: number;
  mae_cm: number;
  rmse_cm: number;
  r2_score: number;
  iou_spatial: number;
  spatial_f1: number;
  alert_lead_time_minutes: number;
  recalculation_latency_ms: number;
}

export interface FeatureImportanceItem {
  feature_name: string;
  display_name: string;
  importance: number;
  category: string;
  description: string;
}

export interface LocalFeatureContribution {
  feature_name: string;
  feature_value: number;
  contribution_cm: number;
  display_text: string;
}

export interface MLPredictionDetail {
  zone_id: string;
  zone_name: string;
  timestamp: string;
  data_mode: DataProvenance;
  predicted_depth_cm: number;
  depth_band: string;
  depth_band_range?: string;
  uncertainty: string;
  confidence_score: number;
  risk_level: RiskLevel;
  base_expected_depth_cm: number;
  contributions: LocalFeatureContribution[];
  causal_factors?: CausalFactor[];
  explanation_type?: string;
  model_explanation_disclaimer?: string;
  prediction_timestamp?: string;
  reasoning_summary: string;
}

export interface ScenarioTimelineEvent {
  time: string;
  stage: number;
  type: string;
  message: string;
  severity: string;
}

export interface SituationBoard {
  scenario_name: string;
  scenario_id: string;
  mode: string;
  label: string;
  stage: number;
  operational_phase: string;
  flood_risk: string;
  rainfall_rate_mmh: number;
  accumulated_rain_mm: number;
  drainage_load_pct: number;
  max_depth_cm: number;
  inundation_area_km2: number;
  hotspots_count: number;
  affected_roads_count: number;
  active_road_status: string;
  sos_count: number;
  sos_status: string;
  rescue_teams_dispatched: number;
  pumps_dispatched: number;
  safe_route_status: string;
  system_readiness: string;
  terrain_provider: string;
  active_alerts_count: number;
}

export interface ScenarioOutcomeSummary {
  scenario_id: string;
  scenario_name: string;
  status: string;
  mode: string;
  label: string;
  peak_flood_risk: string;
  peak_flood_depth_cm: number;
  max_affected_area_km2: number;
  unsafe_road_segments: number;
  sos_incidents: number;
  citizens_evacuated: number;
  rescue_teams_dispatched: number;
  pumps_dispatched: number;
  safe_route_generated: boolean;
  emergency_alert_issued: boolean;
  simulated_duration: string;
  lifecycle_status: string;
}

export interface ScenarioStage {
  stage: number;
  operational_phase?: string;
  title: string;
  description: string;
  rainfall_rate_mmh: number;
  accumulated_rain_mm: number;
  drainage_load_pct: number;
  max_depth_cm: number;
  inundation_area_km2?: number;
  flood_risk?: string;
  active_road_status: string;
  system_action: string;
  total_stages: number;
  is_auto_running: boolean;
  data_mode: DataProvenance;
  scenario_id?: string;
  scenario_name?: string;
  scenario_subtitle?: string;
  scenario_mode?: string;
  scenario_label?: string;
  terrain_provider?: string;
  timeline_events?: ScenarioTimelineEvent[];
  situation_board?: SituationBoard;
}

// ==========================================
// URBAN TERRAIN INTELLIGENCE ENGINE TYPES
// ==========================================

export type DEMSourceType =
  | "INDIAN_HIGH_RES"
  | "COPERNICUS_GLO30"
  | "ALOS_AW3D30"
  | "BHUVAN_CARTODEM"
  | "SYNTHETIC_PILOT";

export type DEMStatus =
  | "ACTIVE"
  | "AVAILABLE_UNVERIFIED"
  | "NOT_CONFIGURED"
  | "FALLBACK_ACTIVE"
  | "PROCESSING"
  | "ERROR";

export type FlowAccumulationLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
export type FloodPotentialLevel = "LOW" | "MEDIUM" | "MODERATE" | "HIGH" | "SEVERE" | "CRITICAL";

export interface TerrainProviderInfo {
  provider_key: string;
  display_name: string;
  source_type: string;
  priority: number;
  status: DEMStatus;
  provenance: DataProvenance;
  resolution_m: number;
  vertical_accuracy: string;
  license_status: string;
  patna_verified: boolean;
  is_active: boolean;
  description: string;
}

export interface DEMMetadata {
  provider_key: string;
  source_name: string;
  source_type: string;
  horizontal_resolution_m: number;
  vertical_accuracy_m?: number;
  vertical_accuracy_description: string;
  crs: string;
  vertical_datum: string;
  provenance: DataProvenance;
  status: DEMStatus;
  acquisition_date?: string;
  production_date?: string;
  licensing: string;
  patna_coverage_verified: boolean;
  coverage_disclaimer: string;
  min_elevation_m: number;
  max_elevation_m: number;
  mean_elevation_m: number;
  nodata_value?: number;
  is_hydro_conditioned: boolean;
  processing_pipeline: string[];
  limitations_and_disclaimer?: string;
}

export interface TerrainPointInspection {
  lat: number;
  lon: number;
  ground_elevation_m: number;
  surface_elevation_m?: number;
  dataset_classification?: string;
  elevation_provenance?: string;
  local_relief_m: number;
  slope_degrees: number;
  aspect_degrees: number;
  aspect_cardinal: string;
  flow_direction_code: number;
  flow_direction_cardinal: string;
  flow_accumulation_cells: number;
  flow_accumulation_level: FlowAccumulationLevel;
  is_depression: boolean;
  is_low_point: boolean;
  depression_depth_cm: number;
  drainage_distance_m: number;
  nearest_drain_id?: string;
  nearest_drain_name?: string;
  nearest_drain_invert_m?: number;
  nearest_drain_invert_provenance?: string;
  nearest_drain_capacity_pct?: number;
  hand_relative_m: number;
  flood_accumulation_potential: FloodPotentialLevel;
  source: DataProvenance;
  provider_name: string;
  resolution_m: number;
  vertical_accuracy: string;
  quality_notes: string;
  limitations: string;
  provenance_classification?: Record<string, string>;
  timestamp: string;
}

export interface TerrainEngineStatus {
  active_provider: string;
  active_source_name: string;
  dataset_classification?: string;
  provenance: DataProvenance;
  status: DEMStatus;
  resolution_m: number;
  vertical_accuracy: string;
  crs: string;
  vertical_datum: string;
  patna_verified: boolean;
  aoi_coverage_pct?: number;
  pilot_aoi?: {
    name: string;
    min_lat: number;
    max_lat: number;
    min_lon: number;
    max_lon: number;
  };
  coverage_disclaimer: string;
  is_hydro_conditioned: boolean;
  ml_recalibration_status?: string;
  distribution_shift_detected?: boolean;
  scalability_architecture?: {
    current_pilot: string;
    scalability_path: string;
    all_india_status: string;
  };
  provider_matrix: TerrainProviderInfo[];
  processing_pipeline: string[];
  elevation_stats: {
    min_m: number;
    max_m: number;
    mean_m: number;
  };
  timestamp: string;
}

export interface TerrainValidationReport {
  crs_valid: boolean;
  nodata_present: boolean;
  nodata_count: number;
  elevation_range_valid: boolean;
  min_elevation_m: number;
  max_elevation_m: number;
  outliers_detected: number;
  vertical_datum_standard: string;
  is_hydro_conditioned: boolean;
  drainage_coupling_intact: boolean;
  validation_passed: boolean;
  notes: string[];
}

export interface TerrainLayerFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface TerrainLayerCollection {
  elevation_bands: TerrainLayerFeature[];
  low_points: TerrainLayerFeature[];
  depressions: TerrainLayerFeature[];
  flow_paths: TerrainLayerFeature[];
  contours: TerrainLayerFeature[];
  contour_interval_m: number;
  contour_resolution_warning?: string;
  catchment_boundaries: TerrainLayerFeature[];
  drainage_proximity_rings: TerrainLayerFeature[];
  provenance: DataProvenance;
  resolution_m: number;
  source_name: string;
}
