import React, { useState } from "react";
import { Layers, ChevronDown, ChevronUp, MapPin, Navigation, Droplets, AlertTriangle } from "lucide-react";

export const MapLegend: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className="civic-glass"
      style={{
        position: "absolute",
        bottom: "8px",
        left: "12px",
        zIndex: 900,
        borderRadius: "var(--r-md)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
        border: "1px solid rgba(255, 255, 255, 0.4)",
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(6px)",
        maxWidth: "240px",
        overflow: "hidden",
        fontSize: "11px",
        userSelect: "none",
      }}
    >
      {/* Header with collapse button */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          borderBottom: isCollapsed ? "none" : "1px solid rgba(0, 0, 0, 0.06)",
          background: "rgba(255, 255, 255, 0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 700, color: "var(--ink-900)" }}>
          <Layers size={13} color="var(--color-rain-text)" />
          <span>TACTICAL MAP LEGEND</span>
        </div>
        <button
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color: "var(--ink-500)",
            display: "flex",
          }}
        >
          {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded Legend Content */}
      {!isCollapsed && (
        <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Inundation Depth Scale */}
          <div>
            <div style={{ fontWeight: 600, color: "var(--ink-700)", marginBottom: "4px" }}>
              Water Depth (Nowcast)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "12px", height: "8px", borderRadius: "2px", background: "#38bdf8" }} />
                <span style={{ color: "var(--ink-800)" }}>&lt;15 cm — Street Ponding</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "12px", height: "8px", borderRadius: "2px", background: "#eab308" }} />
                <span style={{ color: "var(--ink-800)" }}>15–30 cm — Conduit Surcharge</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "12px", height: "8px", borderRadius: "2px", background: "#f97316" }} />
                <span style={{ color: "var(--ink-800)" }}>30–60 cm — Severe Waterlogging</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "12px", height: "8px", borderRadius: "2px", background: "#ef4444" }} />
                <span style={{ color: "var(--ink-800)", fontWeight: 600 }}>&gt;60 cm — Critical Depression</span>
              </div>
            </div>
          </div>

          {/* Road Corridors */}
          <div style={{ borderTop: "1px solid rgba(0, 0, 0, 0.05)", paddingTop: "6px" }}>
            <div style={{ fontWeight: 600, color: "var(--ink-700)", marginBottom: "4px" }}>
              Road Network Passability
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "16px", height: "3px", background: "#10b981", borderRadius: "1px" }} />
                <span>Open for All Transit</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "16px", height: "3px", background: "#f59e0b", borderRadius: "1px" }} />
                <span>Restricted (High-Clearance)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "16px", height: "3px", background: "#ef4444", borderRadius: "1px" }} />
                <span style={{ fontWeight: 600, color: "#dc2626" }}>Blocked / Impassable</span>
              </div>
            </div>
          </div>

          {/* Safe Route */}
          <div style={{ borderTop: "1px solid rgba(0, 0, 0, 0.05)", paddingTop: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "16px", height: "4px", background: "#059669", borderRadius: "2px", border: "1px dashed #ffffff" }} />
              <span style={{ fontWeight: 600, color: "#047857" }}>Flood-Aware Safe Route</span>
            </div>
          </div>

          {/* Elevation Baseline */}
          <div
            style={{
              borderTop: "1px solid rgba(0, 0, 0, 0.05)",
              paddingTop: "4px",
              color: "var(--ink-500)",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
            }}
          >
            Terrain: Copernicus GLO-30 DSM (30m)
          </div>
        </div>
      )}
    </div>
  );
};
