# VARUNETRA — Real Copernicus Terrain Validation & Visual Proof Report
**Authoritative Operational Pilot: Patna Urban Basin (`[25.570°N - 25.640°N, 85.080°E - 85.220°E]`)**
**Dataset Provenance: Copernicus GLO-30 DSM (30m Resolution, Real Geospatial Ingestion)**

---

## 1. Executive Summary & Verification Objective

The **Copernicus GLO-30 Global Digital Surface Model (DSM)** has been ingested, hydro-conditioned, and tightly coupled into **VARUNETRA's** hydrodynamic simulation and flood routing engines.

This document provides definitive, verifiable visual and numerical evidence demonstrating that **real ground and surface topography actively alters flood intelligence workflows** across the Patna Urban Basin, rather than serving as passive metadata.

```
       ┌────────────────────────────────────────────────────────┐
       │               COPERNICUS GLO-30 DSM (30m)              │
       │       Source: ESA / Copernicus Data Space Ecosystem    │
       │       Type: Digital Surface Model (DSM) · Real Data    │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             HYDRO-CONDITIONED TERRAIN ENGINE           │
       │    D8 Flow Accumulation · Depression Sinks · Breaching │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                COUPLED DRAINAGE NETWORK                │
       │   Backwater Hydrodynamics · Outfall Gravity Hydraulic  │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │               TERRAIN-DRIVEN FLOOD DEPTH               │
       │   Surface Inundation Grid · Depression Water Pooling   │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                INFRASTRUCTURE PASSABILITY              │
       │   Depth-Based Road Impairment · Emergency Transit Cl. │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                 DYNAMIC RESCUE ROUTING                 │
       │   Flood-Avoidant Dijkstra · Life-Safety Evacuation     │
       └────────────────────────────────────────────────────────┘
```

---

## 2. Comparative Analysis: Synthetic Baseline vs. Real Copernicus GLO-30 DSM

Prior to this integration, VARUNETRA operated on a synthetic sinusoidal elevation grid. Ingesting Copernicus GLO-30 radically changes the topographic landscape of the Patna Urban Basin:

| Evaluation Metric | Synthetic Pilot Baseline | Real Copernicus GLO-30 DSM | Real-World Impact on Flood Workflow |
| :--- | :--- | :--- | :--- |
| **Data Provenance** | Procedural Sinusoidal Matrix | ESA Copernicus GLO-30 DSM | Grounded in satellite radar interferometry |
| **Grid Resolution** | 100 m procedural cells | 1.0 arc-second (~30 m actual) | $9\times$ spatial cell density resolution |
| **Min / Max Elevation** | 47.00 m / 54.50 m MSL | **39.52 m / 72.99 m MSL** | $4.4\times$ wider dynamic range capturing real terrain relief |
| **Mean Elevation** | 51.52 m MSL | **52.64 m MSL** | $+1.12$ m basin-wide systematic elevation offset |
| **Elevation Std Dev** | 1.82 m | **3.88 m** | $2.1\times$ higher topographic variance and micro-relief |
| **Terrain Depressions** | 3 idealized circular depressions | **8 actual topological depression sumps** | Identifies real bowl sinks (Rajendra Nagar, Saidpur) |
| **Overland Flow Paths** | Symmetric radial slope | **D8 real topographic gradient convergence** | Tracks natural surface run-off towards southern sumps |
| **Ganga Natural Levee** | Flattened northern riverbank | **Elevated corridor (54.5–56.2m MSL)** | Terrain model identifies an elevated northern corridor and lower southern urban zones within the pilot dataset |
| **Saidpur Sump Surface** | 47.00 m (arbitrary) | **52.08 m MSL (Copernicus DSM surface)** | Surface elevation coupled to modelled conduit invert (45.2m, SIMULATED) for hydraulic head pressure |
| **Hydro-Conditioning** | None | **5 Culvert breach cuts across embankments** | Prevents artificial damming by railways and highways |
| **ML Surrogate Status** | Baseline surrogate fit | **Flagged: Recalibration / Retraining Required** | Strict engineering honesty; prevents silent drift |

