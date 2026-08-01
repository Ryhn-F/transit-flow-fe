# Mock UI PRD — Sprint 6: Public Commuter Alert & Safe-Path Portal

**Sprint reference:** `docs/sprints/sprint-06-commuter-portal.md`
**Branch:** `feature/mock-ui` · **Env:** `NEXT_PUBLIC_DEMO_MODE=true`

## Purpose (D1)

**User problem.** At peak hours, thousands of KRL passengers exit Manggarai, Dukuh Atas, and
Sudirman with zero visibility into which exit door is congested, which escalator is down, or
where a bottleneck just formed. Delays, unsafe door dashes, and confusion are routine.

**Why the mock exists now.** The operator surfaces (Sprints 2–5) prove data *collection*; this
surface proves data *value* — a public, mobile-first PWA that converts live VCI + crowd reports
into a "Safe-Path" recommendation and an empowered commuter. It is the first surface built for
end-users, demonstrating the full closed loop: commuter reports → operator QA queue (Sprint 2)
→ operator action → updated Safe-Path advice.

**Stakeholder value.** For **MAPID/Dishub**, this is the citizen-engagement channel and the
proof of two-way value; for **operators**, crowdsourced reports arrive faster than CCTV review;
for **investors/leadership**, it shows the product surfacing to consumers (app-store-adjacent
PWA) without any production infrastructure yet.

**Demo narrative (60s).** "Rara leaves work at 18:00 → opens transitflow.id → 'USE MY LOCATION'
resolves Manggarai → Safe-Path says *Door C is 40% clearer* → she walks through Door C, spots a
broken escalator, files a 1-tap report → `CR-0421` lands in the operator QA queue → surge hits, her
subscribed phone slides in an alert → she toggles offline and the floorplan still renders."

## Personas & Roles (D2)

| Persona | Profile | Can do in the mock | Cannot do in the mock |
| --- | --- | --- | --- |
| **Rara — Daily Commuter** (primary) | 27, Manggarai→Sudirman daily, phone-first, installs PWAs | Full journey: location lookup, Safe-Path, 1-tap report, subscribe + receive push, offline floorplan | No operator data: no raw VCI charts, CCTV, warden dispatch |
| **Pak Budi — Infrequent Traveler** | 54, quarterly visits, hesitant with new apps, may deny location | Browse all stations, use Safe-Path, view alerts, read id/en copy; lands in station search when location denied | Cannot install/offline; no report photo; sees simplified readouts only |
| **Sari — Accessibility User** | 31, low vision, screen reader + large text + reduced motion | Full flows via keyboard/AT: labels, landmarks, 44px targets, high contrast; `prefers-reduced-motion` respected | No non-AT path exists: every state must be ARIA-complete |

## Information Architecture & Flow (D3)

**Entry points:** `/portal` (deep link, primary), header link "Commuter Portal" on `/dashboard`
(operator preview, Sprint 5 precedent), install banner (first visit), PWA-style push from
notifications tray.

**Page map — single route, 4 bottom-nav tabs** (every surface has a home):

| Tab | Route (all served by one shell) | Surfaces |
| --- | --- | --- |
| Home | `/portal` (default tab) | Location status, nearest-station card, Safe-Path card, ETA strip, alert strip, install banner |
| Stations | `/portal?tab=stations` | Station list (search), station detail: door chips + comparison |
| Report | `/portal?tab=report` | 1-tap crowd report form, success/queued states |
| Notifications | `/portal?tab=notifications` | Subscribe consent card, notification tray, permission states |

**Key flows:**
1. **Location:** Home → "USE MY LOCATION" → simulated GPS resolves → nearest hub card animates in. Denied → manual station search fallback.
2. **Safe-Path:** Home → recommendation card → "Mulai Navigasi" → 3-step strip (door → covered walkway badge → ETA) → tap comparison bars.
3. **Report:** Report tab → pick 1 of 3 types (optional photo) → 1-tap submit → success card w/ reference ID → row also appears in operator QA queue (Sprint 2).
4. **Subscribe:** Notifications tab → consent card → Browser Notification API prompt (mocked) → subscribed badge. Permission denied → in-app tray fallback + hint copy.
5. **Offline:** Demo toggle in shell header → cached floorplan replaces live map; report still queued in `localStorage`.

