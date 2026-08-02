# Mock UI PRD — Sprint 8: Predictive Crowd Surge & Event Simulation

**Sprint reference:** `docs/sprints/sprint-08-predictive-surge.md`
**Foundations:** `docs/mock-ui/README.md` (shared fixtures, live driver, DEMO badge, 10/10 rubric)

## 1. Purpose (D1)

The platform's first three sprints react to congestion after it happens. Sprint 8 is the
turning point: **predict** choke risk 48h ahead so operators act *before* the crowd
arrives. The mock demonstrates the full predictive workflow — 48-hour VCI forecast curves
driven by train schedules + events + weather, a "What-If" scenario builder, and
24-hour-advance early warnings — with no ML backend required.

**Demo narrative:** a stakeholder asks *"What happens to Senayan MRT if the concert ends at
21:00 and the train is delayed?"* — the operator answers it live on the map: curves morph,
Exit 3 forecasts +18 VCI, and an advance notification goes out before the peak forms.

**Stakeholder value:**

| Stakeholder | Value shown |
| --- | --- |
| Dishub operations | Proactive vs reactive: warning fires ~24h before the surge, not at VCI 92 in real time |
| Transit operators (KAI/MRT) | Quantifies schedule/event impact per exit before committing dispatch |
| Executives | De-risks the Sprint 8 ML pipeline investment: same UX, fixtures stand in for XGBoost/Prophet |

## 2. Personas & Roles (D2)

| Persona | In the mock they can | They cannot |
| --- | --- | --- |
| **Station operator** (Senayan MRT front-line) | Toggle the 48h layer, read forecast curves, see the Predicted Surge card, send Advance Notification | Edit scenario inputs or dispatch wardens (Sprint 7) |
| **Predictive analyst** (Dishub data desk) | Build/run What-If scenarios, compare presets, read delta chips and confidence bands | Trigger real dispatch; export comes in Sprint 7 rail |
| **Command-center dispatcher** (Sprint 7) | See advance notifications land in the Command Center ticker, acknowledge | Change forecast inputs; forecast lives on `/dashboard` |

## 3. Information Architecture & Flow (D3)

```
/dashboard (existing route — hosts all Sprint 8 surfaces)
├── Active Spatial Layers panel ──► "48h Forecast" toggle (Sprint 3 layer list + 1)
├── Right rail (tabbed: Forecast | Events | What-If) ← home of all surfaces
│   ├── Early Warning card (top slot, appears on threshold cross)
│   ├── Forecast curves (per-station SVG charts) + Event calendar + Scenario builder
└── Map canvas (MapLibre) ──► forecast zones render above live zones when toggled
/command-center (Sprint 7) ──► bottom ticker consumes `early_warning_dispatched`
```

**Primary flow:** toggle 48h Forecast → open Forecast tab → read Friday 21:00 peak → click
GBK Concert in Events tab (exits highlight) → What-If tab → select preset → Run Simulation →
curves morph + delta chips → Early Warning card appears → Send Advance Notification →
Command Center ticker updates. **Home:** every surface lives in the right rail of
`/dashboard`; no new routes; `?tab=what-if` deep-link supported for direct demo entry.

## 4. Demo Surfaces & Component Specs (D4)

### 4.1 48h Forecast Layer (map)
- New entry **"48h Forecast"** in Active Spatial Layers (`active-layers-panel.tsx` precedent).
- Renders projected VCI per exit zone as **dashed/stippled** geometry (see D6) above the live
  Sprint 3 heatmap; legend swatch "Forecast (dashed)" vs "Live (solid)".

### 4.2 Forecast Curves Panel (Forecast tab)
- Per-station 48-hour line chart (in-house SVG): forecast mean line, confidence band fill,
  "now" marker that advances every tick, dashed event markers, peak flag on max point.
- Below each chart: exit chips with peak VCI + hour ("Exit 3 — peak VCI 92 · Fri 21:00").

### 4.3 Event Calendar & Timeline (Events tab)
- List of 6 upcoming events; each row: name, date/time, venue, **confidence** chip,
  source chip (GTFS / Event feed), affected-exit count.
- Selecting a row highlights affected exits on the map and filters the Forecast tab.

### 4.4 What-If Scenario Builder (What-If tab)
- Variable controls: train delay (±min slider), event end time (select), weather (dry /
  light rain / heavy), holiday multiplier (checkbox + factor).
- **Presets:** "Train Delay + Concert Ends 21:00", "Rain + Eid Eve", "Normal Tuesday (Baseline)".
- **Run Simulation** button → morph animation; delta chips appear on affected exit cards.

