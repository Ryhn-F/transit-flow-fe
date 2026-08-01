# Sprint 1 — Core Field Survey & Spatial Node Registry

**Deliverable:** Interactive Station Exit & Obstacle Mapping WebGIS.

## Key Features

- MAPID Form integration for field surveyors to map station exit doors, stairs, sidewalk widths, and physical obstacles
- Digital spatial registry of transit hubs (Dukuh Atas, Manggarai, Tanah Abang) rendered on GEO MAPID vector tiles
- Basic spatial point & polygon layer editor

## Why This Sprint

Without a high-precision spatial baseline of physical station exit geometries, no AI model or capacity calculation can exist.

## Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| Frontend | React 19 + Next.js 16, MapLibre GL JS (GEO MAPID layer renderer), Tailwind CSS |
| Backend | Node.js (TypeScript) + Express/Hono microservice |
| Database | Supabase PostgreSQL + PostGIS (spatial) |
| MAPID Ecosystem | MAPID Form SDK, GEO MAPID API (Top 50 Perks) |

**Tools & Procurement (100% free):** MAPID Free Tier / Top 50 Perk, Supabase Free Tier (500 MB DB + 50,000 MAU), Vercel / Cloudflare Pages Free Tier.

## Implementation Procedure

1. Initialize monorepo workspace: Next.js 16 (App Router) + React 19 frontend, Node.js (TS) backend with pnpm workspace
2. Provision Supabase spatial DB: enable PostGIS, run schema migrations for `stations`, `exit_doors`, `sidewalks`, `obstacles`
3. Configure MAPID Form account: activate Top 50 perk, build survey forms for exit door dimensions, stairs, sidewalk widths, obstacle markers
4. Integrate MAPID Form webhook/API: backend webhook receiver auto-ingests field survey entries into PostGIS `exit_doors`
5. Set up MapLibre GL JS base map in Next.js 16 with custom vector tile sources from GEO MAPID API
6. Build spatial point & polygon editor: MapLibre draw tools for exit footprints, staircases, sidewalk boundaries
7. Implement GeoJSON spatial exporter: REST endpoints to export validated GeoJSON to GEO MAPID
8. Map initial target hubs: field surveys at Stasiun Dukuh Atas, Manggarai, Tanah Abang
9. Implement basic access control: Supabase Auth / Clerk Free Tier to restrict editing to authorized surveyors
10. Deploy Sprint 1 base: frontend to Vercel Free Tier, backend to Cloudflare Pages / Render Free Tier; verify real-time vector tile rendering