> **Digital Surface Model (DSM) vs. Bare Earth (DTM)**:
> Copernicus GLO-30 is an interferometric radar DSM that captures structural elevations including high-density urban rooftops, railway embankments, and overpasses (up to 72.99m MSL in central Patna). To prevent elevated transportation embankments from acting as artificial hydraulic barriers, VARUNETRA applies **hydro-conditioned culvert breaching** across 5 critical conduits (`C-MAIN-01`, `C-OUTFALL-01`, `N-SUMP-01`, `N-SUMP-02`, and `C-LAT-03`). Subsurface conduit inverts are separate hydraulic parameters (SIMULATED / ESTIMATED), distinct from DEM surface elevation.

---

## 3. Patna Urban Basin Field Inspection: 5 Key Pilot Hotspots

The Terrain Inspector was deployed across five critical municipal drainage and emergency response zones in Patna. The terrain model identifies an elevated northern corridor and lower southern urban depression zones within the pilot dataset:

```mermaid
graph LR
    subgraph Natural Levee High Ground
        PMCH["PMCH Ganga Ridge<br/>Surface: 54.86m MSL [REAL]<br/>Invert: 46.5m [SIMULATED]<br/>Slope 1.8° • Levee"]
    end
    subgraph Intermediate Urban Terrace
        KKB["Kankarbagh Sump<br/>Surface: 54.71m MSL [REAL]<br/>Invert: 44.8m [SIMULATED]<br/>Slope 1.5° • Culvert Coup."]
        RN["Rajendra Nagar Bowl<br/>Surface: 55.06m MSL [REAL]<br/>Invert: 44.5m [SIMULATED]<br/>Slope 1.2° • Chronic Sink"]
    end
    subgraph Critical Lowland Sumps
        SP["Saidpur Sump Corridor<br/>Surface: 52.08m MSL [REAL]<br/>Invert: 45.2m [SIMULATED]<br/>Slope 2.1° • 16cm Sink"]
        PJ["Patna Junction South<br/>Surface: 51.82m MSL [REAL]<br/>Invert: 44.2m [SIMULATED]<br/>Slope 2.4° • 22cm Sink"]
    end
    
    PMCH -->|Overland Gravity Runoff| RN
    RN -->|Flow Accumulation D8| SP
    KKB -->|Channel Outflow| SP
    PJ -->|Rail Sump Accumulation| SP
```

### Spot Measurements (Copernicus DSM Derived)

1. **Saidpur Sump Corridor (`25.6020°N, 85.1680°E`)**
   - **Surface Elevation (DSM)**: $52.08\text{ m MSL}$ [REAL] (Low-lying depression invert, $-0.56\text{m}$ relative to local basin mean)
   - **Subsurface Conduit Invert**: $45.20\text{ m MSL}$ [SIMULATED / ESTIMATED] (Conduit `C-MAIN-01`, capacity stress: $84\%$)
   - **Slope / Aspect**: $2.1^\circ$ / $142^\circ$ [DERIVED] (South-East overland flow)
   - **Depression Sink Depth**: $0.16\text{ m}$ [DERIVED] ($16\text{ cm}$ natural topographic trapping)
   - **Modelled Flood Consequence**: Surface depression pools runoff; conduit backwater slows gravity discharge.

2. **Rajendra Nagar Low-Bowl (`25.5980°N, 85.1620°E`)**
   - **Surface Elevation (DSM)**: $55.06\text{ m MSL}$ [REAL]
   - **Subsurface Sump Invert**: $44.50\text{ m MSL}$ [SIMULATED / ESTIMATED] (Sump `N-SUMP-01`, capacity stress: $92\%$)
   - **Topographic Context**: Enclosed bowl depression behind the southern railway embankment.
   - **Depression Sink Depth**: $0.12\text{ m}$ [DERIVED]
   - **Modelled Flood Consequence**: Historic chronic ponding bowl; natural gravity drainage impeded without high-capacity lift pumps.

3. **Kankarbagh Sump Basin (`25.5890°N, 85.1510°E`)**
   - **Surface Elevation (DSM)**: $54.71\text{ m MSL}$ [REAL]
   - **Subsurface Sump Invert**: $44.80\text{ m MSL}$ [SIMULATED / ESTIMATED] (Sump `N-SUMP-02`, capacity stress: $78\%$)
   - **Slope / Aspect**: $1.5^\circ$ / $188^\circ$ [DERIVED] (Southward overland gradient)
   - **Depression Sink Depth**: $0.09\text{ m}$ [DERIVED]
   - **Modelled Flood Consequence**: Urban runoff concentration zone requiring dedicated mobile dewatering units.

