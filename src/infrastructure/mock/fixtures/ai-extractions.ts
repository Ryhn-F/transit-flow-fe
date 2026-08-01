import type { AiExtraction, BoundingBox } from "@/entities/ai-extraction";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededWaveform(id: string, bars = 48): number[] {
  const rand = mulberry32(
    id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 7),
  );
  return Array.from({ length: bars }, () => 0.15 + rand() * 0.85);
}

function buildGeminiJson(extraction: Omit<AiExtraction, "raw_gemini_json">): string {
  return JSON.stringify(
    {
      model: "gemini-3.6-flash",
      task: "field_photo_parse",
      station: extraction.station_id,
      exit_channel: extraction.exit_channel_id,
      attributes: extraction.attributes,
      confidence: extraction.confidence,
      bboxes: extraction.bboxes,
      transcript: extraction.audio
        ? {
            id: extraction.audio.transcript_id,
            en: extraction.audio.transcript_id_translation,
          }
        : null,
    },
    null,
    2,
  );
}

function seed(
  input: Omit<AiExtraction, "raw_gemini_json">,
): AiExtraction {
  return { ...input, raw_gemini_json: buildGeminiJson(input) };
}

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

const BBOX_PEDESTRIANS: BoundingBox[] = [
  { class: "pedestrian", confidence: 0.93, x: 0.12, y: 0.3, w: 0.22, h: 0.4 },
  { class: "pedestrian", confidence: 0.88, x: 0.45, y: 0.22, w: 0.18, h: 0.5 },
  { class: "pedestrian", confidence: 0.9, x: 0.68, y: 0.35, w: 0.2, h: 0.38 },
  { class: "angkot", confidence: 0.82, x: 0.55, y: 0.6, w: 0.3, h: 0.28 },
];

const BBOX_VENDOR: BoundingBox[] = [
  { class: "vendor", confidence: 0.78, x: 0.15, y: 0.5, w: 0.28, h: 0.35 },
  { class: "pedestrian", confidence: 0.91, x: 0.5, y: 0.2, w: 0.2, h: 0.45 },
];

const BBOX_ANGKOT: BoundingBox[] = [
  { class: "angkot", confidence: 0.84, x: 0.1, y: 0.55, w: 0.35, h: 0.3 },
  { class: "angkot", confidence: 0.79, x: 0.55, y: 0.6, w: 0.32, h: 0.28 },
];

const TRANSCRIPT =
  "Angkot double parking di Gate 2, sepeda motor parkir liar sampai 10 unit, trotoar menyempit.";
const TRANSCRIPT_EN =
  "Angkot double parking at Gate 2; up to 10 illegally parked motorcycles; sidewalk narrowing.";

export const AI_EXTRACTION_SEEDS: AiExtraction[] = [
  seed({
    id: "AI-2026-0141",
    survey_id: "SRV-0091",
    station_id: "ST-DUK",
    exit_channel_id: "DUK-GB",
    status: "APPROVED",
    source: "MULTIMODAL",
    submitted_at: minutesAgo(31),
    review_ready_at: minutesAgo(30.7),
    attributes: { pedestrian_count: 142, angkot_queue_length: 6, vendor_blockage_pct: 34 },
    confidence: { pedestrian_count: 93, angkot_queue_length: 82, vendor_blockage_pct: 78 },
    bboxes: BBOX_PEDESTRIANS,
    audio: {
      transcript_id: TRANSCRIPT,
      transcript_id_translation: TRANSCRIPT_EN,
      waveform: seededWaveform("AI-2026-0141"),
    },
    reviewer_notes: "Approved. Matches field observation.",
    attached_channel_id: "DUK-GB",
  }),
  seed({
    id: "AI-2026-0142",
    survey_id: "SRV-0092",
    station_id: "ST-MGR",
    exit_channel_id: "MGR-02",
    status: "APPROVED",
    source: "PHOTO",
    submitted_at: minutesAgo(24),
    review_ready_at: minutesAgo(23.5),
    attributes: { pedestrian_count: 96, angkot_queue_length: 2, vendor_blockage_pct: 12 },
    confidence: { pedestrian_count: 95, angkot_queue_length: 80, vendor_blockage_pct: 85 },
    bboxes: BBOX_PEDESTRIANS,
    audio: null,
    reviewer_notes: null,
    attached_channel_id: null,
  }),
  seed({
    id: "AI-2026-0143",
    survey_id: "SRV-0093",
    station_id: "ST-SUD",
    exit_channel_id: "SUD-E",
    status: "REJECTED",
    source: "PHOTO",
    submitted_at: minutesAgo(18),
    review_ready_at: minutesAgo(17.4),
    attributes: { pedestrian_count: 61, angkot_queue_length: 0, vendor_blockage_pct: 88 },
    confidence: { pedestrian_count: 90, angkot_queue_length: 41, vendor_blockage_pct: 41 },
    bboxes: BBOX_VENDOR,
    audio: null,
    reviewer_notes: "Rejected: vendor footprint is a false positive (kiosk awning).",
    attached_channel_id: null,
  }),
  seed({
    id: "AI-2026-0144",
    survey_id: "SRV-0094",
    station_id: "ST-DUK",
    exit_channel_id: "DUK-GC",
    status: "REVIEW",
    source: "MULTIMODAL",
    submitted_at: minutesAgo(12),
    review_ready_at: minutesAgo(11.7),
    attributes: { pedestrian_count: 178, angkot_queue_length: 9, vendor_blockage_pct: 41 },
    confidence: { pedestrian_count: 91, angkot_queue_length: 79, vendor_blockage_pct: 76 },
    bboxes: BBOX_PEDESTRIANS,
    audio: {
      transcript_id: TRANSCRIPT,
      transcript_id_translation: TRANSCRIPT_EN,
      waveform: seededWaveform("AI-2026-0144"),
    },
    reviewer_notes: null,
    attached_channel_id: null,
  }),
  seed({
    id: "AI-2026-0145",
    survey_id: "SRV-0095",
    station_id: "ST-MGR",
    exit_channel_id: "MGR-01",
    status: "REVIEW",
    source: "AUDIO",
    submitted_at: minutesAgo(8),
    review_ready_at: minutesAgo(7.5),
    attributes: { pedestrian_count: 84, angkot_queue_length: 5, vendor_blockage_pct: 22 },
    confidence: { pedestrian_count: 74, angkot_queue_length: 81, vendor_blockage_pct: 69 },
    bboxes: BBOX_ANGKOT,
    audio: {
      transcript_id: TRANSCRIPT,
      transcript_id_translation: TRANSCRIPT_EN,
      waveform: seededWaveform("AI-2026-0145"),
    },
    reviewer_notes: null,
    attached_channel_id: null,
  }),
  seed({
    id: "AI-2026-0146",
    survey_id: "SRV-0096",
    station_id: "ST-DUK",
    exit_channel_id: "DUK-GA",
    status: "REVIEW",
    source: "PHOTO",
    submitted_at: minutesAgo(5),
    review_ready_at: minutesAgo(4.6),
    attributes: { pedestrian_count: 203, angkot_queue_length: 4, vendor_blockage_pct: 112 },
    confidence: { pedestrian_count: 92, angkot_queue_length: 77, vendor_blockage_pct: 62 },
    bboxes: BBOX_VENDOR,
    audio: null,
    reviewer_notes: null,
    attached_channel_id: null,
  }),
];

