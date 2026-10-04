import React, { useState, useEffect } from "react";
import {
  CloudRain,
  Waves,
  GitFork,
  AlertOctagon,
  Droplet,
  Ruler,
  Car,
  Navigation,
  ChevronRight,
} from "lucide-react";
import { CausalityStep, NowcastTimeStep } from "../types";
import { api } from "../api/client";

interface CausalityPipelineRibbonProps {
  currentStep?: NowcastTimeStep | null;
  onNavigateToModule?: (moduleKey: any) => void;
}

export const CausalityPipelineRibbon: React.FC<CausalityPipelineRibbonProps> = ({
  currentStep,
  onNavigateToModule,
}) => {
  const [steps, setSteps] = useState<CausalityStep[]>([]);
  const [activeStepDetail, setActiveStepDetail] = useState<CausalityStep | null>(null);

  useEffect(() => {
    api.getCausalityChain()
      .then((res) => setSteps(res.steps || []))
      .catch((err) => console.warn("Failed to fetch causality chain:", err));
  }, []);

  const getStepIcon = (code: string) => {
    switch (code) {
      case "RAINFALL": return CloudRain;
      case "RUNOFF": return Waves;
      case "DRAINAGE_LOAD": return GitFork;
      case "SURCHARGE_BACKFLOW": return AlertOctagon;
      case "STREET_INUNDATION": return Droplet;
      case "FLOOD_DEPTH": return Ruler;
      case "ROAD_IMPACT": return Car;
      case "FLOOD_AWARE_ROUTING": return Navigation;
      default: return Droplet;
    }
  };

  const getStepModule = (code: string) => {
    switch (code) {
      case "RAINFALL": return "rainfall";
      case "RUNOFF": return "nowcast";
      case "DRAINAGE_LOAD": return "drainage";
      case "SURCHARGE_BACKFLOW": return "drainage";
      case "STREET_INUNDATION": return "map";
      case "FLOOD_DEPTH": return "nowcast";
      case "ROAD_IMPACT": return "map";
      case "FLOOD_AWARE_ROUTING": return "routing";
      default: return "overview";
    }
  };

  const getStepValue = (code: string) => {
    if (!currentStep) return "--";
    switch (code) {
      case "RAINFALL":
        return `${currentStep.rainfall_rate_mmh} mm/h`;
      case "RUNOFF":
        return `+${Math.min(65, Math.round(currentStep.accumulated_rainfall_mm * 0.65))}% vol`;
      case "DRAINAGE_LOAD":
        return currentStep.surcharged_drain_count > 0 ? "78% load" : "42% load";
      case "SURCHARGE_BACKFLOW":
        return `${currentStep.surcharged_drain_count} nodes`;
      case "STREET_INUNDATION":
        return `${currentStep.active_inundation_area_sqkm} km²`;
      case "FLOOD_DEPTH":
        return `${currentStep.max_flood_depth_cm} cm`;
      case "ROAD_IMPACT":
        return `${currentStep.high_risk_roads_count} restricted`;
      case "FLOOD_AWARE_ROUTING":
        return "Active";
      default:
        return "--";
    }
  };

  return (
    <div
      className="civic-glass-soft"
      style={{
        borderRadius: "var(--r-md)",
        padding: "6px 10px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        userSelect: "none",
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="eyebrow" style={{ color: "var(--ink-900)" }}>
            Physical Causality Pipeline
          </span>
          <span style={{ fontSize: "10px", color: "var(--ink-600)", fontFamily: "var(--font-mono)" }}>
            [Rainfall → Runoff → Drainage → Surcharge → Inundation → Depth → Road Impact → Routing]
          </span>
        </div>
        <div>
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              background: "rgba(15, 23, 42, 0.05)",
              color: "var(--ink-700)",
              border: "var(--glass-hairline)",
              padding: "1px 5px",
              borderRadius: "var(--r-sm)",
            }}
          >
            HYDRO-MECHANICAL & SURROGATE FLOW
          </span>
        </div>
      </div>

      {/* Stepper Pipeline */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          overflowX: "auto",
        }}
      >
        {steps.map((s, idx) => {
          const Icon = getStepIcon(s.code);
          const val = getStepValue(s.code);
          const isWarning = currentStep && currentStep.rainfall_rate_mmh > 40 && (idx === 2 || idx === 3);
          const isCritical = currentStep && currentStep.max_flood_depth_cm > 30 && (idx === 4 || idx === 5 || idx === 6);

          return (
            <React.Fragment key={s.code}>
              <div
                onClick={() => {
                  setActiveStepDetail(s);
                  if (onNavigateToModule) {
                    onNavigateToModule(getStepModule(s.code));
                  }
                }}
                style={{
                  flex: "1 0 auto",
                  padding: "4px 8px",
                  borderRadius: "var(--r-sm)",
                  background: isCritical
                    ? "var(--color-critical-fill)"
                    : isWarning
                    ? "var(--color-warning-fill)"
                    : "rgba(255, 255, 255, 0.50)",
                  border: `1px solid ${
                    isCritical
                      ? "var(--color-critical-border)"
                      : isWarning
                      ? "var(--color-warning-border)"
                      : "rgba(15, 23, 42, 0.06)"
                  }`,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px",
                  transition: "all var(--motion-duration-fast) var(--motion-ease)",
                  minWidth: "100px",
                }}
                title={`Step ${idx + 1}: ${s.title} — ${s.physical_dynamics}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Icon
                    size={11}
                    strokeWidth={1.75}
                    color={
                      isCritical
                        ? "var(--color-critical-text)"
                        : isWarning
                        ? "var(--color-warning-text)"
                        : "var(--color-rain-text)"
                    }
                  />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-700)" }}>
                    {idx + 1}. {s.title}
                  </span>
                </div>

                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: isCritical
                      ? "var(--color-critical-text)"
                      : isWarning
                      ? "var(--color-warning-text)"
                      : "var(--color-rain-text)",
                  }}
                >
                  {val}
                </div>
              </div>

              {idx < steps.length - 1 && (
                <ChevronRight size={11} strokeWidth={1.75} color="var(--ink-600)" style={{ flexShrink: 0, opacity: 0.5 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Detail Popover if clicked */}
      {activeStepDetail && (
        <div
          className="civic-glass-ultra"
          style={{
            padding: "4px 8px",
            borderRadius: "var(--r-sm)",
            fontSize: "11px",
            color: "var(--color-rain-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            <b>{activeStepDetail.title}:</b> {activeStepDetail.physical_dynamics} · <i>Proxy: {activeStepDetail.surrogate_ml_proxy}</i>
          </span>
          <button
            onClick={() => setActiveStepDetail(null)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--color-rain-text)",
              fontWeight: 700,
              fontSize: "12px",
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
