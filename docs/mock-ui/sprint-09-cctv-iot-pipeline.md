# Mock UI PRD — Sprint 9: Automated CCTV & IoT Sensor Data Pipeline

**Sprint reference:** `docs/sprints/sprint-09-cctv-iot-pipeline.md` (feature source of truth)
**Target branch:** `feature/mock-ui` · **Demo position:** 9 of 12 (after Predict Surge, before Retail Kiosk)
**Rubric:** D1–D10 against `docs/mock-ui/README.md` — target ≥9 each, average 10.

---

## D1 — Purpose & Problem

**Problem:** Today, crowd counting at stations relies on manual field surveys (Sprints 1–2)
and human eyeballing of CCTV. Operators need **automated, unattended** foot-traffic
ingestion — camera vision plus IoT counters — feeding the VCI engine (Sprint 3) without
manual measurement, while never losing data when a camera fails.

**Why the mock exists now:** Real RTSP/WebRTC, YOLO26-Pose/DeepSORT, and MQTT (Mosquitto/EMQX)
infrastructure does not exist in this repo. This PRD simulates the *observable* product —
live camera feeds with AI bounding boxes, IoT counter payloads, and pipeline health — so
stakeholders can validate the automation and fallback UX before infrastructure investment.

**Demo narrative:** Watch the pipeline run itself: cameras stream, boxes track pedestrians,
counters tick into VCI, then a camera fails mid-demo and the pipeline degrades gracefully
to field survey data — and recovers. The story is **automation + fallback trust**: the
system ingests by itself and never shows an empty dashboard.

**Stakeholder value:** MAPID/Dishub see zero-manual-counting operations; transit operators
see a self-healing pipeline; engineers see repository interfaces that swap mock → real
data without UI changes.

---

## D2 — Personas & Roles

| Persona | Can do in the mock | Cannot do in the mock |
| --- | --- | --- |
| **Station Master** (Maya, Manggarai) | Browse camera grid, focus-view any camera, read directional in/out counts + flow rates, toggle privacy blur, act on fallback alerts | Kill/revive feeds, edit pipeline stages, configure counters |
| **Security Ops** (Rendra) | Kill/revive cameras (drill control), toggle anonymization, monitor status chips and connection ledger, run the failure drill | Change VCI source logic, edit fixtures, dispatch wardens (Sprint 7) |
| **Pipeline Engineer** (Sarah) | Inspect pipeline diagram (CCTV + IoT → VCI), open stage tooltips, verify fallback source switching, read counter payload ledger | Export executive reports (Sprint 7), alter survey baseline (Sprint 2) |

---

## D3 — Information Architecture & Flows

**Page map:**

| Surface | Route | Home | Entry points |
| --- | --- | --- | --- |
| Camera Grid + Pipeline | `/cctv` (new route) | App shell sidebar "CCTV & IoT" (nav item) | Sidebar, Command Center "CCTV & IoT Pipeline" card (Sprint 7 hook) |
| Focus View (Overlay Player) | `/cctv?focus=CAM-07` (state-driven panel, no nav item) | Child of `/cctv` | Click a camera tile |
| IoT Counter Panel | `/cctv#counters` (in-page section) | Child of `/cctv` | Scroll/accordion anchor, pipeline diagram "IoT" stage click |
| VCI bridge | Sprint 3 `/dashboard` VCI readouts | Dashboard | Pipeline diagram "VCI" stage click (opens linked panel) |

**Flows:**
1. **Grid browse:** `/cctv` → filter by station/status → tile click → focus view → close (`Esc`/back) → grid state preserved.
2. **Failure drill:** Security Ops clicks **Kill feed** on CAM-07 → tile STREAMING → RECONNECTING (10s) → OFFLINE → pipeline source badge CCTV → SURVEY → dashboard VCI badge updates → **Revive feed** → RECONNECTING → STREAMING → source SURVEY → CCTV.
3. **Pipeline inspection:** pipeline diagram → stage tooltip (`PIPELINE: inference — 10 feeds, 6 tracked`) → click "IoT" → counter ledger scrolls into view.

