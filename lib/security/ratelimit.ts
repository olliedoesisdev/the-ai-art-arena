// lib/security/ratelimit.ts
// Rate limiting implementation using Upstash Redis.
// This prevents abuse by limiting how often users can perform actions.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

// Initialize Redis connection
// This connects to Upstash using environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// ==========================================
// VOTE RATE LIMIT
// ==========================================
// Limit: 1 vote per 24 hours per IP+contest
// This prevents users from voting multiple times on the same contest
export const voteRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '24 h'),
  analytics: true,
  prefix: 'ratelimit:vote',
})

// ==========================================
// API RATE LIMIT
// ==========================================
// Limit: 100 requests per minute per IP
// This prevents API abuse and DDoS attacks
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
})

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Extract client IP address from request
 * Handles various proxy scenarios (Cloudflare, nginx, etc.)
 */
export function getClientIP(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')

  // Use the first available IP from x-forwarded-for (could be a comma-separated list)
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Cloudflare's header
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // nginx's header
  if (realIP) {
    return realIP
  }

  // Fallback to request IP (might be proxy IP in some deployments)
  return request.ip || 'unknown'
}

/**
 * Generate rate limit key for vote actions
 * Combines IP and contest ID so rate limit is per-contest, not global
 */
export function getVoteRateLimitKey(ip: string, contestId: string): string {
  return `${ip}:${contestId}`
}

/**
 * Generate rate limit key for API actions
 * Uses just the IP address for global API rate limiting
 */
export function getApiRateLimitKey(ip: string): string {
  return ip
}
