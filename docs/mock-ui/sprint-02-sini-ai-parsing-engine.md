# Mock UI PRD — Sprint 2: Sini AI Parsing Engine

**Sprint reference:** [`docs/sprints/sprint-02-sini-ai-parsing-engine.md`](../sprints/sprint-02-sini-ai-parsing-engine.md)
**Foundation:** [`docs/mock-ui/README.md`](README.md) — demo mode env flag, mock repository layer, shared fixtures, live driver, DEMO badge

## 1. Purpose (D1)

Field surveyors currently deliver unstructured evidence — photos and voice notes in Bahasa Indonesia — that must be manually decoded into hazard attributes (crowd counts, angkot queue lengths, vendor footprints). This mock demonstrates the full **AI ingestion pipeline**: a field submission flows from `QUEUED` → `EXTRACTING` → `REVIEW` and lands as structured, editable attributes attached to station exit nodes, **all within the 30-second SLA**, with zero CV/NLP backend required.

**Why mock now:** the real pipeline (YOLO26 + Gemini 3.6 Flash + Whisper) is a future sprint's backend investment. The mock proves the QA workflow, the review UI, and the spatial attachment UX first — de-risking the purchase decision for MAPID.

**Stakeholder value:**
- **MAPID supervisor:** sees the sub-30s SLA and review governance that the technical contract promises
- **QA reviewer:** exercises approve/reject/edit + bbox→attribute correlation in minutes, not weeks
- **Station operator (Dishub):** watches AI-derived crowd/vendor data appear on their dashboard card without manual entry

**Demo narrative:** "A field photo of Gate B arrives → the engine decodes it in seconds → a reviewer approves → the station's dashboard card updates live. That is the 30-second loop the operator never sees."

## 2. Personas & Roles (D2)

| Persona | Role in mock | Can do | Cannot do |
| --- | --- | --- | --- |
| **QA Reviewer** (ops analyst) | Primary user of `/ai-ingestion` | Approve/reject, edit attributes, replay transcript, open raw JSON, link boxes↔rows | Attach to exit node (supervisor-gated), modify stations |
| **Station Operator** (Dishub staff) | Consumer on `/dashboard` | See attached AI attributes on Station Info Card, click "view source extraction" | Edit or reject extractions |
| **MAPID Supervisor** | Overseer | SLA timer readout, queue stats, attach-to-node (final approval gate), demo script lead | Raw JSON inspection (delegated to reviewer) |

## 3. Information Architecture & Flow (D3)

**Entry points:**
- Sidebar nav: new item `AI INGESTION` (`Sparkles` icon, `href: /ai-ingestion`) — first nav slot after `FIELD SURVEY`, matching `/survey` entry pattern in `sidebar.tsx`
- Dashboard Station Info Card: new `AI ATTACHMENTS` section with a "view in QA" link
- TopBar search: typing a station name deep-links into the filtered queue

**Page map:** `/` → `/dashboard` (map + station cards) ⇄ `/ai-ingestion` (queue) → drawer (detail) → `/dashboard` (flyTo to attached exit).

**Flows:**
1. **QA review flow:** `/ai-ingestion` → select row → drawer opens → inspect bbox/audio/JSON → Approve/Reject → Sonner toast → row leaves REVIEW pool
2. **Attachment flow (supervisor):** approved drawer → "Attach to Exit Node" → station picker → confirm → store event → `/dashboard` flyTo (800ms) → card shows attributes + source link
3. **Live arrival flow:** live driver injects a submission → row animates into QUEUED → timer ticks → flips REVIEW; reviewer can open it mid-transition

## 4. Screen & Component Specs (D4)

### Surface A — `/ai-ingestion` queue page
Layout: `AppShell` + header bar (title, queue stats, SLA ticker) + toolbar (search, status filter chips, station filter) + list.

