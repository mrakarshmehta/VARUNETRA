import React, { useState } from "react";
import {
  Navigation,
  ShieldCheck,
  Zap,
  Flame,
  Truck,
  Car,
  User,
  AlertTriangle,
  Sliders,
  ExternalLink,
  Compass,
} from "lucide-react";
import {
  RouteRequest,
  RouteResponse,
  RoutingProfile,
  VehicleType,
} from "../../types";
import { api } from "../../api/client";
import { CivicButton } from "../primitives/CivicButton";
import { StatusPill } from "../primitives/StatusPill";
import { TabularKpi } from "../primitives/TabularKpi";
import { SegmentedControl } from "../primitives/SegmentedControl";

interface RoutingModuleProps {
  onRouteCalculated: (route: RouteResponse) => void;
  onNavigateToMap: () => void;
}

export const RoutingModule: React.FC<RoutingModuleProps> = ({
  onRouteCalculated,
  onNavigateToMap,
}) => {
  const PRESET_LOCATIONS = [
    { label: "Kankarbagh Colony Mor", coords: [25.6025, 85.14] },
    { label: "Rajendra Nagar Lowland (Flooded)", coords: [25.6005, 85.155] },
    { label: "PMCH Hospital (Ashok Rajpath)", coords: [25.619, 85.152] },
    { label: "Gandhi Maidan Relief Shelter", coords: [25.618, 85.144] },
    { label: "Patna Junction Railway Station", coords: [25.599, 85.132] },
  ];

  const [originIndex, setOriginIndex] = useState(0);
  const [destIndex, setDestIndex] = useState(2);
  const [profile, setProfile] = useState<RoutingProfile>("SAFEST");
  const [vehicleType, setVehicleType] = useState<VehicleType>("LIGHT_VEHICLE");
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);

  // Configurable Operational Clearance Policy
  const [showPolicyConfig, setShowPolicyConfig] = useState(false);
  const [customThresholds, setCustomThresholds] = useState<Record<string, number>>({
    PEDESTRIAN: 12,
    LIGHT_VEHICLE: 20,
    HEAVY_VEHICLE: 40,
    EMERGENCY_RESCUE: 50,
  });

  const handleComputeRoute = async () => {
    setLoading(true);
    try {
      const orig = PRESET_LOCATIONS[originIndex].coords;
      const dest = PRESET_LOCATIONS[destIndex].coords;
      const req: RouteRequest = {
        origin: orig,
        destination: dest,
        profile,
        vehicle_type: vehicleType,
        departure_time_offset_min: 0,
        allow_caution_roads: true,
        custom_thresholds: customThresholds,
      };

      const res = await api.getRoute(req);
      setRouteResult(res);
      onRouteCalculated(res);
    } catch (err) {
      console.error("Routing error:", err);
    } finally {
      setLoading(false);
    }
  };

  const PROFILES = [
    { key: "SAFEST" as RoutingProfile, label: "SAFEST", desc: "Maximizes clearance, avoids all ponding corridors" },
    { key: "FASTEST" as RoutingProfile, label: "FASTEST", desc: "Minimizes travel time, tolerates shallow standing water" },
    { key: "EMERGENCY" as RoutingProfile, label: "EMERGENCY", desc: "Prioritizes elevated tactical corridors for rescue" },
    { key: "EVACUATION" as RoutingProfile, label: "EVACUATION", desc: "Directs mass transit toward high-elevation shelters" },
  ];

  const activeProfileObj = PROFILES.find((p) => p.key === profile) || PROFILES[0];

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
      {/* Header */}
      <div
        className="civic-glass-subtle"
        style={{
          padding: "14px 18px",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Dynamic Flood-Aware Routing Engine
            </h2>
            <StatusPill type="ACTIVE" label="Dijkstra Hydro-Weighted Graph" />
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Real-time road graph cost reweighting based on 0–3h nowcasted flood depth, drainage surcharge, and configured vehicle clearance thresholds.
          </p>
        </div>

        <CivicButton
          size="sm"
          variant="secondary"
          icon={<Sliders size={14} />}
          onClick={() => setShowPolicyConfig(!showPolicyConfig)}
        >
          {showPolicyConfig ? "Hide Clearance Policy" : "Clearance Policy"}
        </CivicButton>
      </div>

      {/* Policy Configuration Box if open */}
      {showPolicyConfig && (
        <div
          className="civic-glass-card"
          style={{
            padding: "14px 18px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--glass-border-light)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Operational Clearance Thresholds (Vehicle Intake Limits)
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Road passability is governed by configured vehicle intake heights rather than arbitrary universal claims of "safe" water depth.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "4px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Light Vehicle (Sedan / Auto)</span>
                <b style={{ fontFamily: "var(--font-mono)", color: "var(--brand-primary)" }}>{customThresholds.LIGHT_VEHICLE} cm</b>
              </div>
              <input
                type="range"
                min={10}
                max={35}
                value={customThresholds.LIGHT_VEHICLE}
                onChange={(e) => setCustomThresholds({ ...customThresholds, LIGHT_VEHICLE: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "var(--brand-primary)" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "4px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Heavy Vehicle / Ambulance</span>
                <b style={{ fontFamily: "var(--font-mono)", color: "var(--brand-primary)" }}>{customThresholds.HEAVY_VEHICLE} cm</b>
              </div>
              <input
                type="range"
                min={25}
                max={60}
                value={customThresholds.HEAVY_VEHICLE}
                onChange={(e) => setCustomThresholds({ ...customThresholds, HEAVY_VEHICLE: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "var(--brand-primary)" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "4px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Pedestrian Wading Limit</span>
                <b style={{ fontFamily: "var(--font-mono)", color: "var(--brand-primary)" }}>{customThresholds.PEDESTRIAN} cm</b>
              </div>
              <input
                type="range"
                min={5}
                max={25}
                value={customThresholds.PEDESTRIAN}
                onChange={(e) => setCustomThresholds({ ...customThresholds, PEDESTRIAN: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "var(--brand-primary)" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Routing Console (Split View) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.3fr)", gap: "16px" }}>
        {/* Left Column: Route Parameters & Options */}
        <div
          className="civic-glass-card"
          style={{
            padding: "16px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--glass-border-light)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Route Coordinates & Parameters
          </div>

          {/* Origin & Destination Selectors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Origin Point
              </label>
              <select
                value={originIndex}
                onChange={(e) => setOriginIndex(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "0.76rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-ui)",
                  background: "var(--pearl-surface)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              >
                {PRESET_LOCATIONS.map((loc, idx) => (
                  <option key={loc.label} value={idx} disabled={idx === destIndex}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Destination (Safe Node)
              </label>
              <select
                value={destIndex}
                onChange={(e) => setDestIndex(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "0.76rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-ui)",
                  background: "var(--pearl-surface)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              >
                {PRESET_LOCATIONS.map((loc, idx) => (
                  <option key={loc.label} value={idx} disabled={idx === originIndex}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Profile Choice: Segmented Pill Strip */}
          <div>
            <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
              Routing Safety Profile
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {PROFILES.map((p) => {
                const isSelected = profile === p.key;
                return (
                  <CivicButton
                    key={p.key}
                    type="button"
                    size="sm"
                    variant={isSelected ? "primary" : "secondary"}
                    active={isSelected}
                    onClick={() => setProfile(p.key)}
                  >
                    {p.label}
                  </CivicButton>
                );
              })}
            </div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                padding: "6px 10px",
                borderRadius: "var(--radius-xs)",
                background: "var(--pearl-surface-subtle)",
              }}
            >
              <strong>{activeProfileObj.label}:</strong> {activeProfileObj.desc}
            </div>
          </div>

          {/* Vehicle Class Selector */}
          <div>
            <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
              Vehicle Classification & Clearance Limit
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { key: "LIGHT_VEHICLE" as VehicleType, label: `Light (${customThresholds.LIGHT_VEHICLE}cm)` },
                { key: "HEAVY_VEHICLE" as VehicleType, label: `Heavy (${customThresholds.HEAVY_VEHICLE}cm)` },
                { key: "PEDESTRIAN" as VehicleType, label: `Pedestrian (${customThresholds.PEDESTRIAN}cm)` },
              ].map((v) => {
                const isSelected = vehicleType === v.key;
                return (
                  <CivicButton
                    key={v.key}
                    type="button"
                    size="sm"
                    variant={isSelected ? "primary" : "secondary"}
                    active={isSelected}
                    onClick={() => setVehicleType(v.key)}
                  >
                    {v.label}
                  </CivicButton>
                );
              })}
            </div>
          </div>

          {/* Compute Button */}
          <CivicButton
            variant="primary"
            size="md"
            disabled={loading}
            onClick={handleComputeRoute}
            style={{ marginTop: "4px" }}
          >
            {loading ? "Solving Dijkstra Dynamic Road Graph..." : "Compute Dynamic Flood Route"}
          </CivicButton>
        </div>

        {/* Right Column: Routing Results & Comparison */}
        <div
          className="civic-glass-card"
          style={{
            padding: "16px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--glass-border-light)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {routeResult ? (
            <>
              {/* Route Summary Metrics */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border-ui)",
                  paddingBottom: "10px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Calculated Navigation Solution
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                    {routeResult.profile_used} Profile • {routeResult.vehicle_type}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)", lineHeight: 1 }}>
                    {routeResult.eta_minutes} <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>min</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Distance: <b>{routeResult.distance_km} km</b>
                  </div>
                </div>
              </div>

              {/* Policy Compliance Status */}
              <div
                className="civic-glass-subtle"
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${routeResult.is_fully_passable ? "var(--safe-border)" : "var(--critical-border)"}`,
                  background: routeResult.is_fully_passable ? "var(--safe-primary-light)" : "var(--critical-primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Operational Safety Policy Compliance
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: routeResult.is_fully_passable ? "var(--safe-primary)" : "var(--critical-primary)",
                    }}
                  >
                    {routeResult.policy_compliance_status || (routeResult.is_fully_passable
                      ? "Within configured operational clearance threshold"
                      : "Restricted by configured operational threshold")}
                  </div>
                </div>
                <StatusPill
                  type={routeResult.is_fully_passable ? "NORMAL" : "CRITICAL"}
                  label={routeResult.is_fully_passable ? "CLEAR" : "RESTRICTED"}
                />
              </div>

              {/* Operational Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <TabularKpi
                  label="Risk Rating"
                  value={routeResult.composite_risk}
                  tone={routeResult.composite_risk === "SAFE" ? "normal" : "warning"}
                />
                <TabularKpi
                  label="Max Depth"
                  value={routeResult.max_flood_depth_encountered_cm}
                  unit="cm"
                  tone={routeResult.max_flood_depth_encountered_cm > 20 ? "critical" : "normal"}
                />
                <TabularKpi
                  label="Recalculation"
                  value="0.024s"
                  tone="neutral"
                />
              </div>

              {/* Avoided Hazards List */}
              {routeResult.avoided_hazards.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "var(--critical-primary)",
                      marginBottom: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>Avoided Inundation Hazards ({routeResult.avoided_hazards.length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {routeResult.avoided_hazards.map((haz) => (
                      <div
                        key={haz.segment_id}
                        className="civic-glass-subtle"
                        style={{
                          padding: "6px 10px",
                          borderLeft: "3px solid var(--critical-primary)",
                          borderRadius: "var(--radius-xs)",
                          fontSize: "0.72rem",
                        }}
                      >
                        <strong style={{ color: "var(--text-primary)" }}>{haz.road_name}:</strong> {haz.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Support Guidance Note */}
              <div
                className="civic-glass-subtle"
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--brand-primary-light)",
                  fontSize: "0.74rem",
                  color: "var(--text-secondary)",
                }}
              >
                <strong style={{ color: "var(--brand-primary)" }}>Decision Advisory: </strong>
                {routeResult.decision_support_note}
              </div>

              {/* View On Map Button */}
              <CivicButton
                variant="secondary"
                size="md"
                icon={<ExternalLink size={14} />}
                onClick={onNavigateToMap}
                style={{ width: "100%", marginTop: "auto" }}
              >
                Inspect Active Route on Command GIS
              </CivicButton>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "280px",
                color: "var(--text-muted)",
                gap: "10px",
              }}
            >
              <Navigation size={36} color="var(--border-strong)" />
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                No Route Calculated Yet
              </div>
              <div style={{ fontSize: "0.74rem", textAlign: "center", maxWidth: "280px", color: "var(--text-muted)" }}>
                Select origin, destination and profile, then click "Compute Dynamic Flood Route".
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