## Screen & Component Specs (D4)

### 1. Portal Shell (all tabs)
- Sticky header: app wordmark (sans), `DEMO` badge (amber pill), offline toggle icon, install icon (Lucide `Download`).
- Bottom nav, 4 items, 44×44px+ touch targets, safe-area inset padding `pb-[env(safe-area-inset-bottom)]`.
- **States:** loading (top skeleton bar, shimmer 1s), online (live), offline (amber band: "Mode luring aktif — peta dari cache"), error (retry toast).

### 2. Home
- **Location card:** states = locating (spinner + "Mencari lokasi…"), resolved (hub name + distance), **denied** ("Lokasi tidak diizinkan" + "Pilih stasiun secara manual" → stations tab, pre-focused search), no stations nearby (empty state, see D7).
- **Safe-Path card:** badge "Rekomendasi Pintu Aman", recommendation line, 3 horizontal comparison bars (door / VCI / flow).
- **ETA strip:** scrollable ticker of door-to-walkway ETAs; animates on VCI change (D5).
- **Alert strip:** latest surge/weather-driven alert (Sprint 3/5 events), tappable → tray.

### 3. Safe-Path
- **States:** default (recommendation), loading (skeleton bars), empty (all doors equal: "Semua pintu setara — pilih pintu terdekat"), live-recompute (chip "Diperbarui 12 detik lalu").
- Navigate flow: 3 steps with numbered dots; covered-walkway badge (emerald, `Umbrella` icon).
- Comparison view: horizontal bars, mono numerals for VCI %, ≥44px row targets, ARIA `role="list"` + `aria-current` on recommended door.

### 4. Report (1-Tap Crowd Report)
- 3 type chips (blockage `TrafficCone` / broken escalator `MoveVertical` / flood `Droplets`) + optional photo thumbnail (`ImagePlus`), each chip ≥44px, `aria-pressed`.
- **States:** default, submitting (button spinner, disabled, 450ms), **submitted** (success card: checkmark burst, "Laporan terkirim" + `CR-0421`, "Lihat di dasbor operator" link), validation error (type required), offline (queued badge "Tersimpan offline — terkirim saat online"), server error (toast + "Coba lagi").

### 5. Notifications
- **States:** unsubscribed (consent card), **permission denied** ("Notifikasi diblokir di browser ini" + "Aktifkan di pengaturan" + tray-fallback note), subscribed (toggle on, "Berlangganan untuk Manggarai"), empty tray ("Belum ada pemberitahuan"), tray with items (icon, title, body, relative time).

## Interactions & Micro-interactions (D5)

| Interaction | Behavior | Duration |
| --- | --- | --- |
| Report press | Pressed chip scales to 0.94 + amber ring flash (mock haptic); release → submit | 120ms in / 150ms out |
| Submit feedback | Button morphs: spinner → success checkmark burst + confetti-free color pulse | 450ms submit, 600ms success |
| ETA strip | VCI change re-sorts doors; strip glides with row highlight (translate + fade) | 400ms ease-in-out, staggered 60ms/row |
| Notification slide-in | Toast slides from top (`translate-y`), auto-dismiss, swipe-up to dismiss, tappable → tray | 300ms ease-out in, 5s auto, 250ms out |
| Bottom-nav switch | Active tab indicator slides under icon; view cross-fades | 150ms / 200ms |
| Safe-Path recompute | Recommendation card pulses border emerald + chip "Pintu berubah!" | 250ms, one-shot |
| Offline toggle | Live map cross-fades to cached floorplan panel | 300ms cross-fade |
| Install banner | Slides up from bottom, dismissible, re-appears next session until installed | 350ms ease-out |

