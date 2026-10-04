import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Truck,
  RotateCcw,
  Navigation,
  Activity,
  Layers,
  MapPin,
  X,
} from "lucide-react";
import {
  SituationBoard,
  ScenarioOutcomeSummary,
  ScenarioTimelineEvent,
} from "../types";
import { CivicButton, StatusPill } from "./primitives";

interface SituationBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  situation: SituationBoard | null;
  timeline: ScenarioTimelineEvent[];
}

export const SituationBoardModal: React.FC<SituationBoardModalProps> = ({
  isOpen,
  onClose,
  situation,
  timeline,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !situation) return null;

  const getRiskColor = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case "CRITICAL":
        return "#dc2626";
      case "WARNING":
        return "#ea580c";
      case "WATCH":
        return "#eab308";
      default:
        return "#16a34a";
    }
  };

  return (
    <div
      className="glass-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
      }}
    >
      <div
        className="civic-glass-strong"
        style={{
          width: "740px",
          maxWidth: "100%",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "var(--r-md)",
          overflow: "hidden",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.4)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-900)" }}>
                Unified Operational Situation Board
              </h3>
              <StatusPill type="DEMO" label="SIMULATION" size="sm" />
            </div>
            <p style={{ fontSize: "12px", color: "var(--ink-600)", marginTop: "2px" }}>
              {situation.scenario_name} • Stage {situation.stage} ({situation.operational_phase})
            </p>
          </div>
          <CivicButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon={<X size={16} />}
            data-testid="close-situation-board"
            title="Close Situation Board"
            aria-label="Close Situation Board"
          >
            Close
          </CivicButton>
        </div>

        {/* Content Body */}
        <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1 }}>
          {/* Situation Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {/* Event & Risk */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: "var(--r-sm)",
                padding: "10px 14px",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: "4px" }}>
                Active Event / Mode
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-900)" }}>
                Extreme Rainfall
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: getRiskColor(situation.flood_risk),
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: getRiskColor(situation.flood_risk),
                  }}
                >
                  RISK: {situation.flood_risk}
                </span>
              </div>
            </div>

            {/* Hotspots & Road Status */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: "var(--r-sm)",
                padding: "10px 14px",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: "4px" }}>
                Hotspots & Roads
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-900)" }}>
                {situation.hotspots_count} Active Hotspot (Zone-A)
              </div>
              <div style={{ fontSize: "12px", color: "var(--ink-700)", marginTop: "4px" }}>
                Roads: <b style={{ color: "#dc2626" }}>{situation.affected_roads_count} Affected</b> ({situation.active_road_status})
              </div>
            </div>

            {/* Safe Route */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: "var(--r-sm)",
                padding: "10px 14px",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: "4px" }}>
                Safe Tactical Route
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Navigation size={14} color="#0284c7" />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0284c7" }}>
                  {situation.safe_route_status}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-600)", marginTop: "4px" }}>
                Adapted to flood conditions (Ridge Route)
              </div>
            </div>

            {/* SOS Incident */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: "var(--r-sm)",
                padding: "10px 14px",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: "4px" }}>
                SOS Incident Response
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-900)" }}>
                {situation.sos_count > 0 ? "1 ACTIVE (SOS-PAT-901)" : "0 Active Incidents"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--ink-700)", marginTop: "4px" }}>
                12 People Affected • Priority: CRITICAL
              </div>
            </div>

            {/* Response Assets */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: "var(--r-sm)",
                padding: "10px 14px",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: "4px" }}>
                Deployed Operations
              </div>
              <div style={{ fontSize: "12px", color: "var(--ink-900)", fontWeight: 600 }}>
                • Rescue: <b>{situation.rescue_teams_dispatched} Dispatched</b> (TEAM-01)
              </div>
              <div style={{ fontSize: "12px", color: "var(--ink-900)", fontWeight: 600, marginTop: "2px" }}>
                • Pumps: <b>{situation.pumps_dispatched} Dispatched</b> (PUMP-01)
              </div>
            </div>

            {/* System Provenance */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: "var(--r-sm)",
                padding: "10px 14px",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: "4px" }}>
                System & Provenance
              </div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#16a34a" }}>
                SYSTEM {situation.system_readiness}
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-600)", marginTop: "2px" }}>
                DSM: Copernicus GLO-30 • Rainfall: SIMULATED
              </div>
            </div>
          </div>

          {/* Live Event Timeline Feed */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-800)" }}>
                Live Event Timeline Feed
              </h4>
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  padding: "2px 6px",
                  borderRadius: "var(--r-sm)",
                  background: "rgba(0, 0, 0, 0.05)",
                  color: "var(--ink-600)",
                  fontWeight: 600,
                }}
              >
                CLOCK: DEMO CLOCK
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "220px",
                overflowY: "auto",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: "var(--r-sm)",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.5)",
              }}
            >
              {timeline && timeline.length > 0 ? (
                timeline.map((evt, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "12px",
                      padding: "4px 0",
                      borderBottom:
                        idx < timeline.length - 1 ? "1px solid rgba(0, 0, 0, 0.04)" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: "var(--ink-700)",
                        minWidth: "75px",
                        fontSize: "11px",
                      }}
                    >
                      {evt.time}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: "3px",
                        backgroundColor:
                          evt.severity === "CRITICAL"
                            ? "rgba(220, 38, 38, 0.15)"
                            : evt.severity === "WARNING"
                            ? "rgba(234, 88, 12, 0.15)"
                            : "rgba(16, 185, 129, 0.15)",
                        color:
                          evt.severity === "CRITICAL"
                            ? "#b91c1c"
                            : evt.severity === "WARNING"
                            ? "#c2410c"
                            : "#047857",
                      }}
                    >
                      {evt.type}
                    </span>
                    <span style={{ color: "var(--ink-800)", flex: 1 }}>{evt.message}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "12px", color: "var(--ink-500)", padding: "10px" }}>
                  Awaiting scenario events...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            justifyContent: "flex-end",
            background: "rgba(255, 255, 255, 0.4)",
          }}
        >
          <CivicButton variant="secondary" size="sm" onClick={onClose}>
            Close Situation Board
          </CivicButton>
        </div>
      </div>
    </div>
  );
};

