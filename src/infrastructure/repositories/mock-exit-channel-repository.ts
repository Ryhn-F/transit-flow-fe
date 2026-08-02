import type { ExitChannel } from "@/entities/station";
import { DEMO_EXIT_CHANNELS } from "../mock/fixtures/stations";

export function exitChannelsForStation(stationId: string): ExitChannel[] {
  return DEMO_EXIT_CHANNELS.filter((c) => c.station_id === stationId);
}
