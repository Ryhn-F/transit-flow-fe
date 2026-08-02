import { describe, it, expect } from "vitest";
import { historySeries, leadTimes } from "../fixtures/cc-fixtures";
import { useCCStore } from "./cc-store";
import { dispatchReducer } from "../lib/dispatch-machine";

describe("cc analytics fixtures", () => {
  it("generates deterministic 60-day series", () => {
    const a = historySeries(60);
    const b = historySeries(60);
    expect(a).toHaveLength(60);
    expect(a).toEqual(b);
    expect(Math.max(...a)).toBeLessThanOrEqual(100);
    expect(Math.min(...a)).toBeGreaterThanOrEqual(30);
  });

  it("generates lead times within 8-16 minutes", () => {
    const leads = leadTimes(60);
    expect(leads).toHaveLength(60);
    expect(Math.max(...leads)).toBeLessThanOrEqual(16);
    expect(Math.min(...leads)).toBeGreaterThanOrEqual(8);
  });
});

describe("cc-store", () => {
  it("dispatches a warden and records the dispatch", () => {
    const store = useCCStore.getState();
    const warden = store.wardens.find((w) => w.id === "WD-03")!;
    const incident = store.incidents[0];

    store.dispatch(incident.id, warden.id);
    const after = useCCStore.getState();
    expect(after.dispatches.some((d) => d.incidentId === incident.id)).toBe(true);
    expect(after.wardens.find((w) => w.id === "WD-03")?.status).toBe("EN-ROUTE");
    expect(after.ticker[0].text).toContain("Dedi");
  });

  it("switches agency scope", () => {
    useCCStore.getState().setAgency("POLRI");
    expect(useCCStore.getState().agency).toBe("POLRI");
    useCCStore.getState().setAgency("DISHUB");
  });

  it("resolves an incident", () => {
    const id = useCCStore.getState().incidents[0].id;
    useCCStore.getState().resolveIncident(id);
    expect(useCCStore.getState().incidents.find((i) => i.id === id)?.resolved).toBe(true);
  });

  it("reducer is pure", () => {
    const before = useCCStore.getState().dispatches;
    const next = dispatchReducer(before, { type: "DISPATCH", dispatch: {
      id: "DS-X", incidentId: "INC-1", wardenId: "WD-1", status: "EN-ROUTE", dispatchedAt: 0, slaDeadline: 0, slaNote: null,
    } });
    expect(before).not.toBe(next);
  });
});
