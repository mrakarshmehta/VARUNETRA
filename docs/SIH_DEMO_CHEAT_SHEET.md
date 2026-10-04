# VARUNETRA / FloodSense — SIH Demonstration Cheat Sheet & Judge Reference

**System:** VARUNETRA (Urban Flood Intelligence & Response Platform)  
**Demonstration Scenario:** *Patna Urban Basin — Extreme Rainfall Emergency*  
**Operating Mode:** `DEMO / SIMULATION`  
**Execution Architecture:** 15 Internal Deterministic Stages grouped into 9 Visible Presentation Phases (Phase 0 → Phase 8)  
**Freeze Status:** DEMO BUILD FROZEN — DEMONSTRATION READY  

---

## 1. Authoritative Stage & Phase Architecture

```text
Internal execution stages: 15
Visible presentation phases: 9
```

| Phase | Visible Phase Name | Internal Stages | Key Operational Transition |
|:---:|:---|:---:|:---|
| **Phase 0** | **Baseline Monitoring** | Stage 0 | Baseline normal monitoring; 0 mm/h simulated rainfall; all telemetry nominal. |
| **Phase 1** | **Rainfall Inception & Escalation** | Stages 1–3 | Simulated cloudburst injection (45 mm/h $\rightarrow$ 95 mm/h $\rightarrow$ 140 mm/h); drainage saturation begins. |
| **Phase 2** | **Flood Nowcast Escalation** | Stages 4–5 | Hydrodynamic nowcast predicts widespread water accumulation; risk transitions ELEVATED $\rightarrow$ SEVERE. |
| **Phase 3** | **Critical Hotspot Detection** | Stages 6–7 | Hotspot `HOT-PAT-01` (Rajendra Nagar depression) breaches critical depth ($>60\text{ cm}$); risk reaches CRITICAL. |
| **Phase 4** | **Road Network Inundation** | Stage 8 | Kankarbagh Main Rd & Ashok Rajpath marked UNSAFE / IMPASSABLE; dynamic network closure. |
| **Phase 5** | **Flood-Aware Safe Routing** | Stage 9 | Dijkstra/A* routing dynamically routes response assets around inundated corridors. |
| **Phase 6** | **SOS Ingestion & Emergency Dispatch** | Stages 10–12 | Simulated emergency SOS-PAT-901 ingested; NDRF Team-01 dispatched; high-capacity dewatering Pump-01 engaged. |
| **Phase 7** | **Simulated Public Warning & Recovery** | Stages 13–14 | Broadcast simulated CAP warning alert; simulated rainfall terminates; waters recede to safe operational baseline. |
| **Phase 8** | **Incident Resolved & Scenario Audit** | Stage 15 | Incident declared resolved; comprehensive deterministic scenario outcome and audit log generated. |

---

## 2. Scientific Honesty & Provenance Matrix

### What is REAL
* **Application Architecture:** Modern distributed micro-tier architecture with FastAPI, asynchronous WebSocket broadcast, SQLite WAL state persistence, and React/TypeScript SPA frontend.
* **Terrain & Elevation Analysis:** Copernicus GLO-30 DSM (30m digital surface model) elevation ingestion and spatial processing pipeline.
* **Deterministic Computational Logic:** Hydrodynamic runoff estimation, topographic sink depression filling, Dijkstra/A* penalty-weighted road routing, and multi-factor hazard scoring.
* **Operational Command Workflow:** Real-time state machine governing SOS incident lifecycles, rescue team availability, pump telemetry tracking, and immutable audit logs.
* **Security & Authentication:** Role-based access control (RBAC), signed JWT tokens, SHA-256 password hashing, and fail-closed operational enforcement.

### What is SIMULATED
* **Rainfall Forcing:** Simulated synthetic extreme cloudburst forcing (0 $\rightarrow$ 140 mm/h), not live radar/IMD telemetry.
* **Emergency Incident:** Citizen distress report (`SOS-PAT-901`, 12 trapped individuals at Rajendra Nagar) injected synthetically for tactical demonstration.
* **Operational Dispatch:** Automated assignment of simulated rescue assets (`TEAM-01`) and mobile dewatering pumps (`PUMP-01`).
* **Accelerated Time Horizon:** Compressed 15-stage demonstration clock allowing an entire 4-hour flash flood event to be witnessed in 5–7 minutes.
* **Demonstration Outcomes:** Tabulated metrics reflecting scenario configuration and simulated operational results.

### What is NOT CLAIMED
* **Field Validation:** No claims of empirical field calibration across historical monsoon seasons without physical municipal telemetry.
* **Government SSO:** No live integration with C-DAC, NDMA Single Sign-On, or state emergency dispatch switches.
* **Live Sensor Telemetry:** No claim of live IMD Doppler Weather Radar feeds, live rain gauges, or live river-gauge ultrasonic sensors.
* **ML Real-World Signoff:** Hydrologic ML nowcasts are deterministic predictive models, not certified civil engineering flood-plain demarcation.
* **Engineering-Grade Drainage Design:** The model provides tactical emergency decision support, not municipal stormwater pipe sizing certification.

---

## 3. Metric Sourcing & Provenance Audit

