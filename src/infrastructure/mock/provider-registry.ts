import { isDemoMode } from "./demo-mode";
import { stationRepository } from "@/infrastructure/repositories/station-repository";
import { mockStationRepository } from "@/infrastructure/repositories/mock-station-repository";
import { aiExtractionRepository } from "@/infrastructure/repositories/ai-extraction-repository";
import { mockAiExtractionRepository } from "@/infrastructure/repositories/mock-ai-extraction-repository";
import { mockVCIRepository } from "@/infrastructure/repositories/mock-vci-repository";
import { bufferZoneRepository } from "@/infrastructure/repositories/buffer-zone-repository";
import { mockBufferZoneRepository } from "@/infrastructure/repositories/mock-buffer-zone-repository";

export function getStationRepository() {
  return isDemoMode() ? mockStationRepository : stationRepository;
}

export function getAiExtractionRepository() {
  return isDemoMode() ? mockAiExtractionRepository : aiExtractionRepository;
}

export function getVciRepository() {
  return mockVCIRepository;
}

export function getBufferZoneRepository() {
  return isDemoMode() ? mockBufferZoneRepository : bufferZoneRepository;
}
