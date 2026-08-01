# Mock UI PRD — Sprint 7: Multi-Agency Command Center

**Sprint reference:** `docs/sprints/sprint-07-command-center.md`
**Review standard:** 10/10 rubric (README § PRD Quality Rubric) — D1..D10 all ≥9
**Branch:** `feature/mock-ui` | **Env flag:** `NEXT_PUBLIC_DEMO_MODE=true`

## 1. Purpose & Demo Narrative (D1)

TransitFlow's first six sprints built single-station tools for individual operators. Sprint 7
escalates the product to the **enterprise B2G surface**: a multi-monitor War Room where
municipal authorities, police, and transit operators coordinate on one shared map — without
any real WebSocket, auth, or analytics infrastructure.

| Aspect | Content |
| --- | --- |
| User problem | Cross-agency congestion response is fragmented: Dishub, POLRI, KAI, and MRT each run separate tools, so double-parking chokes go unstaffed and response lead times are unmeasured |
| Why mock now | Prove the multi-agency coordination story to MAPID + Dishub Jakarta + Kemenhub before investing in Socket.io, Clerk orgs, and DuckDB; the mock replaces signaling with browser-native sync and analytics with fixtures |
| Stakeholder value | A 4-minute walkthrough showing one-click warden dispatch across agencies, sub-1s cross-screen sync, SLA tracking, and a Kemenhub CSV export — the artifacts a B2G procurement decision needs |
| Demo narrative | "One choke, four agencies, one screen": DISHUB operator spots a red zone, dispatches the nearest warden, POLRI/KAI/MRT screens reflect it live, SLA clock runs, executive export downloads — all from fixtures |
| Demo order | Tour position: after Commuter Portal (Sprint 6), before Predictive Surge (Sprint 8) — ends with the CSV export feeding the Sprint 12 Enterprise API narrative |

## 2. Personas & Roles (D2)

| Persona | Agency | Can do in the mock | Cannot do |
| --- | --- | --- | --- |
| **War-room operator** (Budi, DISHUB Jakarta) | DISHUB | Full control: dispatch wardens, ack incidents, scrub history, export CSV, switch screens | — (highest privilege, the demo protagonist) |
| **Agency chief** (Ibu Ratna, Kemenhub) | KEMENHUB | Read all KPIs + analytics, download executive CSV | Dispatch, ack, role switch |
| **Station master** (Andi, MRT Manggarai) | MRT | View-only screen B: map, ticker, his station's lead times | Dispatch, export |
| Police ops lead (Brigadir Sari) | POLRI | Dispatch police wardens only, view incident map | Export, KAI/MRT analytics |
| Rail ops supervisor | KAI | Train-impact analytics (delay-spill VCI), ack incidents | Dispatch (no KAI warden available demo times) |

Mock RBAC is a **role pill switcher** (`DISHUB / POLRI / KAI / MRT / KEMENHUB` in the KPI
strip) — not a login wall. Switching re-scopes data, permissions, and accent color; the
ticker notes `"viewing as DISHUB"`.

## 3. Information Architecture & Flows (D3)

| Entry point | Path | Home |
| --- | --- | --- |
| Sidebar item **Command Center** (new, `src/components/shared/sidebar.tsx`) | `/command-center` | War-room screen A |
| Aux display wall (same route, aux mode) | `/command-center?screen=b` | Screen B: map + ticker + sync chip |
| Dispatch card / SLA clock / analytics panels | anchors within war room | Always on-screen (no sub-pages) |

**End-to-end flows**

1. **Dispatch flow:** map choke zone click → dispatch card (nearest 3 wardens) → one-click
   dispatch → toast + ticker entry → warden IDLE→EN-ROUTE→ON-SITE progression → SLA clock
   starts → screen B reflects within <1s.
2. **Role flow:** pill switch → permission set + accent + data scope re-render (300ms fade);
   unauthorized controls disable with tooltip.
