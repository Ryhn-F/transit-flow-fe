# Sprint 9 — Automated CCTV Camera & IoT Sensor Data Pipeline

**Deliverable:** Automated Real-Time Camera Stream Processing Module.

## Key Features

- Connects existing station CCTV streams directly to SINI AI / Gemini 3.6 Flash vision models (supplementing manual field survey photos)
- Automated IoT foot-traffic counter integration
- Continuous background VCI score updating without human intervention

## Why This Sprint

Automates data ingestion after the manual field survey baseline (Sprints 1–2) is battle-tested.

## Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| Video Streaming | RTSP / WebRTC ingester, OpenCV, YOLO26-Pose / DeepSORT (pedestrian tracking) |
| IoT Protocol | Mosquitto MQTT Broker (open source) / EMQX Serverless Free Tier |

**Tools & Procurement (100% free):** self-hosted Mosquitto / EMQX Free Tier (1,000 concurrent IoT connections), local edge worker + Gemini 3.6 Flash Free Tier for periodic RTSP frame inference.

## Implementation Procedure

1. Deploy Mosquitto MQTT broker / EMQX Free Tier for IoT pedestrian counter streaming
2. Build RTSP / WebRTC video stream ingester (OpenCV / FFmpeg) for station CCTV feeds
3. Implement YOLO26-Pose + DeepSORT tracking pipeline for real-time directional pedestrian counting
4. Integrate periodic CCTV frame sampling: 1 frame per 10 seconds → Gemini 3.6 Flash Free Tier for validation
5. Build IoT foot-traffic counter adapter: MQTT payload parser → standardized VCI flow rate inputs
6. Construct automated pipeline failure fallback: revert to field survey data (Sprint 2) if RTSP disconnects
7. Implement privacy-preserving frame anonymization: real-time Gaussian blur on faces and license plates
8. Build live stream overlay player: WebRTC video with bounding boxes in Station Master dashboard
9. Optimize edge inference resource allocation: zero cloud compute cost while processing 10 streams
10. Run 24-hour continuous ingestion test at Manggarai Station CCTV feeds without human intervention
