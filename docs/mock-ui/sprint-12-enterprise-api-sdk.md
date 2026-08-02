# Mock UI PRD — Sprint 12: Enterprise API / SDK

**Sprint reference:** `docs/sprints/sprint-12-enterprise-api-sdk.md`

## Purpose

The product's final mile: TransitFlow stops being a command-center tool and becomes an
**open smart-city infrastructure standard** — live station choke data published as a
public REST/GeoJSON API for third-party navigation apps (Grab, Gojek, Moovit, Google
Maps), a TypeScript SDK (`@transitflow/sdk`), an autonomous traffic-signal integration
(NTCIP-style green-light extension when VCI ≥ 85), and enterprise SLA/status surfaces
(99.9% uptime, <50 ms GeoJSON target).

**Why the mock exists now:** no real gateway, Redis quota store, or ATCS adapters exist
yet. The mock proves the whole enterprise story to stakeholders (MAPID, Dishub,
integrators, third-party developers) with real Next.js route handlers and fixture data,
so architecture decisions (rate-limit policy, SLA targets, signal trigger thresholds)
are validated before infrastructure spend.

**Stakeholder value:** third-party apps de-risk crowding; cities get vendor-neutral
open data + autonomous traffic response; operations get SLA-proof with the Command
Center (Sprint 7). **Demo narrative:** "Watch TransitFlow hand its live data to a
developer, a navigation app, and a traffic-light controller — and guarantee it in
writing" — the finish of the Sprints 2–12 guided tour (README demo order).

## Personas & Roles

| Persona | Role | Can do in the mock | Cannot do |
| --- | --- | --- | --- |
| **Rina** — third-party developer (Grab / Gojek / Moovit) | External consumer | Browse catalog, execute explorer calls, read GeoJSON, copy curl/TS snippets, run SDK console, watch her own quota | No ops surfaces; no signal controls; no quota override |
| **Dewi** — smart-city integrator (Dishub / ATCS vendor) | Public-sector integrator | Inspect signal board + NTCIP adapter log, buffer-zone webhook, forecasts, SLA charts, incidents | Cannot mutate signal states (board is view-only; toggle is a demo simulation, clearly badged) |
| **Andi** — platform ops (TransitFlow) | Owner | Status page, uptime ring, p50/p95 charts, incident feed, health checks, per-key quota telemetry | Cannot change SLA numbers (fixture-driven) |

## Information Architecture & Flow

Entry points: **header nav "Developers"** (primary) + **"Status"** (link, mirrored in
footer and on every developers sub-page). Developer portal is a tabbed workspace, not a
separate app:

| Route | Surface | Home of |
| --- | --- | --- |
| `/developers` | Portal landing | Endpoint catalog, API key panel, code samples |
| `/developers/explorer` | Live API Explorer | Param form, response panel, mini-map preview |
| `/developers/playground` | SDK Playground | In-browser console, completion sidebar, snippet generator |
| `/developers/signals` | Traffic Signal Integration | NTCIP status board, adapter event log |
| `/status` | Status & SLA | Uptime, latency charts, incidents, health checks |

**Flow 1 (developer onboarding):** `/developers` → copy API key → explorer → execute →
badge <50 ms → copy snippet. **Flow 2 (integrator):** signals board → watch SIG-02 cross
VCI 85 → NTCIP log entry → green-extension badge. **Flow 3 (ops):** `/status` → uptime
ring → incident card → latency charts ticking. Deep links: every catalog row links to
the explorer pre-filled; every log entry links to its intersection row.

## Demo Surfaces

### 1. Developer Portal (`/developers`)
- **Endpoint catalog:** 4 cards — `GET /api/v1/hubs`, `GET /api/v1/hubs/{id}/exit-status`,
  `GET /api/v1/buffer-zones/active` (Sprint 4 webhook), `GET /api/v1/forecasts`
  (Sprint 8) — each with method chip, description, code samples (**curl / JS / TS** tabs),
  and a "Try in Explorer" link. States: default / skeleton loading / error toast.
