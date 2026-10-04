import {
  NowcastSeriesResponse,
  RouteRequest,
  RouteResponse,
  SOSIncident,
  IncidentReport,
  RescueTeam,
  ShelterHospital,
  MunicipalPump,
  ReliefCamp,
  DamageReport,
  Alert,
  MLModelStatus,
  MLPredictionDetail,
  ScenarioStage,
  SituationBoard,
  ScenarioOutcomeSummary,
  ScenarioTimelineEvent,
  VehicleType,
  RoutingProfile,
  RiskLevel,
  SOSStatus,
  ProviderStatusSummary,
  CausalityChainResponse,
  PassabilityPolicy,
  TerrainEngineStatus,
  DEMMetadata,
  TerrainPointInspection,
  TerrainLayerCollection,
  TerrainValidationReport,
} from "../types";

/**
 * Resolves the backend API base URL:
 * 1. Checks VITE_API_BASE_URL environment variable if provided.
 * 2. In browser environments:
 *    - On localhost:5173 (Vite dev server), falls back to http://localhost:8000/api
 *    - In production behind a reverse proxy (frontend at /), falls back to relative /api
 * 3. Defaults to http://localhost:8000/api
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location) {
    const { hostname, port, origin } = window.location;
    if (hostname === "localhost" && port === "5173") {
      return "http://localhost:8000/api";
    }
    // Production reverse-proxy deployment (frontend at /, backend at /api)
    return `${origin}/api`;
  }
  return "http://localhost:8000/api";
};

/**
 * Resolves the backend WebSocket telemetry URL:
 * 1. Checks VITE_WS_URL environment variable if provided.
 * 2. In browser environments:
 *    - On localhost:5173, falls back to ws://localhost:8000/api/ws
 *    - In production, uses wss: (if https) or ws: (if http) under current host
 */
export const getWsUrl = (): string => {
  const envWs = import.meta.env?.VITE_WS_URL;
  if (envWs && typeof envWs === "string" && envWs.trim().length > 0) {
    return envWs;
  }
  if (typeof window !== "undefined" && window.location) {
    const { hostname, port, host, protocol } = window.location;
    if (hostname === "localhost" && port === "5173") {
      return "ws://localhost:8000/api/ws";
    }
    const wsProto = protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${host}/api/ws`;
  }
  return "ws://localhost:8000/api/ws";
};

export const API_BASE = getApiBaseUrl();

// --- Authentication Token State ---
let authToken: string | null = (typeof localStorage !== "undefined" ? localStorage.getItem("varunetra_auth_token") : null);

export const getAuthToken = (): string | null => authToken;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof localStorage !== "undefined") {
    if (token) {
      localStorage.setItem("varunetra_auth_token", token);
    } else {
      localStorage.removeItem("varunetra_auth_token");
    }
  }
};

export const clearAuthToken = () => setAuthToken(null);

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint}`;
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> || {}),
    };
    if (authToken && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`Request to ${url} failed, using degraded fallback.`, err);
    throw err;
  }
}

/**
 * Resilient WebSocket connection manager:
 * - Exponential backoff auto-reconnect (1s, 2s, 4s, max 10s)
 * - Periodic heartbeat ping every 25s
 * - Clean disconnect and error logging
 */
export function createTelemetryWebSocket(
  onMessage: (data: any) => void,
  onStatusChange?: (status: "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR") => void
): { close: () => void; send: (data: any) => void } {
  let ws: WebSocket | null = null;
  let heartbeatInterval: any = null;
  let reconnectTimeout: any = null;
  let reconnectAttempts = 0;
  let isClosedManually = false;

  const connect = () => {
    if (isClosedManually) return;
    const url = getWsUrl();
    onStatusChange?.("CONNECTING");

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        reconnectAttempts = 0;
        onStatusChange?.("CONNECTED");
        // Start 25s heartbeat ping
        heartbeatInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onMessage(parsed);
        } catch {
          // Non-JSON or pong message
        }
      };

      ws.onclose = () => {
        clearInterval(heartbeatInterval);
        onStatusChange?.("DISCONNECTED");
        if (!isClosedManually) {
          const delay = Math.min(10000, 1000 * Math.pow(2, reconnectAttempts));
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connect, delay);
        }
      };

      ws.onerror = (err) => {
        console.warn("VARUNETRA WebSocket error:", err);
        onStatusChange?.("ERROR");
        ws?.close();
      };
    } catch (err) {
      console.warn("Failed to create WebSocket:", err);
      onStatusChange?.("ERROR");
      if (!isClosedManually) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }
  };

  connect();

  return {
    close: () => {
      isClosedManually = true;
      clearInterval(heartbeatInterval);
      clearTimeout(reconnectTimeout);
      ws?.close();
    },
    send: (data: any) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(typeof data === "string" ? data : JSON.stringify(data));
      }
    },
  };
}

