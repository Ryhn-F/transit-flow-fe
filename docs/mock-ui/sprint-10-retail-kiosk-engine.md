# Mock UI PRD — Sprint 10: Retail Kiosk Engine

**Sprint reference:** `docs/sprints/sprint-10-retail-kiosk-engine.md`

## 1. Purpose (D1)

Demonstrate the **non-farebox revenue (NFR) monetization engine**: place, resize, and
score virtual 3×3m retail kiosks inside **Zero-Choke Zones**, estimate revenue from
foot-traffic + SES overlays, enforce pedestrian safety, and export a leasing proposal —
all driven by fixtures, no spatial/PDF backend required.

**Demo narrative:** "A transit operator monetizes dead station space safely." The story
unfolds as one continuous flow: zoning → placement → scoring → proposal → permit →
compliance monitoring, mirroring the real sprint's commercial trial at **Dukuh Atas TOD**.

**Stakeholder value:**
- **Dishub / transit operators:** a concrete path to NFR revenue (leasing, rent, permit
  fees) with safety constraints that protect the operator from choke-zone liability
- **MAPID:** SES + POI catalog consumed as a revenue-scoring overlay — data monetization
  story
- **Commercial teams:** a 1-click leasing proposal replaces spreadsheet workflows
- **Informal vendors:** digital spatial permits = formalization story (policy audience)

The mock exists now because SES/POI pipelines (PostGIS) and the Puppeteer PDF service
are not built yet; every surface below simulates them through repositories.

## 2. Personas & Roles (D2)

| Persona | Can do in the mock | Cannot do |
| --- | --- | --- |
| **Leasing Analyst** (transit commercial team) | Open `/kiosks`; toggle SES/POI layers; drag/resize kiosk footprints; read visibility + revenue scores; select a slot for proposal | Issue permits; edit SES bands; set rent benchmarks |
| **Commercial Lead** (approves deals) | Adjust SES-band rent benchmark (fixture dropdown); generate & download the leasing proposal; lock a placement as "offered" | Edit footprint geometry directly (view-only map) |
| **Vendor Officer** (permit desk) | Browse vendors; issue digital spatial permits on approved slots; acknowledge VIOLATION drift; revoke permits | Place/resize kiosks; edit revenue benchmarks |
| **Demo host** (rehearsed script §11) | Drives the whole flow and the scheduled drift event | — |

## 3. Information Architecture & Flow (D3)

| Surface | Route | Home / entry |
| --- | --- | --- |
| Kiosk Zoning Studio | `/kiosks` (new route) | Dashboard "Active Spatial Layers" toggle + Command Center "Retail" card (Sprint 7 hook) |
| Revenue Estimator panel | `/kiosks#estimator` (right rail, same route) | Opens when a footprint is selected |
| Proposal preview modal | `/kiosks#proposal` (modal, route-query aware) | "Generate Proposal" CTA in estimator panel |
| Vendor Permit desk | `/kiosks/permits` (tab within `/kiosks` via `?tab=permits`) | Tab switch; deep-linkable for the demo |

**Primary flow:** `/kiosks` → toggle SES/POI → select slot → drag/resize → constraint
check passes → revenue card → Generate Proposal → preview/download → Issue Permit →
(t+240s) drift → VIOLATION badge → acknowledge → COMPLIANT restored.
**Supporting flow:** `/kiosks/permits` → vendor row → permit detail → ISSUED → COMPLIANT.
Invalid placement and violation flows (§5) are reachable in both directions; every
surface keeps the map canvas visible so the demo never dead-ends.

## 4. Screen & Component Specs (D4)

### 4.1 Kiosk Studio map (`/kiosks`)
- MapLibre canvas (base layer, stations/exits from shared fixture), toolbar: **SES
  overlay**, **POI markers**, **Zero-Choke Zones**, **Corridor** toggles
- **Zero-Choke layer:** precomputed fixture polygons — green zones (high traffic, low VCI)
  where placement is legal; **2.5 m clear-walkway corridors** rendered as hatched rose bands
- **Slots layer:** 12 fixture slots (ghost dashed outlines); placed kiosks as solid
  footprints with selection ring + size/dimension chip

| State | Behavior |
| --- | --- |
| Default | 12 slots, 5 placed, zones + corridors visible, SES on |
| Loading | Map shell + skeleton panel; slots appear after `kiosk-repository` resolves |
| Error | Toast "Failed to load kiosk slots — retry"; Retry re-queries; map base remains |
| Empty ("no slots") | Filter/footprint 3×3m cannot fit → panel reads "No slots fit this footprint in the selected zone" |
| **Invalid placement** | Footprint turns rose + dashed; constraint toast; snaps back (§5) |
| **Corridor blocked** | Walkway polygon cross-highlighted; chip "2.5 m walkway blocked" |
| Selection | Ring + estimator card slides in (right rail) |

