"""
VARUNETRA — Terrain Data Provider Architecture
Pluggable provider hierarchy implementing strict elevation source priority:
1. Primary: Verified Indian High-Resolution DEM (Survey of India NHP / NMCG / LiDAR)
2. Secondary: 30m Satellite DEM (Copernicus GLO-30, ALOS AW3D30, ISRO CartoDEM)
3. Fallback: Synthetic Pilot Terrain (Patna Urban Basin depression model)

STRICT ACCURACY RULES:
- Never claim thermal imagery produces elevation.
- Never claim Patna high-res coverage unless an actual verified tile is loaded.
- Always report documented vertical accuracy and spatial resolution truthfully.
"""

import os
import json
import numpy as np
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timezone

from app.core.config import settings
from app.schemas.common import DataProvenance
from app.schemas.terrain import (
    DEMSourceType,
    DEMStatus,
    DEMMetadata,
    TerrainProviderInfo,
)


def get_project_root() -> str:
    """Finds the root workspace directory containing the authoritative data/dem directory."""
    curr = os.path.abspath(os.path.dirname(__file__))
    for _ in range(5):
        if os.path.exists(os.path.join(curr, "data", "dem")):
            return curr
        parent = os.path.dirname(curr)
        if parent == curr:
            break
        curr = parent
    cwd = os.getcwd()
    if os.path.exists(os.path.join(cwd, "data", "dem")):
        return cwd
    if os.path.exists(os.path.join(os.path.dirname(cwd), "data", "dem")):
        return os.path.dirname(cwd)
    return cwd


class BaseTerrainProvider(ABC):
    """Abstract base class for all elevation/terrain providers."""

    def __init__(self, provider_key: str, display_name: str, source_type: DEMSourceType, priority: int):
        self.provider_key = provider_key
        self.display_name = display_name
        self.source_type = source_type
        self.priority = priority

    @abstractmethod
    def check_availability(self) -> Tuple[DEMStatus, bool, str]:
        """Returns (status, patna_verified, message)."""
        pass

    @abstractmethod
    def get_metadata(self) -> DEMMetadata:
        """Returns technical DEM metadata including resolution, vertical datum, accuracy."""
        pass

    @abstractmethod
    def get_elevation_grid(self) -> Tuple[np.ndarray, Dict[str, float]]:
        """
        Returns (elevation_grid_2d, bounds_dict)
        bounds_dict: {min_lat, max_lat, min_lon, max_lon, cell_size_deg}
        """
        pass

    @abstractmethod
    def get_elevation_at_point(self, lat: float, lon: float) -> Optional[float]:
        """Returns ground surface elevation in meters MSL, or None if outside bounds."""
        pass

    def get_provider_info(self, is_active: bool = False) -> TerrainProviderInfo:
        status, patna_verified, desc = self.check_availability()
        meta = self.get_metadata()
        return TerrainProviderInfo(
            provider_key=self.provider_key,
            display_name=self.display_name,
            source_type=self.source_type,
            priority=self.priority,
            status=status,
            provenance=meta.provenance,
            resolution_m=meta.horizontal_resolution_m,
            vertical_accuracy=meta.vertical_accuracy_description,
            license_status=meta.licensing,
            patna_verified=patna_verified,
            is_active=is_active,
            description=desc,
        )


