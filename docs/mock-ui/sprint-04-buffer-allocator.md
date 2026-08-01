# Mock UI PRD — Sprint 4: Dynamic Buffer Allocator

**Sprint reference:** `docs/sprints/sprint-04-buffer-allocator.md`
**Rubric:** scored D1–D10 per `docs/mock-ui/README.md`; target ≥9 on every dimension.

---

## D1 — Purpose & Problem

Operators can see crowd risk (Sprint 3) but cannot yet act on it. This mock demonstrates
the platform's first *active spatial solution*: operators allocate dynamic 15-minute ojek
pick-up zones and place virtual stanchion barriers, then watch simulated VCI relief in
real time — with **zero routing engine, Voronoi generator, or simulation backend**
(OSRM/NetworkX/Turf deferred; the demo proves the UX first).

**Demo narrative** (README tour order): from the live VCI dashboard, the operator enters the
Buffer Editor, draws a stanchion line at Gate B, sees the 2.0 m clear-lane check pass, places
an ojek zone, activates the barrier, watches Gate B VCI animate 88 → 71, and exports the
dispatch map — a complete "detect → plan → deploy → verify" story.

**Stakeholder value:** MAPID & Dishub see operational dispatch (not just alerts); operators
validate the barrier-toggle workflow before field investment; the sprint's real 10-step
pipeline (webhooks, OSRM, PostGIS) stays untouched until UI buy-in.

---

## D2 — Personas & Roles

