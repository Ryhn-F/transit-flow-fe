# Sprint 7 — Multi-Agency Dishub & Transit Command Center

**Deliverable:** Multi-Tenant Enterprise Command Dashboard.

## Key Features

- Role-based access for Municipal Transportation Authorities (Dishub), Police, and Transit Operators (LRT/MRT/KAI)
- Cross-agency dispatch workflow: one-click notification to dispatch traffic wardens to specific double-parking coordinates
- Analytics dashboard tracking historical bottleneck trends and response lead times

## Why This Sprint

Escalates the product to an enterprise multi-agency B2G tool once individual station tools (Sprints 1–6) are mature.

## Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| Auth & Multi-Tenancy | Clerk Free Tier / Supabase Auth (multi-org, RBAC up to 10,000 MAU) |
| WebSockets | Socket.io on Render Free Tier / Upstash Redis PubSub |
| Analytics | Supabase PostGIS + DuckDB (embedded spatial analytics) + Recharts / Chart.js |

**Tools & Procurement (100% free):** Clerk / Supabase Auth (10,000 MAU), Socket.io on Render (750 free hours/month), Supabase PostGIS.

## Implementation Procedure

1. Set up multi-tenant RBAC via Clerk / Supabase Auth with multi-organization roles (Dishub, KAI, MRT, Police)
2. Build enterprise multi-monitor layout: CSS Grid + Tailwind dashboard for multi-screen War Room display walls
3. Deploy Socket.io signaling server on Render, connected to Upstash Redis Pub/Sub for cross-agency state sync
4. Build one-click warden dispatch workflow: click map choke coordinates → dispatch nearest field warden
5. Integrate embedded DuckDB analytics for ultra-fast in-memory aggregation of bottleneck logs
6. Build historical bottleneck heatmaps with time-slider controls (days/weeks/months)
7. Implement multi-agency screen syncing via Socket.io (Dishub War Room actions reflect on Station Master screens)
8. Develop cross-agency SLA tracker: response lead times (VCI warning → warden arrival)
9. Implement executive CSV/Excel report exporter for Kemenhub
10. Deploy command center staging: live simulation with municipal transit authorities
