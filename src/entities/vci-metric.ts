export type AlertLevel = "NORMAL" | "WARNING" | "CRITICAL";

export type VCIBand = "GREEN" | "YELLOW" | "RED";

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

export type VCIAlertStatus = "OPEN" | "ACKNOWLEDGED" | "ESCALATED";

export interface VCIAlert {
  alert_id: string;
  channel_id: string;
  station_name: string;
  channel_name: string;
  vci_score: number;
  raised_at: string;
  status: VCIAlertStatus;
  sla_deadline: string | null;
  acknowledged_at: string | null;
  acknowledged_note: string | null;
}

export type DeliveryChannel = "TELEGRAM" | "DISCORD" | "EMAIL";

export type DeliveryStatus = "QUEUED" | "DELIVERED" | "FAILED" | "RETRYING";

export interface ChannelDelivery {
  delivery_id: string;
  alert_id: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  attempt: number;
  queued_at: string;
  delivered_at: string | null;
}

export interface VCISnapshot {
  generated_at: string;
  metrics: VCIMetric[];
}