- **API key panel:** mock key `tf_live_jkt_9f3k2m` with copy button, usage meter
  (requests vs 30-token bucket), `x-ratelimit-limit: 30` / `x-ratelimit-remaining`
  readouts. States: **active / quota exhausted** ("Quota exhausted — token bucket
  refills in ~30s" + meter at 0) / key copied toast.

### 2. Live API Explorer (`/developers/explorer`)
- **Param form:** endpoint select → dynamic fields (hub select, exit select, `format`
  JSON/GeoJSON radio) via React Hook Form + Zod. States: default / **invalid params**
  (inline `"Hub is required"`) / **endpoint loading** (skeleton rows, button spinner).
- **Response panel:** HTTP status chip, syntax-highlighted JSON (in-house tokenizer),
  latency badge, headers strip. States: **empty** ("No requests yet — execute an
  endpoint to populate the response panel.") / loading / **success** (type-in effect) /
  404 `HUB_NOT_FOUND` / **429 rate-limited** (banner + auto-refill countdown) /
  500 `UPSTREAM_DEGRADED`.
- **Mini-map preview:** MapLibre canvas rendering the returned GeoJSON layer.
- Invalid params and 429 are **non-destructive**: previous response stays visible, error
  banner overlays.

### 3. SDK Playground (`/developers/playground`)
- **Console:** banner prompt `@transitflow/sdk v1.0.0-mock — type getExitStatus('dukuh-atas', 'B')`,
  code input, Run button, result echo (object or error), command history (`↑`/`↓`).
  Typed fixture SDK functions: `getHubs()`, `getExitStatus(hubId, exitId)`,
  `getActiveBufferZones()`, `getForecast(hubId, hours)`.
- **Completion sidebar:** function signatures + return types from the typed fixture SDK
  surface; click inserts into console.
- **Snippet generator:** "Generated snippet" modal with curl/TS equivalents of the last
  call; copy button + Sonner toast.

### 4. Traffic Signal Integration Panel (`/developers/signals`)
- **Signal status board:** 6 intersections (SIG-01…SIG-06), each row: intersection name,
  live VCI, signal state, extension delta. State machine: `VCI < 85 → LATENT`,
  `VCI ≥ 85 → GREEN EXT (AUTO)` (NTCIP 1202 extension, seeded `+8s`), released when
  `VCI < 80` (hysteresis). **Edge case 84 vs 85 rendered explicitly**: a row at VCI 84
  shows LATENT with "1 below threshold" hint; SIG-02 crosses 85 mid-demo → state flips
  with badge pulse.
- **Demo toggle** per row ("Simulate VCI 88") — badged as demo-only, disabled for
  non-demo rows where fixture trajectory is scheduled.
- **Adapter log:** ordered event stream, e.g.
  `SIG-02 · VCI 87 ≥ 85 → NTCIP 1202 GREEN EXT +8s · 14:03:12.410`, with duration
  chips. States: default / **new entry** (slide-in animation) / empty ("No adapter
  events yet.").

### 5. Status & SLA (`/status`)
- **Uptime ring:** 99.98% (12-month fixture). **Latency charts:** p50/p95 in-house SVG
  line charts (60-day fixture series, last 24h zoom toggle). **Incident feed:** 3
  incidents — 2 resolved, **1 scheduled to open mid-demo** (status incident state:
  amber "Investigating" → green "Resolved" banner on SLA page).
- **Health checks:** Redis / AI / CCTV / MQTT stage rows with operational / degraded /
  down states (fixture), each with latency ms.

## Interactions & Micro-interactions

| Interaction | Behavior | Duration |
| --- | --- | --- |
| Execute button | Icon → `Loader2` spin loop, button disabled, response panel shows skeleton | min 400 ms round-trip (latency badge shows real 28–52 ms jitter) |
| Latency badge | Number ticks to measured value with color shift (<50 ms green, 50–80 amber, >80 red) | 200 ms transition |
| Response type-in | JSON lines render progressively left-to-right (feels like a terminal) | 8 ms/char, capped 400 ms total |
| Quota meter | Bar shrinks per Execute, width tween + remaining counter ticks | 300 ms ease-out |
| Adapter log entry | New row slides in (translateY 4px → 0) with opacity fade; duration chip appears last | 300 ms ease-out, 120 ms stagger |
| Signal state flip | Badge pulses twice then holds solid | 600 ms pulse |
| 429 banner | Appears with refill countdown ticking down to 0, then auto-dismisses | 1 s tick |
| Copy buttons | Clipboard write + Sonner toast "Copied to clipboard" | toast 2.5 s |
| Keyboard | Explorer form fully tabbable, Execute on Enter, console history ↑/↓, Esc closes snippet modal | — |

Error recovery: 404/429/500 never clear the previous response; inline validation fixes
the form in place; toast on any failed copy.

## Visual Design Spec

Per the shared system: Tailwind v4 tokens, dark default (light mode respected via
`dark:` variants), panel language from Sprint 7 Command Center. Mono (`font-mono`) for
all code, GeoJSON payloads, headers, and log entries; sans for UI. Status colors:
green `#22c55e` (operational/GREEN EXT/<50 ms), amber `#f59e0b` (degraded/50–80
ms/threshold-hint), red `#ef4444` (down/429/>80 ms). Signal states use the same
semantic colors as VCI (Sprint 3). "DEMO" badge (shared component from the foundation)
fixed top-right on every developers surface and next to the demo toggle + mock key;
console prompt prefixed `mock›`. No new visual language: catalog cards reuse the
leaderboard table styling (Sprint 11), charts reuse in-house SVG chart conventions
(Sprint 8).

## Content & Copy

- API key panel: `tf_live_jkt_9f3k2m` · "This is a demo key — no real quota is consumed."
- Explorer empty state: *"No requests yet — execute an endpoint to populate the response panel."*
- Validation: `"Hub is required"`, `"Exit is required for exit-status"`.
- Error bodies (consistent with repo envelope): 404
  `{ "status": "error", "code": "HUB_NOT_FOUND", "message": "Hub not found: 'blok-m'" }`;
  400 `{ "status": "error", "code": "VALIDATION_ERROR", "message": "Validation error",
  "details": [...] }`; 429 `{ "status": "error", "code": "RATE_LIMITED", "message":
  "Rate limit exceeded. Retry in 4s." }` with `Retry-After` header.
- Quota exhausted: *"Quota exhausted — token bucket refills in ~30s"*.
- Console banner: `mock› @transitflow/sdk v1.0.0-mock — type getExitStatus('dukuh-atas', 'B')`.
- Log entry: `SIG-02 · VCI 87 ≥ 85 → NTCIP 1202 GREEN EXT +8s · 14:03:12.410`.
- Status page incident: *"Investigating elevated latency at Jakarta hub API — incident
  INC-2411"*; resolved: *"Resolved — latency back within SLA (p95 46 ms)".*
- Sample curl:
  `curl -H "x-api-key: tf_live_jkt_9f3k2m" https://api.transitflow.dev/api/v1/hubs/dukuh-atas/exit-status?format=geojson`
- Sample TS: `const exit = await transitflow.getExitStatus("dukuh-atas", "B"); // { vci: 87, status: "CHOKING" }`

## Mock Data

| Fixture | Typed schema (zod) | Seeds | Realism notes |
| --- | --- | --- | --- |
| Hubs | `Hub { id, slug, name, lat, lng }` | 8 hubs (Dukuh Atas, Senayan, BNI City, …) | Reuses Sprint 11 city/hub set, Jakarta-scoped |
| Exits | `Exit { hubId, exitId, vci, status }` | 24 exits | VCI history reused from Sprint 3/8 generators |
| Exit-status GeoJSON | `ExitStatusResponse { type, features[], meta { hubId, exitId, vci, capturedAt } }` | per call, verbatim from fixtures | GeoJSON reuse from `src/lib/geojson` |
| Buffer zones | `BufferZone[]` (Sprint 4 schema) | 4 active zones | Same payload the real webhook would emit |
| Forecasts | `ForecastSeries { hubId, points[96] }` | 8 series × 96 hourly points | Sprint 8 deterministic model |
| Signals | `SignalState { id, name, vci, state: "LATENT"\|"GREEN_EXT", extSeconds }` | 6 intersections | SIG-02 seeded trajectory crosses 85 at T+90 s |
| Adapter log | `AdapterEvent { ts, sigId, vci, action, durationMs }` | 40 seeded entries | ISO timestamps, monotonic |
| Latency/uptime | `LatencySeries { p50, p95, ts }` + `Incident[]` | 60 days × 288 pts (5-min), 3 incidents | Deterministic PRNG seed 12345; 1 incident scheduled to open mid-demo |

Extends the shared fixture dataset only — no new data universe; all surfaces read the
same live driver as Sprints 2–11.

## Liveness Simulation

- **`quota_tick` (2 s):** token-bucket refill, cap 30; Execute consumes 1; meter + 429
  refill countdown drive from the same store.
- **Latency jitter:** deterministic seeded PRNG (mulberry32, seed 12345) samples
  28–52 ms per request (mean ~40 ms); badge and charts consume the same sample.
- **Scheduled signal trigger:** SIG-02 VCI trajectory 82 → 84 at T+60 s → **85 at
  T+90 s** (GREEN EXT fires) → 89 peak → decays < 80 at T+240 s (extension released,
  hysteresis). VCI 84 remains LATENT — the 84/85 edge is a test-pinned behavior.
- **Status page:** charts append a point every 5 s; scheduled incident INC-2411 opens
  amber at T+120 s, resolves at T+300 s.
- **Determinism:** all ticks derive from the Zustand live driver (README foundation);
  `prefers-reduced-motion` disables type-in and slide-in (fade only); tab-visibility
  pauses the driver and recomputes quota/refills on refocus so demos never drift.

## Tech Specs

**Stack (fixed, no new frameworks):** Next.js 16 App Router, React 19, TS strict,
Tailwind v4, MapLibre v6, Zustand, React Query, RHF + Zod, Axios, Sonner, Lucide,
Vitest, Playwright. Mock gateway = **real route handlers** under `src/app/api/v1/`
serving fixture data via server repositories (existing `server-*-repository` pattern).

| Concern | Files |
| --- | --- |
| Gateway routes | `src/app/api/v1/hubs/route.ts` · `src/app/api/v1/hubs/[id]/exit-status/route.ts` · `src/app/api/v1/buffer-zones/active/route.ts` · `src/app/api/v1/forecasts/route.ts` |
| Rate limiting | `src/lib/rate-limiter.ts` (in-memory token bucket + `x-ratelimit-*` headers, 429 + `Retry-After`) · `src/lib/rate-limiter.test.ts` |
| Latency | `src/lib/mock-latency.ts` (seeded jitter, `NEXT_PUBLIC_MOCK_LATENCY_MS=28..52`) |
| Signal engine | `src/lib/signal-engine.ts` (`evaluateSignalState(vci)` state machine with 85 trigger / 80 hysteresis) · test |
| Repositories (mock boundary) | `src/infrastructure/repositories/api-gateway-repository.ts` + `server-api-gateway-repository.ts` · `signal-repository.ts` + `server-signal-repository.ts` (interfaces identical to future real ones) |
| Typed fixture schemas | `src/entities/api-*.ts` (zod: Hub, ExitStatusResponse, BufferZone, Forecast, SignalState, AdapterEvent) |
| Explorer | `src/features/developers/explorer/` (`explorer-form.tsx`, `response-panel.tsx`, `syntax-highlight.ts`, `mini-map.tsx`) |
| Playground | `src/features/developers/playground/` (`sdk-console.tsx`, `sdk-completions.tsx`, `fixture-sdk.ts` — typed functions) |
| Signals | `src/features/developers/signals/` (`signal-board.tsx`, `adapter-log.tsx`, `signal-toggle.tsx`) |
| Status | `src/features/status/` (`uptime-ring.tsx`, `latency-charts.tsx` — in-house SVG, `incident-feed.tsx`, `health-checks.tsx`) |
| Shared state | `src/features/developers/store/developer-store.ts` (Zustand: quota meter, explorer history, signal board, log) |
| Data fetching | `src/features/developers/hooks/use-api-explorer.ts` (React Query + Axios against `/api/v1/*`) |
| Pages | `src/app/developers/page.tsx` · `developers/explorer/page.tsx` · `developers/playground/page.tsx` · `developers/signals/page.tsx` · `src/app/status/page.tsx` |

**Syntax highlighting:** in-house tokenizer (`src/features/developers/explorer/syntax-highlight.ts`)
matching JSON/TS keywords — no new dependency.

**Tests:** Vitest — rate limiter (refill, 429 after 30, `Retry-After`), gateway handlers
(200/404/400/429 envelopes, GeoJSON shape, latency header), signal engine (VCI 84 →
LATENT, 85 → GREEN_EXT, hysteresis release), fixture SDK. Playwright —
`e2e/developers.spec.ts` (catalog → explorer → snippet copy), `e2e/signals.spec.ts`
(fast-forward seeded trigger), `e2e/status.spec.ts` (charts render, incident opens).
All handlers tested with `route.test.ts` beside the route per repo convention.

## Demo Script

1. Open `/developers` — catalog + mock key with quota meter at 30
2. Execute `GET /api/v1/hubs/dukuh-atas/exit-status` → GeoJSON type-in renders, badge `41 ms`, meter → 29
3. Switch params to `blok-m` → 404 `HUB_NOT_FOUND`; fix and re-execute; copy the TS snippet
4. Open the SDK playground, run `getExitStatus("dukuh-atas", "B")` → result echoes, snippet modal copies
5. Open Signals — SIG-02 at 84 shows LATENT "1 below threshold"; at T+90 s it flips to `GREEN EXT +8s` and the adapter log entry slides in
6. Open `/status` — 99.98% ring, latency charts ticking; INC-2411 opens amber mid-demo, then resolves

**Acceptance:** explorer, playground, signal board, and status page are fully
fixture-driven through `/api/v1/*` route handlers; quota meter, 429 state, VCI 84/85
edge, and scheduled incident are demonstrable; no real gateway, Redis, or traffic
adapters; DEMO badge visible on every surface.

## Dependencies

- Mock repositories: `api-gateway-repository`, `signal-repository` (+ server variants)
- Live driver: `quota_tick`, `signal_vci_eval`, `latency_sample` (2 s / 1 s / 5 s ticks)
- Shared fixture: all prior datasets exposed verbatim as GeoJSON; VCI trajectory (Sprint 3), forecasts (Sprint 8), buffer zones (Sprint 4), hubs (Sprint 11)
- Shared components: DEMO badge, header nav, Sonner toasts, in-house SVG chart utilities, mini-map (Sprint 7)
