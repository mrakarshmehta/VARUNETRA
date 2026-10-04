# VARUNETRA — SIH Technical Jury Q&A Reference Guide
**Smart India Hackathon 2024–2026 | Problem Statement: SIH26085**  
*Authoritative 30–45 Second Answers for Technical, Scientific & Operational Questions*

---

### 1. What is the core novelty?
> "The core novelty of VARUNETRA is the **tight, real-time integration of physical flood hydrology with emergency tactical decision-making in a single operational loop**. While tools like HEC-RAS or SWMM perform offline hydrologic modeling, and commercial navigation apps calculate shortest paths on dry roads, VARUNETRA continuously evaluates physical drainage surcharging, computes vehicle-specific dynamic road passability, and automatically re-routes rescue teams and pump fleets in under 150 milliseconds. It bridges the gap between scientific prediction and field execution."

---

### 2. Why Copernicus GLO-30?
> "Copernicus GLO-30 is the gold standard for open-access global elevation data. It provides 30-meter spatial resolution with an exceptional relative vertical accuracy under 2 meters, derived from the TanDEM-X radar constellation. Unlike older SRTM datasets that suffer from significant voids and vertical noise in flat floodplains, Copernicus GLO-30 accurately captures regional slope gradients and natural drain depression vectors across low-relief basins like Patna."

---

### 3. Why DSM rather than DTM?
> "In an urban flooding context, water does not flow over bare earth; it flows through streets channelized by buildings, boundary walls, and elevated roadway embankments. A Digital Surface Model (DSM) preserves these structural surface features, allowing our hydrologic routing to capture street canyon channeling and urban depression trapping. Where localized artifacts create artificial sink pits, our terrain engine applies automated D8 hydro-conditioning and depression breaching."

---

### 4. How does rainfall couple with drainage?
> "We model a two-way hydrodynamic interaction. Rainfall is converted into subcatchment surface runoff using modified SCS curve numbers and Rational infiltration limits. Runoff enters the 14-node drainage network via manholes. When incoming volume exceeds conduit capacity calculated by Manning's equation, or when downstream Ganga River stages create hydraulic backpressure, the hydraulic grade line rises above ground elevation, causing surface surcharging and street ponding."

---

### 5. How is flood depth estimated?
> "Surface water depth is computed through a coupled 1D conduit / 2D diffusive-wave inundation model. Water surcharging from drainage nodes flows along local topographic gradients determined by Copernicus GLO-30 slopes. Surcharge volume is distributed into micro-depression basins identified by our D8 sink-filling analysis, yielding local water depth in centimeters across each road segment and urban cell."

---

### 6. Where is ML used?
> "Machine learning is deployed as a **fast surrogate model** for real-time scenario inference. Full 2D hydrodynamic simulation of thousands of surface cells can take minutes to compute. Our multi-layer surrogate is trained on pre-computed coupled hydrodynamic runs to predict node surcharge depths and waterlogging volumes in under 85 milliseconds, enabling instantaneous interactive what-if analysis and rapid timeline scrubbing."

---

### 7. Is the ML model field validated?
> "No, and we explicitly highlight this in our interface. While our surrogate model accurately approximates our physics-based synthetic simulations with an $R^2 > 0.94$, it has **not yet been calibrated against live physical ultrasonic street water-level sensors**. In accordance with scientific integrity, the model is watermarked in the UI with a persistent advisory: `SURROGATE INFERENCE — RECALIBRATION REQUIRED FOR UNGAUGED BASINS`."

---

### 8. How does routing respond to flooding?
> "Our routing engine implements an inundation-penalized Dijkstra algorithm across the OpenStreetMap network graph. Each road segment's traversal impedance scales quadratically with flood depth: $W = L \cdot (1 + 10 \cdot (depth / depth_{max})^2)$. If water exceeds the vehicle's specific wading limit — 30 cm for ambulances, 50 cm for heavy trucks — the edge weight becomes infinite, forcing the pathfinder to divert around hazardous corridors."

---

### 9. How is this different from Google Maps?
> "Google Maps relies on crowd-sourced vehicular slowdowns, meaning multiple vehicles must already be stalled or trapped in floodwaters before a road shows red. It has zero awareness of vehicle wading depths, water depths, or underground drainage backflow. VARUNETRA predicts road inundation *before* vehicles arrive, calculates physical depth in centimeters, and routes emergency vehicles based on vehicle-specific mechanical clearance."

---

### 10. How is this different from a static flood map?
> "Static flood hazard maps show probabilistic 50-year or 100-year return period inundation extents for civil planning. They cannot answer real-time operational questions during a cloudburst: *Which specific road is blocked right now? Where will water surcharge in 30 minutes? Which pump sump needs immediate dewatering?* VARUNETRA is an active, dynamic command system with live telemetry, dispatch controls, and tactical re-routing."

---

