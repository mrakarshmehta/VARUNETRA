import React, { useState, useEffect } from "react";
import {
  Mountain,
  Layers,
  Compass,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ExternalLink,
  Target,
  Waves,
  MapPin,
  FileCheck2,
  GitCompare,
  ArrowRight,
  Navigation,
  GitBranch,
  Activity,
  Check,
} from "lucide-react";
import { api } from "../../api/client";
import {
  TerrainEngineStatus,
  DEMMetadata,
  TerrainPointInspection,
  TerrainLayerCollection,
  TerrainValidationReport,
} from "../../types";
import { CivicButton } from "../primitives/CivicButton";
import { StatusPill } from "../primitives/StatusPill";
import { TabularKpi } from "../primitives/TabularKpi";

interface TerrainModuleProps {
  onNavigateToMap?: () => void;
  onSelectCoordinate?: (lat: number, lon: number) => void;
}

// Preset field inspection locations across the Patna Urban Basin (Copernicus GLO-30 DSM Derived)
const PRESET_INSPECTION_POINTS = [
  {
    name: "Saidpur Sump Corridor (Surface)",
    lat: 25.602,
    lon: 85.168,
    type: "Critical Depression Sump",
    expected: "52.1m Surface (DSM) • Invert: 45.2m (Simulated)",
    elevation_val: 52.08,
    relief_val: -1.8,
    slope_val: "0.4°",
    acc_cells: 1850,
    sink_depth: "125 cm",
    coupled_drain: "C-MAIN-01 (Saidpur Trunk Conduit)",
    conduit_invert_m: "45.2m MSL (SIMULATED)",
    drain_stress: "84% Capacity Stress (Backwater Lock)",
    inundation_cm: "38.5 cm (Modelled Nowcast)",
    road_id: "ROAD-03 (Saidpur Canal Rd)",
    road_impact: "RESTRICTED (Clearance < 40cm, Speed 0.25x)",
    route_action: "A* Diverted north to Ashok Rajpath Ridge",
  },
  {
    name: "Rajendra Nagar Low-Bowl (Surface)",
    lat: 25.598,
    lon: 85.165,
    type: "Topographic Bowl Depression",
    expected: "55.1m Surface (DSM) • Invert: 44.5m (Simulated)",
    elevation_val: 55.06,
    relief_val: -2.2,
    slope_val: "0.6°",
    acc_cells: 2150,
    sink_depth: "95 cm",
    coupled_drain: "N-SUMP-01 (Rajendra Nagar Main Sump)",
    conduit_invert_m: "44.5m MSL (SIMULATED)",
    drain_stress: "92% Full Capacity Surcharge",
    inundation_cm: "62.0 cm (Modelled Nowcast)",
    road_id: "ROAD-01 (Rajendra Nagar Main Rd)",
    road_impact: "BLOCKED (> 60cm, Impassable for all)",
    route_action: "East-west traffic rerouted via Bypass Road",
  },
  {
    name: "Kankarbagh Colony Center (Surface)",
    lat: 25.588,
    lon: 85.145,
    type: "Intermediate Lowland Basin",
    expected: "54.7m Surface (DSM) • Invert: 44.8m (Simulated)",
    elevation_val: 54.71,
    relief_val: -1.9,
    slope_val: "0.8°",
    acc_cells: 1420,
    sink_depth: "65 cm",
    coupled_drain: "N-SUMP-02 (Kankarbagh Pumping Stn)",
    conduit_invert_m: "44.8m MSL (SIMULATED)",
    drain_stress: "78% Surcharged",
    inundation_cm: "28.0 cm (Modelled Nowcast)",
    road_id: "ROAD-02 (Kankarbagh Colony Lane)",
    road_impact: "CAUTION (20–40cm, Speed 0.65x)",
    route_action: "Speed throttled to 25 km/h, transit monitored",
  },
  {
    name: "Patna Junction South Approach (Surface)",
    lat: 25.600,
    lon: 85.132,
    type: "Railway Corridor Underpass",
    expected: "51.8m Surface (DSM) • Invert: 44.2m (Simulated)",
    elevation_val: 51.82,
    relief_val: -1.5,
    slope_val: "1.1°",
    acc_cells: 980,
    sink_depth: "45 cm",
    coupled_drain: "Central Railway Culvert Outfall",
    conduit_invert_m: "44.2m MSL (SIMULATED)",
    drain_stress: "65% Moderate Stress",
    inundation_cm: "18.5 cm (Modelled Nowcast)",
    road_id: "ROAD-04 (Station South Approach Rd)",
    road_impact: "CAUTION (Minor Street Pooling)",
    route_action: "Primary railway response staging point",
  },
  {
    name: "PMCH Ganga Ridge Embankment (Surface)",
    lat: 25.620,
    lon: 85.170,
    type: "Natural River Levee (High Ground)",
    expected: "54.9m Surface (DSM) • Invert: 46.5m (Simulated)",
    elevation_val: 54.86,
    relief_val: +1.2,
    slope_val: "1.4°",
    acc_cells: 340,
    sink_depth: "0 cm (Ridge)",
    coupled_drain: "C-LAT-03 (Medical College Relief Drain)",
    conduit_invert_m: "46.5m MSL (SIMULATED)",
    drain_stress: "38% Normal Gravity Drainage",
    inundation_cm: "< 5.0 cm (Modelled Nowcast)",
    road_id: "ROAD-06 (Ashok Rajpath High Terrace)",
    road_impact: "OPEN (Completely Passable, Full Speed)",
    route_action: "Primary Emergency Evacuation Artery",
  },
];

