import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Database,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
} from "lucide-react";
import { ProviderStatusSummary, ProviderStatus } from "../types";
import { api } from "../api/client";

interface ProviderStatusModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

export const ProviderStatusModal: React.FC<ProviderStatusModalProps> = ({
  isOpen = true,
  onClose,
}) => {
  const [summary, setSummary] = useState<ProviderStatusSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getProvidersStatus()
        .then((res) => setSummary(res))
        .catch((err) => console.error("Error fetching provider status:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return {
          bg: "#f0fdf4",
          border: "#bbf7d0",
          color: "#16a34a",
          label: "CONNECTED",
          icon: CheckCircle2,
        };
      case "SIMULATED":
        return {
          bg: "#eff6ff",
          border: "#bfdbfe",
          color: "#2563eb",
          label: "SIMULATED",
          icon: Server,
        };
      case "CACHED":
        return {
          bg: "#fffbeb",
          border: "#fef08a",
          color: "#d97706",
          label: "CACHED",
          icon: Database,
        };
      case "NOT CONFIGURED":
      default:
        return {
          bg: "#fef2f2",
          border: "#fecaca",
          color: "#dc2626",
          label: "NOT CONFIGURED",
          icon: XCircle,
        };
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "820px",
          background: "#ffffff",
          borderRadius: "var(--radius-lg)",
          padding: "26px",
          boxShadow: "var(--shadow-hover)",
          border: "1px solid var(--border-subtle)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--brand-primary)",
              }}
            >
              <Database size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                Data Providers & Provenance Registry
              </h3>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Zero-Fabrication Guarantee • MoES SIH26085 Scientific Compliance
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
          >
            Close
          </button>
        </div>

        {/* Pilot Geography Disclaimer */}
        <div
          style={{
            padding: "12px 16px",
            background: "#fffbeb",
            borderRadius: "8px",
            border: "1px solid #fef08a",
            marginBottom: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.82rem", color: "#b45309" }}>
            <AlertTriangle size={16} />
            <span>PILOT GEOGRAPHY: {summary?.pilot_geography_type || "SYNTHETIC PILOT GEOGRAPHY"}</span>
          </div>
          <div style={{ fontSize: "0.76rem", color: "#92400e", marginTop: "4px", lineHeight: 1.5 }}>
            {summary?.pilot_geography_disclaimer || "Synthetic demonstration model of Patna urban basin. Conduits, DEM elevation matrices, and municipal ward geometries are synthetic benchmark data calibrated for hydrological simulation. Not official Patna municipal GIS data."}
          </div>
        </div>

        {/* Provider Table */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)" }}>Provider Name</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)" }}>Category</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)" }}>Status</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)" }}>Data Mode</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)" }}>Source / Notes</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.providers || []).map((p: ProviderStatus) => {
                const badge = getStatusBadge(p.connection_status);
                const Icon = badge.icon;
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>{p.category}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        <Icon size={12} />
                        {p.connection_status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span className="badge badge-provenance" style={{ fontSize: "0.7rem" }}>
                        {p.provenance}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      <div>{p.notes}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "#64748b" }}>
                        {p.endpoint_or_source}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Strict Data Provenance Rules Explanation */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "16px" }}>
          <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontWeight: 700, fontSize: "0.74rem", color: "#16a34a" }}>REAL</span>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Authoritative, live field-calibrated government telemetry.
            </p>
          </div>
          <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontWeight: 700, fontSize: "0.74rem", color: "#2563eb" }}>SIMULATED</span>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Dynamic hydrodynamic equations (1D-2D coupled).
            </p>
          </div>
          <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontWeight: 700, fontSize: "0.74rem", color: "#7c3aed" }}>SYNTHETIC</span>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Pilot GIS geometry, manhole elevation and conduit attributes.
            </p>
          </div>
          <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontWeight: 700, fontSize: "0.74rem", color: "#d97706" }}>CACHED</span>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Pre-computed offline flood hazard matrices & map tiles.
            </p>
          </div>
          <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontWeight: 700, fontSize: "0.74rem", color: "#0891b2" }}>DEMO</span>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              15-stage interactive disaster walkthrough scenarios.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  );
};