| Component | Default | Empty | Loading | Error | Edge |
| --- | --- | --- | --- | --- | --- |
| Queue list | Rows grouped by status (REVIEW first, then EXTRACTING, QUEUED, then APPROVED/REJECTED under collapsible sections) | "No extractions match the current filter" + reset-filter button; if truly zero: "No field submissions yet — the live driver is off" | Skeleton rows (3 × shimmer, 600ms loop) | Panel-level error with Retry | Row count >50: virtualized or paginated 20/page |
| Row item | Photo thumbnail, station + exit, type chip, mono timer, status chip, confidence | n/a | n/a | Broken thumbnail → `Image` fallback placeholder icon | Row whose submission was deleted mid-session shows `[removed]` + auto-prune on next tick |
| Status chip | `QUEUED` (slate) / `EXTRACTING` (blue, pulsing dot) / `REVIEW` (amber) / `APPROVED` (emerald, glow-emerald) / `REJECTED` (rose) | n/a | n/a | n/a | Unknown status value → renders neutral `UNKNOWN` chip, logs warn |
| SLA ticker | `SLA 30s` + fastest/current latency mono readout | `—` when queue empty | `…` | `SLA UNAVAILABLE` | Latency >30s → chip turns rose + `glow-crimson` (edge scripted in fixtures) |

### Surface B — Extraction Detail Drawer (right-side, `w-[520px]`, `backdrop-blur-xl`)
| Component | Default | Empty | Loading | Error | Edge |
| --- | --- | --- | --- | --- | --- |
| Photo viewer | Field photo + SVG bbox overlay; bboxes color-coded by class (pedestrian `emerald`, vendor `amber`, angkot `blue`) | No photo → dashed placeholder "No field photo captured" | Skeleton block | Broken image → placeholder + mono error line | Hovering a bbox scales it 1.05 + lifts row counterpart |
| Attribute editor | 3 mono readouts with confidence bars; editable numeric inputs (RHF+Zod) | n/a | Skeleton | Save failure → inline field error + toast | Value out of zod range → inline error, block save |
| Audio transcript | Transcript (ID + EN translation) + fake waveform (in-house SVG bars, ~48 bars) | No audio → "No audio note captured for this submission" | Waveform shimmer | n/a | Playing state highlights transcript lines in sync (CSS animation) |
| Raw Gemini JSON | Collapsible `<details>` with pretty-printed JSON in mono | n/a | n/a | n/a | JSON >200 lines → collapsed by default with `[+n more lines]` |
| Action bar | `REJECT` (ghost rose) + `APPROVE` (solid emerald) / `ATTACH TO EXIT NODE` (solid blue, supervisor-only, after APPROVED) | n/a | Buttons disabled + spinner on saving | Mutation error → buttons re-enabled, error toast | Already-attached extraction → bar shows `ATTACHED` chip + disabled button |

### Surface C — Dashboard Station Info Card (delta)
New `AI ATTACHMENTS` section: 2×2 mini stat readouts (`PEDESTRIANS`, `ANGKOT QUEUE`, `VENDOR BLOCKAGE`, `CONFIDENCE`) + mono source line `SRC: AI-2026-0141 · 12s`. Empty: section hidden, card unchanged. Attach event: card animates in (translate-y + fade, 200ms) and glows once (`glow-emerald` ring, 1.5s).

## 5. Interactions & Micro-interactions (D5)

| Interaction | Behavior | Duration / timing | Feedback |
| --- | --- | --- | --- |
| Row hover | bg `white/[0.05]`, bbox thumbnail scales 1.03 | 150ms ease-out | Cursor pointer |
| Row click | Opens drawer with 300ms ease-out slide (right), focus moves to drawer header, `Esc` closes | 300ms | Drawer + overlay dim |
| Status chip transition | Chip swaps + 1 frame scale pop (1→1.08→1) | 200ms | — |
| bbox hover / attribute row hover | Bidirectional highlight: bbox glow + corresponding attribute row bg tint (`blue-500/10`) | 120ms | Tooltip with class + confidence mono |
| Attribute edit commit | Debounced 500ms save → validating spinner in row → saved check | 500ms debounce + 250ms spinner | Sonner `Changes saved` (dismissible, 3s) |
| Approve / Reject | Buttons show spinner → chip flips → row slides to its status group | 250ms | Sonner `Extraction approved` / `Extraction rejected` |
| Attach to Exit Node | Station picker (typeahead) → confirm → flyTo target (800ms, matches `DashboardView` pattern) | 800ms | Sonner `Attached to Dukuh Atas — Gate B`; card glows |
| New arrival | Row enters at top with pulse ring + auto-scrolls into view (if filter allows) | 400ms fade+slide | Mono timer starts at 0:00 |
| Queue search/filter | 250ms debounce, no full re-fetch (client filter over cached list) | 250ms | Result count in toolbar updates |

All non-essential motion (pulse dots, shimmer, bbox scale) and timer ticks are **suppressed under `prefers-reduced-motion`**; drawer falls back to instant open.