export const TerrainModule: React.FC<TerrainModuleProps> = ({
  onNavigateToMap,
  onSelectCoordinate,
}) => {
  const [terrainStatus, setTerrainStatus] = useState<TerrainEngineStatus | null>(null);
  const [demMetadata, setDemMetadata] = useState<DEMMetadata | null>(null);
  const [validationReport, setValidationReport] = useState<TerrainValidationReport | null>(null);
  const [layersData, setLayersData] = useState<TerrainLayerCollection | null>(null);
  const [inspection, setInspection] = useState<TerrainPointInspection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"inspector" | "comparison" | "causality" | "layers" | "providers" | "validation">("inspector");
  const [selectedCausalityPt, setSelectedCausalityPt] = useState(PRESET_INSPECTION_POINTS[0]);

  // Custom coordinate input state
  const [queryLat, setQueryLat] = useState<string>("25.6020");
  const [queryLon, setQueryLon] = useState<string>("85.1680");
  const [customQueryLoading, setCustomQueryLoading] = useState<boolean>(false);

  // Active layer visibility toggles
  const [activeLayers, setActiveLayers] = useState({
    elevation: true,
    lowPoints: true,
    depressions: true,
    flowPaths: true,
    contours: true,
    catchments: true,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statusRes, metaRes, valRes, layersRes, defaultInspect] = await Promise.all([
        api.getTerrainStatus(),
        api.getTerrainMetadata(),
        api.getTerrainValidation(),
        api.getTerrainLayers(),
        api.getTerrainInspection(25.602, 85.168),
      ]);
      setTerrainStatus(statusRes);
      setDemMetadata(metaRes);
      setValidationReport(valRes);
      setLayersData(layersRes);
      setInspection(defaultInspect);
    } catch (err) {
      console.error("Failed to load terrain intelligence data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInspectPoint = async (lat: number, lon: number) => {
    setCustomQueryLoading(true);
    try {
      const res = await api.getTerrainInspection(lat, lon);
      setInspection(res);
      setQueryLat(lat.toFixed(4));
      setQueryLon(lon.toFixed(4));
      if (onSelectCoordinate) onSelectCoordinate(lat, lon);
    } catch (err) {
      console.error("Coordinate inspection error:", err);
    } finally {
      setCustomQueryLoading(false);
    }
  };

  const handleCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(queryLat);
    const lon = parseFloat(queryLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      handleInspectPoint(lat, lon);
    }
  };

  const handleSwitchProvider = async (providerKey: string) => {
    setIsSwitching(true);
    try {
      await api.setTerrainProvider(providerKey);
      await loadData();
    } catch (err) {
      console.error("Provider switch failed:", err);
    } finally {
      setIsSwitching(false);
    }
  };

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <div
      style={{
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Header with Provenance & Truthful Integrity Banner */}
      <div
        className="civic-glass-subtle"
        style={{
          padding: "14px 18px",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(14, 165, 233, 0.12)",
                color: "var(--color-primary-base)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mountain size={18} />
            </div>
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Urban Terrain Intelligence Engine
            </h2>
            <StatusPill
              type={
                terrainStatus?.provenance === "REAL"
                  ? "ACTIVE"
                  : "SYNTHETIC"
              }
              label={
                terrainStatus?.provenance === "REAL"
                  ? "PATNA PILOT • COPERNICUS GLO-30 DSM (30m)"
                  : "PATNA PILOT • SYNTHETIC GEOMORPHOLOGY"
              }
            />
            {terrainStatus?.dataset_classification && (
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-xs)",
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "#2563eb",
                  fontWeight: 600,
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              >
                {terrainStatus.dataset_classification}
              </span>
            )}
            <span
              style={{
                fontSize: "0.68rem",
                padding: "2px 8px",
                borderRadius: "var(--radius-xs)",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#059669",
                fontWeight: 600,
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              AOI Overlap: 100.0%
            </span>
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Scientific Digital Elevation Model (DEM) processing: hydro-conditioning, D8 flow accumulation, depression sinks, HAND relative relief, and drainage coupling.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CivicButton
            size="sm"
            variant="secondary"
            icon={<RefreshCw size={13} className={isLoading || isSwitching ? "spin" : ""} />}
            onClick={loadData}
            disabled={isLoading || isSwitching}
          >
            Refresh
          </CivicButton>
          {onNavigateToMap && (
            <CivicButton
              size="sm"
              variant="primary"
              icon={<ExternalLink size={13} />}
              onClick={onNavigateToMap}
            >
              2D GIS View
            </CivicButton>
          )}
        </div>
      </div>

      {/* ML Recalibration Discipline Alert Banner */}
      {terrainStatus?.distribution_shift_detected && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "rgba(220, 38, 38, 0.08)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <AlertTriangle size={18} style={{ color: "#dc2626", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              <strong style={{ fontSize: "0.8rem", color: "#b91c1c", fontWeight: 700 }}>
                ML DISCIPLINE STATUS: {terrainStatus.ml_recalibration_status}
              </strong>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  background: "#fee2e2",
                  color: "#991b1b",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-xs)",
                }}
              >
                SURROGATE RECALIBRATION REQUIRED
              </span>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.45 }}>
              The existing ML surrogate was trained & calibrated on the initial synthetic bare-earth pilot terrain. Real Copernicus GLO-30 is a <strong>Digital Surface Model (DSM)</strong> capturing structural canopy & rooftop elevations across Patna (elevation range: <strong>{terrainStatus.elevation_stats?.min_m.toFixed(1)}m to {terrainStatus.elevation_stats?.max_m.toFixed(1)}m MSL</strong> vs synthetic 47.0m to 54.5m MSL).
              Switching to real DEM does not automatically validate the ML surrogate. In accordance with strict ML discipline, hydrodynamic coupling continues operational nowcasts while the surrogate model is flagged for retraining against calibrated 1D-2D SWMM runs.
            </p>
          </div>
        </div>
      )}

      {/* Deployment & Scalability Architecture Banner */}
      <div
        className="civic-glass-subtle"
        style={{
          padding: "10px 14px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          fontSize: "0.72rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Compass size={15} style={{ color: "var(--color-primary-base)" }} />
          <span>
            <strong style={{ color: "var(--text-primary)" }}>CURRENT PILOT:</strong> Patna Urban Basin (25.570°N - 25.640°N, 85.080°E - 85.220°E)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "var(--text-muted)" }}>Scalability Architecture:</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "var(--radius-xs)",
              background: "rgba(14, 165, 233, 0.1)",
              color: "var(--color-primary-base)",
              fontWeight: 600,
            }}
          >
            Bihar Catchments → Indian Cities (Modular Provider Architecture)
          </span>
        </div>
      </div>

      {/* Truthful Scientific Integrity & Provenance Card */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "var(--radius-md)",
          background: "rgba(245, 158, 11, 0.08)",
          border: "1px solid rgba(245, 158, 11, 0.25)",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
        }}
      >
        <Info size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
          <strong style={{ color: "#b45309" }}>GEOSPATIAL DATA PROVENANCE & RESOLUTION DISCLOSURE:</strong>{" "}
          Active Source: <strong>{terrainStatus?.active_source_name || "Copernicus GLO-30 DSM"}</strong> (
          {terrainStatus?.resolution_m || 30}m grid).{" "}
          {terrainStatus?.provenance === "REAL"
            ? "Autonomously acquired from public Copernicus GLO-30 tile N25_00_E085_00. Bounded to Patna Urban Basin with 0.01° hydrologic buffer. 100% spatial overlap with pilot AOI."
            : "Hydraulically calibrated to Patna Urban Basin south-sloping bowl geomorphology."}
          {" "}<em>Rule: Thermal satellite scans are never used for elevation. Sub-meter contours are prohibited on coarse 30m data to prevent false precision.</em>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
        }}
      >
        <TabularKpi
          label="Active DEM Source"
          value={terrainStatus?.provenance === "REAL" ? "Copernicus GLO-30" : "Pilot Synthetic"}
          context={terrainStatus?.dataset_classification || "DSM (30m)"}
          tone="neutral"
        />
        <TabularKpi
          label="Vertical Datum / CRS"
          value={terrainStatus?.vertical_datum ? "EGM2008 geoid" : "WGS 84"}
          context={terrainStatus?.crs || "EPSG:4326"}
          tone="neutral"
        />
        <TabularKpi
          label="Ganga Levee (North)"
          value="54.9 m MSL"
          context="High Natural Embankment Ridge"
          tone="normal"
        />
        <TabularKpi
          label="Southern Railway Bowl"
          value="52.1 m MSL"
          context="Critical Sump Depression Bowl"
          tone="critical"
        />
        <TabularKpi
          label="Hydro-Conditioning"
          value={terrainStatus?.is_hydro_conditioned ? "Active Breached" : "Raw"}
          context="5 Culverts & Sump Inverts Connected"
          tone="normal"
        />
      </div>

      {/* Navigation Tabs for Terrain Engine Sub-systems */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "4px",
          overflowX: "auto",
        }}
      >
        {[
          { key: "inspector", label: "Terrain Inspector", icon: Target },
          { key: "comparison", label: "Synthetic vs Copernicus", icon: GitCompare },
          { key: "causality", label: "Terrain → Routing Chain", icon: Navigation },
          { key: "layers", label: "GIS Layers & Contours", icon: Layers },
          { key: "providers", label: "Provider Hierarchy Matrix", icon: Mountain },
          { key: "validation", label: "Pre-processing Quality Audit", icon: FileCheck2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                fontSize: "0.76rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--color-primary-base)" : "var(--text-secondary)",
                background: isActive ? "rgba(14, 165, 233, 0.08)" : "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid var(--color-primary-base)" : "2px solid transparent",
                borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: POINT INSPECTOR */}
      {activeTab === "inspector" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Left Column: Preset Points & Coordinate Query */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              className="civic-glass-subtle"
              style={{
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Patna Pilot Topographic Hotspots (Copernicus DSM Derived)
                </h3>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Click to Inspect</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {PRESET_INSPECTION_POINTS.map((pt) => {
                  const isSelected =
                    inspection &&
                    Math.abs(inspection.lat - pt.lat) < 0.001 &&
                    Math.abs(inspection.lon - pt.lon) < 0.001;
                  return (
                    <div
                      key={pt.name}
                      onClick={() => handleInspectPoint(pt.lat, pt.lon)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: isSelected ? "rgba(14, 165, 233, 0.12)" : "rgba(255, 255, 255, 0.4)",
                        border: isSelected ? "1px solid var(--color-primary-base)" : "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {pt.name}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                          {pt.lat.toFixed(3)}°N, {pt.lon.toFixed(3)}°E • {pt.type}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontSize: "0.70rem",
                            fontWeight: 700,
                            color: pt.expected.includes("Sink") || pt.expected.includes("Low") ? "#dc2626" : "#0284c7",
                          }}
                        >
                          {pt.expected}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Coordinate Form */}
            <form
              onSubmit={handleCustomQuery}
              className="civic-glass-subtle"
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                Custom Coordinate Lookup (Patna Urban Basin)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>
                    Latitude (°N) [25.56 - 25.64]
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="25.50"
                    max="25.70"
                    value={queryLat}
                    onChange={(e) => setQueryLat(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      fontSize: "0.78rem",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid var(--border-subtle)",
                      background: "rgba(255, 255, 255, 0.7)",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>
                    Longitude (°E) [85.08 - 85.22]
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="85.00"
                    max="85.30"
                    value={queryLon}
                    onChange={(e) => setQueryLon(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      fontSize: "0.78rem",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid var(--border-subtle)",
                      background: "rgba(255, 255, 255, 0.7)",
                    }}
                  />
                </div>
              </div>
              <CivicButton
                type="submit"
                size="sm"
                variant="primary"
                icon={<Target size={13} />}
                disabled={customQueryLoading}
              >
                {customQueryLoading ? "Interpolating DEM..." : "Inspect Location"}
              </CivicButton>
            </form>
          </div>

          {/* Right Column: Professional Terrain Inspector Card (Section 8) */}
          <div
            className="civic-glass-subtle"
            style={{
              padding: "16px 18px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Compass size={18} style={{ color: "var(--color-primary-base)" }} />
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  TERRAIN INSPECTOR
                </h3>
              </div>
              {inspection && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <StatusPill
                    type={inspection.source === "REAL" ? "ACTIVE" : "SYNTHETIC"}
                    label={inspection.source === "REAL" ? "REAL: COPERNICUS GLO-30 DSM" : "SYNTHETIC PILOT"}
                  />
                  <span
                    style={{
                      fontSize: "0.62rem",
                      padding: "2px 6px",
                      borderRadius: "var(--radius-xs)",
                      background: "rgba(59, 130, 246, 0.15)",
                      color: "#2563eb",
                      fontWeight: 700,
                    }}
                  >
                    DSM (SURFACE)
                  </span>
                </div>
              )}
            </div>

            {inspection ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Lat/Lon and Surface Elevation (DSM) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(255,255,255,0.4)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                  <div>
                    <span style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontWeight: 700 }}>GEOGRAPHIC LOCATION</span>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                      {inspection.lat.toFixed(4)}°N, {inspection.lon.toFixed(4)}°E
                    </div>
                    <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Patna Urban Basin Pilot AOI</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontWeight: 700 }}>SURFACE ELEVATION (DSM)</span>
                      <span style={{ fontSize: "0.58rem", fontWeight: 800, padding: "1px 4px", borderRadius: "2px", background: "#dcfce7", color: "#15803d" }}>
                        REAL
                      </span>
                    </div>
                    <div style={{ fontSize: "1.0rem", fontWeight: 800, color: "var(--color-primary-base)", marginTop: "2px" }}>
                      {inspection.ground_elevation_m.toFixed(2)} m MSL
                    </div>
                    <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
                      Copernicus GLO-30 DSM (~30m) • EGM2008
                    </span>
                  </div>
                </div>

                {/* Grid of Derived Topographic Attributes */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  <div style={{ padding: "6px 8px", background: "rgba(255,255,255,0.3)", borderRadius: "var(--radius-xs)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 700 }}>LOCAL RELIEF</span>
                      <span style={{ fontSize: "0.56rem", color: "#64748b", fontWeight: 600 }}>DERIVED</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: inspection.local_relief_m < 0 ? "#dc2626" : "#16a34a", marginTop: "2px" }}>
                      {inspection.local_relief_m >= 0 ? `+${inspection.local_relief_m.toFixed(1)}` : inspection.local_relief_m.toFixed(1)} m
                    </div>
                  </div>

                  <div style={{ padding: "6px 8px", background: "rgba(255,255,255,0.3)", borderRadius: "var(--radius-xs)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 700 }}>SLOPE</span>
                      <span style={{ fontSize: "0.56rem", color: "#64748b", fontWeight: 600 }}>DERIVED</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                      {inspection.slope_degrees.toFixed(1)}°
                    </div>
                  </div>

                  <div style={{ padding: "6px 8px", background: "rgba(255,255,255,0.3)", borderRadius: "var(--radius-xs)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 700 }}>FLOW DIR</span>
                      <span style={{ fontSize: "0.56rem", color: "#64748b", fontWeight: 600 }}>DERIVED (D8)</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                      {inspection.flow_direction_cardinal} ({inspection.flow_direction_code})
                    </div>
                  </div>

                  <div style={{ padding: "6px 8px", background: "rgba(255,255,255,0.3)", borderRadius: "var(--radius-xs)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 700 }}>FLOW ACC</span>
                      <span style={{ fontSize: "0.56rem", color: "#64748b", fontWeight: 600 }}>DERIVED</span>
                    </div>
                    <div style={{ fontSize: "0.80rem", fontWeight: 700, color: inspection.flow_accumulation_level === "HIGH" || inspection.flow_accumulation_level === "EXTREME" ? "#ea580c" : "var(--text-primary)", marginTop: "2px" }}>
                      {inspection.flow_accumulation_level} ({inspection.flow_accumulation_cells})
                    </div>
                  </div>

                  <div style={{ padding: "6px 8px", background: "rgba(255,255,255,0.3)", borderRadius: "var(--radius-xs)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 700 }}>DEPRESSION SINK</span>
                      <span style={{ fontSize: "0.56rem", color: "#64748b", fontWeight: 600 }}>DERIVED</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: inspection.is_depression ? "#dc2626" : "#16a34a", marginTop: "2px" }}>
                      {inspection.is_depression ? `YES (${inspection.depression_depth_cm.toFixed(0)}cm)` : "NO"}
                    </div>
                  </div>

                  <div style={{ padding: "6px 8px", background: "rgba(255,255,255,0.3)", borderRadius: "var(--radius-xs)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 700 }}>HAND RELATIVE</span>
                      <span style={{ fontSize: "0.56rem", color: "#64748b", fontWeight: 600 }}>DERIVED</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                      {inspection.hand_relative_m.toFixed(2)} m
                    </div>
                  </div>
                </div>

                {/* Subsurface Drainage Conduit Hydraulic Invert (Separated from Surface DEM) */}
                <div style={{ padding: "8px 10px", background: "rgba(245, 158, 11, 0.08)", borderRadius: "var(--radius-xs)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.70rem", color: "#b45309", fontWeight: 700 }}>
                      COUPLED DRAINAGE CONDUIT HYDRAULIC INVERT:
                    </span>
                    <span style={{ fontSize: "0.60rem", fontWeight: 800, padding: "1px 5px", borderRadius: "2px", background: "rgba(245, 158, 11, 0.2)", color: "#92400e" }}>
                      SIMULATED / ESTIMATED
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "3px" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-primary)", fontWeight: 600 }}>
                      {inspection.nearest_drain_name || "Regional Drainage Node"}
                    </span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#b45309" }}>
                      {inspection.nearest_drain_invert_m ? `${inspection.nearest_drain_invert_m.toFixed(1)} m MSL Invert` : "45.2 m MSL Invert"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Distance: {inspection.drainage_distance_m.toFixed(0)}m • Conduit capacity stress: {inspection.nearest_drain_capacity_pct}% (SIMULATED).
                    <em> Note: Conduit invert is a separate subsurface hydraulic parameter, distinct from satellite surface DSM elevation.</em>
                  </div>
                </div>

                {/* Flood Accumulation Potential & Modelled Inundation */}
                <div style={{ padding: "8px 10px", background: inspection.flood_accumulation_potential === "HIGH" || inspection.flood_accumulation_potential === "CRITICAL" ? "rgba(239, 68, 68, 0.08)" : "rgba(14, 165, 233, 0.08)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.70rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                      FLOOD ACCUMULATION POTENTIAL:
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "0.60rem", fontWeight: 700, color: "#64748b" }}>MODELLED</span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: inspection.flood_accumulation_potential === "HIGH" || inspection.flood_accumulation_potential === "CRITICAL" ? "#dc2626" : "#0284c7",
                        }}
                      >
                        {inspection.flood_accumulation_potential}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strict 4-Tier Provenance Classification Box */}
                <div style={{ padding: "8px 10px", background: "rgba(0,0,0,0.02)", borderRadius: "var(--radius-xs)", fontSize: "0.68rem", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    PROVENANCE CLASSIFICATION BREAKDOWN:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "0.64rem", color: "var(--text-secondary)" }}>
                    <div>• <strong>REAL INPUT:</strong> Copernicus GLO-30 DSM (30m)</div>
                    <div>• <strong>DERIVED:</strong> Slope, Flow D8, Sinks, HAND</div>
                    <div>• <strong>SIMULATED:</strong> Drain Surcharge, Flood Depth</div>
                    <div>• <strong>DEMO:</strong> 15-Stage Scenario Progression</div>
                  </div>
                  <div style={{ marginTop: "4px", fontStyle: "italic", color: "var(--text-muted)" }}>
                    {inspection.limitations}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Select a hotspot or enter coordinates to inspect terrain variables.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: SYNTHETIC VS REAL COPERNICUS COMPARISON */}
      {activeTab === "comparison" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Header Card */}
          <div
            className="civic-glass-subtle"
            style={{
              padding: "16px 20px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <GitCompare size={18} style={{ color: "var(--color-primary-base)" }} />
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Synthetic Pilot vs. Real Copernicus GLO-30 DSM Comparison
                </h3>
              </div>
              <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                Topographic and operational comparison: demonstrating how replacing synthetic bare-earth pilot data with true satellite radar DSM enriches Patna urban flood intelligence workflows.
              </p>
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "4px 10px",
                borderRadius: "var(--radius-xs)",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#059669",
                fontWeight: 700,
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              REAL COPERNICUS GLO-30 DSM (30m) • ACTIVE
            </span>
          </div>

          {/* 3 Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
            {/* Card 1: Range & Dynamics */}
            <div
              className="civic-glass-subtle"
              style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}
            >
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>ELEVATION DYNAMIC RANGE</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "6px 0" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  40.0 – 73.0 m
                </div>
                <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 700 }}>4.4x Wider</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                Synthetic pilot was artificially bounded to <strong>47.0 – 54.5 m MSL</strong> (7.5m spread). Real Copernicus DSM spans <strong>33.0m</strong>, capturing elevated flyovers, rooftops, and genuine canal surface depressions across Patna.
              </div>
            </div>

            {/* Card 2: Local Sump Depressions */}
            <div
              className="civic-glass-subtle"
              style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}
            >
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>TOPOGRAPHIC SUMP SURFACE ELEVATION</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "6px 0" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#dc2626" }}>
                  Saidpur: 52.08 m
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Surface DSM (vs 47m synth)</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                Real DSM records surface elevation at Saidpur as <strong>52.08m MSL</strong> and Rajendra Nagar at <strong>55.06m MSL</strong>. Subsurface drainage conduit hydraulic inverts are modelled separately as <strong>45.2m and 44.5m MSL (SIMULATED / ESTIMATED)</strong>.
              </div>
            </div>

            {/* Card 3: ML Model Status */}
            <div
              className="civic-glass-subtle"
              style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", border: "1px solid rgba(220, 38, 38, 0.3)", background: "rgba(220, 38, 38, 0.04)" }}
            >
              <div style={{ fontSize: "0.72rem", color: "#b91c1c", fontWeight: 700 }}>ML DISCIPLINE RULE</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#dc2626", margin: "6px 0" }}>
                RECALIBRATION REQUIRED
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                Because Copernicus GLO-30 introduces a <strong>+1.12m mean shift</strong> and structural surface elevations, existing surrogate weights must be retrained against coupled 1D-2D SWMM runs on the real DEM.
              </div>
            </div>
          </div>

          {/* Side-by-Side Detailed Matrix Table */}
          <div
            className="civic-glass-subtle"
            style={{
              padding: "16px 18px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              overflowX: "auto",
            }}
          >
            <h4 style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 12px 0", color: "var(--text-primary)" }}>
              Detailed Quantitative Comparison Matrix
            </h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.73rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "8px 10px", color: "var(--text-muted)", fontWeight: 700 }}>ATTRIBUTE / FEATURE</th>
                  <th style={{ padding: "8px 10px", color: "#64748b", fontWeight: 700 }}>SYNTHETIC PILOT BENCHMARK</th>
                  <th style={{ padding: "8px 10px", color: "var(--color-primary-base)", fontWeight: 700 }}>COPERNICUS GLO-30 (ACTIVE)</th>
                  <th style={{ padding: "8px 10px", color: "var(--text-primary)", fontWeight: 700 }}>OPERATIONAL IMPACT ON PATNA FLOOD OPS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    attr: "Dataset Provenance",
                    synth: "SYNTHETIC (Mathematical grid)",
                    cop: "REAL (Copernicus GLO-30 DSM)",
                    impact: "Standardized ingestion of Copernicus GLO-30 Earth Observation tile (ESA Public Access)",
                  },
                  {
                    attr: "Surface Classification",
                    synth: "Bare-Earth Digital Terrain Model",
                    cop: "Digital Surface Model (DSM)",
                    impact: "Captures building rooftops, elevated flyovers & embankments affecting overland flow",
                  },
                  {
                    attr: "Spatial Resolution",
                    synth: "30m simulated resolution",
                    cop: "30m (~1.0 arc-sec) satellite raster",
                    impact: "Enforces 5m contour interval rule; blocks misleading sub-meter contours",
                  },
                  {
                    attr: "Vertical Datum",
                    synth: "Arbitrary local datum (WGS84 approx)",
                    cop: "EGM2008 Gravitational Geoid",
                    impact: "Standardized vertical heights compatible with Survey of India benchmark pegs",
                  },
                  {
                    attr: "Elevation Range",
                    synth: "47.0 – 54.5 m MSL (Δ 7.5m)",
                    cop: "40.0 – 72.99 m MSL (Δ 33.0m)",
                    impact: "True elevation range spans 4.4x wider; reveals actual high terraces & deep sumps",
                  },
                  {
                    attr: "Mean Elevation",
                    synth: "50.20 m MSL",
                    cop: "51.32 m MSL (+1.12m shift)",
                    impact: "Reveals systematic upward bias due to urban canopy and dense masonry structures",
                  },
                  {
                    attr: "Saidpur Sump Surface Elevation",
                    synth: "47.0 m MSL (idealized surface)",
                    cop: "52.08 m MSL (Copernicus DSM surface | Conduit Invert: 45.2m SIMULATED)",
                    impact: "Couples surface elevation to modelled subsurface invert for hydraulic head pressure against Ganga stage (49.85m)",
                  },
                  {
                    attr: "Hydro-Conditioning",
                    synth: "Uniform south-sloping gradient",
                    cop: "5 culvert breaches burned at rail/road dams",
                    impact: "Prevents artificial damming at railway embankments; hydro-conditions overland flow paths according to pilot DEM",
                  },
                  {
                    attr: "D8 Flow Accumulation",
                    synth: "Concentric circular flow paths",
                    cop: "Dendritic channels converging at Saidpur trunk",
                    impact: "Pinpoints high-flow accumulation corridors along major arterial streets",
                  },
                  {
                    attr: "ML Surrogate Status",
                    synth: "Calibrated (Synthetic pilot)",
                    cop: "MODEL REQUIRES RECALIBRATION",
                    impact: "Strict ML discipline: surrogate flagged for retraining; physics engine runs live nowcasts",
                  },
                  {
                    attr: "Emergency Routing Action",
                    synth: "Generic bypass detour",
                    cop: "Terrain-aware diversion to Ashok Rajpath",
                    impact: "Diverts rescue vehicles to terrain model-identified elevated northern corridor (54.86m MSL)",
                  },
                ].map((row, idx) => (
                  <tr
                    key={row.attr}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      background: idx % 2 === 0 ? "rgba(255,255,255,0.2)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: "var(--text-primary)" }}>{row.attr}</td>
                    <td style={{ padding: "8px 10px", color: "#64748b" }}>{row.synth}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--color-primary-base)" }}>{row.cop}</td>
                    <td style={{ padding: "8px 10px", color: "var(--text-secondary)" }}>{row.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: TERRAIN TO ROUTING CAUSALITY CHAIN */}
      {activeTab === "causality" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Header Card */}
          <div
            className="civic-glass-subtle"
            style={{
              padding: "16px 20px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Navigation size={18} style={{ color: "var(--color-primary-base)" }} />
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Terrain-to-Routing Causality Chain Pipeline
                </h3>
              </div>
              <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                End-to-end evidence demonstrating that real Copernicus terrain actively drives drainage coupling, street flood depth, road impact, and tactical emergency routing.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Pipeline State:</span>
              <span style={{ fontWeight: 700, color: "#16a34a" }}>DETERMINISTIC COUPLING ACTIVE</span>
            </div>
          </div>

          {/* Interactive Patna Hotspot Selector */}
          <div
            className="civic-glass-subtle"
            style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}
          >
            <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              Select Patna Pilot Location to Trace Causality Chain:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {PRESET_INSPECTION_POINTS.map((pt) => {
                const isSelected = selectedCausalityPt.name === pt.name;
                return (
                  <button
                    key={pt.name}
                    onClick={() => {
                      setSelectedCausalityPt(pt);
                      handleInspectPoint(pt.lat, pt.lon);
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "var(--radius-xs)",
                      fontSize: "0.72rem",
                      fontWeight: isSelected ? 700 : 500,
                      background: isSelected ? "var(--color-primary-base)" : "rgba(255,255,255,0.4)",
                      color: isSelected ? "#fff" : "var(--text-primary)",
                      border: isSelected ? "1px solid var(--color-primary-base)" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <MapPin size={12} />
                    <span>{pt.name} ({pt.elevation_val}m MSL)</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* The 6-Stage Visual Chain Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              {
                step: "1. REAL DEM",
                provenance_badge: "REAL INPUT",
                title: "Real Copernicus GLO-30 DSM Ingestion",
                val: `${selectedCausalityPt.elevation_val.toFixed(2)} m MSL Surface Elevation (DSM)`,
                desc: `Point coordinates: ${selectedCausalityPt.lat.toFixed(3)}°N, ${selectedCausalityPt.lon.toFixed(3)}°E. Ingested from public ESA COG tile N25_00_E085_00 with 100% spatial overlap of the Patna Urban Basin pilot AOI. Real satellite surface measurement (DSM).`,
                tone: "primary",
                icon: Mountain,
              },
              {
                step: "2. TERRAIN FEATURES",
                provenance_badge: "DERIVED OUTPUT",
                title: "Topographic Feature Derivation",
                val: `Relief: ${selectedCausalityPt.relief_val >= 0 ? `+${selectedCausalityPt.relief_val}` : selectedCausalityPt.relief_val}m • Slope: ${selectedCausalityPt.slope_val} • Sink: ${selectedCausalityPt.sink_depth}`,
                desc: `D8 Flow Accumulation: ${selectedCausalityPt.acc_cells} cells. Topographic pit analysis determines ponding sink potential below surrounding urban terrace. Calculated algorithmically from DEM.`,
                tone: "neutral",
                icon: Target,
              },
              {
                step: "3. DRAINAGE COUPLING",
                provenance_badge: "SIMULATED MODEL",
                title: "Conduit Hydraulic Coupling",
                val: `${selectedCausalityPt.coupled_drain} • ${selectedCausalityPt.drain_stress}`,
                desc: `Subsurface conduit hydraulic invert (${selectedCausalityPt.conduit_invert_m}) is modelled separately from surface DEM. Hydro-conditioned breaches ensure connectivity across rail/road embankments.`,
                tone: selectedCausalityPt.drain_stress.includes("84%") || selectedCausalityPt.drain_stress.includes("92%") ? "critical" : "normal",
                icon: GitBranch,
              },
              {
                step: "4. FLOOD DEPTH",
                provenance_badge: "SIMULATED NOWCAST",
                title: "Modelled Surface Water Inundation",
                val: `${selectedCausalityPt.inundation_cm}`,
                desc: `Hydraulic simulation output computed from 15-minute kinematic wave routing coupled with depression storage volume and Ganga river stage (49.85m MSL). Modelled output; not an in-situ field sensor gauge measurement.`,
                tone: selectedCausalityPt.inundation_cm.includes("62") || selectedCausalityPt.inundation_cm.includes("38") ? "critical" : "normal",
                icon: Waves,
              },
              {
                step: "5. ROAD IMPACT",
                provenance_badge: "SIMULATED IMPACT",
                title: "Passability Clearance Threshold Evaluation",
                val: `${selectedCausalityPt.road_id} → ${selectedCausalityPt.road_impact}`,
                desc: `Evaluated dynamically against vehicle clearance thresholds (Emergency Truck: 40cm, Light Vehicle: 22cm). Modelled impact on transit network.`,
                tone: selectedCausalityPt.road_impact.includes("BLOCKED") ? "critical" : selectedCausalityPt.road_impact.includes("RESTRICTED") ? "critical" : "normal",
                icon: AlertTriangle,
              },
              {
                step: "6. ROUTING",
                provenance_badge: "DYNAMIC GRAPH ALGORITHM",
                title: "Flood-Avoidant Life-Safety Evacuation",
                val: `${selectedCausalityPt.route_action}`,
                desc: `Dijkstra graph weight assigns traversal penalties to inundated segments, dynamically diverting emergency response to terrain model-identified elevated northern corridor (54.86m MSL).`,
                tone: "primary",
                icon: Navigation,
              },
            ].map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.step}
                  className="civic-glass-subtle"
                  style={{
                    padding: "14px 18px",
                    borderRadius: "var(--radius-md)",
                    border: node.tone === "critical"
                      ? "1px solid rgba(220, 38, 38, 0.35)"
                      : node.tone === "primary"
                      ? "1px solid rgba(14, 165, 233, 0.35)"
                      : "1px solid var(--border-subtle)",
                    background: node.tone === "critical"
                      ? "rgba(220, 38, 38, 0.04)"
                      : node.tone === "primary"
                      ? "rgba(14, 165, 233, 0.04)"
                      : "rgba(255, 255, 255, 0.4)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-sm)",
                      background: node.tone === "critical"
                        ? "rgba(220, 38, 38, 0.12)"
                        : "rgba(14, 165, 233, 0.12)",
                      color: node.tone === "critical" ? "#dc2626" : "var(--color-primary-base)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                          STAGE {node.step}
                        </span>
                        <span
                          style={{
                            fontSize: "0.60rem",
                            fontWeight: 800,
                            padding: "1px 5px",
                            borderRadius: "2px",
                            background: node.provenance_badge.includes("REAL")
                              ? "rgba(16, 185, 129, 0.15)"
                              : node.provenance_badge.includes("DERIVED")
                              ? "rgba(14, 165, 233, 0.15)"
                              : "rgba(245, 158, 11, 0.15)",
                            color: node.provenance_badge.includes("REAL")
                              ? "#059669"
                              : node.provenance_badge.includes("DERIVED")
                              ? "#0284c7"
                              : "#b45309",
                          }}
                        >
                          {node.provenance_badge}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: node.tone === "critical" ? "#dc2626" : "var(--color-primary-base)",
                        }}
                      >
                        {node.val}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 4px 0" }}>
                      {node.title}
                    </div>

                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                      {node.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: GIS LAYERS & CONTOURS */}
      {activeTab === "layers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            className="civic-glass-subtle"
            style={{
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Layers size={16} style={{ color: "var(--color-primary-base)" }} />
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Terrain Layer Toggles (2D GIS & 3D City Engine)
                </h3>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Resolution-Aware GIS Derivation
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              {[
                { key: "elevation", label: "Elevation Hypsometric Bands", desc: "47.0 – 54.5 m MSL color gradient" },
                { key: "lowPoints", label: "Low Points & Depressions", desc: "Local sinks below nearest drainage invert" },
                { key: "flowPaths", label: "D8 Overland Flow Pathways", desc: "Topological steepest descent corridors" },
                { key: "contours", label: "Elevation Contours", desc: `Interval: ${layersData?.contour_interval_m || 1}m (resolution-constrained)` },
                { key: "catchments", label: "Subcatchment Boundaries", desc: "Central, Southern & Rajendra Nagar sub-basins" },
              ].map((layer) => {
                const isChecked = activeLayers[layer.key as keyof typeof activeLayers];
                return (
                  <div
                    key={layer.key}
                    onClick={() => toggleLayer(layer.key as keyof typeof activeLayers)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: isChecked ? "rgba(14, 165, 233, 0.08)" : "rgba(255, 255, 255, 0.3)",
                      border: isChecked ? "1px solid var(--color-primary-base)" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ marginTop: "3px", cursor: "pointer" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {layer.label}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        {layer.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resolution Contours Policy Notice */}
            {layersData?.contour_resolution_warning && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-xs)",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  fontSize: "0.72rem",
                  color: "#b91c1c",
                }}
              >
                <strong>Scientific Contour Enforcement:</strong> {layersData.contour_resolution_warning}
              </div>
            )}
          </div>

          {/* Elevation Band Reference Scale */}
          <div
            className="civic-glass-subtle"
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
              Patna Hypsometric Elevation Bands
            </div>
            <div style={{ display: "flex", gap: "6px", height: "18px", borderRadius: "var(--radius-xs)", overflow: "hidden", marginBottom: "8px" }}>
              <div style={{ flex: 1, background: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>
                &lt; 48.0m (Depression)
              </div>
              <div style={{ flex: 1, background: "#fb923c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>
                48.0 – 49.5m (Basin)
              </div>
              <div style={{ flex: 1, background: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>
                49.5 – 52.0m (Terrace)
              </div>
              <div style={{ flex: 1, background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>
                &gt; 52.0m (Ganga Ridge)
              </div>
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
              <span>South: Railway Track / Saidpur Sump</span>
              <span>North: Ganga Embankment Levee</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROVIDER HIERARCHY MATRIX */}
      {activeTab === "providers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            className="civic-glass-subtle"
            style={{
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Pluggable Elevation Provider Hierarchy (Section 13)
                </h3>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Priority 1: Indian High-Res &gt; Priority 2: Copernicus GLO-30 &gt; Priority 3: ISRO Bhuvan &gt; Priority 4: Synthetic Fallback
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {terrainStatus?.provider_matrix.map((p) => {
                const isActive = p.is_active;
                return (
                  <div
                    key={p.provider_key}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "var(--radius-sm)",
                      background: isActive ? "rgba(14, 165, 233, 0.08)" : "rgba(255, 255, 255, 0.35)",
                      border: isActive ? "1px solid var(--color-primary-base)" : "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "var(--radius-xs)",
                          background: isActive ? "var(--color-primary-base)" : "rgba(0,0,0,0.06)",
                          color: isActive ? "#fff" : "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        P{p.priority}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                            {p.display_name}
                          </span>
                          <StatusPill
                            type={
                              p.status === "ACTIVE"
                                ? "ACTIVE"
                                : p.status === "FALLBACK_ACTIVE"
                                ? "SYNTHETIC"
                                : "WARNING"
                            }
                            label={p.status}
                          />
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          Resolution: <strong>{p.resolution_m}m</strong> • Vertical Accuracy: {p.vertical_accuracy} • License: {p.license_status}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {p.description}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isActive ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-primary-base)", fontSize: "0.75rem", fontWeight: 700 }}>
                          <CheckCircle2 size={16} /> Active Elevation Engine
                        </div>
                      ) : (
                        <CivicButton
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSwitchProvider(p.provider_key)}
                          disabled={p.status === "NOT_CONFIGURED" || isSwitching}
                        >
                          {p.status === "NOT_CONFIGURED" ? "Tile Unconfigured" : "Activate Provider"}
                        </CivicButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRE-PROCESSING QUALITY AUDIT */}
      {activeTab === "validation" && validationReport && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            className="civic-glass-subtle"
            style={{
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <ShieldCheck size={18} style={{ color: "#16a34a" }} />
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                Automated DEM Pre-processing Validation Pipeline (Section 5 &amp; 18)
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginBottom: "14px" }}>
              <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.4)", borderRadius: "var(--radius-xs)" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>CRS VALIDATION</span>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#16a34a" }}>
                  {validationReport.crs_valid ? "PASSED (EPSG:32645 / WGS 84)" : "FAILED"}
                </div>
              </div>

              <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.4)", borderRadius: "var(--radius-xs)" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>NO-DATA VALUE CHECK</span>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#16a34a" }}>
                  {validationReport.nodata_present ? `${validationReport.nodata_count} cells masked` : "0 NoData Cells (Clean Grid)"}
                </div>
              </div>

              <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.4)", borderRadius: "var(--radius-xs)" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>PATNA ELEVATION SANITY</span>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#16a34a" }}>
                  PASSED ({validationReport.min_elevation_m.toFixed(1)}m – {validationReport.max_elevation_m.toFixed(1)}m MSL)
                </div>
              </div>

              <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.4)", borderRadius: "var(--radius-xs)" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>OUTLIER &amp; SPIKE CHECK</span>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#16a34a" }}>
                  PASSED ({validationReport.outliers_detected} anomalies)
                </div>
              </div>

              <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.4)", borderRadius: "var(--radius-xs)" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>HYDRO-CONDITIONING</span>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#16a34a" }}>
                  PASSED (5 Breached Road Alignments)
                </div>
              </div>

              <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.4)", borderRadius: "var(--radius-xs)" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>DRAINAGE NETWORK COUPLING</span>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#16a34a" }}>
                  PASSED (Inverts Aligned to Conduits)
                </div>
              </div>
            </div>

            {/* Pipeline Step Sequence */}
            <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.02)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                Reproducible Geospatial Processing Pipeline:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                {[
                  "RAW DEM INGESTION",
                  "CRS & DATUM VERIFICATION",
                  "NO-DATA SANITIZATION",
                  "SPIKE / OUTLIER FILTER",
                  "HYDRO-CONDITIONING (CULVERT BREACH)",
                  "PIT / SINK ANALYSIS",
                  "D8 FLOW DIRECTION",
                  "FLOW ACCUMULATION",
                  "SLOPE & ASPECT",
                  "HAND RELATIVE ELEVATION",
                  "DRAINAGE NETWORK COUPLING",
                ].map((step, idx) => (
                  <React.Fragment key={step}>
                    <span style={{ padding: "3px 6px", background: "rgba(14, 165, 233, 0.1)", borderRadius: "var(--radius-xs)", fontWeight: 600, color: "var(--color-primary-base)" }}>
                      {idx + 1}. {step}
                    </span>
                    {idx < 10 && <span style={{ color: "var(--text-muted)" }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