3. **Analytics flow:** time-slider scrub (7d/30d/60d) → heatmap replays fixture history +
   chart panels recompute → panel click opens detail tooltip.
4. **Export flow:** "Export CSV (Kemenhub)" → preview modal (summary table) → Blob download
   of real CSV.
5. **Sync flow:** open screen B → heartbeat "2 screens connected" → dispatch/ack events
   propagate → kill screen B → chip shows RECONNECTING → reopen → event log catches up.

## 4. Demo Surfaces & Component Specs (D4)

**Surface 1 — War Room (screen A, `/command-center`)**

- **KPI header strip:** 4 stat cells (Active Incidents, Wardens in Field, Median Lead Time,
  P95 Lead Time) + agency role pills + "2 screens connected" sync chip + DEMO badge.
- **Central map** (`map-canvas.tsx` precedent): MapLibre dark basemap, VCI choke `fill`
  layer (Sprint 3 zones), live warden markers (agency-colored circles with ETA ring), red
  pulse on `vci ≥ 80` zones.
- **Analytics rail (right, 380px):** 3 SVG panels — bottleneck trend (7/30/60d line),
  lead-time bars (median/p95), agency workload bars + time slider.
- **Bottom ticker:** last 5 incidents, mono timestamps, ack buttons.

**Surface 2 — Aux Screen (screen B, `?screen=b`)**

- Narrow display-wall variant: map + ticker + sync chip only; KPI strip collapsed to a
  single "SLA breaches" readout. Same zustand store — differences are pure layout.

| Component states (all surfaces) | Behavior |
| --- | --- |
| Default | Seeded: 8 incidents, 6 wardens, 1 warden mid-EN-ROUTE at demo start |
| **No wardens available** | Dispatch card empty state: `"No wardens available in this jurisdiction"` + "Notify Dishub ops" fallback button (toast) |
| **Dispatch conflict** | Target warden already EN-ROUTE/ON-SITE → card locks, rose border, `"W-04 is already en route on dispatch #D-118"`; alternate warden suggested |
| **Analytics empty** | Filter to agency with no history → chart empty state `"No analytics yet for this agency — dispatch activity will appear here"` + CTA to switch back |
| **Offline sync** | Screen B closed/`storage` event missing → chip `SYNC — RECONNECTING` (amber pulse); on return, queued events flush; A keeps working |
| Loading / error | Skeletons on first mount; repository error → inline retry card `"Could not load dispatch data"` |

## 5. Interactions & Micro-interactions (D5)

| Micro-interaction | Spec |
| --- | --- |
| Warden ETA ring | SVG circle, `stroke-dashoffset` animates 1s-linear per second against ETA (e.g., 04:12); ring color = agency accent; pulse when EN-ROUTE |
| Status progression | Chevron timeline IDLE→EN-ROUTE→ON-SITE; EN-ROUTE step glows + `animate-pulse` (1.6s loop); transition to next step: 250ms scale+fade of the dot |
| SLA clock | Mono `05:41` ticking 1s; color slate→amber at 75% of target (8:00 median), rose past 100%; "SLA 05:41 / target 08:00" tooltip |
| Ticker entrance | New incident row slides in `translate-x-8 → 0`, 300ms `cubic-bezier(.2,.8,.2,1)`; auto-fades after 20s (400ms); ack → green check + row collapses |
| Role switch | Pills with focus ring; content fade 300ms; disabled controls get `cursor-not-allowed` + tooltip |
| Heatmap scrub | Slider (7d/30d/60d) with snap; replay animates frame per 250ms step; scrubber shows `label` date |
| Dispatch click | Map marker click → card springs (200ms `scale .98→1`); dispatch button press → `scale-95` feedback + Sonner toast |
| Keyboard | All controls focusable; `1..4` switches agency, `Space` acks top ticker incident, `,`/`.` scrubs slider |

All animations respect `prefers-reduced-motion` (see D9).

## 6. Visual Design Spec (D6)

