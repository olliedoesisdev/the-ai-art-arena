// lib/ratelimit.ts
// Upstash Redis rate limiting configuration
// Two limiters: one tight (votes) and one loose (general API abuse prevention)
//
// SETUP REQUIRED:
// 1. Sign up free at https://upstash.com
// 2. Create a Redis database
// 3. Add to .env.local:
//    UPSTASH_REDIS_REST_URL=your_url
//    UPSTASH_REDIS_REST_TOKEN=your_token

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Lazy-initialised so the module does not crash on import
// if env vars are missing (e.g. during local dev without Upstash)
let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      throw new Error(
        'Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN env vars. ' +
          'Set these up at https://upstash.com before deploying.'
      )
    }
    redis = Redis.fromEnv()
  }
  return redis
}

// ----------------------------------------
// Vote rate limiter: 1 vote per contest per IP per 24 hours
// Key format: vote:{ip}:{contestId}
// ----------------------------------------
export const voteRateLimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(1, '24 h'),
  analytics: true,
  prefix: 'ai_art_arena:vote',
})

// ----------------------------------------
// General API rate limiter: 60 requests per minute per IP
// Protects against scraping / brute-force on any API route
// ----------------------------------------
export const apiRateLimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'ai_art_arena:api',
})

// ----------------------------------------
// Helper: extract the real client IP from Next.js request headers
// Works on Vercel (x-forwarded-for) and local dev (x-real-ip)
// ----------------------------------------
export function getClientIP(
  request: Request | { headers: { get: (key: string) => string | null } }
): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; first entry is the client
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP.trim()

  // Fallback for local dev - Upstash still needs a non-empty string
  return '127.0.0.1'
}

// ----------------------------------------
// Helper: build the per-contest-per-IP rate limit key
// Scoping by contestId means a user can vote once per contest
// rather than once globally across all contests
// ----------------------------------------
export function getVoteRateLimitKey(ip: string, contestId: string): string {
  return `${ip}:${contestId}`
}

// ----------------------------------------
// Helper: format time-until-reset for user-facing error messages
// ----------------------------------------
export function formatResetTime(resetMs: number): string {
  const hoursUntilReset = Math.ceil((resetMs - Date.now()) / (1000 * 60 * 60))
  if (hoursUntilReset <= 1) return '1 hour'
  return `${hoursUntilReset} hours`
}