| Persona | Can do in mock | Cannot do in mock |
| --- | --- | --- |
| **Ari, station operator** (Dukuh Atas) | Enter Editor, place/move/delete zones & stanchions, toggle barriers, watch VCI deltas, acknowledge field events | Access national view (Sprint 11), commit to real dispatch (payload is copied, not POSTed) |
| **Bu Sari, traffic planner** (Dishub) | Evaluate layouts, view the 2.0 m clearance report, compare barrier presets' expected deltas, export dispatch plan PDF | Persist plans across sessions (fixtures reset), run real What-If scenarios (Sprint 8) |
| **Pak Joko, field ops coordinator** | Read exported barrier layout map, receive synthetic field-event toasts (obstruction), track ojek slot ACK status | Operate the editor remotely (read-only in this sprint's mock, like the Sprint 5 Safe-Path preview) |

---

## D3 — Information Architecture & Flow

**Entry points & page map:** `/dashboard` is the sole surface — the existing Active Spatial
Layers panel gains **"Buffer Allocator (Experimental)"** (wired to the existing
`temporaryBufferZone` toggle in `station-ui-store.ts`); the top-right **Edit Buffer
Layout** control replaces the `MapDrawControl.tsx` toast stub; optional deep link
`/dashboard?mode=buffer`. Right panel hosts three stacked cards: **Barrier Toggle
Simulator**, **Curb Slot Dispatcher**, **Dispatch Plan Export** (accordions, one open).

**End-to-end flow:** toggle layer → enter Editor (amber mode) → draw stanchion → validate
→ save → activate barrier → VCI delta animates → slot expires & rotates → export dispatch
map → copy webhook payload. Every surface has a defined home: editor tools in a floating
top-right control cluster; all state readable from the right panel.

---

## D4 — Screen & Component Specs

### 1. Spatial Simulator (Editor)
- Replaces the current stub toggle with a real canvas: **Ojek Buffer tool** (click-to-place
  circular zones, 30–40 m from exit doors; snap to curb geometry) and **Stanchion tool**
  (click-to-add-vertex polyline barriers).
- **States:** *view* (cursor `grab`, passive layers) · *editing* (`crosshair`, amber glow
  on tools, `glow-amber` on the editor button) · *empty canvas* (tool hint overlay: "Click
  the map to place an ojek zone") · *invalid* (offending geometry flashes rose +
  `.glow-crimson`, inline chip "2.0 m clearance violated") · *saving* (Save spinner, tools
  disabled, "Saving layout…" toast) · *saved/error* (Sonner toast).
- **Edge cases:** click outside station polygon → "Placement outside Dukuh Atas station
  boundary"; Escape during drag → snap-back (D5); Delete removes selection.

### 2. Barrier Toggle Simulator
- Per-barrier card: name, vertex count, expected ΔVCI, **Active / Standby** switch.
- **States:** *standby* (dimmed) · *active* (`.glow-emerald`, "LIVE" chip, animated VCI
  countdown chip) · *recalculating* (6 s determinate progress bar "Recalculating adjacent
  exit VCI…") · *error* (toggle reverts, "Simulation failed — barrier reverted to Standby").

### 3. Curb Slot Dispatcher
- Right-panel list of active 15-minute ojek slots: id, coordinates label, countdown,
  integration status `SENT → ACK` (Grab/Gojek mock).
- **States:** *populated* · *expiring* (≤60 s amber pulse, ≤15 s rose) · *empty* ("No
  active ojek slots — the surge window is closed") · *rotated* (expired slot slides out,
  new slot slides in with a toast).

### 4. Dispatch Plan Export
- Modal mock of the printed barrier layout plan: SVG scale bar, legend, operator notes,
  timestamp; **Copy webhook payload** button with `SENT → ACK` fake status.
- **States:** *generating* (SVG draw-in 600 ms) · *ready* · *copied* ("Payload copied —
  matches `/api/v1/buffer-zones/active` format") · *empty* ("Add a stanchion to export a plan").

---

## D5 — Interactions & Micro-interactions

| Interaction | Behavior & timing |
| --- | --- |
| Place ojek zone (click) | Zone drops with 300 ms `scale 0.85 → 1` pop (Tailwind `ease-out-back`-style cubic-bezier `(0.34,1.56,0.64,1)`); snaps to curb geometry |
| Drag zone / stanchion vertex | `pointerdown` grabs (cursor `move`), `pointermove` updates draft geometry (150 ms rAF throttle), `pointerup` commits + runs validation; `map.easeTo` recenter 400 ms |
| Invalid drop | Rejection with snap-back animation: draft animates back to last-valid position over **250 ms** `cubic-bezier(0.22,1,0.36,1)` + 120 ms ×2 horizontal shake (±3 px) + rose flash 500 ms |
| Escape / Delete | Cancel drag (snap-back, same 250 ms curve); remove selected feature with 200 ms fade-out |
| Barrier toggle | VCI value counts 88 → 71 over **6 s**, 50 steps of 120 ms, `cubic-bezier(0.22,1,0.36,1)`; throughput chip ("Simulated Crowd Throughput 2,340 → 2,740 pax/h") climbs on the same curve; digits render `font-mono tabular-nums` |
| Slot countdown | 1 s ticks, mono tabular-nums; ≤60 s amber `animate-pulse`, ≤15 s rose |
| Keyboard | Tab cycles tool buttons (ARIA `aria-pressed`, focus ring `ring-2 ring-amber-400`); arrow keys nudge selected feature 0.5 m per press |

---

## D6 — Visual Design Spec

- **Panels:** right-panel cards match repo language — `bg-white/95 dark:bg-[#0c1019]/95
  backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4
  shadow-2xl` (per `MapDrawControl.tsx`); `transition-all duration-200`.
- **Typography:** mono (`font-mono text-xs tabular-nums`) for data — VCI deltas, slot
  countdowns, payload bytes; sans (`font-medium text-sm`) for interactive labels/buttons.
- **Color:** primary `bg-blue-600 hover:bg-blue-500` (Export GeoJSON precedent); editor
  active `bg-amber-500/10 text-amber-400 border-amber-500/30`; barrier active `emerald-500`;
  invalid `rose-500`.
- **Glow utilities** (`src/app/globals.css`): `.glow-amber` (editor active), `.glow-emerald`
  (barrier LIVE), `.glow-crimson` (invalid geometry / choke warning).
- **DEMO badge:** shared `DemoBadge` (`src/components/shared/demo-badge.tsx`), gated by
  `NEXT_PUBLIC_DEMO_MODE=true`, fixed top-center, `text-[10px] font-mono uppercase tracking-widest
  bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full px-2 py-0.5` — always
  visible so mock dispatch is never mistaken for production.
- **Map layers styling:** ojek zones = dashed amber circles (`#f59e0b`, 12% fill / 60%
  stroke); stanchions = 2 px slate-300 line + round vertex handles; clear lane = 1 px dashed
  emerald line with 2.0 m green band (visible only in editor mode).

---

## D7 — Content & Copy

Quoted, fixture-free (all copy in component strings, data in fixtures):

- Toolbar: **"Edit Buffer Layout"** / **"View Mode"** / **"Export Dispatch Map"** /
  **"Export GeoJSON (n)"** (kept from stub).
- Tool hint (empty canvas): "Click the map to place an ojek zone, or click to start a
  stanchion line."
- Validation: chip "2.0 m lane clearance — OK"; toast "Stanchion blocks the 2.0 m clear
  lane at Gate B — drag to reposition." · Boundary: "Placement outside Dukuh Atas station
  boundary."
- Toggle: "Barrier active — Gate B VCI forecast 88 → 71" / "Barrier reverted to Standby."
- Rotation: "Slot OJ-104 expired — new slot dispatched at East Wing." · Field event:
  "Field ops: vendor cart blocking Gate B — recommend barrier relocation."
- Export: "Dispatch map exported — 1,240 byte payload ready for `/api/v1/buffer-zones/active`."
- Empty states: "No active ojek slots — the surge window is closed." / "Add a stanchion to
  export a plan." (English; i18n is Sprint 11.)

---

## D8 — Mock Data Spec

Typed fixture schema (`src/mocks/fixtures/buffer-fixtures.ts`, extends the shared Sprint 3
exit-VCI dataset):

```ts
interface ExitBufferContext {
  id: string;                 // "exit-dukuhatas-gate-b"
  stationId: string;
  name: string;
  baselineVci: number;        // 88 for Gate B (Sprint 3 alert continuity)
  curbGeometry: GeoJSON.LineString;   // sidewalk edge, snapped from OSM
  adjacentLane: LaneEdge;     // the 2.0 m clear-lane segment to protect
}
interface OjekSlot {
  id: string;                 // "OJ-101"
  stationId: string;
  coordinates: [number, number];
  expiresAt: number;          // epoch ms; 2 seeded to expire inside the demo window
  status: "SENT" | "ACK";
}
interface StanchionPreset {
  id: string;                 // "gate-a-queue-line", "east-wing-channel"
  name: string;
  vertices: [number, number][];
  expectedVciDelta: number;   // -17 for Gate A queue line
}
```

**Seed counts:** 3 stations (Dukuh Atas, Sudirman, Thamrin) · 6 exits with baseline VCI +
curb geometry (reuses Sprint 3 fixtures) · 6 ojek slots (2 expiring: OJ-104 at t+120 s,
OJ-106 at t+300 s) · 2 stanchion presets · 8 lane-edge segments (each ~2.0 m wide).

**Realism notes:** ojek zones seeded 30–40 m from exit doors (per sprint requirement);
preset names match real Dukuh Atas field vocabulary; VCI deltas seeded as integers with
±1 jitter so animation reads natural, never identical.

---

## D9 — Liveness & Behavior (deterministic)

Live driver events (`src/mocks/live-driver.ts`), fixed timeline so demos are reproducible:

| t (mm:ss) | Event | Rule |
| --- | --- | --- |
| 00:00 | `slot_tick` starts | 1 s ticker decrements every slot `expiresAt`; re-renders panel + countdowns |
| 00:15 | Demo window | Operator starts the editor script; no auto-pauses |
| 01:30 | `field_event` | Deterministic toast: vendor cart blocking Gate B |
| 02:00 | `slot_rotated` | OJ-104 expires → rotates to new coordinate, `SENT → ACK` after 2 s |
| any | `vci_delta_recompute` | Fires on barrier toggle; 6 s animation (50 × 120 ms steps) driven by a seeded curve, not randomness |

**Determinism & accessibility:** every event fires at the same wall-clock offset on every
demo run; `prefers-reduced-motion` disables shake, pulse, and the 6 s count animation (VCI
jumps in one step, slot rotation fades 150 ms); `document.visibilitychange` pauses all
tickers when hidden and does a single catch-up recompute on return (no toast burst).

---

## D10 — Tech Specs

Stack is fixed (Next.js 16 App Router, React 19, TS strict, Tailwind v4, MapLibre GL v6,
Zustand, React Query, RHF+Zod, Axios, Sonner, Lucide, Vitest, Playwright). **No new
frameworks, no external draw library** (no mapbox-gl-draw): editing uses native MapLibre v6
events, per repo precedent (map handling stays in `src/components/shared/map-canvas.tsx`
with its worker-MIME fix and `onMapReady`).

**Files:**

| Concern | Path |
| --- | --- |
| Types | `src/features/buffer-allocator/types.ts` |
| Editor state (zustand) | `src/features/buffer-allocator/store/editor-store.ts` |
| Geometry validation (pure) | `src/features/buffer-allocator/lib/geometry-validation.ts` |
| Map sources/layers | `src/features/buffer-allocator/map/buffer-map-layers.ts` |
| Pointer/drag handling | `src/features/buffer-allocator/map/use-spatial-editor.ts` |
| Components | `src/features/buffer-allocator/components/{buffer-editor-tools,ojek-zone-tool,stanchion-tool,barrier-toggle-card,curb-slot-panel,dispatch-export-modal}.tsx` |
| Data hooks | `src/features/buffer-allocator/hooks/{use-buffer-zones-query,use-buffer-mutations}.ts` |
| Repository contract + mock | `src/infrastructure/repositories/{buffer-zone-repository.ts, mock-buffer-zone-repository.ts}` |
| Fixtures | `src/mocks/fixtures/buffer-fixtures.ts` |
| Driver events | `src/mocks/live-driver.ts` (`slot_tick`, `slot_rotated`, `field_event`, `vci_delta_recompute`) |
| Integration | `src/features/stations/DashboardView.tsx` (mounts editor), `src/components/shared/MapDrawControl.tsx` (replaced control cluster) |

**Zustand editor state:** `{ mode: "view"|"ojek"|"stanchion"|"select", selectedId, draft:
Geometry|null, invalidIds: string[], isSaving, slots, barriers, plan }` — persisted to the
mock repository on save; layer toggle reuses `temporaryBufferZone` in `station-ui-store.ts`.

**MapLibre v6 spatial editing:** one `GeoJSONSource` per family — `buffer-ojek-zones`,
`buffer-stanchions`, `buffer-lane-edges`, `buffer-invalid-drafts`. Map layers
(`addLayer` in `buffer-map-layers.ts`, all `interactive: true`): `buffer-ojek-fill`,
`buffer-ojek-outline`, `buffer-stanchion-line`, `buffer-stanchion-vertex`,
`buffer-lane-clearance`, `buffer-invalid-glow`. Pointer logic: `pointermove` sets cursor
(`grab`/`crosshair`/`move` via `map.setCursor`); `pointerdown` + `queryRenderedFeatures`
picks a feature id; `pointermove` streams draft coords (rAF-throttled); `pointerup`
commits to the store and re-runs validation.

**Geometry validation as pure functions** (`geometry-validation.ts`, unit-testable):
`validateClearLane(stanchion, laneEdges, 2.0): LaneViolation | null` (segment-distance
check), `snapZoneToCurb(zone, curb): OjekZone`, `computeVciDelta(barrier, exitContext): number`.

**Mock repository interface (TS):**

```ts
export interface BufferZoneRepository {
  listActiveSlots(): Promise<OjekSlot[]>;
  listBarriers(): Promise<StanchionLine[]>;
  listExitContexts(): Promise<ExitBufferContext[]>;
  placeOjekZone(draft: OjekZoneDraft): Promise<OjekZone>;
  saveStanchion(stanchion: StanchionLine): Promise<StanchionLine>;
  toggleBarrier(id: string, state: BarrierState): Promise<BarrierToggleResult>;
  exportDispatchPlan(): Promise<DispatchPlanExport>;
}
```

Selected via the demo provider registry when `NEXT_PUBLIC_DEMO_MODE=true`; React Query
wraps reads, mutation hooks (`use-buffer-mutations.ts`) invalidate queries after save.
Webhook payload matches the sprint's real `/api/v1/buffer-zones/active` shape
(`{ slots: [...], barriers: [...], plan_id, issued_at }`).

**Test strategy:** Vitest unit-tests `geometry-validation.ts` (clear-lane pass/fail with
fixture lanes at exactly 2.0 m and 1.4 m) and the editor store (place/undo/save reduces);
Playwright e2e: enable Buffer layer → draw a stanchion → assert green clearance chip → drop
it into the lane → assert rose flash + snap-back → toggle barrier → assert VCI animation
completes 88 → 71 → export → assert modal + payload JSON. Tests gate on
`NEXT_PUBLIC_DEMO_MODE=true`; use `prefers-reduced-motion: no-preference` only where
animation timing is under test.

---

## Demo Script

1. Open `/dashboard`, enable **Buffer Allocator (Experimental)**; click **Edit Buffer
   Layout** — amber editor mode, crosshair cursor.
2. Draw a stanchion line at Gate B → "2.0 m lane clearance — OK" chip appears.
3. Drag it into the lane → rose flash + snap-back + validation toast.
4. Place an ojek zone; slot chip OJ-104 counts down 15:00 → 00:00.
5. Toggle **Active** — Gate B VCI animates 88 → 71; throughput chip climbs 2,340 → 2,740.
6. OJ-104 expires and auto-rotates; field-event toast arrives at t+90 s.
7. **Export Dispatch Map** — SVG preview modal; copy payload; toast confirms byte size.

**Acceptance:** all geometry, deltas, slots, and toasts derive from fixtures + live driver
(no hardcoded JSX data); editor fully interactive with native MapLibre events only; the
old toast-only "Editor Active" stub is retired; DEMO badge visible throughout; a11y and
`prefers-reduced-motion` rules honored.

---

## Dependencies

- Mock repository: `buffer-zone-repository` (+ mock impl), provider registry gated by `NEXT_PUBLIC_DEMO_MODE`
- Live driver: `slot_tick` (1s), `slot_rotated`, `field_event`, `vci_delta_recompute`
- Shared fixtures: exit VCI + station geometry (Sprint 3), pedestrian counts (Sprint 2)
- Shared components: `MapCanvas`, `StatChip`, alert banner (Sprint 3), `DemoBadge`, glow utilities (`globals.css`)
- Replaced: `MapDrawControl.tsx` editor stub
