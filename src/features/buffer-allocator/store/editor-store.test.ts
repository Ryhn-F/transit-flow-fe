import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./editor-store";
import { mockBufferZoneRepository as repo } from "@/infrastructure/repositories/mock-buffer-zone-repository";

const T0 = 1_750_000_000_000;

beforeEach(() => {
  useEditorStore.getState().setMode("view");
  useEditorStore.setState({
    selectedId: null,
    draft: null,
    invalidIds: [],
    isSaving: false,
    slots: [],
    barriers: [],
    zones: [],
    validationMessage: null,
    animation: null,
    exportOpen: false,
  });
  repo.startSession(T0);
});

describe("buffer editor store", () => {
  it("places an ojek zone and clears the draft", () => {
    const s = useEditorStore.getState();
    s.startOjekDraft([106.8275, -6.2085], 35);
    expect(useEditorStore.getState().draft?.type).toBe("ojek");
    useEditorStore
      .getState()
      .placeOjek({ id: "OJZ-1", stationId: "ST-DUK", coordinates: [106.8275, -6.2085], radiusM: 35, slotId: null });
    const after = useEditorStore.getState();
    expect(after.zones).toHaveLength(1);
    expect(after.draft).toBeNull();
  });

  it("builds a stanchion draft vertex by vertex and completes it", () => {
    const s = useEditorStore.getState();
    s.addStanchionVertex([106.827, -6.2086]);
    s.addStanchionVertex([106.8275, -6.2086]);
    const draft = useEditorStore.getState().draft;
    expect(draft?.type === "stanchion" && draft.vertices).toHaveLength(2);

    useEditorStore.getState().completeStanchion({
      id: "stn-1",
      stationId: "ST-DUK",
      name: "Test Line",
      vertices: [106.827, -6.2086].map((v) => v) as unknown as [number, number][],
      expectedVciDelta: -15,
      active: false,
    });
    const after = useEditorStore.getState();
    expect(after.barriers).toHaveLength(1);
    expect(after.validationMessage).toBe("2.0 m lane clearance — OK");
  });

  it("cancelDraft discards vertices", () => {
    useEditorStore.getState().addStanchionVertex([106.827, -6.2086]);
    useEditorStore.getState().cancelDraft();
    expect(useEditorStore.getState().draft).toBeNull();
  });

  it("moves a selected zone and removes it on delete", () => {
    useEditorStore.setState({
      zones: [{ id: "z1", stationId: "ST-DUK", coordinates: [106.827, -6.2086], radiusM: 35, slotId: null }],
    });
    useEditorStore.getState().select("z1");
    useEditorStore.getState().moveSelection(0.001, 0.001);
    expect(useEditorStore.getState().zones[0].coordinates[0]).toBeCloseTo(106.828, 6);

    useEditorStore.getState().removeSelection();
    expect(useEditorStore.getState().zones).toHaveLength(0);
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it("marks and clears invalid geometry", () => {
    useEditorStore.getState().markInvalid(["stn-1"], "blocks lane");
    expect(useEditorStore.getState().invalidIds).toContain("stn-1");
    useEditorStore.getState().clearInvalid();
    expect(useEditorStore.getState().invalidIds).toHaveLength(0);
  });

  it("runs the barrier animation state machine", () => {
    useEditorStore.getState().startAnimation({
      barrierId: "b1",
      state: "ACTIVE",
      vciFrom: 88,
      vciTo: 71,
      throughputFrom: 2340,
      throughputTo: 2740,
    });
    let a = useEditorStore.getState().animation;
    expect(a?.step).toBe(0);
    useEditorStore.getState().setAnimationStep(25);
    a = useEditorStore.getState().animation;
    expect(a?.step).toBe(25);
    useEditorStore.getState().setAnimationStep(50);
    expect(useEditorStore.getState().animation?.done).toBe(true);
  });
});

describe("mock buffer zone repository", () => {
  it("seeds 6 slots, 2 presets and 6 exit contexts", async () => {
    const slots = await repo.listActiveSlots();
    expect(slots.length).toBeGreaterThanOrEqual(5);
    const barriers = await repo.listBarriers();
    expect(barriers).toHaveLength(2);
    const contexts = await repo.listExitContexts();
    expect(contexts).toHaveLength(6);
    const lanes = await repo.listLaneEdges();
    expect(lanes.length).toBeGreaterThanOrEqual(8);
  });

  it("rejects ojek placement far from any station", async () => {
    await expect(
      repo.placeOjekZone({ coords: [120.0, -10.0], radiusM: 35 }),
    ).rejects.toThrow("boundary");
  });

  it("snaps a valid placement to the curb", async () => {
    const zone = await repo.placeOjekZone({ coords: [106.8275, -6.2085], radiusM: 35 });
    expect(zone.id).toMatch(/^OJZ-/);
    expect(zone.coordinates[0]).toBeGreaterThan(106.826);
  });

  it("toggles a barrier and reports the VCI delta pair", async () => {
    const result = await repo.toggleBarrier("gate-a-queue-line", "ACTIVE");
    expect(result.state).toBe("ACTIVE");
    expect(result.vciTo).toBeLessThan(result.vciFrom);
    expect(result.vciTo).toBeGreaterThanOrEqual(0);

    const standby = await repo.toggleBarrier("gate-a-queue-line", "STANDBY");
    expect(standby.vciTo).toBeGreaterThanOrEqual(standby.vciFrom);
  });

  it("exports a dispatch plan with webhook payload", async () => {
    const plan = await repo.exportDispatchPlan();
    expect(plan.plan_id).toMatch(/^BP-/);
    expect(plan.webhook_payload.plan_id).toBe(plan.plan_id);
    expect(plan.payload_bytes).toBeGreaterThan(100);
    expect(plan.webhook_payload.barriers.length).toBeGreaterThanOrEqual(1);
  });
});
