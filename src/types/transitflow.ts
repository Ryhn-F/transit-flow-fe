export interface StationNode {
  station_id: string;
  station_name: string;
  operator: string;
  peak_hourly_capacity: number;
  active_exit_count: number;
  status: "OPERATIONAL" | "MAINTENANCE" | "CONGESTED";
}
export interface ExitChannel {
  channel_id: string;
  station_id: string;
  channel_name: string;
  physical_width_meters: number;
  effective_width_meters: number;
  walkway_compliance_factor: number; // α value (0.0 - 1.0)
  max_flow_rate_ppm: number;
}
export interface SurveySubmission {
  survey_id: string;
  station_id: string;
  channel_id: string;
  timestamp: string;
  surveyor_name: string;
  coordinates: { lat: number; lng: number };
  raw_data: {
    photo_url: string;
    audio_note_url: string;
    audio_transcript: string;
    manual_notes: string;
  };
}
export interface SiniAiOutput {
  survey_id: string;
  processed_at: string;
  vision_ai: {
    detected_informal_vendors: number;
    vendor_footprint_sqm: number;
    detected_double_parked_vehicles: number;
    crowd_density_estimate_p_per_sqm: number;
  };
  nlp_audio_ai: {
    hazard_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    auto_tags: string[];
  };
  computed_impact: {
    walkway_compliance_factor_alpha: number;
    width_reduction_meters: number;
  };
}
export interface VCIMetric {
  channel_id: string;
  timestamp: string;
  pedestrian_flow_rate_ppm: number;
  vehicular_dropoff_surge_vpm: number;
  effective_width_m: number;
  compliance_factor: number;
  vci_score: number; // 0 - 100
  alert_level: "NORMAL" | "WARNING" | "CRITICAL";
  recommended_action: string;
}
