# Mock UI PRD — Sprint 5: Weather-Triggered Flood & Inundation Rerouting

**Sprint reference:** `docs/sprints/sprint-05-weather-rerouting.md`
**Branch:** `feature/mock-ui` · **Surface home:** `/dashboard` · **Stack:** Next.js 16 / React 19 / TS strict / Tailwind v4 / MapLibre GL v6 / Zustand / React Query / RHF+Zod / Sonner / Lucide / Vitest / Playwright

## 1. Purpose (D1)

Rain is the single largest external multiplier of transit exit paralysis in Indonesian cities (sprint doc §Why This Sprint). The real module depends on BMKG/OpenWeatherMap feeds, PostGIS flood depth data, and a dynamic Dijkstra/A* router — none of which exist yet. This mock demonstrates the **entire rain-detour UX** end-to-end on fixtures alone: live rainfall crossing the 20 mm/hr threshold auto-enables Rain Mode, flooded underpasses surface from simulated flood-photo detection, and detour routes repaint around them to covered walkways.

**Stakeholder value**

| Stakeholder | What the demo proves |
| --- | --- |
| MAPID (civil engineers) | Radar overlay + flooded-underpass markers read the elevation/disaster catalog story |
| Dishub (transit authority) | Threshold-driven auto-rerouting shows operational policy without policy-code changes |
| Station operators | Alert → acknowledge → override loop fits existing daily ops (precedent: Sprint 3 banner) |
| Investors | Full monsoon-resilience narrative with zero infrastructure spend |

**Demo narrative:** "One rainstorm, zero backend — watch 20 mm/hr rewrite commuter routes in real time." The single narrative arc: calm (12 mm/hr) → threshold crossing (24 mm/hr) → monsoon peak (41 mm/hr) → floods cascade → detours repaint → rainfall drains and the system recovers.

## 2. Personas & Roles (D2)

Three personas drive the demo; a simulated background role (flood-photo detector) is
non-interactive. Rudi and Dina share the operator dashboard with different control sets;
Sari touches only the read-only commuter preview.

### 2.1 Roster & goals

| Persona | Role & context | Primary goal | Signature demo moment |
| --- | --- | --- | --- |
| **Bapak Rudi** — Station Operator | Tanah Abang duty desk; already fluent in the Sprint 3 banner/acknowledge loop | Keep exits moving through the downpour; trust the auto-trigger | Acknowledging the 20 mm/hr banner, then forcing MANUAL OVERRIDE |
| **Dina** — Ops Controller | Dishub war room, cross-station view | Validate monsoon rerouting policy citywide | Reading the aggregate "1,240 commuters rerouted to covered route C" |
| **Sari** — Public Commuter | Daily Tanah Abang → Sudirman trip | Know her trip stays dry before leaving home | Seeing her trip's safe path in the Rain Safe-Path preview |

**Background (non-interactive):** flood-photo depth detection ("Gem 3.6 Flash") — simulated
by the 4 seeded feed cards in §4.2; no persona operates it in this sprint.

### 2.2 Can / cannot-do matrix

| Action in mock | Rudi | Dina | Sari |
| --- | --- | --- | --- |
| Toggle Rain Mode layer | ✅ | ❌ view-only | ❌ |
| Inspect flood marker depth popover | ✅ | ✅ | ❌ |
| Acknowledge auto-trigger banner | ✅ | ❌ banner visible, acknowledge reserved for Rudi | ❌ |
| Manual override force on/off | ✅ | ❌ sees locked cards + shared override chip | ❌ |
| View aggregate reroute impact | ✅ | ✅ | ✅ trip-level only |
| Drill into detour cards (easeTo highlight) | ✅ | ✅ | ❌ |
| Open Rain Safe-Path preview | ✅ from detour panel | ✅ | ✅ her only surface |
| Pan / zoom / switch theme | ✅ | ✅ | ❌ static preview |
| Modify fixtures or flood states | ❌ | ❌ | ❌ |
| Reach Sprint 6 portal / other stations | ❌ | ❌ | ❌ non-navigational until Sprint 6 |

