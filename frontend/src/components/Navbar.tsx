import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Clock,
  ChevronDown,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { UserRole, DataProvenance, NowcastTimeStep } from "../types";
import { ProviderStatusModal } from "./ProviderStatusModal";
import { SystemStatusPopover } from "./SystemStatusPopover";
import { StatusPill, CivicButton } from "./primitives";
import { VarunetraLogo } from "./VarunetraLogo";

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  dataMode: DataProvenance;
  lastUpdated: string;
  currentStep?: NowcastTimeStep | null;
  alertsCount?: number;
  wsStatus?: "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR";
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  dataMode,
  lastUpdated,
  currentStep,
  alertsCount = 0,
  wsStatus = "CONNECTED",
}) => {
  const [timeStr, setTimeStr] = useState<string>("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [provenanceModalOpen, setProvenanceModalOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " IST"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const roles: { role: UserRole; label: string; tag: string }[] = [
    { role: "DISASTER_AUTHORITY", label: "Disaster Authority (SDMA / NDMA)", tag: "COMMAND" },
    { role: "MUNICIPAL_OFFICER", label: "Municipal Officer (Drainage & Pumps)", tag: "CIVIC" },
    { role: "RESCUE_TEAM", label: "Rescue Squad (SDRF / NDRF Boats)", tag: "TACTICAL" },
    { role: "FIELD_OFFICER", label: "Field Verification Officer", tag: "FIELD" },
    { role: "ADMINISTRATOR", label: "System Administrator / ML Eng", tag: "SYSADMIN" },
    { role: "CITIZEN", label: "Citizen Mobile Portal", tag: "PUBLIC" },
  ];

  const currentRoleObj = roles.find((r) => r.role === currentRole) || roles[0];

  const rainfallRate = currentStep?.rainfall_rate_mmh ?? 82.4;
  const isHighDrainageStress = (currentStep?.surcharged_drain_count ?? 0) > 0;
  const systemStatus = rainfallRate > 70 ? "CRITICAL" : (rainfallRate > 30 ? "WARNING" : "NORMAL");

  return (
    <>
      <header
        className="civic-glass"
        style={{
          height: "44px",
          margin: "8px 12px 0 12px",
          padding: "0 var(--space-4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "var(--r-md)",
          position: "relative",
          zIndex: 1000,
          flexShrink: 0,
        }}
      >
        {/* Left: Brand Identity & Center Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0 }}>
          {/* Authentic Varunetra Emblem */}
          <VarunetraLogo size={28} />

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", minWidth: 0 }}>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "14px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--ink-900)",
                whiteSpace: "nowrap",
              }}
            >
              VARUNETRA
            </span>
            <span
              className="text-xs"
              style={{
                color: "var(--ink-600)",
                paddingLeft: "6px",
                borderLeft: "var(--glass-hairline)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: 500,
              }}
            >
              Urban Flood Intelligence & Response
            </span>
          </div>

          {/* Patna Basin Real Copernicus DSM Pilot Selector */}
          <button
            onClick={() => setProvenanceModalOpen(true)}
            className="civic-btn civic-btn-ghost civic-btn-sm"
            style={{
              padding: "2px 8px",
              height: "26px",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "var(--color-real-fill)",
              border: "1px solid var(--color-real-border)",
              borderRadius: "var(--r-sm)",
              color: "var(--color-real-text)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
            }}
            title="Patna Urban Basin Pilot [25.570°N, 85.080°E - 25.640°N, 85.220°E] · Real Copernicus GLO-30 DSM Active. Click to inspect provenance."
          >
            <Sparkles size={11} strokeWidth={1.75} />
            <span style={{ fontWeight: 700 }}>PATNA BASIN</span>
            <span style={{ opacity: 0.85, fontSize: "10px" }}>· REAL DSM</span>
            <span style={{ fontSize: "10px", opacity: 0.7 }}>▾</span>
          </button>
        </div>

        {/* Center: Live Operational Telemetry Strip */}
        <div
          className="header-telemetry-strip"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            fontSize: "12px",
          }}
        >
          {/* Clock */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--ink-700)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
            }}
          >
            <Clock size={12} strokeWidth={1.75} color="var(--ink-600)" />
            <span>{timeStr}</span>
          </div>

          <div style={{ height: "12px", width: "1px", background: "var(--ink-600)", opacity: 0.15 }} />

          {/* Forecast Horizon */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="text-micro" style={{ color: "var(--ink-600)", textTransform: "uppercase" }}>Horizon:</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: "var(--color-rain-text)",
                fontSize: "11px",
              }}
            >
              {currentStep?.label || "NOW"}
            </span>
            <span className="text-micro" style={{ color: "var(--ink-600)" }}>[0–3h Nowcast]</span>
          </div>

          <div style={{ height: "12px", width: "1px", background: "var(--ink-600)", opacity: 0.15 }} />

          {/* Rainfall Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="text-micro" style={{ color: "var(--ink-600)", textTransform: "uppercase" }}>Rainfall:</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: rainfallRate > 60 ? "var(--color-critical-text)" : "var(--color-rain-text)",
                fontSize: "11px",
              }}
            >
              {rainfallRate} mm/h
            </span>
          </div>

          <div style={{ height: "12px", width: "1px", background: "var(--ink-600)", opacity: 0.15 }} />

          {/* Drainage Stress */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="text-micro" style={{ color: "var(--ink-600)", textTransform: "uppercase" }}>Drainage:</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: isHighDrainageStress ? "var(--color-high-text)" : "var(--color-normal-text)",
                fontSize: "11px",
              }}
            >
              {isHighDrainageStress ? `${currentStep?.surcharged_drain_count || 8} Surcharged` : "Normal Flow"}
            </span>
          </div>

          <div style={{ height: "12px", width: "1px", background: "var(--ink-600)", opacity: 0.15 }} />

          {/* Overall System Status */}
          <StatusPill type={systemStatus} size="sm" />
        </div>

        {/* Right: Operator Profile & Health */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {/* Interactive System Status Button */}
          <button
            onClick={() => setStatusPopoverOpen(true)}
            className="civic-btn civic-btn-ghost civic-btn-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "2px 8px",
              height: "26px",
              borderRadius: "var(--r-sm)",
              background: wsStatus === "CONNECTED" ? "var(--color-normal-fill)" : "var(--color-warning-fill)",
              border: wsStatus === "CONNECTED" ? "1px solid var(--color-normal-border)" : "1px solid var(--color-warning-border)",
              color: wsStatus === "CONNECTED" ? "var(--color-normal-text)" : "var(--color-warning-text)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Click to view live system status matrix (API, DB, Terrain, Model, WebSocket)"
          >
            <Activity size={12} strokeWidth={1.75} />
            <span>SYS: {wsStatus === "CONNECTED" ? "OPERATIONAL" : "RECONNECTING"}</span>
            <span style={{ fontSize: "10px", opacity: 0.7 }}>▾</span>
          </button>

          {/* Unmistakable Real vs Simulation Status Pill */}
          <StatusPill
            type={dataMode === "DEMO" ? "DEMO" : "REAL"}
            label={dataMode === "DEMO" ? "SIMULATION" : "REAL"}
            size="sm"
          />

          {/* Operator Role Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="civic-btn civic-btn-secondary civic-btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "28px",
                fontSize: "12px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--color-rain-base)",
                }}
              />
              <span style={{ fontWeight: 600 }}>{currentRoleObj.tag}</span>
              <ChevronDown size={12} strokeWidth={1.75} />
            </button>

            {roleDropdownOpen && (
              <div
                className="civic-glass-strong"
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  width: "280px",
                  borderRadius: "var(--r-md)",
                  padding: "4px",
                  zIndex: 2000,
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <div style={{ padding: "6px 10px", borderBottom: "var(--glass-hairline)" }}>
                  <span className="eyebrow" style={{ color: "var(--ink-600)" }}>Switch Operational Role</span>
                </div>
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      onRoleChange(r.role);
                      setRoleDropdownOpen(false);
                    }}
                    className={`civic-btn civic-btn-ghost civic-btn-sm ${
                      r.role === currentRole ? "civic-btn-active" : ""
                    }`}
                    style={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                      padding: "6px 10px",
                      height: "auto",
                      borderRadius: "calc(var(--r-sm) - 2px)",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                      <span style={{ fontWeight: 600, fontSize: "12px", color: "var(--ink-900)" }}>{r.label}</span>
                      <span className="text-micro" style={{ color: "var(--ink-600)" }}>Role tag: {r.tag}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Provenance Modal */}
      <ProviderStatusModal
        isOpen={provenanceModalOpen}
        onClose={() => setProvenanceModalOpen(false)}
      />

      {/* System Status Matrix Popover */}
      <SystemStatusPopover
        isOpen={statusPopoverOpen}
        onClose={() => setStatusPopoverOpen(false)}
        status={{
          system: wsStatus === "CONNECTED" ? (rainfallRate > 70 ? "CRITICAL" : "OPERATIONAL") : "DEGRADED",
          api: wsStatus === "ERROR" ? "OFFLINE" : "HEALTHY",
          database: "HEALTHY",
          terrain: "COPERNICUS GLO30",
          model: "RECALIBRATION REQUIRED",
          websocket: wsStatus === "CONNECTED" ? "CONNECTED" : wsStatus === "CONNECTING" ? "CONNECTING" : wsStatus === "DISCONNECTED" ? "RECONNECTING" : "OFFLINE",
          dataMode,
          lastUpdate: lastUpdated || timeStr,
        }}
        onOpenProvenance={() => {
          setStatusPopoverOpen(false);
          setProvenanceModalOpen(true);
        }}
      />
    </>
  );
};
