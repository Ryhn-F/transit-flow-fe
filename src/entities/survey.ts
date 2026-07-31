export type ObservationType =
  | "PEDESTRIAN_FLOW"
  | "OBSTRUCTION"
  | "ILLEGAL_PARKING"
  | "STREET_VENDOR";

export type CongestionLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SurveySubmission {
  survey_id: string;
  station_id: string;
  channel_id: string;
  timestamp: string;
  surveyor_name: string;
  coordinates: { lat: number; lng: number };
  observation_type: ObservationType;
  congestion_level: CongestionLevel;
  obstruction_impact_percent: number;
  obstruction_polygon?: GeoJSON.Polygon | null;
  raw_data: {
    photo_urls: string[];
    audio_note_url?: string;
    audio_transcript?: string;
    manual_notes?: string;
  };
  ai_extraction_summary?: string;
}
