import type {
  BarrierToggleResult,
  BufferZoneRepository,
  DispatchPlanExport,
  ExitBufferContext,
  LaneEdge,
  OjekSlot,
  OjekZone,
  StanchionLine,
} from "@/features/buffer-allocator/types";
import { httpClient } from "@/infrastructure/api/http-client";
import { computeVciDelta, snapZoneToCurb } from "@/features/buffer-allocator/lib/geometry-validation";

export const bufferZoneRepository: BufferZoneRepository = {
  async listActiveSlots(): Promise<OjekSlot[]> {
    const { data } = await httpClient.get("/buffer-zones/slots");
    return data;
  },
  async listBarriers(): Promise<StanchionLine[]> {
    const { data } = await httpClient.get("/buffer-zones/barriers");
    return data;
  },
  async listExitContexts(): Promise<ExitBufferContext[]> {
    const { data } = await httpClient.get("/buffer-zones/exit-contexts");
    return data;
  },
  async listLaneEdges(): Promise<LaneEdge[]> {
    const { data } = await httpClient.get("/buffer-zones/lane-edges");
    return data;
  },
  async placeOjekZone(draft): Promise<OjekZone> {
    const { data } = await httpClient.post("/buffer-zones/slots", draft);
    return data;
  },
  async saveStanchion(stanchion): Promise<StanchionLine> {
    const { data } = await httpClient.post("/buffer-zones/barriers", stanchion);
    return data;
  },
  async toggleBarrier(id, state): Promise<BarrierToggleResult> {
    const { data } = await httpClient.post(`/buffer-zones/barriers/${id}/toggle`, { state });
    return data;
  },
  async exportDispatchPlan(): Promise<DispatchPlanExport> {
    const { data } = await httpClient.post("/buffer-zones/export");
    return data;
  },
};

export { computeVciDelta, snapZoneToCurb };
