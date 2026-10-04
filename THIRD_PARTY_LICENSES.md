# VARUNETRA 3D Digital Twin — Third-Party Attribution & Licensing

## CesiumJS

- **Library**: CesiumJS (cesium)
- **Version**: 1.145.0
- **License**: Apache License 2.0
- **Source**: https://github.com/CesiumGS/cesium
- **Usage**: 3D globe rendering, terrain visualization, entity-based geographic overlays
- **Copyright**: © Cesium Contributors

## Cesium Widgets

- **Library**: @cesium/widgets
- **License**: Apache License 2.0
- **Source**: https://github.com/CesiumGS/cesium
- **Usage**: Viewer UI controls and info-box panels

## vite-plugin-cesium

- **Library**: vite-plugin-cesium
- **License**: MIT
- **Source**: https://github.com/nshen/vite-plugin-cesium
- **Usage**: Vite build integration for CesiumJS static assets (workers, WASM)

## OpenStreetMap Tiles

- **Provider**: OpenStreetMap Foundation
- **License**: Open Data Commons Open Database License (ODbL)
- **Terms**: https://www.openstreetmap.org/copyright
- **Usage**: Default basemap imagery for both 2D Leaflet and 3D Cesium views
- **Attribution**: "© OpenStreetMap contributors"
- **Note**: No API key required. Free and open for use with attribution.

## Cesium Ion (Optional)

- **Provider**: Cesium GS, Inc.
- **License**: Cesium Ion Terms of Service
- **Terms**: https://cesium.com/legal/terms-of-service/
- **Usage**: Optional photorealistic 3D tiles and Cesium World Terrain
- **Note**: The VARUNETRA application WORKS WITHOUT a Cesium Ion API key.
  When no key is configured, the system falls back to:
  - Ellipsoid terrain (flat WGS84 reference surface)
  - OpenStreetMap imagery tiles
  To enable photorealistic tiles, set the environment variable:
  `VITE_CESIUM_ION_TOKEN=<your-ion-token>`

## ESRI World Light Gray Canvas (Optional)

- **Provider**: Esri / ArcGIS
- **License**: Esri Terms of Use
- **Terms**: https://www.esri.com/en-us/legal/terms/full-master-agreement
- **Usage**: Alternative municipal GIS basemap option in 2D view

## Leaflet

- **Library**: Leaflet
- **Version**: 1.9.4
- **License**: BSD 2-Clause
- **Source**: https://github.com/Leaflet/Leaflet
- **Usage**: 2D operational GIS map rendering

## Lucide React

- **Library**: lucide-react
- **License**: ISC
- **Source**: https://github.com/lucide-icons/lucide
- **Usage**: UI icons throughout the application

---

## God's Eye View — Architectural Inspiration Notice

VARUNETRA's 3D Digital Twin architecture is **inspired by** the open-source
God's Eye View project's concepts:

- CesiumJS globe/terrain integration pattern
- Modular layer architecture
- Camera/navigation controls pattern
- Context-aware map interaction pattern

**VARUNETRA does NOT copy or include:**

- God's Eye View branding, logo, or screenshots
- God's Eye View promotional media
- God's Eye View OSINT intelligence layers
- God's Eye View bundled third-party datasets
- God's Eye View bundled 3D models
- Any code or assets from the God's Eye View repository

VARUNETRA is an independently engineered system with its own identity,
data structures, and implementation.

---

## Synthetic Pilot Geography Disclaimer

All geographic data visualized in VARUNETRA is:

- **SYNTHETIC** — Algorithmically generated for the Patna urban basin pilot
- **SIMULATED** — Based on physics-based hydrological models, not live sensor data
- **NOT LIVE GOVERNMENT DATA** — The application does not claim connection to real IMD, CWC, or municipal telemetry unless explicitly verified and labeled as "REAL"

Data provenance is clearly marked throughout the application as:
`REAL`, `SIMULATED`, `SYNTHETIC`, `DEMO`, or `CACHED`