Dark-first war room **regardless of app theme** (display-wall convention); reuses
`app-shell.tsx` tokens: `bg-[#070a11]`, `slate-100` text, `selection:bg-blue-500/20`.

| Token | Value / rule |
| --- | --- |
| Panel language | `bg-slate-900/70` panels, `border-slate-800`, `rounded-xl`, 1px borders, backdrop blur on overlays |
| Mono-for-data | All numbers/timers/ETAs/KPIs in mono stack (`font-mono`); UI labels sans (`font-sans`) |
| Agency accents | DISHUB `#38bdf8` (sky), POLRI `#fb7185` (rose), KAI `#a78bfa` (violet), MRT `#34d399` (emerald), KEMENHUB `#fbbf24` (amber) — functional hues, not brand fidelity (realism note) |
| Data colors | VCI: green `<50` / amber `50–79` / rose `≥80` (Sprint 3 precedent); SLA: amber/rose thresholds |
| Type scale | KPI numerals `text-2xl` → `clamp(1.5rem, 2.4vw, 2.25rem)` for 4K walls; ticker `text-xs`; panel titles `text-sm uppercase tracking-wider text-slate-400` |
| DEMO badge | `src/components/shared` watermark chip top-right: `DEMO MODE` mono amber, non-interactive, `aria-hidden` |
| Spacing | 4px grid; panel padding `p-4`; rail gap `gap-3`; KPI strip `gap-2` |
| Iconography | Lucide only: `MapPin`, `Radio`, `Timer`, `Download`, `Users`, `AlertTriangle` |

## 7. Content & Copy (D7)

| Context | Copy |
| --- | --- |
| Dispatch toast | `"W-03 (A. Pratama) dispatched to Stasiun Manggarai Gate C — ETA 04:12"` |
| Conflict toast | `"W-04 is already en route on dispatch #D-118 — nearest free warden W-01"` |
| No wardens | `"No wardens available in this jurisdiction"` / button `"Notify Dishub ops"` |
| Empty analytics | `"No analytics yet for this agency — dispatch activity will appear here"` |
| Sync states | `"2 screens connected"` / `"SYNC — RECONNECTING"` / `"SYNC — OFFLINE"` |
| SLA | `"SLA 05:41 / target 08:00"`; breach: `"SLA BREACH — D-093 lead 09:12"` |
| Ticker ack | `"Incident INC-221 acked by DISHUB"` |
| Export | Buttons `"Export CSV (Kemenhub)"`, `"Export Excel"`; modal title `"Executive Summary — Kemenhub"`, CTA `"Download CSV"` |
| KPI labels | `"Active Incidents"`, `"Wardens in Field"`, `"Median Lead Time"`, `"P95 Lead Time"` |
| Viewing note | `"viewing as DISHUB"` (ticker left edge) |

English-only (not a public surface — no `id` split needed; see Sprint 11 for i18n).

## 8. Mock Data Spec (D8)

Typed fixtures in `src/lib/fixtures/command-center.ts` (seeded PRNG, `seed = "CC-2026-07"`),
extending the shared dataset (stations/exits, VCI from Sprint 3).

| Fixture | Type (TS) | Seeds | Realism notes |
| --- | --- | --- | --- |
| Warden | `{ id, name, agency, lat, lng, status: "IDLE"\|"EN-ROUTE"\|"ON-SITE", etaSeconds, dispatchId?, shiftStart }` | 6 (3 DISHUB, 2 POLRI, 1 KAI) | Indonesian names (A. Pratama, B. Lestari, D. Nugroho); positions near Manggarai/Dukuh Atas |
| ChokeZone | `{ id, exitId, lngLat, vci, radiusM }` | 12 | Derived from Sprint 3 exits; 2 seeded `≥80` |
| Incident | `{ id, ts, zoneId, vciAtWarning, severity, agency, status: "OPEN"\|"ACKED"\|"RESOLVED", ackedBy? }` | 40 records / 8 live | IDs `INC-201..`; 1 paired with an in-flight dispatch |
| Dispatch | `{ id, wardenId, incidentId, agency, startedAt, status, statusTransitions }` | 40 | Lead times drawn from seeded lognormal: median 04:10, p95 07:30 |
| LeadTimeStats | `{ medianSeconds, p95Seconds, breaches, byAgency }` | derived | Breach threshold 08:00 |
| BottleneckPoint | `{ ts, zoneId, vci }` | 60d × 12 zones × 96/day | 15-min cadence, sine + drift + jitter; extends Sprint 3 24h history |
| AgencyPerm | `{ agency, dispatch, analytics, export, ack, accent }` | 5 | Fixed matrix per §2 |

