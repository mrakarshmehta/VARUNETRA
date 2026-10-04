"""
VARUNETRA Production Backend Runner
Problem Statement SIH26085: Urban Flood Nowcasting System (Drainage and Rainfall Coupling)
Ministry of Earth Sciences (MoES)
"""

import os
import sys

# Ensure backend root and project root are in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
for p in [CURRENT_DIR, PROJECT_ROOT]:
    if p not in sys.path:
        sys.path.insert(0, p)

import uvicorn
from app.core.config import settings

def main():
    host = os.getenv("HOST", settings.HOST)
    port = int(os.getenv("PORT", settings.PORT))
    workers = int(os.getenv("WORKERS", settings.WORKERS))
    log_level = os.getenv("LOG_LEVEL", settings.LOG_LEVEL).lower()

    print(f"==================================================")
    print(f"🚀 Starting {settings.PROJECT_NAME} Production Server ({settings.PROBLEM_STATEMENT_ID})")
    print(f"📡 Binding: http://{host}:{port} (Workers: {workers})")
    print(f"🗺️  Pilot Basin: {settings.PILOT_CITY}")
    print(f"🛰️  Terrain Source: ESA Copernicus GLO-30 DSM (30m)")
    print(f"==================================================")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        workers=workers if workers > 1 else 1,
        log_level=log_level,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )

if __name__ == "__main__":
    main()
