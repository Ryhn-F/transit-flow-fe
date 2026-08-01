# Mock UI PRDs — Full Product Demo (Sprints 2–12)

This directory contains **mock UI product requirement documents (PRDs)** for the
`feature/mock-ui` branch. Each PRD describes the *demo-facing* UI for its sprint —
built with real application architecture but driven entirely by mock fixtures and
simulated liveness, so the entire 12-sprint product vision can be presented end-to-end
before production data exists.

## Why Mock UIs

- Demonstrate the full product vision to stakeholders (MAPID, Dishub, transit operators) today
- Validate UX decisions before infrastructure investment (AI pipelines, CCTV, IoT, ML)
- Keep the architecture honest: mock repositories implement the same interfaces as the
  real ones, so sprint delivery swaps data sources — not UI

## Mock-Ui Architecture (Shared Foundation)

Every mock surface in this branch relies on the same foundation:

| Foundation | Description |
| --- | --- |
| `NEXT_PUBLIC_DEMO_MODE=true` | Env flag selecting the mock provider registry at startup |
| Mock repository layer | In-memory repositories implementing the production interfaces, seeded from fixture datasets |
| Fixture dataset | A single consistent dataset (stations, exits, VCI history, alerts, weather, CCTV, kiosks, cities) shared across all mock PRDs |
| Live driver | Zustand-based timer that mutates fixtures over time (new alerts, VCI drift, surge forecasts, camera snapshots) to simulate a live system during demos |
| Demo telemetry | Optional on-screen "DEMO MODE" watermark/badge so mock data is never mistaken for production |

## PRD Index

| Sprint | Mock PRD | Key Demo Surfaces |
| --- | --- | --- |
| 2 | [Sini AI Parsing Engine](sprint-02-sini-ai-parsing-engine.md) | AI Ingestion QA queue, extraction detail, attribute editor |
| 3 | [VCI Engine](sprint-03-vci-engine.md) | Live VCI heatmap, alert dispatcher banner, alert channel feed |
| 4 | [Buffer Allocator](sprint-04-buffer-allocator.md) | Buffer zone simulator, barrier toggle, dispatch plan export |
| 5 | [Weather Rerouting](sprint-05-weather-rerouting.md) | Rain mode overlay, flooded-underpass layer, detour routing panel |
| 6 | [Commuter Portal](sprint-06-commuter-portal.md) | Public PWA, Safe-Path finder, 1-tap crowd report, push alerts |
| 7 | [Command Center](sprint-07-command-center.md) | War-room multi-monitor dashboard, warden dispatch, SLA analytics |
| 8 | [Predictive Surge](sprint-08-predictive-surge.md) | 48h VCI forecast curves, What-If scenario builder, early warnings |
| 9 | [CCTV & IoT Pipeline](sprint-09-cctv-iot-pipeline.md) | Camera grid, live overlay player, MQTT counter feeds, fallback states |
| 10 | [Retail Kiosk Engine](sprint-10-retail-kiosk-engine.md) | Zero-choke zoning, kiosk placement studio, revenue estimator, PDF proposal |
| 11 | [National Expansion](sprint-11-national-expansion.md) | City switcher, national choke leaderboard, i18n |
| 12 | [Enterprise API / SDK](sprint-12-enterprise-api-sdk.md) | Developer portal, live API explorer, SDK playground, status/SLA panel |

## PRD Template

Each PRD follows the same structure:

1. **Purpose** — what the mock demonstrates and why it matters for stakeholder demos
2. **Demo surfaces** — screens/views/components to build
3. **Mock data** — fixtures required (and how they extend the shared dataset)
4. **Liveness simulation** — what the live driver animates during a demo
5. **Interactions** — key user flows and micro-interactions
6. **Demo script** — a rehearsed walkthrough with acceptance criteria
7. **Dependencies** — mock foundation and shared components required

## Demo Order

Sprints 2–12 compose into a single guided tour: open the Dashboard (VCI live layer),
inspect an AI extraction in QA, trigger a surge alert, dispatch a warden, simulate a
barrier, switch to Rain Mode, open the Commuter Portal, run a What-If scenario, watch
CCTV feeds, place a kiosk, zoom out to the National leaderboard, and finish in the
Developer Portal.
