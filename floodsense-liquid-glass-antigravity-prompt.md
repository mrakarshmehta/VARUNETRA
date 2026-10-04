# FloodSense: Liquid Glass UI/UX Transformation (Antigravity brief)

## Mission

Redesign the **frontend only** of FloodSense into a premium liquid-glass civic flood intelligence product: calm, spatial, operational first, beautiful second. It should look like a real product shown to a municipal disaster command center, not a template dashboard.

**Hard boundaries**
- Do not modify the backend, API contracts, data models or business logic.
- Do not remove or disable any functional module.
- Every phase must end with `npm run build` passing and existing tests green (`python -m pytest tests/ -v`).
- Original design language only. Do not copy any proprietary UI.

## How to work

1. Use **Planning mode**. Produce an **Implementation Plan** artifact for Phase 0 and wait for my approval before writing code.
2. Complete phases in order. At the end of each phase, stop and post a short **Walkthrough** artifact with screenshots (use the browser agent) and the gate checklist result.
3. If a gate fails, fix it before moving on. Do not defer known breakage to a later phase.
4. Prefer editing shared primitives over touching individual modules. A module should change only when it cannot be fixed at the primitive level.

---

## Phase 0: Discovery (no code changes)

Report back with:
- Framework, styling approach (Tailwind / CSS modules / plain CSS), component library, icon library.
- Map stack (Leaflet / MapLibre / other) and how Cesium 3D is mounted.
- Entry points and file map for: header, nav, map shell, timeline, right panel, modals/drawers, tables, buttons, forms.
- Inventory of existing color, radius, shadow and spacing values in use, and the count of one-off hard-coded values.
- Proposed file locations for tokens and primitives, and a migration plan per module.

**Gate:** I approve the plan.

---

## Phase 1: Tokens and primitives

Create one centralized token file (CSS variables, plus Tailwind theme mapping if Tailwind is present). No component may hard-code a color, opacity, radius, shadow or blur after this phase.

### Tokens (starting values, tune visually but keep the structure)

**Environment (pearl, light)**
- `--bg-pearl: #F4F3EF`, `--bg-cool: #EEF2F6`, `--bg-water: #E4EDF3`
- Background is a soft multi-stop radial/linear wash of these. No dark navy, neon, purple or saturated blue fields.

**Ink (text)**
- `--ink-900: #0F172A` primary, `--ink-700: #334155` secondary, `--ink-600: #475569` tertiary. Do not go lighter than `--ink-600` for readable text.

**Glass materials**

| Token | Fill | Blur | Use |
|---|---|---|---|
| `--glass-ultra` | white 38% | 10px | map chips, tool clusters |
| `--glass-soft` | white 52% | 14px | secondary overlays, legend |
| `--glass-panel` | white 64% | 18px + saturate(140%) | header, rail, intel panel, timeline |
| `--glass-strong` | white 78% | 24px | modals, drawers, dropdowns |
| `--glass-dark` | slate-900 62% | 18px | controls over the 3D scene, tooltips |

- `--glass-border`: 1px, white 55% (outer edge).
- `--glass-hairline`: 1px, slate-900 8% (inner edge for separation on light backgrounds).
- `--glass-highlight`: `inset 0 1px 0 rgba(255,255,255,.7)` (top-edge light).
- Reflection: one faint static linear-gradient (white 18% to transparent over the top 40%) on primary surfaces only. Never animated.

**Radius:** `--r-sm: 8px` (controls, pills), `--r-md: 14px` (cards, rows, inputs), `--r-lg: 22px` (floating panels), `--r-xl: 28px` (modals). Pills are used only for status pills and compact chips, not for everything.

**Spacing:** 4, 8, 12, 16, 20, 24, 32. Nothing else.

**Shadows (atmospheric, slate-tinted, never black):**
- `--shadow-1: 0 1px 2px rgba(15,23,42,.06), 0 4px 12px rgba(15,23,42,.06)`
- `--shadow-2: 0 8px 24px rgba(15,23,42,.10)`
- `--shadow-3: 0 16px 48px rgba(15,23,42,.14)`

**Semantic colors** (each has `fill` 14%, `border` 28%, and a dark `text` variant):
- rainfall `#2F6FB5`, normal/active `#2E8B6A`, warning `#B7791F`, high `#C2410C`, critical `#C0392B`, blocked `#64748B`.
- Status is never color-only: every status has an icon and a text label.