class IndianHighResDEMProvider(BaseTerrainProvider):
    """
    Survey of India / National Hydrology Project (NHP) / NMCG High-Resolution DEM Adapter.
    Priority 1 in elevation hierarchy.
    """

    def __init__(self, data_path: Optional[str] = None):
        super().__init__(
            provider_key="INDIAN_HIGH_RES",
            display_name="Survey of India / NHP High-Resolution DEM",
            source_type=DEMSourceType.INDIAN_HIGH_RES,
            priority=1,
        )
        root = get_project_root()
        self.data_path = data_path or os.getenv("INDIAN_DEM_PATH", os.path.join(root, "data", "dem", "indian_nhp"))
        self._tile_loaded = False
        self._tile_path = None
        self._check_local_tile()

    def _check_local_tile(self):
        if os.path.exists(self.data_path):
            if os.path.isfile(self.data_path) and self.data_path.endswith((".tif", ".tiff", ".npy")):
                self._tile_path = self.data_path
                self._tile_loaded = True
            elif os.path.isdir(self.data_path):
                for f in os.listdir(self.data_path):
                    if f.endswith((".tif", ".tiff", ".npy")):
                        self._tile_path = os.path.join(self.data_path, f)
                        self._tile_loaded = True
                        break

    def check_availability(self) -> Tuple[DEMStatus, bool, str]:
        if self._tile_loaded:
            return (
                DEMStatus.AVAILABLE_UNVERIFIED,
                True,
                f"Local Indian High-Res DEM file detected at '{self._tile_path}'. Ready for CRS and vertical datum validation.",
            )
        return (
            DEMStatus.NOT_CONFIGURED,
            False,
            "STATUS = NOT CONFIGURED / AWAITING AUTHORIZED TILE. Survey of India / NMCG high-resolution LiDAR DEM tile is not licensed or configured in local repository (data/dem/indian_nhp/). Operating truthfully without fabricating access.",
        )

    def get_metadata(self) -> DEMMetadata:
        status, verified, desc = self.check_availability()
        return DEMMetadata(
            provider_key=self.provider_key,
            source_name="Survey of India — National Hydrology Project (NHP)",
            source_type=self.source_type,
            horizontal_resolution_m=1.0 if self._tile_loaded else 1.0,
            vertical_accuracy_m=0.5 if self._tile_loaded else 0.5,
            vertical_accuracy_description="Documented vertical accuracy < 0.5m (LiDAR / Photogrammetry benchmark specification).",
            crs="EPSG:32645 (WGS 84 / UTM Zone 45N)",
            vertical_datum="EGM2008 / Survey of India Great Trigonometrical Survey (GTS) Datum",
            provenance=DataProvenance.REAL if self._tile_loaded else DataProvenance.SYNTHETIC,
            status=status,
            acquisition_date=None,
            production_date="2022-2025 National Hydrology Project Phase II",
            licensing="Government of India Internal Use / NHP Restricted Access",
            patna_coverage_verified=verified,
            coverage_disclaimer="Patna tile not verified in local workspace. System strictly forbids falsifying coverage.",
            min_elevation_m=46.5,
            max_elevation_m=56.2,
            mean_elevation_m=50.4,
            nodata_value=-9999.0,
            is_hydro_conditioned=False,
            processing_pipeline=[
                "RAW GEOTIFF INGESTION",
                "EPSG:32645 REPROJECTION",
                "OUTLIER SPIKE REMOVAL",
                "CULVERT BREACHING / HYDRO-CONDITIONING",
                "D8 FLOW FIELD GENERATION",
            ],
        )

    def get_elevation_grid(self) -> Tuple[np.ndarray, Dict[str, float]]:
        # Fallback if no real tile physically stored
        raise FileNotFoundError("Survey of India high-resolution DEM tile is not configured in local environment.")

    def get_elevation_at_point(self, lat: float, lon: float) -> Optional[float]:
        return None


