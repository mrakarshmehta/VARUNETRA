import React from "react";
import {
  Activity,
  Server,
  Database,
  Mountain,
  Cpu,
  Wifi,
  WifiOff,
  Clock,
  FlaskConical,
  ShieldCheck,
  X,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { StatusPill } from "./primitives/StatusPill";
import { CivicButton } from "./primitives/CivicButton";
import { DataProvenance } from "../types";

export interface SystemStatusData {
  system: "OPERATIONAL" | "DEGRADED" | "CRITICAL";
  api: "HEALTHY" | "DEGRADED" | "OFFLINE";
  database: "HEALTHY" | "DEGRADED" | "ERROR";
  terrain: "COPERNICUS GLO30" | "SYNTHETIC" | "AWAITING";
  model: "READY" | "RECALIBRATION REQUIRED";
  websocket: "CONNECTED" | "CONNECTING" | "RECONNECTING" | "OFFLINE";
  dataMode: DataProvenance;
  lastUpdate: string;
  pingMs?: number;
}

export interface SystemStatusPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatusData;
  onOpenProvenance?: () => void;
}

export const SystemStatusPopover: React.FC<SystemStatusPopoverProps> = ({
  isOpen,
  onClose,
  status,
  onOpenProvenance,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="glass-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        zIndex: 1300,
        padding: "56px 20px 20px 20px",
      }}
    >
      <div
        className="civic-glass"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "360px",
          borderRadius: "var(--r-lg)",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.45)",
          overflow: "hidden",
          animation: "fadeIn 0.15s ease-out",
          backgroundColor: "rgba(255, 255, 255, 0.96)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={16} color="var(--color-rain-text)" />
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-900)" }}>
              System Health & Telemetry Status
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "var(--ink-500)",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Status Grid */}
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* SYSTEM */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ink-700)" }}>
              <Activity size={13} color="var(--ink-500)" />
              <span>SYSTEM</span>
            </div>
            <StatusPill type={status.system} size="sm" />
          </div>

          {/* API */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ink-700)" }}>
              <Server size={13} color="var(--ink-500)" />
              <span>REST API</span>
            </div>
            <StatusPill type={status.api} size="sm" />
          </div>

          {/* DATABASE */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ink-700)" }}>
              <Database size={13} color="var(--ink-500)" />
              <span>DATABASE (SQLite WAL)</span>
            </div>
            <StatusPill type={status.database} size="sm" />
          </div>

          {/* TERRAIN */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ink-700)" }}>
              <Mountain size={13} color="var(--ink-500)" />
              <span>TERRAIN ENGINE</span>
            </div>
            <StatusPill
              type={status.terrain === "COPERNICUS GLO30" ? "REAL" : "NORMAL"}
              label={status.terrain}
              size="sm"
            />
          </div>

          {/* MODEL */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ink-700)" }}>
              <Cpu size={13} color="var(--ink-500)" />
              <span>NOWCAST MODEL</span>
            </div>
            <StatusPill
              type={status.model === "READY" ? "READY" : "WARNING"}
              label={status.model}
              size="sm"
            />
          </div>

          {/* WEBSOCKET */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ink-700)" }}>
              {status.websocket === "CONNECTED" ? (
                <Wifi size={13} color="#059669" />
              ) : (
                <WifiOff size={13} color="#dc2626" />
              )}
              <span>LIVE TELEMETRY FEED</span>
            </div>
            <StatusPill type={status.websocket} size="sm" />
          </div>

          {/* DATA MODE */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ink-700)" }}>
              <FlaskConical size={13} color="var(--ink-500)" />
              <span>OPERATING MODE</span>
            </div>
            <StatusPill
              type={status.dataMode === "DEMO" ? "DEMO" : "REAL"}
              label={status.dataMode === "DEMO" ? "DEMO / SIMULATION" : "REAL"}
              size="sm"
            />
          </div>

          {/* LAST UPDATE */}
          <div
            className="civic-glass-soft"
            style={{
              marginTop: "4px",
              padding: "8px 10px",
              borderRadius: "var(--r-sm)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "11px",
            }}
          >
            <span style={{ color: "var(--ink-600)" }}>LAST STATE REFRESH:</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink-900)" }}>
              {status.lastUpdate}
            </span>
          </div>

          {/* Scientific Disclaimer Notice */}
          <div
            style={{
              fontSize: "10px",
              color: "var(--ink-600)",
              lineHeight: 1.4,
              borderTop: "1px solid rgba(0, 0, 0, 0.06)",
              paddingTop: "8px",
              marginTop: "4px",
            }}
          >
            <b>Scientific Provenance: </b>
            Copernicus GLO-30 DSM (30m) active. Rainfall forcing is synthetically generated for demonstration. Real-world ML calibration flag active.
          </div>
        </div>

        {/* Footer Actions */}
        {onOpenProvenance && (
          <div
            style={{
              padding: "8px 16px 12px 16px",
              borderTop: "1px solid rgba(0, 0, 0, 0.08)",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <CivicButton
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose();
                onOpenProvenance();
              }}
              icon={<ExternalLink size={12} />}
            >
              Inspect Terrain Metadata
            </CivicButton>
          </div>
        )}
      </div>
    </div>
  );
};