---

## D4 — Screen & Component Specs

### 4.1 Camera Grid (`/cctv`)
Layout: app shell with left rail + header (title, station filter, status filter, **Anonymize feeds** toggle, DEMO badge). Body: responsive 3×2 / 4×2 tile grid; right rail: pipeline diagram + counter panel (collapsible).

| Component | Default | Loading | Empty | Error / Edge |
| --- | --- | --- | --- | --- |
| Grid surface (whole) | 10 tiles in 3×2/4×2 grid | Skeleton grid: 10 pulse tiles 300ms | (never on default dataset) | Repo/query failure → `Failed to load camera feeds.` + **Retry** button (React Query error state) |
| Camera tile | STREAMING: live canvas, bbox overlays, count readout, status chip | Skeleton tile (pulse) 300ms | — | Status chip per `CameraStatus` (below); tile count readout shows `--` while RECONNECTING/OFFLINE |
| Status chip | `STREAMING` emerald pulse | `…` | — | `RECONNECTING` amber / `OFFLINE` rose; chip `aria-live="polite"` |
| Grid filter bar | `All stations · All statuses` (two selects) | selects disabled | `No cameras match the current filter.` + **Reset filters** | Unknown station id → same empty state with reset; both selects reset to `All` |
| Bounding boxes | Person boxes w/ conf % | — | — | Track lost >3s → box fades (300ms); jitter paused during RECONNECTING |
| Anonymize toggle | ON (checked, blur active) | disabled during surface load | — | OFF = raw heads render (counts identical) |
| Kill/Revive buttons | `Kill feed` enabled when STREAMING; `Revive feed` enabled when OFFLINE | — | — | Disabled otherwise (`opacity-50 cursor-not-allowed`); rapid double-click debounced 1s |

**Camera tile states (D4 core):** `STREAMING` (emerald pulse, live canvas), `RECONNECTING` (amber, canvas frozen on last frame, 1.2s ping dash animation, counts `--`), `OFFLINE` (rose, static last frame + `FEED LOST` stamp). **Fallback active (edge):** when any camera in a station is not STREAMING, every tile in that station shows `VCI SOURCE: SURVEY (fallback)` (amber chip) and the pipeline diagram VCI stage turns amber.

### 4.2 Focus View (Live Overlay Player)
Large single-canvas player: bbox overlays with per-track confidence tags, directional counts panel (in/out/min flow rate), 10s Gemini-validation snapshot strip (6 thumbnail frames, mono timestamps). Keyboard: `Esc` closes, arrow keys switch cameras.

| State | Behavior |
| --- | --- |
| Default | Full-res canvas (warm from tile), boxes + conf tags, live counts, snapshot strip ticking |
| Loading | Canvas dimmed + spinner overlay (≤150ms — canvas already warm) |
| Empty (no tracks) | Ambient feed + `No pedestrians detected — showing ambient feed.` readout; counts at 0 |
| Error / edge | Unknown focus id (`/cctv?focus=BAD-99`) → inline `Camera not found.` panel + **Back to grid**; focused camera OFFLINE → frozen frame + `FEED LOST` stamp, counts `opacity-50`, snapshot strip labels `last valid frame 1:04s ago` |

### 4.3 IoT Foot-Traffic Counter Panel
Feed list (6 counters): `COUNTER-03 +12 / 5s` rows with heartbeat ledger (`last heartbeat 0:23s ago`, `msg/s`, 60s sparkline). VCI flow-rate bridge totals.

| Component | Default | Loading | Empty | Error / Edge |
| --- | --- | --- | --- | --- |
| Feed list row | `COUNTER-03` + `+12 / 5s` delta + status chip `CONNECTED` | Skeleton rows (pulse) 300ms | `No counters configured.` | `STALE >15s` amber / `SILENT >30s` rose chip |
| Heartbeat ledger | `last heartbeat 0:23s ago`, `msg/s` mono | `—` | `awaiting first payload` | Counter id not in fixtures → row ignored (logged, not rendered) |
| 60s sparkline | rolling deltas, cyan | flat baseline | — | Missing 5s buckets → gap render (no interpolation) |
| Panel-level edge | — | — | — | All 6 SILENT → banner `All counter feeds silent. VCI bridge on survey data.` |

