import React, { useState } from "react";
import {
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Cpu,
  Layers,
  ShieldAlert,
  Compass,
  Database,
  Printer,
} from "lucide-react";
import { CivicButton, StatusPill } from "../primitives";
import { NowcastTimeStep } from "../../types";

interface ReportsModuleProps {
  currentStep?: NowcastTimeStep | null;
  onNavigateToModule?: (moduleKey: any) => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  currentStep,
  onNavigateToModule,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const researchReferences = [
    {
      title: "Smart India Hackathon (SIH 2026)",
      category: "National Problem Statement",
      id: "SIH26085",
      problem: "Urban Flood Nowcasting System (Drainage and Rainfall Coupling)",
      ministry: "Ministry of Earth Sciences (MoES)",
      team: "Team Singularity@",
      url: "https://www.sih.gov.in/",
      summary: "High-level national challenge requiring real-time hydrodynamic and rainfall hyetograph coupling for 0–180 minute street-level flood intelligence.",
    },
    {
      title: "U.S. EPA Storm Water Management Model (SWMM 5.2)",
      category: "Hydrological & Hydraulic Engine",
      url: "https://www.epa.gov/water-research/storm-water-management-model-swmm",
      summary: "Dynamic rainfall-runoff simulation model used worldwide for single-event or continuous simulation of stormwater runoff and pipe network hydraulics.",
    },
    {
      title: "Itzi Urban Flood 2D Hydrodynamic Model",
      category: "2D Overland Inundation Modeling",
      url: "https://itzi.org/",
      summary: "Dynamic 2D overland flow model solving simplified shallow-water equations with high computational efficiency for real-time urban flash flood simulations.",
    },
    {
      title: "India Meteorological Department (IMD) - Mausam",
      category: "Precipitation Telemetry & Radar",
      url: "https://mausam.imd.gov.in/",
      summary: "National meteorological agency providing Doppler Weather Radar (DWR) reflectivity (dBZ) and Quantitative Precipitation Estimation (QPE).",
    },
    {
      title: "ISRO / MOSDAC (Meteorological & Oceanographic Satellite Data)",
      category: "Satellite Remote Sensing",
      url: "https://www.mosdac.gov.in/",
      summary: "Real-time INSAT-3D/3DR meteorological observations, cloud motion vectors, and half-hourly convective precipitation indices across India.",
    },
    {
      title: "ESA Copernicus GLO-30 Digital Surface Model",
      category: "Satellite Elevation Dataset",
      url: "https://browser.dataspace.copernicus.eu/",
      summary: "Active real terrain dataset providing ~30m surface elevation (DSM) derived from TanDEM-X radar interferometry under WGS84 / EGM2008 vertical datum.",
    },
    {
      title: "OpenStreetMap (OSM) & Patna Urban Infrastructure",
      category: "Geospatial Road & Infrastructure Network",
      url: "https://www.openstreetmap.org/",
      summary: "Open geospatial vector database providing authoritative street alignments, road classifications, hospital facilities, and administrative boundaries.",
    },
  ];

