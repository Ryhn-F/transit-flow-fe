# Mock UI PRD — Sprint 6: Public Commuter Alert & Safe-Path Portal

**Sprint reference:** `docs/sprints/sprint-06-commuter-portal.md`

## Purpose

Demonstrate the public face of TransitFlow: a mobile-first commuter PWA showing live exit
congestion, a Safe-Path door finder, and a 1-tap crowdsourcing report form — the first
surface designed for end-users rather than operators.

## Demo Surfaces

### 1. Public Portal (`/portal` — new mobile-first route)
- Mobile PWA shell (bottom nav, 4 viewport sizing, large touch targets, install-to-homescreen
  affordance) — a deliberate visual departure from the operator dashboard aesthetic
- Nearest-station lookup: simulated geolocation (fixture position near Manggarai) with a
  "USE MY LOCATION" flow that resolves to the nearest hub in ~600ms
- Station exit congestion list: door-by-door color chips (Green/Yellow/Red) with live VCI

### 2. Safe-Path Door Finder
- Card: **"Exit Door C is 40% clearer than Exit Door B"** — computed from fixture VCI deltas
- "Navigate" step flow: recommended door → route strip (covered walkway badges) → arrival ETA
- Door comparison view: horizontal bars for each exit door with VCI and pedestrian flow

### 3. 1-Tap Crowd Report (Crowdsourcing)
- Minimal form: 3 options (blockage / broken escalator / flood), optional photo thumbnail,
  submit in one tap → success state with reference ID (e.g., `CR-0421`)
- Submission lands in the shared fixture survey pool and appears in operator surfaces
  (Sprint 2 QA queue) — demonstrating closed-loop feedback

### 4. Push Notification Simulation
- "Subscribe to Manggarai alerts" — simulated web-push consent flow; subscribed devices get
  a toast-style notification when the live driver triggers a surge alert (Sprint 3 event)
- Notification tray accessible from the portal header

## Mock Data

- 3 hubs (Manggarai, Dukuh Atas, Sudirman) with exit doors + VCI states (reuse Sprint 3)
- Pre-seeded crowd reports; 2 subscriptions pre-enabled
- Simulated GPS fixture; "in-tunnel offline" mode: a connectivity toggle showing the offline
  cached map/floorplan state (mock of Workbox service worker behavior)

## Liveness Simulation

- Exit VCI chips refresh with the shared live driver; Safe-Path recommendation recomputes
  when rankings change
- A new surge alert (≥80) mid-demo triggers push-style notifications on subscribed devices

## Interactions

- Bottom-nav switching, station search, door selection, 1-tap report submission
- Offline toggle demo: map tiles gray out, cached floorplan panel takes over
- Notification consent + tray interactions

## Demo Script

1. Open `/portal` in mobile viewport — bottom nav, install banner
2. "USE MY LOCATION" → resolves nearest hub: Manggarai
3. Safe-Path card recommends Door C (40% clearer); open comparison bars
4. Submit a 1-tap crowd report (broken escalator) → `CR-0421` success
5. Subscribe to alerts; surge fires mid-demo → notification slides in
6. Toggle offline — cached floorplan renders, report still queued locally

**Acceptance:** portal is fully navigable and functional from fixtures; the crowd report
propagates into operator mock surfaces; demo badge visible.

## Dependencies

- Mock repository: `portal-repository` (nearest hub, safe-path), reuses `vci-repository`
- Live driver: surge event consumption (Sprint 3), `crowd_report_created`
- Shared fixture: survey submissions (Sprint 1/2), VCI (Sprint 3)
