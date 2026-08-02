import { z } from "zod";
import type { AlertLevel, DeliveryChannel } from "@/entities/vci-metric";

export const vciMetricSchema = z.object({
  channel_id: z.string(),
  timestamp: z.string(),
  pedestrian_flow_rate_ppm: z.number().min(0),
  vehicular_dropoff_surge_vpm: z.number().min(0),
  effective_width_m: z.number().min(0),
  compliance_factor: z.number().min(0).max(1),
  vci_score: z.number().min(0).max(100),
  alert_level: z.enum(["NORMAL", "WARNING", "CRITICAL"]),
  recommended_action: z.string(),
});

export const vciAlertSchema = z.object({
  alert_id: z.string(),
  channel_id: z.string(),
  station_name: z.string(),
  channel_name: z.string(),
  vci_score: z.number().min(0).max(100),
  raised_at: z.string(),
  status: z.enum(["OPEN", "ACKNOWLEDGED", "ESCALATED"]),
  sla_deadline: z.string().nullable(),
  acknowledged_at: z.string().nullable(),
  acknowledged_note: z.string().nullable(),
});

export const channelDeliverySchema = z.object({
  delivery_id: z.string(),
  alert_id: z.string(),
  channel: z.enum(["TELEGRAM", "DISCORD", "EMAIL"]),
  status: z.enum(["QUEUED", "DELIVERED", "FAILED", "RETRYING"]),
  attempt: z.number().int().min(1),
  queued_at: z.string(),
  delivered_at: z.string().nullable(),
});

export const vciSnapshotSchema = z.object({
  generated_at: z.string(),
  metrics: z.array(vciMetricSchema),
});

export type VciAlertInput = z.infer<typeof vciAlertSchema>;
export type DeliveryInput = z.infer<typeof channelDeliverySchema>;

export function parseAlertLevel(v: string): AlertLevel {
  return v as AlertLevel;
}

export function parseDeliveryChannel(v: string): DeliveryChannel {
  return v as DeliveryChannel;
}