| Outcome Metric | Displayed Value | Provenance / Source | Authoritative Origin |
|:---|:---:|:---|:---|
| **Peak Flood Depth** | 78.4 cm | CALCULATED SIMULATION VALUE | Scenario stage peak inundation calculation |
| **Maximum Affected Area** | 3.42 km² | CALCULATED SIMULATION VALUE | Topographic sink accumulation model |
| **Unsafe Road Count** | 2 corridors | SYSTEM HAZARD STATE | Real-time road network edge evaluation |
| **Citizens Evacuated** | 12 citizens | SCENARIO CONFIGURATION | `SOS-PAT-901` reported trapped party size |
| **Rescue Teams** | 1 team (`TEAM-01`) | OPERATIONAL API STATE | Dispatch registry in `operations_service.py` |
| **Pumps Deployed** | 1 pump (`PUMP-01`) | OPERATIONAL API STATE | Equipment registry in `operations_service.py` |
| **Route Result** | Computed Safe Route | DYNAMIC ROUTING ENGINE | Weighted A* hazard penalty algorithm |
| **Alert ID** | `ALT-SIM-001` | SCENARIO CONFIGURATION | Broadcast event generated in Stage 13 |
| **Scenario Duration** | 15 Stages (~280s) | SYSTEM DEMO CLOCK | Authoritative deterministic scenario ticker |

---

## 4. Standard 5–7 Minute Judge Demonstration Script

| Time Window | Scenario Phase | Spoken Narrative & Presentation Prompts | Key Visual Action |
|:---:|:---|:---|:---|
| **0:00 – 0:30** | **Baseline Monitoring**<br>*(Phase 0)* | *"Judges, we begin in Baseline Monitoring. Notice the SIMULATION indicator on the control console. In this mode, simulated rainfall is 0 mm/h. Elevation data is sourced directly from Copernicus GLO-30 DSM. All telemetry reflects nominal urban drainage conditions."* | Click **Presentation Mode**; point out green status, baseline map, and `SIMULATION` pill. |
| **0:30 – 1:15** | **Simulated Extreme Rainfall**<br>*(Phase 1)* | *"We now inject a simulated extreme rainfall cloudburst forcing over the Patna Urban Basin. Notice the simulated precipitation forcing ramping from 45 mm/h to 140 mm/h. The timeline records the automated telemetry events."* | Click **START EMERGENCY SCENARIO**; observe rainfall meter rising and timeline updating. |
| **1:15 – 2:00** | **Flood Nowcast Escalation**<br>*(Phase 2)* | *"Within 15 minutes of simulated forcing, VARUNETRA's hydrodynamic nowcast detects runoff rates exceeding municipal drainage capacity. System Risk level escalates from ELEVATED to SEVERE, and spatial flood extents begin visualizing on the map."* | Highlight the dynamic risk badge and map layer showing simulated surface accumulation. |
| **2:00 – 2:45** | **Critical Hotspot & Roads**<br>*(Phases 3–4)* | *"Topographic sink analysis flags a critical depression at Rajendra Nagar with depths exceeding 60 cm. Inundation crosses local transport thresholds, automatically marking Kankarbagh Main Rd and Ashok Rajpath as UNSAFE for civilian transit."* | Hover over the red critical hotspot and show the flagged impassable road segments. |
| **2:45 – 3:30** | **Flood-Aware Safe Routing**<br>*(Phase 5)* | *"Standard navigation would guide responders directly into inundated underpasses. VARUNETRA's flood-aware routing engine computes a hazard-avoiding detour using penalty-weighted elevation routing to guarantee responder safety."* | Show the green safe route contour bypassing the flooded road corridor. |
| **3:30 – 4:15** | **Simulated SOS & Rescue**<br>*(Phase 6a)* | *"A simulated citizen distress call SOS-PAT-901 is ingested, reporting 12 trapped individuals. The incident commander dispatches NDRF Team-01. Notice the real-time operational state transition from NEW to ASSIGNED to IN_PROGRESS."* | Open operational drawer or view SOS badge; show assigned NDRF team on the board. |
| **4:15 – 5:00** | **Pump Dispatch & Alert**<br>*(Phases 6b–7a)* | *"Simultaneously, municipal dewatering pump PUMP-01 is deployed to draw down the Rajendra Nagar sink. An emergency public warning alert ALT-SIM-001 is broadcast via Common Alerting Protocol specifications, clearly tagged as SIMULATION."* | Show pump status turning ACTIVE and the simulated emergency banner notification. |
| **5:00 – 6:00** | **Rainfall Reduction & Recovery**<br>*(Phases 7b–8)* | *"As the simulated storm cell moves out of the basin, precipitation drops to 0 mm/h. Floodwaters recede through simulated gravity drainage and pump extraction. System risk descends back to LOW, and all 12 individuals are logged safely evacuated."* | Watch flood depth decline, risk drop to NORMAL, and status switch to INCIDENT RESOLVED. |
| **6:00 – 7:00** | **Outcome Summary & Audit**<br>*(Audit Close)* | *"The scenario concludes with an immutable operational summary: 12 citizens evacuated, 1 rescue team deployed, 1 pump operated, peak depth 78.4 cm. Every single action is permanently recorded in the SQLite audit ledger."* | Click **Outcome** to show the final modal; click **Situation Board** to show full operational matrix; click **Reset Scenario** to prove clean repeatability. |

---

## 5. Judge Q&A Defense Guidelines

* **Q: Is this real or simulated data?**  
  *Response:* *"The elevation baseline is real Copernicus GLO-30 DSM data. The meteorological cloudburst forcing and citizen distress incidents are synthetic simulations created specifically to demonstrate our automated end-to-end incident management pipeline without endangering actual public safety."*
* **Q: How does this differ from Google Maps or commercial GPS?**  
  *Response:* *"Commercial navigation engines route purely based on road congestion and travel time. VARUNETRA combines digital elevation models with real-time hydrologic accumulation to penalize roads based on water depth, actively preventing emergency vehicles from drowning in flooded underpasses."*
* **Q: Can the scenario be replayed deterministically?**  
  *Response:* *"Yes. Clicking RESET SCENARIO restores baseline states without deleting operational database tables. Clicking START runs the exact 15-stage sequence identically every time."*