export const api = {
  // Authentication & Session
  login: (username: string, password: string) => request<any>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  }),
  demoLogin: (role: string) => request<any>("/auth/demo-login", {
    method: "POST",
    body: JSON.stringify({ role }),
  }),
  getMe: () => request<any>("/auth/me"),

  // Health
  getHealth: () => request<any>("/health"),
  getHealthLive: () => request<any>("/health/live"),
  getHealthReady: () => request<any>("/health/ready"),
  getStatus: () => request<any>("/status"),
  getNowcast: (forceRefresh = false) => request<NowcastSeriesResponse>(`/nowcast?force_refresh=${forceRefresh}`),
  getRainfall: () => request<any>("/rainfall"),
  getDrainage: () => request<any>("/drainage"),
  getRoads: () => request<{ provenance: any; roads: any[] }>("/roads"),

  // Routing
  getRoute: (req: RouteRequest) => request<RouteResponse>("/route", {
    method: "POST",
    body: JSON.stringify(req),
  }),

  // SOS Operations
  getSOS: () => request<SOSIncident[]>("/sos"),
  createSOS: (data: {
    lat: number;
    lng: number;
    number_of_people: number;
    emergency_type: string;
    severity: RiskLevel;
    contact_phone: string;
    address_hint?: string;
    notes?: string;
  }) => request<SOSIncident>("/sos", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateSOS: (id: string, status: SOSStatus, teamId?: string) => request<SOSIncident>(`/sos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, team_id: teamId }),
  }),

  // Field Incidents
  getIncidents: () => request<IncidentReport[]>("/incidents"),
  createIncident: (data: {
    category: string;
    severity: RiskLevel;
    lat: number;
    lng: number;
    notes: string;
    location_name?: string;
    reported_by_role?: string;
  }) => request<IncidentReport>("/incidents", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  // Response Units & Facilities
  getRescueTeams: () => request<RescueTeam[]>("/rescue-teams"),
  getFacilities: () => request<ShelterHospital[]>("/facilities"),
  getPumps: () => request<MunicipalPump[]>("/pumps"),
  actionPump: (id: string, action: string, zoneId?: string) => request<MunicipalPump>(`/pumps/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action, zone_id: zoneId }),
  }),
  getReliefCamps: () => request<ReliefCamp[]>("/relief"),
  getDamageReports: () => request<DamageReport[]>("/damage"),
  getAlerts: () => request<Alert[]>("/alerts"),

  // ML Intelligence
  getMLStatus: () => request<MLModelStatus>("/ml/status"),
  getFeatureImportance: () => request<{ model_version: string; features: any[] }>("/ml/feature-importance"),
  explainMLPrediction: (zoneId: string, zoneName: string, featureValues?: number[]) =>
    request<MLPredictionDetail>("/ml/explain", {
      method: "POST",
      body: JSON.stringify({ zone_id: zoneId, zone_name: zoneName, feature_values: featureValues }),
    }),

  // Providers & Provenance
  getProvidersStatus: () => request<ProviderStatusSummary>("/providers/status"),
  getCausalityChain: () => request<CausalityChainResponse>("/causality-chain"),

  // Passability Policy
  getPassabilityPolicy: () => request<PassabilityPolicy>("/settings/passability"),
  updatePassabilityPolicy: (policy: Partial<PassabilityPolicy>) =>
    request<PassabilityPolicy>("/settings/passability", {
      method: "POST",
      body: JSON.stringify(policy),
    }),

  // End-to-End Operational Demo Scenario Simulator
  startScenario: () => request<ScenarioStage>("/demo/scenario/start", { method: "POST" }),
  getScenarioStage: () => request<ScenarioStage>("/demo/scenario/status"),
  getScenarioStatus: () => request<ScenarioStage>("/demo/scenario/status"),
  setScenarioStage: (stage: number) => request<ScenarioStage>("/demo/stage", {
    method: "POST",
    body: JSON.stringify({ stage }),
  }),
  stepScenario: () => request<ScenarioStage>("/demo/scenario/step", { method: "POST" }),
  resetScenario: () => request<ScenarioStage>("/demo/scenario/reset", { method: "POST" }),
  toggleScenarioAuto: () => request<ScenarioStage>("/demo/scenario/toggle-auto", { method: "POST" }),
  getSituationBoard: () => request<SituationBoard>("/demo/scenario/situation-board"),
  getScenarioSummary: () => request<ScenarioOutcomeSummary>("/demo/scenario/summary"),
  getScenarioTimeline: () => request<ScenarioTimelineEvent[]>("/demo/scenario/timeline"),

  // Urban Terrain Intelligence Engine
  getTerrainStatus: () => request<TerrainEngineStatus>("/terrain/status"),
  getTerrainMetadata: () => request<DEMMetadata>("/terrain/metadata"),
  getTerrainElevation: (lat: number, lon: number) => request<{
    lat: number;
    lon: number;
    ground_elevation_m: number;
    source: string;
    provenance: string;
    resolution_m: number;
    vertical_accuracy: string;
  }>(`/terrain/elevation?lat=${lat}&lon=${lon}`),
  getTerrainDerived: (lat: number, lon: number) => request<any>(`/terrain/derived?lat=${lat}&lon=${lon}`),
  getTerrainInspection: (lat: number, lon: number) => request<TerrainPointInspection>(`/terrain/inspector?lat=${lat}&lon=${lon}`),
  getTerrainLayers: () => request<TerrainLayerCollection>("/terrain/layers"),
  getTerrainValidation: () => request<TerrainValidationReport>("/terrain/validation"),
  setTerrainProvider: (provider_key: string) => request<TerrainEngineStatus>("/terrain/import", {
    method: "POST",
    body: JSON.stringify({ provider_key }),
  }),
};
