import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAiExtractionRepository } from "@/infrastructure/mock/provider-registry";
import { stationName, channelName } from "@/infrastructure/mock/fixtures/stations";
import { useStationUIStore } from "@/features/stations/store/station-ui-store";
import { useRouter } from "next/navigation";
import { stationCoords } from "@/infrastructure/mock/fixtures/stations";

export function useAttachExtraction() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, channelId }: { id: string; channelId: string }) =>
      getAiExtractionRepository().attach(id, channelId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ai-extractions"] });
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      toast.success(
        `Attached to ${stationName(data.station_id)} — ${channelName(data.exit_channel_id)}`,
      );
      const coords = stationCoords(data.station_id);
      if (coords) {
        useStationUIStore.getState().flyToStation({
          lng: coords[0],
          lat: coords[1],
          stationId: data.station_id,
        });
        router.push("/dashboard");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Attachment failed — station no longer available");
    },
  });
}