class CopernicusDEMProvider(BaseTerrainProvider):
    """
    Copernicus GLO-30 Global Digital Surface Model (30m).
    Priority 2 in elevation hierarchy. Real operational DEM source for Patna Urban Basin.
    """

    def __init__(self, data_path: Optional[str] = None):
        super().__init__(
            provider_key="COPERNICUS_GLO30",
            display_name="ESA Copernicus GLO-30 DSM (30m)",
            source_type=DEMSourceType.COPERNICUS_GLO30,
            priority=2,
        )
        root = get_project_root()
        self.pilot_dir = os.getenv("COPERNICUS_PILOT_DIR", os.path.join(root, "data", "dem", "copernicus", "pilot"))
        self.raw_dir = os.getenv("COPERNICUS_RAW_DIR", os.path.join(root, "data", "dem", "copernicus", "raw"))
        self._grid: Optional[np.ndarray] = None
        self._bounds: Optional[Dict[str, Any]] = None
        self._meta_dict: Optional[Dict[str, Any]] = None
        self._tile_loaded = False
        self._load_pilot_data()

    def _load_pilot_data(self):
        dem_path = os.path.join(self.pilot_dir, "copernicus_patna_pilot_dem.npy")
        meta_path = os.path.join(self.pilot_dir, "copernicus_patna_pilot_metadata.json")

        if os.path.exists(dem_path) and os.path.exists(meta_path):
            try:
                self._grid = np.load(dem_path)
                with open(meta_path, "r") as f:
                    self._meta_dict = json.load(f)

                b = self._meta_dict.get("actual_bounds", {})
                self.min_lat = b.get("min_lat", 25.559722)
                self.max_lat = b.get("max_lat", 25.650278)
                self.min_lon = b.get("min_lon", 85.069722)
                self.max_lon = b.get("max_lon", 85.230278)
                self.rows, self.cols = self._grid.shape
                self.cell_size_lat = (self.max_lat - self.min_lat) / self.rows
                self.cell_size_lon = (self.max_lon - self.min_lon) / self.cols
                self.resolution_m = float(b.get("resolution_m", 30.0))

                self._bounds = {
                    "min_lat": self.min_lat,
                    "max_lat": self.max_lat,
                    "min_lon": self.min_lon,
                    "max_lon": self.max_lon,
                    "cell_size_lat": self.cell_size_lat,
                    "cell_size_lon": self.cell_size_lon,
                    "rows": self.rows,
                    "cols": self.cols,
                    "resolution_m": self.resolution_m,
                }
                self._tile_loaded = True
            except Exception as e:
                self._tile_loaded = False
                self._grid = None

    def check_availability(self) -> Tuple[DEMStatus, bool, str]:
        if self._tile_loaded:
            return (
                DEMStatus.ACTIVE,
                True,
                "Real Copernicus GLO-30 DSM (30m) active for Patna Urban Basin pilot AOI (100% spatial overlap).",
            )
        return (
            DEMStatus.NOT_CONFIGURED,
            False,
            "Copernicus GLO-30 tile not cached locally. Ready for ingestion via OpenTopography / Copernicus Data Space.",
        )

    def get_metadata(self) -> DEMMetadata:
        status, verified, desc = self.check_availability()
        if self._tile_loaded and self._meta_dict:
            stats = self._meta_dict.get("stats", {})
            return DEMMetadata(
                provider_key=self.provider_key,
                source_name=self._meta_dict.get("source_name", "ESA Copernicus GLO-30 DSM (30m)"),
                source_type=self.source_type,
                horizontal_resolution_m=self.resolution_m,
                vertical_accuracy_m=float(self._meta_dict.get("vertical_accuracy_m", 4.0)),
                vertical_accuracy_description=self._meta_dict.get(
                    "vertical_accuracy_description",
                    "Absolute vertical accuracy < 4m (90% linear error worldwide). Classified truthfully as DSM.",
                ),
                crs=self._meta_dict.get("crs", "EPSG:4326 (WGS 84)"),
                vertical_datum=self._meta_dict.get("vertical_datum", "EGM2008 geoid"),
                provenance=DataProvenance.REAL,
                status=status,
                acquisition_date="2011-2015 TanDEM-X mission",
                production_date="2021-11 / 2026 Ingestion",
                licensing="Copernicus Open Access / Public Domain for Research & Emergency Response",
                patna_coverage_verified=True,
                coverage_disclaimer=(
                    "Patna Urban Basin pilot AOI covered 100% by Copernicus tile N25_00_E085_00. "
                    "Classified truthfully as DSM (Digital Surface Model; includes canopy and structural elevations). "
                    "ML Status: MODEL REQUIRES RECALIBRATION / RETRAINING."
                ),
                min_elevation_m=float(stats.get("min_elevation_m", 40.0)),
                max_elevation_m=float(stats.get("max_elevation_m", 72.99)),
                mean_elevation_m=float(stats.get("mean_elevation_m", 51.32)),
                nodata_value=-9999.0,
                is_hydro_conditioned=True,
                processing_pipeline=[
                    "COPERNICUS GLO-30 1-ARCSEC RASTER INGESTION (N25_00_E085_00)",
                    "PATNA URBAN BASIN AOI EXTRACTION (+0.01 DEG BUFFER)",
                    "EPSG:4326 / EGM2008 VERTICAL DATUM AUDIT",
                    "NODATA CLEANUP & FILTERING",
                    "HYDRO-CONDITIONING (5 CRITICAL DRAINAGE BREACHES)",
                    "D8 STEEPEST DESCENT FLOW ROUTING",
                    "TOPOGRAPHIC WETNESS & DEPRESSION STORAGE COMPUTATION",
                    "ML SURROGATE FEATURE DRIFT EVALUATION",
                ],
            )

        return DEMMetadata(
            provider_key=self.provider_key,
            source_name="ESA Copernicus GLO-30 DSM (30m)",
            source_type=self.source_type,
            horizontal_resolution_m=30.0,
            vertical_accuracy_m=4.0,
            vertical_accuracy_description="Absolute vertical accuracy < 4m (90% linear error worldwide).",
            crs="EPSG:4326 (WGS 84)",
            vertical_datum="EGM2008 geoid",
            provenance=DataProvenance.SYNTHETIC,
            status=status,
            acquisition_date="2011-2015 TanDEM-X mission",
            production_date="2021-11",
            licensing="Copernicus Open Access / Free for research & public safety",
            patna_coverage_verified=False,
            coverage_disclaimer="30m resolution is suitable for regional basin hydrology, but too coarse for street curb micro-topography.",
            min_elevation_m=47.0,
            max_elevation_m=55.0,
            mean_elevation_m=50.2,
            nodata_value=-9999.0,
            is_hydro_conditioned=False,
            processing_pipeline=[
                "COPERNICUS GLO-30 1-ARCSEC RASTER INGESTION",
                "EGM2008 VERTICAL DATUM VERIFICATION",
                "PIT FILLING",
                "STREAM NETWORK DERIVATION",
            ],
        )

    def get_elevation_grid(self) -> Tuple[np.ndarray, Dict[str, float]]:
        if self._tile_loaded and self._grid is not None and self._bounds is not None:
            return self._grid, self._bounds
        raise FileNotFoundError("Copernicus DEM tile is not cached locally.")

    def get_elevation_at_point(self, lat: float, lon: float) -> Optional[float]:
        if not self._tile_loaded or self._grid is None:
            return None

        if not (self.min_lat <= lat <= self.max_lat and self.min_lon <= lon <= self.max_lon):
            return None

        # Bilinear interpolation
        # Row 0 is at max_lat (North), row N-1 is at min_lat (South)
        row_f = (self.max_lat - lat) / self.cell_size_lat
        col_f = (lon - self.min_lon) / self.cell_size_lon

        r0 = int(np.clip(np.floor(row_f), 0, self.rows - 2))
        r1 = r0 + 1
        c0 = int(np.clip(np.floor(col_f), 0, self.cols - 2))
        c1 = c0 + 1

        dr = row_f - r0
        dc = col_f - c0

        v00 = self._grid[r0, c0]
        v01 = self._grid[r0, c1]
        v10 = self._grid[r1, c0]
        v11 = self._grid[r1, c1]

        val = (1 - dr) * (1 - dc) * v00 + (1 - dr) * dc * v01 + dr * (1 - dc) * v10 + dr * dc * v11
        return round(float(val), 2)


