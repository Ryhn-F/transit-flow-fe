# Sprint 6 — Public Commuter Alert & Safe-Path WebGIS Portal

**Deliverable:** Commuter-Facing Mobile WebGIS Application.

## Key Features

- Lightweight public WebGIS showing real-time station exit congestion levels
- Safe-Path Finder: recommends the least congested station exit door for arriving train passengers
- Commuter crowdsourcing form on MAPID Form to report sudden exit blockages

## Why This Sprint

Expands the platform from internal station management to empowering the public commuter, driving user feedback.

## Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| Frontend | Progressive Web App: Next.js 16, React 19, Tailwind CSS, Workbox (offline caching) |
| CDN & Edge | Cloudflare Pages / Vercel Free Tier |

**Tools & Procurement (100% free):** Cloudflare Pages / Vercel Free Tier (unlimited bandwidth, edge CDN + DDoS protection).

## Implementation Procedure

1. Initialize public PWA architecture: mobile-first Next.js 16 + React 19 + Workbox
2. Configure Cloudflare Pages hosting for transitflow.id with global CDN caching
3. Implement geo-location nearest station lookup via HTML5 Geolocation API
4. Build Safe-Path door finder UI (e.g., "Exit Door C is 40% clearer than Exit Door B")
5. Embed lightweight MAPID Form crowdsourcing: 1-tap commuter report form (blockage / broken escalator)
6. Implement offline service worker caching: station floorplans, exit vector maps, safe-path logic (works in tunnels)
7. Add mobile web push notifications: subscribe commuters to delay/surge alerts for their daily station
8. Optimize Web Vitals & LCP: compress vector tiles, enable HTTP/3, target LCP < 1.2s on 4G
9. Perform cross-device accessibility audit: WCAG 2.1, high-contrast mode, screen-reader support
10. Launch public beta with pilot commuter groups at Manggarai and Dukuh Atas hubs
