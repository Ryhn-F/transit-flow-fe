# Sprint 10 — Non-Farebox Station Retail Micro-Kiosk Engine

**Deliverable:** Commercial Retail & Vendor Spatial Zoning Module.

## Key Features

- Identifies "Zero-Choke Retail Zones" where informal vendors can operate legally without obstructing pedestrian flow
- Generates revenue potential scores for station kiosks based on historical commuter foot-traffic density
- MAPID SES (Socioeconomic Status) data overlay for commercial leasing teams

## Why This Sprint

Introduces a B2B monetization engine for transit operators seeking non-farebox revenue (NFR).

## Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| Spatial Micro-Economics | Python (GeoPandas, Shapely), OpenStreetMap POI dataset, MAPID SES dataset (Top 50 Perk) |
| Proposal Generation | React PDF / Puppeteer export engine for commercial leasing proposals |

**Tools & Procurement (100% free):** MAPID Geo Data SES & POI catalog (Top 50 Perk).

## Implementation Procedure

1. Ingest OpenStreetMap POI datasets around transit hubs into PostGIS
2. Integrate MAPID Geo Data SES catalog (income proxies, Top 50 Perk)
3. Develop "Zero-Choke Zoning" algorithm: high foot-traffic areas strictly outside VCI choke corridors
4. Build kiosk foot-traffic heatmap: commercial visibility scores for 3×3m micro-kiosk locations
5. Develop retail revenue potential estimator from SES overlay + foot-traffic volume
6. Build interactive kiosk zoning UI on GEO MAPID (place, resize, score virtual retail kiosks)
7. Integrate React PDF proposal generator: 1-click leasing proposals with spatial site maps
8. Enforce pedestrian flow safety constraints: block kiosk placement if clear walkway < 2.5m
9. Build vendor permit management module: digital spatial permits for registered informal vendors
10. Validate commercial model: trial retail zoning at Dukuh Atas TOD area with transit commercial teams
