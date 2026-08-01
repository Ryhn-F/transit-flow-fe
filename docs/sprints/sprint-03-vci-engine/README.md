# Sprint 3 — Real-Time Volumetric Choke Index (VCI) Engine

**Deliverable:** Live Overcrowding Heatmap & Risk Scoring Engine.

## Key Features

- Mathematical Volumetric Choke Index (VCI) algorithm:

  `VCI = min(100, (PedestrianFlowRate + VehicularDrop-offSurge) / (EffectiveChannelWidth × WalkwayComplianceFactor(α)) × 100)`

- GEO MAPID real-time color-coded exit risk layer (Green = Smooth, Yellow = Warning, Red = Choke Risk)
- Automated threshold alerts via email/Telegram to hub station masters when VCI ≥ 80

## Why This Sprint

Combines Sprint 1's physical widths with Sprint 2's AI crowd counts to generate the core Volumetric Choke Index.

## Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| Backend & Stream Processing | Upstash Redis (Pub/Sub + in-memory caching), Node.js worker queues (BullMQ) |
| Spatial Analytics | Turf.js + PostGIS spatial functions (ST_Buffer, ST_Intersects) |
| Alert Messaging | Telegram Bot API, Discord Webhooks, SendGrid Free Tier |

**Tools & Procurement (100% free):** Upstash Redis (10,000 req/day), Telegram Bot API & Discord Webhooks (unlimited), SendGrid Free Tier (100 emails/day).

## Implementation Procedure

1. Implement VCI mathematical engine in TypeScript with dynamic compliance factor α
2. Provision Upstash Redis Free Tier for high-speed in-memory caching of live VCI scores
3. Build PostGIS spatial buffer functions (ST_Buffer, ST_Intersects) for choke radii within 150m of exits
4. Implement real-time VCI heatmap layer in MapLibre GL JS (Green: VCI<50, Yellow: 50–79, Red: VCI≥80)
5. Set up Telegram bot (BotFather) + automated alert dispatcher for hub station masters
6. Set up Discord webhooks and SendGrid free tier as backup alert channels
7. Build background queue worker (BullMQ / Upstash Redis) to recalculate VCI every 60 seconds
8. Trigger automated surge notifications: VCI ≥ 80 broadcasts exit surge alerts with maps in <5 seconds
9. Build station operator alert banner: live flashing banners + audio cues in the Next.js 16 dashboard
10. Stress test: simulate peak evening rush payloads at Manggarai and Dukuh Atas, verify zero-latency Redis reads