All animations respect `prefers-reduced-motion` (skip transforms; instant state swaps) and pause
when tab is hidden (D9).

## Visual Design Spec (D6)
Deliberate **commuter identity** — friendlier and more legible than the operator dashboard, while
staying on-brand:

| Token | Operator (Sprints 2–5) | Commuter Portal |
| --- | --- | --- |
| Radius | `rounded-2xl` | `rounded-3xl` cards, `rounded-full` chips |
| Type scale | base 14px, tight | base 17px body, 24px headings (`text-[17px]`, `text-2xl`) |
| Accent | Blue-600 primary | Emerald-500 for "safe" actions + brand blue for primary CTA |
| Density | Dense, data-heavy | Generous: `p-5`, `gap-4`, `min-h-11` (44px) touch targets |
| VCI chips | Color-only dots | **Color + text label** ("Padat"/"Lengang") — WCAG 1.4.1 safe |
| Contrast | Standard | High: `text-slate-900` on white, chips carry `aria-label` |

- **Light-first** with dark support (`dark:` variants, `darkMode: 'class'`); `mono` for VCI/data
  readouts only, `sans` for UI/labels (repo precedent).
- Safe areas: `max-w-md` centered shell on desktop; bottom nav padding uses
  `env(safe-area-inset-bottom)`; top uses `env(safe-area-inset-top)`.
- **DEMO badge:** amber pill "DEMO" top-right of header (fixed, persistent, ≥9:1 contrast).

## Content & Copy (D7)

id-first with en parallel (public surface, Sprint 11 i18n precedent):

| Context | Copy |
| --- | --- |
| Install banner | "Instal TransitFlow untuk akses cepat" / "Install TransitFlow for quick access" |
| Location button | "Gunakan Lokasi Saya" / "USE MY LOCATION" |
| Location denied | "Lokasi tidak diizinkan. Pilih stasiun secara manual." / "Location denied. Choose a station manually." |
| No stations nearby | "Tidak ada stasiun dalam 5 km" + "Coba cari nama stasiun" / "No stations within 5 km" |
| Safe-Path recommendation | "Pintu C 40% lebih lengang dari Pintu B" / "Exit Door C is 40% clearer than Door B" |
| Report success toast | "Laporan terkirim! ID CR-0421" / "Report sent! ID CR-0421" |
| Offline queued | "Tersimpan offline — terkirim saat online" / "Saved offline — will send when online" |
| Permission denied | "Notifikasi diblokir. Aktifkan di pengaturan browser." / "Notifications blocked. Enable in browser settings." |
| Empty tray | "Belum ada pemberitahuan. Laporan Anda akan muncul di sini." / "No notifications yet." |
| Error retry | "Gagal terkirim. Coba lagi." / "Failed to send. Try again." |

## Mock Data Spec (D8)

Typed fixture schema (TypeScript, `src/features/commuter/fixtures/portal.fixtures.ts`), extending
the shared dataset (stations/VCI from Sprint 3, walkway network from Sprint 5):

```ts
export interface CommuterHubFixture {
  id: "manggarai" | "dukuh-atas" | "sudirman";
  nameId: string; nameEn: string;
  position: { lat: number; lng: number };        // Manggarai: -6.2097, 106.8501
  doors: { id: string; label: "A" | "B" | "C" | "D"; vci: number;      // 0-100
           flowPerMin: number; isCovered: boolean; escalatorOk: boolean }[];
  walkwayMinutes: Record<string, number>;        // door → walkway transit minutes
}
```

