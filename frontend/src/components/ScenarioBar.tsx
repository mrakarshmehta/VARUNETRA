import React from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  AlertTriangle,
  LayoutDashboard,
  Award,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { ScenarioStage } from "../types";
import { CivicButton, StatusPill } from "./primitives";

interface ScenarioBarProps {
  stage: ScenarioStage | null;
  onStart: () => void;
  onStep: () => void;
  onReset: () => void;
  onToggleAuto: () => void;
  onSelectStage?: (stageNum: number) => void;
  onOpenSituationBoard?: () => void;
  onOpenSummary?: () => void;
  isPresentationMode?: boolean;
  onTogglePresentationMode?: () => void;
  isSubmitting?: boolean;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  stage,
  onStart,
  onStep,
  onReset,
  onToggleAuto,
  onOpenSituationBoard,
  onOpenSummary,
  isPresentationMode = false,
  onTogglePresentationMode,
  isSubmitting = false,
}) => {
  if (!stage) return null;

  const isAtBaseline = stage.stage === 1 && !stage.is_auto_running;
  const isCompleted = stage.stage >= 15;

  return (
    <div
      className="civic-glass-soft"
      style={{
        margin: isPresentationMode ? "0 16px 12px 16px" : "0 12px 8px 12px",
        borderRadius: "var(--r-md)",
        padding: isPresentationMode ? "10px var(--space-4)" : "6px var(--space-4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-3)",
        zIndex: 950,
        userSelect: "none",
        flexShrink: 0,
        border: isPresentationMode
          ? "1px solid rgba(2, 132, 199, 0.4)"
          : "1px solid rgba(255, 255, 255, 0.35)",
        boxShadow: isPresentationMode
          ? "0 4px 18px rgba(2, 132, 199, 0.15)"
          : "0 2px 10px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Primary Action & Playback Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        {isAtBaseline ? (
          <CivicButton
            variant="primary"
            size="sm"
            onClick={onStart}
            disabled={isSubmitting}
            icon={<AlertTriangle size={13} strokeWidth={2.2} />}
            style={{
              background: "linear-gradient(135deg, #b91c1c, #991b1b)",
              color: "#ffffff",
              fontWeight: 700,
              letterSpacing: "0.01em",
              boxShadow: "0 2px 8px rgba(185, 28, 28, 0.3)",
              padding: "0 12px",
              opacity: isSubmitting ? 0.6 : 1,
            }}
            title="Start deterministic end-to-end emergency simulation"
          >
            START EMERGENCY SCENARIO
          </CivicButton>
        ) : (
          <CivicButton
            variant={stage.is_auto_running ? "danger" : "primary"}
            size="sm"
            onClick={onToggleAuto}
            disabled={isSubmitting}
            icon={stage.is_auto_running ? <Pause size={12} strokeWidth={2} /> : <Play size={12} strokeWidth={2} />}
            style={{ minWidth: "96px", opacity: isSubmitting ? 0.6 : 1 }}
          >
            {stage.is_auto_running ? "Pause Sim" : "Auto Run"}
          </CivicButton>
        )}

        <CivicButton
          variant="secondary"
          size="sm"
          onClick={onStep}
          icon={<SkipForward size={12} strokeWidth={2} />}
          style={{ opacity: isSubmitting ? 0.6 : 1 }}
          title="Step forward to next phase"
        >
          Step
        </CivicButton>

        <CivicButton
          variant="secondary"
          size="sm"
          onClick={onReset}
          disabled={isSubmitting}
          icon={<RotateCcw size={12} strokeWidth={2} />}
          style={{ opacity: isSubmitting ? 0.6 : 1 }}
          title="Reset simulation to Baseline (SYSTEM NORMAL)"
        >
          Reset
        </CivicButton>
      </div>

      {/* Stage Narrative Banner */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", minWidth: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <StatusPill type="DEMO" label="SIMULATION" size="sm" />

          <span
            data-testid="scenario-stage-badge"
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              background: "rgba(255, 255, 255, 0.70)",
              border: "var(--glass-border)",
              color: "var(--ink-900)",
              padding: "1px 6px",
              borderRadius: "var(--r-sm)",
              fontWeight: 700,
            }}
          >
            Stage {stage.stage}/{stage.total_stages}
          </span>
        </div>

        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: "12px", color: "var(--ink-900)" }}>
            {stage.title}
          </span>
          <span style={{ fontSize: "11px", color: "var(--ink-600)", marginLeft: "8px" }}>
            — {stage.description}
          </span>
        </div>
      </div>

      {/* Right Tools: Situation Board, Outcome, Presentation Mode */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
        }}
      >
        {onOpenSituationBoard && (
          <CivicButton
            variant="secondary"
            size="sm"
            onClick={onOpenSituationBoard}
            icon={<LayoutDashboard size={12} strokeWidth={2} />}
            title="Open unified operational situation board"
          >
            Situation Board
          </CivicButton>
        )}

        {(isCompleted || onOpenSummary) && (
          <CivicButton
            variant={isCompleted ? "primary" : "secondary"}
            size="sm"
            onClick={onOpenSummary}
            icon={<Award size={12} strokeWidth={2} />}
            title="View simulation outcome metrics"
          >
            Outcome
          </CivicButton>
        )}

        {onTogglePresentationMode && (
          <CivicButton
            variant={isPresentationMode ? "primary" : "ghost"}
            size="sm"
            onClick={onTogglePresentationMode}
            icon={isPresentationMode ? <Minimize2 size={12} strokeWidth={2} /> : <Maximize2 size={12} strokeWidth={2} />}
            title={isPresentationMode ? "Exit Presentation Mode" : "Enter Presentation Mode"}
          >
            {isPresentationMode ? "Normal View" : "Presentation"}
          </CivicButton>
        )}
      </div>
    </div>
  );
};
