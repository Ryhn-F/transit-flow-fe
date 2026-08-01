# Sprint 1 — Core Field Survey & Spatial Node Registry

**Deliverable:** Interactive Station Exit & Obstacle Mapping WebGIS.

## Executive Summary

Without a high-precision spatial baseline of physical station exit geometries, no AI model or capacity calculation can exist. Sprint 1 provisions the core spatial registry, PostGIS database tables, MapLibre WebGIS renderer, field survey form, and spatial drawing tools.

---

## Tech Stack & Infrastructure

| Layer | Technology | Infrastructure / Hosting |
|---|---|---|
| **Frontend** | React 19 + Next.js 16 (App Router), MapLibre GL JS | Vercel Free Tier / Cloudflare Pages |
| **Styling & UI** | Tailwind CSS 4, Lucide Icons, Sonner | Built-in |
| **State & Forms** | Zustand 5, React Hook Form, Zod | Client-side |
| **Backend API** | Next.js 16 API Route Handlers | Next.js Serverless Routes |
| **Database** | Supabase PostgreSQL + PostGIS Extension | Supabase Free Tier |
| **Ecosystem & MAPID** | MAPID Form Webhook / API, GEO MAPID / OpenFreeMap vector tiles | Free Tier / Top 50 Perks |

---

## Detailed Technical Specification

### 1. Database Schema & PostGIS Migrations (`docs/migrations/01_sprint1_schema.sql`)

```sql
-- Enable PostGIS spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Station Nodes spatial table (existing/updated)
CREATE TABLE IF NOT EXISTS station_nodes_geojson (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id VARCHAR(100) UNIQUE NOT NULL,
  station_name VARCHAR(255) NOT NULL,
  line_name VARCHAR(100),
  city VARCHAR(100) DEFAULT 'Jakarta',
  geometry GEOMETRY(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Field Survey Submissions & Exit Geometries
CREATE TABLE IF NOT EXISTS survey_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id VARCHAR(100) REFERENCES station_nodes_geojson(station_id) ON DELETE CASCADE,
  surveyor_name VARCHAR(255) NOT NULL,
  exit_door_width_m NUMERIC(5,2) CHECK (exit_door_width_m > 0),
  stair_width_m NUMERIC(5,2) CHECK (stair_width_m >= 0),
  sidewalk_width_m NUMERIC(5,2) CHECK (sidewalk_width_m > 0),
  obstacle_type VARCHAR(100) CHECK (obstacle_type IN ('vendor', 'construction', 'angkot_queue', 'parking', 'other', 'none')),
  notes TEXT,
  geometry GEOMETRY(Geometry, 4326),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spatial Indices
CREATE INDEX IF NOT EXISTS idx_station_nodes_geom ON station_nodes_geojson USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_survey_submissions_geom ON survey_submissions USING GIST (geometry);
```

---

### 2. API Contracts & Route Handlers

#### `GET /api/stations`
- **Response**: GeoJSON FeatureCollection of all transit hub nodes.

#### `GET /api/surveys`
- **Response**: GeoJSON FeatureCollection of all field survey records & mapped geometries.

#### `POST /api/surveys`
- **Request Body (JSON)**:
```json
{
  "station_id": "ST-DUKUH-ATAS-01",
  "surveyor_name": "Field Surveyor 1",
  "exit_door_width_m": 2.5,
  "stair_width_m": 3.0,
  "sidewalk_width_m": 4.2,
  "obstacle_type": "vendor",
  "notes": "Food stall blocking 1.2m of sidewalk during peak hours",
  "geometry": {
    "type": "Point",
    "coordinates": [106.8227, -6.2088]
  }
}
```
- **Validation**: Zod schema (`surveySubmissionSchema`).
- **Response**: `{ "status": "success", "data": { "id": "...", ... } }`

#### `POST /api/webhooks/mapid`
- **Description**: Receiver endpoint for external MAPID Form webhooks. Automatically parses MAPID form payloads and inserts spatial records into `survey_submissions`.

---

### 3. Frontend Component Architecture

1. **Station Spatial Dashboard** (`src/features/stations/DashboardView.tsx`):
   - MapLibre canvas rendering station hubs, exit points, and obstacle layers.
   - Interactive detail sidebar / modal when clicking on any station node.
   - Spatial Editor mode toggle with GeoJSON layer export button.

2. **Map Drawing Control** (`src/components/shared/MapDrawControl.tsx`):
   - Integrates MapLibre draw control for point (exit doors, obstacles) and polygon (sidewalk boundaries) feature creation.

3. **Field Survey Form** (`src/features/survey/SurveyFormView.tsx`):
   - React Hook Form + Zod client validation.
   - Integrated with `surveyRepository.submit()` to persist directly to `/api/surveys`.
   - Toast notification feedback via `sonner`.

---

## Addendum: Dark Mode & Dynamic Vector Map Styling

### Requirements
1. **UI Theme Switcher**: Toggle between `dark` and `light` mode across all WebGIS overlays, navigation bars, and modals using a persistent theme store.
2. **Dynamic Vector Map Tile Switching**:
   - **Light Map Style**: `https://tiles.openfreemap.org/styles/liberty`
   - **Dark Map Style**: `https://tiles.openfreemap.org/styles/dark`
   - Synchronizes MapLibre vector style with the active UI theme via `map.setStyle()`.

---

## Step-by-Step Implementation Procedure

1. **Database Provisioning**: Create `docs/migrations/01_sprint1_schema.sql` for PostGIS spatial tables & indices.
2. **API Routes**: Create `/api/surveys/route.ts` and `/api/webhooks/mapid/route.ts` with Zod validation.
3. **Server Repository**: Implement `ServerSurveyRepository` using `@supabase/supabase-js`.
4. **Client Repository**: Update `surveyRepository.submit()` in `survey-repository.ts` to call `/api/surveys`.
5. **Spatial Editor Control**: Add `MapDrawControl` to MapLibre view in `DashboardView.tsx`.
6. **GeoJSON Exporter**: Add client-side export utility to download validated spatial layers as standard `.geojson` files.
7. **Dark Mode Addendum**: Implement theme store (`useThemeStore`), TopBar toggle button, and dynamic MapLibre style updates (`map.setStyle()`).
8. **End-to-End Testing**: Execute unit/integration tests with Vitest and verify field survey submission flows.
