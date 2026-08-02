import type {
  ChannelDelivery,
  VCIAlert,
  VCIMetric,
  VCISnapshot,
} from "@/entities/vci-metric";
import type { VCIRepository } from "./vci-repository";
import {
  VCI_CHANNEL_COORDS,
  VCI_CHANNEL_SEEDS,
  seededAlerts,
  seededDeliveries,
  stationOfChannel,
} from "@/infrastructure/mock/fixtures/vci-fixtures";
import { stationName, channelName } from "@/infrastructure/mock/fixtures/stations";
import {
  buildProfiles,
  jitterAt,
  metricFromScore,
  scoreAt,
  type VciExitProfile,
} from "@/features/vci/lib/vci-drift";
import { vciAlertSchema, channelDeliverySchema, vciMetricSchema, vciSnapshotSchema } from "@/features/vci/schemas/vci-schemas";
import { VCI_CRITICAL_THRESHOLD, VCI_HYSTERESIS_REARM } from "@/features/vci/lib/vci-formula";

const RECALC_SECONDS = 60;
const HISTORY_POINTS = 96;
const HISTORY_STEP_MS = 15 * 60_000;

const DELIVERY_DELAY_MS: Record<string, number> = {
  TELEGRAM: 2_000,
  WHATSAPP: 5_000,
  EMAIL: 12_000,
};

class MockVCIRepository implements VCIRepository {
  private startedAt: number | null = null;
  private seeded = false;
  private now = Date.now();
  private profiles: VciExitProfile[] = [];
  private snapshot: VCISnapshot | null = null;
  private alerts: VCIAlert[] = [];
  private deliveries: ChannelDelivery[] = [];
  private armed = new Map<string, boolean>();
  private pendingTriggers = new Map<string, number>();
  private retrySchedule = new Map<string, { retryAt: number; successAt: number; attempt: number }>();
  private counter = 0;

  private ensureSeeded(now = Date.now()): void {
    if (this.seeded) return;
    this.seeded = true;
    this.startedAt = now;
    this.now = now;
    this.profiles = buildProfiles(
      VCI_CHANNEL_SEEDS.map((s) => ({
        channel_id: s.channel_id,
        base: s.base,
        amplitude: s.amplitude,
        periodSec: s.periodSec,
        ramp: s.ramp,
      })),
    );
    this.alerts = seededAlerts(now).map((a) => vciAlertSchema.parse(a));
    this.deliveries = seededDeliveries(now).map((d) => channelDeliverySchema.parse(d));

    for (const delivery of this.deliveries) {
      if (delivery.status === "FAILED" && delivery.attempt === 2) {
        this.retrySchedule.set(delivery.delivery_id, {
          retryAt: now + 20_000,
          successAt: now + 28_000,
          attempt: delivery.attempt + 1,
        });
      }
    }

    for (const seed of VCI_CHANNEL_SEEDS) {
      const profile = this.profiles.find((p) => p.channel_id === seed.channel_id);
      const bootScore = profile ? scoreAt(profile, 0, jitterAt(profile, 0)) : 0;
      this.armed.set(seed.channel_id, bootScore < VCI_HYSTERESIS_REARM);
    }
    this.recalc(now);
  }

  private recalc(now: number): void {
    if (this.startedAt == null) return;
    const elapsed = Math.floor((now - this.startedAt) / 1_000);
    const recalcIndex = Math.floor(elapsed / RECALC_SECONDS);

    const metrics = VCI_CHANNEL_SEEDS.map((seed) => {
      const profile = this.profiles.find((p) => p.channel_id === seed.channel_id)!;
      const vciScore = scoreAt(profile, elapsed, jitterAt(profile, recalcIndex));
      return vciMetricSchema.parse(
        metricFromScore({
          channel_id: seed.channel_id,
          pedestrian_flow_rate_ppm: seed.pedestrian_flow_rate_ppm,
          vehicular_dropoff_surge_vpm: seed.vehicular_dropoff_surge_vpm,
          effective_width_m: seed.effective_width_m,
          compliance_factor: seed.compliance_factor,
          vci_score: vciScore,
          timestamp: new Date(now).toISOString(),
        }),
      );
    });

    this.snapshot = vciSnapshotSchema.parse({
      generated_at: new Date(now).toISOString(),
      metrics,
    });

    for (const metric of metrics) {
      if (metric.vci_score >= VCI_CRITICAL_THRESHOLD) {
        const hasOpen = this.alerts.some(
          (a) => a.channel_id === metric.channel_id && a.status === "OPEN",
        );
        if (this.armed.get(metric.channel_id) && !hasOpen) {
          this.triggerAlert(metric, now);
          this.armed.set(metric.channel_id, false);
        }
      } else if (metric.vci_score < VCI_HYSTERESIS_REARM) {
        this.armed.set(metric.channel_id, true);
      }
    }
  }

  private triggerAlert(metric: VCIMetric, now: number): void {
    this.counter += 1;
    const alert: VCIAlert = vciAlertSchema.parse({
      alert_id: `VCI-AL-${1000 + this.counter}`,
      channel_id: metric.channel_id,
      station_name: stationName(stationOfChannel(metric.channel_id)),
      channel_name: channelName(metric.channel_id),
      vci_score: metric.vci_score,
      raised_at: new Date(now).toISOString(),
      status: "OPEN",
      sla_deadline: null,
      acknowledged_at: null,
      acknowledged_note: null,
    });
    this.alerts.unshift(alert);

    for (const channel of ["TELEGRAM", "WHATSAPP", "EMAIL"] as const) {
      this.counter += 1;
      const delivery: ChannelDelivery = channelDeliverySchema.parse({
        delivery_id: `DLV-${String(100 + this.counter).padStart(3, "0")}`,
        alert_id: alert.alert_id,
        channel,
        status: "QUEUED",
        attempt: 1,
        queued_at: new Date(now).toISOString(),
        delivered_at: null,
      });
      this.deliveries.unshift(delivery);
      this.pendingTriggers.set(
        delivery.delivery_id,
        now + DELIVERY_DELAY_MS[channel],
      );
    }
  }

