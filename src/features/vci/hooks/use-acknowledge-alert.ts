import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getVciRepository } from "@/infrastructure/mock/provider-registry";
import { useVCILiveStore } from "../store/vci-live-store";
import { useVCIUIStore } from "../store/vci-ui-store";

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  const applyAck = useVCILiveStore((s) => s.applyAck);
  const markAcked = useVCIUIStore((s) => s.markAcked);

  return useMutation({
    mutationFn: ({
      alertId,
      note,
    }: {
      alertId: string;
      note?: string;
    }) => getVciRepository().acknowledgeAlert(alertId, note),
    onSuccess: (alert) => {
      applyAck(alert);
      markAcked(alert.alert_id);
      queryClient.invalidateQueries({ queryKey: ["vci", "alerts"] });
      toast.success(
        "Alert acknowledged — dispatch handoff sent to Command Center (Sprint 7)",
        { duration: 3500 },
      );
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to acknowledge alert");
    },
  });
}
