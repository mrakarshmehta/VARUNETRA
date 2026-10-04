import React from "react";
import {
  X,
  AlertTriangle,
  Waves,
  Navigation,
  CheckCircle2,
  XCircle,
  Truck,
  Car,
  User,
  ShieldAlert,
  Droplets,
  LifeBuoy,
  Building2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { SOSIncident, MunicipalPump, VehicleType } from "../types";

interface ContextDrawerProps {
  selectedRoad: any | null;
  selectedNode: any | null;
  selectedSOS: SOSIncident | null;
  selectedPump: MunicipalPump | null;
  onClose: () => void;
  onRouteAroundHazard?: (road: any) => void;
  onAssignSOS?: (sosId: string) => void;
  onActivatePump?: (pumpId: string) => void;
}

export const ContextDrawer: React.FC<ContextDrawerProps> = ({
  selectedRoad,
  selectedNode,
  selectedSOS,
  selectedPump,
  onClose,
  onRouteAroundHazard,
  onAssignSOS,
  onActivatePump,
}) => {
  const isOpen = Boolean(selectedRoad || selectedNode || selectedSOS || selectedPump);
  if (!isOpen) return null;

  return (
    <div
      className="glass-panel-solid"
      style={{
        position: "absolute",
        top: "16px",
        left: "16px",
        bottom: "16px",
        width: "360px",
        zIndex: 950,
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow-hover)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border-glass)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {selectedRoad && <Navigation size={18} color="var(--brand-primary)" />}
          {selectedNode && <Droplets size={18} color="var(--brand-primary)" />}
          {selectedSOS && <LifeBuoy size={18} color="var(--critical-primary)" />}
          {selectedPump && <Droplets size={18} color="#059669" />}
          <span style={{ fontSize: "0.95rem", fontWeight: 700 }}>
            {selectedRoad && "Street Flood Intelligence"}
            {selectedNode && "Drainage Node Hydraulic"}
            {selectedSOS && "SOS Emergency Incident"}
            {selectedPump && "Municipal Dewatering Unit"}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Body Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* --- ROAD INSPECTION --- */}
        {selectedRoad && (
          <>
            <div>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "4px" }}>{selectedRoad.name}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className={`badge badge-${selectedRoad.status === "OPEN" ? "safe" : (selectedRoad.status === "CAUTION" ? "warn" : "critical")}`}>
                  {selectedRoad.status}
                </span>
                <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  Elev: {selectedRoad.elevation_m}m MSL
                </span>
              </div>
            </div>

            {/* Depth metric card */}
            <div
              style={{
                padding: "14px",
                background: "#f0f9ff",
                borderRadius: "var(--radius-md)",
                border: "1px solid #bae6fd",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "#0369a1", fontWeight: 600, textTransform: "uppercase" }}>
                Predicted Waterlogging Depth
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0284c7", fontFamily: "var(--font-mono)" }}>
                {selectedRoad.depth_cm} <span style={{ fontSize: "1rem" }}>cm</span>
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                Depth Band: <b>{Math.round(selectedRoad.depth_cm * 0.75)} – {Math.round(selectedRoad.depth_cm * 1.35 + 2)} cm</b> (Moderate Uncertainty)
              </div>
            </div>

            {/* Passability by vehicle class */}
            <div>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "8px" }}>
                Passability by Vehicle Class
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#f8fafc", borderRadius: "6px", fontSize: "0.8rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <User size={14} color="var(--text-muted)" />
                    <span>Pedestrians</span>
                  </div>
                  {selectedRoad.depth_cm < 15 ? (
                    <span style={{ color: "var(--safe-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={13} /> Passable
                    </span>
                  ) : (
                    <span style={{ color: "var(--critical-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      <XCircle size={13} /> Blocked
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#f8fafc", borderRadius: "6px", fontSize: "0.8rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Car size={14} color="var(--text-muted)" />
                    <span>Light Vehicle / 2W</span>
                  </div>
                  {selectedRoad.depth_cm < 22 ? (
                    <span style={{ color: "var(--safe-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={13} /> Passable
                    </span>
                  ) : (
                    <span style={{ color: "var(--critical-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      <XCircle size={13} /> Restricted
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#f8fafc", borderRadius: "6px", fontSize: "0.8rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Truck size={14} color="var(--text-muted)" />
                    <span>Heavy Vehicle / Bus</span>
                  </div>
                  {selectedRoad.depth_cm < 45 ? (
                    <span style={{ color: "var(--safe-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={13} /> Passable
                    </span>
                  ) : (
                    <span style={{ color: "var(--critical-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      <XCircle size={13} /> Restricted
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Explainable AI / TreeSHAP Local Contribution Card */}
            <div>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "8px" }}>
                Hydrologic Drivers (Explainable AI)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ padding: "8px 10px", background: "#fef2f2", borderLeft: "3px solid #ef4444", borderRadius: "4px", fontSize: "0.78rem" }}>
                  <div style={{ fontWeight: 600, color: "#991b1b" }}>Short-Burst Rain Rate: +12.4 cm</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Exceeds surface drainage inlet threshold</div>
                </div>
                <div style={{ padding: "8px 10px", background: "#fff7ed", borderLeft: "3px solid #f97316", borderRadius: "4px", fontSize: "0.78rem" }}>
                  <div style={{ fontWeight: 600, color: "#9a3412" }}>Drainage Conduit Surcharge: +8.6 cm</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Subsurface hydraulic grade line exceeds rim</div>
                </div>
                <div style={{ padding: "8px 10px", background: "#f0fdf4", borderLeft: "3px solid #22c55e", borderRadius: "4px", fontSize: "0.78rem" }}>
                  <div style={{ fontWeight: 600, color: "#166534" }}>Elevation Relief: -3.8 cm</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Surrounding slope drives partial shedding</div>
                </div>
              </div>
            </div>

            {onRouteAroundHazard && (
              <button
                onClick={() => onRouteAroundHazard(selectedRoad)}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
              >
                <Navigation size={16} />
                <span>Calculate Safe Route Around This</span>
              </button>
            )}
          </>
        )}

        {/* --- DRAINAGE NODE INSPECTION --- */}
        {selectedNode && (
          <>
            <div>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "4px" }}>{selectedNode.name}</h3>
              <span className={`badge ${selectedNode.is_surcharged ? "badge-critical" : "badge-safe"}`}>
                {selectedNode.is_surcharged ? "SURCHARGED / BACKFLOWING" : "NORMAL HEAD"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "var(--text-muted)" }}>Node Type:</span>
                <b style={{ textTransform: "capitalize" }}>{selectedNode.node_type}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "var(--text-muted)" }}>Ground Rim Elevation:</span>
                <b>{selectedNode.rim_elevation_m} m MSL</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "var(--text-muted)" }}>Chamber Invert Elevation:</span>
                <b>{selectedNode.invert_elevation_m} m MSL</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "var(--text-muted)" }}>Internal Water Elevation:</span>
                <b style={{ color: selectedNode.is_surcharged ? "var(--critical-primary)" : "var(--brand-primary)" }}>
                  {selectedNode.water_elevation_m} m MSL
                </b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "var(--text-muted)" }}>Surface Ponding Depth:</span>
                <b>{selectedNode.ponding_depth_cm || 0} cm</b>
              </div>
            </div>
          </>
        )}

        {/* --- SOS INCIDENT INSPECTION --- */}
        {selectedSOS && (
          <>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: "1.05rem" }}>{selectedSOS.id}</h3>
                <span className="badge badge-critical">{selectedSOS.status}</span>
              </div>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                {selectedSOS.emergency_type}
              </span>
            </div>

            <div style={{ padding: "12px", background: "#fef2f2", borderRadius: "var(--radius-md)", border: "1px solid #fecaca" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#991b1b" }}>People Trapped: {selectedSOS.number_of_people}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", marginTop: "4px" }}>
                {selectedSOS.address_hint}
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Contact: <b>{selectedSOS.contact_phone}</b>
              </div>
              {selectedSOS.notes && (
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "4px", fontStyle: "italic" }}>
                  Notes: "{selectedSOS.notes}"
                </div>
              )}
            </div>

            {selectedSOS.assigned_team_name ? (
              <div style={{ padding: "10px", background: "#f0fdf4", borderRadius: "var(--radius-md)", border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 600 }}>ASSIGNED RESCUE UNIT</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#15803d" }}>{selectedSOS.assigned_team_name}</div>
                <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>Status: En Route with Inflatable Rescue Craft</div>
              </div>
            ) : (
              onAssignSOS && (
                <button
                  onClick={() => onAssignSOS(selectedSOS.id)}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <ShieldAlert size={16} />
                  <span>Dispatch Nearest Rescue Squad</span>
                </button>
              )
            )}
          </>
        )}

        {/* --- PUMP INSPECTION --- */}
        {selectedPump && (
          <>
            <div>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "4px" }}>{selectedPump.name}</h3>
              <span className={`badge ${selectedPump.status === "ACTIVE" ? "badge-safe" : "badge-warn"}`}>
                {selectedPump.status}
              </span>
            </div>

            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Rated Capacity:</span>
                <b>{selectedPump.discharge_capacity_m3h} m³/h</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Fuel Level:</span>
                <b>{selectedPump.fuel_level_pct}%</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Hours Run Today:</span>
                <b>{selectedPump.operating_hours_today} hrs</b>
              </div>
            </div>

            {onActivatePump && selectedPump.status !== "ACTIVE" && (
              <button
                onClick={() => onActivatePump(selectedPump.id)}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Droplets size={16} />
                <span>Activate Dewatering Pump</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
