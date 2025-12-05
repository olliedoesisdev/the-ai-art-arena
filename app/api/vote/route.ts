// app/api/vote/route.ts
// API endpoint that handles vote submissions for contests.
// This runs on the server and has full access to the database.

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  voteRateLimit,
  getClientIP,
  getVoteRateLimitKey,
} from '@/lib/security/ratelimit'
import crypto from 'crypto'

/**
 * POST /api/vote
 *
 * Handles vote submission for a contest artwork.
 *
 * Request body:
 * {
 *   artwork_id: string (UUID)
 *   contest_id: string (UUID)
 * }
 *
 * Response:
 * Success: { success: true, voteCount: number }
 * Error: { error: string }
 *
 * This endpoint demonstrates several important patterns:
 * 1. Rate limiting to prevent vote manipulation
 * 2. Input validation to prevent malformed requests
 * 3. IP address hashing for privacy-preserving anonymous voting
 * 4. Database constraints to prevent duplicate votes
 * 5. Proper error handling with appropriate HTTP status codes
 * 6. Returning updated vote counts for optimistic UI updates
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body from the request
    // If the body is not valid JSON, this will throw and we catch it below
    const body = await request.json()
    const { artwork_id, contest_id } = body

    // Validate that required fields are present
    // We check for truthiness rather than just existence to catch empty strings
    if (!artwork_id || !contest_id) {
      return NextResponse.json(
        { error: 'Missing required fields: artwork_id and contest_id' },
        { status: 400 } // 400 Bad Request
      )
    }

    // Validate that the IDs are valid UUIDs
    // This prevents SQL injection attempts and malformed data
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(artwork_id) || !uuidRegex.test(contest_id)) {
      return NextResponse.json(
        { error: 'Invalid UUID format for artwork_id or contest_id' },
        { status: 400 }
      )
    }

    // Get the client IP address using our helper function
    const clientIP = getClientIP(request)

    // ========================================
    // RATE LIMITING - Check BEFORE any DB operations
    // ========================================
    // This prevents database abuse even if the vote would ultimately fail
    const rateLimitKey = getVoteRateLimitKey(clientIP, contest_id)
    const { success, limit, remaining, reset } = await voteRateLimit.limit(
      rateLimitKey
    )

    if (!success) {
      const resetDate = new Date(reset)
      const hoursUntilReset = Math.ceil((reset - Date.now()) / (1000 * 60 * 60))

      return NextResponse.json(
        {
          error: `You can only vote once per 24 hours. Try again in ${hoursUntilReset} hour${
            hoursUntilReset !== 1 ? 's' : ''
          }.`,
          resetAt: resetDate.toISOString(),
          limit,
          remaining: 0,
        },
        { status: 429 } // 429 Too Many Requests
      )
    }

    // Hash the IP address for privacy
    // We never store raw IPs because that would be identifying personal information
    // The hash is one-way: you can verify an IP matches a hash, but you cannot
    // reverse the hash to get the IP back
    const ipHash = crypto
      .createHash('sha256')
      .update(
        clientIP +
          (process.env.IP_HASH_SALT || 'default-salt-change-in-production')
      )
      .digest('hex')
      .slice(0, 32)

    // Create a Supabase client with server-side configuration
    const supabase = await createClient()

    // Get the current user if they are authenticated
    // This allows us to associate votes with user accounts for authenticated users
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if this user or IP has already voted on this contest
    // We use the database function we created earlier
    const { data: hasVoted } = await supabase.rpc('has_user_voted', {
      p_contest_id: contest_id,
      p_user_id: user?.id || null,
      p_ip_hash: ipHash,
    })

    // If they have already voted, reject the request
    if (hasVoted) {
      return NextResponse.json(
        { error: 'You have already voted on this contest' },
        { status: 409 } // 409 Conflict
      )
    }

    // Verify the contest is still active and accepting votes
    const { data: contest } = await supabase
      .from('contests')
      .select('status, end_date')
      .eq('id', contest_id)
      .single()

    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    if (contest.status !== 'active') {
      return NextResponse.json(
        { error: 'This contest is not currently accepting votes' },
        { status: 400 }
      )
    }

    // Check if the contest has ended
    if (new Date(contest.end_date) < new Date()) {
      return NextResponse.json(
        { error: 'This contest has ended' },
        { status: 400 }
      )
    }

    // Verify the artwork belongs to this contest
    const { data: artwork } = await supabase
      .from('artworks')
      .select('contest_id')
      .eq('id', artwork_id)
      .single()

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
    }

    if (artwork.contest_id !== contest_id) {
      return NextResponse.json(
        { error: 'Artwork does not belong to this contest' },
        { status: 400 }
      )
    }

    // All validation passed - insert the vote
    const { error: voteError } = await supabase.from('votes').insert({
      artwork_id,
      contest_id,
      user_id: user?.id || null,
      ip_hash: ipHash,
      user_agent: request.headers.get('user-agent') || null,
    })

    // Handle database errors
    // The unique constraint on (user_id, contest_id) or (ip_hash, contest_id)
    // will catch race conditions where someone tries to vote twice simultaneously
    if (voteError) {
      console.error('Vote insertion error:', voteError)

      // Check if it is a unique constraint violation (code 23505)
      if (voteError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already voted on this contest' },
          { status: 409 }
        )
      }

      // For other database errors, return a generic message
      // We do not expose database error details to users for security
      return NextResponse.json(
        { error: 'Failed to submit vote. Please try again.' },
        { status: 500 }
      )
    }

    // Vote successfully inserted! The database trigger automatically updated
    // the vote_count on the artwork. Let us fetch the new count to return it.
    const { data: updatedArtwork } = await supabase
      .from('artworks')
      .select('vote_count')
      .eq('id', artwork_id)
      .single()

    // Return success response with the updated vote count
    return NextResponse.json({
      success: true,
      voteCount: updatedArtwork?.vote_count || 0,
      remaining: remaining - 1, // How many votes they have left (should be 0)
    })
  } catch (error) {
    // Catch any unexpected errors (JSON parsing, network issues, etc.)
    console.error('Unexpected error in vote API:', error)

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
