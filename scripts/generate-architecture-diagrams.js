/**
 * VARUNETRA Architecture Diagrams Generator
 * Produces 3 high-resolution publication-quality architectural diagrams (2400x1350)
 * Uses Playwright to render styled SVG/HTML layouts into crisp PNGs
 */

const path = require('path');
const fs = require('fs');

let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require(path.resolve(__dirname, '../frontend/node_modules/playwright')).chromium;
}

const OUT_DIR = path.resolve(__dirname, '../docs/architecture');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function generateDiagrams() {
  console.log('🎨 Generating VARUNETRA High-Resolution Architecture Diagrams...\n');

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 2400, height: 1350 } });

  // Common CSS Styles
  const commonStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 2400px;
        height: 1350px;
        background: radial-gradient(circle at 15% 15%, #0f1d32 0%, #060a12 100%);
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #f8fafc;
        padding: 50px 70px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 24px;
        margin-bottom: 36px;
      }
      .badge-tag {
        font-family: 'JetBrains Mono', monospace;
        font-size: 15px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #38bdf8;
        background: rgba(2, 132, 199, 0.18);
        border: 1px solid rgba(56, 189, 248, 0.4);
        padding: 4px 14px;
        border-radius: 999px;
        display: inline-block;
        margin-bottom: 8px;
      }
      .title {
        font-size: 40px;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: #ffffff;
      }
      .subtitle {
        font-size: 18px;
        color: #94a3b8;
        margin-top: 4px;
      }
      .provenance-pill {
        background: rgba(34, 197, 94, 0.15);
        border: 1px solid rgba(34, 197, 94, 0.4);
        color: #4ade80;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 700;
        padding: 6px 14px;
        border-radius: 6px;
      }
      .card {
        background: rgba(18, 28, 48, 0.7);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        padding: 24px 28px;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
      }
      .card-title {
        font-size: 20px;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .card-title .icon-num {
        background: #0284c7;
        color: #fff;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 4px;
      }
      .sub-item {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 10px;
      }
      .sub-item-title {
        font-size: 15px;
        font-weight: 700;
        color: #e2e8f0;
      }
      .sub-item-desc {
        font-size: 13px;
        color: #94a3b8;
        margin-top: 3px;
        line-height: 1.4;
      }
      .arrow {
        color: #38bdf8;
        font-size: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
    </style>
  `;

  // -------------------------------------------------------------
  // DIAGRAM 1: SYSTEM ARCHITECTURE
  // -------------------------------------------------------------
  console.log('▶ Generating 1/3: system-architecture.png...');
  const html1 = `
    <!DOCTYPE html>
    <html>
    <head>${commonStyles}</head>
    <body>
      <div class="header">
        <div>
          <span class="badge-tag">VARUNETRA • SIH26085 ARCHITECTURE BLUEPRINT</span>
          <h1 class="title">System Architecture: Decoupled Multi-Tier Platform</h1>
          <p class="subtitle">Real-time coupled hydrology, tactical impedance routing, and closed-loop municipal operations</p>
        </div>
        <div>
          <span class="provenance-pill">COPERNICUS GLO-30 DSM COUPLED</span>
        </div>
      </div>

      <div style="flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
        
        <!-- TIER 1 -->
        <div class="card" style="border-top: 4px solid #38bdf8;">
          <div class="card-title"><span class="icon-num">T1</span> Ingestion & Physical Matrix</div>
          
          <div class="sub-item">
            <div class="sub-item-title">Copernicus GLO-30 DSM (30m)</div>
            <div class="sub-item-desc">High-fidelity TanDEM-X radar elevation raster with D8 flow direction & sink breaching.</div>
          </div>

          <div class="sub-item">
            <div class="sub-item-title">OSM Road Network Graph</div>
            <div class="sub-item-desc">Topological street graph for Patna Lowland & Rajendra Nagar arterial corridors.</div>
          </div>

          <div class="sub-item">
            <div class="sub-item-title">Drainage Hydraulic Nodes</div>
            <div class="sub-item-desc">14 municipal trunk conduits, Saidpur sump, & Ganga river tailwater boundary.</div>
          </div>

          <div class="sub-item">
            <div class="sub-item-title">Meteorological Forcing</div>
            <div class="sub-item-desc">0–88 mm/h convective cell inputs (OpenAPI standard telemetry ingestion schema).</div>
          </div>
        </div>

        <!-- TIER 2 -->
        <div class="card" style="border-top: 4px solid #0284c7;">
          <div class="card-title"><span class="icon-num">T2</span> Hydrology & Decision Core</div>
          
          <div class="sub-item">
            <div class="sub-item-title">Coupled 1D/2D Nowcast Engine</div>
            <div class="sub-item-desc">Modified Rational runoff + diffusive wave surface spreading at 30-min timesteps.</div>
          </div>

          <div class="sub-item">
            <div class="sub-item-title">ML Fast Surrogate Engine</div>
            <div class="sub-item-desc">Sub-100ms multi-layer neural surrogate for rapid scenario timeline scrubbing.</div>
          </div>

          <div class="sub-item">
            <div class="sub-item-title">Dynamic Dijkstra Pathfinder</div>
            <div class="sub-item-desc">Quadratic water depth penalties with vehicle clearance thresholds (30cm / 50cm).</div>
          </div>

          <div class="sub-item">
            <div class="sub-item-title">RBAC Security Gate</div>
            <div class="sub-item-desc">JWT token validation, 5 role scopes, & fail-closed REAL mode enforcement.</div>
          </div>
        </div>

        <!-- TIER 3 -->
        <div class="card" style="border-top: 4px solid #22c55e;">
          <div class="card-title"><span class="icon-num">T3</span> Operations & Dispatch Core</div>
          
          <div class="sub-item">
            <div class="sub-item-title">Citizen SOS Triage</div>
            <div class="sub-item-desc">Geocoded distress beacon ingestion with automated medical/severity scoring.</div>
          </div>

          <div class="sub-item">
            <div class="sub-item-title">Rescue Fleet Tracking</div>
            <div class="sub-item-desc">Tactical assignment of SDRF/NDRF boats & high-clearance response units.</div>
          </div>

          <div class="sub-item">
            <div class="sub-item-title">Municipal Pump Deployment</div>
            <div class="sub-item-desc">Dynamic allocation of 1800 m³/h mobile diesel dewatering pump fleets.</div>
          </div>

          <div class="sub-item">
            <div class="sub-item-title">ACID Audit Ledger</div>
            <div class="sub-item-desc">Tamper-evident transaction logging for every command order & dispatch action.</div>
          </div>
        </div>

        <!-- TIER 4 -->
        <div class="card" style="border-top: 4px solid #a855f7;">
          <div class="card-title"><span class="icon-num">T4</span> Command Presentation</div>
          
          <div class="sub-item">
            <div class="sub-item-title">2D/3D Dual GIS Cockpit</div>
            <div class="sub-item-desc">High-precision Leaflet & Cesium 3D digital twin rendering with depth contours.</div>
          </div>

          <div class="sub-item">
            <div class="sub-item-title">Physical Causality Flow</div>
            <div class="sub-item-desc">Interactive top pipeline ribbon tracking Rain → Runoff → Drainage → Road.</div>
          </div>

          <div class="sub-item">
            <div class="sub-item-title">Unified Situation Board</div>
            <div class="sub-item-desc">Centralized operational overview displaying hazards, SOS, pumps & health.</div>
          </div>

          <div class="sub-item">
            <div class="sub-item-title">WebSocket Telemetry Bus</div>
            <div class="sub-item-desc">Resilient auto-reconnecting real-time stream with non-destructive state caching.</div>
          </div>
        </div>

      </div>

      <div style="margin-top: 24px; padding: 16px 24px; background: rgba(2, 132, 199, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; color: #94a3b8;"><strong style="color: #fff;">ARCHITECTURAL GUARANTEE:</strong> Multi-worker protection (WORKERS=1 enforced for process-local state) • Fully tested via 81 backend pytest suites • Zero frontend overflow across 1440/1920/1024.</span>
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #38bdf8;">VARUNETRA PRODUCTION FREEZE v1.0.0</span>
      </div>
    </body>
    </html>
  `;
  await page.setContent(html1, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT_DIR, 'system-architecture.png') });

  // -------------------------------------------------------------
  // DIAGRAM 2: DATA FLOW
  // -------------------------------------------------------------
  console.log('▶ Generating 2/3: data-flow.png...');
  const html2 = `
    <!DOCTYPE html>
    <html>
    <head>${commonStyles}</head>
    <body>
      <div class="header">
        <div>
          <span class="badge-tag">VARUNETRA • HYDROLOGIC & OPERATIONAL PIPELINE</span>
          <h1 class="title">Data Flow: Closed-Loop Data Transformation</h1>
          <p class="subtitle">End-to-end data lifecycle from meteorological precipitation to emergency responder routing</p>
        </div>
        <div>
          <span class="provenance-pill" style="background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;">PHYSICAL CAUSALITY FLOW</span>
        </div>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
        
        <!-- STEP ROW 1 -->
        <div style="display: grid; grid-template-columns: 1fr 40px 1fr 40px 1fr; gap: 16px; align-items: center;">
          <div class="card" style="border-left: 5px solid #38bdf8;">
            <div style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #38bdf8; font-weight: 700;">STAGE 01 • INPUT</div>
            <div style="font-size: 20px; font-weight: 800; color: #fff; margin: 6px 0;">Precipitation Forcing</div>
            <p style="font-size: 13px; color: #94a3b8;">Convective storm cell rainfall rate (mm/h) and accumulated hyetograph data ingested via OpenAPI stream.</p>
          </div>

          <div class="arrow">→</div>

          <div class="card" style="border-left: 5px solid #0284c7;">
            <div style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #0284c7; font-weight: 700;">STAGE 02 • TERRAIN</div>
            <div style="font-size: 20px; font-weight: 800; color: #fff; margin: 6px 0;">Elevation & Slope Matrix</div>
            <p style="font-size: 13px; color: #94a3b8;">Copernicus GLO-30 DSM (30m) resolves elevation, D8 flow direction, catchment delineation, and sink breaching.</p>
          </div>

          <div class="arrow">→</div>

          <div class="card" style="border-left: 5px solid #0ea5e9;">
            <div style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #0ea5e9; font-weight: 700;">STAGE 03 • DRAINAGE</div>
            <div style="font-size: 20px; font-weight: 800; color: #fff; margin: 6px 0;">Hydraulic Conduit Flow</div>
            <p style="font-size: 13px; color: #94a3b8;">Manning's open/closed pipe flow coupled with downstream river stage. Identifies capacity surcharging.</p>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; padding-right: 180px;">
          <div class="arrow" style="transform: rotate(90deg); margin: 8px 0;">→</div>
        </div>

        <!-- STEP ROW 2 -->
        <div style="display: grid; grid-template-columns: 1fr 40px 1fr 40px 1fr; gap: 16px; align-items: center;">
          <div class="card" style="border-left: 5px solid #a855f7;">
            <div style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #c084fc; font-weight: 700;">STAGE 06 • ACTION</div>
            <div style="font-size: 20px; font-weight: 800; color: #fff; margin: 6px 0;">Tactical Field Operations</div>
            <p style="font-size: 13px; color: #94a3b8;">Dispatch safe evacuation routes to ambulances, deploy dewatering pumps, and log immutable audit entries.</p>
          </div>

          <div class="arrow">←</div>

          <div class="card" style="border-left: 5px solid #f59e0b;">
            <div style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #f59e0b; font-weight: 700;">STAGE 05 • ROUTING</div>
            <div style="font-size: 20px; font-weight: 800; color: #fff; margin: 6px 0;">OSM Road Inundation Cost</div>
            <p style="font-size: 13px; color: #94a3b8;">Quadratic depth impedance applied to road segments. Flags corridors BLOCKED when water > clearance limit.</p>
          </div>

          <div class="arrow">←</div>

          <div class="card" style="border-left: 5px solid #ef4444;">
            <div style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #f87171; font-weight: 700;">STAGE 04 • NOWCAST</div>
            <div style="font-size: 20px; font-weight: 800; color: #fff; margin: 6px 0;">Inundation Depth Grid</div>
            <p style="font-size: 13px; color: #94a3b8;">0–180 min hydrodynamic nowcast computes surface water depth (cm), velocity (m/s), and depression ponding.</p>
          </div>
        </div>

      </div>

      <div style="margin-top: 24px; padding: 16px 24px; background: rgba(2, 132, 199, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; color: #94a3b8;"><strong style="color: #fff;">CONTINUOUS COMPUTATION CYCLE:</strong> Every 15-minute telemetry update propagates through all 6 transformation stages in &lt;200ms.</span>
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #38bdf8;">END-TO-END LATENCY &lt; 200ms</span>
      </div>
    </body>
    </html>
  `;
  await page.setContent(html2, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT_DIR, 'data-flow.png') });

  // -------------------------------------------------------------
  // DIAGRAM 3: OPERATIONAL RESPONSE LOOP
  // -------------------------------------------------------------
  console.log('▶ Generating 3/3: operational-response-loop.png...');
  const html3 = `
    <!DOCTYPE html>
    <html>
    <head>${commonStyles}</head>
    <body>
      <div class="header">
        <div>
          <span class="badge-tag">VARUNETRA • CLOSED OPERATIONAL LOOP</span>
          <h1 class="title">Operational Response Loop: Intelligence to Execution</h1>
          <p class="subtitle">Complete 11-station closed feedback system linking hazard detection to post-flood recovery</p>
        </div>
        <div>
          <span class="provenance-pill" style="background: rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.4); color: #c084fc;">CLOSED OPERATIONAL LOOP</span>
        </div>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 24px;">
        
        <!-- ROW A: FORECAST TO HAZARD -->
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px;">
          <div class="card" style="text-align: center; padding: 20px 14px;">
            <div style="font-size: 24px; margin-bottom: 6px;">🌧️</div>
            <div style="font-size: 13px; font-weight: 800; color: #38bdf8; font-family: 'JetBrains Mono';">1. RAINFALL</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Convective storm cell</div>
          </div>

          <div class="card" style="text-align: center; padding: 20px 14px;">
            <div style="font-size: 24px; margin-bottom: 6px;">⏱️</div>
            <div style="font-size: 13px; font-weight: 800; color: #38bdf8; font-family: 'JetBrains Mono';">2. NOWCAST</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">0–180 min simulation</div>
          </div>

          <div class="card" style="text-align: center; padding: 20px 14px;">
            <div style="font-size: 24px; margin-bottom: 6px;">⚠️</div>
            <div style="font-size: 13px; font-weight: 800; color: #f59e0b; font-family: 'JetBrains Mono';">3. FLOOD RISK</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Depth & velocity grid</div>
          </div>

          <div class="card" style="text-align: center; padding: 20px 14px;">
            <div style="font-size: 24px; margin-bottom: 6px;">📍</div>
            <div style="font-size: 13px; font-weight: 800; color: #ef4444; font-family: 'JetBrains Mono';">4. HOTSPOT</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Depression ponding</div>
          </div>

          <div class="card" style="text-align: center; padding: 20px 14px;">
            <div style="font-size: 24px; margin-bottom: 6px;">🚧</div>
            <div style="font-size: 13px; font-weight: 800; color: #ef4444; font-family: 'JetBrains Mono';">5. ROAD IMPACT</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Corridor surcharge</div>
          </div>

          <div class="card" style="text-align: center; padding: 20px 14px;">
            <div style="font-size: 24px; margin-bottom: 6px;">🧭</div>
            <div style="font-size: 13px; font-weight: 800; color: #22c55e; font-family: 'JetBrains Mono';">6. SAFE ROUTE</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Dynamic pathfinding</div>
          </div>
        </div>

        <!-- ROW B: DISPATCH TO RECOVERY -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin: 0 50px;">
          <div class="card" style="text-align: center; padding: 20px 14px; border-color: rgba(239, 68, 68, 0.4);">
            <div style="font-size: 24px; margin-bottom: 6px;">🚨</div>
            <div style="font-size: 13px; font-weight: 800; color: #f87171; font-family: 'JetBrains Mono';">7. CITIZEN SOS</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Geocoded triage beacon</div>
          </div>

          <div class="card" style="text-align: center; padding: 20px 14px; border-color: rgba(56, 189, 248, 0.4);">
            <div style="font-size: 24px; margin-bottom: 6px;">🚤</div>
            <div style="font-size: 13px; font-weight: 800; color: #38bdf8; font-family: 'JetBrains Mono';">8. RESCUE DISPATCH</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">SDRF team assignment</div>
          </div>

          <div class="card" style="text-align: center; padding: 20px 14px; border-color: rgba(34, 197, 94, 0.4);">
            <div style="font-size: 24px; margin-bottom: 6px;">💧</div>
            <div style="font-size: 13px; font-weight: 800; color: #4ade80; font-family: 'JetBrains Mono';">9. PUMP FLEET</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">1800 m³/h high-flow unit</div>
          </div>

          <div class="card" style="text-align: center; padding: 20px 14px; border-color: rgba(245, 158, 11, 0.4);">
            <div style="font-size: 24px; margin-bottom: 6px;">📢</div>
            <div style="font-size: 13px; font-weight: 800; color: #fbbf24; font-family: 'JetBrains Mono';">10. CIVIC ALERT</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Geo-fenced warning</div>
          </div>

          <div class="card" style="text-align: center; padding: 20px 14px; border-color: rgba(168, 85, 247, 0.4);">
            <div style="font-size: 24px; margin-bottom: 6px;">📋</div>
            <div style="font-size: 13px; font-weight: 800; color: #c084fc; font-family: 'JetBrains Mono';">11. RECOVERY & AUDIT</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Damage scour assessment</div>
          </div>
        </div>

        <!-- FEEDBACK CALLOUT -->
        <div style="background: rgba(34, 197, 94, 0.08); border: 1px dashed rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 18px 28px; text-align: center;">
          <span style="font-size: 15px; color: #86efac; font-weight: 600;">
            🔄 <strong>CLOSED-LOOP FEEDBACK:</strong> Municipal dewatering pumps lower sump water elevations → Road surcharge drops below 15 cm → Corridors reopen to emergency traffic → Evacuation routes dynamically update in real-time.
          </span>
        </div>

      </div>

      <div style="margin-top: 24px; padding: 16px 24px; background: rgba(2, 132, 199, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; color: #94a3b8;"><strong style="color: #fff;">OPERATIONAL PARADIGM:</strong> Transforms passive scientific flood modeling into an active, auditable, life-saving municipal response system.</span>
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #38bdf8;">SIH26085 CLOSED-LOOP WORKFLOW</span>
      </div>
    </body>
    </html>
  `;
  await page.setContent(html3, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT_DIR, 'operational-response-loop.png') });

  await browser.close();
  console.log('\n✅ All 3 architecture diagrams generated successfully in docs/architecture/!\n');
}

generateDiagrams().catch(console.error);
