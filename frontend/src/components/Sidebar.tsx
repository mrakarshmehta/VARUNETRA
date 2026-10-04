import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Clock,
  CloudRain,
  GitFork,
  Map as MapIcon,
  Navigation,
  LifeBuoy,
  Building2,
  Droplets,
  PackageCheck,
  FileSpreadsheet,
  BrainCircuit,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  Mountain,
  Globe,
  Settings,
  FileText,
  Activity,
} from "lucide-react";
import { UserRole } from "../types";
import { CivicTooltip } from "./primitives";

export type ModuleKey =
  | "overview"
  | "map"
  | "terrain"
  | "nowcast"
  | "rainfall"
  | "drainage"
  | "routing"
  | "reports"
  | "sos"
  | "shelters"
  | "pumps"
  | "relief"
  | "damage"
  | "ml"
  | "citizen_portal"
  | "settings"
  | "inundation"
  | "incidents"
  | "rescue"
  | "alerts"
  | "replay";

interface SidebarProps {
  activeModule: ModuleKey;
  onSelectModule: (module: ModuleKey) => void;
  currentRole: UserRole;
  activeSOSCount: number;
  viewMode?: "2D" | "3D";
  onSelect3DCity?: () => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  currentRole,
  activeSOSCount,
  viewMode = "2D",
  onSelect3DCity,
  onOpenSettings,
}) => {
  const isCitizen = currentRole === "CITIZEN";
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return typeof window !== "undefined" ? window.innerWidth < 1280 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && !isCollapsed) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1280 && isCollapsed) {
        setIsCollapsed(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCollapsed]);

  // Primary Intelligence Navigation Hierarchy
  const primaryNavItems = [
    { key: "overview" as ModuleKey, label: "Dashboard", icon: LayoutDashboard },
    { key: "map" as ModuleKey, label: "Live Map", icon: MapIcon },
    { key: "terrain" as ModuleKey, label: "Terrain Intelligence", icon: Mountain },
    { key: "nowcast" as ModuleKey, label: "Nowcast & Forecast", icon: Clock },
    { key: "rainfall" as ModuleKey, label: "Flood Analysis", icon: CloudRain },
    { key: "drainage" as ModuleKey, label: "Drainage Network", icon: GitFork },
    { key: "routing" as ModuleKey, label: "Routing & Response", icon: Navigation },
    { key: "reports" as ModuleKey, label: "Reports & Analytics", icon: FileText },
  ];

  // Emergency Operations & Tactical Support
  const operationsNavItems = [
    {
      key: "sos" as ModuleKey,
      label: "SOS / Rescue",
      icon: LifeBuoy,
      badge: activeSOSCount > 0 ? activeSOSCount : undefined,
    },
    { key: "shelters" as ModuleKey, label: "Shelters & Facilities", icon: Building2 },
    { key: "pumps" as ModuleKey, label: "Dewatering Pumps", icon: Droplets },
    { key: "relief" as ModuleKey, label: "Relief & Recovery", icon: PackageCheck },
    { key: "damage" as ModuleKey, label: "Damage Survey", icon: FileSpreadsheet },
    { key: "ml" as ModuleKey, label: "ML Diagnostics", icon: BrainCircuit },
  ];

  return (
    <aside
      className="civic-glass"
      style={{
        width: isCollapsed ? "52px" : "180px",
        margin: "8px 0 8px 12px",
        borderRadius: "var(--r-lg)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flexShrink: 0,
        userSelect: "none",
        zIndex: 50,
        transition: "width var(--motion-duration-panel) var(--motion-ease)",
        overflow: "hidden",
      }}
    >
      {/* Top Nav Rail Items */}
      <div
        style={{
          padding: "var(--space-2) 6px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          overflowY: "auto",
        }}
      >
        {/* Collapse toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            padding: "4px 6px",
            marginBottom: "4px",
          }}
        >
          {!isCollapsed && (
            <span className="eyebrow" style={{ fontSize: "10px", color: "var(--ink-600)" }}>
              Navigation
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="civic-btn civic-btn-ghost civic-btn-sm"
            style={{ width: "24px", height: "24px", padding: 0 }}
            title={isCollapsed ? "Expand navigation rail" : "Collapse navigation rail"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Citizen Quick Jump if active */}
        {isCitizen && (
          <button
            data-module="citizen"
            onClick={() => onSelectModule("citizen_portal")}
            className="civic-btn civic-btn-primary civic-btn-sm"
            style={{
              padding: isCollapsed ? "6px 0" : "6px 8px",
              justifyContent: isCollapsed ? "center" : "flex-start",
              marginBottom: "6px",
            }}
          >
            <PhoneCall size={14} strokeWidth={1.75} />
            {!isCollapsed && <span>Citizen Portal</span>}
          </button>
        )}

        {/* Primary Intelligence Items */}
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeModule === item.key ||
            (item.key === "overview" && activeModule === "overview") ||
            (item.key === "map" && activeModule === "map" && viewMode === "2D");

          const buttonContent = (
            <button
              key={item.key}
              data-module={item.key}
              onClick={() => onSelectModule(item.key)}
              className={`civic-btn civic-btn-ghost civic-btn-sm ${isActive ? "civic-btn-active" : ""}`}
              style={{
                width: "100%",
                padding: isCollapsed ? "8px 0" : "7px 10px",
                justifyContent: isCollapsed ? "center" : "flex-start",
                height: "34px",
                borderRadius: "var(--r-sm)",
                background: isActive ? "rgba(255, 255, 255, 0.85)" : "transparent",
                color: isActive ? "var(--ink-900)" : "var(--ink-700)",
                borderLeft: isActive ? "2px solid var(--color-rain-base)" : "2px solid transparent",
                boxShadow: isActive ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: 0,
                }}
              >
                <Icon
                  size={15}
                  strokeWidth={isActive ? 2 : 1.75}
                  color={isActive ? "var(--color-rain-base)" : "var(--ink-600)"}
                />
                {!isCollapsed && (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: isActive ? 700 : 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </button>
          );

          if (isCollapsed) {
            return (
              <CivicTooltip key={item.key} content={item.label} position="right">
                {buttonContent}
              </CivicTooltip>
            );
          }

          return buttonContent;
        })}

        {/* 3D City Digital Twin Direct Launcher */}
        {(() => {
          const is3DActive = (activeModule === "map" || activeModule === "overview") && viewMode === "3D";
          const button3D = (
            <button
              onClick={() => {
                if (onSelect3DCity) {
                  onSelect3DCity();
                } else {
                  onSelectModule("map");
                }
              }}
              className={`civic-btn civic-btn-ghost civic-btn-sm ${is3DActive ? "civic-btn-active" : ""}`}
              style={{
                width: "100%",
                padding: isCollapsed ? "8px 0" : "7px 10px",
                justifyContent: isCollapsed ? "center" : "flex-start",
                height: "34px",
                borderRadius: "var(--r-sm)",
                background: is3DActive ? "rgba(255, 255, 255, 0.85)" : "transparent",
                color: is3DActive ? "var(--ink-900)" : "var(--ink-700)",
                borderLeft: is3DActive ? "2px solid #0284c7" : "2px solid transparent",
                boxShadow: is3DActive ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                <Globe
                  size={15}
                  strokeWidth={is3DActive ? 2 : 1.75}
                  color={is3DActive ? "#0284c7" : "var(--ink-600)"}
                />
                {!isCollapsed && (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: is3DActive ? 700 : 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    3D City
                  </span>
                )}
              </div>
            </button>
          );

          if (isCollapsed) {
            return (
              <CivicTooltip key="3d_city" content="3D City Digital Twin" position="right">
                {button3D}
              </CivicTooltip>
            );
          }
          return button3D;
        })()}

        {/* Divider before Emergency Operations */}
        <div style={{ margin: "6px 4px", borderTop: "var(--glass-hairline)" }} />
        {!isCollapsed && (
          <div style={{ padding: "2px 8px 4px 8px" }}>
            <span className="eyebrow" style={{ fontSize: "10px", color: "var(--ink-600)" }}>
              Response Center
            </span>
          </div>
        )}

        {/* Operations Nav Items */}
        {operationsNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.key;

          const buttonContent = (
            <button
              key={item.key}
              data-module={item.key}
              onClick={() => onSelectModule(item.key)}
              className={`civic-btn civic-btn-ghost civic-btn-sm ${isActive ? "civic-btn-active" : ""}`}
              style={{
                width: "100%",
                padding: isCollapsed ? "8px 0" : "7px 10px",
                justifyContent: isCollapsed ? "center" : "space-between",
                height: "32px",
                borderRadius: "var(--r-sm)",
                background: isActive ? "rgba(255, 255, 255, 0.85)" : "transparent",
                color: isActive ? "var(--ink-900)" : "var(--ink-700)",
                borderLeft: isActive ? "2px solid var(--color-rain-base)" : "2px solid transparent",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: 0,
                }}
              >
                <Icon
                  size={14}
                  strokeWidth={isActive ? 2 : 1.75}
                  color={isActive ? "var(--color-rain-base)" : "var(--ink-600)"}
                />
                {!isCollapsed && (
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: isActive ? 600 : 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </div>

              {!isCollapsed && item.badge !== undefined && (
                <span
                  style={{
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    background: "var(--color-critical-fill)",
                    color: "var(--color-critical-text)",
                    border: "1px solid var(--color-critical-border)",
                    padding: "1px 5px",
                    borderRadius: "var(--r-sm)",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );

          if (isCollapsed) {
            return (
              <CivicTooltip key={item.key} content={item.label} position="right">
                {buttonContent}
              </CivicTooltip>
            );
          }

          return buttonContent;
        })}
      </div>

      {/* Rail Footer with Settings & Provenance trigger */}
      <div
        className="glass-hairline-top"
        style={{
          padding: isCollapsed ? "8px 4px" : "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          textAlign: isCollapsed ? "center" : "left",
        }}
      >
        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="civic-btn civic-btn-ghost civic-btn-sm"
          style={{
            width: "100%",
            padding: isCollapsed ? "6px 0" : "4px 8px",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "6px",
            fontSize: "11px",
            color: "var(--ink-700)",
            height: "28px",
          }}
          title="System Settings & Data Provenance"
        >
          <Settings size={13} />
          {!isCollapsed && <span>Settings & Provenance</span>}
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between" }}>
          {!isCollapsed && (
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--ink-700)" }}>
              MoES SIH26085
            </span>
          )}
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--ink-600)",
              background: "rgba(15, 23, 42, 0.05)",
              padding: "1px 4px",
              borderRadius: "var(--r-sm)",
            }}
          >
            v1.2
          </span>
        </div>
      </div>
    </aside>
  );
};