### 2.3 Surface ownership & cross-persona flow

| Persona | Surfaces in scope | Control set |
| --- | --- | --- |
| Rudi | 4.1 overlay · 4.2 feed · 4.3 panel · banner · override chip | Full: toggle, inspect, acknowledge, override |
| Dina | 4.1 overlay · 4.2 feed · 4.3 panel · banner · aggregate chips | Read + drill-down; no toggle/acknowledge/override (war-room monitors operator decisions; dispatch lands Sprint 7) |
| Sari | 4.4 commuter modal only | Read-only: trip card, covered-route summary, disabled Rain Safe-Path toggle |

**Cross-surface relationships:** Rudi's override freezes detour recomputes, which Dina sees
as locked cards + the shared MANUAL OVERRIDE chip; the threshold-crossing event fans out to
all three (banner + feed auto-open for Rudi/Dina, toggle state flip "Jalur Aman Hujan · Aktif"
for Sari); Rudi's acknowledge clears the banner for both dashboard personas; Sari's preview
mirrors the current rain-mode state but never mutates it.

## 3. Information Architecture & Flows (D3)

**Page map** — everything lives on `/dashboard` as layered additions to existing panels:

| Surface | Home | Entry point |
| --- | --- | --- |
| Rain Mode Overlay (map) | `/dashboard` map | Active Spatial Layers → **Rain Mode** (new row in `active-layers-panel.tsx`) |
| Flood Depth Detection Feed | Right-side panel (tab next to Alert Channel Feed) | Sidebar tab **Flood Feed**; auto-opens on first `flood_detected` |
| Rain Detour Routing Panel | Bottom-left card stack above stats | **Rain Detour Active** pill; auto-expands on threshold crossing |
| Rain Safe-Path Preview | Modal from detour panel | Button **Preview commuter view** |

**End-to-end flows**

1. *Idle → Active:* operator toggles Rain Mode → radar layer fades in (600 ms) → rainfall chip live at 12 mm/hr.
2. *Auto-trigger:* rainfall crosses 20 mm/hr → banner + auto-enable + feed auto-opens → flood #3 appears → detour list repaints.
3. *Investigate:* click flooded marker → depth popover → click detour card → map `easeTo` route bounding box + route highlight.
4. *Recovery:* rainfall < 20 mm/hr for 3 consecutive ticks → auto-disable banner "Rain Detour deactivated"; manual override suppresses all auto-transitions until cleared.
5. *Preview:* commuter modal opens read-only; ESC/backdrop/X closes.

## 4. Demo Surfaces & Component Specs (D4)

### 4.1 Rain Mode Overlay (map)

Layout: map canvas (shared `map-canvas.tsx`) with new layers above vector tiles, below station markers. Components: **Rain Mode** layer row, **rainfall chip** (top-center, `font-mono`, `tabular-nums`), flooded-underpass markers, radar cells, **DEMO** badge (top-left corner).

| State | Behavior |
| --- | --- |
| No-rain idle | Radar layers hidden; chip `12 mm/hr · light rain` (slate); markers show 2 pre-flooded underpasses (25 cm, 12 cm) |
| Threshold-crossing | Radar fades in (600 ms), chip escalates amber → rose as mm/hr climbs; auto-enable |
| Manual override | Chip locked to operator value + **MANUAL OVERRIDE** chip (amber glow); auto-trigger suppressed |
| Flood feed empty | No radar, no markers, chip neutral — see §7 empty-state copy |
| Loading | Radar cells shimmer (skeleton pattern, 500 ms loop); chip `—` |
| Error | Sonner toast "Weather feed unavailable — showing last known snapshot"; last radar frame kept |

### 4.2 Flood Depth Detection Feed (right panel)

Layout: 320 px panel, `font-mono` depth readouts; header "Flood Depth Detection · Live" with pulsing dot (Sprint 3 pattern).

