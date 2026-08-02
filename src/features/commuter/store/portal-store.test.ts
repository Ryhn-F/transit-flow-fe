import { describe, it, expect, beforeEach } from "vitest";
import { usePortalStore } from "./portal-store";
import { crowdReportSchema } from "../lib/schemas";

beforeEach(() => {
  usePortalStore.setState({
    tab: "home",
    lang: "id",
    offline: false,
    locationState: "idle",
    resolvedHubId: null,
    distanceKm: null,
    hub: null,
    reports: [],
    notifications: [],
    subscribed: false,
    installDismissed: false,
    reportCounter: 0,
    reportSubmitted: null,
  });
});

describe("portal-store", () => {
  it("submits a report with sequential CR ids", () => {
    const s = usePortalStore.getState();
    const r1 = s.submitReport({ type: "escalator", hubId: "manggarai" });
    const r2 = s.submitReport({ type: "blockage", hubId: "manggarai" });
    expect(r1.id).toBe("CR-0421");
    expect(r2.id).toBe("CR-0422");
    expect(r1.status).toBe("sent");
  });

  it("queues reports while offline and flushes on reconnect", () => {
    usePortalStore.getState().setOffline(true);
    const s = usePortalStore.getState();
    const r = s.submitReport({ type: "flood", hubId: "sudirman" });
    expect(r.status).toBe("queued");

    usePortalStore.getState().setOffline(false);
    usePortalStore.getState().flushQueuedReports();
    expect(usePortalStore.getState().reports[0].status).toBe("sent");
  });

  it("adds notifications and marks them read", () => {
    usePortalStore.getState().addNotification("Surge", "Use Door C");
    expect(usePortalStore.getState().notifications).toHaveLength(1);
    expect(usePortalStore.getState().notifications[0].read).toBe(false);
    usePortalStore.getState().markAllRead();
    expect(usePortalStore.getState().notifications[0].read).toBe(true);
  });

  it("resolves hub and hydrates location state", () => {
    usePortalStore.getState().resolveHub("manggarai", 0.35);
    const s = usePortalStore.getState();
    expect(s.locationState).toBe("resolved");
    expect(s.resolvedHubId).toBe("manggarai");
    expect(s.distanceKm).toBe(0.35);
  });
});

describe("crowd-report-schema", () => {
  it("accepts a valid report", () => {
    expect(crowdReportSchema.safeParse({ type: "escalator", hubId: "manggarai" }).success).toBe(true);
    expect(crowdReportSchema.safeParse({ type: "blockage", hubId: "manggarai", photoUrl: "data:image/png;base64,x" }).success).toBe(true);
  });

  it("rejects invalid types and missing hub", () => {
    expect(crowdReportSchema.safeParse({ type: "dragon", hubId: "manggarai" }).success).toBe(false);
    expect(crowdReportSchema.safeParse({ type: "flood" }).success).toBe(false);
  });
});
