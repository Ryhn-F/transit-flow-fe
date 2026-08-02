import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBufferZoneRepository } from "@/infrastructure/mock/provider-registry";
import { useEditorStore } from "../store/editor-store";
import { toast } from "sonner";
import { validateClearLane } from "../lib/geometry-validation";
import type { LaneEdge, StanchionLine } from "../types";

export function useBufferZoneData() {
  const slots = useQuery({
    queryKey: ["buffer", "slots"],
    queryFn: () => getBufferZoneRepository().listActiveSlots(),
    staleTime: 1_000,
  });
  const barriers = useQuery({
    queryKey: ["buffer", "barriers"],
    queryFn: () => getBufferZoneRepository().listBarriers(),
    staleTime: 1_000,
  });
  const laneEdges = useQuery({
    queryKey: ["buffer", "lanes"],
    queryFn: () => getBufferZoneRepository().listLaneEdges(),
    staleTime: 60_000,
  });
  return { slots, barriers, laneEdges };
}

export function usePlaceOjekZone() {
  const queryClient = useQueryClient();
  const placeOjek = useEditorStore((s) => s.placeOjek);

  return useMutation({
    mutationFn: (draft: { coords: [number, number]; radiusM: number }) =>
      getBufferZoneRepository().placeOjekZone(draft),
    onSuccess: (zone) => {
      placeOjek(zone);
      queryClient.invalidateQueries({ queryKey: ["buffer"] });
      toast.success("Ojek zone placed — snapped to curb geometry");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Placement failed");
    },
  });
}

export function useSaveStanchion() {
  const queryClient = useQueryClient();
  const completeStanchion = useEditorStore((s) => s.completeStanchion);
  const markInvalid = useEditorStore((s) => s.markInvalid);

  return useMutation({
    mutationFn: (stanchion: StanchionLine) =>
      getBufferZoneRepository().saveStanchion(stanchion),
    onSuccess: (saved: StanchionLine) => {
      const laneEdges =
        queryClient.getQueryData<LaneEdge[]>(["buffer", "lanes"]) ?? [];
      const violation = validateClearLane(saved, laneEdges);
      completeStanchion(saved);
      queryClient.invalidateQueries({ queryKey: ["buffer"] });
      if (violation) {
        markInvalid([saved.id], "Stanchion blocks the 2.0 m clear lane — drag to reposition.");
        toast.error("Stanchion blocks the 2.0 m clear lane — drag to reposition.");
        return;
      }
      toast.success("Stanchion saved — 2.0 m lane clearance OK");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save stanchion");
    },
  });
}

export function useToggleBarrier() {
  const queryClient = useQueryClient();
  const toggleBarrierLocal = useEditorStore((s) => s.toggleBarrierLocal);
  const startAnimation = useEditorStore((s) => s.startAnimation);

  return useMutation({
    mutationFn: ({ id, state }: { id: string; state: "ACTIVE" | "STANDBY" }) =>
      getBufferZoneRepository().toggleBarrier(id, state),
    onSuccess: (result) => {
      toggleBarrierLocal(result);
      if (result.state === "ACTIVE") startAnimation(result);
      queryClient.invalidateQueries({ queryKey: ["buffer"] });
      if (result.state === "ACTIVE") {
        toast.success(`Barrier active — VCI forecast ${result.vciFrom} → ${result.vciTo}`);
      } else {
        toast.info("Barrier reverted to Standby.");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Simulation failed — barrier reverted to Standby");
    },
  });
}

export function useExportPlan() {
  return useMutation({
    mutationFn: () => getBufferZoneRepository().exportDispatchPlan(),
  });
}