### 4.4 Failure Fallback Demo
Pipeline diagram: three stage nodes (`INGEST` → `INFERENCE` → `VCI BRIDGE`) with green/amber per stage; source badge toggles `SOURCE: CCTV` / `SOURCE: SURVEY (fallback)`.

| State | Behavior |
| --- | --- |
| Default (all STREAMING) | 3 nodes green, badge `SOURCE: CCTV`, tooltips show live metrics |
| Loading | Nodes stagger in 200ms; skeleton connector lines |
| Fallback active | VCI BRIDGE node amber; badge `SOURCE: SURVEY (fallback)`; per-station tooltips list down feeds (`2/4 feeds down`) |
| Edge (multiple down) | INGEST + INFERENCE nodes amber once station-level STREAMING count < 50%; revive settles source SURVEY → CCTV after 2s window |

---

## D5 — Interactions & Micro-interactions

| Interaction | Behavior | Duration / Detail |
| --- | --- | --- |
| Tile click → focus | Tile expands into focus view (scale 1→1.06, ease-out `cubic-bezier(0.16,1,0.3,1)`), canvas re-renders at full res | 220ms |
| Anonymize toggle | Default **ON**: face/plate regions `filter: blur(8px)`; OFF shows raw heads; toggle state persists in zustand slice | instant, cross-fade 120ms |
| Kill feed | Button spins → tile STREAMING → RECONNECTING (amber ping 1.2s loop) → after 10s → OFFLINE (rose, static frame); toast fires on each transition | 10s RECONNECTING window |
| Revive feed | OFFLINE → RECONNECTING (ping) → STREAMING (fade-in of live canvas) | 6s reconnect window |
| Status transitions | Chip color cross-fade 200ms + Sonner toast on each state change | 200ms |
| Bbox jitter | Per-track position ±2px seeded noise at ~10Hz; confidence ±0.02 | continuous |
| Pipeline stage hover | Tooltip with stage name + live metric | 80ms fade |
| Tab focus loss / return | Sim pauses on hidden; resumes on visible with "SIM RESUMED" tick | instant |

A11y: status chips `aria-live="polite"`, canvas `role="img"` + `aria-label` ("Simulated feed CAM-07, 3 in, 2 out"), tiles keyboard-focusable (Enter opens), `Esc` closes focus view, focus returns to originating tile.

---

## D6 — Visual Design Spec

Dark war-room aesthetic (consistent with Sprint 7 Command Center), **dark-mode only** for this surface. Tokens below map to Tailwind v4 defaults; all values literal so implementers never guess.

**Base & surface tokens:**

| Token | Value | Usage |
| --- | --- | --- |
| Page bg | `bg-zinc-950` (`#09090b`) | entire `/cctv` surface |
| Panel bg | `bg-zinc-900/80` | tiles, pipeline diagram, counter panel, focus view shell |
| Panel border | `border-zinc-800` 1px (`#27272a`), `rounded-lg` (8px) | all panels |
| Shadow | `shadow-lg shadow-black/40` | panel elevation; focus view `shadow-xl` |
| Divider | `divide-zinc-800/60` | ledger rows, snapshot strip separators |
| Canvas chrome | `bg-black rounded-md border-zinc-800/60 aspect-video` | every tile canvas + focus player |

**Typography scale (mono-for-data / sans-for-UI):**

