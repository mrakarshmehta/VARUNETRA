# VARUNETRA: URBAN TERRAIN INTELLIGENCE ENGINE
## Presentation & Technical Briefing Slides (SIH26085)

---

#### SLIDE 1: TITLE & CORE UPGRADE
**VARUNETRA: Urban Flood Intelligence & Emergency Response Platform**
*Urban Terrain Intelligence Engine — Real Elevation & High-Resolution DEM Integration*
*Problem Statement ID:* SIH26085 | *Ministry of Earth Sciences (MoES)*

- **Core Upgrade:** Real Copernicus GLO-30 terrain data now feeds VARUNETRA's terrain-intelligence pipeline.
- **Engine Capabilities:** Terrain-derived elevation, slope, flow accumulation, and depression features enrich the flood-nowcast model.
- **Truthful Provenance Standard:**
  - Active Pilot: `REAL COPERNICUS GLO-30 DSM (30m) • PATNA URBAN BASIN`
  - High-Res Indian DEM Provider Status: `NOT CONFIGURED` (Transparently awaits local Survey of India tile release).
  - Scientific Rule: **Thermal satellite scans are never used for elevation. Satellite DSM elevations are never conflated with subsurface pipe inverts.**

---

### SLIDE 2: SCIENTIFIC TERRAIN PIPELINE
**Reproducible Geospatial Pre-processing Pipeline**

```
RAW DEM / GEOTIFF (Copernicus GLO-30 DSM)
        ↓
CRS VALIDATION (EPSG:32645 / EPSG:4326)
        ↓
NO-DATA CHECK & SPIKE FILTER (Gradient outlier suppression)
        ↓
VERTICAL DATUM CHECK (EGM2008 Gravitational Geoid)
        ↓
HYDRO-CONDITIONING (Breaching road embankment dams across culverts)
        ↓
PIT & SINK ANALYSIS (Local depression storage depth in cm)
        ↓
D8 FLOW DIRECTION & TOPOLOGICAL ACCUMULATION
        ↓
SLOPE (Degrees) & ASPECT (8 Cardinal Directions)
        ↓
HAND (Height Above Nearest Drainage)
        ↓
DRAINAGE NETWORK COUPLING (Explicit simulated conduit inverts)
```

**Technical Pipeline Integrity:**
- Non-destructive processing: original source DEM rasters remain immutable; derived rasters are computed deterministically.
- Road embankments and railway corridors in Patna act as artificial dams in raw DEMs; hydro-conditioning breaches 5 major drainage alignments (`C-MAIN-01`, `C-OUTFALL-01`, `N-SUMP-01`, `N-SUMP-02`, `C-LAT-03`) to ensure correct physical flow into sumps.

---

### SLIDE 3: DATA PROVIDER HIERARCHY ARCHITECTURE
**Pluggable Multi-Tier Geospatial Data Providers**

| Priority | Provider Tier | Candidate Datasets | Stated Resolution | Stated Vertical Accuracy | Current Status in Prototype |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **1** | **Primary: Indian High-Res DEM** | Survey of India NHP, NMCG High-Res, Urban LiDAR | 1.0 m | &lt; 0.5 m | **STATUS = NOT CONFIGURED / AWAITING AUTHORIZED TILE** |
| **2** | **Secondary: 30m Satellite DEM** | ESA Copernicus GLO-30 DSM (COG) | 30 m | &lt; 4.0 m | **ACTIVE (Real tile N25_00_E085_00 ingested & coupled)** |
| **3** | **Tertiary: ISRO National DEM** | ISRO NRSC CartoDEM v3 (Stereo) | 30 m / 10 m | ~8.0 m | **Adapter Configured (Standby)** |
| **4** | **Fallback: Hydro-Conditioned Pilot** | VARUNETRA Patna Geomorphology Surface | 10 m | Deterministic Pilot | **STANDBY FALLBACK (Seamless bidirectional toggle)** |

**Truthful Coverage & Autonomous Acquisition Principle:**
- **Primary AOI:** Patna Urban Basin (`[25.570°N, 25.640°N]`, `[85.080°E, 85.220°E]`).
- **Autonomous Download:** Tile `Copernicus_DSM_COG_10_N25_00_E085_00_DEM.tif` (44.7 MB) acquired from AWS Open Data public repository into `data/dem/copernicus/raw/` and clipped with 0.01° hydrologic buffer into `data/dem/copernicus/pilot/`.
- **AOI Overlap:** Exactly 100.0% coverage of the Patna pilot bounding box.
- **Classification:** Truthfully classified as a **Digital Surface Model (DSM)**.
- **High-Res Indian Data:** Retains adapter for Survey of India / NMCG LiDAR; transparently displayed as `NOT CONFIGURED / AWAITING AUTHORIZED TILE` without fabricating access.

---

### SLIDE 4: INNOVATION SLIDE
**"Terrain-Aware Urban Flood Intelligence & Causality Chain"**

