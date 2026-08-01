# Mock UI PRD — Sprint 10: Retail Kiosk Engine

**Sprint reference:** `docs/sprints/sprint-10-retail-kiosk-engine.md`

## Purpose

Demonstrate the non-farebox monetization engine: placing, resizing, and scoring virtual
retail kiosks in "Zero-Choke Zones", estimating revenue from foot-traffic and SES overlays,
and generating a leasing proposal PDF — all with spatial safety constraints enforced.

## Demo Surfaces

### 1. Kiosk Zoning Studio (`/kiosks` — new route)
- Map canvas with a **Zero-Choke Zone** layer: green zones (high traffic, low VCI) where
  kiosks are legal, with `2.5m clear walkway` corridors visualized
- **Kiosk placement tool:** drag-and-drop 3×3m kiosk footprints (resizable via handle);
  invalid placements (inside choke corridors / blocking the walkway) snap back with a
  constraint violation toast
- SES overlay toggle: neighborhood socioeconomic tints (from fixture SES bands) + POI icons
  (warungs, minimarkets, ATMs) around the hub

### 2. Revenue Estimator
- Per-kiosk card: foot-traffic visibility score (0–100), projected monthly revenue range
  (Rp), rent-per-m² benchmark vs local SES band, payback months
- Score factors breakdown: traffic (Sprint 3 VCI inversed), SES, POI density, corridor
  clearance

### 3. Leasing Proposal Export
- "Generate Proposal" → React PDF-style preview modal: site map with kiosk footprints,
  traffic heatmap thumbnail, revenue table, terms block — downloadable as a real PDF
  (client-side fixture render; Puppeteer service is mocked)

### 4. Vendor Permit Management
- Registered vendor list (informal vendors) with digital spatial permits: permit polygon,
  validity, compliance status (COMPLIANT / VIOLATION if footprint drifts into a choke zone)
- "Issue Permit" flow on an approved kiosk placement

## Mock Data

- 12 potential kiosk slots (scores precomputed), 5 placed kiosks, 2 in violation
- 8 vendors with permit geometries; SES bands for 3 neighborhoods; 40 POIs
- Revenue benchmarks per SES band (deterministic fixture math)

## Liveness Simulation

- Foot-traffic visibility scores drift with the VCI live driver (Sprint 3)
- One vendor's footprint drifts into a choke corridor mid-demo → VIOLATION badge + alert

## Interactions

- Place/resize kiosks with constraint enforcement, SES/POI toggles, revenue card selection
- Generate proposal PDF, issue permit, violation badge acknowledgment

## Demo Script

1. Open `/kiosks` — Zero-Choke zones + corridors visible; SES overlay on
2. Drag a kiosk into the corridor → snaps back + constraint toast
3. Place a valid kiosk near high traffic → revenue estimator: Rp 42–58M/mo, 9-month payback
4. Vendor footprint drifts → VIOLATION; issue permit on the new kiosk
5. Generate the leasing proposal PDF and open the preview

**Acceptance:** placement constraints, scoring, PDF export, and permits are fully
fixture-driven; demo badge visible.

## Dependencies

- Mock repository: `kiosk-repository`, `vendor-permit-repository`
- Live driver: `traffic_score_tick`, `vendor_geo_drift`
- Shared fixture: VCI (Sprint 3), POIs, SES bands
- Shared components: map canvas, PDF preview modal