| Role | Spec |
| --- | --- |
| Page title | `text-base font-semibold text-zinc-100` sans |
| Section headers | `text-xs uppercase tracking-wider text-zinc-400` sans |
| Data readouts (counts, flow rate, heartbeat, msg/s) | `font-mono text-sm tabular-nums text-zinc-200` |
| Delta readouts (+12 / 5s) | `font-mono text-sm tabular-nums text-cyan-300` |
| Status chips / stamps | `text-[10px] font-semibold uppercase tracking-[0.15em]` |
| Conf tags on boxes | `font-mono text-[10px] text-cyan-300 bg-black/70 px-1 rounded-sm` |

**Spacing & layout:** rail 64px; tile grid `gap-4` (16px); tile padding `p-3`; panel padding `p-4`; section gap `gap-6`; focus view counts panel `w-56` fixed right column.

**Status color tokens (all 400-scale, hex for canvas/svg use):**

| Token | Value | Usage |
| --- | --- | --- |
| STREAMING | `emerald-400` `#34d399` | status chip + pulse (box-shadow `0 0 0 rgba(52,211,153,.6)` loop 1.2s) |
| RECONNECTING | `amber-400` `#fbbf24` | status chip + ping animation |
| OFFLINE | `rose-400` `#fb7185` | status chip, `FEED LOST` stamp |
| Accent | `cyan-400` `#22d3ee` | bbox boxes, deltas, sparklines |
| Neutral text | `zinc-400` `#a1a1aa` | labels, tooltips, secondary readouts |

**Overlay language:** bbox = 1px `cyan-400` stroke + fill `rgba(34,211,238,0.08)`; head region (privacy) = `blur(8px)` per D10; counting line = dashed `rgba(161,161,170,0.5)`; `FEED LOST` stamp = `font-mono text-[10px] text-rose-300 bg-rose-400/10 border border-rose-400/40 px-1.5 py-0.5 rotate-[-6deg]` centered on frozen frame.

**Feedback & focus:** focus-visible `ring-2 ring-cyan-400/70 ring-offset-2 ring-offset-zinc-950`; buttons hover `brightness-125` transition 150ms; disabled `opacity-50 cursor-not-allowed`. All pulse/ping/expand animations disabled under `prefers-reduced-motion` (D9).

**DEMO badge:** fixed top-right of `/cctv` header, `z-50` — `DEMO` text, `text-[10px] uppercase tracking-[0.2em]`, `border border-amber-400/50 text-amber-300 bg-amber-400/10 rounded px-2 py-0.5`, per README foundation.

---

## D7 — Content & Copy

- Status chips: `STREAMING` · `RECONNECTING` · `OFFLINE`; counter chips `CONNECTED` · `STALE >15s` · `SILENT >30s`.
- Filter empty: `No cameras match the current filter.` + action `Reset filters`.
- Fallback chip: `VCI SOURCE: SURVEY (fallback)`; source badges `SOURCE: CCTV` / `SOURCE: SURVEY (fallback)`.
- Toasts (Sonner): drop → `CAM-07 lost feed — pipeline switched to field survey data.`; recover → `CAM-07 restored — VCI bridge resumed from CCTV.`; offline → `CAM-07 offline. Counts frozen at last frame.`
- Buttons: `Anonymize feeds`, `Kill feed`, `Revive feed`, `Focus view`, `Reset filters`.
- Pipeline labels: `INGEST` `INFERENCE` `VCI BRIDGE`; tooltips e.g. `PIPELINE: inference — 10 feeds, 6 tracks, 96% avg conf`.
- Counter rows: `COUNTER-03` · `+12 / 5s` · `last heartbeat 0:23s ago`.
- Focus view heading: `LIVE OVERLAY — CAM-07 · MANGARRAI GATE A`.

---

## D8 — Mock Data Spec

```ts
// src/fixtures/cctv.ts
export interface CameraFixture {
  id: string; stationId: string; label: string;      // "GATE A"
  gate: { x: number; y: number };                    // counting-line midpoint (px)
  spawn: { lane: number; dir: 'IN' | 'OUT'; speed: number }; // param ranges
}
export interface ValidationFrame { cameraId: string; ts: number; thumb: string; conf: number; }
export interface IotCounterFixture { counterId: string; name: string; cadenceMs: number; seeded: boolean; }
```

