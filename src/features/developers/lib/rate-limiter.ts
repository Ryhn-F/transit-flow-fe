export interface TokenBucket {
  tokens: number;
  capacity: number;
  refillPerSec: number;
  lastRefill: number;
}

export function createBucket(capacity: number, refillPerSec: number, now = Date.now()): TokenBucket {
  return { tokens: capacity, capacity, refillPerSec, lastRefill: now };
}

export function tryConsume(bucket: TokenBucket, now: number, cost = 1): boolean {
  const elapsed = Math.max(0, now - bucket.lastRefill) / 1_000;
  bucket.tokens = Math.min(bucket.capacity, bucket.tokens + elapsed * bucket.refillPerSec);
  bucket.lastRefill = now;
  if (bucket.tokens < cost) return false;
  bucket.tokens -= cost;
  return true;
}

export function retryAfterSec(bucket: TokenBucket, now: number): number {
  if (bucket.tokens >= 1) return 0;
  const deficit = 1 - bucket.tokens;
  return Math.ceil(deficit / Math.max(0.001, bucket.refillPerSec));
}
