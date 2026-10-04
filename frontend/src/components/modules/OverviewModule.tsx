import React, { useState } from "react";
import {
  AlertTriangle,
  LifeBuoy,
  Waves,
  Droplets,
  Navigation,
  ArrowUpRight,
  Mountain,
  Clock,
  GitFork,
  CloudRain,
  Car,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Info,
  Globe,
  Map as MapIcon,
  Compass,
  ArrowRight,
  Zap,
  FileText,
} from "lucide-react";
import {
  NowcastTimeStep,
  SOSIncident,
  Alert,
  MunicipalPump,
  ShelterHospital,
} from "../../types";
import { CausalityPipelineRibbon } from "../CausalityPipelineRibbon";
import { CivicButton, StatusPill, TabularKpi } from "../primitives";
import { VarunetraLogo } from "../VarunetraLogo";

interface OverviewModuleProps {
  currentStep: NowcastTimeStep | null;
  sosList: SOSIncident[];
  alerts: Alert[];
  pumps: MunicipalPump[];
  facilities: ShelterHospital[];
  onNavigateToModule: (moduleKey: any) => void;
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({
  currentStep,
  sosList,
  alerts,
  pumps,
  facilities,
  onNavigateToModule,
}) => {
  const [selectedTimelineMin, setSelectedTimelineMin] = useState<number>(0);

  const activeSOS = sosList.filter(
    (s) => s.status !== "CLOSED" && (s.status as string) !== "RESOLVED"
  );
  const activePumps = pumps.filter(
    (p) => p.status === "ACTIVE" || (p.status as string) === "PUMPING"
  );
  const availableShelters = facilities.filter(
    (f) => f.facility_type === "RELIEF_SHELTER" && f.available_beds_or_space > 0
  );

  const nowcastHorizon = [
    { offset: 0, label: "Now", rainfall: "82.4 mm/h", maxDepth: "122.9 cm", risk: "CRITICAL" },
    { offset: 15, label: "+15m", rainfall: "95.0 mm/h", maxDepth: "135.2 cm", risk: "CRITICAL" },
    { offset: 30, label: "+30m", rainfall: "68.2 mm/h", maxDepth: "118.4 cm", risk: "HIGH" },
    { offset: 60, label: "+60m", rainfall: "42.0 mm/h", maxDepth: "94.6 cm", risk: "HIGH" },
    { offset: 90, label: "+90m", rainfall: "26.5 mm/h", maxDepth: "72.1 cm", risk: "WARNING" },
    { offset: 120, label: "+120m", rainfall: "15.0 mm/h", maxDepth: "52.3 cm", risk: "WARNING" },
    { offset: 180, label: "+180m", rainfall: "4.8 mm/h", maxDepth: "28.5 cm", risk: "NORMAL" },
  ];

  const currentTimelinePoint =
    nowcastHorizon.find((h) => h.offset === selectedTimelineMin) || nowcastHorizon[0];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-5)",
        maxWidth: "1440px",
        margin: "0 auto",
        paddingBottom: "48px",
      }}
    >
      {/* =========================================================================
          HERO BANNER — Authoritative Urban Operations Command
          ========================================================================= */}
      <section
        className="civic-glass"
        style={{
          padding: "var(--space-5) var(--space-6)",
          borderRadius: "var(--r-xl)",
          position: "relative",
          overflow: "hidden",
          border: "var(--glass-border)",
          boxShadow: "var(--shadow-2)",
        }}
      >
        {/* Subtle Background Geospatial Grid Graphic */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "420px",
            height: "100%",
            opacity: 0.12,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 75% 35%, #0284c7 0%, transparent 65%), linear-gradient(135deg, rgba(2,132,199,0.3) 0%, transparent 70%)",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-4)", position: "relative", zIndex: 2 }}>
          <div style={{ maxWidth: "860px" }}>
            {/* National SIH Meta Line */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
              <VarunetraLogo size={28} showWordmark={true} wordmarkSubtitle="" />
              <div style={{ height: "14px", width: "1px", background: "var(--ink-600)", opacity: 0.2 }} />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink-700)",
                  background: "rgba(15, 23, 42, 0.05)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: "var(--glass-hairline)",
                }}
              >
                SIH26085 • Ministry of Earth Sciences
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--ink-600)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Team Singularity@ · Patna Urban Basin Pilot
              </span>
            </div>

            {/* Core Mission Headline */}
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--ink-900)",
                lineHeight: 1.2,
                marginTop: "4px",
              }}
            >
              Real-time insights. Smarter decisions. Safer cities.
            </h1>

            <p
              style={{
                fontSize: "13.5px",
                color: "var(--ink-700)",
                marginTop: "8px",
                lineHeight: 1.55,
                maxWidth: "800px",
              }}
            >
              Integrating real <b>Copernicus GLO-30 DSM surface elevation</b>, 1D/2D drainage hydraulics, and atmospheric hyetograph telemetry to deliver dynamic <b>0–180 minute street-level flood nowcasting</b>, automated routing bypasses, and coordinated emergency response.
            </p>

            {/* Scientific Chain Pipeline Micro-Strip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "12px",
                flexWrap: "wrap",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "var(--ink-600)",
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>HYDRO-CAUSAL CHAIN:</span>
              <span>Rainfall</span>
              <span>→</span>
              <span>Runoff</span>
              <span>→</span>
              <span>Drainage Load</span>
              <span>→</span>
              <span>Surcharge / Backflow</span>
              <span>→</span>
              <span>Inundation</span>
              <span>→</span>
              <span>Road Impact</span>
              <span>→</span>
              <span>Routing</span>
            </div>
          </div>

          {/* Action CTAs & Operational Telemetry Pill */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <CivicButton
                variant="primary"
                size="md"
                onClick={() => onNavigateToModule("map")}
                icon={<MapIcon size={14} strokeWidth={1.75} />}
              >
                View Live Map
              </CivicButton>
              <CivicButton
                variant="secondary"
                size="md"
                onClick={() => onNavigateToModule("terrain")}
                icon={<Mountain size={14} strokeWidth={1.75} />}
              >
                Explore Terrain
              </CivicButton>
              <CivicButton
                variant="secondary"
                size="md"
                onClick={() => onNavigateToModule("nowcast")}
                icon={<Clock size={14} strokeWidth={1.75} />}
              >
                0–180m Nowcast
              </CivicButton>
            </div>

            {/* Pilot Geography Coordinate Badge */}
            <div
              className="civic-glass-soft"
              style={{
                padding: "6px 12px",
                borderRadius: "var(--r-sm)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0284c7" }} />
              <span>PATNA URBAN BASIN: [25.570°N, 85.080°E – 25.640°N, 85.220°E]</span>
              <span style={{ color: "var(--color-real-text)", fontWeight: 700 }}>COPERNICUS GLO-30 DSM</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HIERARCHY 1: CURRENT FLOOD SITUATION (Live Situation Board & Critical Alerts)
          ========================================================================= */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {/* Critical Advisory Banner if active */}
        {alerts.length > 0 && (
          <div
            className="civic-glass-soft"
            style={{
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--color-critical-border)",
              background: "var(--color-critical-fill)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <AlertTriangle size={20} strokeWidth={1.75} color="var(--color-critical-text)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--color-critical-text)" }}>
                  {alerts[0].title}
                </div>
                <div className="text-xs" style={{ color: "var(--color-critical-text)", opacity: 0.95, marginTop: "2px" }}>
                  {alerts[0].message} · <b className="font-mono">Lead Time: {alerts[0].lead_time_min} min</b> · Affected Sector: Saidpur–Kankarbagh Basin
                </div>
              </div>
            </div>
            <StatusPill type="CRITICAL" label={alerts[0].is_draft ? "DRAFT ADVISORY" : "OFFICIAL ADVISORY"} size="sm" />
          </div>
        )}

        {/* Live Situation KPIs */}
        <div
          className="civic-glass"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
          }}
        >
          <TabularKpi
            label="Peak Modelled Flood Depth"
            value={currentStep?.max_flood_depth_cm || 122.9}
            unit="cm"
            context="SIMULATED — NOWCAST MODEL OUTPUT"
            trend="up"
            tone="critical"
            className="glass-hairline-right"
          />
          <TabularKpi
            label="Active Inundation Area"
            value={currentStep?.active_inundation_area_sqkm || 2.45}
            unit="km²"
            context="Derived from depression ponding & runoff"
            trend="up"
            tone="rain"
            className="glass-hairline-right"
          />
          <TabularKpi
            label="Restricted Road Corridors"
            value={currentStep?.high_risk_roads_count || 10}
            unit="segments"
            context="Depth penalty routing actively bypassing"
            tone="high"
            className="glass-hairline-right"
          />
          <TabularKpi
            label="Surcharged Conduit Nodes"
            value={currentStep?.surcharged_drain_count || 8}
            unit="nodes"
            context="Ganga outfall backflow stage at 49.85m"
            trend="up"
            tone="warning"
            className="glass-hairline-right"
          />
          <TabularKpi
            label="Active Citizen SOS"
            value={activeSOS.length}
            unit="incidents"
            context={activeSOS.length > 0 ? "SDRF boat crews dispatched" : "All emergency requests cleared"}
            tone={activeSOS.length > 0 ? "critical" : "normal"}
          />
        </div>
      </section>

      {/* Causality Pipeline Ribbon Interlock */}
      <CausalityPipelineRibbon
        currentStep={currentStep}
        onNavigateToModule={onNavigateToModule}
      />

      {/* =========================================================================
          HIERARCHY 2 & 3: LIVE MAP PORTAL + 0–180 MIN NOWCAST HORIZON
          ========================================================================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: "var(--space-4)" }}>
        {/* HIERARCHY 2: Live Map & Dual-Engine Geospatial Interface */}
        <div
          className="civic-glass"
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderRadius: "var(--r-lg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "var(--space-3)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MapIcon size={16} color="var(--color-rain-base)" />
                <h3 style={{ fontSize: "14px", fontWeight: 700 }}>Live Command GIS & 3D Digital Twin</h3>
              </div>
              <StatusPill type="NORMAL" label="DUAL-ENGINE ACTIVE" size="sm" />
            </div>
            <p className="text-xs" style={{ color: "var(--ink-700)", lineHeight: 1.5 }}>
              Seamlessly switch between <b>2D Leaflet tactical operations</b> and <b>CesiumJS 3D City Digital Twin</b>. Fully coupled to Copernicus DSM terrain slope, flow accumulation streamlines, and stormwater surcharge nodes.
            </p>
          </div>

          {/* Map Layer Capabilities Badges */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              "Real Copernicus DSM (30m)",
              "D8 Flow Streamlines",
              "1D Conduit Stress",
              "Street Inundation",
              "Dijkstra Evacuation Routes",
              "SDRF Rescue Assets",
            ].map((layer, idx) => (
              <span
                key={idx}
                className="font-mono text-micro"
                style={{
                  background: "rgba(15, 23, 42, 0.05)",
                  color: "var(--ink-700)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: "var(--glass-hairline)",
                }}
              >
                {layer}
              </span>
            ))}
          </div>

          {/* Quick Launch Buttons */}
          <div style={{ display: "flex", gap: "var(--space-2)", paddingTop: "8px", borderTop: "var(--glass-hairline)" }}>
            <CivicButton
              variant="primary"
              size="md"
              onClick={() => onNavigateToModule("map")}
              icon={<MapIcon size={14} strokeWidth={1.75} />}
            >
              Open 2D Operations Map
            </CivicButton>
            <CivicButton
              variant="secondary"
              size="md"
              onClick={() => onNavigateToModule("map")}
              icon={<Globe size={14} strokeWidth={1.75} />}
            >
              Launch 3D City Twin
            </CivicButton>
          </div>
        </div>

        {/* HIERARCHY 3: 0–180 Min Nowcast Timeline & Drivers */}
        <div
          className="civic-glass"
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderRadius: "var(--r-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={16} color="var(--color-rain-base)" />
                <h3 style={{ fontSize: "14px", fontWeight: 700 }}>0–180 Minute Nowcast Forecast</h3>
              </div>
              <span className="text-micro" style={{ color: "var(--ink-600)" }}>
                SIMULATED — NOWCAST MODEL OUTPUT (15-min intervals)
              </span>
            </div>
            <CivicButton
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToModule("nowcast")}
              icon={<ArrowRight size={12} />}
            >
              Details
            </CivicButton>
          </div>

          {/* Nowcast Time Horizon Stepper */}
          <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "2px" }}>
            {nowcastHorizon.map((pt) => {
              const isSelected = selectedTimelineMin === pt.offset;
              return (
                <div
                  key={pt.offset}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTimelineMin(pt.offset)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedTimelineMin(pt.offset);
                    }
                  }}
                  className="civic-glass-soft"
                  style={{
                    flex: "1 0 auto",
                    padding: "6px 8px",
                    borderRadius: "var(--r-sm)",
                    border: `1px solid ${isSelected ? "var(--color-rain-base)" : "rgba(15, 23, 42, 0.08)"}`,
                    background: isSelected ? "var(--color-rain-fill)" : "rgba(255, 255, 255, 0.45)",
                    cursor: "pointer",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  <span className="font-mono" style={{ fontSize: "11px", fontWeight: isSelected ? 800 : 600, color: isSelected ? "var(--color-rain-text)" : "var(--ink-700)" }}>
                    {pt.label}
                  </span>
                  <span className="font-mono text-micro" style={{ color: pt.risk === "CRITICAL" ? "var(--color-critical-text)" : "var(--ink-600)" }}>
                    {pt.maxDepth}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected Step Telemetry Summary */}
          <div
            className="civic-glass-soft"
            style={{
              padding: "10px 12px",
              borderRadius: "var(--r-sm)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
            }}
          >
            <div>
              <span className="font-mono" style={{ fontWeight: 700, color: "var(--ink-900)" }}>
                Horizon: {currentTimelinePoint.label}
              </span>
              <div className="text-micro" style={{ color: "var(--ink-600)" }}>
                Precipitation Forcing: {currentTimelinePoint.rainfall}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="font-mono" style={{ fontWeight: 700, color: currentTimelinePoint.risk === "CRITICAL" ? "var(--color-critical-text)" : "var(--color-warning-text)" }}>
                Peak Depth: {currentTimelinePoint.maxDepth}
              </div>
              <span className="text-micro" style={{ color: "var(--ink-600)" }}>Modelled Low-Point Sinks</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HIERARCHY 4: TERRAIN + DRAINAGE INTELLIGENCE (Major Differentiator)
          ========================================================================= */}
      <section
        className="civic-glass"
        style={{
          padding: "var(--space-5)",
          borderRadius: "var(--r-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Mountain size={18} color="var(--color-real-base)" />
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                Terrain Intelligence Engine — Copernicus GLO-30 DSM
              </h3>
              <StatusPill type="NORMAL" label="REAL SATELLITE INPUT" size="sm" />
            </div>
            <p className="text-xs" style={{ color: "var(--ink-700)", marginTop: "4px", maxWidth: "920px" }}>
              VARUNETRA ingests real <b>Copernicus GLO-30 DSM surface elevation</b> across Patna Urban Basin. The terrain pipeline extracts finite-difference slope gradients, D8 flow accumulation, morphological depression sinks, and Height Above Nearest Drainage (HAND) to replace flat-world assumptions.
            </p>
          </div>

          <CivicButton
            variant="primary"
            size="md"
            onClick={() => onNavigateToModule("terrain")}
            icon={<ArrowUpRight size={14} strokeWidth={1.75} />}
          >
            Open Terrain Inspector
          </CivicButton>
        </div>

        {/* 4-Tier Provenance Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-3)" }}>
          {/* REAL INPUT */}
          <div
            className="civic-glass-soft"
            style={{
              padding: "12px 14px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--color-real-border)",
              background: "var(--color-real-fill)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span className="font-mono text-micro" style={{ fontWeight: 700, color: "var(--color-real-text)" }}>
                [REAL INPUT]
              </span>
              <span className="font-mono text-micro" style={{ color: "var(--color-real-text)" }}>30m WGS84</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--ink-900)" }}>
              Surface Elevation (DSM)
            </div>
            <p className="text-micro" style={{ color: "var(--ink-700)", marginTop: "4px", lineHeight: 1.4 }}>
              Active Copernicus GLO-30 DSM representing surface canopy and urban structures. Absolute vertical accuracy &lt;4m (90% LEA).
            </p>
          </div>

          {/* DERIVED OUTPUT */}
          <div
            className="civic-glass-soft"
            style={{
              padding: "12px 14px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--color-rain-border)",
              background: "var(--color-rain-fill)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span className="font-mono text-micro" style={{ fontWeight: 700, color: "var(--color-rain-text)" }}>
                [DERIVED OUTPUT]
              </span>
              <span className="font-mono text-micro" style={{ color: "var(--color-rain-text)" }}>D8 & HAND</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--ink-900)" }}>
              Morphology & Flow Convergence
            </div>
            <p className="text-micro" style={{ color: "var(--ink-700)", marginTop: "4px", lineHeight: 1.4 }}>
              Finite-difference slope (0.4°–3.2°), D8 flow direction, depression sinks (Saidpur 15.7cm, Kankarbagh 28.4cm), and conduit proximity.
            </p>
          </div>

          {/* SIMULATED / ESTIMATED */}
          <div
            className="civic-glass-soft"
            style={{
              padding: "12px 14px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--color-warning-border)",
              background: "var(--color-warning-fill)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span className="font-mono text-micro" style={{ fontWeight: 700, color: "var(--color-warning-text)" }}>
                [SIMULATED / ESTIMATED]
              </span>
              <span className="font-mono text-micro" style={{ color: "var(--color-warning-text)" }}>Hydraulic Model</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--ink-900)" }}>
              Conduit Inverts & Surcharge
            </div>
            <p className="text-micro" style={{ color: "var(--ink-700)", marginTop: "4px", lineHeight: 1.4 }}>
              Trunk box culvert inverts are explicit hydraulic parameters (e.g. Saidpur 45.2m MSL). Depth and road impairment are modelled outputs.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HIERARCHY 5 & 6: ROAD IMPACT & ROUTING + RESPONSE OPERATIONS
          ========================================================================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "var(--space-4)" }}>
        {/* HIERARCHY 5: Road Impact / Routing Progression */}
        <div
          className="civic-glass"
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderRadius: "var(--r-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Navigation size={16} color="var(--color-rain-base)" />
              <h3 style={{ fontSize: "14px", fontWeight: 700 }}>Road Impact & Flood-Aware Routing</h3>
            </div>
            <CivicButton
              variant="secondary"
              size="sm"
              onClick={() => onNavigateToModule("routing")}
              icon={<ArrowRight size={12} />}
            >
              Plan Route
            </CivicButton>
          </div>

          <div
            className="civic-glass-soft"
            style={{
              padding: "8px 10px",
              borderRadius: "var(--r-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--ink-700)",
            }}
          >
            <span>FLOOD CONDITION</span>
            <span>→</span>
            <span>ROAD IMPACT</span>
            <span>→</span>
            <span>ROUTE CHANGE</span>
            <span>→</span>
            <span style={{ color: "var(--color-normal-text)", fontWeight: 700 }}>RESPONSE DECISION</span>
          </div>

          {/* Road Segment Status List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              { name: "Ashok Rajpath (PMCH Ridge)", status: "PASSABLE", depth: "8.2 cm", note: "Northern Ganga natural levee self-draining corridor", tone: "normal" },
              { name: "Saidpur Canal Road", status: "RESTRICTED", depth: "48.5 cm", note: "Trunk culvert surcharged; light vehicles diverted", tone: "high" },
              { name: "Kankarbagh Main Road", status: "BLOCKED", depth: "74.0 cm", note: "Bowl depression inundation; SDRF boat routing active", tone: "critical" },
              { name: "Boring Canal Road Bypass", status: "CAUTION", depth: "22.1 cm", note: "Passable for ambulances and emergency response crafts", tone: "warning" },
            ].map((rd, i) => (
              <div
                key={i}
                className="civic-glass-soft"
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--r-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{rd.name}</div>
                  <div className="text-micro" style={{ color: "var(--ink-600)" }}>{rd.note}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    className="font-mono"
                    style={{
                      fontWeight: 700,
                      fontSize: "11px",
                      color: rd.tone === "critical" ? "var(--color-critical-text)" : (rd.tone === "high" ? "var(--color-high-text)" : (rd.tone === "warning" ? "var(--color-warning-text)" : "var(--color-normal-text)")),
                    }}
                  >
                    {rd.status} ({rd.depth})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HIERARCHY 6: Response Operations Center */}
        <div
          className="civic-glass"
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderRadius: "var(--r-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <LifeBuoy size={16} color="var(--color-rain-base)" />
              <h3 style={{ fontSize: "14px", fontWeight: 700 }}>Integrated Emergency Response</h3>
            </div>
            <StatusPill type="DEMO" label="FIELD COORDINATION" size="sm" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Municipal Pumps */}
            <div
              className="civic-glass-soft"
              style={{
                padding: "10px 12px",
                borderRadius: "var(--r-sm)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "12px" }}>Municipal Dewatering Units</div>
                <div className="text-micro" style={{ color: "var(--ink-600)" }}>
                  Saidpur Sump (1,800 m³/h) + Kankarbagh High-Head Pump Active
                </div>
              </div>
              <span className="font-mono" style={{ fontWeight: 700, fontSize: "12px", color: "var(--color-normal-text)" }}>
                {activePumps.length} / {pumps.length} Operating
              </span>
            </div>

            {/* Verified Shelters */}
            <div
              className="civic-glass-soft"
              style={{
                padding: "10px 12px",
                borderRadius: "var(--r-sm)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "12px" }}>Relief Shelters & Hospital Corridors</div>
                <div className="text-micro" style={{ color: "var(--ink-600)" }}>
                  Gandhi Maidan Indoor Stadium (790 vacant beds) + PMCH Clean Access
                </div>
              </div>
              <span className="font-mono" style={{ fontWeight: 700, fontSize: "12px", color: "var(--color-rain-text)" }}>
                {availableShelters.length} Shelters Safe
              </span>
            </div>

            {/* SDRF Rescue Craft */}
            <div
              className="civic-glass-soft"
              style={{
                padding: "10px 12px",
                borderRadius: "var(--r-sm)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "12px" }}>Tactical Rescue Squads</div>
                <div className="text-micro" style={{ color: "var(--ink-600)" }}>
                  SDRF Boat Team 01 assigned to Rajendra Nagar Low Bowl
                </div>
              </div>
              <span className="font-mono" style={{ fontWeight: 700, fontSize: "12px", color: activeSOS.length > 0 ? "var(--color-critical-text)" : "var(--color-normal-text)" }}>
                {activeSOS.length} SOS Incidents
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CORE FEATURE CARDS (6 Key Operational Modules)
          ========================================================================= */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Core Operational Modules</h3>
            <span className="text-micro" style={{ color: "var(--ink-600)" }}>
              Engineered for municipal authorities, drainage engineers, and emergency commanders
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-3)" }}>
          {[
            {
              title: "Live Rainfall & Hyetograph",
              desc: "15-minute Doppler radar reflectivity, QPE convective rain rates, and cumulative precipitation tracking.",
              module: "rainfall",
              icon: CloudRain,
              tag: "TELEMETRY",
            },
            {
              title: "Terrain Intelligence",
              desc: "Real Copernicus GLO-30 DSM surface elevation, finite-difference slope, D8 accumulation, and depression sinks.",
              module: "terrain",
              icon: Mountain,
              tag: "COPERNICUS DSM",
            },
            {
              title: "Flood Nowcast (0–180m)",
              desc: "Dynamic 15-minute recurrence nowcast coupling overland runoff to stormwater conduit capacity.",
              module: "nowcast",
              icon: Clock,
              tag: "NOWCAST",
            },
            {
              title: "Drainage Network Hydraulics",
              desc: "1D Saint-Venant pipe flow, sump capacity utilization, and outfall backflow stage monitoring.",
              module: "drainage",
              icon: GitFork,
              tag: "1D HYDRAULICS",
            },
            {
              title: "Routing & Critical Access",
              desc: "Autonomous flood-depth weighted Dijkstra routing for ambulances, rescue crafts, and citizen evacuation.",
              module: "routing",
              icon: Navigation,
              tag: "GRAPH ROUTER",
            },
            {
              title: "Reports & References",
              desc: "Official situation reports, provenance audit logs, and complete research source citations.",
              module: "reports",
              icon: FileText,
              tag: "GOVERNANCE",
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigateToModule(card.module)}
                className="civic-glass card-interactive"
                style={{
                  padding: "16px",
                  borderRadius: "var(--r-md)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "var(--r-sm)",
                        background: "var(--color-rain-fill)",
                        border: "1px solid var(--color-rain-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={16} color="var(--color-rain-base)" />
                    </div>
                    <span className="font-mono text-micro" style={{ color: "var(--ink-600)" }}>
                      {card.tag}
                    </span>
                  </div>

                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-900)" }}>
                    {card.title}
                  </h4>
                  <p className="text-micro" style={{ color: "var(--ink-600)", marginTop: "4px", lineHeight: 1.45 }}>
                    {card.desc}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "var(--color-rain-text)", borderTop: "var(--glass-hairline)", paddingTop: "8px" }}>
                  <span>Launch Module</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          EVOLUTION OF FLOOD INTELLIGENCE (Before vs After VARUNETRA)
          ========================================================================= */}
      <section
        className="civic-glass"
        style={{
          padding: "var(--space-5)",
          borderRadius: "var(--r-xl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} color="var(--color-rain-base)" />
            <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Evolution of Urban Flood Intelligence</h3>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                background: "var(--color-rain-fill)",
                color: "var(--color-rain-text)",
                border: "1px solid var(--color-rain-border)",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              DISCONNECTED DATA → COUPLED INTELLIGENCE → ACTIONABLE RESPONSE
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--ink-700)", marginTop: "4px" }}>
            How VARUNETRA transforms isolated meteorological alerts into an integrated urban flood operations system.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          {/* BEFORE: Legacy Approach */}
          <div
            className="civic-glass-soft"
            style={{
              padding: "16px",
              borderRadius: "var(--r-lg)",
              border: "1px solid rgba(15, 23, 42, 0.12)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="font-mono text-micro" style={{ fontWeight: 700, color: "var(--ink-600)" }}>
                LEGACY DISCONNECTED PARADIGM
              </span>
              <span className="text-micro" style={{ color: "var(--color-blocked-text)" }}>Fragmented</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { title: "Isolated Rainfall Information", desc: "Regional weather warnings without drainage catchment context or micro-relief awareness." },
                { title: "Flat-World Assumption", desc: "Weak or absent terrain modelling; ignores micro-depressions and natural levees." },
                { title: "Uncoupled Drainage", desc: "Stormwater pipe capacity treated independently of surface runoff and river backpressure." },
                { title: "Static Flood Atlases", desc: "Coarse hazard maps incapable of reflecting dynamic 0–3 hour cloudburst progressions." },
                { title: "Manual Emergency Routing", desc: "Emergency services navigate blindly into surcharged streets without real-time depth guidance." },
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ color: "var(--color-blocked-text)", fontSize: "14px" }}>✕</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--ink-900)" }}>{item.title}</div>
                    <div className="text-micro" style={{ color: "var(--ink-600)" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AFTER: VARUNETRA Coupled Intelligence */}
          <div
            className="civic-glass-soft"
            style={{
              padding: "16px",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--color-normal-border)",
              background: "var(--color-normal-fill)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="font-mono text-micro" style={{ fontWeight: 700, color: "var(--color-normal-text)" }}>
                VARUNETRA COUPLED OPERATIONS
              </span>
              <span className="text-micro" style={{ color: "var(--color-normal-text)", fontWeight: 700 }}>Coupled Engine</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { title: "Rainfall + Terrain + Drainage Coupling", desc: "Simultaneous hyetograph forcing, overland D8 routing, and 1D pipe surcharge modeling." },
                { title: "Real Copernicus GLO-30 DSM Features", desc: "Identifies elevated Ganga natural levee (54.8m) vs low southern bowl sinks (51.3m)." },
                { title: "Dynamic 0–180m Nowcast Horizon", desc: "Street-level predicted flood depth updated on 15-minute recurrence intervals." },
                { title: "Depth-Weighted Evacuation Routing", desc: "Autonomous Dijkstra graph solver diverting traffic away from inundated road segments." },
                { title: "Unified Command & Multi-Agency Action", desc: "Simultaneous pump control, SDRF boat dispatch, and hospital corridor protection." },
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <CheckCircle2 size={14} color="var(--color-normal-base)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "12px", color: "var(--color-normal-text)" }}>{item.title}</div>
                    <div className="text-micro" style={{ color: "var(--ink-700)" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ML STATUS & EXPLAINABILITY DISCLAIMER
          ========================================================================= */}
      <section
        className="civic-glass"
        style={{
          padding: "var(--space-4) var(--space-5)",
          borderRadius: "var(--r-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          border: "1px solid var(--color-warning-border)",
          background: "var(--color-warning-fill)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <Cpu size={22} color="var(--color-warning-base)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--color-warning-text)" }}>
              ML MODEL STATUS: REQUIRES RECALIBRATION / RETRAINING
            </div>
            <div className="text-xs" style={{ color: "var(--color-warning-text)", marginTop: "2px" }}>
              <b>Scientific Governance Disclosure:</b> Real Copernicus GLO-30 DSM terrain integration introduces authentic topographic feature-distribution shifts. Surrogate Feature Attribution is a statistical model interpretation within the surrogate network, not calibrated hydraulic ground truth.
            </div>
          </div>
        </div>

        <CivicButton
          variant="secondary"
          size="sm"
          onClick={() => onNavigateToModule("ml")}
          icon={<Info size={12} />}
        >
          View ML Diagnostics
        </CivicButton>
      </section>

      {/* =========================================================================
          OFFICIAL SIH INSTITUTIONAL FOOTER
          ========================================================================= */}
      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          padding: "var(--space-4) var(--space-2)",
          borderTop: "var(--glass-hairline)",
          color: "var(--ink-600)",
          fontSize: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <VarunetraLogo size={20} />
          <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>VARUNETRA</span>
          <span>· Smart India Hackathon 2026 (SIH26085)</span>
          <span>· Ministry of Earth Sciences</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
          <span>Team Singularity@</span>
          <span>·</span>
          <span>Patna Urban Basin Pilot</span>
          <span>·</span>
          <button
            onClick={() => onNavigateToModule("reports")}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-rain-text)",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Research References & Sources
          </button>
        </div>
      </footer>
    </div>
  );
};