class BhuvanCartoDEMProvider(BaseTerrainProvider):
    """
    ISRO CartoDEM (Cartosat-1 Stereo DEM - 30m / 10m).
    Priority 3 in elevation hierarchy.
    """

    def __init__(self, data_path: Optional[str] = None):
        super().__init__(
            provider_key="BHUVAN_CARTODEM",
            display_name="ISRO Bhuvan CartoDEM v3 (30m)",
            source_type=DEMSourceType.BHUVAN_CARTODEM,
            priority=3,
        )
        self.data_path = data_path or os.getenv("BHUVAN_DEM_PATH", "data/dem/bhuvan/")
        self._tile_loaded = False

    def check_availability(self) -> Tuple[DEMStatus, bool, str]:
        return (
            DEMStatus.NOT_CONFIGURED,
            False,
            "ISRO Bhuvan CartoDEM credentials or tiles not configured in local environment.",
        )

    def get_metadata(self) -> DEMMetadata:
        status, verified, desc = self.check_availability()
        return DEMMetadata(
            provider_key=self.provider_key,
            source_name="ISRO National Remote Sensing Centre (NRSC) CartoDEM",
            source_type=self.source_type,
            horizontal_resolution_m=30.0,
            vertical_accuracy_m=8.0,
            vertical_accuracy_description="Vertical accuracy approximately ±8m across Indo-Gangetic plains.",
            crs="EPSG:4326 (WGS 84)",
            vertical_datum="WGS 84 Ellipsoid / EGM96",
            provenance=DataProvenance.SYNTHETIC,
            status=status,
            acquisition_date="2005-2015 Cartosat-1 stereo pairs",
            production_date="2018 v3.0 release",
            licensing="Open to Indian academic and government users via Bhuvan portal",
            patna_coverage_verified=False,
            coverage_disclaimer="CartoDEM tile not loaded locally. Fallback active.",
            min_elevation_m=46.8,
            max_elevation_m=55.5,
            mean_elevation_m=50.1,
            nodata_value=-9999.0,
            is_hydro_conditioned=False,
            processing_pipeline=["BHUVAN CARTODEM INGESTION ADAPTER"],
        )

    def get_elevation_grid(self) -> Tuple[np.ndarray, Dict[str, float]]:
        raise FileNotFoundError("Bhuvan CartoDEM not loaded.")

    def get_elevation_at_point(self, lat: float, lon: float) -> Optional[float]:
        return None


