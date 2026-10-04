import React from "react";
import { Droplets, Utensils, HeartHandshake } from "lucide-react";
import { ReliefCamp } from "../../types";
import { StatusPill } from "../primitives/StatusPill";

interface ReliefModuleProps {
  reliefCamps: ReliefCamp[];
}

export const ReliefModule: React.FC<ReliefModuleProps> = ({ reliefCamps }) => {
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
              Relief Camp Inventory & Demand Coordination
            </h2>
            <StatusPill type="ACTIVE" label="Supply Chain Tracking" />
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Monitor displaced citizen populations, food rations, potable drinking water reserves, and medicine shortages across designated relief hubs.
          </p>
        </div>

        <StatusPill type="REAL" label="LIVE AUDIT" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "14px",
        }}
      >
        {reliefCamps.map((camp) => (
          <div
            key={camp.id}
            className="civic-glass-card"
            style={{
              padding: "16px",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              border: `1px solid ${camp.has_critical_shortage ? "var(--critical-border)" : "var(--glass-border-light)"}`,
              background: camp.has_critical_shortage ? "var(--critical-primary-light)" : undefined,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)" }}>{camp.name}</div>
              <StatusPill
                type={camp.has_critical_shortage ? "CRITICAL" : "NORMAL"}
                label={camp.has_critical_shortage ? "SHORTAGE" : "STOCKED"}
              />
            </div>

            <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
              Current Occupants: <b>{camp.occupancy}</b> / {camp.capacity}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", fontSize: "0.72rem" }}>
              <div
                className="civic-glass-subtle"
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Utensils size={12} /> Food
                </span>
                <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: "2px", color: "var(--text-primary)" }}>
                  {camp.food_supply_days} Days
                </div>
              </div>

              <div
                className="civic-glass-subtle"
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Droplets size={12} /> Water
                </span>
                <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: "2px", color: "var(--text-primary)" }}>
                  {camp.potable_water_liters.toLocaleString()} L
                </div>
              </div>

              <div
                className="civic-glass-subtle"
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <HeartHandshake size={12} /> Meds
                </span>
                <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: "2px", color: "var(--text-primary)" }}>
                  {camp.medicine_kits} Kits
                </div>
              </div>
            </div>

            {camp.has_critical_shortage && (
              <div
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--pearl-surface)",
                  border: "1px solid var(--critical-border)",
                  fontSize: "0.72rem",
                  color: "var(--critical-text)",
                }}
              >
                <b>Urgent Dispatch Required:</b> {camp.shortage_items.join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
