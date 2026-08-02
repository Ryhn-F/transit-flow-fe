import { isDemoMode } from "./demo-mode";
import { stationRepository } from "@/infrastructure/repositories/station-repository";
import { mockStationRepository } from "@/infrastructure/repositories/mock-station-repository";
import { aiExtractionRepository } from "@/infrastructure/repositories/ai-extraction-repository";
import { mockAiExtractionRepository } from "@/infrastructure/repositories/mock-ai-extraction-repository";
import { mockVCIRepository } from "@/infrastructure/repositories/mock-vci-repository";

export function getStationRepository() {
  return isDemoMode() ? mockStationRepository : stationRepository;
}

export function getAiExtractionRepository() {
  return isDemoMode() ? mockAiExtractionRepository : aiExtractionRepository;
}

export function getVciRepository() {
  return mockVCIRepository;
}
