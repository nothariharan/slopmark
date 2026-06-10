const LIMIT = 10
const WINDOW_MS = 60 * 60 * 1000

type Bucket = { count: number; resetAt: number }

const globalForRateLimit = globalThis as unknown as {
  rateLimitBuckets?: Map<string, Bucket>
}

const buckets =
  globalForRateLimit.rateLimitBuckets ?? new Map<string, Bucket>()
globalForRateLimit.rateLimitBuckets = buckets

export function checkRateLimit(key: string): { ok: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }

  if (bucket.count >= LIMIT) {
    return { ok: false, retryAfterMs: bucket.resetAt - now }
  }

  bucket.count += 1
  return { ok: true }
}
