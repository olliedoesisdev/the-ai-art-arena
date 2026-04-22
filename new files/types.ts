// lib/types.ts
// Shared TypeScript types for AI Art Arena
// Used across server components, client components, and API routes

export interface Artwork {
  id: string
  contest_id: string
  image_url: string
  title: string
  artist_prompt?: string
  vote_count: number
  created_at: string
}

export interface Contest {
  id: string
  week_number: number
  start_date: string
  end_date: string
  status: 'active' | 'archived' | 'upcoming'
  artworks: Artwork[]
  created_at: string
}

export interface Vote {
  id: string
  artwork_id: string
  contest_id: string
  user_id?: string
  ip_hash: string
  created_at: string
}

// API response types
export interface VoteResponse {
  success: boolean
  voteCount: number
  remaining: number
}

export interface VoteError {
  error: string
  resetAt?: string
  limit?: number
  remaining?: number
}

// Component prop types
export interface ArtworkCardProps {
  artwork: Artwork
  rank?: number
  isWinner?: boolean
  showVoteCount?: boolean
}

export interface VotingInterfaceProps {
  artworks: Artwork[]
  contestId: string
  initialVotedArtworkId?: string | null
}

export interface ContestHeaderProps {
  weekNumber: number
  endDate: string
  status: Contest['status']
  totalVotes: number
}