### 4.2 Revenue Estimator panel
Per-kiosk card: **Visibility 0–100**, **Rp monthly revenue range**, **rent per m² vs SES
band**, **payback months**, factor breakdown bars (traffic / SES / POI density / clearance).

| State | Behavior |
| --- | --- |
| Default / selected | Full scores for the 5 placed kiosks; selection updates panel |
| Loading | Skeleton bars while `estimateRevenue()` computes |
| Error | "Estimate unavailable" + retry |
| Stale | Score drifts with VCI tick → "recomputed 8s ago" chip; number animates |
| No selection | Panel shows empty hint: "Select a footprint to score" |

### 4.3 Proposal preview modal (no new PDF lib)
"Generate Proposal" → modal: site map with footprints, traffic heatmap thumbnail, revenue
table, terms block, "Download (HTML)" + "Print / Save as PDF" actions (§10).

| State | Behavior |
| --- | --- |
| Disabled CTA | No kiosk selected → button disabled with tooltip "Select a scored kiosk first" |
| Generating | 1.8s shimmer + "Composing proposal…" (fixture delay) |
| Preview | Rendered printable HTML view; Kiosk #3 of 5 header |
| Downloaded | Sonner "proposal-dukuh-atas.html saved"; no server round-trip |

### 4.4 Vendor Permit desk (`/kiosks?tab=permits`)
Vendor table + permit cards (permit polygon on map, validity, status).

| State | Behavior |
| --- | --- |
| Default | 8 vendors; 6 COMPLIANT, 2 VIOLATION seeded |
| Empty | "No vendors registered yet — issue the first spatial permit" |
| **Violation drift** | VIOLATION badge pulses; row rose-tinted; map polygon highlighted; toast on drift event |
| Issued | ISSUED chip (pending first validation) → becomes COMPLIANT after "Validate" click |
| Revoked | Chip "REVOKED", footprint hidden from map |

## 5. Interactions & Micro-interactions (D5)

| Interaction | Spec (incl. durations) |
| --- | --- |
| **Place (drag-in)** | Pointer-down on slot ghost → footprint follows cursor at 0.6 opacity, 1.03 scale; pointer-up runs constraint check |
| **Grid snap** | 0.5 m snap grid derived from map scale (§10); snap feedback = 120ms ring pulse at snapped position + haptic-style corner ticks |
| **Resize** | Corner handle drag; min 3×3 m, max 6×6 m, 0.5 m steps; live dimension chip `3.0 × 4.5 m` |
| **Snap-back (invalid)** | 350ms `cubic-bezier(0.2, 1.4, 0.4, 1)` return to last valid footprint; rose flash on rejection zone (200ms fade); Sonner toast 4s |
| **Selection** | Ring + panel slide-in 220ms ease-out; ESC deselects |
| **SES toggle** | Layer crossfade 250ms; POI markers pop with 150ms stagger (max 12) |
| **Violation badge** | Pulse 1s ×3 (scale 1→1.15→1) then steady; acknowledgment click fades row 300ms |
| **Proposal** | Generate shimmer 1.8s; modal scale-in 200ms; "Print" opens browser print dialog |
| **Keyboard** | Tabs, toggles, and slot cards focusable; arrows nudge selected footprint 0.5 m (re-validated on release) |
| **`prefers-reduced-motion`** | All animations collapse: instant snap-back, static badge, no shimmer |

Error recovery: failed save → footprint stays at last valid geometry, toast "Could not
save placement — try again"; retry re-posts to the repository.

## 6. Visual Design Spec (D6)

| Token | Spec |
| --- | --- |
| Theme | Design-system dark/light via `@theme` tokens; page uses existing panel language (slate-900 / white surfaces) |
| Data type | Mono for scores, Rp figures, and payback months (`tabular-nums`, `font-mono`); sans for UI labels |
| Zero-Choke zone | `emerald-500/20` fill, `emerald-400` 1.5px stroke; corridor = `rose-500/10` fill + dashed `rose-400` stroke with 0.5m hatch |
| SES tints | Bands 1→5 gradient `rose-300/20 → amber-300/20 → lime-300/20 → emerald-300/20 → teal-300/20` fill over zones; legend chip top-left |
| POI markers | Lucide icons (store, credit-card, building) at 14px, `brand` tint; ≤40 shown |
| Kiosk footprint | White 1px outline + `brand` 2px selection ring; invalid = `rose-500` dashed |
| Status chips | `STREAMING`-style: COMPLIANT green, VIOLATION rose, ISSUED amber (reuses Sprint 9 chip patterns) |
| DEMO badge | Shared `DEMO MODE` amber chip, top-right, non-interactive, on every surface |
| Spacing/typography | 4px grid, `text-xs` labels, `text-sm` body, panel width 320px right rail |

