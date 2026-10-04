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
} from "lucide-react";

export type ProvenanceType = "REAL" | "SIMULATED" | "SYNTHETIC" | "DEMO" | "CACHED";
export type SeverityType = "NORMAL" | "WARNING" | "HIGH" | "CRITICAL" | "BLOCKED" | "ACTIVE";

export interface StatusPillProps {
  type: ProvenanceType | SeverityType;
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
  const getIcon = () => {
    switch (type) {
      case "REAL":
        return <ShieldCheck size={13} strokeWidth={1.75} />;
      case "SIMULATED":
        return <Cpu size={13} strokeWidth={1.75} />;
      case "SYNTHETIC":
        return <Sparkles size={13} strokeWidth={1.75} />;
      case "DEMO":
        return <FlaskConical size={13} strokeWidth={1.75} />;
      case "CACHED":
        return <Database size={13} strokeWidth={1.75} />;
      case "NORMAL":
        return <CheckCircle2 size={13} strokeWidth={1.75} />;
      case "WARNING":
        return <AlertTriangle size={13} strokeWidth={1.75} />;
      case "HIGH":
        return <Flame size={13} strokeWidth={1.75} />;
      case "CRITICAL":
        return <AlertOctagon size={13} strokeWidth={1.75} />;
      case "BLOCKED":
        return <Ban size={13} strokeWidth={1.75} />;
      case "ACTIVE":
        return <Activity size={13} strokeWidth={1.75} />;
      default:
        return null;
    }
  };

  const displayLabel = label || type;
  const typeLower = type.toLowerCase();

  return (
    <span
      className={`civic-pill civic-pill-${typeLower} civic-pill-${size} ${className}`}
    >
      {showIcon && <span className="civic-pill-icon">{getIcon()}</span>}
      <span className="civic-pill-text">{displayLabel}</span>
    </span>
  );
};
