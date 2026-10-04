import React, { useState } from "react";
import {
  AlertTriangle,
  Waves,
  GitFork,
  Car,
  LifeBuoy,
  Droplets,
  Building2,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import {
  NowcastTimeStep,
  SOSIncident,
  ShelterHospital,
  MunicipalPump,
  Alert,
} from "../types";
import { TabularKpi, SegmentedControl, StatusPill, CivicButton } from "./primitives";

interface IntelligencePanelProps {
  currentStep: NowcastTimeStep | null;
  roads: any[];
  sosList: SOSIncident[];
  facilities: ShelterHospital[];
  pumps: MunicipalPump[];
  alerts: Alert[];
  selectedRoad: any | null;
  selectedNode: any | null;
  selectedSOS: SOSIncident | null;
  selectedPump: MunicipalPump | null;
  onSelectRoad: (road: any) => void;
  onSelectSOS: (sos: SOSIncident) => void;
  onSelectPump: (pump: MunicipalPump) => void;
  onRouteAroundHazard: () => void;
  onAssignSOS: (id: string) => void;
  onActivatePump: (id: string) => void;
  onCloseContext: () => void;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({
  currentStep,
  roads,
  sosList,
  facilities,
  pumps,
  alerts,
  selectedRoad,
  selectedNode,
  selectedSOS,
  selectedPump,
  onSelectRoad,
  onSelectSOS,
  onSelectPump,
  onRouteAroundHazard,
  onAssignSOS,
  onActivatePump,
  onCloseContext,
}) => {
  const [activeTab, setActiveTab] = useState<"incidents" | "forecast" | "assets">("incidents");

  // Operational metrics
  const rainfallRate = currentStep?.rainfall_rate_mmh ?? 82.4;
  const maxDepth = currentStep?.max_flood_depth_cm ?? 46;
  const surchargedNodes = currentStep?.surcharged_drain_count ?? 8;
  const restrictedRoads = currentStep?.high_risk_roads_count ?? 10;
  const activeSOS = sosList.filter((s) => s.status !== "CLOSED" && (s.status as string) !== "RESOLVED");
  const runningPumps = pumps.filter((p) => p.status === "ACTIVE" || (p.status as string) === "PUMPING");

  // High-risk incidents list
  const incidents = [
    {
      id: "INC-01",
      title: "Rajendra Nagar Corridor — Road Restriction",
      location: "Rajendra Nagar Lowland",
      severity: "CRITICAL" as const,
      timestamp: "Nowcast +30m",
      currentDepth: `${maxDepth} cm`,
      predictedDepth: `${Math.round(maxDepth * 1.15)} cm`,
      trend: "RISING",
    },
    {
      id: "INC-02",
      title: "Saidpur Culvert Sump — Drainage Surcharge",
      location: "Saidpur Trunk Conduit",
      severity: "HIGH" as const,
      timestamp: "Nowcast +15m",
      currentDepth: "38 cm",
      predictedDepth: "44 cm",
      trend: "RISING",
    },
    {
      id: "INC-03",
      title: "Kankarbagh Main Sump — Low Invert Waterlogging",
      location: "Ward Cluster 04 (Kankarbagh)",
      severity: "WARNING" as const,
      timestamp: "Nowcast +45m",
      currentDepth: "24 cm",
      predictedDepth: "28 cm",
      trend: "STEADY",
    },
    {
      id: "INC-04",
      title: "PMCH Gate No. 2 — Surcharge Outfall Backpressure",
      location: "Ashok Rajpath Medical Node",
      severity: "WARNING" as const,
      timestamp: "Nowcast +30m",
      currentDepth: "18 cm",
      predictedDepth: "22 cm",
      trend: "RISING",
    },
  ];

  const hasContextSelection = Boolean(selectedRoad || selectedNode || selectedSOS || selectedPump);

  return (
    <aside
      className="civic-glass"
      style={{
        width: "320px",
        margin: "8px 12px 8px 0",
        borderRadius: "var(--r-lg)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {/* 1. Header: Context or Navigation Tabs */}
      {hasContextSelection ? (
        <div
          className="glass-hairline-bottom"
          style={{
            padding: "var(--space-2) var(--space-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span className="eyebrow" style={{ color: "var(--ink-900)" }}>
            Selected Asset Inspector
          </span>
          <CivicButton
            variant="ghost"
            size="sm"
            onClick={onCloseContext}
            icon={<X size={14} strokeWidth={1.75} />}
          />
        </div>
      ) : (
        <div
          className="glass-hairline-bottom"
          style={{
            padding: "var(--space-2) var(--space-3)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <SegmentedControl
            value={activeTab}
            onChange={(val) => setActiveTab(val as any)}
            options={[
              { value: "incidents", label: `Incidents (${incidents.length})` },
              { value: "forecast", label: "Next 60m" },
              { value: "assets", label: "Assets" },
            ]}
          />
        </div>
      )}

      {/* 2. Compact Embedded KPI Strip (No Card Outlines) */}
      <div
        className="glass-hairline-bottom"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          background: "rgba(15, 23, 42, 0.02)",
        }}
      >
        <TabularKpi
          label="Rainfall"
          value={rainfallRate}
          unit="mm/h"
          context="Peak 3h cell"
          trend="up"
          tone="rain"
          className="glass-hairline-right glass-hairline-bottom"
        />
        <TabularKpi
          label="Drain Load"
          value="78%"
          context={`${surchargedNodes} surcharged`}
          trend="up"
          tone="high"
          className="glass-hairline-right glass-hairline-bottom"
        />
        <TabularKpi
          label="Peak Depth"
          value={maxDepth}
          unit="cm"
          context="Bowl invert"
          trend="up"
          tone="critical"
          className="glass-hairline-bottom"
        />
        <TabularKpi
          label="Restricted"
          value={restrictedRoads}
          context="Corridors blocked"
          tone="critical"
          className="glass-hairline-right"
        />
        <TabularKpi
          label="Active SOS"
          value={String(activeSOS.length).padStart(2, "0")}
          context="Rescue queued"
          tone={activeSOS.length > 0 ? "critical" : "normal"}
          className="glass-hairline-right"
        />
        <TabularKpi
          label="Pumps Run"
          value={String(runningPumps.length).padStart(2, "0")}
          context={`${pumps.length} total units`}
          tone="normal"
        />
      </div>

      {/* 3. Main Scrollable Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-3)" }}>
        {hasContextSelection ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {/* Road Context */}
            {selectedRoad && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <div>
                  <h4 style={{ fontSize: "13px" }}>{selectedRoad.name}</h4>
                  <span className="text-micro" style={{ color: "var(--ink-600)" }}>
                    Corridor Type: {selectedRoad.road_class || "Primary Arterial"}
                  </span>
                </div>

                <div
                  className="civic-glass-soft"
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--r-sm)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-600)" }}>Ponding Depth:</span>
                    <b style={{ fontFamily: "var(--font-mono)", color: "var(--color-critical-text)" }}>
                      {selectedRoad.depth_cm || 0} cm
                    </b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--ink-600)" }}>Passability:</span>
                    <StatusPill
                      type={selectedRoad.status === "BLOCKED" ? "BLOCKED" : selectedRoad.status === "RESTRICTED" ? "HIGH" : "NORMAL"}
                      label={selectedRoad.status || "OPEN"}
                      size="sm"
                    />
                  </div>
                </div>

                <CivicButton
                  variant="primary"
                  size="sm"
                  onClick={onRouteAroundHazard}
                  style={{ width: "100%" }}
                  icon={<ExternalLink size={13} strokeWidth={1.75} />}
                >
                  Calculate Flood-Aware Detour
                </CivicButton>
              </div>
            )}

            {/* Drainage Node Context */}
            {selectedNode && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <div>
                  <h4 style={{ fontSize: "13px" }}>{selectedNode.name}</h4>
                  <span className="text-micro" style={{ color: "var(--ink-600)" }}>
                    Node Type: {selectedNode.node_type}
                  </span>
                </div>

                <div
                  className="civic-glass-soft"
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--r-sm)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-600)" }}>Rim Elevation:</span>
                    <span className="font-mono">{selectedNode.rim_elevation_m} m MSL</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-600)" }}>Invert Elevation:</span>
                    <span className="font-mono">{selectedNode.invert_elevation_m} m MSL</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--ink-600)" }}>Surcharge Status:</span>
                    <StatusPill
                      type={selectedNode.is_surcharged ? "CRITICAL" : "NORMAL"}
                      label={selectedNode.is_surcharged ? "SURCHARGE" : "CONVEYANCE"}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SOS Context */}
            {selectedSOS && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <div>
                  <h4 style={{ fontSize: "13px", color: "var(--color-critical-text)" }}>
                    {selectedSOS.id}: {selectedSOS.emergency_type}
                  </h4>
                  <span className="text-micro" style={{ color: "var(--ink-600)" }}>
                    {selectedSOS.address_hint}
                  </span>
                </div>

                <div
                  className="civic-glass-soft"
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--r-sm)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-600)" }}>Trapped Citizens:</span>
                    <b style={{ fontFamily: "var(--font-mono)", color: "var(--color-critical-text)" }}>
                      {selectedSOS.number_of_people} People
                    </b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-600)" }}>Reported Depth:</span>
                    <span className="font-mono">{selectedSOS.reported_depth_cm || 45} cm</span>
                  </div>
                </div>

                {((selectedSOS.status as string) === "RECEIVED" || selectedSOS.status === "NEW") && (
                  <CivicButton
                    variant="danger"
                    size="sm"
                    onClick={() => onAssignSOS(selectedSOS.id)}
                    style={{ width: "100%" }}
                  >
                    Dispatch SDRF Boat Squad
                  </CivicButton>
                )}
              </div>
            )}

            {/* Pump Context */}
            {selectedPump && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <div>
                  <h4 style={{ fontSize: "13px" }}>{selectedPump.name}</h4>
                  <span className="text-micro" style={{ color: "var(--ink-600)" }}>
                    Location: {selectedPump.location_name}
                  </span>
                </div>

                <div
                  className="civic-glass-soft"
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--r-sm)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-600)" }}>Discharge Rate:</span>
                    <span className="font-mono">{selectedPump.discharge_capacity_m3h} m³/h</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-600)" }}>Fuel Level:</span>
                    <span className="font-mono">{selectedPump.fuel_level_pct}% Diesel Gen</span>
                  </div>
                </div>

                {selectedPump.status !== "ACTIVE" && (
                  <CivicButton
                    variant="primary"
                    size="sm"
                    onClick={() => onActivatePump(selectedPump.id)}
                    style={{ width: "100%" }}
                  >
                    Activate Dewatering Pump
                  </CivicButton>
                )}
              </div>
            )}
          </div>
        ) : activeTab === "incidents" ? (
          /* TAB 1: CURRENT INCIDENTS (Compact Rows) */
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span className="eyebrow" style={{ marginBottom: "2px" }}>
              Active Flood & Surcharge Incidents
            </span>

            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="civic-glass-soft"
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--r-sm)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: inc.severity === "CRITICAL" ? "var(--color-critical-text)" : "var(--ink-900)",
                    }}
                  >
                    {inc.title}
                  </span>
                  <StatusPill type={inc.severity} size="sm" />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "var(--ink-600)",
                  }}
                >
                  <span>{inc.location}</span>
                  <span className="font-mono">{inc.timestamp}</span>
                </div>

                <div
                  className="glass-hairline-top"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    paddingTop: "4px",
                    marginTop: "2px",
                  }}
                >
                  <span>
                    Depth: <b className="font-mono">{inc.currentDepth}</b>
                  </span>
                  <span>
                    Predicted: <b className="font-mono" style={{ color: "var(--color-critical-text)" }}>{inc.predictedDepth}</b>
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: inc.trend === "RISING" ? "var(--color-critical-text)" : "var(--color-warning-text)",
                    }}
                  >
                    {inc.trend === "RISING" ? "▲ RISING" : "— STEADY"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "forecast" ? (
          /* TAB 2: NEXT 60 MINUTES */
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <span className="eyebrow">Projected 60-Minute Hydrodynamic Impacts</span>
            <div
              className="civic-glass-soft"
              style={{ padding: "8px 10px", borderRadius: "var(--r-sm)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span>Conduit Backflow Probability</span>
                <span className="font-mono" style={{ color: "var(--color-high-text)", fontWeight: 700 }}>88%</span>
              </div>
              <p className="text-micro" style={{ color: "var(--ink-600)", marginTop: "2px" }}>
                Ganga river stage exceeds trunk sluice gate flume elevations.
              </p>
            </div>
            <div
              className="civic-glass-soft"
              style={{ padding: "8px 10px", borderRadius: "var(--r-sm)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span>Rajendra Nagar Invert Ponding</span>
                <span className="font-mono" style={{ color: "var(--color-critical-text)", fontWeight: 700 }}>+18 cm/hr</span>
              </div>
              <p className="text-micro" style={{ color: "var(--ink-600)", marginTop: "2px" }}>
                Catchment runoff accumulation exceeding capacity.
              </p>
            </div>
          </div>
        ) : (
          /* TAB 3: CRITICAL ASSETS */
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span className="eyebrow">Critical Asset Inventory</span>
            {facilities.slice(0, 4).map((fac) => (
              <div
                key={fac.id}
                className="civic-glass-soft"
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--r-sm)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "12px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{fac.name}</div>
                  <div className="text-micro" style={{ color: "var(--ink-600)" }}>
                    Capacity: {fac.capacity} · Risk: {fac.flood_risk}
                  </div>
                </div>
                <StatusPill
                  type={fac.flood_risk === "HIGH" || fac.flood_risk === "CRITICAL" ? "HIGH" : "NORMAL"}
                  label={fac.road_passability || "OPEN"}
                  size="sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