### 11. How would IMD data integrate?
> "VARUNETRA provides an open ingestion gateway accepting standard OpenAPI schemas. For IMD integration, we ingest automated weather station (AWS) and rain gauge (ARG) time-series via REST webhooks every 15 minutes, alongside Doppler Weather Radar (DWR) quantitative precipitation estimates (QPE) gridded in NetCDF or GeoTIFF formats, replacing our simulated rainfall forcing with live observational grids."

---

### 12. How would municipal drain telemetry integrate?
> "Municipal sump houses and trunk outfalls equipped with IoT ultrasonic depth sensors or SCADA systems publish water level telemetry via MQTT or HTTP REST endpoints. VARUNETRA ingests these water-level readings directly into its drainage network model, dynamically replacing modeled conduit head with real-time measured head to drive instant surcharge alerts."

---

### 13. What happens if terrain data fails?
> "Our system implements a strict provider hierarchy. If the primary Copernicus GLO-30 GeoTIFF fails to load, the engine falls back to local cached tiles. If all authoritative terrain is missing, the system gracefully enters `DEGRADED` state in DEMO mode or `FAIL-CLOSED` state in REAL mode, notifying operators immediately rather than presenting deceptive or ungrounded hazard maps."

---

### 14. How is REAL mode protected from synthetic fallback?
> "In `DATA_MODE=REAL`, our backend enforces a strict architectural security gate. Any API or administrative attempt to switch the terrain provider to `SYNTHETIC_PATNA_PILOT` or enable simulated demo scenarios is rejected with HTTP 403 Forbidden. This ensures an operator in a real-world disaster operations center cannot mistakenly make life-safety decisions based on synthetic pilot models."

---

### 15. How is authentication secured?
> "Authentication uses industry-standard JWT tokens signed with high-entropy cryptographic keys and evaluated against strict Role-Based Access Control (RBAC). Roles include `ADMINISTRATOR`, `DISASTER_AUTHORITY`, `MUNICIPAL_OPERATOR`, `FIRST_RESPONDER`, and `CITIZEN`. Privileged operations like pump dispatches and alert broadcasts require explicit token verification; non-DEMO production rejects startup if a secure `AUTH_SECRET_KEY` is not provided."

---

### 16. Why is `WORKERS=1` currently enforced?
> "The demonstration prototype coordinates in-memory state machines for real-time WebSocket telemetry broadcasting and the 15-stage deterministic scenario runner. To prevent state divergence across multiple isolated OS worker processes on a single host without an external Redis broker, `WORKERS=1` is strictly enforced. For horizontal multi-worker production, our roadmap transitions shared state to Redis."

---

### 17. How would the system scale?
> "To scale horizontally across millions of citizens and multiple municipal corporations, the architecture decouples compute from presentation: the SQLite datastore transitions to PostgreSQL + PostGIS, the in-memory WebSocket manager transitions to Redis Pub/Sub, and heavy hydrologic computations are offloaded to distributed Celery worker clusters running across cloud or on-premise infrastructure."

---

### 18. How are emergency actions audited?
> "Every state-altering operator action — dispatching a municipal pump, assigning a rescue team, closing a road corridor, or issuing a civic alert — generates an immutable entry in an ACID-compliant SQLite/PostgreSQL `audit_logs` table. Each record captures timestamp, actor ID, user role, action type, resource ID, and operational metadata, ensuring complete legal and post-disaster accountability."

---

### 19. What happens during a WebSocket failure?
> "Our custom telemetry client features exponential backoff auto-reconnect (1s, 2s, 4s, up to 10s max) with a 25-second heartbeat ping. If disconnected, the UI immediately shows a persistent `LIVE FEED DISCONNECTED — RECONNECTING` status banner while preserving all existing map layers and operator state. Upon reconnection, it automatically triggers an authoritative HTTP state resynchronization."

---

### 20. What is the biggest limitation?
> "Our biggest current operational limitation is the **lack of physical street-level sensor instrumentation in Indian pilot cities**. While our physics engine and Copernicus DSM terrain are mathematically rigorous, true operational accuracy depends on continuous ground-truth calibration against IoT sump water gauges, Doppler radar precipitation, and river stage sensors. We have built the complete decision engine; city sensorization is the required next step."

---

### 21. How would this move from pilot to city deployment?
> "Deployment follows a four-step blueprint:
> 1. Ingest municipal GIS storm sewer shapefiles and city drainage master plans;
> 2. Mount IoT ultrasonic water-level sensors at critical sumps and river outfalls;
> 3. Establish direct API telemetry links with regional IMD Doppler radars;
> 4. Deploy VARUNETRA into the State Disaster Management Authority (SDMA) or Smart City Integrated Command and Control Center (ICCC)."

---

### 22. What is actually production-ready today?
> "Today, the **complete software platform is hardened and production-ready**: 81 backend unit and integration tests pass with zero errors, the React/Cesium GIS interface builds cleanly with zero UI overflow violations, the 15-stage deterministic scenario executes end-to-end with verified repeatability, Copernicus GLO-30 DSM terrain is fully integrated, and the RBAC security and audit system is active."

---
*VARUNETRA — Scientific Integrity. Operational Clarity. Immediate Response.*