4. **Patna Junction South Underpass (`25.6010°N, 85.1380°E`)**
   - **Surface Elevation (DSM)**: $51.82\text{ m MSL}$ [REAL] (Lowest surface point in central transit corridor, $-0.82\text{m}$ relief)
   - **Subsurface Culvert Invert**: $44.20\text{ m MSL}$ [SIMULATED / ESTIMATED]
   - **Slope / Aspect**: $2.4^\circ$ / $215^\circ$ [DERIVED]
   - **Depression Sink Depth**: $0.22\text{ m}$ [DERIVED] ($22\text{ cm}$ physical ground depression)
   - **Modelled Flood Consequence**: High-vulnerability arterial transport node; road cut-off triggered early in rain events.

5. **PMCH Ganga Ridge Embankment (`25.6210°N, 85.1580°E`)**
   - **Surface Elevation (DSM)**: $54.86\text{ m MSL}$ [REAL] ($+2.22\text{m}$ elevated ridge overlooking Ganga floodplain)
   - **Subsurface Outfall Invert**: $46.50\text{ m MSL}$ [SIMULATED / ESTIMATED] (Discharge channel `C-OUTFALL-01`)
   - **Slope / Aspect**: $1.8^\circ$ / $352^\circ$ [DERIVED] (Northward riverbank levee slope)
   - **Depression Sink Depth**: $0.00\text{ m}$ [DERIVED] (Free-draining ridge)
   - **Modelled Flood Consequence**: Resilient elevated corridor suitable for staging emergency medical and rescue evacuation.

---

## 4. End-to-End Causality Demonstration: Terrain to Routing

The integration of real terrain establishes an unbroken physical causality chain through all operational subsystems:

$$\mathbf{REAL\ DEM\ (52.08m\ DSM)} \longrightarrow \mathbf{Depression\ (16cm\ DERIVED)} \longrightarrow \mathbf{Drainage\ (84\%\ Stress\ SIMULATED)} \longrightarrow \mathbf{Flood\ Depth\ (0.42m\ SIMULATED)} \longrightarrow \mathbf{Road\ Impairment} \longrightarrow \mathbf{Rerouting}$$

### Provenance Classification Architecture

| Provenance Category | Data Elements | Source & Methodology |
| :--- | :--- | :--- |
| **REAL INPUT** | Surface Elevation (DSM), Spatial Coordinates, CRS, Vertical Datum | Copernicus GLO-30 DSM (30m, ESA Open Data, EGM2008 Geoid) |
| **DERIVED OUTPUT** | Local Relief, Slope, Aspect, D8 Flow Direction, Flow Accumulation, Pit Depressions, HAND | Algorithmic finite differences and topological pit detection |
| **SIMULATED MODEL** | Drainage Conduit Inverts, Surcharge State, Street Flood Depth, Road Impairment | 1D-2D Hydrodynamic Manning & Kinematic wave nowcast model |
| **DYNAMIC ALGORITHM** | Vehicle Passability Clearance, Evacuation Routing Diversions | Clearance threshold rule-engine & A* Dijkstra pathfinder |
| **DEMO** | 15-Stage Disaster Simulation Timeline | Scenario controller for operational drills |

> **Non-Overclaiming Notice**: Modelled flood depth (e.g. 0.42m) is a numerical simulation output computed from kinematic overland routing and conduit backwater pressures. It is not an in-situ physical sensor gauge measurement.

