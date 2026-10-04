import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Layers,
  MapPin,
  LifeBuoy,
  Building2,
  Droplets,
  Eye,
  EyeOff,
  Navigation,
  AlertTriangle,
  Compass,
  Maximize2,
  Sliders,
} from "lucide-react";
import {
  NowcastTimeStep,
  RoadImpact,
  DrainageStress,
  SOSIncident,
  ShelterHospital,
  MunicipalPump,
  RouteResponse,
} from "../types";

interface GISMapProps {
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
}

export const GISMap: React.FC<GISMapProps> = ({
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer Groups
  const roadLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const drainageLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const floodDepthLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const catchmentLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const sosLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const facilityLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const pumpLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Basemap & Layer Visibility Toggles
  const [basemap, setBasemap] = useState<"osm" | "esri" | "positron" | "dark">("osm");
  const [showRoads, setShowRoads] = useState(true);
  const [showDrainage, setShowDrainage] = useState(true);
  const [showFloodDepth, setShowFloodDepth] = useState(true);
  const [showCatchments, setShowCatchments] = useState(true);
  const [showSOS, setShowSOS] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showPumps, setShowPumps] = useState(true);
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);

  // Center on Patna Pilot Basin
  const PATNA_CENTER: [number, number] = [25.6093, 85.1450];

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: PATNA_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Basemap URLs
    const basemapUrls = {
      osm: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      esri: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      positron: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    };

    tileLayerRef.current = L.tileLayer(basemapUrls.osm, {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Zoom control at top right (compact)
    L.control.zoom({ position: "topright" }).addTo(map);

    // Metric scale bar at bottom left
    L.control.scale({ imperial: false, metric: true, position: "bottomleft" }).addTo(map);

    // Layer groups
    catchmentLayerGroupRef.current = L.layerGroup().addTo(map);
    floodDepthLayerGroupRef.current = L.layerGroup().addTo(map);
    drainageLayerGroupRef.current = L.layerGroup().addTo(map);
    roadLayerGroupRef.current = L.layerGroup().addTo(map);
    sosLayerGroupRef.current = L.layerGroup().addTo(map);
    facilityLayerGroupRef.current = L.layerGroup().addTo(map);
    pumpLayerGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Basemap Switcher Effect
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const basemapUrls = {
      osm: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      esri: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      positron: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    };
    tileLayerRef.current.setUrl(basemapUrls[basemap]);
  }, [basemap]);

  // 3. Render Catchment & Ward Boundaries
  useEffect(() => {
    const group = catchmentLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showCatchments) return;

    const CATCHMENT_ZONES = [
      {
        name: "Rajendra Nagar Lowland Catchment (C-01)",
        poly: [
          [25.597, 85.148],
          [25.608, 85.148],
          [25.608, 85.163],
          [25.597, 85.163],
        ],
        elevation: "46.2m MSL (Low Depression)",
        impervious: "84%",
      },
      {
        name: "Kankarbagh Central Basin (C-02)",
        poly: [
          [25.590, 85.132],
          [25.603, 85.132],
          [25.603, 85.149],
          [25.590, 85.149],
        ],
        elevation: "48.1m MSL",
        impervious: "76%",
      },
      {
        name: "Saidpur Canal Drainage Corridor (C-03)",
        poly: [
          [25.605, 85.150],
          [25.619, 85.150],
          [25.619, 85.166],
          [25.605, 85.166],
        ],
        elevation: "47.5m MSL",
        impervious: "79%",
      },
      {
        name: "Gandhi Maidan - Ganga Riverfront (C-04)",
        poly: [
          [25.612, 85.133],
          [25.625, 85.133],
          [25.625, 85.155],
          [25.612, 85.155],
        ],
        elevation: "51.0m MSL (High Bank)",
        impervious: "68%",
      },
    ];

    CATCHMENT_ZONES.forEach((zone) => {
      const polygon = L.polygon(zone.poly as [number, number][], {
        color: "#64748b",
        weight: 1.2,
        dashArray: "4, 4",
        fillColor: "#0284c7",
        fillOpacity: 0.03,
      });

      polygon.bindTooltip(
        `<strong>${zone.name}</strong><br/>Avg Invert: ${zone.elevation}<br/>Imperviousness: ${zone.impervious}`,
        { sticky: true }
      );
      polygon.addTo(group);
    });
  }, [showCatchments]);

  // 4. Render Flood Inundation Depth Polygons (5 Depth Classes)
  useEffect(() => {
    const group = floodDepthLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showFloodDepth || !timeStep) return;

    const maxDepth = timeStep.max_flood_depth_cm;

    // Synthetic depth zones around known depressions
    const DEPTH_ZONES = [
      // Rajendra Nagar Lowland Bowl (Critical Surcharge)
      {
        bounds: [
          [25.5995, 85.1510],
          [25.6045, 85.1510],
          [25.6045, 85.1590],
          [25.5995, 85.1590],
        ],
        name: "Rajendra Nagar Central Depression",
        depth: maxDepth,
      },
      // Saidpur Trunk Canal Sump
      {
        bounds: [
          [25.6080, 85.1530],
          [25.6130, 85.1530],
          [25.6130, 85.1610],
          [25.6080, 85.1610],
        ],
        name: "Saidpur Culvert Backwater Zone",
        depth: Math.round(maxDepth * 0.75),
      },
      // Kankarbagh Mor Sump
      {
        bounds: [
          [25.5960, 85.1370],
          [25.6010, 85.1370],
          [25.6010, 85.1440],
          [25.5960, 85.1440],
        ],
        name: "Kankarbagh Colony Mor Underpass",
        depth: Math.round(maxDepth * 0.6),
      },
      // PMCH Gate / Ashok Rajpath
      {
        bounds: [
          [25.6165, 85.1480],
          [25.6205, 85.1480],
          [25.6205, 85.1550],
          [25.6165, 85.1550],
        ],
        name: "Ashok Rajpath Medical Corridor",
        depth: Math.round(maxDepth * 0.4),
      },
    ];

    DEPTH_ZONES.forEach((zone) => {
      const d = zone.depth;
      if (d <= 5) return; // negligible

      let fillColor = "#93c5fd";
      let fillOpacity = 0.25;
      let depthBand = "< 10 cm (Minor)";

      if (d > 60) {
        fillColor = "#dc2626";
        fillOpacity = 0.55;
        depthBand = "> 60 cm (Extreme Inundation)";
      } else if (d > 40) {
        fillColor = "#ea580c";
        fillOpacity = 0.48;
        depthBand = "40–60 cm (Severe Surcharge)";
      } else if (d > 20) {
        fillColor = "#f59e0b";
        fillOpacity = 0.40;
        depthBand = "20–40 cm (Moderate Ponding)";
      } else if (d > 10) {
        fillColor = "#60a5fa";
        fillOpacity = 0.32;
        depthBand = "10–20 cm (Caution)";
      }

      const polygon = L.polygon(zone.bounds as [number, number][], {
        color: fillColor,
        weight: 1.5,
        fillColor,
        fillOpacity,
      });

      polygon.bindTooltip(
        `<strong>${zone.name}</strong><br/>Depth Band: <b>${depthBand}</b><br/>Simulated Water Depth: <b>${d} cm</b><br/>Confidence: 90% [Quantile Surrogate]`,
        { sticky: true }
      );
      polygon.addTo(group);
    });
  }, [timeStep, showFloodDepth]);

  // 5. Render Road Network with Operational Passability
  useEffect(() => {
    const group = roadLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showRoads || !roads.length) return;

    roads.forEach((road) => {
      const coords = road.coords.map((c: number[]) => [c[1], c[0]]);
      const depth = road.depth_cm || 0;
      const status = road.status || "OPEN";

      let color = "#15803d"; // Open
      let weight = 4.5;

      if (status === "CAUTION") {
        color = "#b45309";
        weight = 5;
      } else if (status === "RESTRICTED") {
        color = "#ea580c";
        weight = 6;
      } else if (status === "BLOCKED") {
        color = "#b91c1c";
        weight = 7;
      }

      const polyline = L.polyline(coords, {
        color,
        weight,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      });

      polyline.on("click", () => onSelectRoad(road));

      polyline.bindTooltip(
        `<strong>${road.name}</strong> (${road.road_class || "Arterial"})<br/>` +
        `Depth: <b>${depth} cm</b> | Status: <b style="color:${color}">${status}</b><br/>` +
        `Operational Policy: <i>${road.passability_status || (depth > 20 ? "Restricted by threshold" : "Within clearance")}</i>`,
        { sticky: true }
      );

      polyline.addTo(group);
    });
  }, [roads, showRoads, timeStep]);

  // 6. Render Drainage Conduits & Manhole Nodes
  useEffect(() => {
    const group = drainageLayerGroupRef.current;
    if (!group || !drainageData) return;
    group.clearLayers();

    if (!showDrainage) return;

    // Conduits
    (drainageData.conduits || []).forEach((c: any) => {
      const coords = c.coordinates.map((pt: number[]) => [pt[1], pt[0]]);
      const isSurcharged = c.is_surcharged;
      const isBackflow = c.flow_direction_reversed;

      let color = "#0284c7";
      let dashArray: string | undefined = undefined;
      let weight = 3;

      if (isBackflow) {
        color = "#b91c1c";
        dashArray = "5, 6";
        weight = 4;
      } else if (isSurcharged) {
        color = "#ea580c";
        weight = 3.8;
      } else if (c.capacity_utilization_pct > 75) {
        color = "#b45309";
      }

      const line = L.polyline(coords, {
        color,
        weight,
        opacity: 0.85,
        dashArray,
      });

      line.bindTooltip(
        `<strong>${c.name}</strong> [${c.conduit_type || "Box Culvert"}]<br/>` +
        `Capacity Load: <b>${c.capacity_utilization_pct}%</b> | Flow: ${c.current_flow_m3s} m³/s<br/>` +
        `${isBackflow ? '<b style="color:#b91c1c">⚠ REVERSE RIVER BACKFLOW</b>' : isSurcharged ? '<b style="color:#ea580c">SURCHARGED CONDUIT</b>' : 'Gravity Drainage'}`,
        { sticky: true }
      );
      line.addTo(group);
    });

    // Nodes (Manholes, Inlets, Sump, Outfall)
    (drainageData.nodes || []).forEach((n: any) => {
      const isSurcharged = n.is_surcharged;
      const isOutfall = n.node_type === "outfall";
      const isSump = n.node_type === "pump_sump";
      const radius = isOutfall ? 7 : (isSump ? 6 : 4.5);

      const circle = L.circleMarker([n.lat, n.lng], {
        radius,
        fillColor: isSurcharged ? "#b91c1c" : (isOutfall ? "#0f172a" : (isSump ? "#0369a1" : "#0284c7")),
        color: "#ffffff",
        weight: 1.5,
        fillOpacity: 0.95,
      });

      circle.on("click", () => onSelectNode(n));

      circle.bindTooltip(
        `<strong>${n.name}</strong> (${n.node_type})<br/>` +
        `Rim Elev: ${n.rim_elevation_m}m | Invert: ${n.invert_elevation_m}m<br/>` +
        `Hydraulic Grade Line: <b>${n.water_level_m}m MSL</b><br/>` +
        `${isSurcharged ? '<b style="color:#b91c1c">SURCHARGING ONTO STREET</b>' : 'Conduit Head Normal'}`,
        { sticky: true }
      );
      circle.addTo(group);
    });
  }, [drainageData, showDrainage]);

  // 7. Render SOS Incidents
  useEffect(() => {
    const group = sosLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showSOS || !sosList.length) return;

    sosList.forEach((sos) => {
      if (sos.status === "CLOSED" || (sos.status as string) === "RESOLVED") return;

      const isCritical = sos.severity === "CRITICAL";

      const iconHtml = `
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #dc2626;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 10px;
          font-family: var(--font-mono);
        " class="${isCritical ? 'pulse-beacon' : ''}">
          SOS
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-sos-marker",
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([sos.lat, sos.lng], { icon: customIcon });
      marker.on("click", () => onSelectSOS(sos));
      marker.bindTooltip(
        `<strong>SOS ${sos.id}: ${sos.emergency_type}</strong><br/>` +
        `Trapped: <b>${sos.number_of_people} People</b> | Status: <b>${sos.status}</b><br/>` +
        `Location: ${sos.address_hint}`,
        { sticky: true }
      );
      marker.addTo(group);
    });
  }, [sosList, showSOS]);

  // 8. Render Shelters & Hospitals
  useEffect(() => {
    const group = facilityLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showFacilities || !facilities.length) return;

    facilities.forEach((fac) => {
      const isHospital = fac.facility_type === "HOSPITAL";
      const color = isHospital ? "#0284c7" : "#15803d";
      const label = isHospital ? "H" : "S";

      const iconHtml = `
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 4px;
          background: ${color};
          border: 2px solid #ffffff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 700;
          font-size: 11px;
          font-family: var(--font-mono);
        ">
          ${label}
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: "custom-facility-marker",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([fac.lat, fac.lng], { icon });
      marker.bindTooltip(
        `<strong>${fac.name}</strong> [${isHospital ? "Hospital" : "Relief Shelter"}]<br/>` +
        `Available: <b>${fac.available_beds_or_space} / ${fac.capacity}</b><br/>` +
        `Road Passability: <b>${fac.road_passability}</b>`,
        { sticky: true }
      );
      marker.addTo(group);
    });
  }, [facilities, showFacilities]);

  // 9. Render Municipal Pumps
  useEffect(() => {
    const group = pumpLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showPumps || !pumps.length) return;

    pumps.forEach((p) => {
      const isActive = p.status === "ACTIVE" || p.status === "PUMPING";
      const color = isActive ? "#15803d" : "#64748b";

      const iconHtml = `
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${color};
          border: 1.5px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          font-family: var(--font-mono);
        ">
          P
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: "custom-pump-marker",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([p.lat, p.lng], { icon });
      marker.on("click", () => onSelectPump(p));
      marker.bindTooltip(
        `<strong>Pump ${p.id}: ${p.name}</strong><br/>` +
        `Discharge: <b>${p.discharge_capacity_m3h} m³/h</b><br/>` +
        `Status: <b>${p.status}</b> | Location: ${p.location_name}`,
        { sticky: true }
      );
      marker.addTo(group);
    });
  }, [pumps, showPumps]);

  // 10. Render Active Dijkstra Route
  useEffect(() => {
    const group = routeLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!activeRoute) return;

    const coords = activeRoute.geometry.coordinates.map((pt: number[]) => [pt[1], pt[0]]);
    const polyline = L.polyline(coords, {
      color: "#2563eb",
      weight: 5.5,
      opacity: 0.95,
      dashArray: activeRoute.profile_used === "EMERGENCY" ? "7, 5" : undefined,
    });

    polyline.bindTooltip(
      `<strong>Route (${activeRoute.profile_used})</strong><br/>` +
      `Distance: ${activeRoute.distance_km} km | ETA: ${activeRoute.eta_minutes} min<br/>` +
      `Max Flood Depth: <b>${activeRoute.max_flood_depth_encountered_cm} cm</b>`,
      { sticky: true }
    );
    polyline.addTo(group);

    if (mapInstanceRef.current && coords.length > 0) {
      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [35, 35] });
    }
  }, [activeRoute]);

  // Reset Center function
  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(PATNA_CENTER, 14);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#e2e8f0" }}>
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* Floating Top-Right GIS Controls: Basemap & Layer Switchers */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 850,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          alignItems: "flex-end",
        }}
      >
        {/* Main Controls Row */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Reset Extent Button */}
          <button
            onClick={handleResetCenter}
            className="civic-glass-ultra"
            style={{
              padding: "4px 8px",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--ink-700)",
            }}
            title="Reset map view to Patna Pilot Basin"
          >
            <Maximize2 size={12} strokeWidth={1.75} />
            <span>Patna Basin</span>
          </button>

          {/* Basemap Switcher */}
          <select
            value={basemap}
            onChange={(e) => setBasemap(e.target.value as any)}
            className="civic-glass-ultra"
            style={{
              padding: "4px 8px",
              borderRadius: "var(--r-sm)",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--ink-700)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="osm">OpenStreetMap (Ref)</option>
            <option value="esri">Esri Canvas (Municipal)</option>
            <option value="positron">Carto Light</option>
            <option value="dark">Carto Dark (Night Ops)</option>
          </select>

          {/* Layers Toggle Dropdown Trigger */}
          <button
            onClick={() => setShowLayersDropdown(!showLayersDropdown)}
            className={`civic-glass-ultra ${showLayersDropdown ? "civic-btn-active" : ""}`}
            style={{
              padding: "4px 10px",
              color: showLayersDropdown ? "var(--color-rain-base)" : "var(--ink-900)",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            <Layers size={13} strokeWidth={1.75} color={showLayersDropdown ? "var(--color-rain-base)" : "var(--ink-700)"} />
            <span>GIS Layers</span>
          </button>
        </div>

        {/* GIS Layers Dropdown Panel */}
        {showLayersDropdown && (
          <div
            className="civic-glass-strong"
            style={{
              borderRadius: "var(--r-md)",
              padding: "10px 14px",
              width: "220px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              zIndex: 900,
            }}
          >
            <div
              className="eyebrow"
              style={{
                borderBottom: "var(--glass-hairline)",
                paddingBottom: "4px",
                marginBottom: "2px",
              }}
            >
              Toggle GIS Operational Overlays
            </div>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", cursor: "pointer" }}>
              <span>Road Inundation</span>
              <input type="checkbox" checked={showRoads} onChange={(e) => setShowRoads(e.target.checked)} />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", cursor: "pointer" }}>
              <span>Drainage Conduits</span>
              <input type="checkbox" checked={showDrainage} onChange={(e) => setShowDrainage(e.target.checked)} />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", cursor: "pointer" }}>
              <span>Flood Depth Zones</span>
              <input type="checkbox" checked={showFloodDepth} onChange={(e) => setShowFloodDepth(e.target.checked)} />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", cursor: "pointer" }}>
              <span>Catchment / Ward Bounds</span>
              <input type="checkbox" checked={showCatchments} onChange={(e) => setShowCatchments(e.target.checked)} />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", cursor: "pointer" }}>
              <span>Citizen SOS Beacons</span>
              <input type="checkbox" checked={showSOS} onChange={(e) => setShowSOS(e.target.checked)} />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", cursor: "pointer" }}>
              <span>Shelters & Hospitals</span>
              <input type="checkbox" checked={showFacilities} onChange={(e) => setShowFacilities(e.target.checked)} />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", cursor: "pointer" }}>
              <span>Municipal Pumps</span>
              <input type="checkbox" checked={showPumps} onChange={(e) => setShowPumps(e.target.checked)} />
            </label>
          </div>
        )}
      </div>

      {/* Floating North Indicator at Top Left */}
      <div
        className="civic-glass-ultra"
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          zIndex: 850,
          borderRadius: "var(--r-sm)",
          padding: "3px 8px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--ink-700)",
          fontFamily: "var(--font-mono)",
          userSelect: "none",
        }}
      >
        <span style={{ color: "var(--color-critical-text)", fontWeight: 900 }}>▲</span>
        <span>N</span>
      </div>

      {/* Small Clean GIS Map Legend on Bottom Left */}
      <div
        className="civic-glass-soft"
        style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          zIndex: 850,
          borderRadius: "var(--r-sm)",
          padding: "8px 12px",
          fontSize: "11px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          maxWidth: "220px",
          userSelect: "none",
        }}
      >
        <span className="eyebrow" style={{ color: "var(--ink-900)", borderBottom: "var(--glass-hairline)", paddingBottom: "3px" }}>
          GIS Operational Legend
        </span>

        {/* Flood Depth */}
        <div>
          <span className="eyebrow" style={{ fontSize: "10px", color: "var(--ink-600)" }}>
            Flood Depth
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", marginTop: "2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "8px", background: "rgba(47, 111, 181, 0.35)", borderRadius: "1px" }} />
              <span>&lt; 10 cm</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "8px", background: "rgba(47, 111, 181, 0.65)", borderRadius: "1px" }} />
              <span>10–20 cm</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "8px", background: "rgba(183, 121, 31, 0.65)", borderRadius: "1px" }} />
              <span>20–40 cm</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "8px", background: "rgba(194, 65, 12, 0.75)", borderRadius: "1px" }} />
              <span>40–60 cm</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", gridColumn: "span 2" }}>
              <span style={{ width: "10px", height: "8px", background: "var(--color-critical-base)", borderRadius: "1px" }} />
              <span style={{ fontWeight: 600 }}>&gt; 60 cm (Severe)</span>
            </div>
          </div>
        </div>

        {/* Road Status */}
        <div style={{ borderTop: "var(--glass-hairline)", paddingTop: "4px" }}>
          <span className="eyebrow" style={{ fontSize: "10px", color: "var(--ink-600)" }}>
            Road Impact
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <span style={{ width: "8px", height: "3px", background: "var(--color-normal-base)" }} />
              <span>Open</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <span style={{ width: "8px", height: "3px", background: "var(--color-high-base)" }} />
              <span>Restricted</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <span style={{ width: "8px", height: "3px", background: "var(--color-critical-base)" }} />
              <span>Blocked</span>
            </span>
          </div>
        </div>

        {/* Drainage Flow */}
        <div style={{ borderTop: "var(--glass-hairline)", paddingTop: "4px" }}>
          <span className="eyebrow" style={{ fontSize: "10px", color: "var(--ink-600)" }}>
            Drainage Flow
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <span style={{ width: "8px", height: "2px", background: "var(--color-rain-base)" }} />
              <span>Normal</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <span style={{ width: "8px", height: "2px", borderTop: "2px dashed var(--color-critical-base)" }} />
              <span style={{ color: "var(--color-critical-text)" }}>Backflow</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
