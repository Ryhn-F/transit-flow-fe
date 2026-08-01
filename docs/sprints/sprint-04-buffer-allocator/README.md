# Sprint 4 — Dynamic Curb & Micro-Mobility Buffer Allocator

**Deliverable:** Dynamic Pick-Up Zone & Barrier Allocation Engine.

## Key Features

- Algorithmic space re-allocator: generates temporary 15-minute ojek (ride-hailing) pick-up zones during surge hours
- Recommends physical barrier placement coordinates (stanchion dividers) to maintain a 2-meter clear pedestrian walking lane
- Interactive spatial simulator on GEO MAPID to toggle barrier configurations

## Why This Sprint

Moves from passive risk scoring (Sprint 3) to active spatial solutions (re-allocating curb space and pedestrian channels).

## Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| Simulation Engine | Turf.js, Voronoi diagram generators, NetworkX / OSRM (Render Free Tier) |
| Frontend UI | Konva.js / Canvas API overlay on MAPID vector tiles for drag-and-drop barrier simulation |

**Tools & Procurement (100% free):** OSRM server on Render Free Tier / local container, OSM Jabodetabek road network data (open data).

## Implementation Procedure

1. Ingest OSM road network dumps for Jabodetabek into PostGIS using osm2pgrouting
2. Deploy OSRM server on Render Free Tier for pedestrian and micro-mobility routing
3. Develop ojol buffer allocation algorithm: dynamic 15-minute ojek drop-off zone coordinates away from main exit doors
4. Develop pedestrian channel divider logic: barrier placement coordinates preserving a 2-meter clear corridor
5. Build Konva.js / Canvas interactive overlay on GEO MAPID tiles for drag-and-drop barrier simulation
6. Create barrier toggle simulator: operators toggle virtual stanchions and observe simulated VCI drop in real time
7. Build dynamic curb slot dispatcher: 15-minute slot reservations for ride-hailing pick-up zones
8. Export operational dispatch maps: automated SVG/PDF export of temporary barrier layout plans
9. Build webhook event emitter for ojol APIs: `/api/v1/buffer-zones/active` formatted for Grab/Gojek ingestion
10. Conduct field simulation test at Dukuh Atas with field operators; measure simulated crowd throughput increase
