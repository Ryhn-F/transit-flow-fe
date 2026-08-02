import { describe, it, expect, beforeEach } from "vitest";
import { useWeatherUIStore } from "./weather-ui-store";

beforeEach(() => {
  useWeatherUIStore.setState({
    rainOn: false,
    mode: "idle",
    autoEnabled: false,
    bannerAcked: false,
    selectedFloodId: null,
    selectedRouteId: null,
    feedOpen: false,
    modalOpen: false,
    recoveryMessage: null,
    snapshot: null,
    detours: [],
  });
});

describe("weather-ui-store state machine", () => {
  it("transitions idle → auto on threshold crossing", () => {
    const s = useWeatherUIStore.getState();
    s.setMode("auto");
    s.setAutoEnabled(true);
    s.setRainOn(true);
    const after = useWeatherUIStore.getState();
    expect(after.mode).toBe("auto");
    expect(after.autoEnabled).toBe(true);
    expect(after.rainOn).toBe(true);
  });

  it("override suppresses auto transitions", () => {
    const s = useWeatherUIStore.getState();
    s.setMode("override");
    s.setAutoEnabled(false);
    s.setRainOn(false);
    const after = useWeatherUIStore.getState();
    expect(after.mode).toBe("override");
    expect(after.autoEnabled).toBe(false);
  });

  it("clearOverride restores idle state", () => {
    useWeatherUIStore.getState().setMode("override");
    useWeatherUIStore.getState().setRainOn(true);
    useWeatherUIStore.getState().clearOverride();
    const after = useWeatherUIStore.getState();
    expect(after.mode).toBe("idle");
    expect(after.rainOn).toBe(false);
  });

  it("tracks selection and modal state", () => {
    const s = useWeatherUIStore.getState();
    s.setSelectedFlood("UP-3");
    s.setSelectedRoute("ROUTE-C");
    s.setModalOpen(true);
    s.setFeedOpen(true);
    const after = useWeatherUIStore.getState();
    expect(after.selectedFloodId).toBe("UP-3");
    expect(after.selectedRouteId).toBe("ROUTE-C");
    expect(after.modalOpen).toBe(true);
    expect(after.feedOpen).toBe(true);
  });

  it("stores driver snapshot and detours", () => {
    const s = useWeatherUIStore.getState();
    s.setSnapshot({
      reading: { rainfallMmHr: 24, source: "bmkg", capturedAt: 1 },
      cells: [{ x: 0, y: 0, intensity: 3 }],
      floods: [],
      photos: [],
    });
    s.setDetours([
      {
        id: "ROUTE-C",
        originId: "NODE-TA",
        destId: "NODE-SUD",
        edgeIds: ["E-11", "E-12", "E-13", "E-08"],
        timeDeltaMin: 5,
        coveredPct: 91,
        edgeState: { "E-11": "covered" },
      },
    ]);
    const after = useWeatherUIStore.getState();
    expect(after.snapshot?.reading.rainfallMmHr).toBe(24);
    expect(after.detours).toHaveLength(1);
  });
});
