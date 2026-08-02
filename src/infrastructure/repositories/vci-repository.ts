import type {
  ChannelDelivery,
  VCIAlert,
  VCIMetric,
  VCISnapshot,
} from "@/entities/vci-metric";

export interface VCIRepository {
  getLiveSnapshot(): Promise<VCISnapshot>;
  getHistory(channelId: string, windowHours?: number): Promise<VCIMetric[]>;
  getAlerts(limit?: number): Promise<VCIAlert[]>;
  getDeliveries(alertId?: string): Promise<ChannelDelivery[]>;
  acknowledgeAlert(alertId: string, note?: string, slaMinutes?: number): Promise<VCIAlert>;
}

export type { VCIMetric };
