# Mock UI PRD — Sprint 11: National Expansion

**Sprint reference:** `docs/sprints/sprint-11-national-expansion.md`

## 1. Purpose (D1)

The platform is proven at Jakarta scale (Sprints 2–10), but stakeholders cannot yet see
the national vision. Sprint 11 demonstrates: switching between 5 data-rich Indonesian
cities (plus an empty-city fixture, D8), a
Ministry-of-Transportation choke leaderboard over 12 hubs, full Bahasa Indonesia/English
localization, and regional agency governance — all fixture-driven.

- **Why mock now:** validate national IA, i18n, and regional RBAC *before* investing in
  PostGIS regional partitioning, BPS boundary ingestion, and edge deployments (sprint doc
  items 2, 3, 7). Swapping the fixture repositories for real ones later changes no UI.
- **Stakeholder value:** Kemenhub gets decision-ready cross-city oversight; regional Dishub
  agencies get isolated authority; national comms gets a bilingual public story.
- **Demo narrative:** *"Zoom out from Gambir to the nation."* Open Jakarta's war room
  (Sprint 7), zoom out to `/national`, watch Medan peak live, drill back down, and replay
  the whole tour in Bahasa Indonesia.

## 2. Personas & Roles (D2)

| Persona | Org | Can do in the mock | Cannot do |
| --- | --- | --- | --- |
| **Budi Santoso** — Analis Operasional | Kemenhub | View national leaderboard, bubble map, drill into any city, export CSV, toggle id/en | Edit regional fixtures, dispatch wardens, manage permits |
| **Ibu Rina** — Kepala Dishub | Dishub Sumatera Utara | Manage Medan-scoped Command Center, wardens, events (Sprint 7 data) | Access other regions — sees the "out of scope" state (D4) |
| **Dimas Pratama** — Komunikasi | Kemenhub comms | Bilingual walkthrough of the Commuter Portal (Sprint 6) in id or en, pull summary figures for release notes | Change operational or fixture data |

## 3. Information Architecture & Flows (D3)

**Global shell:** top header = app nav (Dasbor · Command Center · **Nasional**) +
`CitySwitcher` + `LocaleToggle` (right cluster); left rail re-scopes to the active city
(stations, wardens, CCTV, kiosks, forecast). Unauthenticated → `/login`; fixture `role`
sets RBAC scope (D4.5). Breadcrumb trail on every city-scoped surface:
`Nasional → Kota → Hub`.

| Route | Surface | Entry / exit paths |
| --- | --- | --- |
| `/national` (new) | Leaderboard + bubble map | Header nav "National / Nasional"; hub row click exits to `/dashboard?city=*`; browser Back returns with sort/session preserved |
| `/dashboard` (Sprint 3) | City-scoped VCI dashboard | Header nav, switcher, hub drill-down; left rail cross-links to `/forecast`, `/cctv`, `/kiosks` |
| `/command-center` (7), `/forecast` (8), `/cctv` (9), `/kiosks` (10), `/portal` (6) | Prior sprint surfaces | Left rail; all read `cityId` (D10 re-scope contract); RBAC-blocked per D4.5 |
| Header `CitySwitcher` + `LocaleToggle` | Global selectors | On every surface; push `?city=`/`?lang=` onto routable URLs |
| `/login` | Role selection (fixture agencies) | Entry to app; role → region scope |

**URL contract:** `?city=JKT|SBY|BDG|MDN|MKS|YOG` — invalid value falls back to JKT with
toast "Kota tidak dikenali / Unknown city"; `?lang=id|en` mirrors the locale store;
`/national` ignores `city` (national scope). Deep links hydrate stores before render.

End-to-end flows (numbered, with exits):

1. **National overview:** `/national` → 12 hubs ranked by 7-day mean → sort by current
   VCI → click "Surabaya Gubeng" → `/dashboard?city=SBY` (map re-centers, Angkot chip) →
   Back restores leaderboard + sort state.
2. **Localization:** toggle id → all copy flips → reload keeps id (`?lang=id`) → toggle back.
3. **Regional RBAC:** login as Dishub Sumatera Utara (rail = Medan only) → pick Jakarta in
   switcher → out-of-scope card (no navigation occurs) → Esc closes card, city unchanged.
4. **Export:** leaderboard → "Export CSV" → download + toast with "Unduh / View file" action.
5. **Deep-link city switch:** open `/dashboard?city=MDN` directly → map centers Medan,
   header chip = Medan, paratransit = Becak; fixture surfaces hydrate from city store.
