# Mock UI PRD — Sprint 11: National Expansion

**Sprint reference:** `docs/sprints/sprint-11-national-expansion.md`

## Purpose

Demonstrate the platform at national scale: switching between Indonesian city hubs,
comparing them on a Ministry-of-Transportation leaderboard, and seeing localization
(Bahasa Indonesia / English, regional paratransit models) — all from fixtures.

## Demo Surfaces

### 1. City Switcher (`/national` — new route + header upgrade)
- Global city selector in the app header: **Jakarta · Surabaya · Bandung · Medan · Makassar**
  (each with a pre-configured spatial profile: hub geometry, zoom level, paratransit mode)
- Switching cities re-scopes every surface: map viewport, station set, VCI states, wardens,
  events, kiosks — the entire fixture dataset is city-partitioned (mock of PostGIS
  regional table partitioning)
- Regional paratransit customization visible in survey and portal surfaces:
  **Angkot (Jakarta/Bandung) · Becak (Medan) · Pete-pete (Makassar)**

### 2. National Choke Leaderboard (Kemenhub)
- Ministry-facing table: 12 national hubs ranked by 7-day mean VCI, current VCI,
  delta trend, surge count — with a **Kemenhub** export button (CSV, real download from fixtures)
- Hub row click → drills into that city's dashboard-scoped view
- National map: city bubbles sized by mean VCI, colored by status

### 3. Localization (i18n)
- Language toggle: **Bahasa Indonesia / English** — all navigation, labels, alerts, and
  portal copy switch (fixture translation dictionary; next-intl mock via a translation map)
- Regional dashboard accent: each city carries a subtle identity (name, badge, paratransit
  iconography)

### 4. Regional RBAC Preview
- Agency role pills per region (DISHUB JABODETABEK vs DISHUB SUMUT) — scoping the Command
  Center (Sprint 7) to regional fixtures; cross-region access shows a fixture-based
  "out of scope" state

## Mock Data

- 5 cities × 2–3 hubs each (12 hubs total), each with: station set, 7-day VCI history
  (reuse generator from Sprint 3/8), wardens, events, kiosks
- Translation dictionary: id/en for ~120 strings
- Paratransit mode definitions per city

## Liveness Simulation

- National VCI aggregates recompute with the shared live driver (city hubs drift
  independently); one city's hub crosses 80 mid-demo → leaderboard badge + national alert

## Interactions

- City switching (full re-scope), language toggle, leaderboard sorting/filtering, row
  drill-down, Kemenhub CSV export, regional role pills

## Demo Script

1. Switch language to Bahasa Indonesia — all surfaces re-render in id
2. Switch city Jakarta → Surabaya — map, stations, and paratransit mode re-scope (Angkot → Becak contrast shown via Medan)
3. Open the National leaderboard — 12 hubs ranked; Medan Gubeng peaks mid-demo
4. Click a hub row → city-scoped dashboard view
5. Export the Kemenhub CSV

**Acceptance:** every surface responds to city + language state; all 12 hubs render with
consistent fixture data; demo badge visible.

## Dependencies

- Mock repository: `national-repository`, `city-profile-repository`
- Live driver: `city_vci_tick` (per-city drift)
- Shared fixture: all prior fixture sets re-partitioned by city
- Shared components: header city selector, leaderboard table