| Fixture | Seed count | Realism notes |
| --- | --- | --- |
| Cameras | 10 across 3 stations (Manggarai 4, Sudirman 3, Dukuh Atas 3) | Per-station lane counts match Sprint 1 exit fixtures |
| Pedestrians / camera | 6–14 concurrent, seeded via mulberry32 (per-camera seed) | Deterministic trajectories, varied speeds 0.8–2.2 px/frame |
| Validation frames | 6 per camera (10s cadence nominal) | Thumbnails are canvas-rendered fixture stills |
| IoT counters | 6 (`COUNTER-01..06`), 5s cadence | Delta seeded, ±3 jitter; one counter `COUNTER-04` goes STALE mid-demo |

Extends the shared dataset: stations/exits (Sprint 1), survey baseline (Sprint 2), VCI readouts (Sprint 3) — the pipeline bridge writes **into** the Sprint 3 live driver, never a fork.

---

## D9 — Liveness & Behavior (Deterministic)

| Rule | Timing |
| --- | --- |
| Sim tick | `requestAnimationFrame`, 30–60fps; clamped to `max(1, frameDelta)` |
| CAM-07 drop (scheduled) | demo wall-clock minute **~3.0** (STREAMING → RECONNECTING) → OFFLINE at ~3:10 |
| CAM-07 auto-reconnect | minute **~6.0** (RECONNECTING 6s → STREAMING) |
| Heartbeat loss threshold | >15s without payload → STALE; >30s → SILENT |
| Reconnect attempts | every 10s during OFFLINE; guaranteed success at minute 6 |
| IoT payload cadence | 5s ± 300ms seeded jitter; `COUNTER-04` STALE at minute ~4, revives at ~5 |
| VCI integration | counter deltas accumulate into Sprint 3 VCI flow-rate readouts each 5s bucket |
| `prefers-reduced-motion: reduce` | lower fidelity: 4fps stepped render, no bbox jitter, no pulse/ping animations, no blur cross-fade |
| Tab visibility (hidden) | rAF suspended, sim clock pauses (no catch-up); minute markers count visible-sim-time only; on return, resumes with `SIM RESUMED` tick |

All state mutations flow through live-driver events (`camera_status_event`, `iot_payload`, `pipeline_source_switch`) — reproducible on every demo run because seeds and timings are fixed.

---

## D10 — Tech Specs

**Stack (fixed, no new frameworks):** Next.js 16 App Router, React 19, TS strict, Tailwind v4, MapLibre v6 (map hooks only), Zustand, React Query, RHF+Zod, Axios, Sonner, Lucide, Vitest, Playwright.

**Files:**

| Concern | Path |
| --- | --- |
| Route | `src/app/(app)/cctv/page.tsx` |
| Components | `src/components/cctv/{camera-tile,camera-canvas,focus-view,iot-counter-panel,pipeline-diagram,status-chip}.tsx` |
| Sim engine | `src/lib/cctv/{trajectory,sim-engine,bbox,blur,counters}.ts` |
| State | `src/store/cctv-store.ts` (zustand: cameras, statuses, blurEnabled, pipeline source, counters) |
| Data layer | `src/repositories/cctv-repository.ts`, `src/repositories/iot-counter-repository.ts` + `src/repositories/mock/*.mock.ts` |
| Fixtures | `src/fixtures/cctv.ts`, `src/fixtures/iot-counters.ts` |
| Live driver | `src/drivers/live-driver.ts` (adds `camera_frame_tick`, `camera_status_event`, `iot_payload`, `pipeline_source_switch`) |
| Tests | `src/lib/cctv/__tests__/{trajectory,counters}.test.ts`, `e2e/cctv-pipeline.spec.ts` |

**Canvas simulation:** `camera-canvas.tsx` renders via Canvas 2D; pedestrian positions come from `trajectory.ts` — parametric walk along a seeded lane polyline, `pos(t) = laneStart + dir * speed * (t mod laneLen)`, **no Math.random at render time**. Tick loop: `requestAnimationFrame` + `useEffect`; visibility pause via `document.visibilitychange`.

