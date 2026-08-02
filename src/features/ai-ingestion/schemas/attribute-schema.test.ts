import { describe, it, expect } from "vitest";
import { attributeValueSchema } from "./attribute-schema";

describe("attribute-schema", () => {
  it("accepts valid counts and percentages", () => {
    expect(attributeValueSchema("pedestrian_count").safeParse({ value: 0 }).success).toBe(true);
    expect(attributeValueSchema("pedestrian_count").safeParse({ value: 500 }).success).toBe(true);
    expect(attributeValueSchema("vendor_blockage_pct").safeParse({ value: 78 }).success).toBe(true);
    expect(attributeValueSchema("vendor_blockage_pct").safeParse({ value: 100 }).success).toBe(true);
  });

  it("rejects out-of-range percentages (112)", () => {
    const result = attributeValueSchema("vendor_blockage_pct").safeParse({ value: 112 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("between 0 and 100");
    }
  });

  it("rejects negative and fractional values", () => {
    expect(attributeValueSchema("pedestrian_count").safeParse({ value: -1 }).success).toBe(false);
    expect(attributeValueSchema("pedestrian_count").safeParse({ value: 1.5 }).success).toBe(false);
    expect(attributeValueSchema("pedestrian_count").safeParse({ value: 501 }).success).toBe(false);
  });

  it("rejects non-number payloads and unknown keys", () => {
    expect(attributeValueSchema("pedestrian_count").safeParse({ value: "abc" }).success).toBe(false);
    expect(attributeValueSchema("pedestrian_count").safeParse({ value: 5, extra: 1 }).success).toBe(false);
  });
});
