# TransitFlow Frontend — Design Document

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack & Dependencies](#tech-stack--dependencies)
3. [Project Structure](#project-structure)
4. [Architecture & Conventions](#architecture--conventions)
5. [Environment Variables](#environment-variables)
6. [Domain Types](#domain-types)
7. [API Layer](#api-layer)
8. [State Management (Zustand)](#state-management-zustand)
9. [Map Integration (MapLibre GL JS)](#map-integration-maplibre-gl-js)
10. [Pages](#pages)
    - [Dashboard Page](#1-dashboard-page)
    - [Field Survey Page](#2-field-survey-page)
11. [Shared Components](#shared-components)
12. [Error Handling & Loading States](#error-handling--loading-states)
13. [Best Practices](#best-practices)

---

## Overview

TransitFlow's frontend is a Next.js 16 application that visualizes real-time station/exit-channel congestion (VCI — Vehicular-Congestion Index) on an interactive map, and lets field surveyors submit ground-truth observations. It consumes the `transit-flow-be` Express API documented separately (`GET /stations`, `GET /stations/search`, `GET /stations/:id`).

Two pages ship in this phase:

| Route        | Purpose                                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard` | Search stations, view them as map points, inspect a selected station's live metrics, alerts, and active layers                                       |
| `/survey`    | Submit a field survey for a station/exit-channel — photo/audio evidence, congestion level, obstruction impact, and a simulated AI-extraction summary |

---

## Tech Stack & Dependencies

| Concern             | Library                                                                                             | Notes                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Framework           | `next@16` (App Router)                                                                              | TypeScript, React Server Components where sensible, Client Components for map/interactive UI                                              |
| Language            | TypeScript 5.x (`strict: true`)                                                                     |                                                                                                                                           |
| UI Kit              | `shadcn/ui`                                                                                         | Copied into `src/components/ui`, not an npm dependency                                                                                    |
| Styling             | `tailwindcss@4`                                                                                     |                                                                                                                                           |
| HTTP client         | `axios`                                                                                             | Single configured instance                                                                                                                |
| Map                 | `maplibre-gl`                                                                                       | Base map + markers + polygon drawing                                                                                                      |
| Draw tool           | `@mapbox/mapbox-gl-draw` (MapLibre-compatible fork: `@maplibregl/maplibre-gl-draw` or `terra-draw`) | Used for polygon/obstruction zone drawing in Field Survey                                                                                 |
| State               | `zustand`                                                                                           | Client-side global state, no context boilerplate                                                                                          |
| Forms               | `react-hook-form` + `zod`                                                                           | Validation mirrors backend Zod schemas                                                                                                    |
| Icons               | `lucide-react`                                                                                      | Matches shadcn defaults                                                                                                                   |
| Utilities           | `clsx`, `tailwind-merge`, `class-variance-authority`                                                | shadcn requirements                                                                                                                       |
| Data fetching/cache | `@tanstack/react-query`                                                                             | Wraps axios calls, handles caching/retries/loading states independently from zustand (zustand holds UI/selection state, not server cache) |
| Notifications       | `sonner` (shadcn toast)                                                                             | Submit success/error feedback                                                                                                             |

### Install

```bash
npx create-next-app@16 transit-flow-fe --typescript --tailwind --app --src-dir --import-alias "@/*"
cd transit-flow-fe

npx shadcn@latest init
npx shadcn@latest add button input card badge separator switch slider tabs \
  dialog sheet select toast sonner skeleton avatar dropdown-menu form label textarea

npm install axios zustand @tanstack/react-query react-hook-form zod @hookform/resolvers
npm install maplibre-gl terra-draw terra-draw-maplibre-gl-adapter
npm install lucide-react clsx tailwind-merge class-variance-authority
```

> **Note on the draw library:** `terra-draw` is preferred over `mapbox-gl-draw` because it's map-library-agnostic and has an official MapLibre adapter with no Mapbox token/EULA entanglement. Use `terra-draw` + `terra-draw-maplibre-gl-adapter` for the polygon-drawing requirement.

---

## Project Structure

Clean Architecture adapted for a Next.js frontend: dependencies point **inward** — UI depends on application hooks, application hooks depend on domain types and repositories (never the reverse).

```
transit-flow-fe/
├── src/
│   ├── app/                                 # Next.js App Router — routing only, no business logic
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       └── page.tsx                 # thin: renders <DashboardView />
│   │   └── survey/
│   │       └── page.tsx                     # thin: renders <SurveyFormView />
│   │
│   ├── components/
│   │   ├── ui/                              # shadcn primitives (generated, do not hand-edit heavily)
│   │   └── shared/                          # cross-feature composites (AppShell, Sidebar, TopBar, MapCanvas)
│   │
│   ├── features/
│   │   ├── stations/                        # Dashboard feature
│   │   │   ├── components/
│   │   │   │   ├── station-search-bar.tsx
│   │   │   │   ├── station-info-card.tsx
│   │   │   │   ├── active-layers-panel.tsx
│   │   │   │   ├── live-alerts-panel.tsx
│   │   │   │   └── stats-footer.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-stations-query.ts     # React Query wrapper over repository
│   │   │   │   ├── use-station-search.ts
│   │   │   │   └── use-selected-station.ts
│   │   │   ├── store/
│   │   │   │   └── station-ui-store.ts       # zustand: selected station id, active layers, search query
│   │   │   ├── DashboardView.tsx             # composition root for the page
│   │   │   └── index.ts
│   │   │
│   │   └── survey/                          # Field Survey feature
│   │       ├── components/
│   │       │   ├── survey-form.tsx
│   │       │   ├── target-station-select.tsx
│   │       │   ├── coordinates-input.tsx
│   │       │   ├── observation-type-picker.tsx
│   │       │   ├── congestion-level-slider.tsx
│   │       │   ├── obstruction-impact-slider.tsx
│   │       │   ├── field-evidence-uploader.tsx
│   │       │   ├── audio-note-recorder.tsx
│   │       │   └── ai-extraction-panel.tsx
│   │       ├── hooks/
│   │       │   ├── use-survey-form.ts        # react-hook-form + zod resolver
│   │       │   └── use-submit-survey.ts      # simulated submit mutation
│   │       ├── store/
│   │       │   └── survey-draft-store.ts     # zustand: in-progress draft, persisted to localStorage
│   │       ├── SurveyFormView.tsx
│   │       └── index.ts
│   │
│   ├── entities/                             # Pure domain types, mirrors backend `shared/types`
│   │   ├── station.ts                        # StationNode, ExitChannel
│   │   ├── survey.ts                         # SurveySubmission
│   │   ├── vci-metric.ts                     # VCIMetric
│   │   └── geojson.ts                        # GeoJSONFeature / GeoJSONFeatureCollection
│   │
│   ├── infrastructure/
│   │   ├── api/
│   │   │   ├── http-client.ts                # configured axios instance
│   │   │   └── endpoints.ts                  # string constants for all backend routes
│   │   ├── repositories/
│   │   │   ├── station-repository.ts         # getAllStations(), searchStations(q), getStationById(id)
│   │   │   └── survey-repository.ts          # submitSurvey() — simulated (mock/delay), swappable later
│   │   └── map/
│   │       ├── maplibre-client.ts            # map init/config, style URL, default viewport
│   │       └── draw-controller.ts            # terra-draw setup, polygon lifecycle helpers
│   │
│   ├── lib/
│   │   ├── query-client.ts                   # React Query client + provider
│   │   ├── utils.ts                          # cn() and other shadcn helpers
│   │   └── env.ts                            # typed, validated env access (zod)
│   │
│   └── styles/
│       └── map.css                           # maplibre-gl overrides
│
├── .env.local
├── .env.example
├── components.json                           # shadcn config
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Layer responsibilities

| Layer                         | Responsibility                                                                               | Depends on                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `app/`                        | Routing, layout composition, metadata                                                        | `features/*`                                      |
| `features/*/components`       | Presentational + container components                                                        | `features/*/hooks`, `components/ui`               |
| `features/*/hooks`            | Orchestrates repository calls + zustand store reads/writes; the only place React Query lives | `infrastructure/repositories`, `features/*/store` |
| `features/*/store`            | Zustand slices — UI/selection state only, never server data                                  | `entities`                                        |
| `infrastructure/repositories` | All axios/API calls; maps raw JSON → domain types                                            | `infrastructure/api`, `entities`                  |
| `infrastructure/api`          | Transport concern only (axios instance, base URL, interceptors)                              | —                                                 |
| `entities`                    | Framework-free TypeScript types/interfaces                                                   | —                                                 |

This mirrors the backend's Controller → Service → Repository layering: **Component → Hook → Repository → HTTP client → API**.

---

## Architecture & Conventions

- **Client vs Server Components:** Anything touching `maplibre-gl`, `zustand`, browser APIs (mic, file input), or React Query must be a Client Component (`"use client"`). Page files in `app/` stay server components that simply render the feature's view component.
- **No direct axios calls in components.** Components call hooks; hooks call repositories.
- **No business logic in `app/`.** Route files are routing glue only.
- **Zustand stores are UI state only.** Server data (station lists, VCI metrics) lives in React Query's cache, accessed via hooks like `useStationsQuery()`. Zustand holds things like "which station is selected," "which layers are toggled," "current draft survey."
- **Absolute imports** via `@/*` alias — no deep relative `../../../` chains.
- **File naming:** `kebab-case.ts(x)` for files, `PascalCase` for components/types, `camelCase` for functions/hooks (`useStationSearch`).
- **One component = one responsibility.** Panels seen in the mockups (Active Layers, Live Alerts, Station Info Card) are separate components composed inside `DashboardView`, not one monolithic file.

---

## Environment Variables

Validated at startup via a small zod schema in `lib/env.ts` (fail fast, same philosophy as the backend).

| Variable                             | Description                                                  |
| ------------------------------------ | ------------------------------------------------------------ |
| `NEXT_PUBLIC_API_BASE_URL`           | Base URL of `transit-flow-be`, e.g. `http://localhost:4000`  |
| `NEXT_PUBLIC_MAPLIBRE_STYLE_URL`     | Vector tile style JSON URL (e.g. MapTiler/OpenFreeMap style) |
| `NEXT_PUBLIC_MAPLIBRE_API_KEY`       | API key for the tile provider, if required                   |
| `NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT` | Default viewport center latitude (Jakarta)                   |
| `NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG` | Default viewport center longitude (Jakarta)                  |
| `NEXT_PUBLIC_DEFAULT_MAP_ZOOM`       | Default zoom level                                           |

```ts
// src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_MAPLIBRE_STYLE_URL: z.string().url(),
  NEXT_PUBLIC_MAPLIBRE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT: z.coerce.number(),
  NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG: z.coerce.number(),
  NEXT_PUBLIC_DEFAULT_MAP_ZOOM: z.coerce.number().default(11),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_MAPLIBRE_STYLE_URL: process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL,
  NEXT_PUBLIC_MAPLIBRE_API_KEY: process.env.NEXT_PUBLIC_MAPLIBRE_API_KEY,
  NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT:
    process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT,
  NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG:
    process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG,
  NEXT_PUBLIC_DEFAULT_MAP_ZOOM: process.env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM,
});
```

---

## Domain Types

Mirrors `shared/types/transitflow.ts` and `shared/types/geojson.ts` from the backend so the two codebases share a mental model. Place these in `src/entities`.

```ts
// src/entities/geojson.ts
export interface GeoJSONFeature<P = Record<string, unknown>> {
  type: "Feature";
  geometry: GeoJSON.Geometry;
  properties: P;
}

export interface GeoJSONFeatureCollection<P = Record<string, unknown>> {
  type: "FeatureCollection";
  features: GeoJSONFeature<P>[];
}
```

```ts
// src/entities/station.ts
export type StationStatus = "OPERATIONAL" | "MAINTENANCE" | "CONGESTED";

export interface StationNode {
  station_id: string;
  station_name: string;
  operator: string;
  peak_hourly_capacity: number;
  active_exit_count: number;
  status: StationStatus;
}

export interface ExitChannel {
  channel_id: string;
  station_id: string;
  channel_name: string;
  physical_width_meters: number;
  effective_width_meters: number;
  walkway_compliance_factor: number;
  max_flow_rate_ppm: number;
}
```

```ts
// src/entities/survey.ts
export type ObservationType =
  | "PEDESTRIAN_FLOW"
  | "OBSTRUCTION"
  | "ILLEGAL_PARKING"
  | "STREET_VENDOR";

export type CongestionLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SurveySubmission {
  survey_id: string;
  station_id: string;
  channel_id: string;
  timestamp: string;
  surveyor_name: string;
  coordinates: { lat: number; lng: number };
  observation_type: ObservationType;
  congestion_level: CongestionLevel;
  obstruction_impact_percent: number;
  obstruction_polygon?: GeoJSON.Polygon | null;
  raw_data: {
    photo_urls: string[];
    audio_note_url?: string;
    audio_transcript?: string;
    manual_notes?: string;
  };
  ai_extraction_summary?: string;
}
```

```ts
// src/entities/vci-metric.ts
export type AlertLevel = "NORMAL" | "WARNING" | "CRITICAL";

export interface VCIMetric {
  channel_id: string;
  timestamp: string;
  pedestrian_flow_rate_ppm: number;
  vehicular_dropoff_surge_vpm: number;
  effective_width_m: number;
  compliance_factor: number;
  vci_score: number;
  alert_level: AlertLevel;
  recommended_action: string;
}
```

---

## API Layer

```ts
// src/infrastructure/api/http-client.ts
import axios from "axios";
import { env } from "@/lib/env";

export const httpClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ?? "Unexpected network error";
    return Promise.reject(new Error(message));
  },
);
```

```ts
// src/infrastructure/api/endpoints.ts
export const ENDPOINTS = {
  stations: "/stations",
  stationSearch: "/stations/search",
  stationById: (id: string) => `/stations/${id}`,
} as const;
```

```ts
// src/infrastructure/repositories/station-repository.ts
import { httpClient } from "@/infrastructure/api/http-client";
import { ENDPOINTS } from "@/infrastructure/api/endpoints";
import type {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
} from "@/entities/geojson";
import type { StationNode } from "@/entities/station";

export const stationRepository = {
  async getAll(): Promise<GeoJSONFeatureCollection<StationNode>> {
    const { data } = await httpClient.get(ENDPOINTS.stations);
    return data;
  },

  async search(query: string): Promise<GeoJSONFeatureCollection<StationNode>> {
    const { data } = await httpClient.get(ENDPOINTS.stationSearch, {
      params: { q: query },
    });
    return data;
  },

  async getById(id: string): Promise<GeoJSONFeature<StationNode>> {
    const { data } = await httpClient.get(ENDPOINTS.stationById(id));
    return data;
  },
};
```

```ts
// src/infrastructure/repositories/survey-repository.ts
import type { SurveySubmission } from "@/entities/survey";

// Phase 1: simulated submission — no real backend endpoint yet
// (survey-submissions module is scaffolded but not implemented server-side).
// Swap the body of this function for a real httpClient.post() call once
// POST /survey-submissions exists — the calling hook does not need to change.
export const surveyRepository = {
  async submit(
    payload: Omit<SurveySubmission, "survey_id" | "timestamp">,
  ): Promise<SurveySubmission> {
    await new Promise((resolve) => setTimeout(resolve, 1200)); // simulate network latency

    return {
      ...payload,
      survey_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
  },
};
```

---

## State Management (Zustand)

Two independent stores, scoped per feature. Neither store holds server-cache data — that's React Query's job.

```ts
// src/features/stations/store/station-ui-store.ts
import { create } from "zustand";

interface LayerToggles {
  crowdDensity: boolean;
  exitGates: boolean;
  temporaryBufferZone: boolean;
  aiRecommendations: boolean;
}

interface StationUIState {
  searchQuery: string;
  selectedStationId: string | null;
  layers: LayerToggles;
  setSearchQuery: (q: string) => void;
  selectStation: (id: string | null) => void;
  toggleLayer: (layer: keyof LayerToggles) => void;
}

export const useStationUIStore = create<StationUIState>((set) => ({
  searchQuery: "",
  selectedStationId: null,
  layers: {
    crowdDensity: true,
    exitGates: true,
    temporaryBufferZone: false,
    aiRecommendations: false,
  },
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectStation: (id) => set({ selectedStationId: id }),
  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),
}));
```

```ts
// src/features/survey/store/survey-draft-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ObservationType, CongestionLevel } from "@/entities/survey";

interface SurveyDraftState {
  stationId: string | null;
  channelId: string | null;
  coordinates: { lat: number; lng: number } | null;
  observationType: ObservationType;
  congestionLevel: CongestionLevel;
  obstructionImpactPercent: number;
  obstructionPolygon: GeoJSON.Polygon | null;
  photoUrls: string[];
  audioNoteUrl: string | null;
  manualNotes: string;
  setField: <K extends keyof SurveyDraftState>(
    key: K,
    value: SurveyDraftState[K],
  ) => void;
  reset: () => void;
}

const initialState = {
  stationId: null,
  channelId: null,
  coordinates: null,
  observationType: "PEDESTRIAN_FLOW" as ObservationType,
  congestionLevel: "MEDIUM" as CongestionLevel,
  obstructionImpactPercent: 0,
  obstructionPolygon: null,
  photoUrls: [],
  audioNoteUrl: null,
  manualNotes: "",
};

export const useSurveyDraftStore = create<SurveyDraftState>()(
  persist(
    (set) => ({
      ...initialState,
      setField: (key, value) =>
        set({ [key]: value } as Pick<SurveyDraftState, typeof key>),
      reset: () => set(initialState),
    }),
    { name: "transitflow-survey-draft" },
  ),
);
```

> **Why `persist`?** The Field Survey form doubles as a "Save Draft" flow (see mockup). Persisting the draft to `localStorage` means a surveyor can close the tab mid-survey without losing captured photos/notes.

---

## Map Integration (MapLibre GL JS)

```ts
// src/infrastructure/map/maplibre-client.ts
import maplibregl from "maplibre-gl";
import { env } from "@/lib/env";

export function createMap(container: HTMLDivElement): maplibregl.Map {
  return new maplibregl.Map({
    container,
    style: env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL,
    center: [
      env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG,
      env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT,
    ],
    zoom: env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM,
  });
}
```

- **`components/shared/map-canvas.tsx`** — a generic, reusable `<MapCanvas />` wrapping the maplibre lifecycle (`useRef` + `useEffect` init/cleanup), exposing an `onMapReady(map)` callback. Both pages use this component; page-specific logic (markers vs. draw tool) is injected via `onMapReady`.
- **Dashboard usage:** on `onMapReady`, subscribe to the stations React Query result and render one `maplibregl.Marker` per feature, color-coded by `status`/`alert_level`. Clicking a marker calls `selectStation(station_id)` in `useStationUIStore`. Layer toggles from `ActiveLayersPanel` show/hide marker layers via `map.setLayoutProperty(...)`.
- **Field Survey usage:** on `onMapReady`, initialize `terra-draw` (via `draw-controller.ts`) scoped to polygon mode only, so surveyors can trace an obstruction zone. On `finish`/`change` events, write the resulting `GeoJSON.Polygon` into `useSurveyDraftStore` (`obstructionPolygon`). Only enabled when `observationType === "OBSTRUCTION"`.

```ts
// src/infrastructure/map/draw-controller.ts
import { TerraDraw, TerraDrawPolygonMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import type maplibregl from "maplibre-gl";

export function createDrawController(map: maplibregl.Map) {
  const draw = new TerraDraw({
    adapter: new TerraDrawMapLibreGLAdapter({ map }),
    modes: [new TerraDrawPolygonMode()],
  });
  draw.start();
  draw.setMode("polygon");
  return draw;
}
```

---

## Pages

### 1. Dashboard Page

Route: `app/(dashboard)/dashboard/page.tsx` → renders `<DashboardView />`.

**Layout (per mockup):**

- Left sidebar (`AppShell` + `Sidebar`): logo, `DASHBOARD` / `FIELD SURVEY` nav items, operator profile footer.
- Top bar: station-scope dropdown ("Dukuh Atas"), global search input, notification bell, avatar.
- Main area: full-bleed `<MapCanvas />`.
- Floating overlay column (top-left, over the map):
  1. **Station Info Card** — name, location, risk badge, VCI score, pedestrian count.
  2. **Active Layers Panel** — checkbox list (Crowd Density, Exit Gates, Temporary Buffer Zone, AI Recommendations) bound to `useStationUIStore().layers`.
  3. **Live Alerts Panel** — scrollable list of alert entries (icon, title, description, relative timestamp), "N NEW" badge.
- Floating footer bar (bottom, over the map): Avg VCI (today) + Est. Peak Time stat chips.

**Data flow:**

1. `useStationsQuery()` (React Query) calls `stationRepository.getAll()` on mount → renders all markers.
2. Typing in the search bar debounces into `useStationSearch(query)`, which calls `stationRepository.search(q)` and re-renders markers/filters the list; empty results render an empty state, not an error (matches backend's "empty array, not 404" contract).
3. Clicking a marker or search result sets `selectedStationId`; `useSelectedStation()` derives the full `StationNode` from the cached collection (or fetches via `getById` if not already in cache) and feeds the Station Info Card.
4. Live Alerts and VCI stat chips are placeholder/mocked data structures in this phase (no backend endpoint yet) — model them with a local `entities/alert.ts` type so they're easy to wire to a real endpoint later.

**Key components:**

| Component                 | Responsibility                                                   |
| ------------------------- | ---------------------------------------------------------------- |
| `DashboardView.tsx`       | Composition root; lays out sidebar, top bar, map, overlay panels |
| `station-search-bar.tsx`  | Controlled input, debounced, wired to `useStationSearch`         |
| `station-info-card.tsx`   | Renders selected station's name/location/risk/VCI/pedestrians    |
| `active-layers-panel.tsx` | Checkbox list bound to zustand layer toggles                     |
| `live-alerts-panel.tsx`   | List of alert cards with severity color coding                   |
| `stats-footer.tsx`        | Avg VCI + Est. Peak Time chips                                   |

---

### 2. Field Survey Page

Route: `app/survey/page.tsx` → renders `<SurveyFormView />`.

**Layout (per mockup):** a modal/dialog (shadcn `Dialog`) titled "New Field Survey" over the map, containing:

1. **Target Station** — shadcn `Select`, options from `useStationsQuery()`.
2. **Survey Coordinates** — text input + "use my location" icon button (Geolocation API), or click-to-pin on the underlying map.
3. **Observation Type** — 2×2 toggle-button grid (`Pedestrian Flow`, `Obstruction`, `Illegal Parking`, `Street Vendor`) → `observation-type-picker.tsx`, backed by shadcn `ToggleGroup`.
4. **Congestion Level** — labeled slider (Low/Med/High/Crit) → `congestion-level-slider.tsx`, shadcn `Slider` with 4 discrete steps.
5. **Obstruction Impact (%)** — shadcn `Slider`, 0–100 continuous → `obstruction-impact-slider.tsx`. When `Obstruction` is the selected type, this section also enables the polygon-draw tool on the map (see [Map Integration](#map-integration-maplibre-gl-js)).
6. **Field Evidence** — photo grid (`field-evidence-uploader.tsx`): existing thumbnails + "Add Photo" tile (native `<input type="file" accept="image/*" capture>` for mobile camera capture, previewed as object URLs); audio note recorder (`audio-note-recorder.tsx`) using `MediaRecorder` API with waveform placeholder + duration.
7. **AI Extraction** — read-only panel (`ai-extraction-panel.tsx`) showing a simulated transcript-derived summary (static/mocked string for this phase, styled as a quoted callout).
8. **Footer actions** — `Save Draft` (writes current form state into `useSurveyDraftStore`, persisted, dialog stays open/closes without submitting) and `Submit Report` (validates via `react-hook-form` + zod, then calls `useSubmitSurvey()`).

**Data flow:**

1. Form state is managed by `react-hook-form`, seeded from `useSurveyDraftStore` on mount (resume a saved draft).
2. Every field change also writes through to the zustand draft store (`setField`) so "Save Draft" always has the latest values, even before formal submit-time validation.
3. `Submit Report` triggers `useSubmitSurvey()` → React Query `useMutation` wrapping `surveyRepository.submit()` (simulated: 1.2s delay, returns a fabricated `survey_id`/`timestamp`).
4. On success: show a `sonner` success toast, call `useSurveyDraftStore().reset()`, close the dialog, and optimistically drop a marker/pin at the submitted coordinates on the dashboard map (if the user navigates back).
5. On failure (simulate via a rejected promise for testing): show a `sonner` error toast, keep the form populated so nothing is lost.

**Validation (zod schema, `use-survey-form.ts`):**

```ts
const surveyFormSchema = z.object({
  stationId: z.string().min(1, "Select a target station"),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  observationType: z.enum([
    "PEDESTRIAN_FLOW",
    "OBSTRUCTION",
    "ILLEGAL_PARKING",
    "STREET_VENDOR",
  ]),
  congestionLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  obstructionImpactPercent: z.number().min(0).max(100),
  photoUrls: z.array(z.string()).min(1, "At least one photo is required"),
  manualNotes: z.string().optional(),
});
```

**Key components:**

| Component                       | Responsibility                                    |
| ------------------------------- | ------------------------------------------------- |
| `SurveyFormView.tsx`            | Composition root; renders dialog + underlying map |
| `target-station-select.tsx`     | shadcn `Select` sourced from station list         |
| `coordinates-input.tsx`         | Text input + geolocation button                   |
| `observation-type-picker.tsx`   | 2×2 toggle button grid                            |
| `congestion-level-slider.tsx`   | 4-step discrete slider with label                 |
| `obstruction-impact-slider.tsx` | 0–100 continuous slider                           |
| `field-evidence-uploader.tsx`   | Photo grid + file input                           |
| `audio-note-recorder.tsx`       | MediaRecorder-based voice note capture            |
| `ai-extraction-panel.tsx`       | Static/simulated AI summary callout               |

---

## Shared Components

| Component   | Location                           | Purpose                                                      |
| ----------- | ---------------------------------- | ------------------------------------------------------------ |
| `AppShell`  | `components/shared/app-shell.tsx`  | Sidebar + top bar layout wrapper shared by both pages        |
| `Sidebar`   | `components/shared/sidebar.tsx`    | Nav items (Dashboard/Field Survey) + operator profile footer |
| `TopBar`    | `components/shared/top-bar.tsx`    | Station scope dropdown, search, notifications, avatar        |
| `MapCanvas` | `components/shared/map-canvas.tsx` | Generic MapLibre lifecycle wrapper reused by both pages      |
| `StatChip`  | `components/shared/stat-chip.tsx`  | Small icon+label+value pill (Avg VCI, Est. Peak Time)        |

---

## Error Handling & Loading States

- All server-data hooks (`useStationsQuery`, `useStationSearch`, `useSubmitSurvey`) surface `{ data, isLoading, isError, error }` from React Query — components render shadcn `Skeleton` placeholders while loading and an inline error state (never a blank screen) on failure.
- Repository functions never swallow errors; the axios interceptor normalizes them into a plain `Error` with a human-readable `message`, which bubbles to the calling hook and then to a `sonner` toast or inline alert.
- Empty search results render an explicit "No stations match your search" empty state, distinct from an error state (mirrors the backend's `q` search contract: empty array ≠ failure).
- Map initialization failures (e.g., style URL unreachable) render a fallback message inside `MapCanvas` instead of a blank gray tile.

---

## Best Practices

### Do

- **Keep `app/` route files thin** — one line rendering the feature's View component.
- **Call repositories only from hooks**, never directly from components.
- **Keep zustand for UI state, React Query for server state** — don't duplicate server data into zustand.
- **Validate env vars at startup** via `lib/env.ts`, same fail-fast philosophy as the backend.
- **Debounce search input** (e.g. 300ms) before hitting `stationRepository.search`.
- **Clean up MapLibre instances** (`map.remove()`) and MediaRecorder streams in `useEffect` cleanup functions.
- **Type all API responses** through `entities/*` — never pass raw `any` JSON into components.

### Don't

- **Don't call `axios` directly in components** — always go through `infrastructure/repositories`.
- **Don't store server-fetched collections in zustand** — that's what React Query's cache is for.
- **Don't hardcode the API base URL** — always read from `env.NEXT_PUBLIC_API_BASE_URL`.
- **Don't block the Obstruction Impact slider or polygon draw tool** for observation types where they don't apply — conditionally render/enable them.
- **Don't lose form progress** — every field change should flow into the persisted draft store before final submit.
- **Don't treat the simulated `survey-repository.submit()` as permanent** — keep its interface identical to what a real `POST /survey-submissions` call will look like, so swapping it later is a one-file change.
