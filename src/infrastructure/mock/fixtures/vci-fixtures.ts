import type {
  VCIAlert,
  ChannelDelivery,
} from "@/entities/vci-metric";
import { stationName, channelName } from "./stations";

export const VCI_CHANNEL_COORDS: Record<string, [number, number]> = {
  "DUK-GA": [106.827, -6.209],
  "DUK-GB": [106.8276, -6.2086],
  "DUK-GC": [106.8268, -6.2084],
  "MGR-01": [106.8498, -6.2095],
  "MGR-02": [106.8494, -6.21],
  "MGR-03": [106.8499, -6.2093],
  "SUD-E": [106.823, -6.2025],
  "SUD-W": [106.8225, -6.202],
};

export interface VciChannelSeed {
  channel_id: string;
  pedestrian_flow_rate_ppm: number;
  vehicular_dropoff_surge_vpm: number;
  effective_width_m: number;
  compliance_factor: number;
  base: number;
  amplitude?: number;
  periodSec?: number;
  ramp?: { start: number; peak: number; hold: number; decay: number };
}

export const VCI_CHANNEL_SEEDS: VciChannelSeed[] = [
  {
    channel_id: "DUK-GA",
    pedestrian_flow_rate_ppm: 79,
    vehicular_dropoff_surge_vpm: 34,
    effective_width_m: 3.2,
    compliance_factor: 0.8,
    base: 44,
  },
  {
    channel_id: "DUK-GB",
    pedestrian_flow_rate_ppm: 65,
    vehicular_dropoff_surge_vpm: 28,
    effective_width_m: 2.1,
    compliance_factor: 0.65,
    base: 68,
    amplitude: 17,
    ramp: { start: 30, peak: 120, hold: 180, decay: 60 },
  },
  {
    channel_id: "DUK-GC",
    pedestrian_flow_rate_ppm: 93,
    vehicular_dropoff_surge_vpm: 40,
    effective_width_m: 4.1,
    compliance_factor: 0.9,
    base: 36,
  },
  {
    channel_id: "MGR-01",
    pedestrian_flow_rate_ppm: 157,
    vehicular_dropoff_surge_vpm: 67,
    effective_width_m: 4.8,
    compliance_factor: 0.85,
    base: 55,
  },
  {
    channel_id: "MGR-02",
    pedestrian_flow_rate_ppm: 56,
    vehicular_dropoff_surge_vpm: 24,
    effective_width_m: 1.8,
    compliance_factor: 0.6,
    base: 74,
  },
  {
    channel_id: "MGR-03",
    pedestrian_flow_rate_ppm: 85,
    vehicular_dropoff_surge_vpm: 36,
    effective_width_m: 2.6,
    compliance_factor: 0.75,
    base: 62,
  },
  {
    channel_id: "SUD-E",
    pedestrian_flow_rate_ppm: 101,
    vehicular_dropoff_surge_vpm: 43,
    effective_width_m: 2.4,
    compliance_factor: 0.7,
    base: 86,
  },
  {
    channel_id: "SUD-W",
    pedestrian_flow_rate_ppm: 99,
    vehicular_dropoff_surge_vpm: 42,
    effective_width_m: 3.6,
    compliance_factor: 0.82,
    base: 48,
  },
];

export function stationOfChannel(channelId: string): string {
  const [stationId] = channelId.split("-");
  const map: Record<string, string> = {
    DUK: "ST-DUK",
    MGR: "ST-MGR",
    SUD: "ST-SUD",
  };
  return map[stationId] ?? "ST-UNKNOWN";
}

export function seededAlerts(now: number): VCIAlert[] {
  const iso = (ms: number) => new Date(ms).toISOString();
  const mk = (
    alertId: string,
    channel_id: string,
    vci_score: number,
    raisedMinAgo: number,
    status: VCIAlert["status"],
    acknowledgedMinAgo?: number,
    note?: string | null,
  ): VCIAlert => ({
    alert_id: alertId,
    channel_id,
    station_name: stationName(stationOfChannel(channel_id)),
    channel_name: channelName(channel_id),
    vci_score,
    raised_at: iso(now - raisedMinAgo * 60_000),
    status,
    sla_deadline: acknowledgedMinAgo != null ? iso(now + 15 * 60_000) : null,
    acknowledged_at: acknowledgedMinAgo != null ? iso(now - acknowledgedMinAgo * 60_000) : null,
    acknowledged_note: note ?? null,
  });

  return [
    mk("VCI-AL-901", "DUK-GB", 83, 96, "ACKNOWLEDGED", 94, "Evening rush spike; warden called"),
    mk("VCI-AL-902", "MGR-02", 81, 80, "ACKNOWLEDGED", 77, null),
    mk("VCI-AL-903", "SUD-E", 88, 55, "ESCALATED", 53, "SLA lapsed — police notified"),
    mk("VCI-AL-904", "MGR-01", 79, 40, "ACKNOWLEDGED", 36, null),
    mk("VCI-AL-905", "DUK-GC", 76, 22, "ACKNOWLEDGED", 18, null),
    mk("VCI-AL-906", "SUD-W", 82, 9, "ACKNOWLEDGED", 7, null),
  ];
}

export function seededDeliveries(now: number): ChannelDelivery[] {
  const iso = (ms: number) => new Date(ms).toISOString();
  const mk = (
    deliveryId: string,
    alert_id: string,
    channel: ChannelDelivery["channel"],
    queuedMinAgo: number,
    status: ChannelDelivery["status"] = "DELIVERED",
    deliveredSecAgo?: number | null,
    attempt = 1,
  ): ChannelDelivery => ({
    delivery_id: deliveryId,
    alert_id,
    channel,
    status,
    attempt,
    queued_at: iso(now - queuedMinAgo * 60_000),
    delivered_at: deliveredSecAgo != null ? iso(now - deliveredSecAgo * 1_000) : null,
  });

  return [
    mk("DLV-001", "VCI-AL-901", "TELEGRAM", 95, "DELIVERED", 5760),
    mk("DLV-002", "VCI-AL-901", "WHATSAPP", 95, "DELIVERED", 5745),
    mk("DLV-003", "VCI-AL-901", "EMAIL", 95, "DELIVERED", 5720),
    mk("DLV-004", "VCI-AL-902", "TELEGRAM", 79, "DELIVERED", 4740),
    mk("DLV-005", "VCI-AL-902", "WHATSAPP", 79, "DELIVERED", 4725),
    mk("DLV-006", "VCI-AL-903", "TELEGRAM", 54, "DELIVERED", 3240),
    mk("DLV-007", "VCI-AL-903", "WHATSAPP", 54, "DELIVERED", 3225),
    mk("DLV-008", "VCI-AL-903", "EMAIL", 54, "DELIVERED", 3228),
    mk("DLV-009", "VCI-AL-904", "TELEGRAM", 39, "DELIVERED", 2340),
    mk("DLV-010", "VCI-AL-904", "WHATSAPP", 39, "DELIVERED", 2325),
    mk("DLV-011", "VCI-AL-905", "TELEGRAM", 21, "DELIVERED", 1260),
    mk("DLV-012", "VCI-AL-906", "TELEGRAM", 8, "DELIVERED", 480),
    mk("DLV-013", "VCI-AL-906", "WHATSAPP", 8, "DELIVERED", 465),
    mk("DLV-014", "VCI-AL-906", "EMAIL", 8, "DELIVERED", 440),
    mk("DLV-015", "VCI-AL-906", "EMAIL", 8, "FAILED", null, 2),
  ];
}