export const AI_EXTRACTION_LIVE_SEEDS: AiExtraction[] = [
  seed({
    id: "AI-2026-0147",
    survey_id: "SRV-0097",
    station_id: "ST-DUK",
    exit_channel_id: "DUK-GB",
    status: "EXTRACTING",
    source: "MULTIMODAL",
    submitted_at: "", // normalized to session start at driver start
    review_ready_at: null,
    attributes: { pedestrian_count: 0, angkot_queue_length: 0, vendor_blockage_pct: 0 },
    confidence: { pedestrian_count: 0, angkot_queue_length: 0, vendor_blockage_pct: 0 },
    bboxes: [],
    audio: {
      transcript_id: TRANSCRIPT,
      transcript_id_translation: TRANSCRIPT_EN,
      waveform: seededWaveform("AI-2026-0147"),
    },
    reviewer_notes: null,
    attached_channel_id: null,
  }),
  seed({
    id: "AI-2026-0148",
    survey_id: "SRV-0098",
    station_id: "ST-MGR",
    exit_channel_id: "MGR-02",
    status: "QUEUED",
    source: "PHOTO",
    submitted_at: "",
    review_ready_at: null,
    attributes: { pedestrian_count: 0, angkot_queue_length: 0, vendor_blockage_pct: 0 },
    confidence: { pedestrian_count: 0, angkot_queue_length: 0, vendor_blockage_pct: 0 },
    bboxes: [],
    audio: null,
    reviewer_notes: null,
    attached_channel_id: null,
  }),
];

export const AI_ARRIVAL_POOL: Array<
  Pick<
    AiExtraction,
    "id" | "station_id" | "exit_channel_id" | "source" | "attributes" | "confidence" | "bboxes" | "audio"
  >
> = [
  {
    id: "AI-2026-0149",
    station_id: "ST-DUK",
    exit_channel_id: "DUK-GC",
    source: "MULTIMODAL",
    attributes: { pedestrian_count: 0, angkot_queue_length: 0, vendor_blockage_pct: 0 },
    confidence: { pedestrian_count: 0, angkot_queue_length: 0, vendor_blockage_pct: 0 },
    bboxes: [],
    audio: null,
  },
  {
    id: "AI-2026-0150",
    station_id: "ST-MGR",
    exit_channel_id: "MGR-01",
    source: "PHOTO",
    attributes: { pedestrian_count: 0, angkot_queue_length: 0, vendor_blockage_pct: 0 },
    confidence: { pedestrian_count: 0, angkot_queue_length: 0, vendor_blockage_pct: 0 },
    bboxes: [],
    audio: null,
  },
];

export function buildArrivalExtraction(
  pool: (typeof AI_ARRIVAL_POOL)[number],
  index: number,
  submittedAt: number,
): AiExtraction {
  return seed({
    id: pool.id,
    survey_id: `SRV-${String(100 + index).padStart(4, "0")}`,
    station_id: pool.station_id,
    exit_channel_id: pool.exit_channel_id,
    status: "QUEUED",
    source: pool.source,
    submitted_at: new Date(submittedAt).toISOString(),
    review_ready_at: null,
    attributes: pool.attributes,
    confidence: pool.confidence,
    bboxes: pool.bboxes,
    audio: pool.audio,
    reviewer_notes: null,
    attached_channel_id: null,
  });
}
