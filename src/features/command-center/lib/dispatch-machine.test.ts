import { describe, it, expect } from "vitest";
import {
  dispatchReducer,
  nearestWardens,
  etaFor,
  slaRemainingSec,
} from "./dispatch-machine";
import { CC_WARDENS, seedIncidents } from "../fixtures/cc-fixtures";
import type { Dispatch, Incident } from "../types";

const NOW = 1_750_000_000_000;

function dispatch(id: string, status: Dispatch["status"]): Dispatch {
  return {
    id,
    incidentId: "INC-901",
    wardenId: "WD-01",
    status,
    dispatchedAt: NOW,
    slaDeadline: NOW + 15 * 60_000,
    slaNote: null,
  };
}

describe("dispatch-machine", () => {
  it("adds a dispatch on DISPATCH", () => {
    const next = dispatchReducer([], { type: "DISPATCH", dispatch: dispatch("DS-1", "EN-ROUTE") });
    expect(next).toHaveLength(1);
    expect(next[0].status).toBe("EN-ROUTE");
  });

  it("advances a warden status", () => {
    const next = dispatchReducer([dispatch("DS-1", "EN-ROUTE")], {
      type: "ADVANCE",
      dispatchId: "DS-1",
      to: "ON-SITE",
    });
    expect(next[0].status).toBe("ON-SITE");
  });

  it("acks with an SLA note", () => {
    const next = dispatchReducer([dispatch("DS-1", "ON-SITE")], {
      type: "ACK",
      dispatchId: "DS-1",
      slaNote: "12 min",
    });
    expect(next[0].slaNote).toBe("12 min");
  });

  it("ranks nearest idle wardens to an incident", () => {
    const incident = seedIncidents(NOW)[0]; // Sudirman Gate E
    const top = nearestWardens(incident, CC_WARDENS, 3);
    expect(top).toHaveLength(3);
    expect(top.every((w) => w.status === "IDLE")).toBe(true);
    // WD-06 (Bayu) is nearest to Sudirman among the fixtures
    expect(top[0].id).toBe("WD-06");
  });

  it("computes positive ETA seconds", () => {
    const incident: Incident = {
      id: "X",
      type: "CHOKE",
      stationId: "ST-SUD",
      stationName: "Sudirman",
      position: [106.823, -6.2025],
      severity: "CRITICAL",
      raisedAt: NOW,
      resolved: false,
    };
    expect(etaFor(CC_WARDENS[0], incident)).toBeGreaterThan(0);
  });

  it("counts down the SLA and clamps at zero", () => {
    const d = dispatch("DS-1", "EN-ROUTE");
    expect(slaRemainingSec(d, NOW + 60_000)).toBe(840);
    expect(slaRemainingSec(d, NOW + 16 * 60_000)).toBe(0);
  });
});