| State | Behavior |
| --- | --- |
| Default | 4 cards: thumbnail + `est. depth: 38 cm` + `confidence: 0.94` + source `Field photo · Gem 3.6 Flash`; newest on top |
| Empty | CloudRain icon + "No flood detections in the last 30 minutes." |
| Loading | 3 skeleton rows (shimmer) |
| Edge: low confidence (< 0.70) | Card amber-rimmed, label "Unverified — verify depth on site" |
| Edge: unknown depth | Readout `—` and marker icon hollow (no fill) |

### 4.3 Rain Detour Routing Panel (bottom-left)

Layout: card stack (max 3 routes). Each card: origin → destination, time delta chip, covered-distance %, edge-state mini-legend.

| State | Behavior |
| --- | --- |
| Off | Hidden entirely |
| Active, empty detour set | Card: warning icon + "No covered alternative available for this trip" |
| Active, with detours | 3 route cards; recompute on every tick where flood states changed (counts animate) |
| Override | Header chip flips to **MANUAL OVERRIDE**; cards locked (non-animating) until cleared |

### 4.4 Rain Safe-Path Preview (commuter modal)

Layout: 480 px centered modal; big friendly toggle (slider), "Tanah Abang → Sudirman" trip card, safe path emerald polyline summary, "Via covered walkway C · +3 min". States: open / empty trip ("No covered path found for this trip") / closed.

## 5. Interactions & Micro-interactions (D5)

| Interaction | Behavior | Duration / timing |
| --- | --- | --- |
| Rainfall tick | Chip value counts up, `scale-105` pop, color ramp | 300 ms; tick every 10 s |
| Radar repaint | Texture crossfade on layer paint (opacity 0.6 → 1) | 500 ms |
| Flood marker pulse | CSS ping ring (blue-400 → transparent); disabled under `prefers-reduced-motion` | 1.6 s loop |
| Marker click | Depth popover scales in at marker anchor; popover re-anchors on pan/zoom | 150 ms in |
| Detour repaint | `setData` on GeoJSON source + line opacity fade (flooded 0.9 → 0.35, covered 0.4 → 0.9) | 400 ms |
| Route card hover/click | Map `easeTo` route bbox; selected polyline width 3 → 5 | 600 ms ease, 150 ms stroke |
| Override chip | Slides in from panel header, amber glow `shadow-amber-500/40`; X clears | 200 ms in / 150 ms out |
| Alert banner (auto-trigger) | Slides down 300 ms, `aria-live="polite"`, amber/rose glow; Acknowledge fades out | 250 ms |
| Commuter modal | Scale/fade open; focus trap; ESC/backdrop close | 200 ms |

## 6. Visual Design Spec (D6)

