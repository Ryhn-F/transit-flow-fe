export type AiExtractionStatus =
  | "QUEUED"
  | "EXTRACTING"
  | "REVIEW"
  | "APPROVED"
  | "REJECTED";

export type AiExtractionSource = "PHOTO" | "AUDIO" | "MULTIMODAL";

export type BoundingBoxClass = "pedestrian" | "vendor" | "angkot";

export interface BoundingBox {
  class: BoundingBoxClass;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type AiAttributeKey =
  | "pedestrian_count"
  | "angkot_queue_length"
  | "vendor_blockage_pct";

export interface AiAudioNote {
  transcript_id: string;
  transcript_id_translation: string;
  waveform: number[];
}

export interface AiExtraction {
  id: string;
  survey_id: string;
  station_id: string;
  exit_channel_id: string;
  status: AiExtractionStatus;
  source: AiExtractionSource;
  submitted_at: string;
  review_ready_at: string | null;
  attributes: Record<AiAttributeKey, number>;
  confidence: Record<AiAttributeKey, number>;
  bboxes: BoundingBox[];
  audio: AiAudioNote | null;
  raw_gemini_json: string;
  reviewer_notes: string | null;
  attached_channel_id: string | null;
}

export interface AiExtractionFilters {
  status?: AiExtractionStatus[];
  stationId?: string;
  q?: string;
}

export function attachmentSlaMs(e: AiExtraction): number | null {
  if (!e.review_ready_at) return null;
  return Date.parse(e.review_ready_at) - Date.parse(e.submitted_at);
}