6. **Empty city:** switch to the fixture city with no reported data → D7 empty state on
   every re-scoped surface; chip stays selectable.

## 4. Demo Surfaces (D4)

### 4.1 City Switcher (header, global)
- Dropdown of 6 city chips (name + city accent dot + hub count; YOG shows "0 hubs" and
  drives the empty state). Switching re-scopes every
  surface via the global city store (D10).
- **States:** default (current city chip, accent-colored); open (list with active check);
  **loading** — 250ms fade-in skeleton rows on every re-scoped surface + map `animateTo`;
  **empty city** — a city with zero fixtures renders the "No Data Yet" empty state (D7)
  instead of blank panels.

### 4.2 National Choke Leaderboard (`/national`)
- Table: `Rank · Hub · City · 7-Day Mean VCI · Current VCI · Trend · Surges · Status`;
  sortable columns, hub row click → city drill-down, "Export CSV" button (Kemenhub).
- **States:** default (12 rows); **loading** (skeleton rows, 300ms); **empty** ("Belum ada
  data nasional" empty state); **error** (toast + retry button — "Gagal memuat data");
  re-sort animation on column click (D5).
- Aggregations are pure fixture functions (`aggregateLeaderboard`, D10) — no backend.

### 4.3 National Bubble Map
- MapLibre `circle` layer: one bubble per hub — radius ∝ √(7-day mean VCI) scaled 8–36px,
  fill by status color, city accent halo, mono hub labels; legend bottom-left.
- **States:** loading (map skeleton); empty (no bubbles, hint copy); hover (tooltip:
  hub, mean VCI, surge count); SURGE bubble pulses at 2s interval.

### 4.4 Localization (i18n) + City Identity
- `LocaleToggle` (ID/EN) in header; regional paratransit badge per city
  (Angkot · Becak · Pete-pete) shown on map, survey, and portal surfaces.
- **States:** default (current locale); **language fallback** — a missing `id` key renders
  the `en` fallback with a dev-only console warning, never a raw key.

### 4.5 Regional RBAC Preview
- Role pill per agency (DISHUB JABODETABEK vs DISHUB SUMUT) scoping Sprint 7 fixtures.
- **States:** in-scope (full surface); **out-of-scope** — "Di Luar Wilayah / Out of Scope"
  card (D7) slides in 200ms; cross-region drill-down blocked with same state.

## 5. Interactions & Micro-interactions (D5)

| Interaction | Behavior | Duration / easing |
| --- | --- | --- |
| City switch | Map `animateTo(viewport)`; skeleton fade-in on re-scoped panels; data cross-fade | 700ms ease-out; 250ms fade |
| Language toggle | Instant re-render, no animation; persisted to `localStorage` (zustand persist) | 0ms |
| Leaderboard re-sort | FLIP row re-order; sort arrow rotates; delta cells flash on changed values | 300ms `cubic-bezier(0.2,0,0,1)`; arrow 150ms; flash 600ms |
| Hub row click | Row press → navigate to city dashboard | 200ms press feedback |
| CSV export | Button spinner, then Sonner toast "Ekspor CSV berhasil / CSV exported" | 200ms |
| Bubble hover / click | Tooltip fade; bubble scales 1.05; click = drill-down | 80ms / 120ms |
| Out-of-scope card | Slides in over panels | 200ms |
| `prefers-reduced-motion` | All animations 0ms/instant; map uses `jumpTo` instead of `animateTo` | — |

## 6. Visual Design Spec (D6)

**Theme tokens** (Tailwind v4 `@theme inline` in `app/globals.css`):

| Token | Value (light / dark) | Used for |
| --- | --- | --- |
| `--city-accent` | per-city pair (table below) | Header chip, rank dot, bubble halo, focus ring, selected-row edge |
| `--city-accent-soft` | accent at 12% alpha | Row hover wash, empty-state glyph fill, paratransit chip bg |
| `--surface` / `--surface-elevated` | white / zinc-950 · white / zinc-900 | Panels vs cards |
| `--border-default` | zinc-200 / zinc-800 | Dividers, table rules |
| `--status-normal/watch/surge` | `#22c55e` / `#eab308` / `#ef4444` | Status pills, bubbles, trend arrows (AA on both themes) |
| `--font-data` | mono with `tabular-nums` | VCI figures, ranks, timestamps, CSV filename |

**City accent identities** (match D8 fixture `accent` — applied via `data-city` on
`<html>`; components use `bg-[var(--city-accent)]` / `text-[var(--city-accent)]`, no
per-city conditional classes):

| City | Light / dark hex | Contrast text | Signature usage |
| --- | --- | --- | --- |
| JKT | `#0ea5e9` / `#38bdf8` | white / sky-950 | Gambir rank dot, bubble halo |
| SBY | `#f43f5e` / `#fb7185` | white / rose-950 | Gubeng halo, drill-down edge |
| BDG | `#8b5cf6` / `#a78bfa` | white / violet-950 | Hall selected-row bar |
| MDN | `#14b8a6` / `#2dd4bf` | white / teal-950 | Medan Pusat pulse ring |
| MKS | `#f59e0b` / `#fbbf24` | zinc-950 / amber-950 | Maros tooltip accent |

**Typography & data style (mono-for-data, sans-for-UI):**
- Leaderboard figures: `--font-data` 14px (16px for current VCI), right-aligned, 1-decimal
  format; rank 12px muted; column headers 12px sans uppercase `tracking-wide` (D7).
- Labels/nav/buttons 14px sans; section title 18px semibold; page title 24px.
- Trend arrows: ▲ rising / ▼ falling / → flat, accent-colored, 2px above baseline.

**Layout & elevation:**
- 4px grid; leaderboard row 44px; hover = `--city-accent-soft` wash + 2px left accent bar
  (slide-in 120ms, D5); cards = `--surface-elevated`, 1px `--border-default`, 8px radius,
  `shadow-sm`; keyboard focus ring 2px `--city-accent`, 2px offset.
- Bubble legend bottom-left: mono figures + status swatches; map controls 24px; map style
  uses the dark/light variant of the repo basemap.
- Status pill anatomy: 12px mono, dot + label, 6px radius, `--status-*` at 12% alpha fill.

**DEMO badge** (shared `DemoBadge`, every mock surface): fixed top-right, `z-50`,
uppercase 11px `tracking-widest`, amber-400 text on amber-400/15% `backdrop-blur` chip,
1px amber-400/40 border, 6px radius, `role="status"`, `pointer-events-none`; renders
`demo.badge` (D7) so it flips id/en.

## 7. Content & Copy (D7) — quoted id/en pairs

| Key | id | en |
| --- | --- | --- |
| `nav.dashboard` | "Dasbor" | "Dashboard" |
| `nav.national` | "Nasional" | "National" |
| `leaderboard.title` | "Papan Peringkat Kemacetan Nasional" | "National Choke Leaderboard" |
| `leaderboard.rank` | "Peringkat" | "Rank" |
| `leaderboard.hub` | "Hub" | "Hub" |
| `leaderboard.city` | "Kota" | "City" |
| `leaderboard.mean7d` | "VCI Rata-rata 7 Hari" | "7-Day Mean VCI" |
| `leaderboard.current` | "VCI Saat Ini" | "Current VCI" |
| `leaderboard.trend` | "Tren" | "Trend" |
| `leaderboard.surges` | "Lonjakan" | "Surges" |
| `leaderboard.status` | "Status" | "Status" |
| `leaderboard.export` | "Ekspor CSV" | "Export CSV" |
| `leaderboard.sortBy` | "Urutkan" | "Sort by" |
| `city.switch` | "Ganti Kota" | "Switch City" |
| `paratransit.angkot` | "Angkot" | "Angkot" |
| `paratransit.becak` | "Becak" | "Becak" |
| `paratransit.petePete` | "Pete-pete" | "Pete-pete" |
| `status.normal` | "Normal" | "Normal" |
| `status.watch` | "Pantau" | "Watch" |
| `status.surge` | "Lonjakan" | "Surge" |
| `empty.noData.title` | "Belum Ada Data" | "No Data Yet" |
| `empty.noData.body` | "Belum ada data yang dilaporkan untuk kota ini." | "No reported data for this city yet." |
| `scope.outOfRegion` | "Di Luar Wilayah" | "Out of Scope" |
| `scope.outOfRegion.body` | "Peran Anda hanya mencakup wilayah {region}." | "Your role is scoped to {region} only." |
| `toast.csvOk` | "Ekspor CSV berhasil" | "CSV exported" |
| `toast.csvFail` | "Gagal mengekspor CSV" | "CSV export failed" |
| `demo.badge` | "MODE DEMO" | "DEMO MODE" |

Missing `id` keys fall back to `en` (language fallback, D4); `{region}` interpolated.

## 8. Mock Data Spec (D8)

**Typed city-profile registry** (`src/fixtures/cities/city-profiles.ts`):

```ts
type CityId = 'JKT' | 'SBY' | 'BDG' | 'MDN' | 'MKS' | 'YOG';
interface CityProfile {
  id: CityId;
  name: { id: string; en: string };
  region: 'Java' | 'Sumatra' | 'Sulawesi';
  hubs: HubProfile[];                 // id, name id/en, lon/lat, base VCI, amplitude
  paratransit: 'ANGKOT' | 'BECAK' | 'PETE_PETE';
  viewport: { center: [number, number]; zoom: number };
  accent: { token: string; hex: string };   // D6
}
```

| City | Hubs (12 total) | Paratransit | Viewport center | Zoom | Accent |
| --- | --- | --- | --- | --- | --- |
| Jakarta (JKT) | Gambir, Senen, Manggarai, Tanah Abang | Angkot | [106.83, −6.18] | 12.2 | sky-500 |
| Surabaya (SBY) | Gubeng, Pasar Turi | Angkot | [112.75, −7.25] | 12.5 | rose-500 |
| Bandung (BDG) | Stasiun Hall, Kiaracondong | Angkot | [107.61, −6.91] | 12.8 | violet-500 |
| Medan (MDN) | Medan Pusat, Belawan | Becak | [98.68, 3.59] | 11.8 | teal-500 |
| Makassar (MKS) | Makassar, Maros | Pete-pete | [119.42, −5.14] | 12.0 | amber-500 |

- **Seeds:** 5 cities × 2–4 hubs = 12 hubs; each hub: 24 station exits, 7×96 hourly VCI
  history points (reuse Sprint 3/8 deterministic generator), 3 wardens, 5 events, 2 kiosks.
- **Empty-city fixture:** `YOG` (Yogyakarta) is registered in the switcher with a profile
  but zero reported data — drives the D4/D7 empty-city state on every re-scoped surface.
- **Translation dictionary:** ~60 keys × id/en (D7 shows all leaderboard-facing pairs).
- **Realism:** paratransit mapping follows the sprint doc (Angkot Jakarta/Bandung,
  Becak Medan, Pete-pete Makassar); real hub names/locations; BPS-derived region labels.

## 9. Liveness & Behavior (D9) — deterministic rules

| Event | Tick | Rule |
| --- | --- | --- |
| `city_vci_tick` | every 5s | Per-city drift from seeded PRNG (mulberry32 keyed by city id): JKT ±3, SBY ±4, BDG ±3, MDN ±5, MKS ±4 — reproducible across reruns |
| `medan_peak_scheduled` | t+90s, once | Medan Pusat VCI 79 → 84: bubble → SURGE, leaderboard surge badge +1, national alert banner (Sprint 3 hook) |
| Thresholds | — | SURGE ≥ 80, WATCH 65–79.9, NORMAL < 65; leaderboard recomputes from latest series |

- **Tab visibility:** driver pauses when `document.hidden`; on resume, single catch-up
  step (no multi-tick spiral).
- **`prefers-reduced-motion`:** all D5 animations → 0ms; map uses `jumpTo` (D5 table).
- Aggregation recomputes live but is pure — same inputs → same leaderboard (tested, D10).

## 10. Tech Specs (D10) — stack fixed: Next.js 16 App Router, React 19, TS strict, Tailwind v4, MapLibre v6, Zustand, React Query, RHF+Zod, Axios, Sonner, Lucide, Vitest, Playwright. No new frameworks.

| Concern | Implementation |
| --- | --- |
| City profiles | `src/fixtures/cities/city-profiles.ts` (typed `CityProfile[]`), `src/fixtures/types/city.ts` |
| Global city store | `src/store/city-store.ts` (zustand: `cityId`, `setCity`, `regionOf`) |
| Locale store | `src/store/locale-store.ts` (zustand `persist`, key `tf-locale`) |
| i18n (next-intl mock) | `src/i18n/translations.ts`: `type Locale = 'id' | 'en'`, `const translations: Record<Locale, Record<TranslationKey, string>>`; `src/i18n/use-t.ts`: `useT()` → `t(key, vars?)` with `en` fallback + dev-only warning |
| Aggregation | `src/lib/national/aggregate.ts` — pure fns `mean7d`, `trend`, `surgeCount`, `aggregateLeaderboard(history) → LeaderboardRow[]` |
| CSV export | `src/lib/national/csv.ts` — `buildCsv(rows)` pure fn; client Blob download `national-leaderboard-YYYY-MM-DD.csv` |
| Mock repositories | `src/repositories/mock/national-repository.ts`, `city-profile-repository.ts` — `interface NationalRepository { leaderboard(): Promise<LeaderboardRow[]>; bubbles(): Promise<Bubble[]> }` (production swaps implement the same interface) |
| Bubble map | `src/features/national/CityBubbleMap.tsx` — MapLibre layers: `hub-bubble-halo` (circle, city accent), `hub-bubble-layer` (radius `sqrt(mean7d)` 8–36px, fill by status), `hub-bubble-label` (symbol, mono); viewport via `animateTo` |
| Leaderboard UI | `src/features/national/NationalLeaderboard.tsx` (RHF-free table, sortable columns, FLIP re-order) |
| Header | `src/components/header/CitySwitcher.tsx`, `LocaleToggle.tsx` (Lucide icons, Sonner toasts) |
| Route | `src/app/national/page.tsx` (server shell + client surfaces) |
| RBAC | `src/lib/rbac/scope.ts` — fixture agency roles → `Region`; out-of-scope guard component |
| React Query | Keys `['leaderboard']`, `['bubbles']`, `['vci', cityId]` — invalidated on city switch |

**Re-scope contract** — stores/hooks reading `cityId` from `useCityStore()`:

| Surface (Sprint) | Store / query key | Reads cityId |
| --- | --- | --- |
| VCI heatmap (3) | `useVciStore` / `['vci', cityId]` | yes — slice by city |
| Stations & AI QA (2) | `useStationStore` | yes |
| Command Center (7) | `useWardenStore`, `useEventStore` | yes |
| Forecast (8) | `useForecastStore` | yes |
| CCTV (9) | `useCctvStore` | yes |
| Kiosks (10) | `useKioskStore` | yes |
| Alerts (3/8) | `useAlertStore` | yes |
| Header switcher | `useCityStore` (writer) | sets cityId |

**Live-driver events:** `city_vci_tick`, `medan_peak_scheduled` (D9) — emitted by the
shared Zustand driver, consumed by the VCI store.

**Test strategy (Vitest):** `src/lib/national/aggregate.test.ts` — mean7d determinism,
ranking order, surgeCount threshold, trend classification, CSV header/escaping;
`src/i18n/translations.test.ts` — key-parity (`assertKeysEqual(id, en)`, every key
referenced by components exists, no orphan keys). **Playwright:** `e2e/national.spec.ts`
— city switch re-centers map and re-scopes stations; id/en toggle flips nav labels and
persists across reload; CSV download contains header + 12 hub rows; drill-down lands on
`/dashboard?city=*`; out-of-scope card for cross-region agency; demo badge visible.

## 11. Demo Script (acceptance)

1. Open `/dashboard` (Jakarta) → header switcher → **Surabaya**: map animates 700ms,
   stations/wardens/kiosks re-scope, paratransit chip = Angkot. *(Accept: every surface
   reads cityId; skeleton shown during 250ms load.)*
2. Toggle **Bahasa Indonesia** → all labels flip (D7 pairs); reload keeps id.
3. Open `/national` → 12 hubs ranked by 7-day mean VCI; sort by current VCI (FLIP 300ms).
4. At t+90s Medan Pusat crosses 80 → SURGE bubble + badge + national alert banner.
5. Click "Surabaya Gubeng" → `/dashboard?city=SBY`.
6. Log in as DISHUB SUMUT → select Jakarta → "Di Luar Wilayah" card (200ms).
7. Export CSV → 13-line file + "Ekspor CSV berhasil" toast.

**Acceptance:** every surface responds to city + language state; 12 hubs render from
fixtures; aggregations deterministic; DEMO badge visible.

## 12. Dependencies

- Mock repositories: `national-repository`, `city-profile-repository`
- Live driver: `city_vci_tick`, `medan_peak_scheduled`
- Shared fixtures: all Sprint 2–10 datasets re-partitioned by city (mock of PostGIS partitioning)
- Shared components: header city selector, alert banner (Sprint 3), skeleton, DEMO badge
- i18n foundation: `translations.ts` + `useT()` shared with Sprint 6 Commuter Portal
