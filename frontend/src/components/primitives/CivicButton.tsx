import React, { forwardRef } from "react";

export type CivicButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success"
  | "icon"
  | "pill";

export interface CivicButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: CivicButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  active?: boolean;
}

export const CivicButton = forwardRef<HTMLButtonElement, CivicButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      icon,
      children,
      className = "",
      active = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = [
      "civic-btn",
      `civic-btn-${variant}`,
      `civic-btn-${size}`,
      active ? "civic-btn-active" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} className={classes} disabled={disabled} {...props}>
        {icon && <span className="civic-btn-icon">{icon}</span>}
        {children && <span className="civic-btn-label">{children}</span>}
      </button>
    );
  }
);

CivicButton.displayName = "CivicButton";
