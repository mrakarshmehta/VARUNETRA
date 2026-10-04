import React from "react";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { NowcastTimeStep } from "../types";
import { CivicButton } from "./primitives";

interface TimelineSliderProps {
  timeSteps: NowcastTimeStep[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  timeSteps,
  currentIndex,
  onSelectIndex,
  isPlaying,
  onTogglePlay,
}) => {
  if (!timeSteps || timeSteps.length === 0) return null;

  const currentStep = timeSteps[currentIndex] || timeSteps[0];

  const handlePrev = () => {
    if (currentIndex > 0) onSelectIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < timeSteps.length - 1) onSelectIndex(currentIndex + 1);
  };

  return (
    <div
      className="civic-glass"
      style={{
        borderRadius: "var(--r-md)",
        padding: "8px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        userSelect: "none",
        zIndex: 850,
      }}
    >
      {/* Top Controller Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Playback Controls & Current Horizon Label */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Play/Pause */}
          <CivicButton
            variant={isPlaying ? "danger" : "primary"}
            size="sm"
            onClick={onTogglePlay}
            icon={isPlaying ? <Pause size={12} strokeWidth={2} /> : <Play size={12} strokeWidth={2} />}
            style={{ width: "28px", height: "28px", padding: 0 }}
            title={isPlaying ? "Pause timeline playback" : "Auto-advance 0-3h timeline"}
          />

          {/* Step Back */}
          <CivicButton
            variant="secondary"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            icon={<ChevronLeft size={13} strokeWidth={2} />}
            style={{ width: "24px", height: "24px", padding: 0 }}
            title="Step back 15m"
          />

          {/* Step Forward */}
          <CivicButton
            variant="secondary"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex === timeSteps.length - 1}
            icon={<ChevronRight size={13} strokeWidth={2} />}
            style={{ width: "24px", height: "24px", padding: 0 }}
            title="Step forward 15m"
          />

          {/* Step Badge */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginLeft: "4px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--ink-900)",
                background: "rgba(255, 255, 255, 0.70)",
                border: "var(--glass-border)",
                padding: "2px 7px",
                borderRadius: "var(--r-sm)",
              }}
            >
              {currentStep.label}
            </span>
            <span className="text-micro" style={{ color: "var(--ink-600)" }}>
              Step {currentIndex + 1} of {timeSteps.length}
            </span>
          </div>
        </div>

        {/* Step Measured Telemetry */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px" }}>
          <div>
            <span style={{ color: "var(--ink-600)" }}>Rain Rate: </span>
            <b style={{ fontFamily: "var(--font-mono)", color: "var(--color-rain-text)" }}>
              {currentStep.rainfall_rate_mmh} mm/h
            </b>
          </div>
          <div>
            <span style={{ color: "var(--ink-600)" }}>Peak Ponding: </span>
            <b
              style={{
                fontFamily: "var(--font-mono)",
                color: currentStep.max_flood_depth_cm > 30 ? "var(--color-critical-text)" : "var(--color-warning-text)",
              }}
            >
              {currentStep.max_flood_depth_cm} cm
            </b>
          </div>
          <div>
            <span style={{ color: "var(--ink-600)" }}>Inundated: </span>
            <b style={{ fontFamily: "var(--font-mono)", color: "var(--ink-900)" }}>
              {currentStep.active_inundation_area_sqkm} km²
            </b>
          </div>
          <div>
            <span style={{ color: "var(--ink-600)" }}>Restricted Roads: </span>
            <b style={{ fontFamily: "var(--font-mono)", color: "var(--color-critical-text)" }}>
              {currentStep.high_risk_roads_count}
            </b>
          </div>
        </div>
      </div>

      {/* Discrete Timeline Scrubber Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {timeSteps.map((step, idx) => {
          const isSelected = idx === currentIndex;
          const isPast = idx < currentIndex;
          return (
            <div
              key={step.label}
              onClick={() => onSelectIndex(idx)}
              style={{
                flex: 1,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: isSelected ? "6px" : "3px",
                  borderRadius: "2px",
                  background: isSelected
                    ? "var(--color-rain-base)"
                    : isPast
                    ? "rgba(47, 111, 181, 0.40)"
                    : "rgba(15, 23, 42, 0.10)",
                  transition: "all var(--motion-duration-fast) var(--motion-ease)",
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "var(--color-rain-text)" : "var(--ink-600)",
                }}
              >
                {step.label.replace("MIN", "m")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
