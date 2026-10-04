import React from "react";
import { CheckCircle2, HardHat } from "lucide-react";
import { DamageReport } from "../../types";
import { StatusPill } from "../primitives/StatusPill";
import { TabularKpi } from "../primitives/TabularKpi";

interface DamageModuleProps {
  damageReports: DamageReport[];
  onReportCreated?: (rep: DamageReport) => void;
}

export const DamageModule: React.FC<DamageModuleProps> = ({ damageReports }) => {
  const reports = damageReports || [];
  const totalCost = reports.reduce((acc, r) => acc + r.estimated_repair_cost_inr, 0);
  const verifiedCount = reports.filter((r) => r.field_verified).length;

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
              Post-Flood Damage Assessment & Verification
            </h2>
            <StatusPill type="ACTIVE" label="Municipal Recovery Auditing" />
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Field engineer geo-tagged infrastructure logs detailing road scour, canal wall breaches, and submerged transformer damage.
          </p>
        </div>

        {/* Summary KPIs */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <TabularKpi
            label="Capital Repair Liability"
            value={`₹ ${totalCost.toLocaleString("en-IN")}`}
            tone="critical"
          />
          <TabularKpi
            label="Field Verified"
            value={`${verifiedCount} / ${reports.length}`}
            tone="normal"
          />
        </div>
      </div>

      {/* Reports Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="civic-glass-card"
            style={{
              padding: "16px",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              border: "1px solid var(--glass-border-light)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)" }}>{rep.zone_name}</span>
                <StatusPill type="SYNTHETIC" label={rep.asset_type} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-primary)",
                  }}
                >
                  ₹ {rep.estimated_repair_cost_inr.toLocaleString("en-IN")}
                </span>
                <StatusPill
                  type={rep.damage_severity === "CRITICAL" ? "CRITICAL" : "WARNING"}
                  label={rep.damage_severity}
                />
              </div>
            </div>

            <div
              className="civic-glass-subtle"
              style={{
                fontSize: "0.76rem",
                color: "var(--text-secondary)",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <strong style={{ color: "var(--text-primary)" }}>Field Notes:</strong> {rep.observed_damage_notes}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <HardHat size={13} color="var(--brand-primary)" />
                <span>
                  Audited By: <strong style={{ color: "var(--text-secondary)" }}>{rep.reported_by}</strong>
                </span>
              </div>

              {rep.field_verified && (
                <span
                  style={{
                    color: "var(--safe-primary)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <CheckCircle2 size={13} /> Ground Verified
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
