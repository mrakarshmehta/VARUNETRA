import React, { useEffect } from "react";
import { X } from "lucide-react";
import { CivicButton } from "./CivicButton";

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string | number;
  className?: string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "540px",
  className = "",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="glass-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`glass-modal-card civic-glass-strong ${className}`}
        style={{ width, maxWidth: "calc(100vw - 32px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass-modal-header glass-hairline-bottom">
          <div className="glass-modal-title-wrap">
            <h3 className="glass-modal-title">{title}</h3>
            {subtitle && <p className="glass-modal-subtitle">{subtitle}</p>}
          </div>
          <CivicButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close dialog"
            icon={<X size={16} strokeWidth={1.75} />}
          />
        </div>
        <div className="glass-modal-body">{children}</div>
      </div>
    </div>
  );
};