## 9. Liveness & Behavior (D9)

| Rule | Deterministic spec |
| --- | --- |
| Incident cadence | New incident every 40s ±10s (seeded jitter) into ticker; analytics recompute on insert; max 5 ticker rows |
| Warden drift | Position eases toward dispatch target every 5s (`warden_position_drift`); ±0.00015° idle jitter; live-driver ticks from zustand timer, not rAF |
| Dispatch machine | IDLE→EN-ROUTE (60s nominal, 90s for far warden)→ON-SITE (90s)→IDLE; `statusTransitions` timestamps recorded per step; progress = elapsed/step budget |
| SLA clock | Ticks 1s from VCI warning timestamp; breach at 08:00 (median target) |
| Sync latency | Target <1s: BroadcastChannel instant; `storage` fallback ≤100ms; measured via `performance.now` console trace; acceptance checks visibility on screen B |
| Heartbeat | Every 5s `HEARTBEAT` message; >12s silence → RECONNECTING; event log persists in `localStorage` and flushes on return |
| `prefers-reduced-motion` | All >150ms animations degrade to 100ms opacity steps; ticker slide→fade; ETA ring static; SLA clock still ticks (time data, not motion) |
| Tab visibility | `document.hidden` → driver timers coalesce; on visible, catch-up via timestamp delta so SLA stays honest |

## 10. Tech Specs (D10)

**Stack fixed — no new frameworks.** Next.js 16 App Router, React 19, TS strict, Tailwind v4,
MapLibre GL v6, Zustand 5, TanStack React Query 5, RHF+Zod (unused here — no forms; noted for
consistency), Axios (unused — repos are in-memory), Sonner, Lucide, Vitest 4, Playwright 1.62.
Cross-screen sync and charts are **in-house** (BroadcastChannel + SVG) — no Socket.io, no
Recharts/Chart.js, no new deps.

