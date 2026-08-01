# Mock UI PRD — Sprint 3: VCI Engine

**Sprint reference:** `docs/sprints/sprint-03-vci-engine.md`

## Purpose

Demonstrate the platform's core live intelligence: real-time Volumetric Choke Index (VCI)
scoring on the map, a color-coded heatmap around station exits, and automated alert
escalation to operators — without any Redis, BullMQ, or Telegram backend.

## Demo Surfaces

### 1. Live VCI Heatmap Layer (`/dashboard` — new layer)
- New toggle in Active Spatial Layers: **"Live VCI Heatmap"**
- MapLibre `fill` layer rendering 150m radius choke zones around exits:
  - Green `VCI < 50` (Smooth), Yellow `50–79` (Warning), Red `≥ 80` (Choke Risk)
- Heatmap intensities re-render every 5s from the live driver (fixture VCI state)

### 2. Station Info Card Upgrade
- Replace the current hardcoded `MOCK_VCI` with the live-driver-driven VCI: score,
  pedestrian flow rate, effective channel width, and compliance factor `α`
- VCI sparkline (24h mini history, SVG polyline)

### 3. Surge Alert System
- **Operator banner:** full-width flashing banner (rose glow, `animate-pulse`) when any
  station VCI ≥ 80: "CHOKE RISK — Dukuh Atas Gate B (VCI 92)"
- **Alert channel feed:** side panel tabbed by channel — Telegram / Discord / Email —
  showing simulated outbound messages with timestamps and delivery ticks
- **Acknowledge flow:** operator "Acknowledge & Dispatch" button closes the banner with an
  SLA timer showing response lead time

### 4. VCI Inspector
- Click a heatmap zone → popover with the VCI formula breakdown
  `(PedestrianFlow + Drop-offSurge) / (Width × α)` with each live value, plus the raw 60s
  recalc cadence indicator (simulated BullMQ worker pulse)

## Mock Data

- 8 exits across 3 stations, each with: `vci_score`, `pedestrian_flow_rate`,
  `dropoff_surge`, `effective_width_m`, `alpha`
- 24h of historical VCI per exit (96 points at 15-min intervals) for sparklines
- Seeded alert feed history per channel

## Liveness Simulation

- VCI recomputes every 60s (with visible countdown "recalc in 34s" — mirrors the real
  BullMQ worker cadence); scores drift by seeded sinusoidal pattern + jitter
- Dukuh Atas Gate B peaks above 80 during the demo script window, triggering the banner,
  channel feeds, and audio cue (muted, respecting `prefers-reduced-motion`)
- New Telegram message ticks into the channel feed ~2s after the alert fires

## Interactions

- Heatmap toggle, zone click-to-inspect, banner acknowledge, channel tab switching
- Sparkline hover shows timestamp + score

## Demo Script

1. Open `/dashboard`, enable **Live VCI Heatmap** — 3 green, 4 yellow, 1 red zone
2. Click the red zone → formula breakdown with live values
3. Wait for recalc countdown; Gate B VCI climbs 88 → banner fires with sound
4. Open alert channels tab — Telegram message already delivered, Discord next
5. Click **Acknowledge & Dispatch** — banner dismisses, SLA timer starts

**Acceptance:** all scores/heatmaps/alerts derive from the live driver state, never
hardcoded JSX; demo badge visible.

## Dependencies

- Mock repository: `vci-repository`
- Live driver: `vci_tick` (60s), `vci_alert_triggered`
- Shared fixture: station exits + widths (Sprint 1), pedestrian counts (Sprint 2)
- Shared components: status chip, stat-chip, banner
