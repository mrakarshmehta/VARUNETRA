import React from "react";
import { Clock, Waves, TrendingUp, AlertTriangle, Droplets, ArrowRight } from "lucide-react";
import { NowcastSeriesResponse } from "../../types";
import { CivicButton } from "../primitives/CivicButton";
import { StatusPill } from "../primitives/StatusPill";
import { TabularKpi } from "../primitives/TabularKpi";

interface NowcastModuleProps {
  nowcast: NowcastSeriesResponse | null;
  selectedStepIndex: number;
  onSelectStepIndex: (idx: number) => void;
}

export const NowcastModule: React.FC<NowcastModuleProps> = ({
  nowcast,
  selectedStepIndex,
  onSelectStepIndex,
}) => {
  if (!nowcast) return null;

  const currentStep = nowcast.time_steps[selectedStepIndex] || nowcast.time_steps[0];
  const provenanceType = (["REAL", "SIMULATED", "SYNTHETIC", "DEMO", "CACHED"].includes(nowcast.provenance.data_mode)
    ? nowcast.provenance.data_mode
    : "SIMULATED") as any;

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
              0–3 Hour High-Resolution Flood Nowcasting
            </h2>
            <StatusPill type="ACTIVE" label="Coupled 1D-2D Hydraulics" />
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            15-minute intervals tracking subcatchment runoff, pipe surcharge propagation, and street-level waterlogging depth bands.
          </p>
        </div>

        <StatusPill
          type={provenanceType}
          label={`PROVENANCE: ${nowcast.provenance.data_mode}`}
        />
      </div>

      {/* Live Step Summary Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
        }}
      >
        <TabularKpi
          label={`Rain Rate (${currentStep.label})`}
          value={currentStep.rainfall_rate_mmh}
          unit="mm/h"
          tone="rain"
        />
        <TabularKpi
          label="Accumulated Rain"
          value={currentStep.accumulated_rainfall_mm}
          unit="mm"
          tone="rain"
        />
        <TabularKpi
          label="Average Inundation"
          value={currentStep.average_flood_depth_cm}
          unit="cm"
          tone="normal"
        />
        <TabularKpi
          label="Peak Ponding Depth"
          value={currentStep.max_flood_depth_cm}
          unit="cm"
          tone={currentStep.max_flood_depth_cm > 30 ? "critical" : "warning"}
        />
        <TabularKpi
          label="Restricted Roads"
          value={currentStep.high_risk_roads_count}
          unit="segments"
          tone="critical"
        />
        <TabularKpi
          label="Surcharged Drains"
          value={currentStep.surcharged_drain_count}
          unit="nodes"
          tone="warning"
        />
      </div>

      {/* Timeline Progression Table */}
      <div
        className="civic-glass-card"
        style={{
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--glass-border-light)",
        }}
      >
        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid var(--border-ui)",
            background: "var(--pearl-surface-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Nowcast Horizon Progression (0 to +180 min)
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Select an interval to visualize catchment inundation on the GIS twin
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            className="op-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.76rem",
            }}
          >
            <thead>
              <tr style={{ background: "var(--pearl-surface-wash)", borderBottom: "1px solid var(--border-ui)" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Horizon</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Rain Rate</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Accumulation</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Avg Depth</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Peak Depth</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Roads Impassable</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Drains Surcharged</th>
                <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {nowcast.time_steps.map((step, idx) => {
                const isSelected = idx === selectedStepIndex;
                return (
                  <tr
                    key={step.label}
                    onClick={() => onSelectStepIndex(idx)}
                    style={{
                      background: isSelected ? "var(--brand-primary-light)" : "transparent",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background var(--duration-fast) var(--ease-standard)",
                    }}
                  >
                    <td
                      style={{
                        padding: "8px 12px",
                        fontFamily: "var(--font-mono)",
                        color: "var(--brand-primary)",
                        fontWeight: 700,
                      }}
                    >
                      {step.label}
                    </td>
                    <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)" }}>
                      {step.rainfall_rate_mmh} mm/h
                    </td>
                    <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)" }}>
                      {step.accumulated_rainfall_mm} mm
                    </td>
                    <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)" }}>
                      {step.average_flood_depth_cm} cm
                    </td>
                    <td
                      style={{
                        padding: "8px 12px",
                        fontFamily: "var(--font-mono)",
                        color: step.max_flood_depth_cm > 30 ? "var(--critical-primary)" : "var(--text-primary)",
                        fontWeight: 700,
                      }}
                    >
                      {step.max_flood_depth_cm} cm
                    </td>
                    <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)" }}>
                      {step.high_risk_roads_count}
                    </td>
                    <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)" }}>
                      {step.surcharged_drain_count}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      <CivicButton
                        size="sm"
                        variant={isSelected ? "primary" : "secondary"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStepIndex(idx);
                        }}
                      >
                        {isSelected ? "Active Step" : "Inspect Step"}
                      </CivicButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Step Catchment Depth Distribution */}
      <div
        className="civic-glass-card"
        style={{
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          border: "1px solid var(--glass-border-light)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Catchment Inundation Distributions at {currentStep.label}
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Calculated depth bands with uncertainty intervals and primary hydrologic contributors
            </span>
          </div>
          <StatusPill type="NORMAL" label={`Interval: ${currentStep.label}`} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {currentStep.inundations.map((inund) => {
            const riskType =
              inund.risk_level === "CRITICAL"
                ? "CRITICAL"
                : inund.risk_level === "HIGH"
                ? "HIGH"
                : inund.risk_level === "WARNING"
                ? "WARNING"
                : "NORMAL";

            return (
              <div
                key={inund.zone_id}
                className="civic-glass-subtle"
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--glass-border-light)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {inund.zone_name}
                  </span>
                  <StatusPill type={riskType} label={inund.risk_level} />
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--brand-primary)",
                      lineHeight: 1,
                    }}
                  >
                    {inund.predicted_depth_cm}
                  </span>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>cm</span>
                </div>

                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  Depth Band: <b>{inund.depth_band_min_cm} – {inund.depth_band_max_cm} cm</b> ({inund.uncertainty} Uncertainty)
                </div>

                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: "6px",
                  }}
                >
                  <strong style={{ color: "var(--text-secondary)" }}>Contributors:</strong>{" "}
                  {inund.primary_contributors.join(", ")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
