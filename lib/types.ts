// lib/types.ts
// Centralized type definitions for the AI Art Arena application
// These types represent the database schema and application data structures

// ==========================================
// DATABASE TYPES
// ==========================================

/**
 * Contest represents a weekly voting competition
 */
export type Contest = {
  id: string
  week_number: number
  title: string
  description: string | null
  start_date: string // ISO 8601 datetime
  end_date: string // ISO 8601 datetime
  status: 'upcoming' | 'active' | 'archived'
  created_at: string
  updated_at: string
}

/**
 * Artwork represents a single AI-generated artwork in a contest
 */
export type Artwork = {
  id: string
  contest_id: string
  image_url: string
  title: string
  prompt: string | null
  vote_count: number
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * Vote represents a single user vote for an artwork
 */
export type Vote = {
  id: string
  artwork_id: string
  contest_id: string
  user_id: string | null // null for anonymous votes
  ip_hash: string
  user_agent: string | null
  created_at: string
}

// ==========================================
// DATABASE QUERY RESULT TYPES
// ==========================================

/**
 * Result type for get_contest_by_week RPC function
 */
export type ContestByWeekRow = {
  contest_id: string
  contest_week_number: number
  contest_title: string
  contest_description: string | null
  contest_start_date: string
  contest_end_date: string
  contest_status: string
  artwork_id: string | null
  artwork_image_url: string | null
  artwork_title: string | null
  artwork_prompt: string | null
  artwork_vote_count: number | null
  artwork_display_order: number | null
}

/**
 * Result type for get_archived_contests RPC function
 */
export type ArchivedContestRow = {
  contest_id: string
  contest_week_number: number
  contest_title: string
  contest_description: string | null
  contest_start_date: string
  contest_end_date: string
  total_votes: number
  artwork_count: number
  winner_artwork_id: string | null
  winner_artwork_title: string | null
  winner_artwork_image_url: string | null
  winner_vote_count: number | null
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

/**
 * Contest with its artworks (for contest page)
 */
export type ContestWithArtworks = Contest & {
  artworks: Artwork[]
}

/**
 * Archived contest summary (for archive listing)
 */
export type ArchivedContestSummary = ArchivedContestRow

/**
 * Artwork with ranking (for leaderboard)
 */
export type ArtworkWithRank = Artwork & {
  rank: number
  percentage: number // percentage of total votes
}

// ==========================================
// COMPONENT PROP TYPES
// ==========================================

/**
 * Artwork data for VotingInterface component
 * Uses camelCase for React/TypeScript conventions
 */
export type VotingArtwork = {
  id: string
  imageUrl: string
  title: string
  prompt: string | null
  voteCount: number
  displayOrder: number
}

/**
 * Contest header data
 */
export type ContestHeaderData = {
  title: string
  description: string | null
  weekNumber: number
  endDate: string
}

// ==========================================
// API REQUEST/RESPONSE TYPES
// ==========================================

/**
 * Vote API response
 */
export type VoteResponse =
  | {
      success: true
      voteCount: number
      remaining: number
    }
  | {
      error: string
      resetAt?: string
      limit?: number
      remaining?: number
    }

/**
 * Contest creation response
 */
export type CreateContestResponse =
  | {
      success: true
      contest: {
        id: string
        week_number: number
      }
    }
  | {
      error: string
    }

/**
 * Image upload response
 */
export type ImageUploadResponse =
  | {
      success: true
      url: string
      path: string
    }
  | {
      error: string
    }

// ==========================================
// UTILITY TYPES
// ==========================================

/**
 * Database insert type (excludes auto-generated fields)
 */
export type InsertContest = Omit<
  Contest,
  'id' | 'created_at' | 'updated_at'
>

export type InsertArtwork = Omit<
  Artwork,
  'id' | 'vote_count' | 'created_at' | 'updated_at'
>

export type InsertVote = Omit<Vote, 'id' | 'created_at'>

/**
 * Database update type (all fields optional except id)
 */
export type UpdateContest = Partial<Omit<Contest, 'id' | 'created_at'>> & {
  id: string
}

export type UpdateArtwork = Partial<Omit<Artwork, 'id' | 'created_at'>> & {
  id: string
}
