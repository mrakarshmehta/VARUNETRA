"""
Emergency Operations, SOS, Rescue, Shelters, Pumps, Relief, and Damage Assessment Schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.core.config import SOSStatus, IncidentCategory, PumpStatus, RiskLevel, UserRole
from app.schemas.common import ProvenanceMeta


# --- SOS ---
class SOSCreateRequest(BaseModel):
    lat: float
    lng: float
    number_of_people: int = 1
    emergency_type: str = "Trapped in Waterlogging"
    severity: RiskLevel = RiskLevel.CRITICAL
    contact_phone: str = "9876543210"
    address_hint: Optional[str] = "Near Main Market Crossroad"
    notes: Optional[str] = None
    media_url: Optional[str] = None


class SOSIncidentSchema(BaseModel):
    id: str
    lat: float
    lng: float
    number_of_people: int
    emergency_type: str
    severity: RiskLevel
    contact_phone: str
    address_hint: str
    notes: Optional[str] = None
    status: SOSStatus
    assigned_team_id: Optional[str] = None
    assigned_team_name: Optional[str] = None
    created_at: str
    updated_at: str


# --- Incident Reporting ---
class IncidentCreateRequest(BaseModel):
    category: IncidentCategory
    severity: RiskLevel
    lat: float
    lng: float
    notes: str
    location_name: Optional[str] = None
    media_url: Optional[str] = None
    reported_by_role: UserRole = UserRole.CITIZEN


class IncidentReportSchema(BaseModel):
    id: str
    category: IncidentCategory
    severity: RiskLevel
    lat: float
    lng: float
    location_name: str
    notes: str
    media_url: Optional[str] = None
    reported_by_role: UserRole
    verified_by_field_officer: bool = False
    status: str = "OPEN"  # OPEN, INVESTIGATING, MITIGATED, RESOLVED
    created_at: str


# --- Rescue Teams ---
class RescueTeamSchema(BaseModel):
    id: str
    name: str
    team_type: str  # "Inflatable Boat Team", "Amphibious Vehicle Unit", "Medical Evac Squad"
    capacity_people: int
    lat: float
    lng: float
    status: str  # "AVAILABLE", "DISPATCHED", "ON_SCENE", "STANDBY"
    assigned_incident_id: Optional[str] = None
    equipment: List[str]
    eta_minutes: Optional[float] = None


# --- Shelters & Hospitals ---
class ShelterHospitalSchema(BaseModel):
    id: str
    name: str
    facility_type: str  # "HOSPITAL", "RELIEF_SHELTER", "COMMUNITY_HALL", "FIRE_STATION"
    lat: float
    lng: float
    capacity: int
    current_occupancy: int
    flood_risk: RiskLevel
    road_passability: str  # "PASSABLE", "CAUTION", "BLOCKED"
    phone: str
    address: str
    has_emergency_power: bool = True
    available_beds_or_space: int


# --- Municipal Pumps ---
class MunicipalPumpSchema(BaseModel):
    id: str
    name: str
    pump_type: str  # "High-Flow Diesel De-watering Unit", "Submersible Electric Pump"
    discharge_capacity_m3h: float
    lat: float
    lng: float
    status: PumpStatus
    assigned_zone_id: Optional[str] = None
    assigned_zone_name: Optional[str] = None
    fuel_level_pct: float
    operating_hours_today: float
    recommended_for_severity: Optional[str] = None


class PumpActionRequest(BaseModel):
    action: str  # "DISPATCH", "RESERVE", "ACTIVATE", "RECALL", "CLEAR_AREA"
    zone_id: Optional[str] = None
    notes: Optional[str] = None


# --- Relief Camps ---
class ReliefCampSchema(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    occupancy: int
    capacity: int
    food_supply_days: float
    potable_water_liters: float
    medicine_kits: int
    has_critical_shortage: bool
    shortage_items: List[str]


# --- Post-Flood Damage Assessment ---
class DamageReportSchema(BaseModel):
    id: str
    zone_id: str
    zone_name: str
    asset_type: str  # "Road Subbase", "Drainage Culvert", "Electrical Transformer", "Residential Structure"
    damage_severity: RiskLevel
    estimated_repair_cost_inr: float
    field_verified: bool
    reported_by: str
    before_flood_status: str
    observed_damage_notes: str
    created_at: str


# --- Official Alert ---
class AlertSchema(BaseModel):
    id: str
    level: RiskLevel  # INFO, WARNING, HIGH, CRITICAL
    title: str
    message: str
    zone_name: str
    lead_time_min: int
    action_advised: str
    issued_by: str  # e.g. "Municipal Disaster Management Authority (MDMA) [Draft Advisory Engine]"
    is_draft: bool = True
    created_at: str