  private advanceDeliveries(now: number): void {
    for (const delivery of this.deliveries) {
      if (delivery.status === "QUEUED") {
        const dueAt = this.pendingTriggers.get(delivery.delivery_id);
        if (dueAt != null && now >= dueAt) {
          delivery.status = "DELIVERED";
          delivery.delivered_at = new Date(now).toISOString();
        }
      } else if (delivery.status === "FAILED") {
        const schedule = this.retrySchedule.get(delivery.delivery_id);
        if (schedule && now >= schedule.retryAt) {
          delivery.status = "RETRYING";
          delivery.attempt = schedule.attempt;
        }
      } else if (delivery.status === "RETRYING") {
        const schedule = this.retrySchedule.get(delivery.delivery_id);
        if (schedule && now >= schedule.successAt) {
          delivery.status = "DELIVERED";
          delivery.delivered_at = new Date(now).toISOString();
          this.retrySchedule.delete(delivery.delivery_id);
        }
      }
    }
  }

  private advanceSla(now: number): void {
    for (const alert of this.alerts) {
      if (
        (alert.status === "ACKNOWLEDGED" || alert.status === "OPEN") &&
        alert.sla_deadline &&
        Date.parse(alert.sla_deadline) <= now
      ) {
        alert.status = "ESCALATED";
      }
    }
  }

  tick(now: number): void {
    this.ensureSeeded(now);
    if (this.startedAt == null) return;
    this.now = now;
    const elapsedMs = now - this.startedAt;
    const recalcIndex = Math.floor(elapsedMs / (RECALC_SECONDS * 1_000));
    const lastIndex = Math.floor((elapsedMs - 1_000) / (RECALC_SECONDS * 1_000));
    if (recalcIndex > lastIndex) {
      this.recalc(now);
    }
    this.advanceDeliveries(now);
    this.advanceSla(now);
  }

  getLiveSnapshot(): Promise<VCISnapshot> {
    this.ensureSeeded();
    return Promise.resolve(this.snapshot!);
  }

  getHistory(channelId: string, windowHours = 24): Promise<VCIMetric[]> {
    this.ensureSeeded();
    const seed = VCI_CHANNEL_SEEDS.find((s) => s.channel_id === channelId);
    const profile = this.profiles.find((p) => p.channel_id === channelId);
    if (!seed || !profile || this.startedAt == null) return Promise.resolve([]);

    const now = this.now;
    const points = Math.min(HISTORY_POINTS, Math.floor((windowHours * 3_600_000) / HISTORY_STEP_MS));
    const history: VCIMetric[] = [];
    for (let i = points - 1; i >= 0; i--) {
      const ts = now - i * HISTORY_STEP_MS;
      const elapsed = Math.floor((ts - this.startedAt) / 1_000);
      const recalcIndex = Math.floor(elapsed / RECALC_SECONDS);
      const score = scoreAt(profile, elapsed, jitterAt(profile, recalcIndex));
      history.push(
        vciMetricSchema.parse(
          metricFromScore({
            channel_id: seed.channel_id,
            pedestrian_flow_rate_ppm: seed.pedestrian_flow_rate_ppm,
            vehicular_dropoff_surge_vpm: seed.vehicular_dropoff_surge_vpm,
            effective_width_m: seed.effective_width_m,
            compliance_factor: seed.compliance_factor,
            vci_score: score,
            timestamp: new Date(ts).toISOString(),
          }),
        ),
      );
    }
    return Promise.resolve(history);
  }

  getAlerts(limit = 20): Promise<VCIAlert[]> {
    this.ensureSeeded();
    return Promise.resolve(this.alerts.slice(0, limit));
  }

  getDeliveries(alertId?: string): Promise<ChannelDelivery[]> {
    this.ensureSeeded();
    const list = alertId
      ? this.deliveries.filter((d) => d.alert_id === alertId)
      : this.deliveries;
    return Promise.resolve([...list].sort((a, b) => b.queued_at.localeCompare(a.queued_at)));
  }

  async acknowledgeAlert(
    alertId: string,
    note?: string,
    slaMinutes = 15,
  ): Promise<VCIAlert> {
    this.ensureSeeded();
    const alert = this.alerts.find((a) => a.alert_id === alertId);
    if (!alert) throw new Error("Alert not found");
    const now = this.now;
    alert.status = "ACKNOWLEDGED";
    alert.acknowledged_at = new Date(now).toISOString();
    alert.acknowledged_note = note ?? null;
    alert.sla_deadline = new Date(now + slaMinutes * 60_000).toISOString();
    return vciAlertSchema.parse(alert);
  }

  startSession(now: number): void {
    this.seeded = false;
    this.alerts = [];
    this.deliveries = [];
    this.snapshot = null;
    this.armed.clear();
    this.pendingTriggers.clear();
    this.retrySchedule.clear();
    this.counter = 0;
    this.ensureSeeded(now);
  }

  stopSession(): void {
    this.startedAt = null;
  }

  getChannelCoords(): Record<string, [number, number]> {
    return VCI_CHANNEL_COORDS;
  }
}

export const mockVCIRepository = new MockVCIRepository();