## 6. Visual Design Spec (D6)

Tokens and language match the repo's established system (see `station-info-card.tsx`, `ai-extraction-panel.tsx`, `globals.css`):

- **Panels:** `dark:bg-[#0c1019]/95` with `backdrop-blur-xl`; secondary tiles `dark:bg-[#141b2b]/90`; canvas `dark:bg-[#070a11]`; borders `dark:border-white/[0.08]`, tiles `dark:border-white/[0.06]`; radius `rounded-xl`/`rounded-2xl`
- **AI accent:** `blue-500` (`bg-blue-500/10 border-blue-500/20` per `ai-extraction-panel.tsx`), `Sparkles` icon `animate-pulse` for the nav entry and section headers
- **Typography:** `font-mono` **only** for data readouts — timers, confidence, counts, JSON, coordinates, chip values (`text-[9px]/[10px] uppercase tracking-[0.15em]/[0.2em]`); `sans` (Inter) for interactive elements and titles (`font-bold tracking-tight`)
- **Status colors:** QUEUED `slate-400`, EXTRACTING `blue-500` (+pulse), REVIEW `amber-400`, APPROVED `emerald-500`, REJECTED `rose-500`; glow classes `glow-emerald` / `glow-crimson` / `glow-amber` from `globals.css`
- **DEMO badge:** existing shared component in the TopBar; on `/ai-ingestion` a sticky header chip `DEMO MODE — FIXTURE DATA` in mono, `amber-400`, `glow-amber`, always visible
- **Motion tokens:** micro transitions 120–200ms; open/close 300ms; flyTo 800ms; shimmer 600ms

## 7. Content & Copy (D7)

- Labels: `AI INGESTION` (nav), `INGESTION QA QUEUE`, `EXTRACTION DETAIL`, `ATTACH TO EXIT NODE`, `RAW GEMINI JSON`, `AUDIO NOTE`, `TRANSCRIPT`, `CONFIDENCE`, `SOURCE: PHOTO`, `SOURCE: AUDIO`, `SLA 30s`
- Status chips: `QUEUED` · `EXTRACTING` · `REVIEW` · `APPROVED` · `REJECTED`
- Empty states: `No extractions match the current filter` (with `CLEAR FILTERS` button); `No field submissions yet`; `No field photo captured`; `No audio note captured for this submission`
- Toasts: `Extraction approved` · `Extraction rejected` · `Changes saved` · `Attached to {station} — {gate}` · `New extraction arrived from the field` (info)
- Errors: `Failed to load extraction queue` (with Retry) · `Failed to save attribute — check the highlighted values` · `Value must be between 0 and 500` · `Attachment failed — station no longer available` (retryable)
- Fixture transcript (ID + EN): `"Angkot double parking di Gate 2, sepeda motor parkir liar sampai 10 unit, trotoar menyempit."` / `"Angkot double parking at Gate 2; up to 10 illegally parked motorcycles; sidewalk narrowing."`

## 8. Mock Data Spec (D8)

**Typed schema** (Zod-validated, shared in `src/entities/ai-extraction.ts` + runtime schema):

```ts
interface AiExtraction {
  id: string;                        // "AI-2026-0141"
  survey_id: string;                 // links to shared survey_submissions
  station_id: string;                // fk → shared stations
  exit_channel_id: string;           // fk → shared exit_doors
  status: "QUEUED" | "EXTRACTING" | "REVIEW" | "APPROVED" | "REJECTED";
  source: "PHOTO" | "AUDIO" | "MULTIMODAL";
  submitted_at: string;              // ISO
  review_ready_at: string | null;    // drives SLA readout
  attributes: { pedestrian_count: number; angkot_queue_length: number; vendor_blockage_pct: number };
  confidence: { pedestrian_count: number; angkot_queue_length: number; vendor_blockage_pct: number }; // 0-100
  bboxes: Array<{ class: "pedestrian" | "vendor" | "angkot"; confidence: number; x: number; y: number; w: number; h: number }>; // normalized 0-1
  audio: { transcript_id: string; transcript_id_translation: string; waveform: number[] } | null; // ~48 amplitude values 0-1
  raw_gemini_json: string;           // pretty-printed JSON fixture
  reviewer_notes: string | null;
  attached_channel_id: string | null;
}
```