| Fixture | Count | Realism notes |
| --- | --- | --- |
| Hubs | 3 | Manggarai, Dukuh Atas, Sudirman — real coordinates, seeded from Sprint 3 |
| Exit doors | 12 | 3–5 per hub; distinct VCI (24–91) so Safe-Path always has a clear winner |
| Covered walkways | 5 | Reused from Sprint 5 network |
| Pre-seeded crowd reports | 6 | Mixed types (3 blockage, 2 escalator, 1 flood), 1 linked to `CR-0` series |
| Subscriptions | 2 | 1 per hub (manggarai, sudirman), persisted in `localStorage` |
| GPS fixture | 1 | Static position 350 m from Manggarai; resolution latency seeded 600 ms |
| Report reference IDs | — | `CR-0421`-style sequential from fixture counter (id/en consistent) |

## Liveness & Behavior (D9)

Deterministic timeline, driven by the shared live driver (Zustand):

| Tick | What happens | Rule |
| --- | --- | --- |
| `vci_tick` (10s) | Door VCI drifts ±1–3 per tick; Safe-Path recomputes; ETA strip re-sorts | Pure function `computeSafePath(doors)` — deterministic, seeded RNG |
| `surge_event` (~minute 4) | Manggarai Door B VCI crosses **≥80**; surge alert fired | Emits `surge_alert` (Sprint 3 event) → subscribed devices get notification + tray item |
| `crowd_report_created` | Submitted report appends to shared survey pool | Visible in Sprint 2 QA queue within the same demo |
| `escalator_break` (~minute 6, optional) | Door D escalator flips to broken → Safe-Path excludes it | Only if demo script reaches step 6 |

- All randomness is seeded; identical demo runs reproduce identical events (deterministic).
- `prefers-reduced-motion`: every animation degrades to instant state swap (matchMedia gate in a
  shared `use-motion-safe` hook).
- Tab visibility: driver pauses when `document.hidden`; notifications still accumulate in tray;
  on return, a "3 pemberitahuan baru" (3 new notifications) badge appears.

## Tech Specs (D10)

**Stack (fixed, no new frameworks):** Next.js 16 App Router, React 19, TS strict, Tailwind v4,
MapLibre v6, Zustand, React Query, RHF + Zod, Axios, Sonner, Lucide, Vitest, Playwright.
**No Workbox, no service worker, no Notification worker** — all PWA behavior is mocked in-app.

| Concern | File |
| --- | --- |
| Route + shell | `src/app/portal/page.tsx`, `src/app/portal/layout.tsx` (mobile shell, bottom nav) |
| Commuter feature root | `src/features/commuter/` (components/, hooks/, store/, lib/) |
| Views | `CommuterPortalView.tsx`, `components/home-view.tsx`, `components/station-view.tsx`, `components/report-view.tsx`, `components/notifications-view.tsx`, `components/offline-floorplan.tsx`, `components/install-banner.tsx`, `components/bottom-nav.tsx` |
| Repository interfaces | `src/features/commuter/lib/portal-repository.ts` (TS interface) |
| Mock implementations | `src/features/commuter/lib/mock-portal-repository.ts` (in-memory + fixtures), `src/features/commuter/lib/mock-geolocation-provider.ts` |
| Pure logic | `src/features/commuter/lib/safe-path.ts` (`computeSafePath`, `doorDeltas` — pure functions, unit-tested) |
| Validation | `src/features/commuter/lib/schemas.ts` (zod: `crowdReportSchema`, `doorVciSchema`) |
| State | `src/features/commuter/store/portal-store.ts` (Zustand: tab, location, offline, subscription), `use-notifications.ts` |
| Live driver events | `subscribe('surge_alert')`, `subscribe('vci_tick')` (shared driver from foundation) |
| localStorage keys | `tf.commuter.subscriptions`, `tf.commuter.offlineQueue`, `tf.commuter.installDismissed` |

- **PWA mock, no Workbox:** install banner = dismissible demo card (persist `installDismissed`);
  offline = header toggle flipping the store → cached floorplan component renders + report queue
  persists to `localStorage` and flushes on re-connect. No SW registration anywhere.
