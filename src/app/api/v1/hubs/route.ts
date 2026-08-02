import { NextResponse } from "next/server";
import { createBucket, tryConsume, retryAfterSec } from "@/features/developers/lib/rate-limiter";
import { exitStatusGeoJson, API_ENDPOINTS } from "@/features/developers/fixtures/dev-fixtures";
import { VCI_CHANNEL_SEEDS } from "@/infrastructure/mock/fixtures/vci-fixtures";

const bucket = createBucket(10, 10);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("api_key") ?? "tf_live_xxxxxxxxxxxx";
  const now = Date.now();
  if (!tryConsume(bucket, now)) {
    return NextResponse.json(
      { error: "rate_limit_exceeded", retry_after_sec: retryAfterSec(bucket, now) },
      { status: 429, headers: { "Retry-After": String(retryAfterSec(bucket, now)) } },
    );
  }

  const latency = 28 + ((now % 24));
  await new Promise((r) => setTimeout(r, latency));

  const format = url.searchParams.get("format") ?? "geojson";
  const features = VCI_CHANNEL_SEEDS.map((s) =>
    exitStatusGeoJson(s.channel_id).features[0],
  );

  const payload =
    format === "geojson"
      ? { type: "FeatureCollection", features }
      : { hubs: VCI_CHANNEL_SEEDS.map((s) => ({ id: s.channel_id, vci: s.base })) };

  return NextResponse.json(
    { data: payload, meta: { request_id: `req-${now}`, latency_ms: latency, key } },
    { headers: { "x-request-id": `req-${now}` } },
  );
}

export const dynamic = "force-dynamic";

export { API_ENDPOINTS };
