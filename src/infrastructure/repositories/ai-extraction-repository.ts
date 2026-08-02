import type {
  AiExtraction,
  AiExtractionFilters,
  AiAttributeKey,
} from "@/entities/ai-extraction";
import { httpClient } from "@/infrastructure/api/http-client";

export interface AiExtractionRepository {
  list(filters: AiExtractionFilters): Promise<AiExtraction[]>;
  getById(id: string): Promise<AiExtraction | null>;
  review(
    id: string,
    decision: "APPROVED" | "REJECTED",
    reviewer_notes?: string,
  ): Promise<AiExtraction>;
  updateAttribute(
    id: string,
    key: AiAttributeKey,
    value: number,
  ): Promise<AiExtraction>;
  attach(id: string, channelId: string): Promise<AiExtraction>;
}

export const aiExtractionRepository: AiExtractionRepository = {
  async list(filters: AiExtractionFilters): Promise<AiExtraction[]> {
    const { data } = await httpClient.get("/ai-extractions", {
      params: {
        status: filters.status?.join(","),
        stationId: filters.stationId,
        q: filters.q,
      },
    });
    return data;
  },

  async getById(id: string): Promise<AiExtraction | null> {
    const { data } = await httpClient.get(`/ai-extractions/${id}`);
    return data;
  },

  async review(
    id: string,
    decision: "APPROVED" | "REJECTED",
    reviewer_notes?: string,
  ): Promise<AiExtraction> {
    const { data } = await httpClient.post(`/ai-extractions/${id}/review`, {
      decision,
      reviewer_notes,
    });
    return data;
  },

  async updateAttribute(
    id: string,
    key: AiAttributeKey,
    value: number,
  ): Promise<AiExtraction> {
    const { data } = await httpClient.patch(`/ai-extractions/${id}/attributes`, {
      key,
      value,
    });
    return data;
  },

  async attach(id: string, channelId: string): Promise<AiExtraction> {
    const { data } = await httpClient.post(`/ai-extractions/${id}/attach`, {
      channelId,
    });
    return data;
  },
};
