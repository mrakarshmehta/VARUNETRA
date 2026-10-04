import React from "react";

interface VarunetraLogoProps {
  size?: number;
  className?: string;
  variant?: "primary" | "light" | "glass" | "mono";
  showWordmark?: boolean;
  wordmarkSubtitle?: string;
}

/**
 * VARUNETRA Brand Mark
 * 
 * Concept:
 * - Concentric topographic elevation contours (Terrain Intelligence)
 * - Dynamic hydraulic drainage stream vectors (Stormwater Coupling)
 * - Precise urban spatial crosshair & coordinate aperture (Street-Level Accuracy)
 * - Directed foresight / sensor eye geometry (0–180m Nowcast Intelligence)
 */
export const VarunetraLogo: React.FC<VarunetraLogoProps> = ({
  size = 32,
  className = "",
  variant = "primary",
  showWordmark = false,
  wordmarkSubtitle = "Urban Flood Intelligence & Response",
}) => {
  const isLight = variant === "light";
  const isGlass = variant === "glass";

  // Gradient IDs unique per render instance
  const gradContour = "vn-contour-grad";
  const gradFlow = "vn-flow-grad";
  const gradCore = "vn-core-grad";

  return (
    <div
      className={`varunetra-brand-container ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: showWordmark ? "10px" : "0",
        userSelect: "none",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-label="VARUNETRA Emblem"
      >
        <defs>
          {/* Topographic Contour Gradient */}
          <linearGradient id={gradContour} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Coupled Hydraulic Flow Gradient */}
          <linearGradient id={gradFlow} x1="8" y1="24" x2="40" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Center Aperture / Foresight Iris */}
          <radialGradient id={gradCore} cx="24" cy="24" r="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        {/* Outer Topographic Shield / Isohypse Ring */}
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          fill={isLight ? "rgba(255, 255, 255, 0.9)" : (isGlass ? "rgba(15, 23, 42, 0.65)" : "#0f172a")}
          stroke={isLight ? "rgba(15, 23, 42, 0.12)" : "rgba(56, 189, 248, 0.35)"}
          strokeWidth="1.25"
        />

        {/* Subtle Spatial Coordinate Grid Overlay */}
        <path
          d="M24 6V12 M24 36V42 M6 24H12 M36 24H42"
          stroke={isLight ? "rgba(15, 23, 42, 0.25)" : "rgba(56, 189, 248, 0.4)"}
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Outer Contour Loop (Relief Elevation) */}
        <path
          d="M12 24C12 17.3726 17.3726 12 24 12C30.6274 12 36 17.3726 36 24C36 30.6274 30.6274 36 24 36C17.3726 36 12 30.6274 12 24Z"
          stroke={`url(#${gradContour})`}
          strokeWidth="1.75"
          strokeDasharray="2 3"
        />

        {/* Dynamic Stormwater Flow Arc (Hydraulic Wave & Outfall) */}
        <path
          d="M10 28C14 22 18 30 24 24C30 18 34 26 38 20"
          stroke={`url(#${gradFlow})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Secondary Drainage Inflow Stream */}
        <path
          d="M13 32C17 28 20 33 25 30C29 27 32 31 36 28"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeOpacity="0.8"
          strokeLinecap="round"
        />

        {/* Foresight Iris (0–180m Nowcast Focal Point) */}
        <circle
          cx="24"
          cy="24"
          r="4.5"
          fill={`url(#${gradCore})`}
          stroke="#ffffff"
          strokeWidth="1.2"
        />

        {/* Focal Coordinate Target Core */}
        <circle cx="24" cy="24" r="1.5" fill="#ffffff" />
      </svg>

      {showWordmark && (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: size >= 36 ? "18px" : "15px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: isLight ? "#ffffff" : "var(--ink-900)",
                lineHeight: 1.1,
              }}
            >
              VARUNETRA
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: "var(--font-mono)",
                color: "var(--color-rain-base)",
                background: "var(--color-rain-fill)",
                padding: "1px 5px",
                borderRadius: "4px",
                border: "1px solid var(--color-rain-border)",
              }}
            >
              SIH26085
            </span>
          </div>
          {wordmarkSubtitle && (
            <span
              className="text-micro"
              style={{
                color: isLight ? "rgba(255, 255, 255, 0.75)" : "var(--ink-600)",
                whiteSpace: "nowrap",
                marginTop: "1px",
              }}
            >
              {wordmarkSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
