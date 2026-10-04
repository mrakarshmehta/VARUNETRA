import React, { useState } from "react";
import { Power } from "lucide-react";
import { MunicipalPump } from "../../types";
import { api } from "../../api/client";
import { CivicButton } from "../primitives/CivicButton";
import { StatusPill } from "../primitives/StatusPill";
import { TabularKpi } from "../primitives/TabularKpi";
import { OperatorEmptyState } from "../primitives";
import { ActionConfirmationModal } from "../ActionConfirmationModal";

interface PumpsModuleProps {
  pumps: MunicipalPump[];
  onPumpUpdated: (pump: MunicipalPump) => void;
  onSelectPump?: (pump: MunicipalPump) => void;
}

export const PumpsModule: React.FC<PumpsModuleProps> = ({ pumps, onPumpUpdated, onSelectPump }) => {
  const [submittingPumpId, setSubmittingPumpId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    resource: string;
    effect: string;
    variant: "primary" | "warning" | "danger";
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    resource: "",
    effect: "",
    variant: "primary",
    action: async () => {},
  });

  const handlePumpAction = async (id: string, action: string, zoneId?: string) => {
    if (submittingPumpId) return;
    setSubmittingPumpId(id);
    try {
      const res = await api.actionPump(id, action, zoneId);
      onPumpUpdated(res);
    } catch (err) {
      console.error("Pump action failed:", err);
    } finally {
      setSubmittingPumpId(null);
    }
  };

  const totalDischarge = pumps.reduce((acc, p) => acc + (p.status === "ACTIVE" ? p.discharge_capacity_m3h : 0), 0);
  const activeCount = pumps.filter((p) => p.status === "ACTIVE").length;

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
      {/* Module Header & Capacity Banner */}
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
              Municipal Dewatering Fleet Operations
            </h2>
            <StatusPill type="ACTIVE" label="Equipment Telemetry" />
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Real-time status, discharge capacities, and dispatch coordination for trailer-mounted high-flow pumps.
          </p>
        </div>

        {/* Telemetry Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <TabularKpi
            label="Active Discharge"
            value={totalDischarge.toLocaleString()}
            unit="m³/h"
            tone="rain"
          />
          <TabularKpi
            label="Operational Units"
            value={`${activeCount} / ${pumps.length}`}
            tone="normal"
          />
        </div>
      </div>

      {/* Equipment Monitoring Table */}
      <div
        className="civic-glass-card"
        style={{
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--glass-border-light)",
        }}
      >
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
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Pump ID & Unit Name</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Location</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Type</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Rated Capacity</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Current Output</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Runtime</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Fuel Reserve</th>
                <th style={{ padding: "8px 12px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600 }}>Dispatch Controls</th>
              </tr>
            </thead>
            <tbody>
              {pumps.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "32px 16px" }}>
                    <OperatorEmptyState
                      title="NO PUMPS DEPLOYED"
                      description="All registered pumps are currently available or standby."
                    />
                  </td>
                </tr>
              ) : (
                pumps.map((pump) => {
                  const isActive = pump.status === "ACTIVE" || (pump.status as string) === "PUMPING";
                  const isBusy = submittingPumpId === pump.id;

                  return (
                    <tr
                      key={pump.id}
                      onClick={() => onSelectPump && onSelectPump(pump)}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        cursor: onSelectPump ? "pointer" : "default",
                        transition: "background var(--duration-fast)",
                      }}
                    >
                      {/* ID & Name */}
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: isActive ? "var(--safe-primary)" : "var(--border-strong)",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              fontFamily: "var(--font-mono)",
                              flexShrink: 0,
                            }}
                          >
                            P
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{pump.name}</div>
                            <div style={{ fontSize: "0.66rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{pump.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ fontWeight: 500, color: "var(--text-secondary)" }}>{pump.location_name || "Deployed"}</div>
                        <div style={{ fontSize: "0.66rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          {pump.lat.toFixed(4)}°N, {pump.lng.toFixed(4)}°E
                        </div>
                      </td>

                      {/* Type */}
                      <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                        {pump.pump_type}
                      </td>

                      {/* Rated Capacity */}
                      <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
                        {pump.discharge_capacity_m3h} m³/h
                      </td>

                      {/* Current Output */}
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: "var(--font-mono)",
                          color: isActive ? "var(--brand-primary)" : "var(--text-muted)",
                          fontWeight: 700,
                        }}
                      >
                        {isActive ? `${pump.discharge_capacity_m3h} m³/h` : "0 m³/h (Idle)"}
                      </td>

                      {/* Runtime */}
                      <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                        {isActive ? "4h 18m" : "Standby"}
                      </td>

                      {/* Fuel Reserve */}
                      <td style={{ padding: "8px 12px", minWidth: "120px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", marginBottom: "3px" }}>
                          <span style={{ color: "var(--text-muted)" }}>Diesel</span>
                          <b style={{ fontFamily: "var(--font-mono)", color: pump.fuel_level_pct < 30 ? "var(--critical-primary)" : "var(--text-primary)" }}>
                            {pump.fuel_level_pct}%
                          </b>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: "5px",
                            background: "var(--border-subtle)",
                            borderRadius: "var(--radius-full)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pump.fuel_level_pct}%`,
                              height: "100%",
                              background: pump.fuel_level_pct < 30 ? "var(--critical-primary)" : "var(--safe-primary)",
                              borderRadius: "var(--radius-full)",
                            }}
                          />
                        </div>
                      </td>

                      {/* Operational Status */}
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <StatusPill
                          type={isActive ? "NORMAL" : "WARNING"}
                          label={pump.status}
                        />
                      </td>

                      {/* Dispatch Controls */}
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {isActive ? (
                            <CivicButton
                              size="sm"
                              variant="secondary"
                              disabled={isBusy}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePumpAction(pump.id, "RECALL");
                              }}
                            >
                              {isBusy ? "Updating..." : "Standby"}
                            </CivicButton>
                          ) : (
                            <>
                              <CivicButton
                                size="sm"
                                variant="secondary"
                                disabled={isBusy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmConfig({
                                    isOpen: true,
                                    title: "DISPATCH PUMP",
                                    resource: `${pump.name} (${pump.id})`,
                                    effect: "Dispatches mobile high-flow trailer to low-lying catchment to dewater critical inundation depressions.",
                                    variant: "warning",
                                    action: () => handlePumpAction(pump.id, "DISPATCH", "CAT-02"),
                                  });
                                }}
                              >
                                {isBusy ? "..." : "Dispatch"}
                              </CivicButton>
                              <CivicButton
                                size="sm"
                                variant="primary"
                                disabled={isBusy}
                                icon={<Power size={12} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmConfig({
                                    isOpen: true,
                                    title: "ACTIVATE PUMP DEWATERING",
                                    resource: `${pump.name} (${pump.id})`,
                                    effect: `Initiates high-volume pumping (${pump.discharge_capacity_m3h} m³/h) into municipal trunk drainage network.`,
                                    variant: "primary",
                                    action: () => handlePumpAction(pump.id, "ACTIVATE", "CAT-02"),
                                  });
                                }}
                              >
                                {isBusy ? "Starting..." : "Run"}
                              </CivicButton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Confirmation Modal for Pump Operations */}
      <ActionConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmConfig.action}
        actionTitle={confirmConfig.title}
        resourceName={confirmConfig.resource}
        expectedEffect={confirmConfig.effect}
        variant={confirmConfig.variant}
        confirmButtonText="Execute Dispatch"
      />
    </div>
  );
};
