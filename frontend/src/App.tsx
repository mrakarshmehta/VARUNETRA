import React, { useState, useEffect, lazy, Suspense } from "react";
import { Navbar } from "./components/Navbar";
import { Sidebar, ModuleKey } from "./components/Sidebar";
import { GISMap } from "./components/GISMap";
import { TimelineSlider } from "./components/TimelineSlider";
import { ScenarioBar } from "./components/ScenarioBar";
import { IntelligencePanel } from "./components/IntelligencePanel";
import { CausalityPipelineRibbon } from "./components/CausalityPipelineRibbon";
import { CesiumCityView } from "./components/CesiumCityView";
import { Map as MapIcon, Globe } from "lucide-react";
import { DevPrimitivesPage } from "./components/DevPrimitivesPage";
import { SegmentedControl } from "./components/primitives";

// Specialized Module Views
import { OverviewModule } from "./components/modules/OverviewModule";
import { NowcastModule } from "./components/modules/NowcastModule";
import { RoutingModule } from "./components/modules/RoutingModule";
import { CitizenSOSModule } from "./components/modules/CitizenSOSModule";
import { MLCenterModule } from "./components/modules/MLCenterModule";
import { DrainageModule } from "./components/modules/DrainageModule";
import { PumpsModule } from "./components/modules/PumpsModule";
import { SheltersModule } from "./components/modules/SheltersModule";
import { ReliefModule } from "./components/modules/ReliefModule";
import { DamageModule } from "./components/modules/DamageModule";
import { RainfallModule } from "./components/modules/RainfallModule";
import { CitizenPortalModule } from "./components/modules/CitizenPortalModule";
import { TerrainModule } from "./components/modules/TerrainModule";
import { ReportsModule } from "./components/modules/ReportsModule";
import { ProviderStatusModal } from "./components/ProviderStatusModal";

import {
  UserRole,
  DataProvenance,
  NowcastSeriesResponse,
  NowcastTimeStep,
  SOSIncident,
  IncidentReport,
  RescueTeam,
  ShelterHospital,
  MunicipalPump,
  ReliefCamp,
  DamageReport,
  Alert,
  RouteResponse,
  ScenarioStage,
  SituationBoard,
  ScenarioOutcomeSummary,
} from "./types";
import { api, createTelemetryWebSocket } from "./api/client";
import { SituationBoardModal, ScenarioOutcomeModal } from "./components/ScenarioModals";
import { FeedbackToastMessage, ActionFeedbackToast } from "./components/primitives/FeedbackStates";
import { ActionConfirmationModal } from "./components/ActionConfirmationModal";

export type ViewMode = "2D" | "3D";