  const handleExportJSON = () => {
    const reportData = {
      title: "VARUNETRA Operational Flood Intelligence & Terrain Report",
      generated_at: new Date().toISOString(),
      problem_statement: "SIH26085 — Urban Flood Nowcasting System",
      pilot_basin: "Patna Urban Basin, Bihar",
      coordinates: {
        north: 25.640,
        south: 25.570,
        east: 85.220,
        west: 85.080,
      },
      elevation_source: "ESA Copernicus GLO-30 DSM (30m)",
      elevation_classification: "Surface Elevation (DSM)",
      active_nowcast_step: currentStep || "Baseline",
      provenance_tiers: {
        real_input: "Copernicus GLO-30 DSM",
        derived_geomorphology: "Slope, Aspect, D8 Flow, Depressions, HAND, Drainage Proximity",
        simulated_hydraulics: "Coupled Surcharge, Flood Depth, Impairment Penalty",
        demo_controls: "15-Stage Controlled Disaster Timeline",
      },
      ml_disclaimer: "Surrogate Feature Attribution (Model Interpretation, Not Calibrated Hydraulic Ground Truth). Retraining required due to real-world terrain feature shift.",
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `VARUNETRA_Patna_Flood_Report_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess("Report successfully exported as JSON.");
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: "1400px", margin: "0 auto", paddingBottom: "32px" }}>
      {/* Header Banner */}
      <div
        className="civic-glass"
        style={{
          padding: "var(--space-4) var(--space-5)",
          borderRadius: "var(--r-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-3)",
        }}
      >
        <div style={{ minWidth: "280px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <FileText size={20} color="var(--color-rain-base)" />
            <h2 style={{ fontSize: "18px", fontWeight: 700 }}>
              Reports, Scientific Governance & Research References
            </h2>
            <StatusPill type="NORMAL" label="AUDITED PROVENANCE" size="sm" />
          </div>
          <p className="text-xs" style={{ color: "var(--ink-700)", marginTop: "4px", maxWidth: "880px" }}>
            Authoritative municipal documentation, scientific citations, data provenance records, and regulatory disclosures for the Patna Urban Basin Pilot (SIH26085).
          </p>
        </div>

        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <CivicButton
            variant="secondary"
            size="md"
            onClick={() => window.print()}
            icon={<Printer size={14} strokeWidth={1.75} />}
          >
            Print Dossier
          </CivicButton>
          <CivicButton
            variant="primary"
            size="md"
            onClick={handleExportJSON}
            icon={<Download size={14} strokeWidth={1.75} />}
          >
            Export Telemetry JSON
          </CivicButton>
        </div>
      </div>

      {downloadSuccess && (
        <div
          className="civic-glass-soft"
          style={{
            padding: "8px 14px",
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--color-normal-border)",
            background: "var(--color-normal-fill)",
            color: "var(--color-normal-text)",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Grid: Executive Pilot Summary + Governance Disclaimers */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "var(--space-4)" }}>
        {/* Left: Pilot Executive Telemetry Card */}
        <div className="civic-glass" style={{ padding: "var(--space-4)", borderRadius: "var(--r-lg)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700 }}>Patna Urban Basin Pilot Specification</h3>
            <span className="font-mono text-micro" style={{ color: "var(--ink-600)" }}>AOI: 25.570°N – 25.640°N</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="civic-glass-soft" style={{ padding: "10px", borderRadius: "var(--r-sm)" }}>
              <div className="text-micro" style={{ color: "var(--ink-600)" }}>Elevation Provider</div>
              <div style={{ fontWeight: 700, fontSize: "13px", marginTop: "2px", color: "var(--color-real-text)" }}>
                ESA Copernicus GLO-30 DSM
              </div>
              <div className="text-micro" style={{ color: "var(--ink-600)", marginTop: "2px" }}>
                Resolution: 30m · Datum: EGM2008
              </div>
            </div>

            <div className="civic-glass-soft" style={{ padding: "10px", borderRadius: "var(--r-sm)" }}>
              <div className="text-micro" style={{ color: "var(--ink-600)" }}>Classification Type</div>
              <div style={{ fontWeight: 700, fontSize: "13px", marginTop: "2px" }}>
                Surface Elevation (DSM)
              </div>
              <div className="text-micro" style={{ color: "var(--ink-600)", marginTop: "2px" }}>
                Includes physical canopy & rooftops
              </div>
            </div>

            <div className="civic-glass-soft" style={{ padding: "10px", borderRadius: "var(--r-sm)" }}>
              <div className="text-micro" style={{ color: "var(--ink-600)" }}>Stormwater Coupling</div>
              <div style={{ fontWeight: 700, fontSize: "13px", marginTop: "2px", color: "var(--color-rain-text)" }}>
                1D Pipe Network + 2D Sinks
              </div>
              <div className="text-micro" style={{ color: "var(--ink-600)", marginTop: "2px" }}>
                Inverts: [SIMULATED / ESTIMATED]
              </div>
            </div>

            <div className="civic-glass-soft" style={{ padding: "10px", borderRadius: "var(--r-sm)" }}>
              <div className="text-micro" style={{ color: "var(--ink-600)" }}>Nowcast Lead Horizon</div>
              <div style={{ fontWeight: 700, fontSize: "13px", marginTop: "2px" }}>
                0 to 180 Minutes
              </div>
              <div className="text-micro" style={{ color: "var(--ink-600)", marginTop: "2px" }}>
                15-min dynamic recurrence steps
              </div>
            </div>
          </div>

          <div
            className="civic-glass-soft"
            style={{
              padding: "10px 12px",
              borderRadius: "var(--r-sm)",
              border: "1px solid var(--color-warning-border)",
              background: "var(--color-warning-fill)",
              fontSize: "11px",
              color: "var(--color-warning-text)",
              lineHeight: 1.4,
            }}
          >
            <b>Scientific Protocol Note:</b> Invert elevations for trunk culverts (Saidpur, Anandpuri, Kankarbagh) are explicit hydraulic model parameters. They are not silently derived from satellite DSM surface pixels.
          </div>
        </div>

        {/* Right: Scientific Governance & ML Recalibration Notice */}
        <div className="civic-glass" style={{ padding: "var(--space-4)", borderRadius: "var(--r-lg)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Cpu size={16} color="var(--color-warning-base)" />
            <h3 style={{ fontSize: "14px", fontWeight: 700 }}>ML Recalibration & Provenance Disclosure</h3>
          </div>

          <div
            className="civic-glass-soft"
            style={{
              padding: "12px",
              borderRadius: "var(--r-sm)",
              border: "1px solid var(--color-warning-border)",
              background: "var(--color-warning-fill)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "12px", color: "var(--color-warning-text)" }}>
                MODEL STATUS: REQUIRES RECALIBRATION
              </span>
              <StatusPill type="WARNING" label="COVARIATE SHIFT" size="sm" />
            </div>
            <p className="text-xs" style={{ color: "var(--color-warning-text)", margin: 0 }}>
              The real Copernicus GLO-30 DSM terrain integration introduces genuine topographic feature distributions (slopes 0.4°–3.2°, D8 flow accumulations up to 112 cells) differing from synthetic benchmark grids. Models require formal retraining before operational sign-off.
            </p>
          </div>

          <div className="civic-glass-soft" style={{ padding: "10px 12px", borderRadius: "var(--r-sm)" }}>
            <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--ink-900)" }}>
              Surrogate Feature Attribution Policy
            </div>
            <p className="text-micro" style={{ color: "var(--ink-600)", marginTop: "3px", margin: 0 }}>
              SHAP / tree-importance surrogate values represent statistical model interpretation within the surrogate network, not calibrated hydraulic ground truth.
            </p>
          </div>
        </div>
      </div>

      {/* Official Research & References Section */}
      <div className="civic-glass" style={{ padding: "var(--space-4) var(--space-5)", borderRadius: "var(--r-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <BookOpen size={16} color="var(--color-rain-base)" />
              <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Official Research & Scientific Citations</h3>
            </div>
            <p className="text-micro" style={{ color: "var(--ink-600)", marginTop: "2px" }}>
              Direct authoritative links to foundational models, national meteorological portals, and open geospatial resources.
            </p>
          </div>
          <span className="font-mono text-micro" style={{ background: "rgba(15, 23, 42, 0.05)", padding: "2px 8px", borderRadius: "var(--r-sm)", border: "var(--glass-hairline)" }}>
            7 Core Foundational Sources
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-3)" }}>
          {researchReferences.map((ref, idx) => (
            <div
              key={idx}
              className="civic-glass-soft"
              style={{
                padding: "12px 14px",
                borderRadius: "var(--r-md)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <span
                    className="font-mono text-micro"
                    style={{
                      color: "var(--color-rain-text)",
                      background: "var(--color-rain-fill)",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      border: "1px solid var(--color-rain-border)",
                      fontSize: "10px",
                    }}
                  >
                    {ref.category}
                  </span>
                  {ref.id && (
                    <span className="font-mono text-micro" style={{ fontWeight: 700, color: "var(--ink-700)" }}>
                      {ref.id}
                    </span>
                  )}
                </div>

                <h4 style={{ fontSize: "13px", fontWeight: 700, marginTop: "6px", color: "var(--ink-900)" }}>
                  {ref.title}
                </h4>

                <p className="text-xs" style={{ color: "var(--ink-600)", marginTop: "4px", lineHeight: 1.45 }}>
                  {ref.summary}
                </p>
              </div>

              <div style={{ paddingTop: "6px", borderTop: "var(--glass-hairline)" }}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="civic-btn civic-btn-ghost civic-btn-sm"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--color-rain-text)",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    padding: "4px 8px",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={12} />
                  <span>{ref.url}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