### 4.5 Early Warning Dispatch
- When any forecast hour ≥ 80 within the rolling 24h window: **"PREDICTED SURGE"** card
  slides into the rail top with peak info + **Send Advance Notification** button.

**Component states (all surfaces):**

| State | Behavior |
| --- | --- |
| No events | Calendar empty state: *"No events in the next 7 days — forecast reflects schedule baseline only."* Map shows baseline forecast only |
| Loading | Curve skeletons (shimmer 800ms) while React Query fetches; map layer hidden until series resolve |
| Scenario running | Run button → spinner + "Simulating…", curves at 60% opacity, progress label "Recomputing forecast…" (~3s) |
| Forecast convergence | First 6 forecast hours blend toward live VCI; hour-0 point pinned to live score; "blending with live VCI" indicator dot |
| Early-warning triggered | Card slides in; curve point flashes red 2×; after send: "Notification sent to 3 station masters" with ticker link |
| Error / stale | *"Forecast unavailable — recalculating. Try again in a moment."* + Retry (refetches repository) |
| Threshold reached via scenario | Card appears from scenario run with source tag "Scenario" vs "Baseline" |

## 5. Interactions & Micro-interactions (D5)

| Interaction | Spec |
| --- | --- |
| Curve morph (Run Simulation) | Path `d` interpolates baseline → scenario points over **3000ms**, ease `cubic-bezier(0.4, 0, 0.2, 1)`; rAF-driven, no libs; snap instantly under `prefers-reduced-motion` |
| Delta chips | `+18 VCI` chip on affected exit card: scale-in 0.9→1.0 + fade, **150ms**, ease-out; amber (positive) / emerald (negative); connector line to the curve's max-delta hour |
| Event selection | Row gains blue left-border + check; affected zones get pulsing outline (`animate-pulse`, 1.6s loop); Forecast tab filters to affected exits |
| Curve hover | Crosshair + dot; mono tooltip "Fri 21:00 · VCI 92 · band 80–104"; keyboard: focusable series (tab) + arrow keys scrub 1h |
| Threshold crossing | Curve point flashes rose 2× (200ms on/off); card slides from right **300ms** ease-out |
| Layer toggle | Same pattern as Sprint 3 layers (check + blue highlight, 150ms) |
| Retry | Refetches with `refetch()`; shows skeleton again |

## 6. Visual Design Spec (D6)

- Panels match `stat-chip.tsx` precedent: `bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border-slate-200/80 dark:border-white/[0.08] rounded-2xl`; labels `font-mono text-[9px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400`.
- **Mono-for-data, sans-for-UI:** all VCI numbers, hours, band values in `font-mono`; action labels in sans.
- **Color semantics:** live VCI = `blue-500` (solid, full opacity); forecast mean = `violet-500` (SVG `#8b5cf6`), band fill `violet-500/10`; warnings amber-500; choke risk ≥80 rose-500; delta chips amber/emerald.
- **Forecast vs live distinction on map:** live = solid `fill` full opacity; forecast = `fill` at 35% opacity + dashed `line` outline (`line-dasharray: [2, 2]`) — dashed = projected, solid = observed. Legend swatches for both.
- Confidence band: area between `bandLow`/`bandHigh`, 10% fill, same hue.
- DEMO badge: shared mock-ui watermark visible on every Sprint 8 surface (README foundation).
- Dark + light both supported via `dark:` variants; grid lines `slate-200 dark:slate-800`; zero-data baseline at VCI 0–10 dashed.

## 7. Content & Copy (D7)

- Layer label: **"48h Forecast"**; panel header: **"Predictive Surge"**; tabs **Forecast / Events / What-If**.
- Event names (seeded): "GBK Concert — Stadium Night 2026", "Senayan Stadium — League Final", "Istora — Badminton GP", "Eid Holiday Exodus — H+2", "GTFS: KRL Line 2 Schedule Change", "GTFS: MRT Feeder Cutback".
- Confidence chips: "High (94%)", "Medium (71%)", "Low (58%)"; source chips "GTFS", "Event feed".
- Scenario presets: **"Train Delay + Concert Ends 21:00"**, **"Rain + Eid Eve"**, **"Normal Tuesday (Baseline)"**.
- Warning card: **"PREDICTED SURGE — Senayan MRT Exit 3 — VCI 92 forecast Fri 21:00"** + "24h advance window" chip; button **"Send Advance Notification"**; success toast "Advance notification sent to 3 station masters."; source tag "Baseline" / "Scenario".
- Empty: "No events in the next 7 days — forecast reflects schedule baseline only."
- Stale: "Forecast unavailable — recalculating. Try again in a moment."
- Delta chips: "+18 VCI", "−6 VCI"; tooltip: "Fri 21:00 · VCI 92 · band 80–104".

