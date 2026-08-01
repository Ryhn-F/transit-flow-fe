# Mock UI PRD — Sprint 7: Multi-Agency Command Center

**Sprint reference:** `docs/sprints/sprint-07-command-center.md`

## Purpose

Demonstrate the enterprise B2G surface: a multi-monitor War Room dashboard with
cross-agency roles (Dishub / Police / KAI / MRT), one-click warden dispatch, historical
analytics, and cross-agency SLA tracking — synchronized across "screens" with simulated
Socket.io state sync.

## Demo Surfaces

### 1. Command Center (`/command-center` — new route)
- War-room grid layout designed for display walls: KPI header strip, central map, right
  analytics rail, bottom event ticker
- **Agency switcher:** role pills (DISHUB / POLRI / KAI / MRT) changing the visible data
  scope and accent color; each role has a distinct fixture permission set (e.g., Police see
  dispatch, KAI see train-impact analytics)
- **Multi-screen sync indicator:** a "2 screens connected" chip — a second virtual screen
  (`/command-center?screen=b`) opens in another tab/window and reflects actions made on
  screen A within ~1s via localStorage events + BroadcastChannel (mock of Socket.io)

### 2. One-Click Warden Dispatch
- Click any choke coordinate on the map → dispatch card: nearest 3 wardens with ETA rings,
  vehicle type, current status (IDLE / EN-ROUTE / ON-SITE)
- One-click dispatch → warden status animates IDLE → EN-ROUTE → ON-SITE with a progress
  timeline; SLA clock starts ("VCI warning → warden arrival")
- Dispatch appears simultaneously on screen B's ticker (cross-screen sync demo)

### 3. Historical Analytics Rail
- Recharts-based panels: bottleneck trends (7-day), response lead times (median + p95),
  agency workload bars
- **Time-slider control:** scrub days/weeks/months — the central heatmap replays historical
  VCI states from fixture history (Sprint 3 24h data extended to 60 days)

### 4. Executive Exports
- "Export CSV (Kemenhub)" / "Export Excel" buttons producing a real downloadable CSV from
  fixtures (Excel mock via CSV) + a preview modal of the executive summary

## Mock Data

- 6 wardens (3 Dishub, 2 Police, 1 KAI) with positions, statuses, ETAs
- 60 days of VCI history per exit (fixture generator seeded deterministically)
- 5 agencies × role permissions; 40 seeded incident/dispatch records with lead times

## Liveness Simulation

- Warden positions drift slightly; one warden completes a dispatch mid-demo
- New incidents enter the bottom ticker every ~40s; analytics panels recompute
- Cross-screen sync events fire on dispatch and incident ack

## Interactions

- Role switching, map click → dispatch flow, SLA clock, time-slider scrub, CSV export
- Cross-tab sync: actions on screen A appear on screen B

## Demo Script

1. Open `/command-center` and `/command-center?screen=b` side by side
2. Switch roles: DISHUB → POLRI — data scope and accent change
3. Click a red choke zone → dispatch card; one-click dispatch to warden #3
4. Watch screen B reflect the dispatch in real time; warden progresses EN-ROUTE → ON-SITE
5. Scrub the time slider — heatmap replays last 60 days
6. Export the Kemenhub CSV; show the preview modal

**Acceptance:** role switching, dispatch, sync, analytics, and export all work from
fixtures with no backend; sync latency visibly <1s.

## Dependencies

- Mock repository: `dispatch-repository`, `analytics-repository`
- Live driver: `incident_created`, `warden_status_tick`
- Shared fixture: VCI history (Sprint 3), wardens registry
- Shared components: alert banner, map canvas, charting utilities