## 7. Content & Copy (D7)

Quoted, fixture-driven strings (en; id variants deferred to Sprint 11):

| Surface | Copy |
| --- | --- |
| Layer toggles | `"SES Overlay"`, `"POI Markers"`, `"Zero-Choke Zones"`, `"2.5 m Clear Walkway"` |
| Constraint toasts | `"Kiosk blocks the 2.5 m walkway — snapped back"` · `"Footprint inside choke corridor — placement rejected"` |
| No-slot empty | `"No slots fit this footprint in the selected zone"` |
| Estimator | `"Select a footprint to score"` · `"Estimate unavailable"` · `"recomputed 8s ago"` |
| Proposal | `"Select a scored kiosk first"` · `"Composing proposal…"` · `"proposal-dukuh-atas.html saved"` |
| Permit states | `"ISSUED"` · `"COMPLIANT"` · `"VIOLATION — footprint drifted into choke corridor"` · `"No vendors registered yet — issue the first spatial permit"` |
| Errors | `"Failed to load kiosk slots — retry"` · `"Could not save placement — try again"` |

## 8. Mock Data Spec (D8)

Typed fixture schema (extends shared stations/exits, VCI history, POIs, SES from the
foundation dataset):

```ts
// src/mocks/fixtures/kiosks/fixture.ts
interface KioskSlot       { id: string; zoneId: string; bounds: GeoJSON.Polygon }   // 12
interface KioskPlacement  { id: string; slotId: string; footprint: GeoJSON.Polygon
                            sizeMeters: [number, number]; visible: boolean }       // 5
interface VendorPermit    { id: string; vendorName: string; polygon: GeoJSON.Polygon
                            status: 'ISSUED'|'COMPLIANT'|'VIOLATION'|'REVOKED'
                            issuedAt: string; validUntil: string }                 // 8
interface SesBand         { band: 1|2|3|4|5; tint: string; rentPerM2: number }      // 3 bands
interface PoiFeature      { type: 'warung'|'minimarket'|'atm'; lat: number; lng: number } // 40
interface VciSnapshot     { exitId: string; vci: number; ts: string }              // Sprint 3 feed
```

**Seed counts & realism:** 12 slots, 5 placed (2 near-high-traffic exits), 8 vendors (6
COMPLIANT, 2 VIOLATION), 3 SES bands around Dukuh Atas, 40 POIs within 250m. Names and
geometry seeded deterministically (mulberry32) so scores are reproducible across reloads;
benchmarks reflect Jakarta street-retail ranges (Rp 75k–150k/m²/day band floors).

## 9. Liveness & Behavior (D9)

| Driver event | Rule (deterministic) |
| --- | --- |
| `traffic_score_tick` | Every 8s, recompute each visible kiosk's visibility from the Sprint 3 VCI live value (§10 formula); numbers animate; `stale` chip updates |
| `vendor_geo_drift` | Scheduled at demo **T+240s**: vendor "Pak Rudi" (ID `V-07`) footprint shifts   0.7 m NE, intersecting corridor → status `COMPLIANT→VIOLATION`; badge pulse + toast + row tint |
| Drift reversal | "Validate" after acknowledge re-checks polygon; fixture resolves at T+420s by nudging 0.7 m back → VIOLATION→COMPLIANT (proves the loop) |
| Tab visibility | Timers pause when tab hidden; on refocus, elapsed demo-time collapses to the scheduled event (no burst) |
| Motion | `prefers-reduced-motion` media query disables all animation, not the liveness ticks |
| `NEXT_PUBLIC_DEMO_MODE` | Off → route still renders with empty-state surfaces (repos return no fixtures) |

## 10. Tech Specs (D10)

Stack fixed: Next.js 16 App Router, React 19, TS strict, Tailwind v4, MapLibre GL v6,
Zustand, TanStack React Query, RHF+Zod, Axios (stubbed by repos), Sonner, Lucide,
Vitest, Playwright. **No new frameworks** (no PDF lib, no Turf — polygon math is
in-house).

