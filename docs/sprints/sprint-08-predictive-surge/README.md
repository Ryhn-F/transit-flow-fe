# Sprint 8 — Predictive Crowd Surge & Event Simulation

**Deliverable:** AI Event & Timetable Scenario Simulator.

## Key Features

- Predicts exit choke risks up to 48 hours ahead based on train schedule changes, concert/stadium events, and holiday commuter surges
- "What-If" scenario builder on GEO MAPID (e.g., "What happens to Exit 3 if Train Line 2 delays by 20 minutes?")

## Why This Sprint

Shifts from real-time reaction (Sprint 3) to predictive forward-looking simulation.

## Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| Time-Series ML | Python, XGBoost / Prophet / LightGBM, Pandas, Scikit-learn |
| Event Data | Web scrapers (Playwright / Puppeteer) + open public event feeds / GTFS-Realtime feeds |

**Tools & Procurement (100% free):** Google Colab / Kaggle free GPU notebooks, GTFS public feeds (KAI Commuter & MRT open data).

## Implementation Procedure

1. Set up time-series ML environment (XGBoost, LightGBM, Prophet, Scikit-learn)
2. Build GTFS transit timetable parser for static + realtime feeds (KAI Commuter, MRT, LRT Jakarta)
3. Scrape public event feeds with Playwright/Puppeteer (concerts, stadium events, holiday schedules)
4. Train 48-hour forward predictive model on historical VCI logs, schedules, event calendars, weather
5. Build "What-If" scenario builder UI on GEO MAPID (e.g., "Train delay + stadium concert ends at 21:00")
6. Set up Google Colab / Kaggle free GPU automated batch retraining pipeline
7. Integrate predictive risk layer into MapLibre: 48-hour forward VCI curves alongside live scores
8. Implement early warning dispatch trigger: 24-hour advance notifications before predicted surges
9. Validate accuracy: compare predicted vs actual VCI at GBK / Senayan MRT during major concerts
10. Deploy simulation engine as FastAPI endpoint integrated into the Sprint 7 Command Center
