export type StationStatus = "OPERATIONAL" | "MAINTENANCE" | "CONGESTED";

export interface StationNode {
  station_id: string;
  station_name: string;
  operator: string;
  peak_hourly_capacity: number;
  active_exit_count: number;
  status: StationStatus;
}

export interface ExitChannel {
  channel_id: string;
  station_id: string;
  channel_name: string;
  physical_width_meters: number;
  effective_width_meters: number;
  walkway_compliance_factor: number;
  max_flow_rate_ppm: number;
}