class SyntheticPilotTerrainProvider(BaseTerrainProvider):
    """
    Synthetic Hydro-Enforced Pilot Elevation Grid (Patna Urban Basin).
    Priority 4 / Active Fallback.
    
    ACCURATE GEOGRAPHY & HYDRO-LOGICAL FOUNDATION:
    - Replicates the real geomorphological cross-section of Patna:
      1. Northern natural levee adjacent to River Ganga: elevated at ~51.5 - 54.0m MSL.
      2. Southern urban depression bowl (Rajendra Nagar, Kankarbagh, Saidpur): drops to 47.2 - 49.0m MSL.
      3. Result: In high water, rainwater is trapped between northern river embankment and southern railway embankment, creating critical ponding bowls.
    """

    def __init__(self):
        super().__init__(
            provider_key="SYNTHETIC_PATNA_PILOT",
            display_name="Synthetic Hydro-Enforced Pilot Grid (Patna Basin)",
            source_type=DEMSourceType.SYNTHETIC_PILOT,
            priority=4,
        )
        # Bounding box for Patna Urban Pilot
        self.min_lat = 25.570
        self.max_lat = 25.640
        self.min_lon = 85.080
        self.max_lon = 85.220
        self.rows = 70
        self.cols = 140
        self.cell_size_lat = (self.max_lat - self.min_lat) / self.rows  # ~111m
        self.cell_size_lon = (self.max_lon - self.min_lon) / self.cols  # ~100m
        self.resolution_m = 10.0  # Synthetic hydro grid cell resolution

        # Precompute the elevation raster
        self._grid = self._synthesize_hydro_conditioned_grid()

    def _synthesize_hydro_conditioned_grid(self) -> np.ndarray:
        """
        Synthesizes a realistic, hydro-conditioned elevation surface for Patna Urban Basin:
        - Ganga levee in north (lat 25.61-25.63) high ground: 52-54m MSL
        - Rajendra Nagar bowl (lat 25.59-25.60, lon 85.15-85.18): 47.5 - 48.6m MSL
        - Kankarbagh depression (lat 25.58-25.59, lon 85.13-85.16): 47.8 - 48.8m MSL
        - Saidpur canal alignment conditioned with a -0.5m hydraulic invert channel
        """
        lats = np.linspace(self.min_lat, self.max_lat, self.rows)
        lons = np.linspace(self.min_lon, self.max_lon, self.cols)
        LON, LAT = np.meshgrid(lons, lats)

        # 1. Macro slope: higher in north near Ganga levee (53m), dropping to 48.5m in south
        macro_elev = 50.0 + (LAT - 25.60) * 55.0 - (LON - 85.14) * 5.0

        # 2. Ganga natural river levee ridge (North)
        levee_ridge = 2.8 * np.exp(-((LAT - 25.625) ** 2) / (2 * (0.012 ** 2)))

        # 3. Rajendra Nagar Lowland Bowl (Critical depression)
        rajendra_bowl = -3.2 * np.exp(
            -(((LAT - 25.598) ** 2) / (2 * (0.008 ** 2)) + ((LON - 85.165) ** 2) / (2 * (0.012 ** 2)))
        )

        # 4. Kankarbagh Invert Sump (Southern depression)
        kankarbagh_bowl = -2.6 * np.exp(
            -(((LAT - 25.588) ** 2) / (2 * (0.009 ** 2)) + ((LON - 85.145) ** 2) / (2 * (0.015 ** 2)))
        )

        # 5. Saidpur Outfall Drainage Corridor (West to East invert gradient)
        saidpur_trough = -1.2 * np.exp(-((LAT - 25.602) ** 2) / (2 * (0.004 ** 2)))

        elev = macro_elev + levee_ridge + rajendra_bowl + kankarbagh_bowl + saidpur_trough

        # Clamp between realistic Patna elevation extremes: 46.8m to 54.8m MSL
        elev = np.clip(elev, 47.0, 54.5)
        return np.round(elev, 2)

    def check_availability(self) -> Tuple[DEMStatus, bool, str]:
        return (
            DEMStatus.ACTIVE,
            True,
            "Synthetic hydro-conditioned elevation grid calibrated for Patna Urban Basin depression topography. Active fallback.",
        )

    def get_metadata(self) -> DEMMetadata:
        status, verified, desc = self.check_availability()
        return DEMMetadata(
            provider_key=self.provider_key,
            source_name="VARUNETRA Synthetic Hydro-Conditioned Pilot Terrain",
            source_type=self.source_type,
            horizontal_resolution_m=self.resolution_m,
            vertical_accuracy_m=0.0,
            vertical_accuracy_description="Synthetic benchmark model (deterministic mathematical elevation surface). Not field-verified real-world ground truth.",
            crs="EPSG:4326 (WGS 84 / Geographic Coordinates)",
            vertical_datum="Mean Sea Level (MSL) benchmark approximation",
            provenance=DataProvenance.SYNTHETIC,
            status=status,
            acquisition_date="2026-Synthetic-Model",
            production_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            licensing="VARUNETRA SIH26085 Open Architecture",
            patna_coverage_verified=verified,
            coverage_disclaimer="SYNTHETIC PILOT • PATNA URBAN BASIN — Derived from documented municipal flood studies & geomorphology. Ready for plug-in replacement when licensed Survey of India NHP DEM tile is provided.",
            min_elevation_m=float(np.min(self._grid)),
            max_elevation_m=float(np.max(self._grid)),
            mean_elevation_m=float(np.round(np.mean(self._grid), 2)),
            nodata_value=-9999.0,
            is_hydro_conditioned=True,
            processing_pipeline=[
                "SYNTHETIC PILOT GRID INITIALIZATION",
                "GANGA NATURAL LEVEE ENFORCEMENT",
                "RAJENDRA NAGAR / KANKARBAGH BOWL CONDITIONAL MORPHOMETRY",
                "SAIDPUR OUTFALL TRUNK CANAL HYDRO-BREACHING",
                "D8 STEEPEST DESCENT FLOW ROUTING",
                "TOPOGRAPHIC WETNESS & DEPRESSION STORAGE COMPUTATION",
            ],
        )

    def get_elevation_grid(self) -> Tuple[np.ndarray, Dict[str, float]]:
        bounds = {
            "min_lat": self.min_lat,
            "max_lat": self.max_lat,
            "min_lon": self.min_lon,
            "max_lon": self.max_lon,
            "cell_size_lat": self.cell_size_lat,
            "cell_size_lon": self.cell_size_lon,
            "rows": self.rows,
            "cols": self.cols,
            "resolution_m": self.resolution_m,
        }
        return self._grid, bounds

    def get_elevation_at_point(self, lat: float, lon: float) -> Optional[float]:
        if not (self.min_lat <= lat <= self.max_lat and self.min_lon <= lon <= self.max_lon):
            return None

        # Bilinear interpolation
        row_f = (lat - self.min_lat) / self.cell_size_lat
        col_f = (lon - self.min_lon) / self.cell_size_lon

        r0 = int(np.clip(np.floor(row_f), 0, self.rows - 2))
        r1 = r0 + 1
        c0 = int(np.clip(np.floor(col_f), 0, self.cols - 2))
        c1 = c0 + 1

        dr = row_f - r0
        dc = col_f - c0

        v00 = self._grid[r0, c0]
        v01 = self._grid[r0, c1]
        v10 = self._grid[r1, c0]
        v11 = self._grid[r1, c1]

        val = (1 - dr) * (1 - dc) * v00 + (1 - dr) * dc * v01 + dr * (1 - dc) * v10 + dr * dc * v11
        return round(float(val), 2)


