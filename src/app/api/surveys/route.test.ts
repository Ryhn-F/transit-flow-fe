import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/infrastructure/repositories/server-survey-repository", () => ({
  serverSurveyRepository: {
    findAll: vi.fn().mockResolvedValue({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { id: "1", station_id: "ST-01", surveyor_name: "John" },
          geometry: { type: "Point", coordinates: [106.8, -6.2] },
        },
      ],
    }),
    create: vi.fn().mockResolvedValue({
      type: "Feature",
      properties: { id: "2", station_id: "ST-01", surveyor_name: "Jane" },
      geometry: { type: "Point", coordinates: [106.8, -6.2] },
    }),
  },
}));

describe("Surveys API Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/surveys", () => {
    it("returns GeoJSON feature collection of survey submissions", async () => {
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.type).toBe("FeatureCollection");
      expect(json.features).toHaveLength(1);
    });
  });

  describe("POST /api/surveys", () => {
    it("validates and creates survey submission", async () => {
      const validPayload = {
        station_id: "ST-01",
        surveyor_name: "Jane",
        exit_door_width_m: 2.5,
        stair_width_m: 3.0,
        sidewalk_width_m: 4.0,
        obstacle_type: "vendor",
        notes: "Food stall blocking path",
      };

      const request = new Request("http://localhost:3000/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPayload),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.status).toBe("success");
      expect(json.data.type).toBe("Feature");
    });

    it("returns 400 validation error on invalid payload", async () => {
      const invalidPayload = {
        station_id: "",
        exit_door_width_m: -1,
      };

      const request = new Request("http://localhost:3000/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.status).toBe("error");
      expect(json.message).toBe("Validation error");
    });
  });
});