**Motion:** 160ms for hover/press, 200ms for panels. Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`. No bounce, no looping animation, no particles.

**Type:** Inter (UI), JetBrains Mono for numbers, IDs, timestamps and telemetry with `font-variant-numeric: tabular-nums`. Scale: 11 / 12 / 13 / 14 / 16 / 20 / 28. Sentence case by default; small uppercase labels only for section eyebrows.

### Blur budget (performance rule)

- **Real `backdrop-filter`** only on: header, nav rail, intel panel, timeline, map tool clusters, modals, drawers, dropdowns.
- **Translucent fill only (no backdrop-filter)** on: buttons, pills, KPIs, table rows, inputs, tooltips inside a glass parent.
- **Never nest** backdrop-filter elements. No more than 6 blurred surfaces visible at once.

### Fallbacks (required)

- `@supports not (backdrop-filter: blur(1px))`: surfaces fall back to 92% opaque fill.
- `@media (prefers-reduced-transparency: reduce)`: opaque fills, no blur.
- `@media (prefers-reduced-motion: reduce)`: remove transitions except opacity.
- `@media (forced-colors: active)`: visible borders and focus rings.

### Primitives to build

Utility classes or components, all consuming tokens only:
- Surfaces: `civic-glass`, `-soft`, `-strong`, `-dark`, `-floating`.
- **Buttons:** primary, secondary, ghost, danger, success, icon, pill, segmented. States: default, hover (+1px lift, brighter fill, slightly stronger shadow), pressed (0px, scale .98), focus-visible (2px accent ring with offset), disabled. Text never wraps (`white-space: nowrap`, ellipsis).
- Status pills: REAL, SIMULATED, SYNTHETIC, DEMO, CACHED; NORMAL, WARNING, HIGH, CRITICAL, BLOCKED, ACTIVE. Translucent tint, icon plus text.
- KPI (compact, embedded, not tile cards), tabs, segmented control, input/select/dropdown/context menu, tooltip (required on every icon-only control), modal, drawer, glass data grid (sticky header, compact rows, right-aligned tabular numerics, hover highlight, truncation with tooltip).
- One icon system: Lucide. Consistent 1.75 stroke, 16/18/20px sizes. No emoji icons.

### Gate 1
- Build passes, tests pass.
- A temporary `/dev/primitives` page shows every primitive in every state, at 1440 wide.
- Contrast check: body text at least 4.5:1, large text and UI boundaries at least 3:1, measured over both the pearl background and a light map tile.
- Zero hard-coded colors, radii or shadows in the primitives.

---

## Phase 2: Shell

Build the floating layout. The map stays the hero; nothing opaque covers it.

- **Header:** floating `civic-glass` bar, compact. Logo, "Urban Flood Operations Center", "Synthetic pilot · Patna Urban Basin", clock, forecast horizon, system health, rainfall state, drainage state, operator menu. Short labels plus icons; secondary items collapse into a menu before anything wraps.
- **Nav rail:** floating glass rail, icon plus compact label. States: default (frosted), hover (brighter, +1px), active (brighter fill, semantic accent edge, subtle glow), pressed. Collapses to icons-only below 1280px and to a drawer below 900px.
- **Intel panel (right):** one glass container with internal sections: Current incidents, Next 60 minutes, Critical assets, System status. Compact rows separated by hairlines, not stacked mini-cards. Scrolls internally.
- **Timeline (bottom):** floating glass control, 0 to 180 min with marks at NOW, +15, +30, +45, +60, +90, +120, +150, +180. Glass scrubber thumb, previous/play/pause/next, playback speed, current forecast readout in mono.
- **KPI strip:** Rainfall, Drainage, Flood depth, Road impact as compact embedded readouts (label, mono value, one-line context).

**Gate 2:** Command center matches the layout in section "Target main screen" below at 1440x900 and 1920x1080, with no page scroll and no overflow.

---

## Phase 3: Map and 3D overlays

- 2D map overlays: top-left title chip, top-right layer controls, bottom-left legend, corner tool cluster. Controls: zoom, locate, reset, layers, basemap, flood depth, rainfall, drainage, roads, SOS, shelters, pumps, 3D toggle. All small, icon-first, with tooltips.
- "2D Operations / 3D City" is a segmented glass control.
- Cesium 3D: use `glass-dark` for controls floating over the scene. Controls: layers, camera, reset, top-down, tilt, incident fly-to, flood depth, timeline. The 3D scene must not be obscured.
- Do not change map or Cesium logic beyond restyling their control DOM. If a library control cannot be themed cleanly, replace it with a custom control wired to the same API.

**Gate 3:** Map pan/zoom and timeline scrubbing remain smooth (no visible frame drops with all overlays on). Overlays never cover more than roughly 35% of the map viewport at 1440x900.

---

## Phase 4: Modules (batches, with a Walkthrough after each)

Acceptance criteria apply at 1440x900 and 1920x1080, with no horizontal page scroll.

**Batch A: Overview, Nowcast, Rainfall, Drainage**
- Drainage: load ratio, surcharge, backflow, critical nodes, conduit stress, with Normal / Elevated / Warning / Critical hierarchy (icon plus label plus tint).
- Charts use token colors, mono axis labels, glass tooltip.

**Batch B: Flood Map, Routing, SOS / Rescue**
- Routing: segmented control (Fastest, Safest, Emergency, Evacuation); route cards with line indicator and ETA, distance, max depth, restricted segments; the map route stays dominant.
- SOS: glass incident rows, priority indicators, action controls, dispatch status (Received, Verified, Dispatched, In transit, Resolved), glass confirmation dialog. Emergency controls are visually distinct (red-tinted glass, stronger border) but not neon.

**Batch C: Shelters, Hospitals, Pumps, Relief, Damage**
- Glass operational tables, not card grids.
- Shelters: capacity, occupancy, flood risk, accessibility, availability. Pumps: capacity, output, runtime, power, dispatch state.

**Batch D: ML Center, Citizen Portal, 15-stage simulation, data provenance**
- ML Center: denser technical glass panels, glass tabs, mono metrics, feature-importance chart, uncertainty panel, validation info.
- The banner **"SYNTHETIC / SIMULATION PERFORMANCE. NOT REAL-WORLD VALIDATION."** must be persistently visible, high-contrast and never truncated.
- Every module must show its data-provenance pills (REAL / SIMULATED / SYNTHETIC / DEMO / CACHED) where data is shown.

**Gate per batch:** build and tests pass, automated overflow audit clean, screenshots attached.

---

## Global layout and overflow rules (single source of truth)

- Every flex/grid child that holds text gets `min-width: 0`. Single-line labels use `text-overflow: ellipsis` and a tooltip with the full text. Multi-line text uses `line-clamp`. Buttons never wrap.
- Do not fix overflow by shrinking type below 11px. Change layout, truncate, or collapse instead.
- Only inner panels may scroll. The page itself never scrolls horizontally, and never vertically at 1440x900 and 1920x1080.
- Breakpoints: 1920, 1440 (primary targets), 1280, 1024 (rail collapses, panels stack), 768 (drawer navigation, secondary panels become bottom sheets).

### Automated overflow audit (build this in Phase 1, run in every gate)

Write a Playwright script (`scripts/ui-audit.*`) that visits every route at 1440x900, 1920x1080 and 1024x768 and fails if it finds:
- `document.documentElement.scrollWidth > clientWidth`;
- any visible element whose `scrollWidth > clientWidth` without `text-overflow: ellipsis` or an intentional scroll container;
- overlapping bounding boxes between sibling text and icon elements;
- any `button` whose text wraps to more than one line.

It saves screenshots to `docs/ui-audit/<resolution>/<NN-module>.png`.

---

## Target main screen

```
┌──────────────────────────────────────────────────────────────┐
│ FLOATING GLASS HEADER                                        │
└──────────────────────────────────────────────────────────────┘
┌────┐                                            ┌───────────┐
│    │                                            │ GLASS     │
│NAV │            GIS / 3D MAP (hero)             │ INTEL     │
│RAIL│      floating tools, legend, layers        │ PANEL     │
│    │                                            │           │
└────┘                                            └───────────┘
        ┌──────────────────────────────────┐
        │ GLASS TIMELINE  0 ─────●─── 180  │
        └──────────────────────────────────┘
```

---

## Phase 5: Final QA and report

1. Purge remaining legacy styles: old cards, buttons, radii, shadows, fonts, flat-color remnants. Report the count of hard-coded values removed and the count remaining (target: zero outside the token file).
2. Keyboard pass: every control reachable, visible focus ring, tooltips on icon-only buttons, Esc closes modals/drawers/menus.
3. Run `npm run build` and `python -m pytest tests/ -v`.
4. Run the overflow audit and capture screenshots at 1440x900 and 1920x1080 for: Command Center, Nowcast, Rainfall, Drainage, Routing, SOS, Shelters, Pumps, ML Center, 3D City, 15-stage simulation.

**Final report must list:** design system and token summary; reusable components; modules redesigned; overflow issues found and fixed; responsive changes; map/3D integration status; build and test results; screenshot paths; remaining issues with severity.

## Definition of done

- One coherent glass material across every module, with clear hierarchy (not glass on everything equally).
- Map and 3D scene remain the visual hero.
- All gates pass. Zero overflow findings. Contrast targets met. Fallbacks work.
- No functional regression: every existing module works as before.
