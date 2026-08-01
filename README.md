<div align="center">

# TransitFlow AI

### Real-time WebGIS for monitoring and field-surveying transit hub congestion

TransitFlow AI is a spatial intelligence platform that visualizes live congestion at transit
hubs and lets field surveyors submit ground-truth observations — photos, audio notes, and
congestion metrics — that feed an AI multi-modal extraction pipeline.

**Jakarta · Dukuh Atas Interchange · Built for the 12-month National Expansion program**

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=black)](https://tailwindcss.com)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-396CB2?style=for-the-badge&logo=maplibre&logoColor=white)](https://maplibre.org)
[![Supabase](https://img.shields.io/badge/Supabase_%2F_PostGIS-3FCF8E?style=for-the-badge&logo=supabase&logoColor=black)](https://supabase.com)
[![Vitest](https://img.shields.io/badge/Vitest-6B9F3A?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)

</div>

---

## Overview

TransitFlow AI turns raw transit-hub congestion data into a live spatial picture. Station
statuses, risk streams, and active spatial layers are rendered over a vector map, while field
surveyors contribute verified ground truth through an evidence-first survey workflow.

| Capability | Description |
| --- | --- |
| **Spatial Dashboard** | Live station registry rendered as GeoJSON markers with congestion-aware status coloring, 2D/3D perspective toggle, and station fly-to |
| **Field Survey** | Evidence-first observation form — GPS coordinates, observation type, congestion level, obstruction impact, photo upload, and audio recording |
| **Spatial Data Ingest** | Incoming observation reports normalized from the MAPID webhook into structured survey submissions |
| **AI Multi-Modal Extraction** | Simulated extraction summary from photos + audio — the foundation of the upcoming Sini AI parsing engine |
| **Theme System** | Full light/dark mode with synchronized map styles and persisted preference |

## Architecture

Clean Architecture adapted for a Next.js frontend — dependencies point **inward**:

```
┌────────────────────────────────────────────────────────────┐
│  app/         Next.js App Router — routing only             │
│               (pages + API route handlers)                  │
├────────────────────────────────────────────────────────────┤
│  features/    Feature slices: stations · survey             │
│               (views → components → hooks)                  │
├────────────────────────────────────────────────────────────┤
│  entities/    Pure domain types (station, survey, VCI)      │
│  infrastructure/  Axios client · repositories               │
├────────────────────────────────────────────────────────────┤
│  Zustand      UI state only (selection, layers, drafts)     │
│  React Query  Server cache (30s stale, 2 retries)           │
│  Supabase     PostgreSQL + PostGIS persistence              │
└────────────────────────────────────────────────────────────┘
```

```
Client Component → Hook → Repository → Axios → Next.js API Route → Supabase
```

## Tech Stack

| Concern | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19, TypeScript `strict` |
| Styling | Tailwind CSS 4 (class-based dark mode) |
| Maps | MapLibre GL v6 — vector tiles, GeoJSON markers, 2D/3D modes |
| State | Zustand (UI state) · TanStack React Query (server cache) |
| Forms | React Hook Form + Zod (schema mirrors the backend) |
| Persistence | Supabase PostgreSQL + PostGIS |
| HTTP | Axios (typed, 10s timeout, normalized errors) |
| UI Feedback | Sonner toasts · Lucide icons |
| Testing | Vitest (unit) · Playwright (E2E) |

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (PostGIS enabled) with the schema in [`docs/migrations/01_sprint1_schema.sql`](docs/migrations/01_sprint1_schema.sql)

### Install

```bash
git clone https://github.com/Ryhn-F/transit-flow-fe.git
cd transit-flow-fe
npm install        # postinstall also provisions the MapLibre workers into /public
```

### Environment

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | API base — defaults to `/api` (self-hosted route handlers) |
| `NEXT_PUBLIC_MAPLIBRE_STYLE_URL` | Light vector tile style JSON (e.g. OpenFreeMap liberty) |
| `NEXT_PUBLIC_MAPLIBRE_DARK_STYLE_URL` | Dark vector tile style JSON (defaults to OpenFreeMap dark) |
| `NEXT_PUBLIC_MAPLIBRE_API_KEY` | Optional tile provider key |
| `NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT/LNG` | Default map viewport (Jakarta) |
| `NEXT_PUBLIC_DEFAULT_MAP_ZOOM` | Default zoom (11) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Server-only credentials for the route handlers |

### Run

```bash
npm run dev        # http://localhost:3000
```

## Project Structure

```
src/
├── app/                    # App Router — pages + API route handlers
│   ├── dashboard/          # Spatial dashboard
│   ├── survey/             # Field survey modal workflow
│   └── api/                # stations · stations/search · stations/[id] · surveys · webhooks/mapid
├── components/shared/      # app shell, sidebar, top bar, map canvas, draw control
├── features/               # stations & survey feature slices
├── entities/               # pure domain types
├── infrastructure/         # axios client + repositories
└── lib/                    # env, theme, query client, utils
docs/                       # DESIGN.md · 12-sprint roadmap · migrations
e2e/                        # Playwright specs
```

## API Surface

| Route | Method | Description |
| --- | --- | --- |
| `/api/stations` | GET | All stations as GeoJSON FeatureCollection |
| `/api/stations/search?q=` | GET | Station name search |
| `/api/stations/:id` | GET | Station by ID |
| `/api/surveys` | GET / POST | List / create survey submissions (Zod-validated) |
| `/api/webhooks/mapid` | POST | MAPID form webhook ingestion (snake/camel-case tolerant) |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E |

## Roadmap

TransitFlow AI ships in 12 sprints — the full program is documented in [`docs/sprints/`](docs/sprints/).

| Sprint | Focus |
| --- | --- |
| 1 | Core field survey, spatial drawing, MAPID webhook integration |
| 2 | Sini AI parsing engine (photo + audio extraction) |
| 3 | VCI congestion engine |
| 4 | Temporary buffer allocator |
| 5 | Weather-based rerouting |
| 6 | Commuter portal |
| 7 | Command center |
| 8 | Predictive surge modeling |
| 9 | CCTV / IoT pipeline |
| 10 | Retail kiosk engine |
| 11 | National expansion |
| 12 | Enterprise API SDK |

## Development Workflow

This repository follows **Git Flow**:

- `main` — production (merge-only, via release branches)
- `develop` — integration branch
- `feature/*` — created from `develop`, merged back via pull request
- `hotfix/*` — created from `main` for production patches

## Documentation

- [DESIGN.md](DESIGN.md) — architecture, conventions, and best practices
- [docs/sprints/](docs/sprints/) — sprint technical specifications
- [docs/migrations/](docs/migrations/) — SQL schema migrations
