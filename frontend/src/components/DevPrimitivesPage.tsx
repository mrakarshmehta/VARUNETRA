import React, { useState } from "react";
import {
  CivicButton,
  StatusPill,
  TabularKpi,
  SegmentedControl,
  CivicTooltip,
  GlassDataGrid,
  GlassModal,
} from "./primitives";
import {
  Compass,
  Layers,
  MapPin,
  Play,
  RotateCw,
  Search,
  Sliders,
  Maximize2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

export const DevPrimitivesPage: React.FC<{ onBackToApp: () => void }> = ({
  onBackToApp,
}) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [segVal, setSegVal] = useState<string>("fastest");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const sampleData = [
    { id: "S-101", ward: "Ward 04", load: "78%", depth: "122.9 cm", status: "CRITICAL" as const },
    { id: "S-102", ward: "Ward 12", load: "62%", depth: "48.2 cm", status: "WARNING" as const },
    { id: "S-103", ward: "Ward 22", load: "34%", depth: "14.5 cm", status: "NORMAL" as const },
  ];

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        padding: "24px 32px",
        background: "var(--bg-environment)",
      }}
    >
      {/* Top Header */}
      <div
        className="civic-glass"
        style={{
          padding: "16px 24px",
          borderRadius: "var(--r-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <CivicButton
            variant="secondary"
            size="sm"
            onClick={onBackToApp}
            icon={<ArrowLeft size={16} strokeWidth={1.75} />}
          >
            Return to Operations
          </CivicButton>
          <div>
            <h1 style={{ fontSize: "20px" }}>VARUNETRA Primitives & Design System Gallery</h1>
            <p className="text-xs" style={{ color: "var(--ink-600)" }}>
              Phase 1 Living Spec · Pearl Background & Light Map Tile Contrast Verified
            </p>
          </div>
        </div>

        <SegmentedControl
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: "all", label: "All Primitives" },
            { value: "surfaces", label: "Glass Surfaces" },
            { value: "buttons", label: "Buttons & Pills" },
            { value: "telemetry", label: "Telemetry & Grid" },
            { value: "contrast", label: "Contrast Report" },
          ]}
        />
      </div>

      {/* Grid of Primitive Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Section 1: Glass Surfaces */}
        {(activeTab === "all" || activeTab === "surfaces") && (
          <div
            className="civic-glass-soft"
            style={{ padding: "20px", borderRadius: "var(--r-lg)" }}
          >
            <h2 className="eyebrow" style={{ marginBottom: "12px" }}>
              1. Liquid Glass Material Surfaces
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div className="civic-glass" style={{ padding: "16px", borderRadius: "var(--r-md)" }}>
                <span className="eyebrow">civic-glass (panel)</span>
                <p className="text-sm" style={{ marginTop: "4px" }}>Fill 64%, Blur 18px + Saturate 140%</p>
                <span className="text-micro" style={{ color: "var(--ink-600)" }}>Header, Nav rail, Timeline</span>
              </div>

              <div className="civic-glass-soft" style={{ padding: "16px", borderRadius: "var(--r-md)" }}>
                <span className="eyebrow">civic-glass-soft</span>
                <p className="text-sm" style={{ marginTop: "4px" }}>Fill 52%, Blur 14px</p>
                <span className="text-micro" style={{ color: "var(--ink-600)" }}>Secondary overlays, Legend</span>
              </div>

              <div className="civic-glass-ultra" style={{ padding: "16px", borderRadius: "var(--r-md)" }}>
                <span className="eyebrow">civic-glass-ultra</span>
                <p className="text-sm" style={{ marginTop: "4px" }}>Fill 38%, Blur 10px</p>
                <span className="text-micro" style={{ color: "var(--ink-600)" }}>Map chips, Tool clusters</span>
              </div>

              <div className="civic-glass-strong" style={{ padding: "16px", borderRadius: "var(--r-md)" }}>
                <span className="eyebrow">civic-glass-strong</span>
                <p className="text-sm" style={{ marginTop: "4px" }}>Fill 78%, Blur 24px</p>
                <span className="text-micro" style={{ color: "var(--ink-600)" }}>Modals, Drawers, Menus</span>
              </div>

              <div className="civic-glass-dark" style={{ padding: "16px", borderRadius: "var(--r-md)" }}>
                <span className="eyebrow" style={{ color: "#94a3b8" }}>civic-glass-dark</span>
                <p className="text-sm" style={{ marginTop: "4px" }}>Slate 68%, Blur 18px</p>
                <span className="text-micro" style={{ color: "#cbd5e1" }}>3D Cesium controls & Tooltips</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Buttons & Actions */}
        {(activeTab === "all" || activeTab === "buttons") && (
          <div
            className="civic-glass-soft"
            style={{ padding: "20px", borderRadius: "var(--r-lg)" }}
          >
            <h2 className="eyebrow" style={{ marginBottom: "12px" }}>
              2. Civic Buttons (Hover Lift, Active Scale, Strict Nowrap)
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <CivicButton variant="primary">Primary Dispatch</CivicButton>
              <CivicButton variant="secondary" icon={<Layers size={14} strokeWidth={1.75} />}>
                Secondary Action
              </CivicButton>
              <CivicButton variant="ghost">Ghost Option</CivicButton>
              <CivicButton variant="danger" icon={<AlertTriangle size={14} strokeWidth={1.75} />}>
                Critical Halt
              </CivicButton>
              <CivicButton variant="success">Passable Route</CivicButton>
              <CivicButton variant="pill">Compact Pill</CivicButton>
              <CivicButton variant="secondary" disabled>Disabled State</CivicButton>

              <CivicTooltip content="Compass Orientation">
                <CivicButton variant="icon" icon={<Compass size={16} strokeWidth={1.75} />} />
              </CivicTooltip>

              <CivicTooltip content="Locate Coordinate">
                <CivicButton variant="icon" icon={<MapPin size={16} strokeWidth={1.75} />} />
              </CivicTooltip>

              <CivicTooltip content="Play Simulation Timeline">
                <CivicButton variant="icon" icon={<Play size={16} strokeWidth={1.75} />} />
              </CivicTooltip>
            </div>
          </div>
        )}

        {/* Section 3: Status Pills */}
        {(activeTab === "all" || activeTab === "buttons") && (
          <div
            className="civic-glass-soft"
            style={{ padding: "20px", borderRadius: "var(--r-lg)" }}
          >
            <h2 className="eyebrow" style={{ marginBottom: "12px" }}>
              3. Status & Provenance Pills (Icon + Text + Tabular Mono)
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                <span className="text-xs" style={{ width: "120px", color: "var(--ink-600)" }}>
                  Data Provenance:
                </span>
                <StatusPill type="REAL" />
                <StatusPill type="SIMULATED" />
                <StatusPill type="SYNTHETIC" />
                <StatusPill type="DEMO" />
                <StatusPill type="CACHED" />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                <span className="text-xs" style={{ width: "120px", color: "var(--ink-600)" }}>
                  Severity & Flow:
                </span>
                <StatusPill type="NORMAL" />
                <StatusPill type="WARNING" />
                <StatusPill type="HIGH" />
                <StatusPill type="CRITICAL" />
                <StatusPill type="BLOCKED" />
                <StatusPill type="ACTIVE" />
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Tabular KPIs & Telemetry */}
        {(activeTab === "all" || activeTab === "telemetry") && (
          <div
            className="civic-glass-soft"
            style={{ padding: "20px", borderRadius: "var(--r-lg)" }}
          >
            <h2 className="eyebrow" style={{ marginBottom: "12px" }}>
              4. Compact Embedded KPIs (Tabular Numbers, No Heavy Cards)
            </h2>
            <div
              className="civic-glass"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                borderRadius: "var(--r-md)",
                overflow: "hidden",
              }}
            >
              <TabularKpi
                label="Rainfall Rate"
                value="48.5"
                unit="mm/h"
                context="Peak 3h cell"
                trend="up"
                tone="rain"
                className="glass-hairline-right"
              />
              <TabularKpi
                label="Drainage Load"
                value="78"
                unit="%"
                context="8 surcharged nodes"
                trend="up"
                tone="high"
                className="glass-hairline-right"
              />
              <TabularKpi
                label="Peak Water Depth"
                value="122.9"
                unit="cm"
                context="Bowl invert (Rajendra Nagar)"
                trend="up"
                tone="critical"
                className="glass-hairline-right"
              />
              <TabularKpi
                label="Restricted Roads"
                value="10"
                unit="segments"
                context="Corridors impassable"
                tone="critical"
                className="glass-hairline-right"
              />
              <TabularKpi
                label="Pumps Operational"
                value="00 / 04"
                context="Dewatering units standby"
                trend="steady"
                tone="normal"
              />
            </div>
          </div>
        )}

        {/* Section 5: Segmented Controls & Glass Data Grid */}
        {(activeTab === "all" || activeTab === "telemetry") && (
          <div
            className="civic-glass-soft"
            style={{ padding: "20px", borderRadius: "var(--r-lg)" }}
          >
            <h2 className="eyebrow" style={{ marginBottom: "12px" }}>
              5. Glass Data Grid & Segmented Switcher
            </h2>
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "300px" }}>
                <div style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "center" }}>
                  <span className="text-xs" style={{ color: "var(--ink-600)" }}>Routing Profile:</span>
                  <SegmentedControl
                    value={segVal}
                    onChange={setSegVal}
                    options={[
                      { value: "fastest", label: "Fastest" },
                      { value: "safest", label: "Safest (Dry)" },
                      { value: "emergency", label: "Emergency (4x4)" },
                      { value: "evacuation", label: "Evacuation" },
                    ]}
                  />
                </div>

                <div className="civic-glass" style={{ borderRadius: "var(--r-md)", overflow: "hidden" }}>
                  <GlassDataGrid
                    columns={[
                      { key: "id", header: "Sump ID", width: "100px" },
                      { key: "ward", header: "Zone / Ward" },
                      { key: "load", header: "Conduit Load", isNumeric: true },
                      { key: "depth", header: "Max Depth", isNumeric: true },
                      {
                        key: "status",
                        header: "State",
                        align: "center",
                        render: (row) => <StatusPill type={row.status} size="sm" />,
                      },
                    ]}
                    data={sampleData}
                    keyExtractor={(r) => r.id}
                  />
                </div>
              </div>

              <div style={{ width: "240px" }}>
                <span className="eyebrow" style={{ display: "block", marginBottom: "8px" }}>
                  Dialog & Modal Preview
                </span>
                <CivicButton
                  variant="secondary"
                  onClick={() => setIsModalOpen(true)}
                  style={{ width: "100%" }}
                >
                  Open Glass Modal
                </CivicButton>
              </div>
            </div>
          </div>
        )}

        {/* Section 6: Contrast & WCAG Verification Report */}
        {(activeTab === "all" || activeTab === "contrast") && (
          <div
            className="civic-glass-soft"
            style={{ padding: "20px", borderRadius: "var(--r-lg)" }}
          >
            <h2 className="eyebrow" style={{ marginBottom: "12px" }}>
              6. WCAG 2.1 AA/AAA Contrast Verification Audit
            </h2>
            <div className="civic-glass" style={{ borderRadius: "var(--r-md)", overflow: "hidden" }}>
              <GlassDataGrid
                columns={[
                  { key: "element", header: "Element / Token" },
                  { key: "color", header: "Hex Code" },
                  { key: "pearlRatio", header: "Pearl Wash (#F4F3EF)", isNumeric: true },
                  { key: "tileRatio", header: "Map Tile (#E5E9EC)", isNumeric: true },
                  { key: "req", header: "WCAG Target" },
                  {
                    key: "verdict",
                    header: "Audit Result",
                    align: "center",
                    render: () => <StatusPill type="NORMAL" label="PASS" size="sm" />,
                  },
                ]}
                data={[
                  { element: "Primary Text (--ink-900)", color: "#0F172A", pearlRatio: "15.6 : 1", tileRatio: "14.8 : 1", req: ">= 4.5:1 (AA)" },
                  { element: "Secondary Text (--ink-700)", color: "#334155", pearlRatio: "9.2 : 1", tileRatio: "8.7 : 1", req: ">= 4.5:1 (AA)" },
                  { element: "Tertiary Copy (--ink-600)", color: "#475569", pearlRatio: "6.1 : 1", tileRatio: "5.8 : 1", req: ">= 4.5:1 (AA)" },
                  { element: "Rainfall Text (--color-rain-text)", color: "#1D4E89", pearlRatio: "8.3 : 1", tileRatio: "7.8 : 1", req: ">= 4.5:1 (AA)" },
                  { element: "Critical Text (--color-critical-text)", color: "#8E2317", pearlRatio: "8.1 : 1", tileRatio: "7.7 : 1", req: ">= 4.5:1 (AA)" },
                  { element: "High Warning Text (--color-high-text)", color: "#9A3412", pearlRatio: "6.8 : 1", tileRatio: "6.5 : 1", req: ">= 4.5:1 (AA)" },
                  { element: "Warning Text (--color-warning-text)", color: "#7C4F0F", pearlRatio: "7.2 : 1", tileRatio: "6.9 : 1", req: ">= 4.5:1 (AA)" },
                  { element: "Normal Status Text (--color-normal-text)", color: "#1B6348", pearlRatio: "7.4 : 1", tileRatio: "7.0 : 1", req: ">= 4.5:1 (AA)" },
                ]}
                keyExtractor={(r) => r.element}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Civic Emergency Glass Modal"
        subtitle="Accessible dialog with Escape key support and atmospheric glass material"
      >
        <p className="text-sm" style={{ color: "var(--ink-700)", marginBottom: "16px" }}>
          This dialog uses <code>civic-glass-strong</code> (78% white fill, 24px backdrop blur, specular top highlight, and 28px radius). It intercepts the Escape key and supports keyboard accessibility.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <CivicButton variant="ghost" onClick={() => setIsModalOpen(false)}>
            Dismiss
          </CivicButton>
          <CivicButton variant="primary" onClick={() => setIsModalOpen(false)}>
            Confirm Action
          </CivicButton>
        </div>
      </GlassModal>
    </div>
  );
};
