# Mock UI PRD — Sprint 4: Dynamic Buffer Allocator

**Sprint reference:** `docs/sprints/sprint-04-buffer-allocator.md`

## Purpose

Demonstrate the platform's first *active* spatial solution: operators allocate dynamic
15-minute ojek pick-up zones and place virtual stanchion barriers, then observe simulated
VCI relief in real time — no routing engine or simulation backend required.

## Demo Surfaces

### 1. Spatial Simulator (`/dashboard` — new Editor mode + `/simulator` panel)
- Replaces the current stub "Editor" toggle with a real (mock) spatial canvas:
  - **Ojek Buffer tool:** drag-drop/click-to-place circular pick-up zones (15-min slot chips)
  - **Stanchion tool:** draw polylines representing barrier dividers; enforcement of a
    2.0m clear pedestrian lane is checked live (invalid placements flash red)
- All geometry rendered as MapLibre GeoJSON layers on top of the vector tiles

### 2. Barrier Toggle Simulator
- Each placed barrier has a state toggle: **Active / Standby**
- Toggling recomputes a simulated VCI delta: the adjacent exit's VCI drops by a seeded
  percentage with a smooth animated transition (e.g., 88 → 71 over 6s)
- A "Simulated Crowd Throughput" chip animates alongside

### 3. Curb Slot Dispatcher
- Right panel listing active 15-minute ojek slots with remaining time countdown,
  location, and a fake Grab/Gojek integration status (`SENT → ACK` flow)
- Expiring slots rotate automatically via the live driver

### 4. Dispatch Plan Export
- "Export Dispatch Map" button generating an SVG/PDF-style preview (in-app modal mock of
  the printed barrier layout plan with scale bar, legend, and operator notes)
- Copies the payload JSON that the real `/api/v1/buffer-zones/active` webhook would emit

## Mock Data

- 4 exits with baseline VCI + adjacent curb geometry
- 6 seeded ojek slot bookings (2 expiring within demo window)
- Stanchion presets: "Gate A Queue Line", "East Wing Channel" with expected VCI deltas

## Liveness Simulation

- Slot countdowns tick; one slot expires mid-demo and rotates to a new location
- VCI deltas animate smoothly (not instant) to sell the "simulation"
- A synthetic field event (vendor blocking new placement) appears as a warning toast

## Interactions

- Place/move/delete zones and barriers; invalid-placement inline errors
- Toggle barrier → animated VCI drop + throughput chip
- Export → modal preview + payload copy button

## Demo Script

1. Open `/dashboard`, enable Editor — draw a stanchion line at Gate B, see lane clearance pass
2. Place an ojek buffer zone; slot chips 15:00:00 count down
3. Activate the barrier — Gate B VCI animates 88 → 71, throughput chip climbs
4. Watch a slot expire and auto-rotate to a new coordinate
5. Export the dispatch map; copy the webhook payload JSON

**Acceptance:** editor tools are fully interactive with fixtures; no real routing/simulation
dependencies; the previous toast-only "Editor Active" stub is retired.

## Dependencies

- Mock repository: `buffer-zone-repository`
- Live driver: `slot_tick` (1s), `vci_delta_recompute`
- Shared fixture: exit VCI (Sprint 3), curb geometry
- Shared components: draw control upgrade, GeoJSON export utilities
