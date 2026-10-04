import React, { useState, useEffect } from "react";
import {
  AlertCircle,
} from "lucide-react";
import { MLModelStatus, MLPredictionDetail, FeatureImportanceItem } from "../../types";
import { api } from "../../api/client";
import { CivicButton } from "../primitives/CivicButton";
import { StatusPill } from "../primitives/StatusPill";
import { TabularKpi } from "../primitives/TabularKpi";

export const MLCenterModule: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<MLModelStatus | null>(null);
  const [featureList, setFeatureList] = useState<FeatureImportanceItem[]>([]);
  const [, setLoading] = useState(true);

  // Interactive Local Attribution State
  const [selectedCatchment] = useState("CAT-02");
  const [rainRate, setRainRate] = useState(78.0);
  const [drainageUtil, setDrainageUtil] = useState(94.0);
  const [blockagePct, setBlockagePct] = useState(35.0);
  const [localExplanation, setLocalExplanation] = useState<MLPredictionDetail | null>(null);

  useEffect(() => {
    async function loadMLData() {
      try {
        const status = await api.getMLStatus();
        setModelStatus(status);
        const featRes = await api.getFeatureImportance();
        setFeatureList(featRes.features || []);

        // Fetch initial explanation
        const exp = await api.explainMLPrediction("CAT-02", "Rajendra Nagar Low Basin", [
          78.0, 19.5, 39.0, 78.0, 118.0, 48.4, 0.4, 88.0, 110.0, 3.2, 35.0, 94.0, 49.85, 2100.0,
        ]);
        setLocalExplanation(exp);
      } catch (err) {
        console.error("Failed to load ML center:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMLData();
  }, []);

  const handleRecalculateAttribution = async () => {
    try {
      const exp = await api.explainMLPrediction(
        selectedCatchment,
        selectedCatchment === "CAT-02" ? "Rajendra Nagar Low Basin" : "Kankarbagh Basin",
        [
          rainRate,
          rainRate * 0.25,
          rainRate * 0.5,
          rainRate,
          rainRate * 1.5,
          48.4,
          0.5,
          85.0,
          95.0,
          2.8,
          blockagePct,
          drainageUtil,
          49.85,
          2200.0,
        ]
      );
      setLocalExplanation(exp);
    } catch (err) {
      console.error("Recalculate attribution error:", err);
    }
  };

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
      {/* Header */}
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
              Technical AI/ML Intelligence & Provenance Center
            </h2>
            <StatusPill type="SYNTHETIC" label="HistGradientBoosting + Hydro Surrogate" />
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Physically informed hydrodynamic surrogate trained on coupled 1D-2D simulation runs with strict leave-one-event-out chronological validation.
          </p>
        </div>

        <StatusPill type="SYNTHETIC" label="SIMULATION BENCHMARK" />
      </div>

      {/* Mandatory Performance Disclaimer Banner */}
      <div
        style={{
          padding: "12px 16px",
          background: "var(--warn-surface)",
          border: "1.5px solid var(--warn-border)",
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <AlertCircle size={20} color="var(--warn-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.84rem", color: "var(--warn-text)", letterSpacing: "0.02em" }}>
            SYNTHETIC / SIMULATION PERFORMANCE — NOT REAL-WORLD VALIDATION
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--warn-text)", marginTop: "4px", lineHeight: 1.45 }}>
            Reported performance metrics below (R², MAE, Precision, Recall, IoU) are evaluated strictly on synthetic 1D-2D hydrodynamic benchmark simulations using Leave-One-Storm-Out chronological splits. They do <b>NOT</b> represent field-validated physical accuracy against official government ground gages.
          </div>
        </div>
      </div>

      {/* Model Metadata Card */}
      {modelStatus && (
        <div
          className="civic-glass-card"
          style={{
            padding: "16px",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: "1px solid var(--glass-border-light)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--safe-primary)" }}>
                {modelStatus.model_name}
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Version: <b>{modelStatus.model_version}</b> • Dataset: <b>{modelStatus.dataset_version}</b>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <StatusPill type="SYNTHETIC" label={`DATA: ${modelStatus.data_provenance}`} />
              <StatusPill type="NORMAL" label="SIMULATION SURROGATE" />
            </div>
          </div>

          <div
            className="civic-glass-subtle"
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.74rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div><b>Dataset Provenance:</b> {modelStatus.dataset_provenance || "Coupled 1D Manning & 2D Hydrodynamic Surcharge Simulation Dataset (3,787 samples)"}</div>
            <div><b>Validation Mode:</b> {modelStatus.validation_split_description || "Leave-One-Storm-Out Chronological Split (No temporal data leakage)"}</div>
            <div style={{ color: "var(--warn-text)", fontWeight: 600 }}><b>Calibration Notice:</b> {modelStatus.calibration_notice}</div>
          </div>

          {/* Metrics Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "10px",
            }}
          >
            <TabularKpi
              label="R² Score (Depth Fit)"
              value={modelStatus.r2_score}
              tone="normal"
            />
            <TabularKpi
              label="MAE Depth"
              value={modelStatus.mae_cm}
              unit="cm"
              tone="rain"
            />
            <TabularKpi
              label="RMSE"
              value={modelStatus.rmse_cm}
              unit="cm"
              tone="rain"
            />
            <TabularKpi
              label="Precision (>10cm)"
              value={modelStatus.precision}
              tone="normal"
            />
            <TabularKpi
              label="Recall (Safety)"
              value={modelStatus.recall}
              tone="normal"
            />
            <TabularKpi
              label="Spatial IoU"
              value={modelStatus.iou_spatial}
              tone="normal"
            />
            <TabularKpi
              label="Inference Latency"
              value={modelStatus.inference_latency_ms}
              unit="ms"
              tone="neutral"
            />
          </div>
        </div>
      )}

      {/* Global Feature Importance + Local TreeSHAP Attribution */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.3fr)",
          gap: "16px",
        }}
      >
        {/* Left: Global Feature Importance Rankings */}
        <div
          className="civic-glass-card"
          style={{
            padding: "16px",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: "1px solid var(--glass-border-light)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Global Hydrological Feature Importance
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Trained surrogate feature contributions across 60 storm events
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {featureList.slice(0, 8).map((feat) => {
              const pct = Math.round(feat.importance * 100);
              return (
                <div key={feat.feature_name} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{feat.display_name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--brand-primary)", fontWeight: 700 }}>
                      {pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "5px",
                      background: "var(--border-subtle)",
                      borderRadius: "var(--radius-full)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "var(--brand-primary)",
                        borderRadius: "var(--radius-full)",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>{feat.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Local Attribution / SHAP-style Calculator */}
        <div
          className="civic-glass-card"
          style={{
            padding: "16px",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: "1px solid var(--glass-border-light)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Explainable AI: Local Feature Attribution
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              TreeSHAP marginal effects: exactly why an area experiences waterlogging
            </span>
          </div>

          {/* Interactive Sliders */}
          <div
            className="civic-glass-subtle"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              padding: "12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 600, marginBottom: "3px" }}>
                <span>Rainfall Intensity</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--brand-primary)" }}>{rainRate} mm/h</span>
              </div>
              <input
                type="range"
                min={10}
                max={120}
                value={rainRate}
                onChange={(e) => setRainRate(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--brand-primary)" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 600, marginBottom: "3px" }}>
                <span>Drainage Conduit Utilization (Surcharge)</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--drain-primary)" }}>{drainageUtil}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={130}
                value={drainageUtil}
                onChange={(e) => setDrainageUtil(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--drain-primary)" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 600, marginBottom: "3px" }}>
                <span>Pipe Silt / Debris Blockage Factor</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--critical-primary)" }}>{blockagePct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={75}
                value={blockagePct}
                onChange={(e) => setBlockagePct(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--critical-primary)" }}
              />
            </div>

            <CivicButton
              size="sm"
              variant="primary"
              onClick={handleRecalculateAttribution}
              style={{ width: "100%", marginTop: "4px" }}
            >
              Recalculate Local Attribution
            </CivicButton>
          </div>

          {/* Local Attribution Results */}
          {localExplanation && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                className="civic-glass-subtle"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--brand-primary-light)",
                  background: "var(--brand-primary-light)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.66rem", color: "var(--brand-primary)", fontWeight: 700, textTransform: "uppercase" }}>
                    Predicted Depth & Uncertainty
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--brand-primary)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                    {localExplanation.predicted_depth_cm} <span style={{ fontSize: "0.78rem" }}>cm</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Depth Band: <b>{localExplanation.depth_band}</b> ({localExplanation.uncertainty} Uncertainty)
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <StatusPill
                    type={localExplanation.risk_level === "CRITICAL" ? "CRITICAL" : "WARNING"}
                    label={localExplanation.risk_level}
                  />
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Confidence: <b>{Math.round(localExplanation.confidence_score * 100)}%</b>
                  </div>
                </div>
              </div>

              {/* WHY IS THIS LOCATION AT RISK? - 7 Causal Factors */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>
                  Why is this location at risk? (7 Causal Factors)
                </div>

                {localExplanation.causal_factors && localExplanation.causal_factors.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    {localExplanation.causal_factors.map((cf) => (
                      <div
                        key={cf.factor_name}
                        className="civic-glass-subtle"
                        style={{
                          padding: "6px 8px",
                          borderRadius: "var(--radius-xs)",
                          border: `1px solid ${cf.impact === "CRITICAL" ? "var(--critical-border)" : "var(--border-subtle)"}`,
                          fontSize: "0.7rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                          <span style={{ color: "var(--text-primary)" }}>{cf.display_name}</span>
                          <span style={{ color: cf.impact === "CRITICAL" ? "var(--critical-primary)" : "var(--warn-primary)" }}>
                            {cf.contribution_pct}%
                          </span>
                        </div>
                        <div style={{ fontSize: "0.64rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {cf.value} • {cf.description}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {localExplanation.contributions.map((c) => (
                      <div
                        key={c.feature_name}
                        className="civic-glass-subtle"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          borderRadius: "var(--radius-xs)",
                          borderLeft: `3px solid ${c.contribution_cm >= 0 ? "var(--critical-primary)" : "var(--safe-primary)"}`,
                          fontSize: "0.74rem",
                        }}
                      >
                        <span style={{ color: "var(--text-primary)" }}>{c.display_text}</span>
                        <span
                          style={{
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            color: c.contribution_cm >= 0 ? "var(--critical-primary)" : "var(--safe-primary)",
                          }}
                        >
                          {c.contribution_cm >= 0 ? `+${c.contribution_cm}` : c.contribution_cm} cm
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Natural language reasoning */}
              <div
                className="civic-glass-subtle"
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius-xs)",
                  fontSize: "0.72rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.4,
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <strong style={{ color: "var(--text-primary)" }}>Reasoning Engine:</strong> {localExplanation.reasoning_summary}
              </div>

              {/* Physical Certainty vs Model Explanation Disclaimer */}
              <div
                style={{
                  padding: "8px 10px",
                  background: "var(--warn-surface)",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--warn-border)",
                  fontSize: "0.68rem",
                  color: "var(--warn-text)",
                  lineHeight: 1.35,
                }}
              >
                <b>Attribution Disclaimer:</b> {localExplanation.model_explanation_disclaimer || "Machine-learned surrogate feature attribution — Not physical hydraulic certainty. Field operations must verify local drain blockages and sensor telemetry before structural intervention."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