## 8. Mock Data Spec (D8)

**Typed fixture schema** (mirrors zod in D10):

```ts
interface ForecastEvent {
  id: string; name: string;
  kind: "concert" | "holiday" | "schedule-change";
  startsAt: string; // ISO hour
  endsAt: string;
  venue: string;
  affectedExitIds: string[];
  amplitude: number;      // peak VCI contribution A_e
  sigmaHours: number;     // bell width
  source: "GTFS" | "event-feed";
  confidence: number;     // 0.58–0.94
}
interface ForecastSeries {
  exitId: string; generatedAt: string; horizonHours: 48;
  points: { hour: string; vci: number; bandLow: number; bandHigh: number }[]; // length 48
}
interface ScenarioPreset { id: string; name: string; input: ScenarioInput; expectedDeltaVci: number }
```

**Deterministic fixture model** — `vcî(exit, h) = B(exit, h) × E(h) × W(h) + N(exit, h)`:

| Term | Definition |
| --- | --- |
| `B` schedule baseline | `β₀ + β₁·φ((h−8)/2) + β₂·φ((h−19)/2)` (standard-normal peaks at 08:00 & 19:00; weekend β's ×0.6) |
| `E` event multiplier | `1 + Σ A_e·φ((h−t_e)/σ_e)` over active events |
| `W` weather | 1.0 dry / 1.15 light rain / 1.30 heavy (Sprint 5 fixture, rain window only) |
| `N` seeded noise | `0.5·(r_h + r_{h−1})·3`, `r ~ U(−1,1)` from mulberry32 seeded by `` `${exitId}:${dateKey}` `` |
| Band | `band(h) = 2 + (h/48)·10`; `bandLow = max(0, vcî−band)`, `bandHigh = min(120, vcî+band)` — confidence degrades with horizon |

**Seed counts & realism:** 8 exits (shared Sprint 3 geometry), 48 forecast points/exit +
24h observed replay for convergence visual; 6 events (3 concerts, 1 holiday, 2 GTFS
changes); 3 presets; Senayan Exit 3 peaks VCI 92 under GBK (Fri 21:00) so the threshold
moment lands in-demo; all values clamp to 0–120.

**Scenario mutation rules (pure functions):** `applyTrainDelay` (shift 19:00 peak right by
delayMin, cubic-resample), `applyEventShift` (collapse event bell to new end time),
`applyRain(level)`, `applyHoliday(factor)`; `composeScenario(base, input)` returns
`{ series, deltas }` where `deltas[exitId] = max_h(vcî_scenario − vcî_base)`.

## 9. Liveness & Behavior (D9)

| Rule | Spec |
| --- | --- |
| Tick | 1 simulated hour = **15s real time** (`forecast_tick`); "now" marker + window slide every 15s; all series derive from seed + elapsed tick count → byte-identical replays |
| Convergence | Hour-0 point pinned to live VCI (Sprint 3 driver); blend weight `1 − h/6` for first 6 forecast hours |
| Threshold | Warning fires when any forecast hour ≥ **80** inside the rolling 24h window; seeded GBK event starts 26h out → crosses at ~tick 8 (2 min into demo) |
| Reduced motion & tab visibility | `prefers-reduced-motion`: morph snaps, no pulse/flash/slide — fade-only (150ms); rAF-gated animations pause when hidden, catch up ≤ 1 tick (no burst) |
| Driver events | `forecast_tick`, `forecast_threshold_crossed`, `scenario_computed`, `early_warning_dispatched` |

## 10. Tech Specs (D10)

**Stack (fixed):** Next.js 16 App Router, React 19, TS strict, Tailwind v4, MapLibre GL v6,
Zustand, TanStack React Query, React Hook Form + Zod, Axios, Sonner, Lucide, Vitest,
Playwright. **No new frameworks or chart libs** — charts are in-house SVG.

**Files (new):**

| Path | Responsibility |
| --- | --- |
| `src/features/predictive/forecast-view.tsx` | Right-rail panel shell + tabs |
| `src/features/predictive/components/forecast-curve-chart.tsx` | In-house SVG: mean line, band, now marker, event markers, morph animation |
| `src/features/predictive/components/forecast-layer-controller.tsx` | Adds/removes MapLibre forecast layers on toggle |
| `src/features/predictive/components/event-calendar.tsx` | Event list, selection, highlight wiring |
| `src/features/predictive/components/scenario-builder.tsx` | RHF + Zod form, presets, Run Simulation |
| `src/features/predictive/components/early-warning-card.tsx` | Warning card + advance notification |
| `src/features/predictive/store/forecast-store.ts` | Zustand: `layers`, `activeEventId`, `runningScenarioId`, `warning` |
| `src/features/predictive/hooks/use-forecast-series.ts` | React Query `useQuery`, staleTime 30s |
| `src/lib/forecast/fixture-model.ts` + `.test.ts` | Deterministic generator (D8 math) + Vitest |
| `src/lib/forecast/scenario.ts` + `.test.ts` | Pure mutation rules + Vitest |
| `src/lib/forecast/schemas.ts` | Zod: `forecastSeriesSchema`, `forecastEventSchema`, `scenarioInputSchema` — parsed at repository boundary |
| `src/mocks/repositories/forecast-repository.ts` | In-memory impl of interface below |
| `src/mocks/fixtures/forecast.ts` | Events, presets, expected deltas |
| `src/lib/live-driver/forecast-driver.ts` | Tick timer, threshold watcher, event emitter |

**Mock repository interface:**

```ts
interface ForecastRepository {
  getSeries(exitId: string): Promise<ForecastSeries>;
  getSeriesForExitIds(ids: string[]): Promise<ForecastSeries[]>;
  getEvents(from: Date, to: Date): Promise<ForecastEvent[]>;
  getScenarioPresets(): Promise<ScenarioPreset[]>;
  runScenario(input: ScenarioInput): Promise<{ series: ForecastSeries[]; deltas: Record<string, number> }>;
}
```

**MapLibre layer spec:** zones reuse Sprint 3 150m exit buffers; two layers —
`forecast-fill` (`type: "fill"`, `fill-opacity: 0.35`, color ramp per VCI band) and
`forecast-outline` (`type: "line"`, `line-dasharray: [2, 2]`, `line-width: 1.5`) — inserted
below the live heatmap layer (live stays on top); removed on toggle-off.

**Env & validation:** gated by `NEXT_PUBLIC_DEMO_MODE=true`; zod schemas are the contract —
invalid fixture output fails fast in dev via `.parse()`.

**Test strategy (Vitest):** determinism (same seed → identical series), hour-0 equality
with live VCI, band monotonicity (`bandLow ≤ vci ≤ bandHigh`), scenario math (delay shifts
peak hour, rain raises values, deltas match seeded expectations), threshold crossing at 80.

**Playwright:** load `/dashboard` → toggle "48h Forecast" (dashed layer visible) → open
Events → click GBK Concert (exits highlight) → run preset (morph completes, "+18 VCI" chip)
→ warning card + advance notification → ticker event in `/command-center`; reduced-motion
variant asserts instant morph.

## 11. Demo Script

1. Open `/dashboard` → toggle **"48h Forecast"** — violet dashed zones above live heatmap
2. Forecast tab: Friday 21:00 peak flagged on Senayan Exit 3, confidence band visible
3. Events tab → click **GBK Concert** — Senayan exits pulse-highlight; curves filter
4. What-If → preset **"Train Delay + Concert Ends 21:00"** → Run Simulation → curves morph
   over 3s; **"+18 VCI"** chip on Exit 3
5. Early Warning card appears (≥80 in 24h) → **Send Advance Notification** → toast +
   `/command-center` ticker event; optional: run "Rain + Eid Eve" for negative deltas

**Acceptance:** all curves/deltas/warnings derive from the deterministic fixture model via
the repository + live driver; no ML calls; DEMO badge visible; morph respects
`prefers-reduced-motion`; Vitest + Playwright suites green.

## 12. Dependencies

- Mock repositories: `forecast-repository` (new), `vci-repository` (Sprint 3), `weather-repository` (Sprint 5)
- Live driver: `forecast_tick`, `forecast_threshold_crossed`, `scenario_computed`,
  `early_warning_dispatched`; ticker consumption in Sprint 7
- Shared fixtures: VCI history + exit geometry (Sprint 3), weather windows (Sprint 5), station masters (Sprint 7)
- Shared components: `stat-chip`, `active-layers-panel`, `map-canvas`, alert banner, DEMO badge