export const App: React.FC = () => {
  // Navigation & Role State
  const [currentRole, setCurrentRole] = useState<UserRole>("DISASTER_AUTHORITY");
  const [activeModule, setActiveModule] = useState<ModuleKey>("overview");
  const [dataMode, setDataMode] = useState<DataProvenance>("DEMO");
  const [viewMode, setViewMode] = useState<ViewMode>("2D");
  const [highlightLayer, setHighlightLayer] = useState<string | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [isDevPrimitives, setIsDevPrimitives] = useState<boolean>(() => {
    return (
      window.location.pathname.includes("/dev/primitives") ||
      window.location.hash.includes("dev/primitives") ||
      window.location.search.includes("dev=primitives")
    );
  });

  useEffect(() => {
    document.title = "VARUNETRA — Urban Flood Intelligence & Response";
    const handleHash = () => {
      setIsDevPrimitives(
        window.location.pathname.includes("/dev/primitives") ||
        window.location.hash.includes("dev/primitives") ||
        window.location.search.includes("dev=primitives")
      );
    };
    window.addEventListener("hashchange", handleHash);
    window.addEventListener("popstate", handleHash);
    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("popstate", handleHash);
    };
  }, []);

  // Telemetry & Data States
  const [nowcastSeries, setNowcastSeries] = useState<NowcastSeriesResponse | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(false);

  const [roads, setRoads] = useState<any[]>([]);
  const [drainageData, setDrainageData] = useState<any>(null);
  const [rainfallData, setRainfallData] = useState<any>(null);
  const [sosList, setSOSList] = useState<SOSIncident[]>([]);
  const [facilities, setFacilities] = useState<ShelterHospital[]>([]);
  const [pumps, setPumps] = useState<MunicipalPump[]>([]);
  const [reliefCamps, setReliefCamps] = useState<ReliefCamp[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [scenarioStage, setScenarioStage] = useState<ScenarioStage | null>(null);

  // Operational Demo Scenario States
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [isSituationBoardOpen, setIsSituationBoardOpen] = useState<boolean>(false);
  const [situationBoardData, setSituationBoardData] = useState<SituationBoard | null>(null);
  const [isOutcomeOpen, setIsOutcomeOpen] = useState<boolean>(false);
  const [outcomeSummaryData, setOutcomeSummaryData] = useState<ScenarioOutcomeSummary | null>(null);

  // Active Calculated Route
  const [activeRoute, setActiveRoute] = useState<RouteResponse | null>(null);

  // Context Selection States (for inspection)
  const [selectedRoad, setSelectedRoad] = useState<any | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedSOS, setSelectedSOS] = useState<SOSIncident | null>(null);
  const [selectedPump, setSelectedPump] = useState<MunicipalPump | null>(null);

  // System Telemetry & WebSocket Health
  const [wsStatus, setWsStatus] = useState<"CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR">("CONNECTING");
  const [lastTelemetryTimestamp, setLastTelemetryTimestamp] = useState<string>(() =>
    new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
  );

  // Operator Action Feedback & Double Action Protection
  const [feedbackToasts, setFeedbackToasts] = useState<FeedbackToastMessage[]>([]);
  const [isSubmittingScenarioAction, setIsSubmittingScenarioAction] = useState<boolean>(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    resource: string;
    effect: string;
    variant: "danger" | "warning" | "primary";
    action: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: "",
    resource: "",
    effect: "",
    variant: "warning",
    action: () => {},
  });

  const showToast = (title: string, details: string, severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL" = "INFO") => {
    const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
    const newToast: FeedbackToastMessage = {
      id,
      title,
      details,
      severity,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
    };
    setFeedbackToasts((prev) => [...prev.slice(-3), newToast]);
    setTimeout(() => {
      setFeedbackToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  // 1. Initial Data Fetch
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [
          nowcastRes,
          roadsRes,
          drainageRes,
          rainRes,
          sosRes,
          facRes,
          pumpRes,
          reliefRes,
          damageRes,
          alertRes,
          stageRes,
        ] = await Promise.all([
          api.getNowcast(),
          api.getRoads(),
          api.getDrainage(),
          api.getRainfall(),
          api.getSOS(),
          api.getFacilities(),
          api.getPumps(),
          api.getReliefCamps(),
          api.getDamageReports(),
          api.getAlerts(),
          api.getScenarioStage(),
        ]);

        setNowcastSeries(nowcastRes);
        setRoads(roadsRes.roads || []);
        setDrainageData(drainageRes);
        setRainfallData(rainRes);
        setSOSList(sosRes);
        setFacilities(facRes);
        setPumps(pumpRes);
        setReliefCamps(reliefRes);
        setDamageReports(damageRes);
        setAlerts(alertRes);
        setScenarioStage(stageRes);
        setDataMode(nowcastRes.provenance.data_mode);
      } catch (err) {
        console.warn("Initial data load partial notice:", err);
      }
    }
    loadInitialData();
  }, []);

  // 2. Timeline Auto-Player
  useEffect(() => {
    if (!isTimelinePlaying || !nowcastSeries) return;
    const interval = setInterval(() => {
      setSelectedStepIndex((prev) => {
        if (prev < nowcastSeries.time_steps.length - 1) return prev + 1;
        setIsTimelinePlaying(false);
        return 0;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [isTimelinePlaying, nowcastSeries]);

  // 3. Real-time WebSocket Telemetry & Scenario Event Stream
  useEffect(() => {
    const ws = createTelemetryWebSocket(
      (msg) => {
        setLastTelemetryTimestamp(
          new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
        );
        if (!msg || !msg.type) return;
        const scenarioEvents = [
          "INITIAL_TELEMETRY",
          "SCENARIO_STARTED",
          "STAGE_TICK",
          "SCENARIO_RESET",
          "RAINFALL_UPDATED",
          "NOWCAST_UPDATED",
          "HOTSPOT_DETECTED",
          "ROAD_HAZARD_DETECTED",
          "ROUTE_UPDATED",
          "SOS_CREATED",
          "RESCUE_DISPATCHED",
          "PUMP_DISPATCHED",
          "ALERT_ISSUED",
          "RECOVERY_STARTED",
          "SCENARIO_COMPLETED",
        ];
        if (scenarioEvents.includes(msg.type)) {
          if (msg.stage) {
            setScenarioStage(msg.stage);
            if (msg.stage.stage >= 15 && msg.type === "SCENARIO_COMPLETED") {
              api.getScenarioSummary().then((sum) => {
                setOutcomeSummaryData(sum);
                setIsOutcomeOpen(true);
                showToast("SCENARIO COMPLETED", "All 15 operational response phases executed.", "INFO");
              }).catch(() => {});
            }
          } else {
            api.getScenarioStage().then((st) => setScenarioStage(st)).catch(() => {});
          }
          // Refresh live operational entities
          Promise.all([
            api.getRoads(),
            api.getSOS(),
            api.getPumps(),
            api.getAlerts(),
          ]).then(([roadsRes, sosRes, pumpsRes, alertsRes]) => {
            setRoads(roadsRes.roads || []);
            setSOSList(sosRes);
            setPumps(pumpsRes);
            setAlerts(alertsRes);
          }).catch(() => {});
        }
      },
      (status) => {
        setWsStatus(status);
        if (status === "CONNECTED") {
          // Authoritative resync without clearing valuable user views
          Promise.all([
            api.getRoads(),
            api.getSOS(),
            api.getPumps(),
            api.getAlerts(),
            api.getScenarioStage(),
          ]).then(([roadsRes, sosRes, pumpsRes, alertsRes, stageRes]) => {
            setRoads(roadsRes.roads || []);
            setSOSList(sosRes);
            setPumps(pumpsRes);
            setAlerts(alertsRes);
            setScenarioStage(stageRes);
          }).catch(() => {});
        }
      }
    );

    return () => {
      ws.close();
    };
  }, []);

  // 4. Scenario Start/Step/Reset/Auto & Modal handlers
  const handleStartScenario = async () => {
    if (isSubmittingScenarioAction) return;
    setIsSubmittingScenarioAction(true);
    try {
      setActiveModule("map");
      const st = await api.startScenario();
      setScenarioStage(st);
      const [nowcastRes, roadsRes, sosRes, pumpsRes, alertRes] = await Promise.all([
        api.getNowcast(true),
        api.getRoads(),
        api.getSOS(),
        api.getPumps(),
        api.getAlerts(),
      ]);
      setNowcastSeries(nowcastRes);
      setRoads(roadsRes.roads || []);
      setSOSList(sosRes);
      setPumps(pumpsRes);
      setAlerts(alertRes);
      showToast("SCENARIO STARTED", "Patna Basin Extreme Rainfall simulation initiated.", "INFO");
    } catch (err) {
      console.error("Start scenario failed:", err);
      showToast("SCENARIO FAILED", "Backend could not start emergency scenario.", "ERROR");
    } finally {
      setIsSubmittingScenarioAction(false);
    }
  };

  const handleStepScenario = async () => {
    if (isSubmittingScenarioAction) return;
    setIsSubmittingScenarioAction(true);
    try {
      const st = await api.stepScenario();
      setScenarioStage(st);
      setIsSubmittingScenarioAction(false);
      if (st.stage >= 15) {
        api.getScenarioSummary().then((sum) => {
          setOutcomeSummaryData(sum);
          setIsOutcomeOpen(true);
        }).catch(() => {});
      }
      Promise.all([
        api.getNowcast(false),
        api.getRoads(),
        api.getSOS(),
        api.getPumps(),
        api.getAlerts(),
      ]).then(([nowcastRes, roadsRes, sosRes, pumpsRes, alertRes]) => {
        setNowcastSeries(nowcastRes);
        setRoads(roadsRes.roads || []);
        setSOSList(sosRes);
        setPumps(pumpsRes);
        setAlerts(alertRes);
      }).catch(() => {});
    } catch (err) {
      console.error("Step scenario failed:", err);
      setIsSubmittingScenarioAction(false);
    }
  };

  const executeResetScenario = async () => {
    if (isSubmittingScenarioAction) return;
    setIsSubmittingScenarioAction(true);
    try {
      const st = await api.resetScenario();
      setScenarioStage(st);
      setSelectedStepIndex(0);
      setIsOutcomeOpen(false);
      const [nowcastRes, roadsRes, sosRes, pumpsRes, alertRes] = await Promise.all([
        api.getNowcast(true),
        api.getRoads(),
        api.getSOS(),
        api.getPumps(),
        api.getAlerts(),
      ]);
      setNowcastSeries(nowcastRes);
      setRoads(roadsRes.roads || []);
      setSOSList(sosRes);
      setPumps(pumpsRes);
      setAlerts(alertRes);
      showToast("SCENARIO RESET", "Baseline state restored (Stage 1/15) - System Normal.", "INFO");
    } catch (err) {
      console.error("Reset scenario failed:", err);
      showToast("RESET FAILED", "Simulation reset encountered a backend error.", "ERROR");
    } finally {
      setIsSubmittingScenarioAction(false);
    }
  };

  const handleRequestResetScenario = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "RESET DEMO SCENARIO",
      resource: "Patna Urban Basin Emergency Simulation",
      effect: "Restores baseline telemetry (Stage 1/15), clears active SOS beacons, resets pumps to standby, and clears emergency detours.",
      variant: "warning",
      action: executeResetScenario,
    });
  };

  const handleToggleScenarioAuto = async () => {
    if (isSubmittingScenarioAction) return;
    setIsSubmittingScenarioAction(true);
    try {
      const st = await api.toggleScenarioAuto();
      setScenarioStage(st);
    } catch (err) {
      console.error("Toggle scenario auto failed:", err);
    } finally {
      setIsSubmittingScenarioAction(false);
    }
  };

  const handleOpenSituationBoard = async () => {
    try {
      const sit = await api.getSituationBoard();
      setSituationBoardData(sit);
      setIsSituationBoardOpen(true);
    } catch (err) {
      console.error("Failed to load situation board:", err);
    }
  };

  const handleOpenSummary = async () => {
    try {
      const sum = await api.getScenarioSummary();
      setOutcomeSummaryData(sum);
      setIsOutcomeOpen(true);
    } catch (err) {
      console.error("Failed to load scenario summary:", err);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === "CITIZEN") {
      setActiveModule("citizen_portal");
    } else if (activeModule === "citizen_portal") {
      setActiveModule("overview");
    }
  };

  const currentStep = nowcastSeries?.time_steps[selectedStepIndex] || null;

  // Clear context helper
  const handleClearContext = () => {
    setSelectedRoad(null);
    setSelectedNode(null);
    setSelectedSOS(null);
    setSelectedPump(null);
  };

  // Is Main Command Center map view active?
  const isCommandCenter = activeModule === "map";

  // Handle causality ribbon click in 3D mode — highlight corresponding layer
  const handleCausalityHighlight = (moduleKey: ModuleKey) => {
    if (viewMode === "3D") {
      // Map module key to highlight layer
      const layerMap: Record<string, string> = {
        drainage: "SURCHARGE",
        routing: "ROUTING",
        map: "DEPTH",
        nowcast: "DEPTH",
        rainfall: "DEPTH",
      };
      setHighlightLayer(layerMap[moduleKey] || null);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightLayer(null), 3000);
    } else {
      setActiveModule(moduleKey);
    }
  };

  if (isDevPrimitives) {
    return (
      <DevPrimitivesPage
        onBackToApp={() => {
          window.location.hash = "";
          setIsDevPrimitives(false);
        }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--bg-environment)" }}>
      {/* 1. TOP: Serious Municipal Operations Header */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        dataMode={dataMode}
        lastUpdated={lastTelemetryTimestamp}
        currentStep={currentStep}
        alertsCount={alerts.length}
        wsStatus={wsStatus}
      />

      {/* Disconnection / Reconnect Banner */}
      {wsStatus !== "CONNECTED" && (
        <div
          style={{
            margin: "4px 12px 0 12px",
            padding: "6px 14px",
            borderRadius: "var(--r-sm)",
            background: "rgba(220, 38, 38, 0.12)",
            border: "1px solid rgba(220, 38, 38, 0.35)",
            color: "var(--color-critical-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            fontWeight: 600,
            zIndex: 999,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#dc2626",
              }}
            />
            <span>LIVE FEED DISCONNECTED — VARUNETRA is attempting to reconnect… Authoritative telemetry cached.</span>
          </div>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", opacity: 0.85 }}>
            LAST UPDATE: {lastTelemetryTimestamp}
          </div>
        </div>
      )}

      {/* 2. MAIN APP WORKSPACE */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* LEFT: Slim Vertical Operations Rail */}
        {!isPresentationMode && (
          <Sidebar
            activeModule={activeModule}
            onSelectModule={setActiveModule}
            currentRole={currentRole}
            activeSOSCount={sosList.filter((s) => s.status !== "CLOSED" && (s.status as string) !== "RESOLVED").length}
            viewMode={viewMode}
            onSelect3DCity={() => {
              setViewMode("3D");
              setActiveModule("map");
            }}
            onOpenSettings={() => setSettingsModalOpen(true)}
          />
        )}

        {/* CENTER / MAIN CONTENT WORKSPACE */}
        <main style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", background: "transparent" }}>
          {/* MAP-FIRST COMMAND CENTER (Default for Overview & Flood Map) */}
          {isCommandCenter ? (
            <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden" }}>
              {/* CENTER: Large Operational GIS / 3D City Map */}
              <div
                style={{
                  flex: 1,
                  position: "relative",
                  height: "calc(100% - 16px)",
                  margin: "8px 12px 8px 12px",
                  borderRadius: "var(--r-lg)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-2)",
                  border: "var(--glass-border)",
                }}
              >
                {/* ─── 2D / 3D View Mode Segmented Control ─── */}
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 900,
                  }}
                >
                  <SegmentedControl
                    value={viewMode}
                    onChange={(val) => setViewMode(val as ViewMode)}
                    options={[
                      { value: "2D", label: "2D OPERATIONS", icon: <MapIcon size={13} strokeWidth={1.75} /> },
                      { value: "3D", label: "3D CITY", icon: <Globe size={13} strokeWidth={1.75} /> },
                    ]}
                  />
                </div>

                {/* Large GIS Map / 3D City View */}
                <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                  {viewMode === "2D" ? (
                    <>
                      <GISMap
                        timeStep={currentStep}
                        roads={
                          currentStep?.affected_roads?.length
                            ? currentStep.affected_roads.map((r, i) => ({ ...roads[i], ...r }))
                            : roads
                        }
                        drainageData={drainageData}
                        sosList={sosList}
                        facilities={facilities}
                        pumps={pumps}
                        activeRoute={activeRoute}
                        onSelectRoad={(road) => {
                          handleClearContext();
                          setSelectedRoad(road);
                        }}
                        onSelectNode={(node) => {
                          handleClearContext();
                          setSelectedNode(node);
                        }}
                        onSelectSOS={(sos) => {
                          handleClearContext();
                          setSelectedSOS(sos);
                        }}
                        onSelectPump={(pump) => {
                          handleClearContext();
                          setSelectedPump(pump);
                        }}
                      />

                      {/* Top Floating Physical Causality Flow (2D) */}
                      <div
                        style={{
                          position: "absolute",
                          top: "44px",
                          left: "40px",
                          right: "220px",
                          zIndex: 800,
                          maxWidth: "920px",
                        }}
                      >
                        <CausalityPipelineRibbon
                          currentStep={currentStep}
                          onNavigateToModule={setActiveModule}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <CesiumCityView
                        timeStep={currentStep}
                        roads={
                          currentStep?.affected_roads?.length
                            ? currentStep.affected_roads.map((r, i) => ({ ...roads[i], ...r }))
                            : roads
                        }
                        drainageData={drainageData}
                        sosList={sosList}
                        facilities={facilities}
                        pumps={pumps}
                        activeRoute={activeRoute}
                        onSelectRoad={(road) => {
                          handleClearContext();
                          setSelectedRoad(road);
                        }}
                        onSelectNode={(node) => {
                          handleClearContext();
                          setSelectedNode(node);
                        }}
                        onSelectSOS={(sos) => {
                          handleClearContext();
                          setSelectedSOS(sos);
                        }}
                        onSelectPump={(pump) => {
                          handleClearContext();
                          setSelectedPump(pump);
                        }}
                        highlightLayer={highlightLayer}
                      />

                      {/* Causality Ribbon for 3D mode — overlaid on the 3D scene */}
                      <div
                        style={{
                          position: "absolute",
                          top: "44px",
                          left: "40px",
                          right: "280px",
                          zIndex: 200,
                          maxWidth: "860px",
                        }}
                      >
                        <CausalityPipelineRibbon
                          currentStep={currentStep}
                          onNavigateToModule={handleCausalityHighlight}
                        />
                      </div>
                    </>
                  )}

                  {/* Bottom Floating Nowcast Scrubber (shared for both views) */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "230px",
                      right: "20px",
                      zIndex: 800,
                      maxWidth: "760px",
                    }}
                  >
                    <TimelineSlider
                      timeSteps={nowcastSeries?.time_steps || []}
                      currentIndex={selectedStepIndex}
                      onSelectIndex={setSelectedStepIndex}
                      isPlaying={isTimelinePlaying}
                      onTogglePlay={() => setIsTimelinePlaying(!isTimelinePlaying)}
                    />
                  </div>
                </div>

                {/* Bottom Docked 15-Stage Demo Scenario Bar (shared) */}
                <ScenarioBar
                  stage={scenarioStage}
                  onStart={handleStartScenario}
                  onStep={handleStepScenario}
                  onReset={handleRequestResetScenario}
                  onToggleAuto={handleToggleScenarioAuto}
                  onSelectStage={(num) => console.log("Select stage", num)}
                  onOpenSituationBoard={handleOpenSituationBoard}
                  onOpenSummary={handleOpenSummary}
                  isPresentationMode={isPresentationMode}
                  onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
                  isSubmitting={isSubmittingScenarioAction}
                />
              </div>

              {/* RIGHT: Operations Intelligence & Incident Panel (28% - 32%) */}
              <div style={{ display: "flex", flexShrink: 0, height: "100%" }}>
                <IntelligencePanel
                  currentStep={currentStep}
                  roads={roads}
                  sosList={sosList}
                  facilities={facilities}
                  pumps={pumps}
                  alerts={alerts}
                  selectedRoad={selectedRoad}
                  selectedNode={selectedNode}
                  selectedSOS={selectedSOS}
                  selectedPump={selectedPump}
                  onSelectRoad={(road) => {
                    handleClearContext();
                    setSelectedRoad(road);
                  }}
                  onSelectSOS={(sos) => {
                    handleClearContext();
                    setSelectedSOS(sos);
                  }}
                  onSelectPump={(pump) => {
                    handleClearContext();
                    setSelectedPump(pump);
                  }}
                  onRouteAroundHazard={() => setActiveModule("routing")}
                  onAssignSOS={(id) => {
                    api.updateSOS(id, "ASSIGNED", "TEAM-01").then((updated) => {
                      setSOSList((prev) => prev.map((s) => (s.id === id ? updated : s)));
                      setSelectedSOS(updated);
                    });
                  }}
                  onActivatePump={(id) => {
                    api.actionPump(id, "ACTIVATE", "CAT-02").then((updated) => {
                      setPumps((prev) => prev.map((p) => (p.id === id ? updated : p)));
                      setSelectedPump(updated);
                    });
                  }}
                  onCloseContext={handleClearContext}
                />
              </div>
            </div>
          ) : (
            /* SPECIALIZED MODULE VIEWS */
            <div style={{ flex: 1, height: "100%", overflowY: "auto", background: "transparent", padding: "8px 12px 8px 12px" }}>
              {activeModule === "overview" && (
                <OverviewModule
                  currentStep={currentStep}
                  sosList={sosList}
                  alerts={alerts}
                  pumps={pumps}
                  facilities={facilities}
                  onNavigateToModule={(mod) => {
                    if (mod === "3d_city") {
                      setViewMode("3D");
                      setActiveModule("map");
                    } else {
                      setActiveModule(mod);
                    }
                  }}
                />
              )}

              {activeModule === "nowcast" && (
                <NowcastModule
                  nowcast={nowcastSeries}
                  selectedStepIndex={selectedStepIndex}
                  onSelectStepIndex={setSelectedStepIndex}
                />
              )}

              {activeModule === "routing" && (
                <RoutingModule
                  onRouteCalculated={(rt) => {
                    setActiveRoute(rt);
                    showToast("DYNAMIC ROUTE SOLVED", `Safe route generated: ${rt.distance_km} km • ETA: ${rt.eta_minutes} min`, "INFO");
                  }}
                  onNavigateToMap={() => setActiveModule("map")}
                />
              )}

              {activeModule === "sos" && (
                <CitizenSOSModule
                  sosList={sosList}
                  onSOSCreated={(newSOS) => {
                    setSOSList((prev) => [newSOS, ...prev]);
                    showToast("SOS BEACON BROADCAST", `Incident logged: ${newSOS.number_of_people} reported trapped.`, "INFO");
                  }}
                  onUpdateStatus={(id, status) => {
                    api.updateSOS(id, status).then((updated) => {
                      setSOSList((prev) => prev.map((s) => (s.id === id ? updated : s)));
                      showToast("SOS STATUS ADVANCED", `Incident ${id} updated to ${status}.`, "INFO");
                    });
                  }}
                />
              )}

              {activeModule === "shelters" && (
                <SheltersModule
                  facilities={facilities}
                  onSelectFacility={(fac) => {
                    setActiveModule("map");
                  }}
                />
              )}

              {activeModule === "pumps" && (
                <PumpsModule
                  pumps={pumps}
                  onPumpUpdated={(updated) => {
                    setPumps((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                    showToast("PUMP FLEET UPDATED", `${updated.name} (${updated.id}) is now ${updated.status}.`, "INFO");
                  }}
                />
              )}

              {activeModule === "rainfall" && (
                <RainfallModule rainfallData={rainfallData} />
              )}

              {activeModule === "drainage" && (
                <DrainageModule
                  drainageData={drainageData}
                  onSelectNode={(node) => {
                    setSelectedNode(node);
                    setActiveModule("map");
                  }}
                  onNavigateToMap={() => setActiveModule("map")}
                />
              )}

              {activeModule === "terrain" && (
                <TerrainModule
                  onNavigateToMap={() => setActiveModule("map")}
                />
              )}

              {activeModule === "relief" && (
                <ReliefModule reliefCamps={reliefCamps} />
              )}

              {activeModule === "damage" && (
                <DamageModule
                  damageReports={damageReports}
                  onReportCreated={(rep) => setDamageReports((prev) => [rep, ...prev])}
                />
              )}

              {activeModule === "ml" && (
                <MLCenterModule />
              )}

              {activeModule === "citizen_portal" && (
                <CitizenPortalModule
                  onNavigate={setActiveModule}
                />
              )}

              {activeModule === "reports" && (
                <ReportsModule
                  currentStep={currentStep}
                  onNavigateToModule={setActiveModule}
                />
              )}

              {/* Bottom Docked Scenario Bar for Specialized Views */}
              <div style={{ marginTop: "12px" }}>
                <ScenarioBar
                  stage={scenarioStage}
                  onStart={handleStartScenario}
                  onStep={handleStepScenario}
                  onReset={handleRequestResetScenario}
                  onToggleAuto={handleToggleScenarioAuto}
                  onSelectStage={(num) => console.log("Select stage", num)}
                  onOpenSituationBoard={handleOpenSituationBoard}
                  onOpenSummary={handleOpenSummary}
                  isPresentationMode={isPresentationMode}
                  onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
                  isSubmitting={isSubmittingScenarioAction}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Unified Operational Situation Board Modal */}
      <SituationBoardModal
        isOpen={isSituationBoardOpen}
        onClose={() => setIsSituationBoardOpen(false)}
        situation={situationBoardData}
        timeline={scenarioStage?.timeline_events || []}
      />

      {/* Scenario Outcome Summary Modal (Deterministic Debrief) */}
      <ScenarioOutcomeModal
        isOpen={isOutcomeOpen}
        onClose={() => setIsOutcomeOpen(false)}
        summary={outcomeSummaryData}
        onReset={handleRequestResetScenario}
      />

      {/* Settings & System Provenance Modal (Accessible from Rail & Header) */}
      <ProviderStatusModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      {/* Action Confirmation Modal for Global Destructive Operations */}
      <ActionConfirmationModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmModalConfig.action}
        actionTitle={confirmModalConfig.title}
        resourceName={confirmModalConfig.resource}
        expectedEffect={confirmModalConfig.effect}
        variant={confirmModalConfig.variant}
        confirmButtonText="Execute Reset"
      />

      {/* Floating Action Feedback Toasts */}
      <ActionFeedbackToast
        toasts={feedbackToasts}
        onDismiss={(id) => setFeedbackToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
};

export default App;
