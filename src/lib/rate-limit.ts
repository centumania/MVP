/**
 * Rate Limiting Utility — Edge-runtime compatible
 *
 * Uses Upstash Redis when env vars are present (production).
 * Falls back to an in-memory Map for development / single-instance deployments.
 *
 * NOTE: The in-memory fallback is NOT suitable for multi-instance production
 * deployments. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN on Vercel
 * to enable distributed rate limiting.
 */

// In-memory fallback store (single-instance only)
const inMemory = new Map<string, { count: number; reset: number }>()

function memoryLimit(key: string, limit: number, windowMs: number) {
  const now   = Date.now()
  const entry = inMemory.get(key)

  if (!entry || now > entry.reset) {
    inMemory.set(key, { count: 1, reset: now + windowMs })
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs }
  }

  entry.count++
  inMemory.set(key, entry)
  const remaining = Math.max(0, limit - entry.count)
  return { success: entry.count <= limit, limit, remaining, reset: entry.reset }
}

type WindowStr = `${number} s` | `${number} m` | `${number} h`

export type RateLimitResult = {
  success:   boolean
  limit:     number
  remaining: number
  reset:     number
}

/**
 * Rate-limits a key within a given sliding window.
 *
 * @param key     Unique string identifier (e.g. `exam-submit:${userId}`)
 * @param opts    { limit: number, window: "10 s" | "5 m" | "1 h" }
 */
export async function rateLimit(
  key:  string,
  opts: { limit: number; window: WindowStr },
): Promise<RateLimitResult> {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  // ── Upstash Redis (distributed, production) ────────────────────────
  // Dynamic imports guard against missing packages in dev.
  // Install @upstash/ratelimit and @upstash/redis for production.
  if (url && token) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rlMod: any = await import('@upstash/ratelimit' as string).catch(() => null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const redisMod: any = await import('@upstash/redis' as string).catch(() => null)

      if (rlMod && redisMod) {
        const { Ratelimit } = rlMod
        const { Redis }     = redisMod

        const redis  = new Redis({ url, token })
        const rl     = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(opts.limit, opts.window),
          prefix:  'centumania',
        })

        const result = await rl.limit(key)
        return {
          success:   result.success,
          limit:     result.limit,
          remaining: result.remaining,
          reset:     result.reset,
        }
      }
    } catch (err) {
      console.warn('[rate-limit] Upstash unavailable, falling back to in-memory:', err)
    }
  }

  // ── In-memory fallback (development / single-instance) ───────────
  const windowMap: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000 }
  const [amount, unit] = opts.window.split(' ')
  const windowMs = parseInt(amount, 10) * (windowMap[unit] ?? 60_000)
  return memoryLimit(key, opts.limit, windowMs)
}
