import React, { useState } from "react";

export interface CivicTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const CivicTooltip: React.FC<CivicTooltipProps> = ({
  content,
  children,
  position = "top",
  className = "",
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={`civic-tooltip-wrapper ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          role="tooltip"
          className={`civic-tooltip civic-tooltip-${position} civic-glass-dark`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