| Area | Spec |
| --- | --- |
| Route | `src/app/command-center/page.tsx` (reads `useSearchParams` → `screen="b"` aux variant); nav entry added in `src/components/shared/sidebar.tsx` |
| Feature dir | `src/features/command-center/` — `components/` (`war-room-grid`, `kpi-header-strip`, `agency-switcher`, `sync-indicator`, `dispatch-card`, `warden-eta-ring`, `sla-clock`, `incident-ticker`, `analytics-rail`, `heatmap-replay-layer`, `export-modal`), `charts/` (`svg-line-chart.tsx`, `svg-bar-chart.tsx` — repo precedent: inline SVG in `active-layers-panel.tsx`, Sprint 3 sparkline polyline), `store/`, `hooks/`, `lib/`, `state/` |
| War-room grid | `war-room-grid.tsx` CSS Grid tracks: `grid-template-columns: minmax(0,1.6fr) 380px`; `grid-template-rows: auto minmax(0,1fr) auto`; KPI strip `repeat(12, minmax(0,1fr))` with 3-col cells; ticker spans full width; `clamp()` type for 4K walls |
| Mock RBAC store | `store/rbac-store.ts` — zustand: `{ agency, permissions, accent }`, `setAgency()`; permissions fixture-driven; accent sets `--agency-accent` CSS var consumed by `bg-(--agency-accent)` |
| Dispatch state machine | `state/dispatch-machine.ts` — pure TS: `nextDispatchState(state, elapsedMs, action)`; timers per step (D9); no effects in reducer |
| Command store | `store/command-center-store.ts` — zustand: incidents, ticker, SLA, screen role A/B, sync status |
| Sync channel | `lib/sync-channel.ts` — `BroadcastChannel("transitflow.cc.sync.v1")` + `localStorage` key `tf:cc:events` (storage-event fallback); message schema: `{ type, dispatchId?, wardenId?, agency, incidentId?, ts }` for `DISPATCH_STARTED \| DISPATCH_STATUS \| INCIDENT_ACKED \| INCIDENT_CREATED \| ROLE_SWITCH \| HEARTBEAT`; persists last 50 events under `tf:cc:eventlog` |
| Repos (interfaces) | `src/infrastructure/repositories/dispatch-repository.ts`: `listWardens()`, `listNearestWardens(lngLat, n)`, `dispatch(wardenId, incidentId)`, `listDispatches()`; `analytics-repository.ts`: `bottleneckTrend(days)`, `responseLeadTimes(days)`, `agencyWorkload(days)` — in-memory, fixture-backed, same shape as future API clients |
| Live driver | zustand timers emitting: `incident_created` (40s±10s), `warden_status_tick` (1s), `warden_position_drift` (5s), `sla_tick` (1s), `sync_heartbeat` (5s) |
| CSV export | `lib/csv-export.ts` — build header row `incident_id,date,agency,choke_exit,vci_at_warning,warden_eta_s,lead_time_s`, `Blob(["text/csv;charset=utf-8"])` + `URL.createObjectURL` + `<a download="transitflow-kemenhub-YYYY-MM-DD.csv">`; Excel button mocks `.xls` via same CSV (realism note: real Excel needs SheetJS — out of scope) |
| Hooks | `hooks/use-cross-screen-sync.ts` (subscribe + flush), `hooks/use-dispatch-machine.ts` (rAF-free interval), `hooks/use-analytics-query.ts` (React Query over repos, `staleTime: 15s`) |
| Vitest | `state/dispatch-machine.test.ts` (transitions + timers), `lib/csv-export.test.ts` (headers/escaping/download), `lib/sync-channel.test.ts` (jsdom: postMessage + storage fallback), `infrastructure/repositories/dispatch-repository.test.ts` (nearest-3 ordering, conflict rejection) |
| Playwright | `e2e/command-center.spec.ts`: role pill re-scopes KPIs + accent; dispatch completes EN-ROUTE→ON-SITE; two-context sync <1s (`newPage()` second tab, `waitForFunction` on DOM); export triggers `download` event; `page.emulateMedia({ reducedMotion: "reduce" })` verifies no long animations; desktop + 1280×720 |

## 11. Demo Script & Acceptance

1. Open `/command-center` and `/command-center?screen=b` side by side — sync chip reads `"2 screens connected"` within 2s.
2. Switch roles DISHUB → POLRI — accent, KPIs, and permitted controls re-scope.
3. Click the seeded red choke zone at Manggarai Gate C → dispatch card lists nearest 3 wardens with ETA rings.
4. One-click dispatch W-03 → toast, ticker entry, SLA clock starts, screen B shows it **visibly <1s**; warden progresses EN-ROUTE (60s) → ON-SITE (90s) with status timeline.
5. Force conflict: re-open card on the same warden → locked with `"W-03 is already en route"`.
6. Scrub 7d/30d/60d — heatmap replays fixture history; lead-time bars recompute.
7. Close screen B → `SYNC — RECONNECTING`; reopen → event log flushes.
8. Export CSV (Kemenhub) → preview modal → download opens with real rows.

**Acceptance:** role switching, dispatch machine, <1s cross-screen sync, SLA clock, heatmap
replay, and CSV export all work from fixtures with no backend; every number traces to the
fixture/live-driver state (no hardcoded JSX); DEMO badge visible; Vitest + Playwright suites
green; no new dependencies.
