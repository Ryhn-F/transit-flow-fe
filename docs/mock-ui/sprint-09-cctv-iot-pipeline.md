# Mock UI PRD — Sprint 9: CCTV & IoT Sensor Data Pipeline

**Sprint reference:** `docs/sprints/sprint-09-cctv-iot-pipeline.md`

## Purpose

Demonstrate fully automated ingestion: live CCTV streams with AI bounding boxes, IoT
foot-traffic counters streaming VCI inputs, and graceful fallback when a feed drops — all
simulated, no RTSP, WebRTC, or MQTT infrastructure.

## Demo Surfaces

### 1. Camera Grid (`/cctv` — new route)
- War-room grid of camera tiles (3×2 or 4×2) per station; each tile:
  - Simulated live feed: canvas/SVG animation of moving pedestrian dots with
    **YOLO-style bounding boxes** tracking them (privacy blur toggle active by default —
    Gaussian-blurred faces/plates, matching the real anonymization requirement)
  - Status chips: `STREAMING` (green pulse), `RECONNECTING` (amber), `OFFLINE` (rose)
  - Per-camera counter: directional pedestrian counts in/out, per-minute flow rate

### 2. Live Overlay Player (Station Master Dashboard)
- A featured "focus view" tile: larger canvas with bounding-box overlays + per-track
  confidence tags, plus a snapshot strip of the 10s Gemini-validation frames

### 3. IoT Foot-Traffic Counter Panel
- MQTT-style feed list: 6 IoT counters streaming payloads (`COUNTER-03: +12 / 5s`) with a
  connection ledger (message count, last heartbeat)
- VCI flow-rate bridge: counters feeding the Sprint 3 VCI readouts — a "PIPELINE" diagram
  (CCTV + IoT → VCI) with green/amber status per stage

### 4. Failure Fallback Demo
- Forced-failure mode (demo control): kill one camera → its tile goes RECONNECTING → the
  pipeline diagram shows **"fallback: field survey data"** (Sprint 2) with the VCI source
  badge switching from CCTV to SURVEY

## Mock Data

- 10 cameras across 3 stations with seeded motion trajectories (deterministic but varied)
- 6 IoT counters with heartbeat + payload cadences
- Per-camera validation frames (fixture snapshots) for the 10s Gemini sampling

## Liveness Simulation

- Pedestrian dots move continuously (60fps canvas); box counts jitter realistically
- A camera drops offline at demo minute ~3 (scheduled), auto-reconnects at ~6
- Counter payloads tick every 5s; VCI readout integrates counters (Sprint 3 live driver)

## Interactions

- Camera tile click → focus view; anonymization toggle (blur on/off to show the pipeline
  difference); grid filter by station/status
- Kill/revive demo buttons; pipeline diagram stage clicks → detail tooltips

## Demo Script

1. Open `/cctv` — 10 streams, all STREAMING with bounding boxes; counters ticking
2. Toggle anonymization off briefly to show raw tracking, back on
3. Kill camera 7 → RECONNECTING; pipeline shows VCI fallback to SURVEY data
4. Focus-view the camera — directional counts + Gemini validation frames
5. Camera 7 revives; pipeline returns to CCTV source

**Acceptance:** motion, tracking, counters, fallback, and reconnect are all fixture-driven;
no real media/streaming code paths; demo badge visible.

## Dependencies

- Mock repository: `cctv-repository`, `iot-counter-repository`
- Live driver: `camera_frame_tick` (60fps simulated), `camera_status_event`, `iot_payload`
- Shared fixture: stations/exits (Sprint 1), VCI (Sprint 3), survey fallback (Sprint 2)
