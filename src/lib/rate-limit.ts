type Bucket = { tokens: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function pruneBuckets() {
  const now = Date.now();
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

setInterval(pruneBuckets, 60_000).unref?.();

export async function rateLimit(
  key: string,
  maxTokens: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000;
    buckets.set(key, { tokens: maxTokens - 1, resetAt });
    return { allowed: true, remaining: maxTokens - 1 };
  }

  if (existing.tokens <= 0) {
    return { allowed: false, remaining: 0 };
  }

  existing.tokens -= 1;
  return { allowed: true, remaining: existing.tokens };
}

export function rateLimitByUser(
  action: string,
  userId: string,
  maxTokens: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  return rateLimit(`rl:${action}:${userId}`, maxTokens, windowSeconds);
}
