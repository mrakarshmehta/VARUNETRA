import React from "react";
import {
  ShieldCheck,
  Cpu,
  Sparkles,
  FlaskConical,
  Database,
  CheckCircle2,
  AlertTriangle,
  Flame,
  AlertOctagon,
  Ban,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  HelpCircle,
} from "lucide-react";

export type ProvenanceType =
  | "REAL"
  | "SIMULATED"
  | "SYNTHETIC"
  | "DEMO"
  | "CACHED"
  | "SIMULATION";

export type SeverityType =
  | "NORMAL"
  | "WARNING"
  | "HIGH"
  | "CRITICAL"
  | "BLOCKED"
  | "ACTIVE";

export type SystemStateType =
  | "OPERATIONAL"
  | "READY"
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "CONNECTING"
  | "RECONNECTING"
  | "OFFLINE";

export type AllStatusTypes = ProvenanceType | SeverityType | SystemStateType;

export interface StatusPillProps {
  type: AllStatusTypes | string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
  showIcon?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  type,
  label,
  size = "md",
  className = "",
  showIcon = true,
}) => {
  const normType = (type || "NORMAL").toUpperCase();

  const getIcon = () => {
    switch (normType) {
      case "REAL":
        return <ShieldCheck size={13} strokeWidth={1.75} />;
      case "SIMULATED":
      case "SIMULATION":
        return <Cpu size={13} strokeWidth={1.75} />;
      case "SYNTHETIC":
        return <Sparkles size={13} strokeWidth={1.75} />;
      case "DEMO":
        return <FlaskConical size={13} strokeWidth={1.75} />;
      case "CACHED":
        return <Database size={13} strokeWidth={1.75} />;
      case "NORMAL":
      case "OPERATIONAL":
      case "READY":
      case "HEALTHY":
        return <CheckCircle2 size={13} strokeWidth={1.75} />;
      case "WARNING":
      case "DEGRADED":
        return <AlertTriangle size={13} strokeWidth={1.75} />;
      case "HIGH":
        return <Flame size={13} strokeWidth={1.75} />;
      case "CRITICAL":
        return <AlertOctagon size={13} strokeWidth={1.75} />;
      case "BLOCKED":
      case "UNAVAILABLE":
        return <Ban size={13} strokeWidth={1.75} />;
      case "ACTIVE":
        return <Activity size={13} strokeWidth={1.75} />;
      case "CONNECTING":
      case "RECONNECTING":
        return <RefreshCw size={12} strokeWidth={2} className="spin-slow" />;
      case "OFFLINE":
        return <WifiOff size={12} strokeWidth={1.75} />;
      default:
        return <HelpCircle size={13} strokeWidth={1.75} />;
    }
  };

  const getStyleClass = () => {
    switch (normType) {
      case "REAL":
        return "civic-pill-real";
      case "SIMULATED":
      case "SIMULATION":
      case "SYNTHETIC":
        return "civic-pill-simulated";
      case "DEMO":
        return "civic-pill-demo";
      case "CACHED":
        return "civic-pill-cached";
      case "OPERATIONAL":
      case "READY":
      case "HEALTHY":
      case "NORMAL":
        return "civic-pill-normal";
      case "WARNING":
      case "DEGRADED":
        return "civic-pill-warning";
      case "HIGH":
        return "civic-pill-high";
      case "CRITICAL":
        return "civic-pill-critical";
      case "BLOCKED":
      case "UNAVAILABLE":
        return "civic-pill-blocked";
      case "ACTIVE":
        return "civic-pill-active";
      case "CONNECTING":
      case "RECONNECTING":
        return "civic-pill-connecting";
      case "OFFLINE":
        return "civic-pill-offline";
      default:
        return "civic-pill-cached";
    }
  };

  const displayLabel = label || normType;

  return (
    <span
      className={`civic-pill ${getStyleClass()} civic-pill-${size} ${className}`}
    >
      {showIcon && <span className="civic-pill-icon">{getIcon()}</span>}
      <span className="civic-pill-text">{displayLabel}</span>
    </span>
  );
};