**Directional counters (trajectory math):** a counting line at `gate`; sign of crossing velocity `sign(dx) = IN | OUT`; per 5s bucket → `delta`; per-minute flow rate = rolling 60s sum; box jitter = seeded noise `±2px` position, `±0.02` conf at 10Hz.

**Privacy anonymization:** face/head region of each bbox drawn with `ctx.filter = 'blur(8px)'` (Canvas) or CSS filter on SVG overlays; toggle (default ON) flips a zustand boolean — renders differ, math identical.

**IoT feed:** `iot-counter-repository.subscribePayloads(cb)` streams `{ counterId, delta, ts }` at 5s cadence from a mock timer; ledger rows in `iot-counter-panel.tsx`.

**Pipeline state machine:**

```ts
type CameraStatus = 'STREAMING' | 'RECONNECTING' | 'OFFLINE';
type VciSource = 'CCTV' | 'SURVEY';
// STREAMING --drop--> RECONNECTING --10s--> OFFLINE --revive--> STREAMING
// any camera in station not STREAMING => pipeline source CCTV -> SURVEY (Sprint 2 baseline)
// all cameras STREAMING => SURVEY -> CCTV (no flicker: 2s settle window)
```

**Repository interfaces (mock implements production shape):**

```ts
export interface CctvRepository {
  listCameras(stationId?: string): Promise<Camera[]>;
  getCamera(id: string): Promise<Camera | undefined>;
  killCamera(id: string): Promise<void>;
  reviveCamera(id: string): Promise<void>;
}
export interface IotCounterRepository {
  listCounters(): Promise<IotCounter[]>;
  subscribePayloads(cb: (p: { counterId: string; delta: number; ts: number }) => void): () => void;
}
```

**Test strategy:** Vitest — trajectory determinism (same seed → same positions at t), counting-line math (IN/OUT totals), payload cadence, state machine transitions, reduced-motion config. Playwright — `e2e/cctv-pipeline.spec.ts`: kill → fallback badge → revive → source restore; anonymize toggle flips canvas; filter empty state renders.

---

## Demo Script (Acceptance)

1. Open `/cctv` — 10 tiles all `STREAMING`, bboxes tracking, counters ticking (`COUNTER-03 +12 / 5s`); DEMO badge visible. **Accept:** every tile animates with seeded motion; counter ledger increments.
2. Toggle **Anonymize feeds** off/on — faces blur, counts unchanged. **Accept:** toggle persists across focus view.
3. **Kill feed** CAM-07 (or wait for minute ~3) → RECONNECTING → OFFLINE; toasts fire; pipeline badge → `SOURCE: SURVEY (fallback)`; dashboard VCI badge flips to SURVEY. **Accept:** fallback within 10s of drop, no empty dashboard.
4. Focus-view CAM-07 → directional in/out counts + flow rate + 6 validation thumbnails. **Accept:** counts match seeded trajectory totals ±0.
5. **Revive feed** (minute ~6) → RECONNECTING → STREAMING; pipeline returns to CCTV; toast `CAM-07 restored — VCI bridge resumed from CCTV.` **Accept:** source settle ≤2s after reconnect.

**Global acceptance:** all motion, tracking, counters, fallback, and reconnect are fixture-driven through repository boundary + live driver; zero real media/streaming code paths; demo badge visible on every surface.

---

## Dependencies

- Mock repositories: `cctv-repository`, `iot-counter-repository` (+ `.mock.ts` impls)
- Live driver events: `camera_frame_tick`, `camera_status_event`, `iot_payload`, `pipeline_source_switch`
- Shared fixtures: stations/exits (Sprint 1), survey baseline (Sprint 2), VCI + live driver (Sprint 3), Command Center ticker hook (Sprint 7)
- Shared components: app shell + sidebar nav, status chip patterns, Sonner toast helpers, DEMO badge, mono readout styles (Sprint 7 conventions)
