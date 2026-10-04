/**
 * CesiumCityView — 3D Urban Flood Digital Twin
 * 
 * Primary 3D visualization component for VARUNETRA.
 * Renders the synthetic Patna urban basin pilot as a 3D interactive scene
 * with flood depth evolution, drainage network, road impact, SOS beacons,
 * shelters, hospitals, pumps, and routing overlays.
 * 
 * ATTRIBUTION:
 *   CesiumJS — Apache 2.0 License
 *   OpenStreetMap tiles — ODbL
 * 
 * PROVENANCE: SYNTHETIC PILOT • PATNA URBAN BASIN
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import {
  initializeCesiumToken,
  createImageryProvider,
  CesiumProviderStatus,
  PATNA_CENTER,
} from "../cesium/cesiumConfig";

import {
  applyCameraPreset,
  flyToLocation,
  constrainCameraToBounds,
  CameraPreset,
} from "../cesium/cesiumCamera";

import { renderFloodEntities } from "../cesium/cesiumFloodLayer";

import {
  renderRoadEntities,
  renderDrainageEntities,
  renderSOSEntities,
  renderFacilityEntities,
  renderPumpEntities,
  renderRouteEntities,
  renderCatchmentEntities,
  renderTerrainLowPointsEntities,
} from "../cesium/cesiumLayers";

import type {
  NowcastTimeStep,
  SOSIncident,
  ShelterHospital,
  MunicipalPump,
  RouteResponse,
  TerrainPointInspection,
} from "../types";
import { api } from "../api/client";

import {
  Eye,
  EyeOff,
  Compass,
  Crosshair,
  RotateCw,
  Map as MapIcon,
  Layers,
  Navigation,
  Droplets,
  AlertTriangle,
  Building2,
  LifeBuoy,
  GitBranch,
  Mountain,
  Target,
  X,
} from "lucide-react";

interface CesiumCityViewProps {
  timeStep: NowcastTimeStep | null;
  roads: any[];
  drainageData: any;
  sosList: SOSIncident[];
  facilities: ShelterHospital[];
  pumps: MunicipalPump[];
  activeRoute: RouteResponse | null;
  onSelectRoad: (road: any) => void;
  onSelectNode: (node: any) => void;
  onSelectSOS: (sos: SOSIncident) => void;
  onSelectPump: (pump: MunicipalPump) => void;
  highlightLayer?: string | null;
}

// Layer visibility toggles
interface LayerVisibility {
  floodDepth: boolean;
  roads: boolean;
  drainage: boolean;
  sos: boolean;
  shelters: boolean;
  pumps: boolean;
  catchments: boolean;
  route: boolean;
  lowPoints: boolean;
}

export const CesiumCityView: React.FC<CesiumCityViewProps> = ({
  timeStep,
  roads,
  drainageData,
  sosList,
  facilities,
  pumps,
  activeRoute,
  onSelectRoad,
  onSelectNode,
  onSelectSOS,
  onSelectPump,
  highlightLayer,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const providerStatusRef = useRef<CesiumProviderStatus | null>(null);

  // DataSource refs for each layer
  const floodDSRef = useRef<Cesium.CustomDataSource | null>(null);
  const roadDSRef = useRef<Cesium.CustomDataSource | null>(null);
  const drainageDSRef = useRef<Cesium.CustomDataSource | null>(null);
  const sosDSRef = useRef<Cesium.CustomDataSource | null>(null);
  const facilityDSRef = useRef<Cesium.CustomDataSource | null>(null);
  const pumpDSRef = useRef<Cesium.CustomDataSource | null>(null);
  const routeDSRef = useRef<Cesium.CustomDataSource | null>(null);
  const catchmentDSRef = useRef<Cesium.CustomDataSource | null>(null);
  const lowPointsDSRef = useRef<Cesium.CustomDataSource | null>(null);

  const [terrainInspection, setTerrainInspection] = useState<TerrainPointInspection | null>(null);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [layers, setLayers] = useState<LayerVisibility>({
    floodDepth: true,
    roads: true,
    drainage: true,
    sos: true,
    shelters: true,
    pumps: true,
    catchments: true,
    route: true,
    lowPoints: true,
  });

  const [providerInfo, setProviderInfo] = useState<CesiumProviderStatus | null>(null);

  // ─── Initialize Viewer ───
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const status = initializeCesiumToken();
    providerStatusRef.current = status;
    setProviderInfo(status);

    try {
      const viewer = new Cesium.Viewer(containerRef.current, {
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        selectionIndicator: true,
        timeline: false,
        animation: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: true,
        msaaSamples: 1,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
      });

      // Terrain: ellipsoid by default (no API key required)
      // If Cesium Ion token is configured, upgrade to world terrain

      // Add OSM imagery if not already set
      try {
        if (viewer.imageryLayers.length === 0 || !status.ionConnected) {
          viewer.imageryLayers.removeAll();
          viewer.imageryLayers.addImageryProvider(
            new Cesium.OpenStreetMapImageryProvider({
              url: "https://tile.openstreetmap.org/",
            })
          );
        }
      } catch {
        // imagery will use defaults
      }

      // Performance optimizations
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0003;
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.showGroundAtmosphere = false;
      try { (viewer.scene as any).fxaa = true; } catch { }
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#e2e8f0");

      // Remove Cesium Ion branding if no token
      try {
        if (!status.ionConnected) {
          const creditContainer = (viewer as any)._cesiumWidget?._creditContainer
            || (viewer.cesiumWidget as any)?.creditContainer;
          if (creditContainer) creditContainer.style.display = "none";
        }
      } catch {
        // credit container may not be accessible
      }

      // Constrain camera
      constrainCameraToBounds(viewer);

      // Initial camera position
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          PATNA_CENTER.longitude,
          PATNA_CENTER.latitude,
          PATNA_CENTER.height
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-60),
          roll: 0,
        },
      });

      // Create data sources for each layer
      const floodDS = new Cesium.CustomDataSource("flood");
      const roadDS = new Cesium.CustomDataSource("roads");
      const drainageDS = new Cesium.CustomDataSource("drainage");
      const sosDS = new Cesium.CustomDataSource("sos");
      const facilityDS = new Cesium.CustomDataSource("facilities");
      const pumpDS = new Cesium.CustomDataSource("pumps");
      const routeDS = new Cesium.CustomDataSource("route");
      const catchmentDS = new Cesium.CustomDataSource("catchments");
      const lowPointsDS = new Cesium.CustomDataSource("low_points");

      viewer.dataSources.add(catchmentDS);
      viewer.dataSources.add(lowPointsDS);
      viewer.dataSources.add(floodDS);
      viewer.dataSources.add(drainageDS);
      viewer.dataSources.add(roadDS);
      viewer.dataSources.add(sosDS);
      viewer.dataSources.add(facilityDS);
      viewer.dataSources.add(pumpDS);
      viewer.dataSources.add(routeDS);

      floodDSRef.current = floodDS;
      roadDSRef.current = roadDS;
      drainageDSRef.current = drainageDS;
      sosDSRef.current = sosDS;
      facilityDSRef.current = facilityDS;
      pumpDSRef.current = pumpDS;
      routeDSRef.current = routeDS;
      catchmentDSRef.current = catchmentDS;
      lowPointsDSRef.current = lowPointsDS;

      viewerRef.current = viewer;

      // Render initial catchments & terrain low points
      renderCatchmentEntities(catchmentDS);
      renderTerrainLowPointsEntities(lowPointsDS);

      // Entity click handler & Surface Terrain Inspector
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement: any) => {
        const picked = viewer.scene.pick(movement.position);
        if (Cesium.defined(picked) && picked.id && picked.id.properties) {
          const props = picked.id.properties;
          const type = props.type?.getValue();

          if (type === "terrain_low_point") {
            const lat = props.lat?.getValue();
            const lon = props.lon?.getValue();
            if (lat && lon) {
              api.getTerrainInspection(lat, lon).then(setTerrainInspection).catch(console.error);
            }
          } else if (type === "sos") {
            const sosId = props.sos_id?.getValue();
            const found = sosList.find((s) => s.id === sosId);
            if (found) onSelectSOS(found);
          } else if (type === "pump") {
            const pumpId = props.pump_id?.getValue();
            const found = pumps.find((p) => p.id === pumpId);
            if (found) onSelectPump(found);
          } else if (type === "road") {
            const roadId = props.road_id?.getValue();
            const found = roads.find((r) => r.id === roadId);
            if (found) onSelectRoad(found);
          } else if (type === "drainage_node") {
            const nodeId = props.node_id?.getValue();
            const allNodes = drainageData?.nodes || [];
            const found = allNodes.find((n: any) => (n.node_or_pipe_id || n.id) === nodeId);
            if (found) onSelectNode(found);
          }
        } else {
          // Click on terrain surface: calculate lat/lon and trigger Terrain Inspector
          const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
          if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const lon = Cesium.Math.toDegrees(cartographic.longitude);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            if (lat >= 25.55 && lat <= 25.68 && lon >= 85.05 && lon <= 85.25) {
              api.getTerrainInspection(lat, lon).then(setTerrainInspection).catch(console.error);
            }
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      return () => {
        handler.destroy();
        viewer.destroy();
        viewerRef.current = null;
      };

    } catch (err) {
      console.error("CesiumCityView initialization failed:", err);
    }
  }, []);

  // ─── Update Flood Layer ───
  useEffect(() => {
    if (!floodDSRef.current) return;
    floodDSRef.current.show = layers.floodDepth;
    if (layers.floodDepth && timeStep) {
      renderFloodEntities(floodDSRef.current, timeStep.max_flood_depth_cm);
    } else {
      floodDSRef.current.entities.removeAll();
    }
    viewerRef.current?.scene.requestRender();
  }, [timeStep, layers.floodDepth]);

  // ─── Update Road Layer ───
  useEffect(() => {
    if (!roadDSRef.current) return;
    roadDSRef.current.show = layers.roads;
    if (layers.roads && roads.length) {
      renderRoadEntities(roadDSRef.current, roads);
    } else {
      roadDSRef.current.entities.removeAll();
    }
    viewerRef.current?.scene.requestRender();
  }, [roads, layers.roads, timeStep]);

  // ─── Update Drainage Layer ───
  useEffect(() => {
    if (!drainageDSRef.current) return;
    drainageDSRef.current.show = layers.drainage;
    if (layers.drainage && drainageData) {
      renderDrainageEntities(drainageDSRef.current, drainageData);
    } else {
      drainageDSRef.current.entities.removeAll();
    }
    viewerRef.current?.scene.requestRender();
  }, [drainageData, layers.drainage]);

  // ─── Update SOS Layer ───
  useEffect(() => {
    if (!sosDSRef.current) return;
    sosDSRef.current.show = layers.sos;
    if (layers.sos && sosList.length) {
      renderSOSEntities(sosDSRef.current, sosList);
    } else {
      sosDSRef.current.entities.removeAll();
    }
    viewerRef.current?.scene.requestRender();
  }, [sosList, layers.sos]);

  // ─── Update Facilities Layer ───
  useEffect(() => {
    if (!facilityDSRef.current) return;
    facilityDSRef.current.show = layers.shelters;
    if (layers.shelters && facilities.length) {
      renderFacilityEntities(facilityDSRef.current, facilities);
    } else {
      facilityDSRef.current.entities.removeAll();
    }
    viewerRef.current?.scene.requestRender();
  }, [facilities, layers.shelters]);

  // ─── Update Pumps Layer ───
  useEffect(() => {
    if (!pumpDSRef.current) return;
    pumpDSRef.current.show = layers.pumps;
    if (layers.pumps && pumps.length) {
      renderPumpEntities(pumpDSRef.current, pumps);
    } else {
      pumpDSRef.current.entities.removeAll();
    }
    viewerRef.current?.scene.requestRender();
  }, [pumps, layers.pumps]);

  // ─── Update Route Layer ───
  useEffect(() => {
    if (!routeDSRef.current) return;
    routeDSRef.current.show = layers.route;
    if (layers.route) {
      renderRouteEntities(routeDSRef.current, activeRoute);
    } else {
      routeDSRef.current.entities.removeAll();
    }
    viewerRef.current?.scene.requestRender();
  }, [activeRoute, layers.route]);

  // ─── Update Catchment Layer ───
  useEffect(() => {
    if (!catchmentDSRef.current) return;
    catchmentDSRef.current.show = layers.catchments;
    viewerRef.current?.scene.requestRender();
  }, [layers.catchments]);

  // ─── Update Low Points Layer ───
  useEffect(() => {
    if (!lowPointsDSRef.current) return;
    lowPointsDSRef.current.show = layers.lowPoints;
    if (layers.lowPoints) {
      renderTerrainLowPointsEntities(lowPointsDSRef.current);
    } else {
      lowPointsDSRef.current.entities.removeAll();
    }
    viewerRef.current?.scene.requestRender();
  }, [layers.lowPoints]);

  // ─── Causality Ribbon Highlight ───
  useEffect(() => {
    if (!viewerRef.current || !highlightLayer) return;

    // Reset all layer opacities first, then highlight the selected one
    const highlightMap: Record<string, keyof LayerVisibility> = {
      SURCHARGE: "drainage",
      ROAD_IMPACT: "roads",
      DEPTH: "floodDepth",
      INUNDATION: "floodDepth",
      ROUTING: "route",
    };

    const layerKey = highlightMap[highlightLayer.toUpperCase()];
    if (layerKey) {
      setLayers((prev) => ({ ...prev, [layerKey]: true }));
    }
  }, [highlightLayer]);

  // ─── Camera Actions ───
  const handleCameraPreset = useCallback((preset: CameraPreset) => {
    if (viewerRef.current) {
      applyCameraPreset(viewerRef.current, preset);
    }
  }, []);

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    if (viewerRef.current) {
      flyToLocation(viewerRef.current, lat, lng);
    }
  }, []);

  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Depth Legend ───
  const depthLegend = [
    { label: "< 10 cm", color: "#93c5fd" },
    { label: "10–20 cm", color: "#60a5fa" },
    { label: "20–40 cm", color: "#f59e0b" },
    { label: "40–60 cm", color: "#ea580c" },
    { label: "> 60 cm", color: "#dc2626" },
  ];

  // ─── Active SOS for fly-to ───
  const activeSOSList = sosList.filter(
    (s) => s.status !== "CLOSED" && (s.status as string) !== "RESOLVED"
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0f172a" }}>
      {/* Cesium Container */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* ─── Operational HUD (Top-Left) ─── */}
      <div
        className="civic-glass-dark"
        style={{
          position: "absolute",
          top: "120px",
          left: "12px",
          zIndex: 100,
          borderRadius: "var(--r-sm)",
          padding: "10px 14px",
          color: "#e2e8f0",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          lineHeight: 1.6,
          minWidth: "220px",
          userSelect: "none",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "12px", color: "#f8fafc", marginBottom: "4px", letterSpacing: "0.03em" }}>
          VARUNETRA · 3D DIGITAL TWIN
        </div>
        <div style={{ fontSize: "10px", color: "#38bdf8", marginBottom: "6px", borderBottom: "1px solid rgba(148,163,184,0.15)", paddingBottom: "4px" }}>
          COPERNICUS GLO-30 DSM · PATNA URBAN BASIN
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
          <span style={{ color: "#94a3b8" }}>CURRENT:</span>
          <span style={{ fontWeight: 700, color: "#38bdf8" }}>
            {timeStep ? (timeStep.offset_minutes === 0 ? "NOW" : `+${timeStep.offset_minutes} MIN`) : "—"}
          </span>

          <span style={{ color: "#94a3b8" }}>FLOOD DEPTH:</span>
          <span style={{ fontWeight: 700, color: (timeStep?.max_flood_depth_cm || 0) > 40 ? "#f87171" : "#e2e8f0" }}>
            {timeStep?.max_flood_depth_cm || 0} cm
          </span>

          <span style={{ color: "#94a3b8" }}>DRAINAGE:</span>
          <span style={{ fontWeight: 700, color: (timeStep?.surcharged_drain_count || 0) > 2 ? "#fb923c" : "#e2e8f0" }}>
            {timeStep ? `${timeStep.surcharged_drain_count} surcharged` : "—"}
          </span>

          <span style={{ color: "#94a3b8" }}>ROADS:</span>
          <span style={{ fontWeight: 700, color: (timeStep?.high_risk_roads_count || 0) > 5 ? "#f87171" : "#e2e8f0" }}>
            {timeStep?.high_risk_roads_count || 0} restricted
          </span>

          <span style={{ color: "#94a3b8" }}>ACTIVE SOS:</span>
          <span style={{ fontWeight: 700, color: activeSOSList.length > 0 ? "#f87171" : "#e2e8f0" }}>
            {String(activeSOSList.length).padStart(2, "0")}
          </span>
        </div>

        {/* Provider status */}
        <div style={{
          marginTop: "6px",
          paddingTop: "4px",
          borderTop: "1px solid rgba(148,163,184,0.15)",
          fontSize: "10px",
          color: "#94a3b8",
        }}>
          Terrain: {providerInfo?.terrain === "CESIUM_WORLD_TERRAIN" ? "Cesium World" : "Ellipsoid"} ·
          Tiles: {providerInfo?.imagery === "CESIUM_ION" ? "Ion" : "OSM"}
        </div>
      </div>

      {/* ─── Compact Terrain Source Panel (Requirement 6 & 7) ─── */}
      <div
        className="civic-glass-dark"
        style={{
          position: "absolute",
          top: "296px",
          left: "12px",
          zIndex: 100,
          borderRadius: "var(--r-sm)",
          padding: "10px 14px",
          color: "#e2e8f0",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          lineHeight: 1.5,
          minWidth: "220px",
          maxWidth: "260px",
          userSelect: "none",
          border: "1px solid rgba(14, 165, 233, 0.3)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Mountain size={13} color="#38bdf8" />
            <strong style={{ fontSize: "11px", color: "#f8fafc", letterSpacing: "0.03em" }}>
              TERRAIN SOURCE
            </strong>
          </div>
          <span
            style={{
              fontSize: "9px",
              fontWeight: 800,
              padding: "1px 6px",
              borderRadius: "2px",
              background: "rgba(16, 185, 129, 0.2)",
              color: "#34d399",
              border: "1px solid rgba(52, 211, 153, 0.4)",
            }}
          >
            REAL
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: "8px", rowGap: "3px", fontSize: "10px" }}>
          <span style={{ color: "#94a3b8" }}>Source:</span>
          <span style={{ fontWeight: 700, color: "#f1f5f9" }}>Copernicus GLO-30</span>

          <span style={{ color: "#94a3b8" }}>Type:</span>
          <span style={{ fontWeight: 700, color: "#38bdf8" }}>DSM</span>

          <span style={{ color: "#94a3b8" }}>Resolution:</span>
          <span style={{ fontWeight: 700, color: "#f1f5f9" }}>~30 m</span>

          <span style={{ color: "#94a3b8" }}>Provenance:</span>
          <span style={{ fontWeight: 700, color: "#34d399" }}>REAL</span>
        </div>

        {/* Mandatory ML Recalibration Banner */}
        <div
          style={{
            marginTop: "8px",
            padding: "5px 8px",
            borderRadius: "2px",
            background: "rgba(220, 38, 38, 0.15)",
            border: "1px solid rgba(220, 38, 38, 0.35)",
            fontSize: "9px",
            display: "flex",
            alignItems: "flex-start",
            gap: "5px",
            lineHeight: 1.35,
          }}
        >
          <AlertTriangle size={12} color="#f87171" style={{ flexShrink: 0, marginTop: "1px" }} />
          <div>
            <strong style={{ color: "#fca5a5", display: "block" }}>
              MODEL REQUIRES RECALIBRATION / RETRAINING
            </strong>
            <span style={{ color: "#cbd5e1", fontSize: "8.5px" }}>
              Distribution shift: DSM elevation range (40–73m) vs synthetic baseline.
            </span>
          </div>
        </div>
      </div>

      {/* ─── Camera Controls (Top-Right) ─── */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {([
          { preset: "TOP_DOWN" as CameraPreset, icon: <Crosshair size={14} />, label: "Top Down" },
          { preset: "TILT_3D" as CameraPreset, icon: <Compass size={14} />, label: "3D Tilt" },
          { preset: "ORBIT" as CameraPreset, icon: <RotateCw size={14} />, label: "Orbit" },
          { preset: "RESET" as CameraPreset, icon: <Navigation size={14} />, label: "Reset" },
        ]).map(({ preset, icon, label }) => (
          <button
            key={preset}
            onClick={() => handleCameraPreset(preset)}
            title={label}
            className="civic-glass-dark"
            style={{
              padding: "6px 10px",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}

        {/* Fly-to shortcuts */}
        {activeSOSList.length > 0 && (
          <button
            onClick={() => handleFlyTo(activeSOSList[0].lat, activeSOSList[0].lng)}
            title="Fly to nearest SOS"
            className="civic-glass-dark"
            style={{
              padding: "6px 10px",
              color: "var(--color-critical-text)",
              border: "1px solid var(--color-critical-border)",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={14} strokeWidth={1.75} />
            <span>Fly to SOS</span>
          </button>
        )}

        {facilities.length > 0 && (
          <button
            onClick={() => handleFlyTo(facilities[0].lat, facilities[0].lng)}
            title="Fly to shelter"
            className="civic-glass-dark"
            style={{
              padding: "6px 10px",
              color: "var(--color-normal-text)",
              border: "1px solid var(--color-normal-border)",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            <Building2 size={14} strokeWidth={1.75} />
            <span>Fly to Shelter</span>
          </button>
        )}

        {pumps.length > 0 && (
          <button
            onClick={() => handleFlyTo(pumps[0].lat, pumps[0].lng)}
            title="Fly to pump"
            className="civic-glass-dark"
            style={{
              padding: "6px 10px",
              color: "#e2e8f0",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            <LifeBuoy size={14} strokeWidth={1.75} />
            <span>Fly to Pump</span>
          </button>
        )}
      </div>

      {/* ─── Layer Panel (Bottom-Right) ─── */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "6px",
        }}
      >
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="civic-glass-dark"
          style={{
            padding: "6px 12px",
            color: "#e2e8f0",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          <Layers size={14} strokeWidth={1.75} color="#38bdf8" />
          <span>3D Layers</span>
        </button>

        {showLayerPanel && (
          <div
            className="civic-glass-dark"
            style={{
              borderRadius: "var(--r-md)",
              padding: "10px 14px",
              minWidth: "200px",
            }}
          >
            <div style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase" as const,
              color: "#94a3b8",
              letterSpacing: "0.04em",
              borderBottom: "1px solid rgba(148,163,184,0.15)",
              paddingBottom: "4px",
              marginBottom: "6px",
            }}>
              3D Operational Overlays
            </div>
            {([
              { key: "floodDepth" as keyof LayerVisibility, label: "Flood Depth", icon: <Droplets size={12} color="#60a5fa" /> },
              { key: "roads" as keyof LayerVisibility, label: "Road Impact", icon: <GitBranch size={12} color="#15803d" /> },
              { key: "drainage" as keyof LayerVisibility, label: "Drainage Network", icon: <GitBranch size={12} color="#0284c7" /> },
              { key: "sos" as keyof LayerVisibility, label: "SOS Beacons", icon: <AlertTriangle size={12} color="#dc2626" /> },
              { key: "shelters" as keyof LayerVisibility, label: "Shelters & Hospitals", icon: <Building2 size={12} color="#15803d" /> },
              { key: "pumps" as keyof LayerVisibility, label: "Municipal Pumps", icon: <LifeBuoy size={12} color="#64748b" /> },
              { key: "catchments" as keyof LayerVisibility, label: "Catchment Bounds", icon: <MapIcon size={12} color="#64748b" /> },
              { key: "route" as keyof LayerVisibility, label: "Active Route", icon: <Navigation size={12} color="#2563eb" /> },
              { key: "lowPoints" as keyof LayerVisibility, label: "Low Points & Sinks", icon: <Mountain size={12} color="#ef4444" /> },
            ]).map(({ key, label, icon }) => (
              <label
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  cursor: "pointer",
                  color: layers[key] ? "#e2e8f0" : "#64748b",
                  padding: "3px 0",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {icon}
                  {label}
                </span>
                <input
                  type="checkbox"
                  checked={layers[key]}
                  onChange={() => toggleLayer(key)}
                  style={{ accentColor: "#38bdf8" }}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ─── 3D Legend (Bottom-Left) ─── */}
      <div
        className="civic-glass-dark"
        style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          zIndex: 100,
          borderRadius: "var(--r-sm)",
          padding: "8px 12px",
          userSelect: "none",
        }}
      >
        <div style={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase" as const,
          color: "#94a3b8",
          letterSpacing: "0.04em",
          marginBottom: "4px",
        }}>
          Flood Depth Legend
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {depthLegend.map((d) => (
            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "14px",
                  height: "10px",
                  background: d.color,
                  borderRadius: "2px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              />
              <span style={{ color: "#cbd5e1", fontSize: "11px" }}>{d.label}</span>
            </div>
          ))}
        </div>

        {/* Road Status Mini-Legend */}
        <div style={{ marginTop: "6px", paddingTop: "4px", borderTop: "1px solid rgba(148,163,184,0.15)" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, marginBottom: "2px" }}>
            Road Impact
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { label: "Open", color: "#15803d" },
              { label: "Restricted", color: "#ea580c" },
              { label: "Blocked", color: "#b91c1c" },
            ].map((r) => (
              <span key={r.label} style={{ display: "flex", alignItems: "center", gap: "3px", color: "#cbd5e1", fontSize: "10px" }}>
                <span style={{ width: "10px", height: "3px", background: r.color }} />
                {r.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 3D Terrain Inspector Popover ─── */}
      {terrainInspection && (
        <div
          className="civic-glass-dark"
          style={{
            position: "absolute",
            bottom: "80px",
            right: "12px",
            width: "310px",
            padding: "12px 14px",
            borderRadius: "var(--r-md)",
            zIndex: 150,
            border: "1px solid rgba(56, 189, 248, 0.3)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Mountain size={15} color="#38bdf8" />
              <strong style={{ fontSize: "12px", color: "#f8fafc" }}>3D TERRAIN INSPECTOR</strong>
              <span
                style={{
                  fontSize: "9px",
                  padding: "1px 5px",
                  borderRadius: "2px",
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  fontWeight: 800,
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                }}
              >
                REAL DSM
              </span>
            </div>
            <button
              onClick={() => setTerrainInspection(null)}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8" }}
            >
              <X size={14} />
            </button>
          </div>
          <div style={{ fontSize: "11px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
            <div>
              <span style={{ color: "#94a3b8", fontSize: "10px" }}>SURFACE ELEVATION (DSM):</span>
              <div style={{ fontWeight: 800, color: "#38bdf8" }}>{terrainInspection.ground_elevation_m.toFixed(2)} m MSL</div>
            </div>
            <div>
              <span style={{ color: "#94a3b8", fontSize: "10px" }}>LOCAL RELIEF (DERIVED):</span>
              <div style={{ fontWeight: 700, color: terrainInspection.local_relief_m < 0 ? "#f87171" : "#4ade80" }}>
                {terrainInspection.local_relief_m >= 0 ? `+${terrainInspection.local_relief_m.toFixed(1)}` : terrainInspection.local_relief_m.toFixed(1)} m
              </div>
            </div>
            <div>
              <span style={{ color: "#94a3b8", fontSize: "10px" }}>SLOPE / FLOW (DERIVED):</span>
              <div style={{ color: "#e2e8f0" }}>{terrainInspection.slope_degrees.toFixed(1)}° • {terrainInspection.flow_direction_cardinal}</div>
            </div>
            <div>
              <span style={{ color: "#94a3b8", fontSize: "10px" }}>DEPRESSION SINK (DERIVED):</span>
              <div style={{ fontWeight: 700, color: terrainInspection.is_depression ? "#f87171" : "#4ade80" }}>
                {terrainInspection.is_depression ? `YES (${terrainInspection.depression_depth_cm.toFixed(0)}cm)` : "NO"}
              </div>
            </div>
          </div>
          <div style={{ fontSize: "10px", color: "#94a3b8", borderTop: "1px solid rgba(148,163,184,0.15)", paddingTop: "6px" }}>
            <div>
              {terrainInspection.lat.toFixed(4)}°N, {terrainInspection.lon.toFixed(4)}°E • Flood Potential (Modelled): <strong style={{ color: "#fb923c" }}>{terrainInspection.flood_accumulation_potential}</strong>
            </div>
            {terrainInspection.nearest_drain_invert_m && (
              <div style={{ marginTop: "3px", color: "#cbd5e1", fontSize: "9.5px" }}>
                Conduit Invert: <b>{terrainInspection.nearest_drain_invert_m.toFixed(1)}m MSL (SIMULATED)</b> · Conduit stress: {terrainInspection.nearest_drain_capacity_pct}%
              </div>
            )}
            <div style={{ fontSize: "9px", color: "#64748b", marginTop: "3px" }}>
              Source: Copernicus GLO-30 DSM (~30m) • Provenance: REAL (Satellite Surface Measurement)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
