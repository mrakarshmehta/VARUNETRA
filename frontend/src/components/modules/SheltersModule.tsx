import React from "react";
import { Building2, HeartPulse, ExternalLink, Zap, Droplet } from "lucide-react";
import { ShelterHospital } from "../../types";
import { CivicButton } from "../primitives/CivicButton";
import { StatusPill } from "../primitives/StatusPill";
import { TabularKpi } from "../primitives/TabularKpi";

interface SheltersModuleProps {
  facilities: ShelterHospital[];
  onSelectFacility: (fac: ShelterHospital) => void;
}

export const SheltersModule: React.FC<SheltersModuleProps> = ({ facilities, onSelectFacility }) => {
  const totalCapacity = facilities.reduce((sum, f) => sum + f.capacity, 0);
  const totalOccupancy = facilities.reduce((sum, f) => sum + f.current_occupancy, 0);
  const availableSpace = totalCapacity - totalOccupancy;

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
      {/* Module Header */}
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
              Shelters & Emergency Medical Facilities
            </h2>
            <StatusPill type="ACTIVE" label="Facility Dispatch Registry" />
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Operational capacity, flood passability, and emergency infrastructure across designated relief centers.
          </p>
        </div>

        {/* Quick Capacity Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <TabularKpi
            label="Total Capacity"
            value={totalCapacity}
            unit="Beds"
            tone="neutral"
          />
          <TabularKpi
            label="Occupied"
            value={totalOccupancy}
            unit="Beds"
            tone="rain"
          />
          <TabularKpi
            label="Available"
            value={availableSpace}
            unit="Beds"
            tone="normal"
          />
        </div>
      </div>

      {/* Facilities Operational Table */}
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
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Facility / Hospital</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Distance</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Capacity & Occupancy</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Road Access</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Flood Risk</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Auxiliary Support</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Contact Phone</th>
                <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((fac) => {
                const isHospital = fac.facility_type === "HOSPITAL";
                const occPct = Math.round((fac.current_occupancy / fac.capacity) * 100);
                const isPassable = fac.road_passability === "PASSABLE";

                return (
                  <tr
                    key={fac.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background var(--duration-fast)",
                    }}
                  >
                    {/* Name & Address */}
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "var(--radius-sm)",
                            background: isHospital ? "var(--brand-primary-light)" : "var(--safe-primary-light)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {isHospital ? (
                            <HeartPulse size={15} color="var(--brand-primary)" />
                          ) : (
                            <Building2 size={15} color="var(--safe-primary)" />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{fac.name}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{fac.address}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "8px 12px" }}>
                      <StatusPill
                        type={isHospital ? "ACTIVE" : "NORMAL"}
                        label={isHospital ? "MEDICAL CENTER" : "RELIEF SHELTER"}
                      />
                    </td>

                    {/* Distance */}
                    <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                      1.4 km
                    </td>

                    {/* Capacity & Occupancy Meter */}
                    <td style={{ padding: "8px 12px", minWidth: "150px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "3px" }}>
                        <span>
                          <b>{fac.current_occupancy}</b> / {fac.capacity}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            color: occPct > 80 ? "var(--critical-primary)" : "var(--brand-primary)",
                          }}
                        >
                          {occPct}%
                        </span>
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
                            width: `${occPct}%`,
                            height: "100%",
                            background: occPct > 80 ? "var(--critical-primary)" : "var(--brand-primary)",
                            borderRadius: "var(--radius-full)",
                          }}
                        />
                      </div>
                    </td>

                    {/* Road Accessibility */}
                    <td style={{ padding: "8px 12px" }}>
                      <StatusPill
                        type={isPassable ? "NORMAL" : "WARNING"}
                        label={fac.road_passability}
                      />
                    </td>

                    {/* Flood Risk */}
                    <td style={{ padding: "8px 12px" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontFamily: "var(--font-mono)",
                          color: isPassable ? "var(--safe-primary)" : "var(--critical-primary)",
                          fontWeight: 700,
                        }}
                      >
                        {isPassable ? "LOW FLOOD RISK" : "PERIMETER WATERLOGGING"}
                      </span>
                    </td>

                    {/* Auxiliary Power/Water */}
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.7rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "var(--safe-primary)", fontWeight: 600 }}>
                          <Zap size={12} />
                          <span>Gen OK</span>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "var(--brand-primary)", fontWeight: 600 }}>
                          <Droplet size={12} />
                          <span>Water</span>
                        </span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      {fac.phone}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      <CivicButton
                        size="sm"
                        variant="secondary"
                        icon={<ExternalLink size={12} />}
                        onClick={() => onSelectFacility(fac)}
                      >
                        Locate
                      </CivicButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
