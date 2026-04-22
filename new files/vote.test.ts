// __tests__/api/vote.test.ts
// Unit tests for POST /api/vote
//
// Strategy: mock every external dependency (Supabase, Upstash, crypto)
// so each test is pure logic — no network calls, no DB, deterministic.
//
// Run: npx jest __tests__/api/vote.test.ts
// Run with coverage: npx jest --coverage

import { NextRequest } from 'next/server'

// ============================================================
// MOCKS — declared before imports so Jest hoists them correctly
// ============================================================

// Mock Upstash rate limiter
const mockRateLimit = jest.fn()
jest.mock('@/lib/ratelimit', () => ({
  voteRateLimit: { limit: mockRateLimit },
  getClientIP: jest.fn(() => '192.168.1.1'),
  getVoteRateLimitKey: jest.fn((ip: string, contestId: string) => `${ip}:${contestId}`),
  formatResetTime: jest.fn(() => '23 hours'),
}))

// Mock Supabase — returns a chainable builder that we override per test
const mockRpc = jest.fn()
const mockInsert = jest.fn()
const mockGetUser = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
    from: jest.fn(() => ({ insert: mockInsert })),
  })),
}))

// Mock security utils — hashIP is deterministic in tests
jest.mock('@/lib/security', () => ({
  hashIP: jest.fn(() => 'hashed_ip_abc123'),
  safeErrorResponse: jest.fn((err: unknown, status: number, msg: string) => {
    const { NextResponse } = require('next/server')
    return NextResponse.json({ error: msg }, { status })
  }),
  VOTE_ERRORS: {
    CONTEST_NOT_FOUND: { message: 'Contest not found.', status: 404 },
    CONTEST_NOT_ACTIVE: { message: 'This contest is not currently accepting votes.', status: 400 },
    CONTEST_ENDED: { message: 'This contest has ended.', status: 400 },
    ARTWORK_NOT_FOUND: { message: 'Artwork not found.', status: 404 },
    ARTWORK_WRONG_CONTEST: { message: 'This artwork does not belong to the specified contest.', status: 400 },
    ALREADY_VOTED: { message: 'You have already voted in this contest.', status: 409 },
  },
}))

// Import the route handler AFTER mocks are set up
import { POST, GET } from '@/app/api/vote/route'

// ============================================================
// TEST HELPERS
// ============================================================

const VALID_ARTWORK_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const VALID_CONTEST_ID = 'c0ntest1-e5f6-7890-abcd-ef1234567890'

function makeRequest(body: unknown, ip = '192.168.1.1'): NextRequest {
  return new NextRequest('http://localhost:3000/api/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  })
}

function mockRateLimitSuccess(remaining = 0) {
  mockRateLimit.mockResolvedValue({
    success: true,
    limit: 1,
    remaining,
    reset: Date.now() + 86400000,
  })
}

function mockRateLimitExceeded() {
  mockRateLimit.mockResolvedValue({
    success: false,
    limit: 1,
    remaining: 0,
    reset: Date.now() + 82800000, // 23 hours from now
  })
}

function mockRpcValidation(overrides: Partial<{
  valid: boolean
  error_code: string | null
  current_vote_count: number
}> = {}) {
  const defaults = { valid: true, error_code: null, current_vote_count: 42 }
  mockRpc.mockResolvedValue({
    data: [{ ...defaults, ...overrides }],
    error: null,
  })
}

function mockInsertSuccess() {
  mockInsert.mockResolvedValue({ error: null })
}

function mockAnonymousUser() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
}

function mockAuthenticatedUser(id = 'user-uuid-123') {
  mockGetUser.mockResolvedValue({ data: { user: { id } }, error: null })
}

// ============================================================
// TESTS
// ============================================================