- **Geolocation:** `GeolocationProvider` interface (`getPosition(): Promise<{lat,lng}>`) with two
  impls: `BrowserGeolocationProvider` (real HTML5 API, returns permission-denied error honestly)
  and `MockGeolocationProvider` (fixture, 600 ms delay). `NEXT_PUBLIC_DEMO_MODE` selects mock.
- **Notifications:** `requestPermission()` calls the real `Notification` API when available;
  `denied`/`unsupported` falls back to an in-app tray + sonner toast (permission-denied state
  still demoable in any browser). Surge pushes render as `sonner` toasts with tray mirror.
- **Safe-path:** `computeSafePath(doors): SafePathResult` — pure, fixture-driven, returns
  recommendation + per-door deltas; no network.
- **Zod:** `crowdReportSchema` (type enum, optional `photoUrl` as data-URL string, stationId) —
  same contract as survey entities (`src/entities/survey`), so reports map into the shared pool.
- **Tests — Vitest:** `safe-path.test.ts` (rank/delta/tie rules, determinism), `schemas.test.ts`,
  `portal-store.test.ts` (offline queue flush). **Tests — Playwright:** mobile viewport
  (Pixel 7 `412×915`, `hasTouch`), `portal.spec.ts` covering: location resolve → Safe-Path
  recompute, 1-tap report → success `CR-0421` → QA queue row, subscribe → surge toast slide-in,
  offline toggle → floorplan + queued report, permission-denied fallback, 44px hit-slop audit
  (`expect(boundingBox)`), `prefers-reduced-motion` smoke, id copy assertions.

## Demo Script (Acceptance)

1. Open `/portal` in a mobile viewport (Playwright Pixel 7) — bottom nav, DEMO badge, install banner visible.
2. Tap "Gunakan Lokasi Saya" → 600 ms → "Manggarai · 350 m" card.
3. Safe-Path card: "Pintu C 40% lebih lengang"; open comparison bars; VCI ticks shift rankings at minute ~2 with ETA strip animation.
4. Report tab → tap "Escalator Rusak" → submit → success card `CR-0421`; open `/survey` QA queue (Sprint 2) — the report row appears.
5. Notifications tab → subscribe (browser prompt mocked) → at minute ~4 surge ≥80 → notification slides in (5s), mirrored in tray.
6. Toggle offline → floorplan replaces map; submit a second report → "Tersimpan offline"; toggle online → queued report flushes with toast.
7. Deny location on reload → manual search fallback renders.

**Acceptance:** every step above passes on the mobile viewport with all copy in id (+en toggle);
demo badge visible at all times; no network calls beyond the mock repository boundary; Vitest +
Playwright suites green; no new dependencies added.

## Dependencies

- Mock repository: `portal-repository` (nearest hub, safe-path, subscriptions), reuses `vci-repository` (Sprint 3), `survey-repository` (Sprint 2 shared pool)
- Live driver: `surge_event` (Sprint 3), `vci_tick`, `crowd_report_created`
- Shared fixtures: stations + VCI (Sprint 3), walkway network (Sprint 5)
- Shared components: sonner toasts, DEMO badge, motion-safe hook, `AppShell` primitives

## Rubric Self-Check

| Dim | Covered where |
| --- | --- |
| D1 | Purpose (demo narrative + stakeholder value + sprint link) |
| D2 | Personas & Roles table |
| D3 | IA & Flow (page map, entry points, 5 flows) |
| D4 | Screen & Component Specs (all 5 states incl. denied/offline/queued) |
| D5 | Interactions table (durations) |
| D6 | Visual Design Spec (identity, tokens, contrast, DEMO badge) |
| D7 | Content & Copy (quoted id/en) |
| D8 | Mock Data Spec (typed schema, seed counts, realism) |
| D9 | Liveness & Behavior (deterministic ticks, reduced motion, tab visibility) |
| D10 | Tech Specs (paths, no-Workbox PWA mock, provider interfaces, zod, Vitest + Playwright) |