Unlike simple flat-surface flood mapping, VARUNETRA combines:
$$\mathbf{ELEVATION\ (DSM)} + \mathbf{RAIN\ (HYETOGRAPH)} + \mathbf{RUNOFF} + \mathbf{DRAINAGE\ HYDRAULICS} + \mathbf{SURCHARGE\ STATE} = \mathbf{MODELLED\ INUNDATION}$$

- **Patna Geomorphological Model (DEM-Derived):**
  - Terrain model identifies an elevated northern corridor (**54.5 – 56.2 m MSL**) along the Ganga levee.
  - Lower southern urban depression zones (**51.8 – 55.0 m MSL**) near the railway corridor.
  - Explains why gravity runoff naturally accumulates towards southern sumps when Ganga stage rises.
- **Strict Provenance Separation (Real vs. Modelled):**
  - **REAL INPUT:** Copernicus GLO-30 DSM surface elevation (~30m).
  - **DERIVED:** Slope, Aspect, D8 Flow Direction, Flow Accumulation, Sink Depth, HAND.
  - **SIMULATED:** Subsurface conduit inverts (44.5–46.8m MSL), pipe backwater lock, street waterlogging depth (e.g., modelled 38.5cm, not field observation).
  - **DYNAMIC ALGORITHM:** Road passability thresholds and A* Dijkstra life-safety rerouting.
- **Micro-Topographic Point Inspector:**
  - Surface elevation (DSM), local relief ($\pm\text{m}$), slope ($^\circ$), flow direction, accumulation, depression sink, and drainage proximity available at any clicked point.
  - Subsurface drainage conduit inverts are explicit hydraulic parameters (SIMULATED), completely separate from satellite DSM surface elevations. Zero fake precision: limitations clearly stated based on source resolution.

---

### SLIDE 5: RESOLUTION-AWARE CONTOURING & ACCURACY RULES
**Scientific Guardrails Against False Precision**

1. **Resolution-Aware Contour Rule:**
   - 30m Satellite DEM $\longrightarrow$ **5m contour interval strictly enforced**.
   - Sub-meter contours (0.5m / 1m) on 30m data are **strictly prohibited** by the engine to prevent false precision.
   - 1m or 0.5m contours are only permitted when a verified sub-5m LiDAR / Indian High-Res DEM tile is loaded.
2. **Thermal Imagery Disavowal:**
   - Thermal satellite infrared sensors measure sea/land surface temperature (LST), *never* ground elevation.
   - VARUNETRA strictly rejects false claims linking thermal scanning to topography.
3. **ML Model Discipline:**
   - The ML surrogate model (`1.2.0-rf-histgbm`) retains its validation disclaimer noting calibration on synthetic/pilot distributions.
   - If an operator switches to a new high-resolution DEM that alters feature distributions, the engine flags the ML model as requiring re-calibration.

---

### SLIDE 6: 2D GIS & 3D CITY DIGITAL TWIN INTEGRATION
**Dual-Engine Real-Time Visualization**

- **2D Operations Console (Leaflet GIS):**
  - Dedicated **TERRAIN Module** with live provider status pill, hypsometric elevation bands, hotspot selector, interactive point inspector, provider hierarchy matrix, and pre-processing validation audit.
  - GeoJSON layer collection: elevation bands, low points, depressions, flow paths, and resolution-constrained contours.
- **3D City Flood Digital Twin (CesiumJS):**
  - 3D terrain relief and urban surface rendering.
  - Highlighting depression sinks and low-point sumps with 3D elliptical beacons.
  - Interactive screen-space raycast picking: clicking anywhere on the 3D globe calculates exact latitude/longitude and displays the **3D Terrain Inspector Popover**.

---

### SLIDE 7: SCALABILITY ARCHITECTURE: PATNA PILOT → BIHAR → INDIAN CITIES
**Modular Catchment Extensibility Without False Nationwide Claims**

```
CURRENT OPERATIONAL PILOT:
Patna Urban Basin (Lat 25.570°N - 25.640°N, Lon 85.080°E - 85.220°E)
   │
   ▼
REGIONAL BIHAR SCALABILITY:
Ganga Basin Catchments (Bhagalpur, Muzaffarpur, Gaya, Munger)
   │
   ▼
NATIONAL DEPLOYMENT ARCHITECTURE:
Indian Vulnerable Urban Catchments (Mumbai, Chennai, Bengaluru, Guwahati)
```

- **Modular Catchment Configuration:** The terrain engine and nowcast pipelines accept any localized bounding box `(min_lat, max_lat, min_lon, max_lon)` and drainage asset register.
- **Zero Hallucination Standard:** VARUNETRA strictly refuses to advertise "India-wide live terrain" unless authoritative, licensed high-resolution DEM tiles are loaded for each specific municipality.
- **ML Recalibration Discipline:** Whenever migrating to a new urban basin or updating DEM provenance (e.g. from synthetic bare-earth to satellite DSM or LiDAR), the platform checks feature drift and enforces explicit surrogate model re-benchmarking before certifying field readiness.
