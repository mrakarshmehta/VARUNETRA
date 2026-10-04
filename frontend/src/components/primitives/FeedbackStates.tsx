import React from "react";
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Inbox,
  RefreshCw,
  X,
  ExternalLink,
} from "lucide-react";
import { CivicButton } from "./CivicButton";
import { StatusPill } from "./StatusPill";

/**
 * 1. OPERATOR EMPTY STATE
 * Provides reassuring, clear feedback when a list or queue is empty.
 */
export interface OperatorEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  variant?: "normal" | "accent";
  className?: string;
  style?: React.CSSProperties;
}

export const OperatorEmptyState: React.FC<OperatorEmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  variant = "normal",
  className = "",
  style = {},
}) => {
  return (
    <div
      className={`civic-glass-soft ${className}`}
      style={{
        padding: "24px 20px",
        borderRadius: "var(--r-md)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        border: "1px dashed rgba(0, 0, 0, 0.12)",
        backgroundColor: variant === "accent" ? "rgba(2, 132, 199, 0.03)" : "rgba(255, 255, 255, 0.45)",
        ...style,
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          backgroundColor: "rgba(0, 0, 0, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-600)",
        }}
      >
        {icon || <Inbox size={18} strokeWidth={1.75} />}
      </div>
      <div>
        <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-900)", marginBottom: "4px" }}>
          {title}
        </h4>
        <p style={{ fontSize: "12px", color: "var(--ink-600)", margin: 0, maxWidth: "340px", lineHeight: 1.4 }}>
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <CivicButton variant="secondary" size="sm" onClick={onAction} style={{ marginTop: "4px" }}>
          {actionText}
        </CivicButton>
      )}
    </div>
  );
};

/**
 * 2. OPERATOR LOADING STATE
 * Contextual, informative loading indicator replacing generic spinners.
 */
export interface OperatorLoadingStateProps {
  message?: string;
  subMessage?: string;
  size?: "sm" | "md" | "lg";
}

export const OperatorLoadingState: React.FC<OperatorLoadingStateProps> = ({
  message = "Loading operational telemetry…",
  subMessage,
  size = "md",
}) => {
  return (
    <div
      style={{
        padding: size === "sm" ? "16px" : "32px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          border: "2px solid rgba(2, 132, 199, 0.2)",
          borderTopColor: "var(--color-rain-text)",
          animation: "spinSlow 1.2s linear infinite",
        }}
      />
      <div>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-800)" }}>
          {message}
        </div>
        {subMessage && (
          <div style={{ fontSize: "11px", color: "var(--ink-600)", marginTop: "2px" }}>
            {subMessage}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 3. OPERATOR ERROR STATE
 * 3-Part structured error: WHAT FAILED, WHY IT MATTERS, WHAT THE OPERATOR CAN DO.
 */
export interface OperatorErrorStateProps {
  whatFailed: string;
  whyItMatters: string;
  whatOperatorCanDo: string;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  onRetry?: () => void;
  onViewDetails?: () => void;
  detailsText?: string;
}

export const OperatorErrorState: React.FC<OperatorErrorStateProps> = ({
  whatFailed,
  whyItMatters,
  whatOperatorCanDo,
  severity = "ERROR",
  onRetry,
  onViewDetails,
  detailsText,
}) => {
  const getBorderColor = () => {
    switch (severity) {
      case "CRITICAL":
        return "rgba(220, 38, 38, 0.5)";
      case "ERROR":
        return "rgba(220, 38, 38, 0.35)";
      case "WARNING":
        return "rgba(234, 88, 12, 0.35)";
      default:
        return "rgba(2, 132, 199, 0.35)";
    }
  };

  const getHeaderColor = () => {
    switch (severity) {
      case "CRITICAL":
      case "ERROR":
        return "var(--color-critical-text)";
      case "WARNING":
        return "var(--color-warning-text)";
      default:
        return "var(--color-rain-text)";
    }
  };

  return (
    <div
      className="civic-glass"
      style={{
        padding: "16px",
        borderRadius: "var(--r-md)",
        border: `1px solid ${getBorderColor()}`,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {severity === "CRITICAL" ? (
            <AlertOctagon size={16} color="var(--color-critical-text)" />
          ) : severity === "WARNING" ? (
            <AlertTriangle size={16} color="var(--color-warning-text)" />
          ) : (
            <AlertTriangle size={16} color="var(--color-critical-text)" />
          )}
          <span style={{ fontSize: "13px", fontWeight: 700, color: getHeaderColor(), textTransform: "uppercase" }}>
            {whatFailed}
          </span>
        </div>
        <StatusPill type={severity} size="sm" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "var(--ink-800)" }}>
        <div>
          <b style={{ color: "var(--ink-900)" }}>Impact: </b>
          <span>{whyItMatters}</span>
        </div>
        <div>
          <b style={{ color: "var(--ink-900)" }}>Action: </b>
          <span>{whatOperatorCanDo}</span>
        </div>
      </div>

      {(onRetry || onViewDetails) && (
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          {onRetry && (
            <CivicButton variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw size={12} />}>
              Retry Operation
            </CivicButton>
          )}
          {onViewDetails && (
            <CivicButton variant="ghost" size="sm" onClick={onViewDetails} icon={<ExternalLink size={12} />}>
              {detailsText || "View Details"}
            </CivicButton>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 4. ACTION FEEDBACK TOAST
 * Confirms operator actions (SOS created, pump dispatched, scenario reset).
 */
export interface FeedbackToastMessage {
  id: string;
  title: string;
  details: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  timestamp: string;
}

export interface ActionFeedbackToastProps {
  toasts: FeedbackToastMessage[];
  onDismiss: (id: string) => void;
}

export const ActionFeedbackToast: React.FC<ActionFeedbackToastProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "64px",
        right: "24px",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth: "360px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="civic-glass"
          style={{
            pointerEvents: "auto",
            padding: "10px 14px",
            borderRadius: "var(--r-md)",
            border:
              t.severity === "CRITICAL" || t.severity === "ERROR"
                ? "1px solid rgba(220, 38, 38, 0.4)"
                : t.severity === "WARNING"
                ? "1px solid rgba(234, 88, 12, 0.4)"
                : "1px solid rgba(16, 185, 129, 0.4)",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            gap: "3px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {t.severity === "INFO" ? (
                <CheckCircle2 size={14} color="#059669" />
              ) : (
                <AlertTriangle size={14} color={t.severity === "CRITICAL" ? "#dc2626" : "#ea580c"} />
              )}
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-900)" }}>
                {t.title}
              </span>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                color: "var(--ink-500)",
              }}
              title="Dismiss notification"
            >
              <X size={13} />
            </button>
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-700)", lineHeight: 1.35 }}>
            {t.details}
          </div>
          <div style={{ fontSize: "10px", color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>
            {t.timestamp}
          </div>
        </div>
      ))}
    </div>
  );
};
