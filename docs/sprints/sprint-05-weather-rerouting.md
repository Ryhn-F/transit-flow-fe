# Sprint 5 — Weather-Triggered Flood & Inundation Rerouting

**Deliverable:** Monsoon Flood & Rain-Surge Resilience Module.

## Key Features

- Real-time weather API integration + field flood photo depth detection (via SINI AI / Gemini 3.6 Flash)
- Dynamic pedestrian rain-detour routing (redirecting commuters from flooded underpasses to covered walkways)
- Integration with MAPID Elevation & Disaster Data catalogs

## Why This Sprint

Rain is the single largest external multiplier of transit exit paralysis in Indonesian cities.

## Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| Weather Data | BMKG Open Data API / OpenWeatherMap Free Tier |
| Spatial DEM | USGS / Copernicus 30m open DEM, MAPID Disaster Data Catalog (Top 50 Perk) |
| Routing Algorithm | Dijkstra / A* with dynamic edge weights based on flood depth |

**Tools & Procurement (100% free):** BMKG / OpenWeatherMap (1,000 req/day), MAPID Geo Data Disaster Catalog (Top 50 Perk).

## Implementation Procedure

1. Integrate BMKG open weather API for real-time rain/storm alerts
2. Integrate OpenWeatherMap Free Tier (1,000 req/day) as secondary fallback feed
3. Ingest MAPID Disaster & Elevation catalogs + USGS/Copernicus 30m DEM into PostGIS
4. Build flood photo depth extractor: Gemini 3.6 Flash vision prompts estimate flood depth (cm) from photos
5. Develop dynamic pedestrian Dijkstra/A* router: edge weights adjusted by real-time flood depth (infinity for flooded underpasses)
6. Generate indoor/covered detour routes: elevated walkways and indoor corridors as rain-resilient edges
7. Build weather-triggered reroute switch: auto-enable rain-detour mode when BMKG reports rainfall >20 mm/hr
8. Add rain overlays on GEO MAPID: live BMKG radar imagery + flooded underpass markers
9. Build public rain-path recommendation component: "Rain Safe-Path" toggle in commuter WebGIS UI
10. Validate monsoon simulation: run 50mm heavy rain scenario at Tanah Abang; verify automatic rerouting
