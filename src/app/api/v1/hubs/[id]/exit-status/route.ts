import { NextResponse } from "next/server";
import { createBucket, tryConsume } from "@/features/developers/lib/rate-limiter";
import { exitStatusGeoJson } from "@/features/developers/fixtures/dev-fixtures";

const bucket = createBucket(10, 10);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const now = Date.now();
  if (!tryConsume(bucket, now)) {
    return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 });
  }

  const exitId = id === "dukuh-atas" ? "DUK-GB" : id === "manggarai" ? "MGR-02" : "SUD-E";
  await new Promise((r) => setTimeout(r, 28 + (now % 24)));
  return NextResponse.json(exitStatusGeoJson(exitId));
}

export const dynamic = "force-dynamic";