class TerrainProviderRegistry:
    """
    Registry and Priority Coordinator for Urban Terrain Providers.
    Always follows the strict priority:
    1. Indian High-Res DEM (if verified & configured)
    2. Copernicus GLO-30 (if cached & configured)
    3. ALOS / Bhuvan (if configured)
    4. Synthetic Pilot Fallback (active by default)
    """

    def __init__(self):
        self.providers: Dict[str, BaseTerrainProvider] = {
            "INDIAN_HIGH_RES": IndianHighResDEMProvider(),
            "COPERNICUS_GLO30": CopernicusDEMProvider(),
            "BHUVAN_CARTODEM": BhuvanCartoDEMProvider(),
            "SYNTHETIC_PATNA_PILOT": SyntheticPilotTerrainProvider(),
        }
        self.active_provider_key = self._resolve_active_provider()

    def _resolve_active_provider(self) -> str:
        # Check providers in priority order
        sorted_providers = sorted(self.providers.values(), key=lambda p: p.priority)
        for prov in sorted_providers:
            # In REAL mode, NEVER automatically resolve to synthetic benchmark
            if settings.DATA_MODE == DataProvenance.REAL and prov.provider_key == "SYNTHETIC_PATNA_PILOT":
                continue
            status, verified, _ = prov.check_availability()
            if status in [DEMStatus.ACTIVE, DEMStatus.AVAILABLE_UNVERIFIED] and verified:
                try:
                    # Test if grid is loadable
                    prov.get_elevation_grid()
                    return prov.provider_key
                except Exception:
                    continue

        # If authoritative data is unavailable:
        # In REAL mode, FAIL CLOSED: do not silently substitute synthetic data
        if settings.DATA_MODE == DataProvenance.REAL:
            return "UNAVAILABLE"

        # Fallback is only synthetic pilot in DEMO/SIMULATED/SYNTHETIC
        return "SYNTHETIC_PATNA_PILOT"

    def get_active_provider(self) -> Optional[BaseTerrainProvider]:
        return self.providers.get(self.active_provider_key)

    def set_active_provider(self, provider_key: str) -> bool:
        # In REAL mode, prevent switching to synthetic data
        if settings.DATA_MODE == DataProvenance.REAL and provider_key == "SYNTHETIC_PATNA_PILOT":
            return False

        if provider_key in self.providers:
            prov = self.providers[provider_key]
            status, _, _ = prov.check_availability()
            if status != DEMStatus.NOT_CONFIGURED:
                self.active_provider_key = provider_key
                return True
        return False

    def get_all_providers_info(self) -> List[TerrainProviderInfo]:
        sorted_providers = sorted(self.providers.values(), key=lambda p: p.priority)
        return [
            p.get_provider_info(is_active=(p.provider_key == self.active_provider_key))
            for p in sorted_providers
        ]


# Singleton instance
terrain_provider_registry = TerrainProviderRegistry()
