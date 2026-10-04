import React from "react";
import {
  ExternalLink,
} from "lucide-react";
import { CivicButton } from "../primitives/CivicButton";
import { StatusPill } from "../primitives/StatusPill";
import { TabularKpi } from "../primitives/TabularKpi";

interface DrainageModuleProps {
  drainageData: any;
  onSelectNode: (node: any) => void;
  onNavigateToMap: () => void;
}

export const DrainageModule: React.FC<DrainageModuleProps> = ({
  drainageData,
  onSelectNode,
  onNavigateToMap,
}) => {
  if (!drainageData) return null;

  const conduits = drainageData.conduits || [];
  const nodes = drainageData.nodes || [];
  const summary = drainageData.summary || {};

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
              Stormwater Drainage & Hydraulics Intelligence
            </h2>
            <StatusPill type="ACTIVE" label="1D Coupled Hydraulic Network" />
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Subsurface conduit capacity utilization, pipe blockage, hydraulic grade line surcharge, and river outfall backflow analysis.
          </p>
        </div>

        <CivicButton
          size="sm"
          variant="secondary"
          icon={<ExternalLink size={14} />}
          onClick={onNavigateToMap}
        >
          Inspect Conduits on Map
        </CivicButton>
      </div>

      {/* Network KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
        }}
      >
        <TabularKpi
          label="Total Trunk Network"
          value={summary.total_network_length_km || 12.4}
          unit="km"
          tone="neutral"
        />
        <TabularKpi
          label="Mean Network Load"
          value={summary.average_utilization_pct || 76}
          unit="%"
          tone={summary.average_utilization_pct > 80 ? "critical" : "warning"}
        />
        <TabularKpi
          label="Surcharging Manholes"
          value={summary.surcharged_nodes_count || 12}
          unit="nodes"
          tone="critical"
        />
        <TabularKpi
          label="Outfall River Stage"
          value={summary.outfall_stage_m || 49.85}
          unit="m MSL"
          tone="critical"
        />
      </div>

      {/* Conduits Table + Nodes Inspection */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)",
          gap: "14px",
        }}
      >
        {/* Conduits Table */}
        <div
          className="civic-glass-card"
          style={{
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--glass-border-light)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border-ui)",
              background: "var(--pearl-surface-subtle)",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Stormwater Conduits & Flow Vectors ({conduits.length})
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
                  <th style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Conduit</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Type</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Capacity</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Flow</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Load</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Blockage</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {conduits.map((c: any) => {
                  const isBackflow = c.flow_direction_reversed;
                  const isSurcharged = c.is_surcharged;
                  const statusPillType = isBackflow ? "CRITICAL" : isSurcharged ? "WARNING" : "NORMAL";
                  const statusLabel = isBackflow ? "BACKFLOW" : isSurcharged ? "SURCHARGE" : "NORMAL";

                  return (
                    <tr
                      key={c.conduit_id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background var(--duration-fast)",
                      }}
                    >
                      <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {c.name}
                      </td>
                      <td style={{ padding: "8px 10px", color: "var(--text-muted)" }}>
                        {c.conduit_type.replace("_", " ")}
                      </td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono)" }}>
                        {c.max_flow_m3s} m³/s
                      </td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono)" }}>
                        {c.current_flow_m3s} m³/s
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          color: c.capacity_utilization_pct > 90 ? "var(--critical-primary)" : "var(--text-primary)",
                        }}
                      >
                        {c.capacity_utilization_pct}%
                      </td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono)" }}>
                        {c.blockage_pct}%
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <StatusPill type={statusPillType as any} label={statusLabel} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nodes Inspection */}
        <div
          className="civic-glass-card"
          style={{
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--glass-border-light)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border-ui)",
              background: "var(--pearl-surface-subtle)",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Manhole & Outfall Junctions ({nodes.length})
          </div>
          <div style={{ maxHeight: "420px", overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {nodes.map((n: any) => {
              const isSurcharged = n.is_surcharged;
              return (
                <div
                  key={n.node_id}
                  onClick={() => onSelectNode(n)}
                  className="civic-glass-subtle"
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${isSurcharged ? "var(--critical-border)" : "var(--glass-border-light)"}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: isSurcharged ? "var(--critical-primary-light)" : undefined,
                    transition: "all var(--duration-fast)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {n.name}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                      Rim: {n.rim_elevation_m}m | HGL: <b style={{ color: "var(--text-secondary)" }}>{n.water_level_m}m MSL</b>
                    </div>
                  </div>
                  <StatusPill
                    type={isSurcharged ? "CRITICAL" : "NORMAL"}
                    label={isSurcharged ? "SURCHARGE" : "NORMAL"}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
