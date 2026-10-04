import React, { useState } from "react";
import { AlertTriangle, AlertOctagon, Check, X, ShieldAlert } from "lucide-react";
import { CivicButton } from "./primitives/CivicButton";
import { StatusPill } from "./primitives/StatusPill";

export interface ActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  actionTitle: string;
  resourceName: string;
  expectedEffect: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  variant?: "danger" | "warning" | "primary";
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actionTitle,
  resourceName,
  expectedEffect,
  confirmButtonText = "Confirm Action",
  cancelButtonText = "Cancel",
  variant = "warning",
}) => {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Action confirmation failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getHeaderIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertOctagon size={18} color="#dc2626" />;
      case "warning":
        return <AlertTriangle size={18} color="#ea580c" />;
      default:
        return <ShieldAlert size={18} color="#0284c7" />;
    }
  };

  const getConfirmStyle = () => {
    if (variant === "danger") {
      return {
        background: "linear-gradient(135deg, #dc2626, #b91c1c)",
        color: "#ffffff",
        fontWeight: 700,
      };
    }
    if (variant === "warning") {
      return {
        background: "linear-gradient(135deg, #ea580c, #c2410c)",
        color: "#ffffff",
        fontWeight: 700,
      };
    }
    return {};
  };

  return (
    <div
      className="glass-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        padding: "16px",
      }}
    >
      <div
        className="civic-glass"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "460px",
          borderRadius: "var(--r-lg)",
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.22)",
          border:
            variant === "danger"
              ? "1px solid rgba(220, 38, 38, 0.35)"
              : "1px solid rgba(255, 255, 255, 0.4)",
          overflow: "hidden",
          animation: "scaleIn 0.2s ease-out",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {getHeaderIcon()}
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-900)" }}>
              Confirm Operational Action
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              background: "transparent",
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              padding: "4px",
              color: "var(--ink-500)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            className="civic-glass-soft"
            style={{
              padding: "12px 14px",
              borderRadius: "var(--r-md)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--ink-600)", fontWeight: 600 }}>ACTION:</span>
              <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>{actionTitle}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--ink-600)", fontWeight: 600 }}>RESOURCE:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-rain-text)" }}>
                {resourceName}
              </span>
            </div>
            <div style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)", paddingTop: "6px" }}>
              <div style={{ color: "var(--ink-600)", fontWeight: 600, marginBottom: "2px" }}>
                EXPECTED EFFECT:
              </div>
              <div style={{ color: "var(--ink-800)", lineHeight: 1.4 }}>
                {expectedEffect}
              </div>
            </div>
          </div>

          <p style={{ fontSize: "11px", color: "var(--ink-600)", margin: 0 }}>
            This action will modify live operational state. An entry will be permanently recorded in the immutable audit ledger.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            background: "rgba(255, 255, 255, 0.4)",
          }}
        >
          <CivicButton variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            {cancelButtonText}
          </CivicButton>
          <CivicButton
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={handleConfirm}
            disabled={submitting}
            style={getConfirmStyle()}
          >
            {submitting ? "Processing…" : confirmButtonText}
          </CivicButton>
        </div>
      </div>
    </div>
  );
};