**Seed counts (8 submissions across 3 shared stations):** 2 `APPROVED` (one already attached to Dukuh Atas Gate B — visible on `/dashboard` at demo start), 1 `REJECTED` (vendor footprint false positive, confidence 0.41), 3 `REVIEW`, 1 `EXTRACTING`, 1 `QUEUED`. Stations used: Dukuh Atas (Gates A/B/C), Manggarai (Gates 1/2), Sudirman (Gate E).

**Realism notes:** bboxes are normalized percentages (render over any photo aspect ratio); confidence declines for congested scenes (0.93 pedestrians → 0.78 vendor); one `REVIEW` item deliberately carries out-of-range attribute (vendor_blockage_pct 112) to exercise zod rejection; timestamps backdated 5–40 min; waveform amplitudes are pseudo-random but deterministic per id (seeded PRNG) so screenshots are stable.

## 9. Liveness & Behavior (D9)

Deterministic rules (single tick loop in the shared live driver, 1000ms tick):

| Rule | Timing | Notes |
| --- | --- | --- |
| New submission arrival | every 45s after driver start (first at t=45s) | Id rotates through fixture pool; station alternates Dukuh Atas → Manggarai |
| Status advance | QUEUED at t+1s → EXTRACTING at t+3s → REVIEW at t+6s | 6s < 30s SLA; proven on-screen |
| Confidence jitter | ±2 (integer), every 5s, only for REVIEW/EXTRACTING items | Clamped 40–99; reseeded when item resolves |
| SLA readout | recomputed per tick from `submitted_at` → `review_ready_at` | Exposed to Playwright via `data-sla-ms` |
| Edge script | at t=90s, one seeded submission "overruns" to 34s then flips REVIEW | Drives the rose `SLA EXCEEDED` chip state |

**Reduced motion:** driver keeps simulating, but UI subscribers skip pulse/shimmer/scale effects and timer renders plain text.
**Tab visibility:** `document.visibilitychange` → pause mutations while hidden (arrivals/status advances freeze), resume on visible; wall-clock elapsed time (not tick count) drives the SLA so re-entry doesn't show a stale "9s" for a 3-minute gap.

## 10. Tech Specs (D10)

**Stack (fixed, no new frameworks):** Next.js 16 App Router · React 19 · TS strict · Tailwind v4 · MapLibre v6 · Zustand · TanStack React Query · RHF+Zod · Axios · Sonner · Lucide · Vitest · Playwright.

**New files:**

```
src/entities/ai-extraction.ts                     # AiExtraction + BoundingBox + attribute types
src/features/ai-ingestion/
  ingestion-queue-view.tsx                        # page view (client), composes below
  schemas/attribute-schema.ts                     # zod: counts 0-500 int, blockage 0-100, confidence 0-100
  hooks/use-extraction-queue.ts                   # query
  hooks/use-extraction-detail.ts                  # query
  hooks/use-review-extraction.ts                  # mutation (approve/reject)
  hooks/use-update-attribute.ts                   # mutation (debounced save)
  hooks/use-attach-extraction.ts                  # mutation (attach → invalidate stations)
  store/ai-ingestion-ui-store.ts                  # drawer/filter/selection/hover state
  components/extraction-queue-list.tsx            # rows + status grouping
  components/extraction-row.tsx
  components/status-chip.tsx                      # shared: reused on dashboard card
  components/extraction-detail-drawer.tsx
  components/photo-viewer.tsx                     # image + SVG bbox overlay
  components/attribute-editor.tsx                 # RHF form per attribute
  components/audio-transcript.tsx                 # in-house SVG waveform + synced transcript
  components/raw-json-panel.tsx
  components/sla-ticker.tsx
src/infrastructure/repositories/ai-extraction-repository.ts      # interface + axios impl (future)
src/infrastructure/repositories/mock-ai-extraction-repository.ts # in-memory, fixture-seeded
src/infrastructure/mock/fixtures/ai-extractions.ts               # 8 seeded records + arrival pool
src/infrastructure/mock/live-driver.ts                           # shared zustand timer (extends foundation)
src/app/ai-ingestion/page.tsx                    # route (adds nav entry in sidebar.tsx)
src/features/ai-ingestion/*.test.ts(x)           # vitest, colocated
e2e/ai-ingestion.spec.ts                         # playwright
```

**Repository interface (production contract, mock implements it):**

