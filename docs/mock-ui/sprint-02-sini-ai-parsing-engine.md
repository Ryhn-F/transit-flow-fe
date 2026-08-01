# Mock UI PRD — Sprint 2: Sini AI Parsing Engine

**Sprint reference:** `docs/sprints/sprint-02-sini-ai-parsing-engine.md`

## Purpose

Demonstrate the AI ingestion pipeline end-to-end: field photos and audio notes flowing
through extraction (crowd density, angkot queues, vendor footprints, spoken hazards) and
appearing as structured, editable attributes attached to station exit nodes — all within
30 seconds, before any CV/NLP backend exists.

## Demo Surfaces

### 1. AI Ingestion QA Queue (`/ai-ingestion` — new page)
- Inbox list of pending/reviewed/approved extractions, one row per field submission (photo + audio pair)
- Status chips: `QUEUED` → `EXTRACTING` → `REVIEW` → `APPROVED` / `REJECTED`
- Per-item timer showing elapsed processing time (target: <30s in demo)

### 2. Extraction Detail Drawer
- Left: the field photo with **simulated YOLO bounding boxes** (overlaid with CSS/SVG): pedestrians counted, vendor footprint, angkot queue region
- Right: structured attributes — `pedestrian_count`, `angkot_queue_length`, `vendor_blockage_pct` — rendered as editable mono readouts with confidence percentages
- Audio section: simulated transcript of the surveyor's voice note (e.g., "Angkot double parking on Gate 2") with a fake waveform
- Raw Gemini JSON panel (collapsible) showing the extracted JSON that would back the attributes

### 3. Attachment Confirmation
- "Attach to Exit Node" action — attaches the approved extraction to the selected station exit in the shared fixture dataset; the Station Info Card on `/dashboard` reflects the new attributes immediately

## Mock Data

- 6–8 seeded submissions mixing photos/audio/pending states; one arrives mid-demo via the live driver
- 3 stations with `exit_doors` entries (Gate A/B/C) that extractions attach to
- Bounding-box coordinates stored as normalized percentages so they render over any image
- Audio transcripts pre-written in Bahasa Indonesia with English translation

## Liveness Simulation

- A new submission enters the queue every ~45s; its status advances QUEUED → EXTRACTING → REVIEW in ~4s (simulating the sub-30s SLA)
- Confidence values jitter ±2% between renders

## Interactions

- Approve/Reject buttons with Sonner confirmation and queue-count decrement
- Click a bounding box → highlights the corresponding attribute row and vice-versa
- "Attach to Exit Node" triggers a map flyTo on `/dashboard` to the station
- Search/filter queue by station name and status

## Demo Script

1. Land on `/ai-ingestion` — queue shows 5 items, one currently EXTRACTING
2. Open the newest item; watch the timer tick toward <30s and flip to REVIEW
3. Show bounding-box → attribute linking (click boxes, click rows)
4. Approve the extraction; attach to Dukuh Atas Gate B
5. Navigate to `/dashboard`, click the station — Station Info Card now shows crowd count + vendor blockage sourced from the "AI"

**Acceptance:** every interaction above works purely from fixtures; no real CV/NLP calls are made; demo badge visible.

## Dependencies

- Mock repository: `ai-extraction-repository`
- Shared fixture: `survey_submissions` with `photo_urls` + `audio_note_url`
- Live driver event: `ai_extraction_created`
- Shared components: status chip, drawer, image overlay utilities
