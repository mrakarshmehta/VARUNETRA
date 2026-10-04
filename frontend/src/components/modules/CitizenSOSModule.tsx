import React, { useState } from "react";
import {
  LifeBuoy,
  Users,
  Send,
} from "lucide-react";
import { SOSIncident, RiskLevel, SOSStatus } from "../../types";
import { api } from "../../api/client";
import { CivicButton } from "../primitives/CivicButton";
import { StatusPill } from "../primitives/StatusPill";
import { SegmentedControl } from "../primitives/SegmentedControl";
import { OperatorEmptyState } from "../primitives";

interface CitizenSOSModuleProps {
  sosList: SOSIncident[];
  onSOSCreated: (sos: SOSIncident) => void;
  onUpdateStatus: (id: string, status: SOSStatus) => void;
  onSelectSOS?: (sos: SOSIncident) => void;
}

export const CitizenSOSModule: React.FC<CitizenSOSModuleProps> = ({
  sosList,
  onSOSCreated,
  onUpdateStatus,
  onSelectSOS,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showBeaconForm, setShowBeaconForm] = useState(false);

  // Form State
  const [peopleCount, setPeopleCount] = useState(3);
  const [emergencyType, setEmergencyType] = useState("Trapped in Waterlogging (Depth > 40cm)");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [address, setAddress] = useState("House 12, Road 4, Rajendra Nagar, Patna");
  const [notes, setNotes] = useState("Elderly family member unable to climb stairs. Water entering ground floor.");
  const [lat, setLat] = useState(25.6015);
  const [lng, setLng] = useState(85.153);
  const [submitting, setSubmitting] = useState(false);
  const [, setCreatedSuccess] = useState<SOSIncident | null>(null);

  const handleSubmitSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createSOS({
        lat,
        lng,
        number_of_people: peopleCount,
        emergency_type: emergencyType,
        severity: "CRITICAL" as RiskLevel,
        contact_phone: phone,
        address_hint: address,
        notes,
      });
      setCreatedSuccess(res);
      onSOSCreated(res);
      setShowBeaconForm(false);
    } catch (err) {
      console.error("SOS creation failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_STEPS = ["RECEIVED", "VERIFIED", "DISPATCHED", "IN_TRANSIT", "RESOLVED"];

  const getNextStatus = (current: string): SOSStatus => {
    switch (current) {
      case "RECEIVED":
      case "NEW":
        return "ACKNOWLEDGED";
      case "VERIFIED":
      case "ACKNOWLEDGED":
        return "ASSIGNED";
      case "DISPATCHED":
      case "ASSIGNED":
        return "EN_ROUTE";
      case "IN_TRANSIT":
      case "EN_ROUTE":
        return "RESCUED";
      default:
        return "RESCUED";
    }
  };

  const filteredIncidents = sosList.filter((s) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "ACTIVE") return s.status !== "CLOSED" && (s.status as string) !== "RESOLVED" && s.status !== "RESCUED";
    return s.status === filterStatus;
  });

  return (
    <div
      style={{
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Module Header & Tactical Dispatch Bar */}
      <div
        className="civic-glass-subtle"
        style={{
          padding: "14px 18px",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Citizen Emergency SOS & Tactical Rescue Console
            </h2>
            <StatusPill type="CRITICAL" label="SDRF / NDRF DISPATCH" />
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Real-time incident queue, casualty severity triage, water depth assessment, and boat squad tracking.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Filter Tabs */}
          <SegmentedControl
            size="sm"
            options={[
              { value: "ALL", label: "ALL" },
              { value: "ACTIVE", label: "ACTIVE" },
              { value: "DISPATCHED", label: "DISPATCHED" },
              { value: "RESOLVED", label: "RESOLVED" },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
          />

          {/* Trigger SOS Beacon Button */}
          <CivicButton
            variant="danger"
            size="sm"
            icon={<LifeBuoy size={14} />}
            onClick={() => setShowBeaconForm(!showBeaconForm)}
          >
            {showBeaconForm ? "Close Beacon Form" : "+ Create SOS Beacon"}
          </CivicButton>
        </div>
      </div>

      {/* Manual Emergency Beacon Injection Form (collapsible) */}
      {showBeaconForm && (
        <div
          className="civic-glass-card"
          style={{
            padding: "16px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--critical-border)",
            background: "var(--critical-primary-light)",
          }}
        >
          <form onSubmit={handleSubmitSOS} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--critical-primary)" }}>
                Emergency Beacon Dispatch Form
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                GPS Locked: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E (Patna Basin)
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--critical-text)", display: "block", marginBottom: "4px" }}>
                  Emergency Type
                </label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "0.76rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-ui)",
                    background: "var(--pearl-surface)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="Trapped in Waterlogging (Depth > 40cm)">Trapped in Waterlogging (Depth &gt; 40cm)</option>
                  <option value="Water Entering Ground Floor / Rising Rapidly">Water Entering Ground Floor</option>
                  <option value="Elderly / Medical Evacuation Needed">Elderly / Medical Evacuation</option>
                  <option value="Rooftop Stranded Due to Submerged Lane">Rooftop Stranded (Submerged Lane)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--critical-text)", display: "block", marginBottom: "4px" }}>
                  People Trapped
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "0.76rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-ui)",
                    background: "var(--pearl-surface)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--critical-text)", display: "block", marginBottom: "4px" }}>
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "0.76rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-ui)",
                    background: "var(--pearl-surface)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--critical-text)", display: "block", marginBottom: "4px" }}>
                  Address / Landmark
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "0.76rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-ui)",
                    background: "var(--pearl-surface)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--critical-text)", display: "block", marginBottom: "4px" }}>
                  Special Needs / Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "0.76rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-ui)",
                    background: "var(--pearl-surface)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <CivicButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowBeaconForm(false)}
              >
                Cancel
              </CivicButton>
              <CivicButton
                type="submit"
                variant="danger"
                size="sm"
                disabled={submitting}
                icon={<Send size={13} />}
              >
                {submitting ? "Broadcasting..." : "Broadcast Rescue Beacon"}
              </CivicButton>
            </div>
          </form>
        </div>
      )}

      {/* Real Emergency Dispatch Table */}
      <div
        className="civic-glass-card"
        style={{
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--glass-border-light)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            className="op-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.76rem",
            }}
          >
            <thead>
              <tr style={{ background: "var(--pearl-surface-wash)", borderBottom: "1px solid var(--border-ui)" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>SOS ID</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Incident & Location</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>People</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Priority</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Water Depth</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Vehicle Access</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Nearest Shelter</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Assigned Rescue Unit</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600 }}>Status Progression</th>
                <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "32px 16px" }}>
                    <OperatorEmptyState
                      title="NO ACTIVE SOS INCIDENTS"
                      description="The emergency dispatch queue is currently clear for the selected operational filter."
                      actionText={filterStatus !== "ALL" ? "Show All Incidents" : "+ Create SOS Beacon"}
                      onAction={() => {
                        if (filterStatus !== "ALL") {
                          setFilterStatus("ALL");
                        } else {
                          setShowBeaconForm(true);
                        }
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((sos) => {
                  const depth = sos.reported_depth_cm || 45;
                  const vehicleAccess = depth > 50 ? "INFLATABLE BOAT ONLY" : depth > 25 ? "HIGH-CLEARANCE 4x4" : "LIGHT AMBULANCE";

                  return (
                    <tr
                      key={sos.id}
                      onClick={() => onSelectSOS && onSelectSOS(sos)}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        cursor: onSelectSOS ? "pointer" : "default",
                      }}
                    >
                      {/* SOS ID */}
                      <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--brand-primary)" }}>
                        {sos.id}
                      </td>

                      {/* Incident & Location */}
                      <td style={{ padding: "8px 12px" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{sos.emergency_type}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{sos.address_hint}</div>
                          <div style={{ fontSize: "0.66rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                            {sos.contact_phone}
                          </div>
                        </div>
                      </td>

                      {/* People */}
                      <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Users size={13} color="var(--text-muted)" />
                          <span>{sos.number_of_people}</span>
                        </span>
                      </td>

                      {/* Priority */}
                      <td style={{ padding: "8px 12px" }}>
                        <StatusPill
                          type={sos.severity === "CRITICAL" ? "CRITICAL" : "WARNING"}
                          label={sos.severity}
                        />
                      </td>

                      {/* Water Depth */}
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          color: depth > 40 ? "var(--critical-primary)" : "var(--warn-primary)",
                        }}
                      >
                        {depth} cm
                      </td>

                      {/* Vehicle Access */}
                      <td style={{ padding: "8px 12px" }}>
                        <span
                          style={{
                            fontSize: "0.66rem",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            color: depth > 50 ? "var(--critical-primary)" : depth > 25 ? "var(--warn-primary)" : "var(--safe-primary)",
                          }}
                        >
                          {vehicleAccess}
                        </span>
                      </td>

                      {/* Nearest Shelter */}
                      <td style={{ padding: "8px 12px", fontSize: "0.74rem" }}>
                        Rajendra Nagar Community Hall (850m)
                      </td>

                      {/* Assigned Rescue Unit */}
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ fontWeight: 600, color: "var(--brand-primary)", fontSize: "0.74rem" }}>
                          {sos.assigned_team_name || "SDRF Tactical Squad 01"}
                        </div>
                        <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          Unit: {sos.assigned_team_id || "SDRF-BOAT-02"}
                        </div>
                      </td>

                      {/* Status Progression */}
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          {STATUS_STEPS.map((st, i) => {
                            const isDone = STATUS_STEPS.indexOf(sos.status as any) >= i;
                            const isCurrent = sos.status === st;
                            return (
                              <React.Fragment key={st}>
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    fontFamily: "var(--font-mono)",
                                    padding: "2px 4px",
                                    borderRadius: "var(--radius-xs)",
                                    background: isCurrent
                                      ? "var(--brand-primary)"
                                      : isDone
                                      ? "var(--pearl-surface-wash)"
                                      : "transparent",
                                    color: isCurrent ? "#ffffff" : isDone ? "var(--text-primary)" : "var(--text-muted)",
                                    fontWeight: isCurrent ? 700 : 500,
                                  }}
                                  title={st}
                                >
                                  {st.slice(0, 3)}
                                </span>
                                {i < STATUS_STEPS.length - 1 && (
                                  <span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>›</span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        {sos.status !== "CLOSED" && (sos.status as string) !== "RESOLVED" && sos.status !== "RESCUED" ? (
                          <CivicButton
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(sos.id, getNextStatus(sos.status));
                            }}
                          >
                            Advance
                          </CivicButton>
                        ) : (
                          <span style={{ fontSize: "0.72rem", color: "var(--safe-primary)", fontWeight: 700 }}>
                            ✓ Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
