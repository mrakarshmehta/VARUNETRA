"""
VARUNETRA FastAPI Main Application
Problem Statement SIH26085: Urban Flood Nowcasting System (Drainage and Rainfall Coupling)
Ministry of Earth Sciences (MoES)
"""

import os
import sys

# Ensure project root is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
for p in [PROJECT_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

import asyncio
import json
from datetime import datetime, timezone
from typing import List, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Response, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings, DataProvenance
from app.api.endpoints import router as api_router, terrain_router
from app.services.scenario_service import scenario_runner
from app.services.operations_service import ops_manager

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Integrated Urban Flood Intelligence & Emergency Operations Platform (SIH26085)",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Strict Production CORS Policy
allowed_origins = [str(o).strip() for o in settings.BACKEND_CORS_ORIGINS if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

# Mount REST API (/api and direct /terrain)
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(terrain_router, prefix="/terrain")


# --- Production Health & Readiness Endpoints ---
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    """
    General operational health check.
    Reports API readiness, WebSocket pool, and Copernicus GLO-30 DSM terrain engine.
    """
    from app.services.terrain_engine import urban_terrain_engine
    terrain_status = urban_terrain_engine.get_status()
    ready, _ = urban_terrain_engine.is_ready()

    return {
        "status": "HEALTHY" if ready else "DEGRADED",
        "service": settings.PROJECT_NAME,
        "problem_id": settings.PROBLEM_STATEMENT_ID,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data_mode": settings.DATA_MODE.value,
        "pilot_city": settings.PILOT_CITY,
        "checks": {
            "api": "OPERATIONAL",
            "websocket_pool": "OPERATIONAL",
            "active_ws_clients": len(ws_manager.active_connections),
            "terrain_engine": "OPERATIONAL" if ready else "DEGRADED",
            "active_elevation_provider": terrain_status.get("active_provider"),
            "active_source_name": terrain_status.get("active_source_name"),
            "aoi_coverage_pct": terrain_status.get("aoi_coverage_pct", 0.0),
        },
    }


@app.get("/health/live", tags=["Health"])
def health_live():
    """Liveness probe: verifies process is alive and event loop is responsive."""
    return {
        "status": "ALIVE",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health/ready", tags=["Health"])
def health_ready(response: Response):
    """
    Readiness probe: validates required dependencies before accepting operational traffic.
    Checks:
    - ACID database connectivity
    - Authoritative Copernicus GLO-30 DSM readiness (fail-closed in REAL mode)
    - ML surrogate model status
    - Multi-worker safety (enforces WORKERS=1 for process-local state)
    """
    from app.services.terrain_engine import urban_terrain_engine
    from app.services.ml_service import ml_service
    from app.services.operations_service import ops_manager

    db_health = ops_manager.check_db_health()
    db_ok = (db_health.get("status") == "OPERATIONAL")

    terrain_ready, terrain_msg = urban_terrain_engine.is_ready()
    terrain_status = urban_terrain_engine.get_status()

    ml_status = ml_service.get_status()
    ml_ok = (ml_status is not None)

    workers_ok = (settings.WORKERS == 1)

    is_ready = db_ok and terrain_ready and ml_ok and workers_ok
    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "READY" if is_ready else "NOT_READY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "data_mode": settings.DATA_MODE.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "dependencies": {
            "database": db_health,
            "terrain_engine": {
                "ready": terrain_ready,
                "detail": terrain_msg,
                "active_provider": terrain_status.get("active_provider"),
                "classification": terrain_status.get("dataset_classification"),
                "fail_closed": (settings.DATA_MODE == DataProvenance.REAL),
            },
            "ml_surrogate": {
                "ready": ml_ok,
                "model_version": ml_status.model_version if ml_status else None,
                "is_real_world_calibrated": ml_status.is_real_world_calibrated if ml_status else False,
            },
            "worker_runtime_safety": {
                "workers": settings.WORKERS,
                "supported": workers_ok,
                "notice": "WORKERS=1 required while runtime state and WebSockets are process-local",
            },
        },
    }


# Active WebSockets connection pool
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.active_connections.discard(dead)


ws_manager = ConnectionManager()
scenario_runner.set_broadcaster(ws_manager.broadcast)


@app.websocket("/api/ws")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial state immediately
        stage = scenario_runner.get_current_stage()
        await websocket.send_json({
            "type": "INITIAL_TELEMETRY",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stage": stage,
            "active_sos_count": len([s for s in ops_manager.get_all_sos() if s.status != "CLOSED"]),
            "data_mode": settings.DATA_MODE.value,
        })
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                mtype = msg.get("type")
                if mtype == "PING":
                    await websocket.send_json({
                        "type": "PONG",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                    continue

                action = msg.get("action")
                if action == "START":
                    stage = scenario_runner.start_scenario(actor_id="WS_CLIENT", actor_role="DISASTER_AUTHORITY")
                    await ws_manager.broadcast({"type": "STAGE_TICK", "stage": stage})
                elif action == "STEP":
                    stage = scenario_runner.step_forward(actor_id="WS_CLIENT", actor_role="DISASTER_AUTHORITY")
                    await ws_manager.broadcast({"type": "STAGE_TICK", "stage": stage})
                elif action == "RESET":
                    stage = scenario_runner.reset(actor_id="WS_CLIENT", actor_role="DISASTER_AUTHORITY")
                    await ws_manager.broadcast({"type": "STAGE_TICK", "stage": stage})
                elif action == "TOGGLE_AUTO":
                    stage = scenario_runner.toggle_auto_run()
                    await ws_manager.broadcast({"type": "STAGE_TICK", "stage": stage})
            except json.JSONDecodeError:
                pass
            except Exception:
                pass
    except (WebSocketDisconnect, ConnectionResetError):
        pass
    except Exception:
        pass
    finally:
        ws_manager.disconnect(websocket)


@app.get("/")
def root():
    return {
        "system": "VARUNETRA — Urban Flood Nowcasting & Response Platform",
        "sih_problem_id": settings.PROBLEM_STATEMENT_ID,
        "organization": "Ministry of Earth Sciences (MoES)",
        "api_docs": "/docs",
        "data_mode": settings.DATA_MODE.value,
        "pilot_catchment": settings.PILOT_CITY,
        "provenance_standard": "Explicit: REAL | SIMULATED | SYNTHETIC | DEMO",
        "tagline": "PREDICT -> WARN -> MAP -> ROUTE -> RESCUE -> RESPOND -> RECOVER"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
