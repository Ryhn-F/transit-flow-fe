export type AlertLevel = "NORMAL" | "WARNING" | "CRITICAL";

export interface VCIMetric {
  channel_id: string;
  timestamp: string;
  pedestrian_flow_rate_ppm: number;
  vehicular_dropoff_surge_vpm: number;
  effective_width_m: number;
  compliance_factor: number;
  vci_score: number;
  alert_level: AlertLevel;
  recommended_action: string;
}
