import { z } from "zod";
import type { AiAttributeKey } from "@/entities/ai-extraction";

const countSchema = z
  .number()
  .int("Value must be a whole number")
  .min(0, "Value must be between 0 and 500")
  .max(500, "Value must be between 0 and 500");

const percentageSchema = z
  .number()
  .min(0, "Value must be between 0 and 100")
  .max(100, "Value must be between 0 and 100");

const schemas: Record<AiAttributeKey, typeof countSchema | typeof percentageSchema> = {
  pedestrian_count: countSchema,
  angkot_queue_length: countSchema,
  vendor_blockage_pct: percentageSchema,
};

export function attributeValueSchema(key: AiAttributeKey) {
  return z.object({ value: schemas[key] }).strict();
}

export type AttributeValueInput = z.infer<ReturnType<typeof attributeValueSchema>>;

export function validateAttributeValue(
  key: AiAttributeKey,
  value: number,
): z.SafeParseReturnType<{ value: number }, { value: number }> {
  return attributeValueSchema(key).safeParse({ value });
}
