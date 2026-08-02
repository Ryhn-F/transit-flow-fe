import { NextResponse } from "next/server";
import { seededOjekSlots } from "@/infrastructure/mock/fixtures/buffer-fixtures";

export async function GET() {
  const now = Date.now();
  const slots = seededOjekSlots(now).filter((s) => s.expiresAt > now);
  return NextResponse.json({
    slots: slots.map((s) => ({
      id: s.id,
      coordinates: s.coordinates,
      expires_at: new Date(s.expiresAt).toISOString(),
      status: s.status,
    })),
    plan_id: `BP-${String(now).slice(-6)}`,
    issued_at: new Date(now).toISOString(),
  });
}

export const dynamic = "force-dynamic";