```ts
export interface AiExtractionRepository {
  list(filters: { status?: AiStatus[]; stationId?: string; q?: string }): Promise<AiExtraction[]>;
  getById(id: string): Promise<AiExtraction | null>;
  review(id: string, decision: "APPROVED" | "REJECTED", reviewer_notes?: string): Promise<AiExtraction>;
  updateAttribute(id: string, key: AttributeKey, value: number): Promise<AiExtraction>;
  attach(id: string, channelId: string): Promise<AiExtraction>;
}
```

**Hooks & react-query keys:** `useExtractionQueue` → key `["ai-extractions", { status, stationId, q }]`, `refetchInterval: 1000` while a QUEUED/EXTRACTING item exists; `useExtractionDetail(id)` → key `["ai-extractions", id]`, same interval; `useReviewExtraction` / `useUpdateAttribute` / `useAttachExtraction` → mutations that invalidate `["ai-extractions"]` and `["stations"]` (attach). Mutations use the `toast.success/error` pattern from `use-submit-survey.ts`.

**Zustand store (`ai-ingestion-ui-store.ts`, non-persisted):** `{ selectedId, drawerOpen, filters: { status: AiStatus | null, stationId, q }, hover: { bboxIndex | attributeKey }, pendingAttachId, open/setFilter/setHover/close }` — mirrors `station-ui-store.ts` shape (`create()` + selector hooks).

**MapLibre:** no new persistent layers on `/dashboard`. Attachment flow reuses the existing marker system — `flyTo` (800ms) + an `ai-attachment` pulsing circle layer added temporarily around the target exit (circle-radius 12, emerald, removed after 4s). Bbox overlays are plain SVG, not map layers.

**Live-driver events consumed:** `ai_extraction_created`, `ai_extraction_progress` (status + tick), `ai_extraction_confidence` (jitter), `ai_attachment_applied` (card glow trigger). Queue hook subscribes via `useSyncExternalStore` to the zustand driver slice.

**Validation:** zod `attribute-schema` runs in the editor form (RHF resolver) and again in `updateAttribute` before the repository call; `AiExtraction` shape is zod-parsed at the mock repository boundary (fixture integrity test).

**Test strategy:**
- *Vitest (unit):* repository state machine (QUEUED→REVIEW under 6 ticks, reject/approve transitions, attach idempotency — second attach overwrites cleanly); zod rejection of 112% blockage and negative counts; live driver with fake timers (arrival at t=45s, jitter clamping); `use-extraction-queue` hook via `renderHook` + QueryClient wrapper
- *Playwright (E2E):* demo script as a single spec — queue renders 8 rows → timer flips EXTRACTING→REVIEW → bbox↔row linking → approve → attach → dashboard card shows attributes + flyTo; `prefers-reduced-motion` emulation run asserts drawer opens without transition and no `animate-pulse` elements; `data-sla-ms` attribute asserted < 30000

## 11. Demo Script (Acceptance)

1. Open `/ai-ingestion` — queue shows 8 items; one EXTRACTING with ticking timer; DEMO badge visible → **A1: all statuses render, SLA ticker ≤ 30s**
2. Open the newest item — bboxes, attributes, transcript, raw JSON visible → **A2: drawer renders all four panels; bbox hover highlights row**
3. Edit `vendor_blockage_pct` to 112 → inline zod error, save blocked → **A3: validation enforced**
4. Correct to 78 → `Changes saved` toast → **A4: attribute persisted to store**
5. Approve → chip flips, row moves → **A5: queue count decrements, toast shown**
6. Attach to Dukuh Atas Gate B → **A6: `/dashboard` flyTo fires; card shows `SRC: AI-2026-0141` + metrics**
7. Wait 45s → **A7: new submission arrives and advances to REVIEW live**
8. Run with `prefers-reduced-motion: reduce` → **A8: no animated states, flow completes**

**Acceptance gate:** all A1–A8 pass purely from fixtures; zero network calls to CV/NLP; `NEXT_PUBLIC_DEMO_MODE=true` required for the mock provider registry to serve this page.

## 12. Dependencies

- Mock foundation: `mock-ai-extraction-repository`, live driver events above, shared `survey_submissions` + station/exit fixtures
- Shared components: `status-chip` (new), `AppShell`/`Sidebar` (nav entry), `TopBar` DEMO badge, `StationInfoCard` (AI section delta)
- Backend contract (future, not mocked): FastAPI `/parse`, Gemini `response_schema` — implementation deferred to the production sprint per sprint doc
