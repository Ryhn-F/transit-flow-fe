# Mock UI PRD — Sprint 5: Weather-Triggered Flood & Inundation Rerouting

**Sprint reference:** `docs/sprints/sprint-05-weather-rerouting.md`

## Purpose

Demonstrate monsoon resilience: live rainfall crossing the 20 mm/hr threshold triggers a
rain-detour mode that reroutes pedestrians around flooded underpasses to covered walkways —
visualized end-to-end with zero weather API or routing backend.

## Demo Surfaces

### 1. Rain Mode Overlay (`/dashboard` — new layer)
- Toggle: **"Rain Mode"** in Active Spatial Layers
- BMKG-style radar overlay: semi-transparent radar tiles (generated gradients from seeded
  precipitation data) + rainfall rate chip (`24 mm/hr`, amber/rose escalation)
- Flooded underpass markers: pulsing blue/cyan drops on affected points, click → depth
  readout in cm (from "field photo flood depth detection")

### 2. Flood Depth Detection Feed
- Side panel showing simulated flood-photo detections: thumbnail + `estimated depth: 38 cm`
  + confidence — the mock of the Gemini vision extraction

### 3. Rain Safe-Path Rerouting
- Dynamic detour routes rendered as dashed polylines on the map: flooded edges turn red
  and are excluded; covered walkways highlighted in emerald
- **Reroute switch:** a prominent "Rain Detour Active" pill; toggling shows the alternative
  route set and a commuter-impact summary ("1,240 commuters rerouted to covered route C")
- Route card list: each detour with time delta (+3 min) and covered-distance percentage

### 4. Public "Rain Safe-Path" Toggle (preview)
- Embedded preview of the commuter-facing toggle (Sprint 6 surface) to show the feature in
  context; non-navigational, read-only in this sprint's mock

## Mock Data

- 6 underpasses with flood-depth states (2 flooded), 8 covered walkway edges
- Rainfall timeline seeded for a 30-min demo window crossing 20 mm/hr at minute ~2
- 4 seeded flood photos with depths + confidence

## Liveness Simulation

- Rainfall ticks every 10s (ramps 12 → 24 → 41 mm/hr); radar intensity follows
- When rainfall crosses 20 mm/hr: auto-enables Rain Mode, fires an operator alert, floods
  one additional underpass at minute ~6
- Reroute counts increment with each tick to feel continuous

## Interactions

- Toggle Rain Mode (also triggered automatically by the rainfall crossing)
- Click flooded underpass → depth popover; click detour route → route card highlight
- Manual override: operator can force-enable/disable Rain Mode (shows "MANUAL OVERRIDE" chip)

## Demo Script

1. On `/dashboard`, rainfall 12 mm/hr; toggle Rain Mode to preview
2. Watch rainfall climb; at 20 mm/hr the system auto-enables Rain Mode + alert banner
3. New underpass floods mid-demo; its detour recalculates and painted routes update
4. Click the flooded marker — depth 41 cm; detour card shows +3 min covered route
5. Show the read-only commuter Safe-Path toggle preview

**Acceptance:** weather, radar, depths, and routes all derive from live driver fixtures;
auto-trigger threshold behavior is deterministic at 20 mm/hr.

## Dependencies

- Mock repository: `weather-repository`, `reroute-repository`
- Live driver: `weather_tick` (10s), `flood_detected`
- Shared fixture: pedestrian counts (Sprint 2), VCI (Sprint 3), walkway network
- Shared components: map layer utilities, alert banner (Sprint 3)