interface ScenarioOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ScenarioOutcomeSummary | null;
  onReset: () => void;
}

export const ScenarioOutcomeModal: React.FC<ScenarioOutcomeModalProps> = ({
  isOpen,
  onClose,
  summary,
  onReset,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !summary) return null;

  return (
    <div
      className="glass-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.70)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1150,
        padding: "16px",
      }}
    >
      <div
        className="civic-glass-strong"
        style={{
          width: "600px",
          maxWidth: "100%",
          borderRadius: "var(--r-md)",
          overflow: "hidden",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            background: "rgba(255, 255, 255, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={18} color="#16a34a" />
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-900)" }}>
                {summary.status}
              </h3>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ink-600)", marginTop: "2px" }}>
              {summary.scenario_name} • Operational Outcome Metrics
            </p>
          </div>
          <CivicButton variant="ghost" size="sm" onClick={onClose} icon={<X size={16} />} />
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px" }}>
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(22, 163, 74, 0.08)",
              border: "1px solid rgba(22, 163, 74, 0.2)",
              borderRadius: "var(--r-sm)",
              fontSize: "12px",
              color: "#166534",
              marginBottom: "16px",
              lineHeight: 1.45,
            }}
          >
            <b>Decision-Support Lifecycle Demonstrated:</b> Extreme rainfall forcing triggered automated
            nowcasting, hotspot identification, flood-adapted safe routing, citizen SOS triage, SDRF
            rescue team deployment, and municipal pump dewatering.
          </div>

          {/* Metrics Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div style={{ background: "rgba(255, 255, 255, 0.6)", padding: "8px 12px", borderRadius: "var(--r-sm)" }}>
              <div className="eyebrow">Peak Flood Risk</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#dc2626" }}>
                {summary.peak_flood_risk}
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.6)", padding: "8px 12px", borderRadius: "var(--r-sm)" }}>
              <div className="eyebrow">Peak Flood Depth</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-900)" }}>
                {summary.peak_flood_depth_cm.toFixed(1)} cm
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.6)", padding: "8px 12px", borderRadius: "var(--r-sm)" }}>
              <div className="eyebrow">Maximum Affected Area</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-900)" }}>
                {summary.max_affected_area_km2.toFixed(1)} km²
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.6)", padding: "8px 12px", borderRadius: "var(--r-sm)" }}>
              <div className="eyebrow">Unsafe Road Segments</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#dc2626" }}>
                {summary.unsafe_road_segments} Blocked Corridors
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.6)", padding: "8px 12px", borderRadius: "var(--r-sm)" }}>
              <div className="eyebrow">Citizens Evacuated / SOS</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-900)" }}>
                {summary.citizens_evacuated} Persons (1 Incident)
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.6)", padding: "8px 12px", borderRadius: "var(--r-sm)" }}>
              <div className="eyebrow">Rescue Teams & Pumps</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-900)" }}>
                {summary.rescue_teams_dispatched} Team • {summary.pumps_dispatched} Pump Dispatched
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.6)", padding: "8px 12px", borderRadius: "var(--r-sm)" }}>
              <div className="eyebrow">Safe Route Generated</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#16a34a" }}>
                {summary.safe_route_generated ? "YES (Adapted Route)" : "NO"}
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.6)", padding: "8px 12px", borderRadius: "var(--r-sm)" }}>
              <div className="eyebrow">Emergency Alert & Clock</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#16a34a" }}>
                {summary.emergency_alert_issued ? "ISSUED" : "NO"} • {summary.simulated_duration}
              </div>
            </div>
          </div>

          <div style={{ fontSize: "11px", color: "var(--ink-500)", fontStyle: "italic" }}>
            * Operational demo scenario execution completed. Provenance: SIMULATION (Copernicus GLO-30 DSM, deterministic).
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.4)",
          }}
        >
          <CivicButton
            variant="secondary"
            size="sm"
            onClick={() => {
              onReset();
              onClose();
            }}
            icon={<RotateCcw size={13} />}
          >
            RESET SCENARIO
          </CivicButton>

          <CivicButton variant="primary" size="sm" onClick={onClose}>
            Close Summary
          </CivicButton>
        </div>
      </div>
    </div>
  );
};