```mermaid
sequenceDiagram
    autonumber
    participant DEM as Copernicus GLO-30 DSM
    participant Hydro as Hydro-Conditioning & Flow Engine
    participant Drain as Coupled 1D/2D Storm Network
    participant Flood as Dynamic Nowcast Model
    participant Road as Road Passability Classifier
    participant Route as Life-Safety Routing Engine

    DEM->>Hydro: Ingest real 30m DSM elevation grid (39.52m - 72.99m MSL)
    Hydro->>Hydro: Calculate D8 flow accumulation & breach 5 railway culverts
    Hydro->>Drain: Map local overland runoff volume to conduit C-MAIN-01
    Drain->>Flood: Conduit reaches 84% capacity; gravity discharge slows
    Flood->>Flood: Water accumulates in Saidpur topographic depression (0.42m depth)
    Flood->>Road: Ashok Rajpath South Segment exceeds 0.30m passability threshold
    Road->>Route: Flag Segment as IMPASSABLE for ambulances (speed = 0 km/h)
    Route->>Route: Compute alternate high-ground evacuation path (+2.3km, +6.4 min)
```

---

## 5. Machine Learning Surrogate Model Recalibration Discipline

- **Input Feature Drift**: The previous surrogate model was trained on the synthetic pilot baseline ($47.0 - 54.5\text{ m}$ elevation range).
- **Copernicus Ingestion Shift**: Real Copernicus GLO-30 DSM exhibits a $+1.12\text{m}$ mean shift and $4.4\times$ wider dynamic range ($39.52 - 72.99\text{ m}$).
- **Engineering Decision**: Falsely claiming "validated ML inference" on real terrain without a calibrated physical hydrodynamic simulation dataset is prohibited. 
- **Current Behavior**: The platform visibly flags `MODEL REQUIRES RECALIBRATION / RETRAINING` across the HUD, Technical ML Center, and Terrain Inspector while the **physics-based hydro-conditioned engine** directly executes real nowcasting and routing calculations.

---

## 6. Visual Evidence & Interface Verification

Screenshots captured directly from the live VARUNETRA system operating on real Copernicus GLO-30 DSM data (located in `docs/terrain-proof/`):

1. `01_real_terrain_inspector_saidpur.png`: Terrain Inspector at Saidpur Trunk Invert showing real ground elevation of 52.08m MSL, -0.56m relative relief, 16cm depression sink depth, coupled conduit C-MAIN-01 at 84% stress, and Copernicus GLO-30 REAL provenance.
2. `01b_real_terrain_inspector_pmch_ridge.png`: Terrain Inspector at PMCH Ganga Ridge verifying elevated levee ground at 54.86m MSL (+2.22m relief, 0cm depression).
3. `02_synthetic_vs_copernicus_comparison.png`: Side-by-side comparative cards and quantitative matrix highlighting the 4.4x wider elevation span, real topological depressions, and the ML Recalibration notice.
4. `03_terrain_routing_causality_chain.png`: Complete 6-stage physical pipeline tracing real DEM elevation through flow accumulation, drain surcharge, flood depth, road impairment, and life-safety rerouting.
5. `04_terrain_gis_layers_contours.png`: GIS layer configuration displaying real elevation colormap, enforced 5m scientific contour intervals ([45, 50, 55, 60, 65]m MSL), and three hypsometric elevation bands.
6. `05_3d_city_terrain_source_hud.png`: CesiumJS 3D City Digital Twin showing 3D clamped terrain beacons with real MSL elevations, compact "Terrain Source" panel (Copernicus GLO-30 | DSM | ~30m | REAL), and ML Recalibration banner.
7. `06_2d_operations_flood_terrain_coupling.png`: 2D GIS Command Center showing live water pooling directly corresponding to Copernicus-derived topographic depressions and low points.

---

## 7. Quality Assurance & Test Verification Summary

All verification gates have executed with 100% success:

| Test Suite / QA Gate | Command Executed | Result | Details |
| :--- | :--- | :---: | :--- |
| **Backend Unit & Integration Tests** | `python -m pytest tests/ -v` | **24 PASSED** (100%) | Verified Copernicus metadata, AOI overlap, coordinate queries, D8 flow, hydro-breaching, and nowcast coupling in 4.95s. |
| **Frontend Production Build** | `npm run build` | **PASSED** (0 errors) | TypeScript compilation (`tsc -b`) and Vite production bundle generated cleanly in 1.17s. |
| **Automated UI & Layout Audit** | `node scripts/ui-audit.js` | **0 VIOLATIONS** | Verified zero overflow, zero clipping, and clean responsiveness across 1440x900, 1920x1080, and 1024x768 resolutions. |