| Concern | Implementation |
| --- | --- |
| Route | `src/app/(demo)/kiosks/page.tsx` (+ `?tab=permits`); header link + Dashboard layer toggle |
| Studio map | `src/features/kiosks/components/kiosk-studio-map.tsx` — MapLibre `mapbox-gl` Map with GeoJSON sources: `zero-choke` (fixture polygons, `fill` + `fill-outline`), `corridors` (`line` dashed), `kiosk-footprints` (`fill` + `fill-outline`), `poi-layer` (`symbol` + Lucide-rendered images) |
| Footprint editing | Pointer events on the map canvas (`pointerdown/move/up`); hit-test via `map.queryRenderedFeatures` on `kiosk-footprints`; drag + corner-handle resize mutates a working GeoJSON source with `map.getSource('kiosk-footprints').setData(...)`; **meters-per-pixel** at zoom: `mpp = 156543.03392 * cos(lat) / 2^zoom`; 3×3 m → `3/mpp` px; **grid snap** rounds to `0.5/mpp` px offsets |
| Constraint check | Pure function `src/features/kiosks/lib/constraints.ts` — `isPlacementValid(footprint, chokePolys, corridorPolys): { ok: true } | { ok: false; reason: 'corridor' | 'choke' | 'bounds' }` using in-house point-in-polygon + segment-distance ≥ 2.5 m to corridor edges; drives snap-back, `kiosk-constraint` store event |
| Revenue estimator | Deterministic fixture math in `src/features/kiosks/lib/revenue.ts`: `traffic = 100 − vci`; `poiScore = min(30, poisWithin250m × 1.5)`; `sesScore = band × 8`; `visibility = clamp(traffic×0.35 + sesScore + poiScore + clearanceBonus(5 if ≥2.5m else 0), 0, 100)`; `monthly = visibility/100 × footfall × 0.009 × 12_500 × 30`; `rent = max(bandFloor, monthly × 0.12)`; `payback = 85_000_000 / (monthly − rent)` months |
| Proposal export | **No PDF lib** — modal renders a printable HTML view (`src/features/kiosks/components/proposal-preview.tsx`) with `@media print` styles; "Print / Save as PDF" → `window.print()`; "Download (HTML)" → `Blob` + anchor download of the serialized fixture HTML |
| Permit state machine | `src/features/kiosks/lib/permit-machine.ts` — `DRAFT → ISSUED → COMPLIANT ⇄ VIOLATION` (`→ REVOKED` from any non-REVOKED state); transitions guarded by geometry checks |
| Repositories (interfaces) | `src/features/kiosks/repos/kiosk-repository.ts` (`listSlots`, `listPlacements`, `savePlacement`, `estimateRevenue`), `vendor-permit-repository.ts` (`listVendors`, `listPermits`, `issuePermit`, `validatePermit`, `acknowledgeViolation`) — mock impls at `src/mocks/repos/kiosk-repository.mock.ts`; UI only depends on interfaces |
| Live driver | `src/mocks/live/live-kiosk-driver.ts` — emits `traffic_score_tick` (8s), `vendor_geo_drift` (T+240s), `vendor_geo_revert` (T+420s); subscribes to Sprint 3 `vci_drift` |
| Validation | Zod schemas `src/features/kiosks/lib/schemas.ts` (`kioskPlacementSchema`, `vendorPermitSchema`) parsed before every repo write; RHF used for permit form |
| Tests | **Vitest:** `constraints.test.ts` (walkway clearance, snap-back reason, grid-snap math), `revenue.test.ts` (formula values, deterministic seeds, payback rounding), `permit-machine.test.ts` (state transitions). **Playwright:** `kiosk-flow.spec.ts` — place valid kiosk → score shows; invalid drag → snap-back + toast; proposal generate → modal + download; permit issue → ISSUED; drift → VIOLATION badge visible |

## 11. Demo Script

1. Open `/kiosks` from Dashboard layer toggle — green Zero-Choke zones + hatched
   corridors; SES overlay on; 5 placed kiosks scored
2. Drag a slot footprint into the corridor → rose flash + snap-back + toast
   `"Kiosk blocks the 2.5 m walkway — snapped back"`
3. Place a valid kiosk at high-traffic slot #9 → estimator: **Rp 42–58M/mo**, 9-month
   payback, visibility 74; factor bars animate on next VCI tick
4. Generate Proposal → preview modal → Print / Download (HTML)
5. Open `?tab=permits` → Issue Permit on slot #9 → ISSUED → Validate → COMPLIANT
6. At T+240s Pak Rudi's footprint drifts → VIOLATION pulse + toast → acknowledge →
   T+420s revert → COMPLIANT
7. Toggle SES off/on and POI markers to show the overlay story

**Acceptance:** placement constraints, scoring, proposal export, and permit lifecycle are
fully fixture-driven through repository interfaces; no PDF/geospatial backend, no
hardcoded JSX data; DEMO badge visible on every surface; scores reproducible across
reloads; `npm run test` and Playwright suite pass.

## Dependencies

- Mock repositories: `kiosk-repository`, `vendor-permit-repository`
- Live driver: `traffic_score_tick`, `vendor_geo_drift`, `vendor_geo_revert`
- Shared fixture: stations/exits (Sprint 1), VCI history + `vci_drift` (Sprint 3),
  POIs, SES bands, alert banner (Sprint 3), status-chip patterns (Sprint 9)
- Shared components: map canvas, DEMO badge, Sonner toasts, panel/modal primitives
