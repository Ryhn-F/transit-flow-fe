# Sprint 2 — MAPID SINI AI Unstructured Data Parsing Engine

**Deliverable:** Automated Field Photo & Audio Note Parser.

## Key Features

- Image AI pipeline: crowd density counts, informal angkot queue numbers, street vendor footprints from field photos
- Voice NLP pipeline: converts surveyor audio notes ("Angkot double parking on Gate 2") into structured hazard attributes
- Auto-attaches AI-extracted metadata to Sprint 1's station spatial nodes

## Why This Sprint

Leverages Sprint 1's spatial registry to start ingesting unstructured data — satisfying MAPID's core technical requirement early.

## Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| AI / Computer Vision | Python (FastAPI), PyTorch / OpenCV, YOLO26, Vision Transformer (ViT) |
| Audio / NLP | Google Gemini 3.6 Flash Free Tier (multimodal vision + structured JSON) + Whisper Local |
| Storage | Supabase Storage / Cloudflare R2 Free Tier |

**Tools & Procurement (100% free):** MAPID SINI AI Platform API / Top 50 Perk, Gemini 3.6 Flash Free Tier (15 RPM / 1M tokens/min), Whisper Local (open source, Rp 0), Cloudflare R2 / Supabase Storage (10 GB free).

## Implementation Procedure

1. Set up Python FastAPI AI microservice for local CV + NLP pipelines
2. Integrate Google Gemini 3.6 Flash API with strict JSON `response_schema` enforcement for multimodal vision analysis
3. Set up Whisper Local pipeline (faster-whisper) for Bahasa Indonesia audio transcription
4. Deploy YOLO26 crowd & obstacle detection on survey photos (pedestrian counts, vendor footprints, angkot queues)
5. Configure Cloudflare R2 / Supabase Storage buckets for survey media uploads
6. Connect MAPID SINI AI webhook pipeline: auto-trigger FastAPI pipeline on raw photo/audio uploads
7. Build structured attribute extractor: `pedestrian_count`, `angkot_queue_length`, `vendor_blockage_pct`
8. Link AI metadata to spatial geometry: merge extracted attributes into PostGIS `exit_doors` records
9. Build AI ingestion QA dashboard: Next.js 16 review UI (photos + YOLO26 boxes + Gemini JSON + manual edit)
10. End-to-end validation: field photo/audio on MAPID Form → rendered spatial hazard metadata in <30 seconds
