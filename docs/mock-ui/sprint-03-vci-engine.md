# Mock UI PRD — Sprint 3: Real-Time VCI Engine

**Sprint reference:** `docs/sprints/sprint-03-vci-engine.md` · **Home:** `/dashboard`

## 1. Purpose (D1)

The platform's core intelligence is a live Volumetric Choke Index (VCI): every station
exit is scored every 60 seconds by the formula

`VCI = min(100, (PedestrianFlowRate + VehicularDropoffSurge) / (EffectiveChannelWidth × ComplianceFactor(α)) × 100)`

and rendered as a color-coded risk map, with automated threshold alerts (VCI ≥ 80) pushed
to hub station masters. **This mock demonstrates the entire engine — heatmap, formula
inspector, alert escalation — with zero Redis, BullMQ, Telegram, or SendGrid backend.**
Mock repositories implement the same interfaces the production services will; Sprint
delivery later swaps data sources, not UI.

**Stakeholder value:** MAPID/Dishub regulators see the national choke picture, audit the
formula via the inspector, and watch SLAs; operators validate <5s surge-alert delivery
(simulated ticks) before investing in alert infrastructure; hub station masters evaluate
the banner + channel-feed UX that will carry their evening-rush triage.

**Demo narrative:** open the dashboard → heatmap on → click the red zone to inspect the
math → wait for the recalc → Gate B crosses 80 → banner flashes → Telegram/WhatsApp/Email
deliveries tick into the feed. Full alert lifecycle in ~4 minutes, repeatable via
deterministic seed 42.

## 2. Personas & Roles (D2)

