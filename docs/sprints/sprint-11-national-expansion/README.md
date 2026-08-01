# Sprint 11 — Multi-City National Transit Hub Expansion

**Deliverable:** Multi-City Localization & National Dashboard.

## Key Features

- Pre-configured spatial profiles for top Indonesian transit hubs across Jabodetabek, Surabaya, Bandung, and Medan
- National Transit Choke Index leaderboard for the Ministry of Transportation (Kemenhub)
- Multi-language support and regional paratransit customization (Angkot vs. Becak vs. Pete-pete)

## Why This Sprint

Scales the platform from a local Jakarta proof-of-concept to a nationwide platform.

## Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| Internationalization | next-intl (Bahasa Indonesia & English) |
| Database | PostGIS table partitioning by region (Java, Sumatra, Bali) |

**Tools & Procurement (100% free):** Vercel / Cloudflare Pages multi-region edge deployment, BPS national administrative boundary open data.

## Implementation Procedure

1. Implement next-intl i18n architecture (Bahasa Indonesia, English, regional dialects)
2. Ingest BPS national administrative boundary GeoJSON into PostGIS
3. Partition PostGIS tables by geographic region (Java, Sumatra, Bali, Sulawesi)
4. Configure regional paratransit models (Angkot in Jakarta/Bandung, Pete-pete in Makassar, Becak in Medan)
5. Pre-configure spatial profiles for top cities (Surabaya Gubeng, Bandung Stasiun Hall, Medan, Makassar)
6. Build National Transit Choke leaderboard dashboard for Kemenhub
7. Set up multi-region Vercel / Cloudflare deployments for low-latency edge delivery
8. Conduct remote field surveyor onboarding with self-paced MAPID Form training guide
9. Implement multi-region RBAC to isolate regional Dishub authorities
10. Execute nationwide beta launch across 5 pilot hubs (Surabaya, Bandung, Medan)
