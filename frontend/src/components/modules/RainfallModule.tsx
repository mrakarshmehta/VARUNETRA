import React from "react";
import { CloudRain, Radio, Waves } from "lucide-react";
import { StatusPill } from "../primitives/StatusPill";

interface RainfallModuleProps {
  rainfallData: any;
}

export const RainfallModule: React.FC<RainfallModuleProps> = ({ rainfallData }) => {
  if (!rainfallData) return null;

  const obs = rainfallData.current_observation || {};
  const radar = rainfallData.radar_qpe || {};
  const sat = rainfallData.satellite_qpe || {};
  const river = rainfallData.river_outfall_stage || {};

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
              Meteorological & River Telemetry Ingestion
            </h2>
            <StatusPill type="ACTIVE" label="Multi-Sensor Fusion" />
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Multi-source precipitation forcing: Automated Rain Gauges (ARG), Doppler Weather Radar (DWR), INSAT-3DR satellite estimates, and river stage backwater sensors.
          </p>
        </div>

        <StatusPill
          type="REAL"
          label="IMD / DWR / MOSDAC / CWC INGESTION"
        />
      </div>

      {/* Grid of 4 Ingestion Adapters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "14px",
        }}
      >
        {/* Card 1: Automated Rain Gauge */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--brand-primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CloudRain size={16} color="var(--brand-primary)" />
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Automated Rain Gauge (ARG)
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Surface Pluviograph</div>
              </div>
            </div>
            <StatusPill type="REAL" label="STATION: PAT-01" />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: "var(--brand-primary)",
                lineHeight: 1,
              }}
            >
              {obs.intensity_mm_per_hr || 48.5}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>mm/h</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <div
              className="civic-glass-subtle"
              style={{
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>1h Accum</div>
              <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                {obs.accumulated_1h_mm} mm
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
              <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>3h Accum</div>
              <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                {obs.accumulated_3h_mm} mm
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
              <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>24h Total</div>
              <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                {obs.accumulated_24h_mm} mm
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Doppler Weather Radar QPE */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--drain-primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Radio size={16} color="var(--drain-primary)" />
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Doppler Radar (DWR) QPE
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>IMD S-Band Quantitative Precip</div>
              </div>
            </div>
            <StatusPill type="HIGH" label="CONVECTIVE CORE" />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: "var(--drain-primary)",
                lineHeight: 1,
              }}
            >
              {radar.reflectivity_dbz_max || 52.4}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>dBZ Max</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div
              className="civic-glass-subtle"
              style={{
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>Storm Cell Velocity</div>
              <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-primary)" }}>
                {radar.storm_velocity_kmh} km/h (SW to NE)
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
              <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>Grid Resolution</div>
              <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-primary)" }}>
                {radar.resolution_m} meters
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Satellite INSAT-3DR QPE */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--brand-primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CloudRain size={16} color="var(--brand-primary)" />
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  INSAT-3DR Hydro-Estimator
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>MOSDAC Space-borne Infrared</div>
              </div>
            </div>
            <StatusPill type="NORMAL" label="GEO-SYNCHRONOUS" />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: "var(--brand-primary)",
                lineHeight: 1,
              }}
            >
              {sat.cloud_top_temp_c || -68.5}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>°C CTT</span>
          </div>

          <div
            className="civic-glass-subtle"
            style={{
              padding: "10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.74rem",
              color: "var(--text-secondary)",
            }}
          >
            Precipitation Rate: <b>{sat.satellite_derived_intensity_mmh || 44.0} mm/h</b> • Coverage confidence: 86%
          </div>
        </div>

        {/* Card 4: River Outfall Stage Sensor (CWC) */}
        <div
          className="civic-glass-card"
          style={{
            padding: "16px",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: "1px solid var(--critical-border)",
            background: "var(--critical-primary-light)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--critical-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Waves size={16} color="var(--critical-primary)" />
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--critical-primary)" }}>
                  River Outfall Stage (CWC)
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Ganga Outfall Gauge</div>
              </div>
            </div>
            <StatusPill type="CRITICAL" label="BACKWATER HEAD" />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: "var(--critical-primary)",
                lineHeight: 1,
              }}
            >
              {river.current_stage_m || 49.85}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--critical-primary)", fontWeight: 600 }}>m MSL</span>
          </div>

          <div
            style={{
              padding: "10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--pearl-surface)",
              border: "1px solid var(--critical-border)",
              fontSize: "0.74rem",
              color: "var(--critical-text)",
            }}
          >
            Danger Level: <b>{river.danger_level_m || 50.52}m</b> • Outfall flap gates submerged. Gravity drainage constrained; forced pumping required.
          </div>
        </div>
      </div>
    </div>
  );
};