| Persona | In the mock, can… | In the mock, cannot… |
| --- | --- | --- |
| **Station Operator** (dashboard day-user, e.g. Manggarai control room) | Toggle the Live VCI layer; click zones to inspect the formula; acknowledge the choke banner; watch the recalc countdown | Change thresholds (locked at 80), dispatch wardens (Sprint 7), edit fixture data |
| **Hub Station Master** (alert recipient, e.g. Dukuh Atas) | Watch simulated Telegram/WhatsApp/Email deliveries arrive with timestamps; read alert detail incl. map link | Acknowledge from the dashboard (acknowledge is the operator's action) |
| **Dispatcher** (handoff recipient) | See the post-acknowledge SLA timer and the handoff note appear in the feed; watch escalation if SLA lapses | Operate the map or mutate liveness parameters |

## 3. Information Architecture & Flow (D3)

No new routes — all surfaces live on the existing `/dashboard` shell
(`src/app/dashboard/page.tsx` → `DashboardView`):

```
TopBar (with DEMO badge) ── Choke Alert Banner (top, below bar)
MapCanvas ── Live VCI Heatmap layer (in-map)
   └─ VCI Inspector popover (anchored to clicked zone)
Right rail: Active Layers panel (+ "Live VCI Heatmap" toggle) │ Alert Channel Feed (tabs)
Recalc countdown chip (bottom-left map stack)
```

| Flow | Steps |
| --- | --- |
| Monitor | Open `/dashboard` → toggle **"Live VCI Heatmap"** → read 8 color-coded zones → click red zone → formula inspector |
| Respond | Banner fires (VCI ≥ 80) → audio cue → operator clicks **Acknowledge & Dispatch** → banner collapses, SLA timer starts, handoff appears in feed |
| Verify delivery | Open **Alert Channel Feed** → Telegram / WhatsApp / Email tabs → delivery ticks + timestamps |
| Recovery | Feed tab shows a failed delivery → "Retrying" → succeeds on next driver tick; banner re-fires only after hysteresis |

## 4. Screen & Component Specs (D4)

### 4.1 Live VCI Heatmap Layer (`vci-heatmap-layer.tsx`)
- 150m-radius polygon zones around each exit; fill color by band.
- **Default:** 3 GREEN / 4 YELLOW / 1 RED zones visible.
- **Empty:** no zones in current viewport → layer hidden, legend dims, no error.
- **Loading:** query in flight → zones absent, layer toggle shows 12px spinner
  (`Loader2 animate-spin`); map itself stays interactive.
- **Error:** repository failure → toggle shows red error chip + "Retry" (re-runs
  `invalidateQueries`); zones show last-known snapshot with an "STALE" tag in the legend.
- **Edge:** layer off → zones removed from style, toggle unchecked; zoom < 13 → zones
  render smaller via `circle-radius`-style scaling (fixed polygon scale 0.8), no breakage.

### 4.2 VCI Inspector Popover (`vci-inspector-popover.tsx`)
- Click zone → popover anchored to the zone centroid with formula breakdown.
- **Default:** closed; **Open:** fields VCI SCORE / PED FLOW / DROP-OFF SURGE / WIDTH × α
  with live mono values + per-term band chips.
- **Empty:** metric vanished (driver removed exit) → "No metric for this zone yet".
- **Loading:** skeleton rows (`animate-pulse` bars); **Error:** inline retry button.
- **Edge:** `effective_width_m = 0` (maintenance) → VCI shows "—", flag "EXIT CLOSED",
  formula denominator shown as `0 × α`.

### 4.3 Choke Alert Banner (`choke-alert-banner.tsx`)
- Full-width strip under TopBar. **Default:** hidden. **Open:** flashing rose
  `glow-crimson` bar + `animate-pulse` dot + **"Acknowledge & Dispatch"** button.
- **Edge:** two exits ≥ 80 concurrently → stacked banner queue (next alert slides in after
  ack); acknowledged → collapsed to a slim "1 OPEN" chip with SLA timer
  (`mono`, `SLA 14:32`), which turns red at < 5:00 and escalates the handoff to the feed.

### 4.4 Alert Channel Feed (`alert-channel-feed.tsx`)
- Right-rail panel, tabs **Telegram / WhatsApp / Email**; each message: channel icon,
  alert title, delivery tick, status dot.
- **Default:** seeded history; **Empty tab:** "No Telegram messages delivered yet";
  **Loading:** skeleton rows; **Error:** "Delivery feed unavailable — Retry".
- **Edge:** failed delivery row renders `status: FAILED` in rose with "Retrying in 10s"
  auto-pulse; recovers on the next driver attempt.

### 4.5 Recalc Countdown (`recalc-countdown.tsx`)
- Mono chip bottom-left: `RECALC IN 34S`. **Default:** counts 60→0 each cycle; **Edge:**
  at 0 → chip flashes `RECALCULATING` 600ms, zones cross-fade to new colors (300ms).

### 4.6 Station Info Card upgrade (`station-info-card.tsx`)
- Replace hardcoded `MOCK_VCI` with the live-driver snapshot for the selected station:
  score, PED FLOW, WIDTH × α, plus a 24h SVG sparkline (96 points, in-house polyline).
  Same states as 4.1 (STALE tag when driver behind).

## 5. Interactions & Micro-interactions (D5)

| Interaction | Behavior | Duration / feedback |
| --- | --- | --- |
| Layer toggle | `toggleLayer("vciHeatmap")`; zones fade in via MapLibre `opacity` transition | 300ms ease; checkbox tick + blue ring |
| Zone click | `map.on("click","vci-zone-fill")` → inspect | Popover opens 150ms spring (`scale .96→1`); Esc / outside click closes |
| Inspector hover | Per-term tooltip: "α = walkway compliance (Sprint 1 survey)" | 120ms fade, `title` attr fallback |
| Banner fire | Slides in from top `-translate-y-full→0`; dot pulses; audio cue (WebAudio 880Hz two-tone, 120ms) | Slide 250ms cubic-bezier; flash until ack; **audio skipped under `prefers-reduced-motion`** |
| Acknowledge | Button → toast + collapse; SLA timer starts at 15:00 | Collapse 200ms; toast 3.5s auto-dismiss |
| Recalc | Countdown chip ticks 1s; at 0 flash + zone color cross-fade | 600ms flash; 300ms `fill-color` transition |
| Sparkline hover | Crosshair + `HH:MM · VCI 87` tooltip | 100ms; pointer-following |
| Tab switch (feed) | Fade between channel lists; unread dot clears | 150ms fade; no scroll jump |

Keyboard: banner button + toggle + inspector reachable via Tab; `Esc` closes inspector;
all targets ≥ 40px hit area. All `animate-pulse`/flash/glow variants are suppressed under
`prefers-reduced-motion` (static ring instead; see §9).

## 6. Visual Design Spec (D6)

- **Panels:** `bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border-white/[0.08]
  rounded-2xl shadow-2xl p-4.5` — identical to `station-info-card`/`live-alerts-panel`.
- **Typography:** data = `font-mono` (scores, counts, timestamps, SLA, `tracking-wider`);
  interactive/headings = sans `font-bold tracking-tight`; micro-labels =
  `text-[11px] font-bold uppercase tracking-[0.2em]`; data values `text-2xl font-mono font-black`.
- **Status colors:** emerald-500 (GREEN/Smooth), amber-400 (YELLOW/Warning),
  rose-500 (RED/Choke) — chips `bg-{c}-500/10 border-{c}-500/20 text-{c}-500`.
- **Glow utilities:** `glow-emerald`, `glow-amber`, `glow-crimson` on status bars/dots.
- **VCI band fills:** `#10b981` (0.28), `#f59e0b` (0.45), `#f43f5e` (0.62) — same hues as
  chips so legend maps 1:1 to the map.
- **DEMO badge:** `DemoBadge` in TopBar — `DEMO MODE` mono `text-[9px]` chip,
  `bg-indigo-500/10 border-indigo-500/20 text-indigo-400`, rendered only when
  `NEXT_PUBLIC_DEMO_MODE=true`; also a faint corner watermark on the map canvas.
- **Dark/light:** full parity as in existing panels; light theme uses `bg-slate-50`
  metric tiles and `border-slate-200/80` equivalents.

## 7. Content & Copy (D7)

- Toggle: **"Live VCI Heatmap"**; legend labels **Smooth (VCI < 50)** · **Warning (50–79)** · **Choke Risk (≥ 80)**.
- Banner: `"CHOKE RISK — Dukuh Atas Gate B (VCI 92)"`; button **"Acknowledge & Dispatch"**.
- Inspector labels: **VCI SCORE**, **PED FLOW**, **DROP-OFF SURGE**, **WIDTH × α**,
  **RECALC IN 34S**, **FORMULA**: `(PED + SURGE) / (WIDTH × α) × 100`.
- Acknowledge toast: `"Alert acknowledged — dispatch handoff sent to Command Center (Sprint 7)"`.
- Empty states: `"No metric for this zone yet"` · `"No Telegram messages delivered yet"` ·
  `"No choke zones in view"`.
- Error copy: `"Live VCI feed unavailable — showing last known snapshot"` ·
  `"Delivery feed unavailable — Retry"` · `"Retrying in 10s"`.
- Feed status: `"DELIVERED 18:42:03"` / `"QUEUED"` / `"FAILED — retry 2/3"`.

## 8. Mock Data Spec (D8)

Typed fixtures extend the shared dataset (Sprint 1 `ExitChannel` widths, Sprint 2
pedestrian counts). All fields snake_case to match `src/entities/vci-metric.ts`.

| Type | Fields (TS) | Seed |
| --- | --- | --- |
| `VCIMetric` (exists) | `channel_id, timestamp, pedestrian_flow_rate_ppm, vehicular_dropoff_surge_vpm, effective_width_m, compliance_factor, vci_score (0–100), alert_level: NORMAL\|WARNING\|CRITICAL` | 8 exits × 96 history points (15-min → 24h) |
| `VCIAlert` | `alert_id, channel_id, station_name, vci_score, raised_at, status: OPEN\|ACKNOWLEDGED\|ESCALATED, sla_deadline?` | 6 seeded + 1 scripted (Gate B) |
| `ChannelDelivery` | `delivery_id, alert_id, channel: TELEGRAM\|WhatsApp\|EMAIL, status: QUEUED\|DELIVERED\|FAILED\|RETRYING, attempt, delivered_at?` | 6 Telegram / 5 WhatsApp / 4 Email seeded |
| `VCISnapshot` | `generated_at, metrics: VCIMetric[], alerts: VCIAlert[]` | per-tick, from driver |

**Seed:** 3 stations — Manggarai (3 exits), Dukuh Atas (3), Sudirman (2). Deterministic
seed `42`: Gate B (Dukuh Atas) climbs past 80 at `t = 2× recalc`; 17:00–19:00 WIB evening
rush realism (Manggarai + Dukuh Atas per sprint stress-test note); compliance factors
0.55–0.95 reflecting Sprint 1 survey obstructions.

## 9. Liveness & Behavior (D9)

| Rule | Deterministic spec |
| --- | --- |
| Recalc | Every 60s (`vci_tick`); visible countdown; scores drift `score(t) = base + A·sin(2π(t−t₀)/T) + jitter(±2, seed 42)`, `T=240s` for the scripted Gate B climb |
| Threshold crossing | `vci_score ≥ 80` → `CRITICAL` + `vci_alert_triggered`; fires once per exit until acknowledged **or** score < 70 (hysteresis) |
| Channel delivery | Telegram +2s, WhatsApp +5s, Email +12s after trigger (sprint spec: broadcast <5s); one seeded `FAILED` (Email, attempt 2) to demo retry |
| SLA | Acknowledge starts 15:00 countdown; < 5:00 banner turns rose-dark; lapse → `ESCALATED` handoff in feed |
| `prefers-reduced-motion` | No flash/pulse/glow animation; audio cue muted; cross-fades become 0ms |
| Tab visibility | `document.hidden` → driver pauses; on return, exactly one catch-up tick (no burst); stale tags shown while hidden > 90s |

## 10. Tech Specs (D10) — fixed stack, no new frameworks

**Files**

| Concern | Path |
| --- | --- |
| Entities | `src/entities/vci-metric.ts` (extend: `VCIAlert`, `ChannelDelivery`, `VCISnapshot`) |
| Zod schemas | `src/features/vci/schemas/vci-schemas.ts` (`vciMetricSchema`, `vciAlertSchema`, `channelDeliverySchema`, `vciSnapshotSchema`) |
| Formula + drift lib | `src/features/vci/lib/vci-formula.ts`, `vci-drift.ts`, `build-zone-polygon.ts` (24-vertex 150m circle, in-house — no Turf in FE) |
| Repository | `src/infrastructure/repositories/vci-repository.ts` (interface) + `src/infrastructure/repositories/mock/vci-mock-repository.ts` |
| Live driver | `src/infrastructure/live/vci-live-driver.ts` (zustand timer, ~30s→60s configurable) |
| Store | `src/features/vci/store/vci-ui-store.ts`, `vci-live-store.ts` |
| Hooks | `src/features/vci/hooks/use-vci-snapshot.ts`, `use-vci-history.ts` |
| Components | `src/features/vci/components/{vci-heatmap-layer,vci-inspector-popover,choke-alert-banner,alert-channel-feed,recalc-countdown,vci-sparkline}.tsx` |
| Fixtures | `src/infrastructure/repositories/mock/fixtures/vci-fixtures.ts` (seed 42 generator) |

**Repository interface**

```ts
export interface VCIRepository {
  getLiveSnapshot(): Promise<VCISnapshot>;
  getHistory(channelId: string, windowHours?: number): Promise<VCIMetric[]>; // 24h
  getAlerts(limit?: number): Promise<VCIAlert[]>;
  acknowledgeAlert(alertId: string, note?: string): Promise<VCIAlert>;
}
// vciMockRepository: in-memory, seeded from vci-fixtures, mutated only by the live driver
```

**React Query keys:** `["vci","snapshot"]` (refetchInterval 60_000, aligned to driver
tick), `["vci","history", channelId]`, `["vci","alerts"]`. Driver events mutate
`vciLiveStore` (zustand `create`); components subscribe via selectors
(`useVCILiveStore(s => s.snapshot)`); react-query reads static repository data.
`invalidateQueries(["vci","alerts"])` on ack.

**Zustand stores**

```ts
vciLiveStore: { snapshot: VCISnapshot|null, countdownSec: number, deliveries: ChannelDelivery[],
  start(), stop(), applyTick(), applyAlertTriggered(a: VCIAlert), applyDelivery(d: ChannelDelivery), applyAck(alertId: string) }
vciUIStore: { vciLayerOn: boolean, selectedZoneId: string|null, ackIds: string[],
  channelTab: "TELEGRAM"|"WhatsApp"|"EMAIL", toggleVCILayer(), selectZone(id|null), acknowledge(id) }
```

**MapLibre layer spec (v6)**

```
Source "vci-zones" (type "geojson", in-memory; setData() on each tick — never rebuilt)
Layer "vci-zone-fill"  type "fill"   paint:
  fill-color:  ["match",["get","vci_band"],"GREEN","#10b981","YELLOW","#f59e0b","RED","#f43f5e","#10b981"]
  fill-opacity:["match",["get","vci_band"],"GREEN",0.28,"YELLOW",0.45,"RED",0.62,0.28]
Layer "vci-zone-outline" type "line"  paint: line-color same match, line-width 1.5
Click: map.on("click","vci-zone-fill") → feature.properties → selectZone()
```

**Live-driver events:** `vci_tick` (60s), `vci_snapshot_replaced`,
`vci_alert_triggered` (dedupe + hysteresis), `vci_channel_delivery`
(2s/5s/12s schedule), `vci_alert_acknowledged`, `vci_sla_escalated`.

**Validation:** fixtures validated at boot by zod (`NEXT_PUBLIC_DEMO_MODE=true`); driver
mutations re-validated before write to `vciLiveStore`. RHF not needed in Sprint 3 (no
input surfaces); zod doubles as the future API contract.

**Tests — Vitest** (`src/features/vci/**/*.test.ts`): formula math + 100-clamp + band
boundaries (49/50/79/80) + zero-width guard; drift golden sequence from seed 42;
hysteresis (fires once, re-arms < 70); fixture schema validation; live-store transitions
OPEN→ACKNOWLEDGED→ESCALATED; zone polygon centroid/vertex count.
**Playwright** (`e2e/vci.spec.ts`): toggle layer → 3/4/1 zone counts in map style; inspect
red zone → formula values visible; banner appears when Gate B ≥ 80, audio spy called;
acknowledge → SLA timer + toast; feed tabs switch; `prefers-reduced-motion` context: no
`animate-pulse` class, no audio call.

## 11. Demo Script (acceptance)

1. Open `/dashboard`; DEMO badge visible; enable **Live VCI Heatmap** → 3 green, 4 yellow, 1 red zone.
2. Click the red zone → inspector shows formula + live values; hover terms for tooltips.
3. Watch `RECALC IN 34S` → at 0, Gate B climbs 88 → banner slides in, audio cue; acknowledge → toast + SLA timer `15:00`.
4. Open **Alert Channel Feed** → Telegram delivered, WhatsApp +5s, Email retry → success; handoff note in feed.

**Acceptance criteria:** all scores/heatmaps/alerts derive from live-driver state — zero
hardcoded JSX; deterministic replay (seed 42) yields identical demo; `prefers-reduced-motion`
disables flash/audio; all states in §4 pass; Vitest suite green; Playwright spec green.

## Dependencies

- Shared foundation: `NEXT_PUBLIC_DEMO_MODE`, fixture registry, `DemoBadge`, live driver
  base class (from mock-ui README)
- Shared fixtures: station exits + widths (Sprint 1), pedestrian counts (Sprint 2)
- Existing components: `map-canvas` (`onMapReady`), `station-info-card`, `live-alerts-panel`,
  `active-layers-panel` (add toggle), `stat-chip`
- Hooks: Sprint 7 Command Center ticker (handoff note), Sprint 8 forecast (live-VCI convergence)
