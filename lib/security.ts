// lib/security.ts
// Security utilities used across API routes:
//   - IP hashing (privacy-preserving vote deduplication)
//   - Safe error responses (never leak stack traces to clients)

import crypto from 'crypto'
import { NextResponse } from 'next/server'

// ----------------------------------------
// IP Hashing
// We never store raw IPs - only a one-way hash.
// The salt prevents rainbow-table attacks against the hash.
// Truncated to 32 chars keeps the column size reasonable.
// ----------------------------------------
export function hashIP(ip: string): string {
  const salt =
    process.env.IP_HASH_SALT ||
    'change-this-default-salt-before-production'

  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .slice(0, 32)
}

// ----------------------------------------
// Safe Error Response
// In production: return a generic message so stack traces never reach clients.
// In development: return the real error message so you can debug easily.
// Always log the full error server-side regardless of environment.
// ----------------------------------------
export function safeErrorResponse(
  error: unknown,
  status: number = 500,
  fallbackMessage: string = 'An unexpected error occurred. Please try again.'
): NextResponse {
  const isDev = process.env.NODE_ENV === 'development'

  // Always log the full error server-side
  console.error('[API Error]', error)

  const message =
    isDev && error instanceof Error ? error.message : fallbackMessage

  return NextResponse.json({ error: message }, { status })
}

// ----------------------------------------
// Standard error map for vote API responses
// Keeps error handling DRY across the route
// ----------------------------------------
export const VOTE_ERRORS: Record<
  string,
  { message: string; status: number }
> = {
  CONTEST_NOT_FOUND: {
    message: 'Contest not found.',
    status: 404,
  },
  CONTEST_NOT_ACTIVE: {
    message: 'This contest is not currently accepting votes.',
    status: 400,
  },
  CONTEST_ENDED: {
    message: 'This contest has ended.',
    status: 400,
  },
  ARTWORK_NOT_FOUND: {
    message: 'Artwork not found.',
    status: 404,
  },
  ARTWORK_WRONG_CONTEST: {
    message: 'This artwork does not belong to the specified contest.',
    status: 400,
  },
  ALREADY_VOTED: {
    message: 'You have already voted in this contest.',
    status: 409,
  },
}
