// app/api/vote/route.ts
// POST /api/vote
//
// Request body: { artwork_id: string (UUID), contest_id: string (UUID) }
//
// Success 200: { success: true, voteCount: number, remaining: number }
// Error 400:   { error: string }  -- bad input or contest state
// Error 409:   { error: string }  -- already voted
// Error 429:   { error: string, resetAt: string } -- rate limited
// Error 500:   { error: string }  -- unexpected server error
//
// Defence layers (in order):
//   1. JSON parse + Zod validation          -- rejects malformed input early
//   2. Upstash rate limit (per IP + contest) -- prevents vote flooding
//   3. Supabase: contest is active + not expired
//   4. Supabase: artwork belongs to contest
//   5. Supabase: user/IP has not already voted
//   6. Insert vote + update denormalized count via DB trigger
//   7. Return updated vote count

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody, voteSchema } from '@/lib/validators'
import {
  voteRateLimit,
  getClientIP,
  getVoteRateLimitKey,
  formatResetTime,
} from '@/lib/ratelimit'
import { hashIP, safeErrorResponse, VOTE_ERRORS } from '@/lib/security'

export async function POST(request: NextRequest) {
  // ============================================================
  // STEP 1: Parse + validate request body with Zod
  // Do this first - cheapest check, no DB or network calls needed
  // ============================================================
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400 }
    )
  }

  const validation = validateBody(voteSchema, body)

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    )
  }

  const { artwork_id, contest_id } = validation.data

  // ============================================================
  // STEP 2: Rate limiting
  // Checked before any DB work - if the IP is over limit we fail fast.
  // Key is scoped to ip + contest so a user gets one vote per contest,
  // not one vote globally across all contests.
  // ============================================================
  const clientIP = getClientIP(request)
  const rateLimitKey = getVoteRateLimitKey(clientIP, contest_id)

  let rateLimitResult: { success: boolean; limit: number; remaining: number; reset: number }

  try {
    rateLimitResult = await voteRateLimit.limit(rateLimitKey)
  } catch (err) {
    // If Upstash is unreachable do NOT silently allow the vote through.
    // Better to show an error than to allow unlimited votes.
    console.error('[Vote API] Rate limit check failed:', err)
    return NextResponse.json(
      { error: 'Vote service temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: `You can only vote once per 24 hours. Try again in ${formatResetTime(rateLimitResult.reset)}.`,
        resetAt: new Date(rateLimitResult.reset).toISOString(),
        limit: rateLimitResult.limit,
        remaining: 0,
      },
      { status: 429 }
    )
  }

  // ============================================================
  // STEP 3: Hash the client IP for privacy-preserving deduplication
  // We store the hash, never the raw IP address
  // ============================================================
  const ipHash = hashIP(clientIP)

  // ============================================================
  // STEP 4: Supabase checks
  // All three validations (contest, artwork, duplicate vote)
  // are done in a single RPC call to minimise round trips
  // ============================================================
  const supabase = await createClient()

  // Get authenticated user if present (optional - anonymous voting is allowed)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: validationResult, error: rpcError } = await supabase.rpc(
    'validate_vote_request',
    {
      p_artwork_id: artwork_id,
      p_contest_id: contest_id,
      p_user_id: user?.id ?? null,
      p_ip_hash: ipHash,
    }
  )

  if (rpcError) {
    console.error('[Vote API] validate_vote_request RPC error:', rpcError)
    return NextResponse.json(
      { error: 'Failed to validate vote. Please try again.' },
      { status: 500 }
    )
  }

  // RPC returns a single row
  const result = Array.isArray(validationResult)
    ? validationResult[0]
    : validationResult

  if (!result?.valid) {
    const errorCode = result?.error_code as string | undefined
    const knownError = errorCode ? VOTE_ERRORS[errorCode] : undefined

    return NextResponse.json(
      { error: knownError?.message ?? 'Invalid vote request.' },
      { status: knownError?.status ?? 400 }
    )
  }

  // ============================================================
  // STEP 5: Insert the vote
  // Validation is complete - now commit the vote to the database.
  // The DB trigger will automatically increment artwork.vote_count.
  // A unique constraint on (contest_id, ip_hash) / (contest_id, user_id)
  // provides a final race-condition guard.
  // ============================================================
  const { error: insertError } = await supabase.from('votes').insert({
    artwork_id,
    contest_id,
    user_id: user?.id ?? null,
    ip_hash: ipHash,
    user_agent: request.headers.get('user-agent') ?? null,
  })

  if (insertError) {
    // Unique constraint violation - race condition or double submit
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'You have already voted in this contest.' },
        { status: 409 }
      )
    }

    console.error('[Vote API] Vote insert error:', insertError)
    return NextResponse.json(
      { error: 'Failed to submit vote. Please try again.' },
      { status: 500 }
    )
  }

  // ============================================================
  // STEP 6: Return success
  // Return the updated vote count (pre-validated count + 1).
  // The DB trigger keeps artwork.vote_count accurate, but we return
  // the optimistic count immediately so the client does not need
  // to refetch to update the display.
  // ============================================================
  return NextResponse.json({
    success: true,
    voteCount: (result.current_vote_count ?? 0) + 1,
    remaining: rateLimitResult.remaining,
  })
}

// ============================================================
// Block all other HTTP methods on this route
// ============================================================
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
