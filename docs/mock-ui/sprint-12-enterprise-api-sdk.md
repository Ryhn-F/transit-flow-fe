# Mock UI PRD — Sprint 12: Enterprise API / SDK

**Sprint reference:** `docs/sprints/sprint-12-enterprise-api-sdk.md`

## Purpose

Demonstrate the open smart-city finish line: a developer portal with live API explorer,
rate-limit visibility, an SDK playground that calls the (mock) endpoints, a traffic-signal
integration panel, and enterprise SLA/status surfaces — with zero real backend.

## Demo Surfaces

### 1. Developer Portal (`/developers` — new route)
- Landing: platform docs header, endpoint catalog, code samples (curl/JS/TS tabs)
- API key panel: mock key `tf_live_xxxxxxxxxxxx` with usage meter (requests vs the Upstash
  token bucket quota) — meter ticks with each explorer call
- Endpoint catalog: `GET /api/v1/hubs/{id}/exit-status`, `/api/v1/hubs`,
  `/api/v1/buffer-zones/active` (Sprint 4 webhook), `/api/v1/forecasts` (Sprint 8)

### 2. Live API Explorer
- Interactive explorer: pick endpoint → params (hub, exit, format) → **Execute** → mock
  GeoJSON response rendered with syntax highlighting, latency badge (<50ms target), and
  HTTP status; responses derive from the shared fixture dataset
- Response maps render on a mini-map preview

### 3. SDK Playground (`@transitflow/sdk` mock)
- In-browser console: run fixture SDK calls (`getExitStatus('dukuh-atas', 'B')`) against
  the mock provider; results echo to the console panel and a code-completion sidebar
- "Generated snippet" — copies the equivalent curl/TS snippet for the last call

### 4. Traffic Signal Integration Panel
- NTCIP-style status board: 6 intersections with green-light state, VCI trigger status
  (e.g., `VCI 88 → GREEN EXT +8s ACTIVE`), and a live toggle to simulate the autonomous
  trigger when VCI ≥ 85
- Protocol adapter log: ordered event stream (`SIG-02: VCI 87 ≥ 85 → NTCIP 1202 extension`)

### 5. Status & SLA
- Public status page: uptime 99.98%, latency p50/p95 charts (fixture series), incident
  history feed; platform health checks (Redis, AI, CCTV, MQTT stages — all fixture)

## Mock Data

- Full GeoJSON fixtures exposed verbatim through the explorer (reuse station + VCI data)
- 6 intersections with signal states; adapter event log seeded
- Latency/uptime series (60 days) generated deterministically

## Liveness Simulation

- Usage meter decrements/quota ticks; explorer latency jitters 28–52ms
- A signal crosses VCI 85 mid-demo → NTCIP log entry + status board update
- Status page latency charts tick with the live driver

## Interactions

- Endpoint selection, params, Execute, syntax-highlighted response, map preview
- SDK console autocomplete, snippet copy, signal toggle, status page navigation

## Demo Script

1. Open `/developers` — catalog + mock API key with quota meter
2. Execute `GET /api/v1/hubs/dukuh-atas/exit-status` → GeoJSON renders + <50ms badge
3. Run the same call in the SDK playground console; copy the generated snippet
4. Watch SIG-02 trigger: VCI 87 → NTCIP 1202 green extension appears in the log
5. Open Status — 99.98% uptime, latency charts ticking

**Acceptance:** explorer, SDK playground, signal panel, and status page are fully
fixture-driven; no real gateway, Redis, or traffic adapters; demo badge visible.

## Dependencies

- Mock repository: `api-gateway-repository`, `signal-repository`
- Live driver: `quota_tick`, `signal_vci_eval` (VCI ≥ 85)
- Shared fixture: all datasets, exposed verbatim as GeoJSON
