"""
VARUNETRA Core Configuration
Problem Statement SIH26085: Urban Flood Nowcasting System (Drainage and Rainfall Coupling)
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, model_validator


class DataProvenance(str, Enum):
    REAL = "REAL"
    SIMULATED = "SIMULATED"
    SYNTHETIC = "SYNTHETIC"
    DEMO = "DEMO"
    CACHED = "CACHED"


class ProviderConnectionStatus(str, Enum):
    CONNECTED = "CONNECTED"
    NOT_CONFIGURED = "NOT CONFIGURED"
    CACHED = "CACHED"
    SIMULATED = "SIMULATED"


class RiskLevel(str, Enum):
    SAFE = "SAFE"
    WARNING = "WARNING"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RoadStatus(str, Enum):
    OPEN = "OPEN"
    CAUTION = "CAUTION"
    RESTRICTED = "RESTRICTED"
    BLOCKED = "BLOCKED"


class RoutingProfile(str, Enum):
    FASTEST = "FASTEST"
    SAFEST = "SAFEST"
    EMERGENCY = "EMERGENCY"
    EVACUATION = "EVACUATION"


class VehicleType(str, Enum):
    PEDESTRIAN = "PEDESTRIAN"
    LIGHT_VEHICLE = "LIGHT_VEHICLE"  # Two-wheeler, Sedan, Auto
    HEAVY_VEHICLE = "HEAVY_VEHICLE"  # SUV, Bus, Truck, Standard Ambulance
    EMERGENCY_RESCUE = "EMERGENCY_RESCUE"  # High-clearance tactical, NDRF Truck, Boat


class PumpStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    DISPATCHED = "DISPATCHED"
    EN_ROUTE = "EN_ROUTE"
    ACTIVE = "ACTIVE"
    UNAVAILABLE = "UNAVAILABLE"


class SOSStatus(str, Enum):
    NEW = "NEW"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    ASSIGNED = "ASSIGNED"
    EN_ROUTE = "EN_ROUTE"
    ON_SCENE = "ON_SCENE"
    RESCUED = "RESCUED"
    CLOSED = "CLOSED"


class IncidentCategory(str, Enum):
    FLOOD = "FLOOD"
    BLOCKED_ROAD = "BLOCKED_ROAD"
    DRAINAGE_BLOCKAGE = "DRAINAGE_BLOCKAGE"
    INFRASTRUCTURE_DAMAGE = "INFRASTRUCTURE_DAMAGE"
    UNSAFE_BRIDGE = "UNSAFE_BRIDGE"
    FALLEN_OBJECT = "FALLEN_OBJECT"
    ELECTRICAL_HAZARD = "ELECTRICAL_HAZARD"
    RESCUE_REQUEST = "RESCUE_REQUEST"
    OTHER = "OTHER"


class UserRole(str, Enum):
    CITIZEN = "CITIZEN"
    DISASTER_AUTHORITY = "DISASTER_AUTHORITY"
    MUNICIPAL_OFFICER = "MUNICIPAL_OFFICER"
    RESCUE_TEAM = "RESCUE_TEAM"
    FIELD_OFFICER = "FIELD_OFFICER"
    ADMINISTRATOR = "ADMINISTRATOR"


class Settings(BaseSettings):
    model_config = ConfigDict(case_sensitive=True)

    PROJECT_NAME: str = "VARUNETRA"
    PROBLEM_STATEMENT_ID: str = "SIH26085"
    PROBLEM_TITLE: str = "Urban Flood Nowcasting System (Drainage and Rainfall Coupling)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment & Provenance Mode
    DATA_MODE: DataProvenance = DataProvenance.DEMO
    
    # Pilot Geography Definition
    PILOT_CITY: str = "Patna Urban Basin"
    PILOT_GEOGRAPHY_TYPE: str = "SYNTHETIC PILOT GEOGRAPHY"
    PILOT_GEOGRAPHY_DISCLAIMER: str = (
        "Hydraulically modeled on Patna Urban Basin topography for MoES SIH26085 nowcasting. "
        "Contains synthetic street segments, conduit geometry, and facility entities. Not official administrative boundaries."
    )
    DEFAULT_LAT: float = 25.6093
    DEFAULT_LNG: float = 85.1376
    DEFAULT_ZOOM: int = 14
    
    # Outfall River
    OUTFALL_RIVER_NAME: str = "Ganga River Outfall Channel"
    OUTFALL_BASE_STAGE_METERS: float = 48.5  # Datum meters
    
    # Configurable Vehicle Passability Operational Policy (depth thresholds in meters)
    PASSABILITY_THRESHOLDS: Dict[str, Dict[str, float]] = {
        VehicleType.PEDESTRIAN.value: {"caution": 0.08, "restricted": 0.15, "blocked": 0.30},
        VehicleType.LIGHT_VEHICLE.value: {"caution": 0.12, "restricted": 0.22, "blocked": 0.35},
        VehicleType.HEAVY_VEHICLE.value: {"caution": 0.25, "restricted": 0.45, "blocked": 0.70},
        VehicleType.EMERGENCY_RESCUE.value: {"caution": 0.45, "restricted": 0.75, "blocked": 1.20},
    }
    
    # CORS (Default explicit local origins; wildcard disallowed in production)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]

    # Authentication & Security
    AUTH_SECRET_KEY: Optional[str] = None
    AUTH_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    ADMIN_DEFAULT_PASSWORD: Optional[str] = None

    # Persistent Storage (SQLite restart-safe operational database)
    OPERATIONS_DB_PATH: str = "data/db/varunetra_operations.db"

    # Production Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 1
    LOG_LEVEL: str = "info"

    # Terrain Data Storage Paths (Configurable for container volumes and production mount points)
    COPERNICUS_PILOT_DIR: Optional[str] = None
    COPERNICUS_RAW_DIR: Optional[str] = None

    @model_validator(mode="after")
    def validate_runtime_safety(self) -> 'Settings':
        """
        Executes strict production sanity checks.
        Fails fast if worker, authentication, or CORS constraints are violated.
        """
        import secrets

        # 1. Multi-worker runtime constraint check
        if self.WORKERS > 1:
            raise ValueError(
                f"CRITICAL RUNTIME ERROR: WORKERS={self.WORKERS} is not supported. "
                "VARUNETRA uses process-local state (WebSocket client pools, nowcast loops, in-flight dispatch). "
                "Set WORKERS=1 for safe execution."
            )

        # 2. Production Authentication secret validation
        if self.DATA_MODE != DataProvenance.DEMO:
            if not self.AUTH_SECRET_KEY or len(self.AUTH_SECRET_KEY.strip()) < 32:
                raise ValueError(
                    "CRITICAL SECURITY CONFIGURATION ERROR: "
                    "AUTH_SECRET_KEY must be set to a high-entropy string (minimum 32 characters) "
                    f"in non-DEMO mode (DATA_MODE={self.DATA_MODE.value})."
                )
            insecure_keys = {"dev", "secret", "changeme", "default", "password", "admin", "12345678"}
            if self.AUTH_SECRET_KEY.strip().lower() in insecure_keys:
                raise ValueError(
                    "CRITICAL SECURITY CONFIGURATION ERROR: "
                    f"Insecure AUTH_SECRET_KEY='{self.AUTH_SECRET_KEY}' is rejected in non-DEMO mode."
                )

            # Production Admin Password validation (if provided)
            if self.ADMIN_DEFAULT_PASSWORD is not None:
                if len(self.ADMIN_DEFAULT_PASSWORD.strip()) < 12:
                    raise ValueError(
                        "CRITICAL SECURITY CONFIGURATION ERROR: "
                        "ADMIN_DEFAULT_PASSWORD must be at least 12 characters in non-DEMO mode."
                    )
                insecure_passwords = {"dev", "secret", "changeme", "password", "admin", "12345678", "varunetra"}
                if self.ADMIN_DEFAULT_PASSWORD.strip().lower() in insecure_passwords:
                    raise ValueError(
                        "CRITICAL SECURITY CONFIGURATION ERROR: "
                        f"Insecure ADMIN_DEFAULT_PASSWORD='{self.ADMIN_DEFAULT_PASSWORD}' is rejected in non-DEMO mode."
                    )

            # 3. CORS wildcard validation in production
            for origin in self.BACKEND_CORS_ORIGINS:
                if origin.strip() == "*":
                    raise ValueError(
                        "CRITICAL SECURITY CONFIGURATION ERROR: "
                        "Wildcard '*' in BACKEND_CORS_ORIGINS is prohibited in non-DEMO mode. "
                        "Specify explicit domain allowlists (e.g. ['https://varunetra.gov.in'])."
                    )
        else:
            # In DEMO mode, if no secret provided, generate an ephemeral runtime secret
            if not self.AUTH_SECRET_KEY:
                self.AUTH_SECRET_KEY = secrets.token_hex(32)

        return self


settings = Settings()
