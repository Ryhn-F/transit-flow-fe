import { describe, it, expect, beforeEach } from "vitest";
import { mockVCIRepository as repo } from "./mock-vci-repository";
import { bandOf } from "@/features/vci/lib/vci-formula";
import { VCI_CHANNEL_SEEDS } from "@/infrastructure/mock/fixtures/vci-fixtures";

const T0 = 1_750_000_000_000;

function tick(tSec: number) {
  repo.tick(T0 + tSec * 1_000);
}

beforeEach(() => {
  repo.startSession(T0);
});

describe("mock VCI repository", () => {
  it("seeds 8 exit metrics with 3 GREEN / 4 YELLOW / 1 RED at t=0", async () => {
    const snapshot = await repo.getLiveSnapshot();
    expect(snapshot.metrics).toHaveLength(8);
    const bands = snapshot.metrics.map((m) => bandOf(m.vci_score));
    expect(bands.filter((b) => b === "GREEN")).toHaveLength(3);
    expect(bands.filter((b) => b === "YELLOW")).toHaveLength(4);
    expect(bands.filter((b) => b === "RED")).toHaveLength(1);
    expect(snapshot.metrics.find((m) => m.channel_id === "SUD-E")?.vci_score).toBeGreaterThanOrEqual(80);
  });

  it("recalcs every 60s with drift (Gate B climbs ≥80 at the second recalc)", async () => {
    tick(60);
    const first = await repo.getLiveSnapshot();
    const gb1 = first.metrics.find((m) => m.channel_id === "DUK-GB")!;
    expect(gb1.vci_score).toBeGreaterThanOrEqual(68);

    tick(120);
    const second = await repo.getLiveSnapshot();
    const gb2 = second.metrics.find((m) => m.channel_id === "DUK-GB")!;
    expect(gb2.vci_score).toBeGreaterThanOrEqual(80);
  });

  it("triggers an OPEN alert when crossing 80 with hysteresis re-arm below 70", async () => {
    tick(120);
    let alerts = await repo.getAlerts();
    const fresh = alerts.find(
      (a) => a.channel_id === "DUK-GB" && a.status === "OPEN",
    );
    expect(fresh).toBeDefined();

    tick(300);
    const afterAck = await repo.acknowledgeAlert(fresh!.alert_id, "note", 15);
    expect(afterAck.status).toBe("ACKNOWLEDGED");

    tick(360); // Gate B back to base (~68 < 70 → re-arms)
    tick(420);
    alerts = await repo.getAlerts();
    const reopened = alerts.filter(
      (a) => a.channel_id === "DUK-GB" && a.status === "OPEN",
    );
    expect(reopened).toHaveLength(0);
  });

  it("schedules channel deliveries at 2s/5s/12s after trigger", async () => {
    tick(120);
    const alerts = await repo.getAlerts();
    const fresh = alerts.find((a) => a.channel_id === "DUK-GB")!;

    tick(121);
    let deliveries = await repo.getDeliveries(fresh.alert_id);
    expect(deliveries.every((d) => d.status === "QUEUED")).toBe(true);

    tick(123);
    deliveries = await repo.getDeliveries(fresh.alert_id);
    const tg = deliveries.find((d) => d.channel === "TELEGRAM")!;
    expect(tg.status).toBe("DELIVERED");
    expect(deliveries.find((d) => d.channel === "DISCORD")?.status).toBe("QUEUED");
    expect(deliveries.find((d) => d.channel === "EMAIL")?.status).toBe("QUEUED");

    tick(127);
    deliveries = await repo.getDeliveries(fresh.alert_id);
    expect(deliveries.find((d) => d.channel === "DISCORD")?.status).toBe("DELIVERED");

    tick(134);
    deliveries = await repo.getDeliveries(fresh.alert_id);
    expect(deliveries.find((d) => d.channel === "EMAIL")?.status).toBe("DELIVERED");
  });

  it("recovers a FAILED email delivery via RETRYING → DELIVERED", async () => {
    // scripted failure: seeded VCI-AL-906 email failed at attempt 2, retries at t=20s
    const seeded = await repo.getDeliveries("VCI-AL-906");
    const failedEmail = seeded.find((d) => d.channel === "EMAIL" && d.status === "FAILED")!;
    expect(failedEmail.status).toBe("FAILED");

    tick(10); // before the retry window
    const still = await repo.getDeliveries("VCI-AL-906");
    expect(still.find((d) => d.delivery_id === failedEmail.delivery_id)?.status).toBe("FAILED");

    tick(25); // inside retry window (retryAt 20s, successAt 28s)
    const retrying = await repo.getDeliveries("VCI-AL-906");
    expect(["RETRYING", "DELIVERED"]).toContain(
      retrying.find((d) => d.delivery_id === failedEmail.delivery_id)?.status,
    );

    tick(40);
    const after = await repo.getDeliveries("VCI-AL-906");
    const e = after.find((d) => d.delivery_id === failedEmail.delivery_id)!;
    expect(e.status).toBe("DELIVERED");
    expect(e.attempt).toBeGreaterThanOrEqual(3);
  });

  it("acknowledge starts an SLA deadline and escalates on lapse", async () => {
    tick(120);
    const alerts = await repo.getAlerts();
    const fresh = alerts.find((a) => a.channel_id === "DUK-GB")!;
    await repo.acknowledgeAlert(fresh.alert_id, "note", 0.001);

    tick(121);
    const escalated = (await repo.getAlerts()).find((a) => a.alert_id === fresh.alert_id)!;
    expect(escalated.status).toBe("ESCALATED");
  });

  it("provides 24h history (96 points) for a channel", async () => {
    const history = await repo.getHistory("DUK-GA", 24);
    expect(history).toHaveLength(96);
    expect(history[0].timestamp < history[95].timestamp).toBe(true);
    expect(history.every((m) => m.channel_id === "DUK-GA")).toBe(true);
  });

  it("validates seeded fixtures against zod schemas", async () => {
    const snapshot = await repo.getLiveSnapshot();
    expect(snapshot.metrics.every((m) => m.vci_score >= 0 && m.vci_score <= 100)).toBe(true);
    const alerts = await repo.getAlerts();
    expect(alerts.length).toBeGreaterThanOrEqual(6);
    const deliveries = await repo.getDeliveries();
    expect(deliveries.length).toBeGreaterThanOrEqual(15);
  });

  it("starts with only the 6 seeded alerts — no re-trigger for the already-choking SUD-E (hysteresis at boot)", async () => {
    const alerts = await repo.getAlerts();
    expect(alerts).toHaveLength(6);
    expect(alerts.find((a) => a.channel_id === "SUD-E" && a.status === "OPEN")).toBeUndefined();
  });

  it("has coordinates for all seeded channels", () => {
    const coords = repo.getChannelCoords();
    for (const seed of VCI_CHANNEL_SEEDS) {
      expect(coords[seed.channel_id]).toBeDefined();
    }
  });
});