describe('POST /api/vote', () => {

  // ----------------------------------------------------------
  // BLOCK 1: Input validation (Zod)
  // ----------------------------------------------------------
  describe('Input Validation', () => {
    beforeEach(() => {
      mockAnonymousUser()
      mockRateLimitSuccess()
    })

    it('rejects a request with no body', async () => {
      const req = new NextRequest('http://localhost:3000/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json{{{',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('JSON')
    })

    it('rejects a request missing artwork_id', async () => {
      const req = makeRequest({ contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBeDefined()
    })

    it('rejects a request missing contest_id', async () => {
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('rejects non-UUID artwork_id', async () => {
      const req = makeRequest({ artwork_id: 'not-a-uuid', contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('UUID')
    })

    it('rejects non-UUID contest_id', async () => {
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: 'bad-id' })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('rejects extra fields gracefully (Zod strips them)', async () => {
      // Zod strips unknown keys — valid UUIDs should still pass
      mockRpcValidation()
      mockInsertSuccess()
      const req = makeRequest({
        artwork_id: VALID_ARTWORK_ID,
        contest_id: VALID_CONTEST_ID,
        malicious_field: 'DROP TABLE votes;',
      })
      const res = await POST(req)
      // Should reach the rate limiter, not fail at validation
      expect(res.status).not.toBe(400)
    })
  })

  // ----------------------------------------------------------
  // BLOCK 2: Rate limiting
  // ----------------------------------------------------------
  describe('Rate Limiting', () => {
    beforeEach(() => {
      mockAnonymousUser()
    })

    it('returns 429 when rate limit is exceeded', async () => {
      mockRateLimitExceeded()
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(429)
      const body = await res.json()
      expect(body.error).toContain('vote once')
      expect(body.resetAt).toBeDefined()
      expect(body.remaining).toBe(0)
    })

    it('returns 503 when Upstash is unreachable', async () => {
      mockRateLimit.mockRejectedValue(new Error('Connection refused'))
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      // Must NOT silently allow the vote through when limiter is down
      expect(res.status).toBe(503)
    })

    it('does NOT call the DB when rate limit is exceeded', async () => {
      mockRateLimitExceeded()
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      await POST(req)
      // RPC should never be called — rate limit check happens first
      expect(mockRpc).not.toHaveBeenCalled()
    })
  })

  // ----------------------------------------------------------
  // BLOCK 3: Business logic validation (via RPC)
  // ----------------------------------------------------------
  describe('Business Logic Validation', () => {
    beforeEach(() => {
      mockAnonymousUser()
      mockRateLimitSuccess()
    })

    it('returns 404 when contest does not exist', async () => {
      mockRpcValidation({ valid: false, error_code: 'CONTEST_NOT_FOUND' })
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toBe('Contest not found.')
    })

    it('returns 400 when contest is not active', async () => {
      mockRpcValidation({ valid: false, error_code: 'CONTEST_NOT_ACTIVE' })
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect((await res.json()).error).toContain('not currently accepting')
    })

    it('returns 400 when contest has ended', async () => {
      mockRpcValidation({ valid: false, error_code: 'CONTEST_ENDED' })
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 404 when artwork does not exist', async () => {
      mockRpcValidation({ valid: false, error_code: 'ARTWORK_NOT_FOUND' })
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(404)
    })

    it('returns 400 when artwork belongs to a different contest', async () => {
      mockRpcValidation({ valid: false, error_code: 'ARTWORK_WRONG_CONTEST' })
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 409 when user has already voted', async () => {
      mockRpcValidation({ valid: false, error_code: 'ALREADY_VOTED' })
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(409)
      expect((await res.json()).error).toContain('already voted')
    })

    it('returns 500 when the RPC itself errors', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } })
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(500)
    })
  })

  // ----------------------------------------------------------
  // BLOCK 4: Successful vote
  // ----------------------------------------------------------
  describe('Successful Vote', () => {
    beforeEach(() => {
      mockRateLimitSuccess()
      mockRpcValidation({ valid: true, current_vote_count: 10 })
      mockInsertSuccess()
    })

    it('returns 200 with updated vote count for anonymous user', async () => {
      mockAnonymousUser()
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      // count from RPC (10) + 1
      expect(body.voteCount).toBe(11)
    })

    it('returns 200 with updated vote count for authenticated user', async () => {
      mockAuthenticatedUser('user-uuid-456')
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.voteCount).toBe(11)
    })

    it('calls the DB insert with correct fields', async () => {
      mockAnonymousUser()
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      await POST(req)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          artwork_id: VALID_ARTWORK_ID,
          contest_id: VALID_CONTEST_ID,
          user_id: null,             // anonymous
          ip_hash: 'hashed_ip_abc123',
        })
      )
    })

    it('includes user_id in insert when authenticated', async () => {
      mockAuthenticatedUser('user-uuid-789')
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      await POST(req)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-uuid-789' })
      )
    })
  })

  // ----------------------------------------------------------
  // BLOCK 5: DB insert failure + race conditions
  // ----------------------------------------------------------
  describe('Insert Failures', () => {
    beforeEach(() => {
      mockAnonymousUser()
      mockRateLimitSuccess()
      mockRpcValidation()
    })

    it('returns 409 on unique constraint violation (race condition)', async () => {
      mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(409)
      expect((await res.json()).error).toContain('already voted')
    })

    it('returns 500 on unexpected DB insert error', async () => {
      mockInsert.mockResolvedValue({ error: { code: '42P01', message: 'relation not found' } })
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(500)
    })

    it('returns 500 on network exception during insert', async () => {
      mockInsert.mockRejectedValue(new Error('ECONNRESET'))
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      const res = await POST(req)
      expect(res.status).toBe(500)
    })
  })

  // ----------------------------------------------------------
  // BLOCK 6: Security properties
  // ----------------------------------------------------------
  describe('Security', () => {
    it('hashes the IP before passing it to the RPC', async () => {
      mockAnonymousUser()
      mockRateLimitSuccess()
      mockRpcValidation()
      mockInsertSuccess()
      const { hashIP } = require('@/lib/security')
      const req = makeRequest({ artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID })
      await POST(req)
      expect(hashIP).toHaveBeenCalledWith('192.168.1.1')
      // The hashed value (not the raw IP) should be passed to the RPC
      expect(mockRpc).toHaveBeenCalledWith(
        'validate_vote_request',
        expect.objectContaining({ p_ip_hash: 'hashed_ip_abc123' })
      )
    })

    it('never passes the raw IP to the DB', async () => {
      mockAnonymousUser()
      mockRateLimitSuccess()
      mockRpcValidation()
      mockInsertSuccess()
      const req = makeRequest(
        { artwork_id: VALID_ARTWORK_ID, contest_id: VALID_CONTEST_ID },
        '10.0.0.1'
      )
      await POST(req)
      // ip_hash in the insert should be the mock hash, not the raw IP
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ ip_hash: 'hashed_ip_abc123' })
      )
      expect(mockInsert).not.toHaveBeenCalledWith(
        expect.objectContaining({ ip_hash: '10.0.0.1' })
      )
    })

    it('does not call the RPC when Zod validation fails', async () => {
      mockAnonymousUser()
      mockRateLimitSuccess()
      const req = makeRequest({ artwork_id: 'not-a-uuid', contest_id: VALID_CONTEST_ID })
      await POST(req)
      expect(mockRpc).not.toHaveBeenCalled()
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  // ----------------------------------------------------------
  // BLOCK 7: GET method blocked
  // ----------------------------------------------------------
  describe('Method restrictions', () => {
    it('GET returns 405 Method Not Allowed', async () => {
      const res = await GET()
      expect(res.status).toBe(405)
    })
  })
})

// ============================================================
// HELPER UNIT TESTS
// Test the pure utility functions in isolation
// ============================================================

describe('lib/ratelimit helpers', () => {
  // Reimport without mocks for these pure-function tests
  beforeEach(() => {
    jest.resetModules()
  })

  it('getVoteRateLimitKey scopes the key to ip + contestId', () => {
    // Unmock for this specific test
    jest.unmock('@/lib/ratelimit')
    const { getVoteRateLimitKey } = require('@/lib/ratelimit')
    const key = getVoteRateLimitKey('1.2.3.4', 'contest-abc')
    expect(key).toBe('1.2.3.4:contest-abc')
  })
})

describe('lib/validators', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.unmock('@/lib/validators')
  })

  const { validateBody, voteSchema } = require('@/lib/validators')

  it('accepts valid UUIDs', () => {
    const result = validateBody(voteSchema, {
      artwork_id: VALID_ARTWORK_ID,
      contest_id: VALID_CONTEST_ID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing fields', () => {
    const result = validateBody(voteSchema, { artwork_id: VALID_ARTWORK_ID })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID strings', () => {
    const result = validateBody(voteSchema, {
      artwork_id: 'bad',
      contest_id: 'bad',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('UUID')
    }
  })
})
