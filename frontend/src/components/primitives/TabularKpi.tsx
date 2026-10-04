import React from "react";

export interface TabularKpiProps {
  label: string;
  value: string | number;
  unit?: string;
  context?: string;
  trend?: "up" | "down" | "steady" | null;
  tone?: "normal" | "rain" | "warning" | "high" | "critical" | "neutral";
  className?: string;
}

export const TabularKpi: React.FC<TabularKpiProps> = ({
  label,
  value,
  unit,
  context,
  trend,
  tone = "neutral",
  className = "",
}) => {
  return (
    <div className={`tabular-kpi tabular-kpi-${tone} ${className}`}>
      <div className="tabular-kpi-header">
        <span className="tabular-kpi-label">{label}</span>
        {trend && (
          <span className={`tabular-kpi-trend trend-${trend}`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        )}
      </div>
      <div className="tabular-kpi-value-row">
        <span className="tabular-kpi-val">{value}</span>
        {unit && <span className="tabular-kpi-unit">{unit}</span>}
      </div>
      {context && <div className="tabular-kpi-context">{context}</div>}
    </div>
  );
};