- **Theme:** dual dark/light via `useThemeStore` (repo precedent); panels follow `active-layers-panel.tsx` language: `bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl`.
- **Typography:** mono-for-data (`font-mono`, `tabular-nums`) for rainfall, depth, confidence, deltas; sans (`text-xs font-semibold tracking-tight`) for UI labels; section headers `text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400`.
- **Palette:** rain/flood = blue-400 → cyan-300 (#3b82f6 → #22d3ee) for radar cells + flood markers; warning escalation amber (#f59e0b) → rose (#f43f5e) on chip; covered routes **emerald-500** (#10b981); excluded flooded edges **red-500** (#ef4444) dashed; neutral slate per existing tokens. Glows: `shadow-amber-500/40` (override), `shadow-emerald-500/30` (covered route selected).
- **DEMO badge:** top-left map corner, always visible when `NEXT_PUBLIC_DEMO_MODE=true`: `bg-amber-400/10 text-amber-400 border border-amber-400/30 text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-md` + 8×8 pulsing dot.
- **Spacing:** chips `px-2.5 py-1 rounded-lg text-xs`; cards `p-3 rounded-xl`; panel `p-4.5 w-76`-style containers; consistent 4 px grid.

## 7. Content & Copy (D7)

| Context | Copy (en) | Copy (id, public preview only) |
| --- | --- | --- |
| Layer row | "Rain Mode" | "Mode Hujan" |
| Auto-trigger banner | "HEAVY RAIN — 24 mm/hr — Rain Detour auto-enabled" | "HUJAN LEBAT — 24 mm/jam — Rute hujan diaktifkan" |
| Flood alert | "Flood detected at Tanah Abang Underpass Gate B — est. depth 30 cm" | "Genangan di Underpass Tanah Abang Gerbang B — ±30 cm" |
| Override | "MANUAL OVERRIDE" | — |
| Feed empty | "No flood detections in the last 30 minutes." | — |
| Feed error | "Weather feed unavailable — showing last known snapshot" | — |
| Detour impact | "1,240 commuters rerouted to covered route C" | — |
| Detour card | "Tanah Abang → Sudirman · +3 min · 78% covered" | — |
| No alternative | "No covered alternative available for this trip" | "Tidak ada jalur terlindung untuk perjalanan ini" |
| Toggle preview | "Rain Safe-Path" | "Jalur Aman Hujan" |
| Recovery | "Rain Detour deactivated — rainfall below threshold" | — |

Public preview surface carries id copy inline (Sprint 11 owns full i18n).

## 8. Mock Data & Fixtures (D8)

**Typed schema** (`src/entities/weather.ts`, zod-parsed at repo boundary):

```ts
interface WeatherReading { rainfallMmHr: number; source: "bmkg" | "owm"; capturedAt: number }
interface RadarCell { x: number; y: number; intensity: 0|1|2|3|4|5 }        // 20x20 grid, 400m cells
interface UnderpassFlood { id: string; name: string; lat: number; lng: number;
  depthCm: number | null; confidence: number; verified: boolean }
interface WalkwayEdge { id: string; fromId: string; toId: string; covered: boolean;
  baseWeightMin: number }                                                   // covered = indoor/elevated
interface DetourRoute { id: string; originId: string; destId: string; edgeIds: string[];
  timeDeltaMin: number; coveredPct: number; edgeState: Record<string, "open"|"covered"|"flooded"> }
```

**Seed counts & realism** (extends shared fixture: station exits Sprint 1, pedestrian counts Sprint 2):

| Fixture | Count | Notes |
| --- | --- | --- |
| Underpasses | 6 | Tanah Abang corridor (≈ -6.185, 106.811); 2 pre-flooded (25 cm/0.92, 12 cm/0.87); flood #3 at t≈5:00 (30 cm), #4 at t≈6:30 (41 cm) |
| Walkway graph | 8 covered + 6 exposed edges | Covered = elevated walkways/indoor corridors (emerald); exposed = open at-grade; flooded edges weighted ∞ |
| Commuters | 1,240 | 3 origin pairs (Tanah Abang → Dukuh Atas → Sudirman), from Sprint 2 counts |
| Detour routes | 3 | A/B/C alternatives; deltas +1/+3/+5 min, covered 62–91% |
| Flood photos | 4 | `est. depth` 8–41 cm, confidence 0.86–0.97, source `Field photo · Gem 3.6 Flash` |
| Radar grid | 20×20 cells | 8 km × 8 km; intensity follows the rainfall curve (DBZ-style 0–5 bands) |

Realism: depths in cm per field-photo detection; 20 mm/hr heavy-rain band and 50 mm/hr monsoon scenario per sprint doc §10; rainfall curve is a seeded sinusoidal ramp + ±1 mm/hr jitter.

## 9. Liveness & Behavior (D9)

**Deterministic timeline** (ticks every 10 s, seeded, replayable; `demoSpeed` factor supported for demos/tests):

| Elapsed | Rainfall | Event |
| --- | --- | --- |
| t = 0:00 | 12 mm/hr | Demo starts; 2 pre-flooded markers visible |
| t ≈ 2:00 | 24 mm/hr | **Crosses 20 mm/hr** → auto-enable + banner + feed opens (deterministic trigger) |
| t ≈ 4:00 | 41 mm/hr | Peak; radar at max intensity (band 5) |
| t ≈ 5:00 | 38 mm/hr | `flood_detected` #3 (Gate B, 30 cm) → detour set recomputes, counts animate |
| t ≈ 6:30 | 41 mm/hr | `flood_detected` #4 (41 cm) → route A excluded; 1,240 commuters on covered route C |
| t ≈ 9:00 | 14 mm/hr | Below threshold; drains after 3 consecutive below-threshold ticks (t ≈ 9:30) → recovery banner |

**Rules:** threshold = 20 mm/hr (exclusive); auto-enable fires exactly on first crossing tick; flood events fire on seeded ticks, not random; manual override suppresses all auto-transitions until cleared; `document.hidden` pauses the driver and skips missed ticks (snapshot applied on next visible tick); `prefers-reduced-motion` disables ping/pulse/radar drift/scale pops but keeps data updates; `?demoSpeed=10` compresses the timeline to ~60 s for Playwright.

## 10. Tech Specs (D10)

**File map** (all new, alongside existing `features/` structure):

| File | Responsibility |
| --- | --- |
| `src/entities/weather.ts` | Domain types (above) |
| `src/features/weather/lib/weather-schemas.ts` | Zod schemas: `WeatherReadingSchema`, `RadarCellSchema`, `UnderpassFloodSchema`, `DetourRouteSchema` |
| `src/features/weather/lib/compute-detours.ts` | **Pure fixture router** `computeDetourSet(floods, graph, commuters): DetourRoute[]` — flooded edge weight ∞, covered edges preferred, returns delta/coveredPct |
| `src/features/weather/lib/radar-texture.ts` | 2D canvas texture: 20×20 fixture grid → bilinear 256 px `ImageData` band-mapped blue/cyan; registered via `map.addImage("radar-rain", …)` |
| `src/infrastructure/repositories/weather-repository.ts` | Mock repo: seeded readings + grid, indexed by tick |
| `src/infrastructure/repositories/reroute-repository.ts` | Mock repo: walkway graph + underpass states + `getDetours()` calling `computeDetourSet` |
| `src/infrastructure/fixtures/weather-fixtures.ts` | All §8 seed data (single source) |
| `src/features/weather/store/weather-ui-store.ts` | Zustand: `mode: "idle"|"auto"|"override"`, layers, selected marker/route, driver snapshot |
| `src/features/weather/hooks/use-weather-query.ts` / `use-reroute-query.ts` | React Query; `refetchInterval: 10_000`; reroute key = flood-state hash |
| `src/features/weather/components/` | `rain-mode-overlay.tsx` (map layers + radar texture), `rainfall-chip.tsx`, `flood-depth-feed.tsx`, `detour-panel.tsx`, `rain-safe-path-modal.tsx`, `demo-badge.tsx` |
| `src/lib/live-driver/weather-driver.ts` | Driver registered in shared driver registry; emits events below |

**MapLibre layers** (added on `map-canvas` `onMapReady`; layered: radar → underpass → detours above stations):

| Layer | Type | Spec |
| --- | --- | --- |
| `radar-pattern-fill` | `fill` | Full-extent polygon, `fill-pattern: "radar-rain"` (canvas texture); opacity crossfade 500 ms per tick |
| `radar-cell-bands` | `fill` | 20×20 cell GeoJSON, `fill-color` interpolated by `intensity` 0–5 (cyan-300→blue-600), opacity 0.18–0.55; visible zoom ≥ 13 |
| `underpass-flood` | `symbol` | Custom `flood-drop` canvas image (hollow = unknown depth); secondary circle glow layer |
| `detour-edge-covered` | `line` | Emerald `#10b981`, width 3, opacity 0.9, round joins |
| `detour-edge-flooded` | `line` | Red `#ef4444`, width 4, `line-dasharray [2,2]`, opacity 0.35 (excluded state) |
| `detour-edge-selected` | `line` | Amber `#f59e0b`, width 5, opacity 1, on card selection |

All line layers share one GeoJSON source per route set; repaints use `setData` + paint transitions (no layer add/remove churn). Marker ping rings are HTML overlays (CSS `animate-ping`, killed under reduced motion), re-anchored via `project()` on map move.

**Mock repository interfaces** (production-identical signatures, in-memory impls):

```ts
interface WeatherRepository {
  getCurrent(): Promise<WeatherReading>;
  getRadarGrid(): Promise<RadarCell[]>;
}
interface RerouteRepository {
  getWalkwayGraph(): Promise<WalkwayEdge[]>;
  getUnderpassFloods(): Promise<UnderpassFlood[]>;
  getDetours(input: { floods: UnderpassFlood[] }): Promise<DetourRoute[]>;
}
```

**Live-driver events:** `weather_tick` (10 s, mutates reading + grid), `rainfall_crossed_threshold` (20 mm/hr), `flood_detected` (seeded t≈5:00 / t≈6:30), `detour_recomputed` (post-flood). Store selector-driven UI; no hardcoded JSX data anywhere (README constraint).

**Env:** extend `src/lib/env.ts` with `NEXT_PUBLIC_DEMO_MODE: z.literal("true")` (selects mock registry at startup) — shared foundation per README.

**Test strategy (Vitest + Playwright, no new frameworks):**

| Test | Scope |
| --- | --- |
| `weather-schemas.test.ts` | Zod parsing of fixtures; rejects malformed depth/confidence |
| `compute-detours.test.ts` | Pure router: flooded edge excluded (∞ weight), covered preferred, empty detour set when no covered alternative |
| `radar-texture.test.ts` | ImageData dims, band → color mapping, no-rain (all-0) grid |
| `weather-ui-store.test.ts` | State machine: idle → auto on crossing tick; override suppresses auto; cleared override restores |
| `e2e/weather-rerouting.spec.ts` (Playwright) | `?demoSpeed=10`: assert banner at crossing, 4 flood markers at peak, detour card repaint, override chip, reduced-motion run (no ping animations) |

## 11. Demo Script & Acceptance

1. Open `/dashboard` → toggle **Rain Mode** → radar fades in at 12 mm/hr; inspect 2 pre-flooded markers (depth popovers).
2. Watch the chip climb; at 20 mm/hr **Rain Detour auto-enabled** — banner slides in, feed opens, flood #3 lands.
3. Flood #4 at 41 mm/hr: route A excluded (red dashed), covered route C highlighted emerald; "1,240 commuters rerouted".
4. Click a detour card → `easeTo` + selected stroke; open **Rain Safe-Path** commuter preview (read-only, id copy).
5. Toggle **manual override** → chip locks; clear it; rainfall drains below threshold → recovery banner.

**Acceptance criteria (verifiable):**
- Rainfall, radar intensity, flood states, depths, and routes derive exclusively from live-driver fixtures; no hardcoded JSX data.
- Auto-trigger is deterministic at exactly 20 mm/hr crossing; flood #3/#4 fire at seeded ticks (±1 tick tolerance).
- Manual override blocks all auto-transitions until cleared.
- DEMO badge visible whenever `NEXT_PUBLIC_DEMO_MODE=true`.
- Reduced-motion run shows data updates with zero ping/pulse/scale animations.
- Vitest suite (4 files) and Playwright `weather-rerouting.spec.ts` pass.

## 12. Dependencies

- Mock repositories: `weather-repository`, `reroute-repository` (new); mock provider registry (shared foundation)
- Live driver: `weather-driver` events above, registered in shared driver registry
- Shared fixtures: station exits + widths (Sprint 1), pedestrian counts (Sprint 2), exit VCI (Sprint 3)
- Shared components: `map-canvas.tsx` (`onMapReady`), `active-layers-panel.tsx` (add Rain Mode row), alert banner pattern (Sprint 3), `theme-store`, `env.ts` (+`NEXT_PUBLIC_DEMO_MODE`)
